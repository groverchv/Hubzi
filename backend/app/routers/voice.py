import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel

from app.core.rate_limit import limiter
from app.services.voice_service import voice_service

logger = logging.getLogger("hubzy.voice")
router = APIRouter(prefix="/api/v1/voice", tags=["Voice"])


class SpeechRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None
    profile: Optional[str] = "loving_psychologist"  # "loving_psychologist" | "crisis_soothing" | "anxiety_relief" | "zen" | "cute"
    stress_level: Optional[float] = None
    voice_gender: Optional[str] = None  # "female" | "male"
    user_gender: Optional[str] = None  # "masculino" | "femenino"


@router.post("/speak")
@limiter.limit("30/minute")
async def speak_zen_voice(request: Request, payload: SpeechRequest):
    """
    Genera audio adaptando prosodia y género de voz:
    - Si el usuario es hombre → voz femenina dulce y maternal.
    - Si la usuaria es mujer → voz masculina sabia y serena.
    """
    audio_bytes = await voice_service.generate_speech(
        payload.text,
        voice_id=payload.voice_id,
        profile=payload.profile or "loving_psychologist",
        stress_level=payload.stress_level,
        voice_gender=payload.voice_gender,
        user_gender=payload.user_gender
    )
    if not audio_bytes:
        raise HTTPException(
            status_code=503,
            detail="No se pudo generar el audio."
        )
    return Response(content=audio_bytes, media_type="audio/mpeg")
