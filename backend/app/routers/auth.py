import logging
import hashlib

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.age_bands import band_for_age, needs_parental_consent
from app.core.config import settings
from app.core.database import db_manager
from app.core.rate_limit import limiter
from app.core.session_store import in_memory_auth_users
from app.core.security import (
    hash_password, verify_password, is_legacy_password_hash,
    create_access_token, get_current_user, utcnow_iso,
)
from app.models.user import (
    UserAuthRegisterRequest,
    UserAuthLoginRequest,
    UserProfileResponse,
    AuthResponse,
)

logger = logging.getLogger("hubzy.auth")
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


def assign_voice_gender(gender: str, voice_preference: str = None) -> str:
    """Regla de voz complementaria de Capi: hombre→voz femenina, mujer→voz masculina."""
    if voice_preference and voice_preference in ("female", "male"):
        return voice_preference
    norm = (gender or "").strip().lower()
    if norm in ("masculino", "hombre", "varon"):
        return "female"
    if norm in ("femenino", "mujer", "dama"):
        return "male"
    return "female"


def _to_profile(user_id: str, doc: dict) -> UserProfileResponse:
    age = doc.get("age", 20)
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
    )


@router.post("/register", response_model=AuthResponse)
@limiter.limit("10/minute")
async def auth_register(request: Request, payload: UserAuthRegisterRequest):
    """
    Registra una nueva cuenta con correo, contraseña (bcrypt), nombre, sexo y edad.
    Devuelve un JWT de acceso.
    """
    clean_email = payload.email.strip().lower()
    clean_username = payload.username.strip()
    norm_gender = payload.gender.strip().lower()

    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Por favor ingresa un correo electrónico válido.")

    age_band = band_for_age(payload.age)
    if needs_parental_consent(age_band) and not payload.parental_consent:
        raise HTTPException(
            status_code=400,
            detail="Las cuentas de menores de 11 años requieren el consentimiento de un padre, madre o tutor."
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
        "parental_consent": bool(payload.parental_consent) if needs_parental_consent(age_band) else None,
        "consented_at": utcnow_iso() if payload.parental_consent else None,
        "avatar": payload.avatar or "capy_fan",
        "voice_preference": payload.voice_preference or "auto",
        "assigned_voice_gender": assigned_voice,
        "plan": "free",
        "created_at": utcnow_iso(),
    }

    user_id = None
    if db_manager.db is not None:
        try:
            existing = await db_manager.db["users"].find_one({"email": clean_email})
            if existing:
                raise HTTPException(status_code=400, detail="Ya existe una cuenta registrada con este correo electrónico.")
            res = await db_manager.db["users"].insert_one(user_doc)
            user_id = str(res.inserted_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error registrando en MongoDB: {e}")

    if user_id is None:
        if clean_email in in_memory_auth_users:
            raise HTTPException(status_code=400, detail="Ya existe una cuenta registrada con este correo electrónico.")
        user_id = f"user_{hashlib.md5(clean_email.encode()).hexdigest()[:10]}"
        in_memory_auth_users[clean_email] = {**user_doc, "id": user_id}

    token = create_access_token(user_id, clean_email)
    return AuthResponse(token=token, user=_to_profile(user_id, user_doc))


@router.post("/login", response_model=AuthResponse)
@limiter.limit("15/minute")
async def auth_login(request: Request, payload: UserAuthLoginRequest):
    """Inicia sesión con correo y contraseña. Devuelve JWT + perfil."""
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

    if not user_data and clean_email in in_memory_auth_users:
        user_data = in_memory_auth_users[clean_email]
        user_id = user_data.get("id")

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas. No existe una cuenta con este correo."
        )

    stored_hash = user_data.get("password_hash")
    if not stored_hash or not verify_password(stored_hash, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña incorrecta. Por favor verifica tus credenciales."
        )

    # Migración transparente: si el hash es sha256 legado, re-hashear con bcrypt
    if is_legacy_password_hash(stored_hash):
        try:
            new_hash = hash_password(payload.password)
            if user_from_mongo and db_manager.db is not None:
                from bson import ObjectId
                await db_manager.db["users"].update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {"password_hash": new_hash}}
                )
            elif clean_email in in_memory_auth_users:
                in_memory_auth_users[clean_email]["password_hash"] = new_hash
            logger.info(f"Hash de contraseña migrado a bcrypt para {clean_email}")
        except Exception as e:
            logger.warning(f"No se pudo migrar hash legado: {e}")

    token = create_access_token(user_id, clean_email)
    return AuthResponse(token=token, user=_to_profile(user_id, user_data))


@router.get("/me", response_model=UserProfileResponse)
async def auth_get_current_user(current_user: dict = Depends(get_current_user)):
    """Retorna el perfil del usuario autenticado según su JWT."""
    return _to_profile(str(current_user.get("id") or current_user.get("_id")), current_user)
