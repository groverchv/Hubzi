"""Cifrado field-level (Fernet/AES-128-CBC+HMAC) para datos sensibles en
reposo — p. ej. notas de bienestar de menores (zen_logs).

Clave: settings.ENCRYPTION_KEY (Fernet urlsafe-b64 de 32 bytes —
`python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`).

Sin clave configurada los helpers pasan el texto en claro (modo dev) con un
warning una sola vez — en producción debe configurarse siempre.
"""
import logging

from app.core.config import settings

logger = logging.getLogger("hubzy.crypto")

_fernet = None
_warned_no_key = False


def _get_fernet():
    global _fernet, _warned_no_key
    if _fernet is not None:
        return _fernet
    key = settings.ENCRYPTION_KEY
    if not key:
        if not _warned_no_key:
            _warned_no_key = True
            logger.warning(
                "ENCRYPTION_KEY no configurada: campos sensibles se guardan en claro (solo dev)."
            )
        return None
    from cryptography.fernet import Fernet

    _fernet = Fernet(key.encode())
    return _fernet


def encrypt_field(plaintext: str | None) -> str | None:
    """Cifra un campo para almacenamiento. Devuelve el token Fernet
    prefijado 'enc:' (o el texto original si no hay clave — dev)."""
    if plaintext is None:
        return None
    f = _get_fernet()
    if f is None:
        return plaintext
    return "enc:" + f.encrypt(plaintext.encode("utf-8")).decode("ascii")


def decrypt_field(stored: str | None) -> str | None:
    """Descifra un campo. Soporta valores legacy en claro (sin prefijo enc:)
    y tokens corruptos (devuelve None antes que romper la respuesta)."""
    if stored is None:
        return None
    if not stored.startswith("enc:"):
        return stored
    f = _get_fernet()
    if f is None:
        return None
    try:
        return f.decrypt(stored[4:].encode("ascii")).decode("utf-8")
    except Exception:
        return None
