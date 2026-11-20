"""Canary anti prompt-injection para documentos subidos.

No pretende bloquear (la mitigación real son los delimitadores <documento>
en los prompts) — DETECTA y registra intentos para auditoría, y marca el
recurso con una flag visible para revisión humana.
"""
import logging
import re

from app.core.audit import EVT_SUSPICIOUS_UPLOAD, audit_event

logger = logging.getLogger("hubzy.injection_guard")

_PATTERNS = [
    r"ignore\s+(all\s+|the\s+)?(previous|prior|above)\s+instructions",
    r"ignora\s+(todas\s+)?(las\s+)?instrucciones",
    r"olvida\s+(todo|tus instrucciones)",
    r"system\s*prompt",
    r"you\s+are\s+now\b",
    r"ahora\s+eres\b",
    r"\bDAN\b.*\bjailbreak|jailbreak",
    r"reveal\s+your\s+(prompt|instructions|system)",
    r"act\s+as\s+(if|an?)\b.*\b(no restrictions|unrestricted)",
    r"<\s*/?\s*(system|instruction|prompt)\s*>",
    r"\[INST\]|\[SYSTEM\]|<<SYS>>",
]
_RX = re.compile("|".join(_PATTERNS), re.IGNORECASE)


def detect_injection_signals(text: str, max_scan: int = 60_000) -> list[str]:
    """Devuelve los patrones encontrados (lista vacía = limpio)."""
    if not text:
        return []
    hits = set()
    for m in _RX.finditer(text[:max_scan]):
        hits.add(m.group(0)[:80])
    return sorted(hits)


async def flag_suspicious_document(
    folder_id: str | None,
    filename: str,
    user_id: str | None,
    request=None,
) -> None:
    """Registra el intento en el audit trail."""
    await audit_event(
        EVT_SUSPICIOUS_UPLOAD,
        request=request,
        actor_id=user_id,
        detail={"folder_id": folder_id, "filename": filename[:200]},
    )
