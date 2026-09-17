import logging
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any
import io
import hashlib
import random
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import db_manager
from app.schemas.schemas import GameBoardResponse, GenerateBoardRequest
from app.services.ai_service import ai_service
from app.builders.builder import GameBoardBuilder
from app.websockets.manager import connection_manager
from app.services.voice_service import voice_service

logger = logging.getLogger("hubzy.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Conectar a MongoDB y Qdrant Vector DB al arrancar
    logger.info("Iniciando conexiones con MongoDB y Qdrant...")
    await db_manager.connect()
    yield
    # Cerrar conexiones al apagar
    await db_manager.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API para Hubzy (SynapseHub) - Gamificación EdTech anti-estrés con Gemini, MongoDB, Qdrant y WebSockets.",
    version=settings.VERSION,
    lifespan=lifespan
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", status_code=status.HTTP_200_OK, tags=["System"])
async def health_check():
    """Endpoint básico de monitoreo de salud del sistema."""
    mongo_status = "connected" if db_manager.db is not None else "disconnected"
    qdrant_status = "connected" if db_manager.qdrant_client is not None else "disconnected"
    return {
        "status": "healthy",
        "project": "Hubzy API",
        "team": "SynapseHub",
        "mode": "zen",
        "databases": {
            "mongodb": mongo_status,
            "mongodb_db": settings.MONGODB_DB_NAME,
            "qdrant": qdrant_status
        }
    }


# ==========================================
# ENDPOINT: GENERAR Y GUARDAR TABLERO
# ==========================================
@app.post(
    "/api/v1/arena/generate",
    response_model=GameBoardResponse,
    status_code=status.HTTP_200_OK,
    tags=["Arena"]
)
async def generate_arena_board(payload: GenerateBoardRequest, force_refresh: bool = False, variation_seed: int = 0):
    """
    Recibe un texto denso de estudio, invoca a Gemini para extraer 5 conceptos clave,
    ensambla el GameBoardResponse con el Builder y persiste el tablero y materiales
    en MongoDB y Qdrant Vector DB.
    Si force_refresh=False y ya fue analizado previamente en MongoDB,
    reutiliza el análisis al instante (0 ms de espera).
    Si force_refresh=True, bypasses la caché y genera reactivos nuevos con variation_seed.
    """
    # 1. Calcular hash criptográfico SHA-256 del texto a procesar
    content_hash = hashlib.sha256(payload.text.strip().encode("utf-8")).hexdigest()

    # 2. Reutilización instantánea: Consultar si ya existe un análisis para este documento/texto
    if not force_refresh and db_manager.db is not None:
        try:
            cached_doc = await db_manager.db["cached_analyses"].find_one({"content_hash": content_hash})
            if cached_doc and "board" in cached_doc:
                logger.info(f"⚡ REUTILIZANDO ANÁLISIS PREVIO ({content_hash[:10]}...): Tablero cargado desde caché en MongoDB sin llamar a Gemini.")
                return GameBoardResponse(**cached_doc["board"])
        except Exception as ce:
            logger.warning(f"Error consultando caché de análisis: {ce}")

    try:
        ai_data = ai_service.extract_concepts_from_text(payload.text, variation_seed=variation_seed)
        
        concepts = ai_data.get("concepts", [])
        if not concepts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudieron identificar conceptos válidos en el texto provisto."
            )

        builder = GameBoardBuilder(title=ai_data.get("title", "Tablero de Aprendizaje"))
        
        for idx, item in enumerate(concepts, start=1):
            card_id = f"card_{idx}"
            node_id = f"node_{idx}"
            
            builder.add_card(
                card_id=card_id,
                concept_name=item.get("concept_name", f"Concepto {idx}"),
                content=item.get("content", ""),
                points_multiplier=item.get("points_multiplier", "1x")
            )
            
            builder.add_node(
                node_id=node_id,
                correct_card_id=card_id,
                description=item.get("node_hint", f"Pista para el concepto {idx}"),
                question=item.get("node_question", None)
            )

        board_result = builder.build()

        # Guardar en MongoDB (colecciones: study_materials y game_boards)
        # Guardar en MongoDB (colecciones: study_materials, game_boards y cached_analyses para reutilización)
        if db_manager.db is not None:
            try:
                # 1. Guardar material analizado
                mat_doc = {
                    "content_hash": content_hash,
                    "text_preview": payload.text[:300],
                    "text_length": len(payload.text),
                    "created_at": "now",
                    "status": "processed"
                }
                await db_manager.db["study_materials"].insert_one(mat_doc)

                # 2. Guardar tablero generado
                board_dict = {
                    "id_tablero": board_result.id_tablero,
                    "title": board_result.title,
                    "nodes": [n.model_dump() for n in board_result.nodes],
                    "cards": [c.model_dump() for c in board_result.cards],
                    "created_at": "now"
                }
                await db_manager.db["game_boards"].insert_one(board_dict)
                logger.info(f"Tablero {board_result.id_tablero} guardado en MongoDB con éxito.")

                # 3. Guardar en cached_analyses para reutilización futura instantánea
                await db_manager.db["cached_analyses"].update_one(
                    {"content_hash": content_hash},
                    {"$set": {
                        "content_hash": content_hash,
                        "title": board_result.title,
                        "board": board_dict,
                        "ai_data": ai_data,
                        "updated_at": "now"
                    }},
                    upsert=True
                )
                logger.info(f"Tablero {board_result.id_tablero} guardado en MongoDB y en caché para reutilización futura.")
            except Exception as dbe:
                logger.warning(f"Error guardando tablero en MongoDB: {dbe}")

        return board_result

    except ValueError as ve:
        logger.warning(f"Error de formato IA: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except RuntimeError as re:
        logger.error(f"Error en comunicación con LLM: {re}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(re)
        )
    except Exception as ex:
        logger.error(f"Error inesperado procesando arena: {ex}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error inesperado al generar el tablero de juego."
        )


@app.post(
    "/api/v1/arena/upload-and-generate",
    response_model=GameBoardResponse,
    status_code=status.HTTP_200_OK,
    tags=["Arena"]
)
async def upload_and_generate_arena_board(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None)
):
    """
    Recibe un documento real (PDF, TXT, etc.), extrae su texto interno completo,
    lo procesa con Gemini para extraer conceptos y preguntas didácticas reales basadas en el contenido.
    Recibe un documento real (PDF, TXT, etc.), extrae su texto interno completo
    (usando OCR con Gemini en caso de PDFs escaneados o imágenes),
    y genera o reutiliza el tablero de juego para evitar re-análisis redundantes.
    """
    extracted_text = ""
    
    if file:
        file_bytes = await file.read()
        filename = file.filename or ""
        filename = file.filename or "archivo"
        try:
            extracted_text = ai_service.extract_document_text(file_bytes, filename)
            logger.info(f"Texto extraído del archivo '{filename}': {len(extracted_text)} caracteres")
        except Exception as e:
            logger.warning(f"Error extrayendo texto u OCR de '{filename}': {e}")
        except Exception as ee:
            logger.warning(f"Error en extracción híbrida de '{filename}': {ee}")

    # Combinar con texto adicional si existe
    if raw_text and raw_text.strip():
        if extracted_text:
            extracted_text = f"{extracted_text}\n\n{raw_text.strip()}"
        else:
            extracted_text = raw_text.strip()

    if not extracted_text or len(extracted_text.strip()) < 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo o texto provisto no contiene suficiente contenido legible para extraer preguntas."
        )

    # Reutilizar generate_arena_board pasando el texto interno real extraído
    # Reutilizar generate_arena_board pasando el texto interno real extraído (con caché SHA-256)
    return await generate_arena_board(GenerateBoardRequest(text=extracted_text))



