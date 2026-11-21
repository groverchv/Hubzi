import hashlib
import logging
import secrets
from datetime import datetime, timezone

import pyotp
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field

from app.core.account_security import (
    captcha_required,
    check_password_breached,
    is_account_locked,
    record_attempt_failure,
    record_login_failure,
    reset_attempt_failures,
    reset_login_failures,
    verify_turnstile,
)
from app.core.age_bands import band_for_age, needs_parental_consent
from app.core.audit import (
    EVT_ACCOUNT_LOCKED,
    EVT_GUEST_MIGRATED,
    EVT_LOGIN_FAIL,
    EVT_LOGIN_OK,
    EVT_MFA_DISABLED,
    EVT_MFA_ENABLED,
    EVT_PASSWORD_CHANGED,
    EVT_REGISTER,
    EVT_SESSION_REVOKED,
    audit_event,
)
from app.core.config import settings
from app.core.crypto import decrypt_field, encrypt_field
from app.core.database import db_manager
from app.core.plans import trial_days_left
from app.core.rate_limit import limiter
from app.core.security import (
    AUTH_COOKIE_NAME,
    _resolve_user,
    clear_auth_cookie,
    consume_purpose_token,
    create_access_token,
    create_guest_token,
    create_purpose_token,
    decode_access_token,
    decode_purpose_token,
    get_current_user,
    get_current_user_unrestricted,
    get_optional_user_unrestricted,
    hash_password,
    is_legacy_password_hash,
    list_user_sessions,
    register_session,
    revoke_all_user_sessions,
    revoke_user_session,
    set_auth_cookie,
    utcnow_iso,
    verify_password,
)
from app.core.session_store import in_memory_auth_users
from app.models.user import (
    AuthResponse,
    UserAuthLoginRequest,
    UserAuthRegisterRequest,
    UserProfileResponse,
)
from app.services import email_service

logger = logging.getLogger("hubzy.auth")
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

_DUMMY_PASSWORD_HASH: str | None = None


def _dummy_hash() -> str:
    """Hash bcrypt de relleno: igualar el costo de verificación cuando la
    cuenta no existe evita distinguirla por tiempo de respuesta."""
    global _DUMMY_PASSWORD_HASH
    if _DUMMY_PASSWORD_HASH is None:
        _DUMMY_PASSWORD_HASH = hash_password("timing-equalizer-dummy")
    return _DUMMY_PASSWORD_HASH


