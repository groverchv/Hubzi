"""Audit log de seguridad — colección `security_events` append-only.

Registra eventos sensibles (login, cambios de contraseña/rol, exportaciones,
borrados, uploads sospechosos) para detección y forense. Fire-and-forget:
un fallo de escritura NUNCA rompe el request del usuario.
"""
import logging
from datetime import datetime, timezone

from fastapi import Request

from app.core.database import db_manager

logger = logging.getLogger("hubzy.audit")

# Tipos de evento — strings estables para dashboards/alertas
EVT_LOGIN_OK = "login_ok"
EVT_LOGIN_FAIL = "login_fail"
EVT_ACCOUNT_LOCKED = "account_locked"
EVT_REGISTER = "register"
EVT_PASSWORD_CHANGED = "password_changed"
EVT_PASSWORD_RESET = "password_reset"
EVT_LOGOUT = "logout"
EVT_SESSION_REVOKED = "session_revoked"
EVT_DATA_EXPORT = "data_export"
EVT_ACCOUNT_DELETED = "account_deleted"
EVT_MFA_ENABLED = "mfa_enabled"
EVT_MFA_DISABLED = "mfa_disabled"
EVT_SUSPICIOUS_UPLOAD = "suspicious_upload"
EVT_GUEST_MIGRATED = "guest_migrated"


def _client_ip(request: Request | None) -> str | None:
    if request is None or request.client is None:
        return None
    return request.client.host


async def audit_event(
    event_type: str,
    request: Request | None = None,
    actor_id: str | None = None,
    detail: dict | None = None,
) -> None:
    """Inserta un evento en `security_events` (solo insert — nunca update)."""
    doc = {
        "type": event_type,
        "actor_id": actor_id,
        "ip": _client_ip(request),
        "user_agent": (
            (request.headers.get("user-agent") or "")[:200] if request else None
        ),
        "detail": detail or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        if db_manager.db is not None:
            await db_manager.db["security_events"].insert_one(doc)
        else:
            from app.core.session_store import in_memory_security_events

            in_memory_security_events.append(doc)
    except Exception as e:
        # Nunca romper el flujo del usuario por el audit trail
        logger.warning(f"No se pudo registrar evento {event_type}: {e}")
