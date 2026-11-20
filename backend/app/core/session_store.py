"""
Almacenes en memoria para modo desarrollo sin MongoDB.
Centralizados aquí para que los routers y dependencias compartan el mismo estado.
"""

from typing import Any

in_memory_auth_users: dict[str, Any] = {}
in_memory_study_folders: dict[str, Any] = {}
# JTIs de tokens de propósito ya canjeados (verify_email / reset_password)
in_memory_consumed_tokens: set[str] = set()
# Jobs asíncronos de generación (modo sin MongoDB)
in_memory_jobs: dict[str, Any] = {}
# Audit log de seguridad (append-only)
in_memory_security_events: list[dict] = []

# Contador de intentos de login fallidos por email (captcha anti-bot).
in_memory_login_attempts: dict[str, Any] = {}
# Sesiones activas por jti — listar/revocar por dispositivo
in_memory_sessions: dict[str, Any] = {}
