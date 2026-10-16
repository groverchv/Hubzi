import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings

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


def create_access_token(user_id: str, email: Optional[str] = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------
# Dependencias de autenticación
# ---------------------------------------------------------------------

async def _resolve_user(user_id: str) -> Optional[dict]:
    """Busca al usuario en MongoDB y luego en el almacén en memoria (dev sin BD)."""
    from app.core.database import db_manager
    from app.core.session_store import in_memory_auth_users

    if db_manager.db is not None:
        try:
            from bson import ObjectId
            query = {"_id": ObjectId(user_id)} if len(user_id) == 24 else {"id": user_id}
            user = await db_manager.db["users"].find_one(query)
            if user:
                user["id"] = str(user["_id"])
                return user
        except Exception as e:
            logger.warning(f"Error resolviendo usuario {user_id}: {e}")

    for u in in_memory_auth_users.values():
        if u.get("id") == user_id:
            return u
    return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Exige un JWT válido y retorna el documento del usuario autenticado."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere autenticación.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
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
    return user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(optional_bearer),
) -> Optional[dict]:
    """Retorna el usuario autenticado o None para flujos de invitado."""
    if credentials is None:
        return None
    payload = decode_access_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        return None
    return await _resolve_user(payload["sub"])


def resolve_effective_user_id(user: Optional[dict], requested_user_id: Optional[str]) -> str:
    """
    Regla anti-IDOR: si hay sesión autenticada, el user_id SIEMPRE sale del token.
    Sin sesión (invitado), se acepta el user_id del cliente o 'default_user'.
    """
    if user:
        return str(user.get("id") or user.get("_id"))
    return requested_user_id or "default_user"


def assert_can_access_user_resource(user: Optional[dict], resource_owner_id: Optional[str]):
    """Con sesión activa, un usuario solo puede tocar recursos propios o de invitados."""
    if not user:
        return
    uid = str(user.get("id") or user.get("_id"))
    if resource_owner_id and resource_owner_id not in (uid, "default_user"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a este recurso.",
        )


def get_user_plan(user: Optional[dict]) -> str:
    if not user:
        return "guest"
    return user.get("plan", "free")
