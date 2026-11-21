import logging
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.core.database import db_manager

logger = logging.getLogger("hubzy.security")

bearer_scheme = HTTPBearer(auto_error=False)
optional_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash seguro de contraseña con bcrypt (factor de costo por defecto 12)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(stored_password_hash: str, provided_password: str) -> bool:
    """Verifica contraseña contra hash bcrypt. Soporta migración desde sha256$salt legado."""
    try:
        if stored_password_hash.startswith("$2"):  # bcrypt
            return bcrypt.checkpw(
                provided_password.encode("utf-8"),
                stored_password_hash.encode("utf-8"),
            )
        # Migración: formato legado "salt$sha256"
        if "$" in stored_password_hash:
            import hashlib

            salt, expected_hash = stored_password_hash.split("$", 1)
            calculated = hashlib.sha256((salt + provided_password).encode("utf-8")).hexdigest()
            return secrets.compare_digest(calculated, expected_hash)
        return False
    except Exception:
        return False


def is_legacy_password_hash(stored_password_hash: str) -> bool:
    return bool(stored_password_hash) and not stored_password_hash.startswith("$2")


def create_access_token(
    user_id: str, email: str | None = None, token_version: int = 0
) -> tuple[str, str]:
    """Emite un access token y devuelve (token, jti) — el jti se registra
    en `sessions` para listar/revocar dispositivos."""
    now = datetime.now(timezone.utc)
    jti = secrets.token_hex(8)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access",
        # tv + jti: revocación global al subir user.token_version (reset de
        # contraseña, logout-all) y trazabilidad del token individual.
        "tv": int(token_version),
        "jti": jti,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM), jti


def decode_access_token(token: str) -> dict | None:
    """Decodifica con la clave actual; si falla y hay JWT_SECRET_PREVIOUS
    configurada, la intenta — rotación de clave sin logout masivo."""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.PyJWTError:
        prev = getattr(settings, "JWT_SECRET_PREVIOUS", None)
        if prev:
            try:
                return jwt.decode(token, prev, algorithms=[settings.JWT_ALGORITHM])
            except jwt.PyJWTError:
                return None
        return None


# ---------------------------------------------------------------------
# Identidad de invitado opaca (fin del pool compartido 'default_user')
# ---------------------------------------------------------------------

# Cookie HttpOnly única: lleva el token de acceso O el token de invitado —
# el JS del frontend nunca lee el JWT (cierra el vector XSS→token).
AUTH_COOKIE_NAME = "hubzy_token"


def create_guest_token() -> tuple[str, str]:
    """Identidad de invitado por dispositivo (sub='g_<random>').

    Antes todos los invitados compartían el user_id 'default_user': cualquiera
    podía leer, editar y borrar las carpetas de cualquier otro invitado. Con
    un id opaco por dispositivo cada invitado tiene su propio espacio."""
    guest_id = f"g_{secrets.token_hex(12)}"
    now = datetime.now(timezone.utc)
    payload = {
        "sub": guest_id,
        "iat": now,
        "exp": now + timedelta(days=settings.GUEST_TOKEN_EXPIRE_DAYS),
        "type": "guest",
        "jti": secrets.token_hex(8),
    }
    return (
        jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM),
        guest_id,
    )


def set_auth_cookie(response, token: str, max_age_seconds: int) -> None:
    """Cookie de sesión: HttpOnly (ilegible para JS), SameSite=Lax (no viaja
    en POST cross-site → capa base anti-CSRF) y Secure solo en HTTPS (prod)."""
    response.set_cookie(
        AUTH_COOKIE_NAME,
        value=token,
        max_age=max_age_seconds,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
        path="/",
    )


def clear_auth_cookie(response) -> None:
    response.delete_cookie(AUTH_COOKIE_NAME, path="/")