@router.post("/guest")
@limiter.limit("10/minute")
async def auth_guest(request: Request, response: Response):
    """Identidad de invitado opaca por dispositivo (cookie HttpOnly).

    Idempotente: si la cookie ya lleva un token válido (cuenta o invitado)
    NO se rota — el cliente la invoca en cada arranque sin efectos."""
    existing = request.cookies.get(AUTH_COOKIE_NAME)
    if existing:
        payload = decode_access_token(existing)
        if payload and payload.get("type") in ("access", "guest"):
            return {"status": "ok", "reused": True}

    token, guest_id = create_guest_token()
    set_auth_cookie(
        response, token, settings.GUEST_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    return {"status": "ok", "guest_id": guest_id}


async def _migrate_guest_folders(guest_id: str, new_user_id: str) -> None:
    """Al registrarse/iniciar sesión con una identidad de invitado, sus
    carpetas pasan a la cuenta — el trabajo hecho como invitado no se pierde.
    Quita además expires_at: la carpeta ya pertenece a una cuenta, no aplica
    la purga de retención de invitados."""
    if not guest_id.startswith("g_"):
        return
    try:
        if db_manager.db is not None:
            await db_manager.db["study_folders"].update_many(
                {"user_id": guest_id},
                {"$set": {"user_id": new_user_id}, "$unset": {"expires_at": ""}},
            )
        else:
            from app.core.session_store import in_memory_study_folders

            for f in in_memory_study_folders.values():
                if f.get("user_id") == guest_id:
                    f["user_id"] = new_user_id
                    f.pop("expires_at", None)
        await audit_event(EVT_GUEST_MIGRATED, actor_id=new_user_id)
    except Exception as e:
        logger.warning(f"No se pudieron migrar carpetas de invitado {guest_id[:8]}…: {e}")


def assign_voice_gender(gender: str, voice_preference: str | None = None) -> str:
    """Regla de voz complementaria de Hubzi: hombre→voz femenina, mujer→voz masculina."""
    if voice_preference and voice_preference in ("female", "male"):
        return voice_preference
    norm = (gender or "").strip().lower()
    if norm in ("masculino", "hombre", "varon"):
        return "female"
    if norm in ("femenino", "mujer", "dama"):
        return "male"
    return "female"


def _to_profile(user_id: str, doc: dict) -> UserProfileResponse:
    age = doc.get("age") or 20  # legacy docs con age=None no rompen el perfil
    plan = doc.get("plan", "free")
    return UserProfileResponse(
        id=user_id,
        email=doc.get("email"),
        username=doc.get("username", "Estudiante"),
        gender=doc.get("gender", "masculino"),
        age=age,
        age_band=doc.get("age_band") or band_for_age(age),
        avatar=doc.get("avatar", "capy_fan"),
        voice_preference=doc.get("voice_preference", "auto"),
        assigned_voice_gender=doc.get("assigned_voice_gender", "female"),
        created_at=str(doc.get("created_at", "")),
        plan=plan,
        pro_since=doc.get("pro_since"),
        must_change_password=bool(doc.get("must_change_password")),
        email_verified=bool(doc.get("email_verified")),
        mfa_enabled=bool(doc.get("mfa_enabled")),
        ai_training_consent=bool(doc.get("ai_training_consent")),
        role=doc.get("role") or "individual",
        institution_id=doc.get("institution_id"),
        grade_ids=doc.get("grade_ids"),
        trial_days_left=(
            trial_days_left(str(doc.get("created_at", "")))
            if plan == "free"
            else None
        ),
    )


@router.post("/register", response_model=AuthResponse)
@limiter.limit("10/minute")
async def auth_register(
    request: Request,
    response: Response,
    payload: UserAuthRegisterRequest,
    current_user: dict | None = Depends(get_optional_user_unrestricted),
):
    """
    Registra una nueva cuenta con correo, contraseña (bcrypt), nombre, sexo y edad.
    Devuelve un JWT de acceso (también en cookie HttpOnly para el frontend web).
    """
    clean_email = payload.email.strip().lower()
    clean_username = payload.username.strip()
    norm_gender = payload.gender.strip().lower()

    if not clean_email or "@" not in clean_email:
        raise HTTPException(
            status_code=400, detail="Por favor ingresa un correo electrónico válido."
        )

    age_band = band_for_age(payload.age)
    if needs_parental_consent(age_band) and not payload.parental_consent:
        raise HTTPException(
            status_code=400,
            detail="Las cuentas de menores de 11 años requieren el consentimiento de un padre, madre o tutor.",
        )

    # Contraseñas vistas en filtraciones públicas quedan rechazadas
    # (HIBP k-anonymity — la contraseña completa nunca sale del servidor).
    if await check_password_breached(payload.password):
        raise HTTPException(
            status_code=400,
            detail="Esa contraseña apareció en filtraciones de datos. Elige otra distinta.",
        )

    assigned_voice = assign_voice_gender(norm_gender, payload.voice_preference)
    pwd_hash = hash_password(payload.password)

    user_doc = {
        "email": clean_email,
        "password_hash": pwd_hash,
        "username": clean_username,
        "gender": norm_gender,
        "age": payload.age,
        "age_band": age_band,
        "parental_consent": bool(payload.parental_consent)
        if needs_parental_consent(age_band)
        else None,
        "consented_at": utcnow_iso() if payload.parental_consent else None,
        "avatar": payload.avatar or "capy_fan",
        "voice_preference": payload.voice_preference or "auto",
        "assigned_voice_gender": assigned_voice,
        "plan": "free",
        "email_verified": False,
        "created_at": utcnow_iso(),
    }

    user_id = None
    if db_manager.db is not None:
        from pymongo.errors import DuplicateKeyError

        try:
            existing = await db_manager.db["users"].find_one({"email": clean_email})
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail="Ya existe una cuenta registrada con este correo electrónico.",
                )
            res = await db_manager.db["users"].insert_one(user_doc)
            user_id = str(res.inserted_id)
        except HTTPException:
            raise
        except DuplicateKeyError:
            # Race check-then-insert: el índice único de email es la última línea
            raise HTTPException(
                status_code=400,
                detail="Ya existe una cuenta registrada con este correo electrónico.",
            ) from None
        except Exception as e:
            logger.error(f"Error registrando en MongoDB: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servicio de base de datos no disponible. Intenta de nuevo.",
            ) from e

    if user_id is None:
        if clean_email in in_memory_auth_users:
            raise HTTPException(
                status_code=400,
                detail="Ya existe una cuenta registrada con este correo electrónico.",
            )
        user_id = f"user_{hashlib.md5(clean_email.encode()).hexdigest()[:10]}"
        in_memory_auth_users[clean_email] = {**user_doc, "id": user_id}

    token, jti = create_access_token(user_id, clean_email)
    set_auth_cookie(response, token, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    await register_session(user_id, jti, request)

    # Si venía de una identidad de invitado, sus carpetas pasan a la cuenta
    if current_user and current_user.get("is_guest"):
        await _migrate_guest_folders(str(current_user["id"]), user_id)

    # Email de verificación (fire-and-forget: nunca bloquea el registro)
    verify_token = create_purpose_token(user_id, clean_email, "verify_email", 60 * 24)
    await email_service.send_verification_email(clean_email, clean_username, verify_token)
    await audit_event(EVT_REGISTER, request=request, actor_id=user_id)
    return AuthResponse(token=token, user=_to_profile(user_id, user_doc))


async def _finish_login(
    request: Request,
    response: Response,
    *,
    user_data: dict | None,
    user_id: str | None,
    email: str,
    password: str,
    captcha_token: str | None,
    user_from_mongo: bool,
    current_user: dict | None,
    preauthenticated: bool = False,
):
    """Flujo de login tras resolver la cuenta (por email o por
    institución+credencial): lockout, captcha, verificación, migración de
    hash legado, MFA, JWT+cookie, sesión, migración de invitado y audit.
    `preauthenticated=True` indica que la credencial ya autenticó (p. ej.
    código escolar único) — se omite la verificación de contraseña."""
    # Lockout por cuenta: defensa contra fuerza bruta distribuida (un botnet
    # rota IPs y esquiva el rate-limit por IP — el contador va en la cuenta).
    if user_data:
        locked, remaining = is_account_locked(user_data)
        if locked:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Cuenta bloqueada temporalmente por intentos fallidos. "
                    f"Intenta de nuevo en {max(1, remaining // 60)} min."
                ),
            )

    # Captcha tras N fallos para esa clave (cuente o no — así no delata
    # qué cuentas existen): frena el credential stuffing antes del lockout.
    if await captcha_required(email):
        ip = request.client.host if request.client else None
        if not await verify_turnstile(captcha_token, ip):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="captcha_required",
            )

    # Anti-enumeración: mismo mensaje y mismo costo bcrypt exista o no la
    # cuenta — distinguir "no existe" de "contraseña incorrecta" permitía
    # sondear qué cuentas están registradas.
    stored_hash = (user_data or {}).get("password_hash") or _dummy_hash()
    # Con credencial única la identidad ya quedó probada en el lookup; el costo
    # bcrypt del dummy se mantiene para igualar tiempos anti-enumeración.
    if preauthenticated:
        verify_password(_dummy_hash(), password or "")
        password_ok = user_data is not None
    else:
        password_ok = verify_password(stored_hash, password)
    if not user_data or not password_ok:
        await record_attempt_failure(email)
        await audit_event(EVT_LOGIN_FAIL, request=request, actor_id=user_id)
        if user_data:
            lock_secs = await record_login_failure(user_id, email)
            if lock_secs:
                await audit_event(
                    EVT_ACCOUNT_LOCKED, request=request, actor_id=user_id
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=(
                        f"Demasiados intentos fallidos. Cuenta bloqueada "
                        f"{max(1, lock_secs // 60)} min."
                    ),
                ) from None
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
        )

    await reset_login_failures(user_id, email)
    await reset_attempt_failures(email)
    await _update_user(user_id, email, {"last_login_at": utcnow_iso()})

    # Migración transparente: si el hash es sha256 legado, re-hashear con bcrypt
    if is_legacy_password_hash(stored_hash):
        try:
            new_hash = hash_password(password)
            if user_from_mongo and db_manager.db is not None:
                from bson import ObjectId

                await db_manager.db["users"].update_one(
                    {"_id": ObjectId(user_id)}, {"$set": {"password_hash": new_hash}}
                )
            elif email in in_memory_auth_users:
                in_memory_auth_users[email]["password_hash"] = new_hash
            logger.info(f"Hash de contraseña migrado a bcrypt para {email}")
        except Exception as e:
            logger.warning(f"No se pudo migrar hash legado: {e}")

    # MFA: segundo factor obligatorio — solo se emite un purpose-token de
    # 5 min; el access token llega tras /auth/mfa/verify.
    if user_data.get("mfa_enabled"):
        mfa_token = create_purpose_token(
            user_id, email, "mfa_challenge", expires_minutes=5
        )
        return {"mfa_required": True, "mfa_token": mfa_token}

    token, jti = create_access_token(
        user_id, email, int(user_data.get("token_version") or 0)
    )
    set_auth_cookie(response, token, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    await register_session(user_id, jti, request)
    if current_user and current_user.get("is_guest"):
        await _migrate_guest_folders(str(current_user["id"]), user_id)
    await audit_event(EVT_LOGIN_OK, request=request, actor_id=user_id)
    return AuthResponse(token=token, user=_to_profile(user_id, user_data))


@router.post("/login")
@limiter.limit("15/minute")
async def auth_login(
    request: Request,
    response: Response,
    payload: UserAuthLoginRequest,
    current_user: dict | None = Depends(get_optional_user_unrestricted),
):
    """Inicia sesión con correo y contraseña. Devuelve JWT + perfil (+ cookie
    HttpOnly), o {mfa_required, mfa_token} si la cuenta tiene MFA activo."""
    clean_email = payload.email.strip().lower()

    user_data = None
    user_id = None
    user_from_mongo = False

    if db_manager.db is not None:
        try:
            user_db = await db_manager.db["users"].find_one({"email": clean_email})
            if user_db:
                user_data = user_db
                user_id = str(user_db["_id"])
                user_from_mongo = True
        except Exception as e:
            logger.error(f"Error buscando usuario en MongoDB: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servicio de base de datos no disponible. Intenta de nuevo.",
            ) from e

    if not user_data and clean_email in in_memory_auth_users:
        user_data = in_memory_auth_users[clean_email]
        user_id = user_data.get("id")

    return await _finish_login(
        request,
        response,
        user_data=user_data,
        user_id=user_id,
        email=clean_email,
        password=payload.password,
        captcha_token=payload.captcha_token,
        user_from_mongo=user_from_mongo,
        current_user=current_user,
    )


class SchoolLoginRequest(BaseModel):
    institution_id: str = Field(min_length=1, max_length=64)
    credential: str = Field(min_length=4, max_length=32)
    captcha_token: str | None = None


@router.post("/school-login")
@limiter.limit("15/minute")
async def auth_school_login(
    request: Request,
    response: Response,
    payload: SchoolLoginRequest,
    current_user: dict | None = Depends(get_optional_user_unrestricted),
):
    """Login contextual por institución + credencial única (HUB-XXXXXXXX) —
    la credencial asignada por el colegio identifica y autentica a la vez.
    Misma seguridad que /login (delega en _finish_login)."""
    cred = payload.credential.strip().upper()
    user_data = None
    user_id = None
    user_from_mongo = False

    if db_manager.db is not None:
        try:
            user_db = await db_manager.db["users"].find_one(
                {
                    "institution_id": payload.institution_id,
                    "school_credential": cred,
                }
            )
            if user_db:
                user_data = user_db
                user_id = str(user_db["_id"])
                user_from_mongo = True
        except Exception as e:
            logger.error(f"Error buscando usuario en MongoDB: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servicio de base de datos no disponible. Intenta de nuevo.",
            ) from e
    else:
        for u in in_memory_auth_users.values():
            if (
                u.get("institution_id") == payload.institution_id
                and (u.get("school_credential") or "").upper() == cred
            ):
                user_data = u
                user_id = u.get("id")
                break

    # Clave anti-enumeración: email real si se resolvió; si no, compuesta
    # estable para que el rate-limit/lockout funcione igual.
    email_key = ((user_data or {}).get("email") or f"{cred.lower()}@inst-{payload.institution_id}").lower()

    return await _finish_login(
        request,
        response,
        user_data=user_data,
        user_id=user_id,
        email=email_key,
        password=cred,
        captcha_token=payload.captcha_token,
        user_from_mongo=user_from_mongo,
        current_user=current_user,
        preauthenticated=True,
    )


@router.get("/me", response_model=UserProfileResponse)
async def auth_get_current_user(request: Request, response: Response, current_user: dict = Depends(get_current_user_unrestricted)):
    """Retorna el perfil del usuario autenticado según su JWT.

    Renovación deslizante: si al token le queda menos de la mitad de vida se
    emite uno fresco en la cookie — sesión activa nunca expira, pero un token
    robado sigue muriendo a las 24 h."""
    payload = current_user.pop("_jwt_payload", None) or {}
    exp = payload.get("exp")
    if exp and (exp - datetime.now(timezone.utc).timestamp()) < (
        settings.ACCESS_TOKEN_EXPIRE_MINUTES * 30
    ):
        uid = str(current_user.get("id") or current_user.get("_id"))
        fresh, fresh_jti = create_access_token(
            uid,
            current_user.get("email"),
            int(current_user.get("token_version") or 0),
        )
        set_auth_cookie(response, fresh, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
        # El jti viejo muere al renovar — sin esto la lista "mis dispositivos"
        # se llenaría de sesiones fantasma ya expiradas.
        if payload.get("jti"):
            await revoke_user_session(uid, payload["jti"])
        await register_session(uid, fresh_jti, request)
    return _to_profile(str(current_user.get("id") or current_user.get("_id")), current_user)


@router.post("/logout")
async def auth_logout(request: Request, response: Response, current_user: dict = Depends(get_current_user_unrestricted)):
    """Cierra la sesión en TODOS los dispositivos: sube token_version e
    invalida todo JWT emitido hasta ahora para esta cuenta, y borra la cookie."""
    user_id = str(current_user.get("id") or current_user.get("_id"))
    email = (current_user.get("email") or "").strip().lower()
    await _bump_token_version(user_id, email)
    await revoke_all_user_sessions(user_id)
    clear_auth_cookie(response)
    await audit_event("logout", request=request, actor_id=user_id)
    return {"status": "ok", "detail": "Sesión cerrada en todos los dispositivos."}


@router.get("/sessions")
async def auth_list_sessions(current_user: dict = Depends(get_current_user_unrestricted)):
    """Sesiones activas del usuario (para 'cerrar este dispositivo' en ajustes)."""
    uid = str(current_user.get("id") or current_user.get("_id"))
    sessions = await list_user_sessions(uid)
    current_jti = (current_user.get("_jwt_payload") or {}).get("jti")
    return {
        "sessions": [
            {
                "jti": s.get("jti"),
                "ip": s.get("ip"),
                "user_agent": s.get("user_agent"),
                "created_at": s.get("created_at"),
                "last_seen": s.get("last_seen"),
                "current": s.get("jti") == current_jti,
            }
            for s in sessions
        ]
    }


@router.delete("/sessions/{jti}")
async def auth_revoke_session(
    jti: str,
    request: Request,
    current_user: dict = Depends(get_current_user_unrestricted),
):
    """Revoca UNA sesión concreta del usuario (por jti — nunca de otro)."""
    uid = str(current_user.get("id") or current_user.get("_id"))
    ok = await revoke_user_session(uid, jti)
    if not ok:
        raise HTTPException(status_code=404, detail="Sesión no encontrada.")
    await audit_event(EVT_SESSION_REVOKED, request=request, actor_id=uid)
    return {"status": "ok"}


# ---------------------------------------------------------------------
# MFA TOTP (opcional por usuario; forzable con mfa_required en el doc)
# ---------------------------------------------------------------------


class MfaCodeRequest(BaseModel):
    code: str = Field(min_length=6, max_length=12)


class MfaVerifyRequest(BaseModel):
    mfa_token: str = Field(min_length=10)
    # 6 dígitos TOTP o backup code "xxxxxxxx-xxxxxxxx" (17 chars)
    code: str = Field(min_length=6, max_length=20)


class PasswordConfirmRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)


@router.post("/mfa/setup")
@limiter.limit("10/minute")
async def mfa_setup(request: Request, current_user: dict = Depends(get_current_user_unrestricted)):
    """Genera el secreto TOTP pendiente (aún NO activo — falta verificar un código)."""
    if current_user.get("mfa_enabled"):
        return {"status": "already_enabled"}
    secret = pyotp.random_base32()
    uid = str(current_user.get("id") or current_user.get("_id"))
    email = (current_user.get("email") or "").strip().lower()
    await _update_user(uid, email, {"mfa_pending_secret": encrypt_field(secret)})
    uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=email or uid, issuer_name="Hubzy"
    )
    return {"otpauth_uri": uri, "secret": secret}