# ==========================================
# ENDPOINT: GESTIÓN DE CARPETAS DE ESTUDIO (JUEGOS Y PREGUNTAS)
# ==========================================
class FolderCreateRequest(BaseModel):
    name: str
    description: Optional[str] = "Carpeta de estudio"
    icon: Optional[str] = "folder"
    color: Optional[str] = "emerald"

@app.get("/api/v1/folders", tags=["Folders"])
async def list_folders():
    """Retorna las carpetas creadas con sus juegos y preguntas asociadas."""
    folders = []
    if db_manager.db is not None:
        try:
            cursor = db_manager.db["study_folders"].find().sort("_id", -1)
            async for doc in cursor:
                doc["id"] = str(doc["_id"])
                del doc["_id"]
                folders.append(doc)
        except Exception as e:
            logger.error(f"Error listando carpetas de MongoDB: {e}")
    return {"folders": folders}

@app.post("/api/v1/folders", status_code=status.HTTP_201_CREATED, tags=["Folders"])
async def create_folder(payload: FolderCreateRequest):
    """Crea una nueva carpeta temática de estudio."""
    new_folder = {
        "name": payload.name,
        "description": payload.description,
        "icon": payload.icon or "folder",
        "color": payload.color or "emerald",
        "created_at": "now",
        "documents": [],
        "games": []
    }
    if db_manager.db is not None:
        try:
            res = await db_manager.db["study_folders"].insert_one(new_folder)
            new_folder["id"] = str(res.inserted_id)
            if "_id" in new_folder:
                del new_folder["_id"]
            return new_folder
        except Exception as e:
            logger.error(f"Error guardando carpeta en MongoDB: {e}")
            raise HTTPException(status_code=500, detail="No se pudo guardar la carpeta.")
    else:
        new_folder["id"] = f"folder_{payload.name.lower().replace(' ', '_')}"
        return new_folder