def create_purpose_token(user_id: str, email: str, purpose: str, expires_minutes: int) -> str:
    """Token firmado de un solo propósito (verify_email | reset_password)."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": now,
        "exp": now + timedelta(minutes=expires_minutes),
        "type": "purpose",
        "purpose": purpose,
        "jti": secrets.token_hex(8),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_purpose_token(token: str, expected_purpose: str) -> dict | None:
    """Decodifica un token de propósito; rechaza si el propósito no coincide."""
    payload = decode_access_token(token)
    if not payload or payload.get("type") != "purpose":
        return None
    if payload.get("purpose") != expected_purpose:
        return None
    return payload


async def _try_consume_jti(jti: str) -> bool:
    """
    Marca un jti como consumido de forma atómica.
    True si es la primera vez que se usa; False si ya fue canjeado.
    """
    from app.core.database import db_manager
    from app.core.session_store import in_memory_consumed_tokens

    if db_manager.db is not None:
        try:
            await db_manager.db["consumed_tokens"].insert_one(
                {"jti": jti, "consumed_at": datetime.now(timezone.utc)}
            )
            return True
        except Exception:
            # DuplicateKeyError en el índice único de jti → token ya canjeado
            return False
    if jti in in_memory_consumed_tokens:
        return False
    in_memory_consumed_tokens.add(jti)
    return True


async def consume_purpose_token(token: str, expected_purpose: str) -> dict | None:
    """
    Decodifica un token de propósito y lo marca como consumido (un solo uso).
    Devuelve el payload si es válido y no fue canjeado antes; None en caso contrario.
    """
    payload = decode_purpose_token(token, expected_purpose)
    if not payload:
        return None
    jti = payload.get("jti")
    if not jti:
        # Token emitido antes de la introducción de jti: se acepta (expira pronto)
        return payload
    if not await _try_consume_jti(jti):
        return None
    return payload


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------
# Dependencias de autenticación
# ---------------------------------------------------------------------


async def _resolve_user(user_id: str) -> dict | None:
    """Busca al usuario en MongoDB y luego en el almacén en memoria (dev sin BD)."""
    from bson import ObjectId

    from app.core.database import db_manager
    from app.core.session_store import in_memory_auth_users

    if db_manager.db is not None:
        # ObjectId.is_valid evita el InvalidId de bson. Un fallo real de
        # MongoDB propaga como 500 en lugar de degradar silenciosamente a memoria.
        query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"id": user_id}
        user = await db_manager.db["users"].find_one(query)
        if user:
            user["id"] = str(user["_id"])
            # Auto-curación: docs antiguos con created_at inválido ("now", null,
            # o formato viejo) reciben una fecha real para que la prueba funcione.
            try:
                datetime.fromisoformat(str(user.get("created_at", "")).replace("Z", "+00:00"))
            except (ValueError, TypeError):
                user["created_at"] = utcnow_iso()
                await db_manager.db["users"].update_one(
                    {"_id": user["_id"]},
                    {"$set": {"created_at": user["created_at"]}},
                )
            return user

    for u in in_memory_auth_users.values():
        if u.get("id") == user_id:
            return u
    return None


def _request_token(request, credentials) -> str | None:
    """Token del request: Bearer tiene precedencia; la cookie HttpOnly es
    el fallback del frontend web (donde el JWT no es legible por JS)."""
    if credentials is not None:
        return credentials.credentials
    return request.cookies.get(AUTH_COOKIE_NAME)


# ---------------------------------------------------------------------
# Sesiones por dispositivo (colección `sessions` — revocación individual)
# ---------------------------------------------------------------------

async def register_session(user_id: str, jti: str, request: Request | None) -> None:
    """Registra el jti emitido como sesión visible del usuario."""
    doc = {
        "jti": jti,
        "user_id": user_id,
        "ip": request.client.host if request and request.client else None,
        "user_agent": (request.headers.get("user-agent") or "")[:200] if request else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_seen": datetime.now(timezone.utc).isoformat(),
        "revoked": False,
    }
    try:
        if db_manager.db is not None:
            await db_manager.db["sessions"].update_one(
                {"jti": jti}, {"$set": doc}, upsert=True
            )
        else:
            from app.core.session_store import in_memory_sessions

            in_memory_sessions[jti] = doc
    except Exception as e:
        logger.warning(f"No se pudo registrar sesión {jti[:8]}…: {e}")


async def is_jti_revoked(jti: str | None) -> bool:
    """True si la sesión individual fue revocada por el usuario."""
    if not jti:
        return False
    try:
        if db_manager.db is not None:
            doc = await db_manager.db["sessions"].find_one(
                {"jti": jti, "revoked": True}, {"_id": 1}
            )
            return doc is not None
        from app.core.session_store import in_memory_sessions

        return bool(in_memory_sessions.get(jti, {}).get("revoked"))
    except Exception:
        return False


async def list_user_sessions(user_id: str) -> list[dict]:
    """Sesiones activas (no revocadas) del usuario, más recientes primero."""
    try:
        if db_manager.db is not None:
            cursor = (
                db_manager.db["sessions"]
                .find({"user_id": user_id, "revoked": False}, {"_id": 0})
                .sort("last_seen", -1)
                .limit(25)
            )
            return await cursor.to_list(length=25)
        from app.core.session_store import in_memory_sessions

        rows = [
            s
            for s in in_memory_sessions.values()
            if s.get("user_id") == user_id and not s.get("revoked")
        ]
        return sorted(rows, key=lambda s: s.get("last_seen") or "", reverse=True)[:25]
    except Exception:
        return []


async def revoke_user_session(user_id: str, jti: str) -> bool:
    """Revoca una sesión individual. Solo el dueño puede revocarla."""
    try:
        if db_manager.db is not None:
            res = await db_manager.db["sessions"].update_one(
                {"jti": jti, "user_id": user_id},
                {"$set": {"revoked": True}},
            )
            return res.modified_count > 0 or res.matched_count > 0
        from app.core.session_store import in_memory_sessions

        s = in_memory_sessions.get(jti)
        if s and s.get("user_id") == user_id:
            s["revoked"] = True
            return True
        return False
    except Exception:
        return False


async def revoke_all_user_sessions(user_id: str) -> None:
    """Revoca TODAS las sesiones registradas (complemento de token_version)."""
    try:
        if db_manager.db is not None:
            await db_manager.db["sessions"].update_many(
                {"user_id": user_id}, {"$set": {"revoked": True}}
            )
            return
        from app.core.session_store import in_memory_sessions

        for s in in_memory_sessions.values():
            if s.get("user_id") == user_id:
                s["revoked"] = True
    except Exception as e:
        logger.warning(f"No se pudieron revocar sesiones de {user_id[:8]}…: {e}")


_UNAUTHORIZED = lambda detail: HTTPException(  # noqa: E731
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail=detail,
    headers={"WWW-Authenticate": "Bearer"},
)


async def _authenticate(request: Request, credentials) -> dict:
    """Valida el JWT (cookie o Bearer) y resuelve el usuario — lógica
    compartida por las dos dependencias de sesión."""
    token = _request_token(request, credentials)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere autenticación.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(token)
    if not payload or payload.get("type") != "access":
        # Un token de invitado NO es una cuenta: los endpoints que exigen
        # identidad real lo rechazan igual que un token ausente.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await _resolve_user(payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Revocación: el tv del token debe coincidir con user.token_version —
    # subirlo (reset-password / logout) invalida toda sesión emitida antes.
    if int(payload.get("tv") or 0) != int(user.get("token_version") or 0):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sesión fue cerrada. Inicia sesión de nuevo.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Revocación individual: el usuario puede cerrar este dispositivo desde
    # su lista de sesiones (colección sessions.revoked).
    if await is_jti_revoked(payload.get("jti")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sesión fue cerrada desde otro dispositivo.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user["_jwt_payload"] = payload
    return user


def _account_gates(user: dict) -> None:
    """Vallas de la cuenta: cuenta suspendida, contraseña temporal
    pendiente o enrolamiento MFA obligatorio → la API entera responde
    403 hasta completarlas."""
    if user.get("disabled"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="account_disabled",
        )
    if user.get("must_change_password"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="password_change_required",
        )
    if (
        settings.MFA_ENFORCE_INSTITUTIONS
        and user.get("mfa_required")
        and not user.get("mfa_enabled")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="mfa_enrollment_required",
        )


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Exige un JWT válido y retorna el documento del usuario autenticado.

    Las cuentas con `must_change_password` (matrícula masiva escolar)
    quedan bloqueadas hasta que cambien su contraseña temporal — solo
    /auth/me, /auth/logout y /auth/change-password les responden. Ídem
    con `mfa_required` sin `mfa_enabled` (enrolamiento obligatorio)."""
    user = await _authenticate(request, credentials)
    _account_gates(user)
    return user