@router.post("/mfa/enable")
@limiter.limit("10/minute")
async def mfa_enable(
    request: Request,
    payload: MfaCodeRequest,
    current_user: dict = Depends(get_current_user_unrestricted),
):
    """Verifica el primer código TOTP → activa MFA y devuelve los backup codes (una sola vez)."""
    if current_user.get("mfa_enabled"):
        return {"status": "already_enabled"}
    pending = decrypt_field(current_user.get("mfa_pending_secret"))
    if not pending:
        raise HTTPException(status_code=400, detail="Primero llama a /auth/mfa/setup.")
    if not pyotp.TOTP(pending).verify(payload.code.strip(), valid_window=1):
        raise HTTPException(status_code=400, detail="Código incorrecto. Revisa la hora del dispositivo.")

    uid = str(current_user.get("id") or current_user.get("_id"))
    email = (current_user.get("email") or "").strip().lower()
    backup_codes = [f"{secrets.token_hex(4)}-{secrets.token_hex(4)}" for _ in range(10)]
    await _update_user(
        uid,
        email,
        {
            "mfa_enabled": True,
            "mfa_secret": encrypt_field(pending),
            "mfa_pending_secret": None,
            "mfa_backup_hashes": [
                hashlib.sha256(c.encode()).hexdigest() for c in backup_codes
            ],
        },
    )
    await audit_event(EVT_MFA_ENABLED, request=request, actor_id=uid)
    return {"status": "enabled", "backup_codes": backup_codes}