class AddDocsToFolderRequest(BaseModel):
    documents: list

@app.post("/api/v1/folders/{folder_id}/documents", tags=["Folders"])
async def add_documents_to_folder(folder_id: str, payload: AddDocsToFolderRequest):
    """Guarda documentos dentro de una carpeta en MongoDB."""
    if db_manager.db is not None:
        try:
            from bson import ObjectId
            query = {"_id": ObjectId(folder_id)} if len(folder_id) == 24 else {"id": folder_id}
            await db_manager.db["study_folders"].update_one(
                query,
                {"$push": {"documents": {"$each": payload.documents}}}
            )
            return {"status": "documents_added", "count": len(payload.documents)}
        except Exception as e:
            logger.warning(f"Error agregando documentos a carpeta en MongoDB: {e}")
    return {"status": "acknowledged"}

class AddGameToFolderRequest(BaseModel):
    game: dict

@app.post("/api/v1/folders/{folder_id}/games", tags=["Folders"])
async def add_game_to_folder(folder_id: str, payload: AddGameToFolderRequest):
    """Guarda una partida o juego generado dentro de la carpeta en MongoDB."""
    if db_manager.db is not None:
        try:
            from bson import ObjectId
            query = {"_id": ObjectId(folder_id)} if len(folder_id) == 24 else {"id": folder_id}
            await db_manager.db["study_folders"].update_one(
                query,
                {"$push": {"games": payload.game}}
            )
            return {"status": "game_added"}
        except Exception as e:
            logger.warning(f"Error agregando juego a carpeta en MongoDB: {e}")
    return {"status": "acknowledged"}

@app.delete("/api/v1/folders/{folder_id}/documents/{doc_id}", tags=["Folders"])
async def delete_document_from_folder(folder_id: str, doc_id: str):
    """
    Elimina un documento específico de una carpeta en MongoDB y limpia la caché
    de juego de la carpeta para que las futuras preguntas se generen únicamente
    con los documentos restantes.
    """
    if db_manager.db is not None:
        try:
            from bson import ObjectId
            query = {"_id": ObjectId(folder_id)} if len(folder_id) == 24 else {"id": folder_id}
            
            # Remover el documento por id o por nombre (para compatibilidad total)
            result = await db_manager.db["study_folders"].update_one(
                query,
                {
                    "$pull": {
                        "documents": {
                            "$or": [
                                {"id": doc_id},
                                {"name": doc_id}
                            ]
                        }
                    },
                    "$unset": {
                        "cached_board": "",
                        "cached_content_hash": ""
                    }
                }
            )
            logger.info(f"Documento '{doc_id}' eliminado de carpeta '{folder_id}'. Modificados: {result.modified_count}")
            return {"status": "document_deleted", "doc_id": doc_id}
        except Exception as e:
            logger.error(f"Error eliminando documento de carpeta en MongoDB: {e}")
            raise HTTPException(status_code=500, detail=f"Error al eliminar documento: {str(e)}")
            
    return {"status": "acknowledged"}