async def get_current_user_unrestricted(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Como get_current_user pero SIN las vallas de cuenta —
    solo para /auth/me, /auth/logout, /auth/change-password y /auth/mfa/*."""
    return await _authenticate(request, credentials)


async def get_current_verified_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Sesión + vallas de cuenta + email verificado — para endpoints
    sensibles (pagos, instituciones, exportación de datos)."""
    user = await _authenticate(request, credentials)
    _account_gates(user)
    if not user.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="email_not_verified",
        )
    return user


async def _optional_user_impl(request: Request, credentials, enforce_pw_gate: bool) -> dict | None:
    token = _request_token(request, credentials)
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    if payload.get("type") == "guest":
        # Pseudo-usuario invitado: id privado por dispositivo que reemplaza
        # al pool compartido 'default_user' en las carpetas nuevas.
        return {"id": payload["sub"], "is_guest": True, "plan": "guest"}
    if payload.get("type") != "access":
        return None
    user = await _resolve_user(payload["sub"])
    if user is None:
        return None
    if int(payload.get("tv") or 0) != int(user.get("token_version") or 0):
        return None
    if await is_jti_revoked(payload.get("jti")):
        return None
    # Misma valla que get_current_user: una cuenta con contraseña temporal
    # (o enrolamiento MFA pendiente) no puede operar NADA por la vía
    # opcional tampoco — devolver None la dejaría escribir como invitado.
    if enforce_pw_gate:
        _account_gates(user)
    user["_jwt_payload"] = payload
    return user


async def get_optional_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(optional_bearer),
) -> dict | None:
    """Retorna el usuario autenticado, la identidad de invitado opaca, o
    None (request anónimo sin cookie)."""
    return await _optional_user_impl(request, credentials, enforce_pw_gate=True)


async def get_optional_user_unrestricted(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(optional_bearer),
) -> dict | None:
    """Como get_optional_user pero sin la valla de must_change_password —
    SOLO para login/register, que deben admitir la re-autenticación de una
    cuenta con contraseña temporal (si no, quedaría bloqueada fuera)."""
    return await _optional_user_impl(request, credentials, enforce_pw_gate=False)


# ---------------------------------------------------------------------
# Superadmin de plataforma (panel /admin — NO confundir con admin de
# institución, que solo gestiona SU colegio)
# ---------------------------------------------------------------------


def is_superadmin(user: dict | None) -> bool:
    """Superadmin = rol persistido en el doc del usuario, o email en
    SUPERADMIN_EMAILS (bootstrap/env — útil para la primera cuenta)."""
    if not user:
        return False
    if user.get("role") == "superadmin":
        return True
    email = (user.get("email") or "").strip().lower()
    return bool(email) and email in {
        e.strip().lower() for e in (settings.SUPERADMIN_EMAILS or "").split(",") if e.strip()
    }


async def require_superadmin(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Dependencia para el router /admin: sesión válida + vallas de cuenta
    + rol superadmin. Un admin de institución NO pasa — su poder acaba
    en su propia organización."""
    user = await _authenticate(request, credentials)
    _account_gates(user)
    if not is_superadmin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo superadministradores de la plataforma.",
        )
    return user


def resolve_effective_user_id(user: dict | None, requested_user_id: str | None) -> str:
    """
    Regla anti-IDOR: si hay sesión autenticada, el user_id SIEMPRE sale del token.
    Sin sesión, el invitado opera en el pool compartido 'default_user' — el cliente
    no puede reclamar un user_id ajeno (eso sería un IDOR anónimo).
    """
    if user:
        return str(user.get("id") or user.get("_id"))
    if requested_user_id in ("guest", "default_user"):
        return requested_user_id
    return "default_user"


def assert_can_access_user_resource(user: dict | None, resource_owner_id: str | None):
    """Con sesión activa, un usuario solo puede tocar recursos propios o del pool
    de invitados. Sin sesión, el invitado solo toca ese pool — jamás recursos de
    usuarios registrados o docentes.

    Un recurso sin dueño (documentos legacy previos a user_id) se trata como
    parte del pool de invitados 'default_user' — mismo alcance que tendría si
    se hubiera creado hoy."""
    resource_owner_id = resource_owner_id or "default_user"
    if not user:
        if resource_owner_id not in ("default_user", "guest"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Necesitas una cuenta para acceder a este recurso.",
            )
        return
    uid = str(user.get("id") or user.get("_id"))
    if resource_owner_id not in (uid, "default_user"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a este recurso.",
        )


def get_user_plan(user: dict | None) -> str:
    if not user:
        return "guest"
    return user.get("plan", "free")


def safe_redirect_url(url: str | None, fallback: str) -> str:
    """La success/cancel URL de un pago solo puede apuntar al frontend
    configurado: una URL libre del cliente permite phishing con el
    session_id de Stripe y pagos acreditados a la cuenta del atacante."""
    frontend = settings.FRONTEND_URL.rstrip("/")
    if url and url.startswith(f"{frontend}/"):
        return url
    return fallback