@router.post("/mfa/disable")
@limiter.limit("10/minute")
async def mfa_disable(
    request: Request,
    payload: PasswordConfirmRequest,
    current_user: dict = Depends(get_current_user_unrestricted),
):
    """Desactiva MFA exigiendo la contraseña actual — nadie con solo la sesión
    robada puede apagar el segundo factor."""
    if current_user.get("mfa_required"):
        raise HTTPException(status_code=403, detail="Tu institución exige MFA.")
    if not verify_password(current_user.get("password_hash", ""), payload.current_password):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta.")
    uid = str(current_user.get("id") or current_user.get("_id"))
    email = (current_user.get("email") or "").strip().lower()
    await _update_user(
        uid,
        email,
        {"mfa_enabled": False, "mfa_secret": None, "mfa_backup_hashes": []},
    )
    await audit_event(EVT_MFA_DISABLED, request=request, actor_id=uid)
    return {"status": "disabled"}


@router.post("/mfa/verify")
@limiter.limit("15/minute")
async def mfa_verify(
    request: Request,
    response: Response,
    payload: MfaVerifyRequest,
):
    """Canjea el challenge MFA: valida el código TOTP (o un backup code de un
    solo uso) y emite el access token completo + cookie."""
    data = decode_purpose_token(payload.mfa_token, "mfa_challenge")
    if not data:
        raise HTTPException(status_code=401, detail="El challenge MFA expiró. Inicia sesión de nuevo.")

    user = await _resolve_user(data["sub"])
    if not user or not user.get("mfa_enabled"):
        raise HTTPException(status_code=401, detail="MFA no está activo en esta cuenta.")

    uid = str(user.get("id") or user.get("_id"))
    email = (user.get("email") or "").strip().lower()
    secret = decrypt_field(user.get("mfa_secret"))
    code = payload.code.strip().replace("-", "")
    ok = pyotp.TOTP(secret).verify(code, valid_window=1) if secret else False

    if not ok:
        # Backup code (un solo uso): coincide por hash y se consume
        candidate = hashlib.sha256(payload.code.strip().encode()).hexdigest()
        hashes = list(user.get("mfa_backup_hashes") or [])
        if candidate in hashes:
            hashes.remove(candidate)
            await _update_user(uid, email, {"mfa_backup_hashes": hashes})
            ok = True
    if not ok:
        await audit_event(EVT_LOGIN_FAIL, request=request, actor_id=uid)
        raise HTTPException(status_code=401, detail="Código MFA incorrecto.")

    # Código válido → el challenge se consume (un solo uso)
    if not await _try_consume_mfa_jti(data):
        raise HTTPException(status_code=401, detail="El challenge ya fue utilizado.")

    token, jti = create_access_token(uid, email, int(user.get("token_version") or 0))
    set_auth_cookie(response, token, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    await register_session(uid, jti, request)
    await _update_user(uid, email, {"last_login_at": utcnow_iso()})
    await audit_event(EVT_LOGIN_OK, request=request, actor_id=uid)
    return AuthResponse(token=token, user=_to_profile(uid, user))


async def _try_consume_mfa_jti(payload: dict) -> bool:
    """Marca el jti del challenge MFA como consumido (idéntica mecánica
    a consume_purpose_token pero tras validar el código, no antes)."""
    from app.core.security import _try_consume_jti

    jti = payload.get("jti")
    return True if not jti else await _try_consume_jti(jti)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


@router.post("/change-password", response_model=AuthResponse)
@limiter.limit("10/minute")
async def auth_change_password(
    request: Request,
    response: Response,
    payload: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user_unrestricted),
):
    """Cambia la contraseña con sesión activa. Es la ÚNICA vía para las
    cuentas con must_change_password (matrícula escolar): el resto de la
    API les responde 403 hasta completar este paso."""
    user_id = str(current_user.get("id") or current_user.get("_id"))
    clean_email = (current_user.get("email") or "").strip().lower()

    if not verify_password(current_user.get("password_hash", ""), payload.current_password):
        raise HTTPException(status_code=401, detail="La contraseña actual es incorrecta.")

    if await check_password_breached(payload.new_password):
        raise HTTPException(
            status_code=400,
            detail="Esa contraseña apareció en filtraciones de datos. Elige otra distinta.",
        )

    # Bump de token_version + flag limpiado en un solo $set: las sesiones
    # con la contraseña temporal quedan revocadas en el acto.
    new_tv = int(current_user.get("token_version") or 0) + 1
    await _update_user(
        user_id,
        clean_email,
        {
            "password_hash": hash_password(payload.new_password),
            "must_change_password": False,
            "token_version": new_tv,
        },
    )
    token, jti = create_access_token(user_id, clean_email, new_tv)
    set_auth_cookie(response, token, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    await revoke_all_user_sessions(user_id)
    await register_session(user_id, jti, request)
    current_user["token_version"] = new_tv
    current_user["must_change_password"] = False
    await email_service.send_password_changed_email(
        clean_email, current_user.get("username") or ""
    )
    await audit_event(EVT_PASSWORD_CHANGED, request=request, actor_id=user_id)
    logger.info(f"Contraseña actualizada (change-password) para {clean_email[:3]}***")
    return AuthResponse(token=token, user=_to_profile(user_id, current_user))


# ---------------------------------------------------------------------
# Flujos de email: verificación de cuenta y recuperación de contraseña
# ---------------------------------------------------------------------


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(min_length=5, max_length=254)


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=10)
    new_password: str = Field(min_length=8, max_length=128)  # bcrypt trunca >72B


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=10)