@app.delete("/api/v1/folders/{folder_id}", tags=["Folders"])
async def delete_folder(folder_id: str):
    """Elimina una carpeta completa de estudio y todos sus documentos en MongoDB."""
    if db_manager.db is not None:
        try:
            from bson import ObjectId
            query = {"_id": ObjectId(folder_id)} if len(folder_id) == 24 else {"id": folder_id}
            await db_manager.db["study_folders"].delete_one(query)
            logger.info(f"Carpeta '{folder_id}' eliminada con éxito de MongoDB.")
            return {"status": "folder_deleted", "folder_id": folder_id}
        except Exception as e:
            logger.error(f"Error eliminando carpeta de MongoDB: {e}")
            raise HTTPException(status_code=500, detail="Error al eliminar la carpeta.")
    return {"status": "acknowledged"}


@app.post("/api/v1/folders/{folder_id}/upload-document", tags=["Folders"])
async def upload_document_to_folder(
    folder_id: str,
    file: UploadFile = File(...)
):
    """
    Recibe un archivo real (PDF, TXT, imagen), extrae su texto interno completo
    y lo guarda dentro de la carpeta en MongoDB junto con sus metadatos.
    Este es el paso que garantiza que las preguntas salgan del contenido real del documento.
    """
    file_bytes = await file.read()
    filename = file.filename or "archivo"
    extracted_text = ""

    try:
        extracted_text = ai_service.extract_document_text(file_bytes, filename)
        logger.info(f"Texto extraído de '{filename}' (Pipeline Híbrido OCR/Nativo): {len(extracted_text)} caracteres")
    except Exception as e:
        logger.error(f"Error procesando '{filename}' con OCR/IA: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"No se pudo procesar '{filename}': {str(e)}"
        )

    if not extracted_text or len(extracted_text.strip()) < 15:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"No se pudo extraer texto legible de '{filename}'. Asegúrate de que el archivo o imagen contenga texto claro."
        )


    # Calcular hash de contenido único para este archivo
    content_hash = hashlib.sha256(file_bytes).hexdigest()

    # Verificar si este mismo archivo ya fue analizado antes en MongoDB para reutilizar su análisis
    existing_analysis = None
    if db_manager.db is not None:
        try:
            cached = await db_manager.db["cached_analyses"].find_one({"content_hash": content_hash})
            if cached and "ai_data" in cached:
                existing_analysis = cached["ai_data"]
                logger.info(f"Archivo '{filename}' coincide con análisis previo ({content_hash[:8]}). Vinculando caché...")
        except Exception as ex_c:
            logger.warning(f"Error buscando análisis previo para '{filename}': {ex_c}")

    doc_record = {
        "id": f"doc_{filename}_{len(file_bytes)}",
        "name": filename,
        "size": f"{len(file_bytes) / 1024:.1f} KB",
        "type": filename.split('.')[-1].lower(),
        "content_hash": content_hash,
        "extracted_text": extracted_text,
        "char_count": len(extracted_text),
        "is_analyzed": existing_analysis is not None,
        "analysis_result": existing_analysis,
        "uploaded_at": "now"
    }

    if db_manager.db is not None:
        try:
            from bson import ObjectId
            query = {"_id": ObjectId(folder_id)} if len(folder_id) == 24 else {"id": folder_id}
            await db_manager.db["study_folders"].update_one(
                query,
                {"$push": {"documents": doc_record}}
            )
        except Exception as e:
            logger.warning(f"Error guardando documento en MongoDB: {e}")

    # Devolver metadatos sin el texto completo (para el frontend)
    return {
        "status": "uploaded",
        "id": doc_record["id"],
        "name": doc_record["name"],
        "size": doc_record["size"],
        "type": doc_record["type"],
        "content_hash": content_hash,
        "is_analyzed": doc_record["is_analyzed"],
        "char_count": doc_record["char_count"],
        "uploaded_at": doc_record["uploaded_at"]
    }


