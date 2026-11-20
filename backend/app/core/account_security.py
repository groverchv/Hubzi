"""Protección de cuentas contra fuerza bruta + contraseñas comprometidas.

- Lockout progresivo POR CUENTA (independiente del rate-limit por IP):
  tras LOGIN_MAX_FAILURES fallos seguidos, la cuenta se bloquea un tiempo
  que crece exponencialmente con cada racha de fallos.
- HaveIBeenPwned k-anonymity: solo van 5 chars del SHA-1 a la API —
  la contraseña completa nunca sale del servidor.
"""
import hashlib
import logging
from datetime import datetime, timedelta, timezone

import httpx

from app.core.config import settings
from app.core.database import db_manager

logger = logging.getLogger("hubzy.account_security")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def is_account_locked(user: dict) -> tuple[bool, int]:
    """(bloqueada, segundos restantes)."""
    until = user.get("login_locked_until")
    if not until:
        return False, 0
    try:
        locked_until = datetime.fromisoformat(str(until).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return False, 0
    remaining = (locked_until - _now()).total_seconds()
    return (remaining > 0), max(0, int(remaining))


async def record_login_failure(user_id: str, email: str) -> int:
    """Incrementa el contador y aplica lockout exponencial si toca.
    Devuelve los segundos de bloqueo aplicados (0 si no llegó al umbral)."""
    user, _ = await _find_user_for_attempts(user_id, email)
    if not user:
        return 0
    fails = int(user.get("login_failed_count") or 0) + 1
    updates: dict = {"login_failed_count": fails}
    lock_seconds = 0
    if fails >= settings.LOGIN_MAX_FAILURES:
        streak = int(user.get("login_lock_streak") or 0) + 1
        lock_seconds = settings.LOGIN_LOCKOUT_BASE_MINUTES * 60 * (2 ** (streak - 1))
        updates["login_locked_until"] = (
            _now() + timedelta(seconds=lock_seconds)
        ).isoformat()
        updates["login_lock_streak"] = streak
        updates["login_failed_count"] = 0  # la racha empieza de cero tras el lock
    await _update_attempts(user_id, email, updates)
    return lock_seconds


async def reset_login_failures(user_id: str, email: str) -> None:
    """Login correcto: contadores a cero."""
    await _update_attempts(
        user_id,
        email,
        {"login_failed_count": 0, "login_locked_until": None, "login_lock_streak": 0},
    )


async def _find_user_for_attempts(user_id: str | None, email: str) -> tuple[dict | None, str | None]:
    from bson import ObjectId

    if db_manager.db is not None:
        query = (
            {"_id": ObjectId(user_id)}
            if user_id and ObjectId.is_valid(user_id)
            else {"email": email}
        )
        doc = await db_manager.db["users"].find_one(query)
        return doc, (str(doc["_id"]) if doc else None)
    from app.core.session_store import in_memory_auth_users

    doc = in_memory_auth_users.get(email)
    return doc, (doc.get("id") if doc else None)


async def _update_attempts(user_id: str | None, email: str, updates: dict) -> None:
    from bson import ObjectId

    try:
        if db_manager.db is not None:
            query = (
                {"_id": ObjectId(user_id)}
                if user_id and ObjectId.is_valid(user_id)
                else {"email": email}
            )
            await db_manager.db["users"].update_one(query, {"$set": updates})
            return
        from app.core.session_store import in_memory_auth_users

        if email in in_memory_auth_users:
            in_memory_auth_users[email].update(updates)
    except Exception as e:
        logger.warning(f"No se pudo actualizar contador de login de {email[:3]}***: {e}")


async def check_password_breached(password: str) -> bool:
    """True si la contraseña aparece en filtraciones públicas (HIBP range
    API, k-anonymity). Falla ABIERTA: si la API no responde no se bloquea
    el registro — la seguridad del rate-limit sigue aplicando."""
    if not settings.HIBP_ENABLED:
        return False
    try:
        sha1 = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
        prefix, suffix = sha1[:5], sha1[5:]
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"https://api.pwnedpasswords.com/range/{prefix}")
        if res.status_code != 200:
            return False
        return any(
            line.split(":", 1)[0] == suffix for line in res.text.splitlines()
        )
    except Exception as e:
        logger.info(f"HIBP no disponible (fail-open): {e}")
        return False


async def captcha_required(email: str) -> bool:
    """Tras LOGIN_CAPTCHA_AFTER fallos PARA ESE EMAIL el login exige captcha.

    El contador va por email (no por cuenta): si solo se registraran fallos
    de cuentas existentes, el captcha delataría qué correos existen."""
    if not settings.TURNSTILE_SECRET_KEY:
        return False
    rec = await _attempts_record(email)
    return int((rec or {}).get("fails") or 0) >= settings.LOGIN_CAPTCHA_AFTER


async def record_attempt_failure(email: str) -> None:
    """Bump del contador de fallos por email (cuentas existentes o no)."""
    try:
        if db_manager.db is not None:
            await db_manager.db["login_attempts"].update_one(
                {"email": email},
                {
                    "$inc": {"fails": 1},
                    "$set": {"updated_at": _now().isoformat()},
                    "$setOnInsert": {"created_at": _now().isoformat()},
                },
                upsert=True,
            )
            return
        from app.core.session_store import in_memory_login_attempts

        rec = in_memory_login_attempts.setdefault(
            email, {"email": email, "fails": 0}
        )
        rec["fails"] += 1
        rec["updated_at"] = _now().isoformat()
    except Exception as e:
        logger.warning(f"No se pudo registrar intento de login de {email[:3]}***: {e}")


async def reset_attempt_failures(email: str) -> None:
    """Login correcto → contador por email a cero."""
    try:
        if db_manager.db is not None:
            await db_manager.db["login_attempts"].update_one(
                {"email": email}, {"$set": {"fails": 0}}
            )
            return
        from app.core.session_store import in_memory_login_attempts

        if email in in_memory_login_attempts:
            in_memory_login_attempts[email]["fails"] = 0
    except Exception:  # noqa: S110 — best-effort, el login nunca debe fallar por esto
        pass


async def _attempts_record(email: str) -> dict | None:
    if db_manager.db is not None:
        return await db_manager.db["login_attempts"].find_one({"email": email})
    from app.core.session_store import in_memory_login_attempts

    return in_memory_login_attempts.get(email)


async def verify_turnstile(token: str | None, ip: str | None) -> bool:
    """Verifica el token de Cloudflare Turnstile contra siteverify.
    Sin secret configurado devuelve True (captcha desactivado — dev)."""
    if not settings.TURNSTILE_SECRET_KEY:
        return True
    if not token:
        return False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={
                    "secret": settings.TURNSTILE_SECRET_KEY,
                    "response": token,
                    "remoteip": ip or "",
                },
            )
        return bool(res.json().get("success"))
    except Exception as e:
        # Fail-CLOSED para captcha: si no podemos verificar, el bot tampoco
        # podría — se rechaza. El usuario reintenta cuando vuelva la red.
        logger.warning(f"Turnstile siteverify no disponible: {e}")
        return False