async def _find_user_by_email(clean_email: str) -> tuple[dict | None, str | None]:
    """Busca usuario por email en Mongo o memoria. Devuelve (doc, user_id)."""
    if db_manager.db is not None:
        doc = await db_manager.db["users"].find_one({"email": clean_email})
        if doc:
            return doc, str(doc["_id"])
        return None, None
    if clean_email in in_memory_auth_users:
        doc = in_memory_auth_users[clean_email]
        return doc, doc.get("id")
    return None, None


async def _update_user(user_id: str, clean_email: str, updates: dict) -> None:
    """Aplica un $set al usuario en Mongo o en el store en memoria."""
    if db_manager.db is not None:
        from bson import ObjectId

        query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"id": user_id}
        await db_manager.db["users"].update_one(query, {"$set": updates})
        return
    if clean_email in in_memory_auth_users:
        in_memory_auth_users[clean_email].update(updates)


async def _bump_token_version(user_id: str, clean_email: str) -> None:
    """Sube token_version del usuario: invalida todos los access tokens
    emitidos (claim 'tv' ya no coincide). $inc es atómico — seguro bajo
    requests concurrentes."""
    if db_manager.db is not None:
        from bson import ObjectId

        query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"id": user_id}
        await db_manager.db["users"].update_one(query, {"$inc": {"token_version": 1}})
        return
    if clean_email in in_memory_auth_users:
        u = in_memory_auth_users[clean_email]
        u["token_version"] = int(u.get("token_version") or 0) + 1