@app.post(
    "/api/v1/folders/{folder_id}/generate-game",
    response_model=GameBoardResponse,
    status_code=status.HTTP_200_OK,
    tags=["Folders"]
)
async def generate_game_from_folder(
    folder_id: str,
    force: bool = Query(False, description="Forzar regeneración de preguntas nuevas sin usar caché")
):
    """
    Genera un tablero de juego usando EXCLUSIVAMENTE el texto extraído de los documentos
    almacenados en esta carpeta específica. No mezcla contenido de otras carpetas.
    No usa fuentes externas ni conocimiento general de la IA.
    Si force=True, regenera un nuevo conjunto de reactivos con preguntas frescas.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Base de datos no disponible. Verifica la conexión a MongoDB."
        )

    # Obtener la carpeta y sus documentos desde MongoDB
    folder_doc = None
    try:
        from bson import ObjectId
        # Intentar por ObjectId si es válido
        try:
            folder_doc = await db_manager.db["study_folders"].find_one({"_id": ObjectId(folder_id)})
        except Exception:
            folder_doc = None

        # Si no se encontró por ObjectId, buscar por campo "id" o "_id" como string
        if not folder_doc:
            folder_doc = await db_manager.db["study_folders"].find_one({"$or": [{"id": folder_id}, {"_id": folder_id}]})
    except Exception as e:
        logger.error(f"Error consultando carpeta {folder_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error consultando la carpeta: {str(e)}")

    if not folder_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Carpeta '{folder_id}' no encontrada en la base de datos."
        )

    documents = folder_doc.get("documents", [])
    folder_name = folder_doc.get("name", "Asignatura")
    folder_description = folder_doc.get("description", "")

    # Recolectar solo el texto extraído de los documentos que lo tengan
    texts_with_source = []
    for doc in documents:
        extracted = doc.get("extracted_text", "").strip()
        if extracted and len(extracted) > 20:
            texts_with_source.append(
                f"--- DOCUMENTO: {doc.get('name', 'Archivo')} ---\n{extracted}"
            )

    if not texts_with_source:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"La carpeta '{folder_name}' no tiene documentos con texto extraído. "
                "Sube tus archivos PDF desde dentro de la carpeta para que el sistema "
                "procese su contenido interno antes de generar el juego."
            )
        )

    # Concatenar texto de todos los documentos de esta carpeta analizando el documento completo
    combined_text = (
        f"ASIGNATURA / MATERIA: {folder_name}\n"
        f"DESCRIPCIÓN: {folder_description}\n\n"
        + "\n\n".join(texts_with_source)
    )[:500000]


    # Calcular hash de la combinación de documentos de la carpeta
    folder_content_hash = hashlib.sha256(combined_text.strip().encode("utf-8")).hexdigest()

    # 1. VERIFICAR SI LA CARPETA YA TIENE UN ANÁLISIS GUARDADO (SÓLO SI NO SE FORZA REGENERACIÓN)
    if not force and db_manager.db is not None:
        try:
            # Opción A: Análisis cacheado de toda la carpeta
            cached_folder_analysis = await db_manager.db["cached_analyses"].find_one({"content_hash": folder_content_hash})
            if cached_folder_analysis and "board" in cached_folder_analysis:
                logger.info(f"⚡ REUTILIZANDO ANÁLISIS DE CARPETA '{folder_name}': Recuperado de MongoDB al instante sin consultar a Gemini.")
                return GameBoardResponse(**cached_folder_analysis["board"])

            # Opción B: Si la carpeta misma tiene cached_board persistido
            if folder_doc.get("cached_board") and folder_doc.get("cached_content_hash") == folder_content_hash:
                logger.info(f"⚡ REUTILIZANDO TABLERO GUARDADO EN CARPETA '{folder_name}'.")
                return GameBoardResponse(**folder_doc["cached_board"])
        except Exception as cache_err:
            logger.warning(f"Error verificando análisis guardado de carpeta: {cache_err}")

    logger.info(
        f"Generando y analizando juego para carpeta '{folder_name}' ({folder_id}) [force={force}]: "
        f"{len(texts_with_source)} documentos, {len(combined_text)} caracteres de texto extraído."
    )

    # Generar tablero mediante IA analizando el documento completo (con seed aleatoria para preguntas frescas si force=True)
    seed = random.randint(1, 99999) if force else 0
    board_response = await generate_arena_board(
        GenerateBoardRequest(text=combined_text),
        force_refresh=force,
        variation_seed=seed
    )


    # Persistir el análisis y tablero dentro de la carpeta en MongoDB para reutilización futura
    if db_manager.db is not None:
        try:
            from bson import ObjectId
            query = {"_id": ObjectId(folder_id)} if len(folder_id) == 24 else {"id": folder_id}
            await db_manager.db["study_folders"].update_one(
                query,
                {"$set": {
                    "cached_board": board_response.model_dump(),
                    "cached_content_hash": folder_content_hash,
                    "last_analyzed_at": "now"
                }}
            )
            logger.info(f"Análisis guardado exitosamente en la carpeta '{folder_name}' en MongoDB.")
        except Exception as fe:
            logger.warning(f"Error guardando cached_board en la carpeta: {fe}")

    return board_response

@app.delete("/api/v1/folders/{folder_id}", tags=["Folders"])
async def delete_folder(folder_id: str):
    """Elimina una carpeta de estudio."""
    if db_manager.db is not None:
        try:
            from bson import ObjectId
            query = {"_id": ObjectId(folder_id)} if len(folder_id) == 24 else {"id": folder_id}
            await db_manager.db["study_folders"].delete_one(query)
            return {"status": "deleted"}
        except Exception as e:
            logger.warning(f"Error eliminando carpeta: {e}")
    return {"status": "acknowledged"}


# ==========================================
# ENDPOINT: REGISTRO DE BIENESTAR Y SESIÓN ZEN
# ==========================================
class ZenLogRequest(BaseModel):
    log_type: str = "breathing_session"
    duration_seconds: int = 60
    notes: Optional[str] = "Sesión completada con Capi Zen"

@app.post("/api/v1/zen/log", status_code=status.HTTP_201_CREATED, tags=["Zen"])
async def log_zen_session(payload: ZenLogRequest):
    """Guarda en MongoDB los ciclos de respiración o pausas activas completadas."""
    if db_manager.db is not None:
        try:
            res = await db_manager.db["zen_logs"].insert_one(payload.model_dump())
            return {"status": "saved", "id": str(res.inserted_id)}
        except Exception as e:
            logger.error(f"Error guardando zen log: {e}")
    return {"status": "acknowledged"}


# ==========================================
# ENDPOINT: VOZ TERAPÉUTICA ELEVENLABS
# ==========================================
class SpeechRequest(BaseModel):
    text: str

@app.post("/api/v1/voice/speak", tags=["Voice"])
async def speak_zen_voice(payload: SpeechRequest):
    """
    Genera audio terapéutico antiestrés y relajación mediante ElevenLabs.
    Devuelve stream de audio/mpeg para reproducción inmediata en frontend.
    """
    audio_bytes = voice_service.generate_speech(payload.text)
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo generar el audio con ElevenLabs."
        )
    return Response(content=audio_bytes, media_type="audio/mpeg")


# ==========================================
# WEBSOCKET MULTIPLAYER 1v1 ARENA EN VIVO
# ==========================================
@app.websocket("/ws/arena/{room_id}/{client_id}")
async def websocket_arena_endpoint(websocket: WebSocket, room_id: str, client_id: str):
    """
    Endpoint WebSocket bidireccional para batallas 1v1.
    Sincroniza presencia, asigna primer turno y alterna turnos en vivo.
    """
    await connection_manager.connect(websocket, room_id, client_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            logger.info(f"Evento recibido en sala {room_id} de {client_id}: {action}")

            # Si el jugador presiona END TURN, alternar el turno en la sala
            if action == "end_turn":
                await connection_manager.switch_turn(room_id, client_id)
                continue

            # Para movimientos de cartas y respuestas
            payload_to_broadcast = {
                "sender_id": client_id,
                "room_id": room_id,
                **data
            }

            # Si completó la partida o colocó carta, registrar sesión en BD
            if action in ("card_placed", "game_over") and db_manager.db is not None:
                try:
                    await db_manager.db["game_sessions"].insert_one({
                        "room_id": room_id,
                        "client_id": client_id,
                        "action": action,
                        "data": data
                    })
                except Exception as dbe:
                    logger.warning(f"Error guardando movimiento en MongoDB: {dbe}")

            await connection_manager.broadcast_to_room(
                room_id=room_id,
                message=payload_to_broadcast,
                exclude_client=client_id
            )

    except WebSocketDisconnect:
        disconnected_id = connection_manager.disconnect(websocket, room_id)
        logger.info(f"Desconexión limpia de {disconnected_id} de sala {room_id}")
        
        await connection_manager.broadcast_to_room(room_id, {
            "type": "player_left",
            "client_id": disconnected_id,
            "room_id": room_id,
            "total_players": connection_manager.get_room_players_count(room_id)
        })
    except Exception as e:
        logger.error(f"Error en WebSocket para {client_id} en sala {room_id}: {e}")
        connection_manager.disconnect(websocket, room_id)
