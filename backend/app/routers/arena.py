import hashlib
import logging
from typing import Optional, List

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from pydantic import BaseModel, Field

from app.core.age_bands import band_for_age
from app.core.plans import enforce_question_limit
from app.core.rate_limit import limiter
from app.core.security import get_optional_user, get_user_plan
from app.schemas.schemas import GameBoardResponse, GenerateBoardRequest
from app.services.ai_service import ai_service
from app.services.board_service import generate_board

logger = logging.getLogger("hubzy.arena")
router = APIRouter(prefix="/api/v1/arena", tags=["Arena"])

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


def _validate_upload(file_bytes: bytes, filename: str):
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"El archivo '{filename}' supera el tamaño máximo permitido de 25 MB."
        )
    lower_f = filename.lower()
    if lower_f.endswith(".pdf") and not file_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo PDF no tiene una cabecera binaria válida o está corrupto."
        )
    if lower_f.endswith(".docx") and not file_bytes.startswith(b"PK\x03\x04"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo Word (.docx) no tiene una estructura de compresión válida."
        )


@router.post("/generate", response_model=GameBoardResponse, status_code=status.HTTP_200_OK)
@limiter.limit("20/minute")
async def generate_arena_board(
    request: Request,
    payload: GenerateBoardRequest,
    force_refresh: bool = False,
    variation_seed: int = 0,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """
    Recibe un texto denso de estudio, invoca a Gemini para extraer conceptos clave
    calibrados al nivel y cantidad requerida, y ensambla el GameBoardResponse.
    """
    plan = get_user_plan(current_user)
    payload.question_count = enforce_question_limit(plan, payload.question_count) or payload.question_count
    uid = str(current_user.get("id") or current_user.get("_id")) if current_user else None
    if current_user:
        payload.age_band = payload.age_band or current_user.get("age_band") or band_for_age(current_user.get("age"))
        payload.gender = payload.gender or current_user.get("gender")
    return await generate_board(payload, force_refresh=force_refresh, variation_seed=variation_seed, user_id=uid)


@router.post("/upload-and-generate", response_model=GameBoardResponse, status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def upload_and_generate_arena_board(
    request: Request,
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """
    Recibe un documento real (PDF, TXT, imagen), extrae su texto con pipeline
    híbrido OCR/Gemini y genera o reutiliza el tablero (caché SHA-256).
    """
    extracted_text = ""

    if file:
        file_bytes = await file.read()
        filename = file.filename or "archivo"
        _validate_upload(file_bytes, filename)
        try:
            extracted_text = ai_service.extract_document_text(file_bytes, filename)
            logger.info(f"Texto extraído del archivo '{filename}': {len(extracted_text)} caracteres")
        except Exception as e:
            logger.warning(f"Error extrayendo texto u OCR de '{filename}': {e}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Error al procesar el archivo: {str(e)}"
            )

    if raw_text and raw_text.strip():
        extracted_text = f"{extracted_text}\n\n{raw_text.strip()}" if extracted_text else raw_text.strip()

    if not extracted_text or len(extracted_text.strip()) < 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo o texto provisto no contiene suficiente contenido legible para extraer preguntas."
        )

    uid = str(current_user.get("id") or current_user.get("_id")) if current_user else None
    return await generate_board(GenerateBoardRequest(text=extracted_text), user_id=uid)


class CapySpeechRequest(BaseModel):
    situation: str = "correct"
    level: int = 1
    theme: str = ""
    history: List[str] = Field(default_factory=list)


@router.post("/capy-speech", tags=["Arena"])
async def get_capy_speech(payload: CapySpeechRequest):
    """Genera locución dinámica y serena de Capi como psicólogo cognitivo."""
    speech = ai_service.generate_capy_speech(
        situation=payload.situation,
        level=payload.level,
        theme=payload.theme,
        history=payload.history
    )
    return {"speech": speech, "level": payload.level, "situation": payload.situation}


class CapyAskRequest(BaseModel):
    message: str
    nodes: Optional[list] = []
    hand: Optional[list] = []
    theme: Optional[str] = ""
    user_profile: Optional[dict] = None


@router.post("/capy-ask", tags=["Arena"])
async def ask_capybara(payload: CapyAskRequest):
    """
    Recibe la transcripción del micrófono del usuario y genera una pista pedagógica
    o intervención empática anti-estrés evaluada con NLP clínico y Gemini.
    La respuesta puede incluir is_crisis=true → el frontend debe mostrar el
    protocolo de crisis (ver /api/v1/psychology/crisis-resources).
    """
    return ai_service.generate_capy_response_with_psychology(
        user_message=payload.message,
        nodes_context=payload.nodes or [],
        hand_context=payload.hand or [],
        theme=payload.theme or "",
        user_profile=payload.user_profile or {}
    )