@router.post("/forgot-password")
@limiter.limit("5/minute")
async def auth_forgot_password(request: Request, payload: ForgotPasswordRequest):
    """
    Inicia el flujo de recuperación. SIEMPRE responde 200 — no revela
    si el correo existe (anti-enumeración de cuentas).
    """
    clean_email = payload.email.strip().lower()
    if "@" not in clean_email:
        # Respuesta genérica también aquí — no confirmamos formato ni existencia
        return {
            "status": "ok",
            "detail": "Si el correo existe, recibirás un enlace de recuperación.",
        }
    user_doc, user_id = await _find_user_by_email(clean_email)

    if user_doc and user_id:
        token = create_purpose_token(user_id, clean_email, "reset_password", 60)
        await email_service.send_password_reset_email(
            clean_email, user_doc.get("username", "Estudiante"), token
        )

    return {"status": "ok", "detail": "Si el correo existe, recibirás un enlace de recuperación."}


@router.post("/reset-password")
@limiter.limit("10/minute")
async def auth_reset_password(request: Request, payload: ResetPasswordRequest):
    """Canjea el token de recuperación por una contraseña nueva (un solo uso)."""
    data = await consume_purpose_token(payload.token, "reset_password")
    if not data:
        raise HTTPException(
            status_code=400, detail="El enlace es inválido, expiró o ya fue utilizado."
        )

    if await check_password_breached(payload.new_password):
        raise HTTPException(
            status_code=400,
            detail="Esa contraseña apareció en filtraciones de datos. Elige otra distinta.",
        )

    clean_email = (data.get("email") or "").strip().lower()
    await _update_user(
        data["sub"],
        clean_email,
        {
            "password_hash": hash_password(payload.new_password),
            "must_change_password": False,
        },
    )
    # Reset de contraseña ⇒ todas las sesiones previas quedan revocadas:
    # un token robado deja de valer en el instante del canje.
    await _bump_token_version(data["sub"], clean_email)
    await revoke_all_user_sessions(data["sub"])
    await email_service.send_password_changed_email(clean_email, data.get("username", ""))
    await audit_event(EVT_PASSWORD_CHANGED, request=request, actor_id=data["sub"])
    logger.info(f"Contraseña restablecida para {clean_email}")
    return {"status": "ok", "detail": "Contraseña actualizada. Ya puedes iniciar sesión."}


