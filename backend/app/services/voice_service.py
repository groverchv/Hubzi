import logging
import urllib.request
import urllib.error
import json
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("hubzy.voice_service")

# Voz terapéutica femenina: Sarah (EXAVITQu4vr4xnSDxMaL)
# Profunda, serena y psicológicamente calibrada para meditación y reducción de ansiedad
DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"

class VoiceService:
    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY

    def generate_speech(self, text: str, voice_id: Optional[str] = None) -> Optional[bytes]:
        """
        Genera audio MP3 mediante la API oficial de ElevenLabs con perfil
        psicológico terapéutico: voz extremadamente pausada, estable y reconfortante.

        Parámetros sintonizados para sesión de relajación y mindfulness:
        - stability: 0.92  → Tono ultra-estable, sin variaciones emocionales bruscas
        - similarity_boost: 0.75 → Fidelidad natural sin artificialidad
        - style: 0.05      → Casi sin expresividad → tono neutro, sereno, de terapeuta
        - speed: 0.72      → Habla ~28% más lenta de lo normal (pausa terapéutica real)
        - use_speaker_boost: False → Sin realce artificial de energía vocal
        """
        if not self.api_key:
            logger.warning("ELEVENLABS_API_KEY no configurada.")
            return None

        v_id = voice_id or DEFAULT_VOICE_ID
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{v_id}"

        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key.strip()
        }

        # Perfil Psicológico Zen: voz pausada, estable, sin altibajos emocionales
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.92,          # Máxima estabilidad: tono sereno e invariable
                "similarity_boost": 0.75,   # Naturalidad vocal sin exagerar
                "style": 0.05,              # Sin expresividad: tono de terapeuta neutral
                "use_speaker_boost": False   # Sin realce de energía vocal
            },
            "pronunciation_dictionary_locators": [],
            # Velocidad: 0.72 es ~28% más lento que lo normal — deliberado, meditativo
            "speed": 0.72
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                if response.status == 200:
                    return response.read()
                logger.error(f"ElevenLabs devolvió status code: {response.status}")
                return None
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            logger.error(f"Error HTTP ElevenLabs: {e.code} - {err_body}")
            return None
        except Exception as e:
            logger.error(f"Error al conectar con ElevenLabs: {e}")
            return None

voice_service = VoiceService()
