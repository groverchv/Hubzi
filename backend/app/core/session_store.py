"""
Almacenes en memoria para modo desarrollo sin MongoDB.
Centralizados aquí para que los routers y dependencias compartan el mismo estado.
"""
from typing import Any, Dict

in_memory_auth_users: Dict[str, Any] = {}
in_memory_study_folders: Dict[str, Any] = {}