@router.post("/verify-email")
@limiter.limit("10/minute")
async def auth_verify_email(request: Request, payload: VerifyEmailRequest):
    """Confirma el correo del usuario con el token enviado al registrarse (un solo uso)."""
    data = await consume_purpose_token(payload.token, "verify_email")
    if not data:
        raise HTTPException(
            status_code=400,
            detail="El enlace de verificación es inválido, expiró o ya fue utilizado.",
        )

    clean_email = (data.get("email") or "").strip().lower()
    await _update_user(data["sub"], clean_email, {"email_verified": True})
    return {"status": "ok", "detail": "Correo verificado correctamente."}


@router.post("/resend-verification")
@limiter.limit("3/minute")
async def auth_resend_verification(
    request: Request, current_user: dict = Depends(get_current_user)
):
    """Reenvía el email de verificación al usuario autenticado."""
    if current_user.get("email_verified"):
        return {"status": "ok", "detail": "Tu correo ya está verificado."}

    user_id = str(current_user.get("id") or current_user.get("_id"))
    email = (current_user.get("email") or "").strip().lower()
    token = create_purpose_token(user_id, email, "verify_email", 60 * 24)
    await email_service.send_verification_email(
        email, current_user.get("username", "Estudiante"), token
    )
    return {"status": "ok", "detail": "Email de verificación reenviado."}
