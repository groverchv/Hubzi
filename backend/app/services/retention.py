"""Retención de cuentas: aviso y purga de cuentas inactivas.

Política (GDPR — minimización de datos):
- Inactividad > INACTIVE_ACCOUNT_WARN_AFTER_DAYS sin aviso previo → email
  de aviso "tu cuenta se eliminará en N días" y marca `inactive_warned_at`.
- Inactividad > INACTIVE_ACCOUNT_PURGE_DAYS con aviso enviado hace ≥30d →
  borrado completo en cascada (misma vía que DELETE /users/me).

Inactividad = max(last_login_at, created_at) — un usuario que nunca entró
envejece desde su fecha de registro.

Solo corre con MongoDB (en memoria no hay persistencia que purgar). Se
invoca desde el task diario en main.py o desde un cron/CLI.
"""
import logging
from datetime import datetime, timedelta, timezone

from app.core.audit import audit_event
from app.core.config import settings
from app.core.database import db_manager
from app.services import email_service
from app.services.account_lifecycle import DeletionError, delete_user_everywhere

logger = logging.getLogger("hubzy.retention")


def _parse_dt(value) -> datetime | None:
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return None


def _last_activity(user: dict) -> datetime | None:
    for key in ("last_login_at", "last_seen_at", "created_at"):
        dt = _parse_dt(user.get(key))
        if dt:
            return dt
    return None


async def sweep_inactive_accounts(now: datetime | None = None) -> dict:
    """Ejecuta una pasada de retención. Devuelve conteos para logging/tests."""
    if db_manager.db is None:
        return {"warned": 0, "purged": 0, "skipped": "no_db"}

    now = now or datetime.now(timezone.utc)
    warn_cutoff = now - timedelta(days=settings.INACTIVE_ACCOUNT_WARN_AFTER_DAYS)
    purge_cutoff = now - timedelta(days=settings.INACTIVE_ACCOUNT_PURGE_DAYS)
    warned = purged = 0

    async for user in db_manager.db["users"].find(
        {}, {"_id": 1, "email": 1, "username": 1, "created_at": 1,
             "last_login_at": 1, "last_seen_at": 1, "inactive_warned_at": 1}
    ):
        last = _last_activity(user)
        if not last:
            continue
        uid = str(user["_id"])
        email = (user.get("email") or "").strip().lower()
        warned_at = _parse_dt(user.get("inactive_warned_at"))

        # Purga: inactivo + avisado hace ≥30 días (margen para que reaccione)
        if warned_at and last < purge_cutoff and (now - warned_at).days >= 30:
            try:
                await delete_user_everywhere(uid, email)
                purged += 1
                await audit_event("inactive_account_purged", actor_id=uid)
                logger.info(f"Cuenta inactiva purgada: {uid}")
            except DeletionError as e:
                logger.error(f"Purga de cuenta inactiva {uid} falló: {e}")
            continue

        # Aviso: inactivo más allá del umbral de aviso y nunca avisado
        if last < warn_cutoff and not warned_at:
            days_left = settings.INACTIVE_ACCOUNT_PURGE_DAYS - (now - last).days
            if days_left <= 0:
                days_left = settings.INACTIVE_ACCOUNT_PURGE_DAYS - settings.INACTIVE_ACCOUNT_WARN_AFTER_DAYS
            try:
                await email_service.send_inactive_account_warning_email(
                    email, user.get("username") or "Estudiante", days_left
                )
                await db_manager.db["users"].update_one(
                    {"_id": user["_id"]},
                    {"$set": {"inactive_warned_at": now.isoformat()}},
                )
                warned += 1
            except Exception as e:
                logger.warning(f"No se pudo avisar a {email[:3]}***: {e}")

    logger.info(f"Retención: {warned} avisos, {purged} cuentas purgadas")
    return {"warned": warned, "purged": purged}
