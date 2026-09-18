import logging
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any, List
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
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.database import db_manager
from app.schemas.schemas import GameBoardResponse, GenerateBoardRequest
from app.services.ai_service import ai_service
from app.builders.builder import GameBoardBuilder
from app.websockets.manager import connection_manager
from app.services.voice_service import voice_service
from app.services.psychology_service import psychology_service, PsychologyAnalysisResult
from app.models.user import (
    UserRegisterRequest, 
    UserUpdateRequest, 
    UserProfileResponse,
    UserAuthRegisterRequest,
    UserAuthLoginRequest,
    AuthResponse
)

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
    Recibe un texto denso de estudio, invoca a Gemini para extraer conceptos clave
    calibrados al nivel (1 a 5) y cantidad requerida (3, 5, 8, 15, 20),
    ensambla el GameBoardResponse con el Builder y persiste el tablero y materiales
    en MongoDB y Qdrant Vector DB.
    Si force_refresh=False y ya fue analizado previamente en MongoDB para ese nivel,
    reutiliza el análisis al instante (0 ms de espera).
    """
    level = getattr(payload, 'level', 1) or 1
    question_count = getattr(payload, 'question_count', 3) or 3
    difficulty = getattr(payload, 'difficulty', 'facil') or 'facil'

    # 1. Calcular hash criptográfico SHA-256 incluyendo texto, nivel y cantidad de preguntas
    cache_signature = f"{payload.text.strip()}_lvl{level}_qc{question_count}_{difficulty}"
    content_hash = hashlib.sha256(cache_signature.encode("utf-8")).hexdigest()

    # 2. Reutilización instantánea: Consultar si ya existe un análisis para este nivel
    if not force_refresh and db_manager.db is not None:
        try:
            cached_doc = await db_manager.db["cached_analyses"].find_one({"content_hash": content_hash})
            if cached_doc and "board" in cached_doc:
                logger.info(f"⚡ REUTILIZANDO ANÁLISIS PREVIO ({content_hash[:10]}... Nivel {level}, {question_count} reactivos): Tablero cargado desde caché en MongoDB.")
                return GameBoardResponse(**cached_doc["board"])
        except Exception as ce:
            logger.warning(f"Error consultando caché de análisis: {ce}")

    try:
        ai_data = ai_service.extract_concepts_from_text(
            payload.text, 
            variation_seed=variation_seed,
            question_count=question_count,
            difficulty=difficulty,
            level=level
        )
        
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

        # REGLA: AGREGAR EXACTAMENTE EL 30% DEL TOTAL DE PREGUNTAS EN CARTAS CON FALSAS RESPUESTAS (DISTRACTORES)
        distractor_count = max(1, round(len(concepts) * 0.30))
        ai_distractors = ai_data.get("distractors", [])
        
        for d_idx in range(distractor_count):
            card_id = f"card_distractor_{d_idx + 1}"
            if d_idx < len(ai_distractors) and ai_distractors[d_idx].get("concept_name"):
                d_item = ai_distractors[d_idx]
                concept_name = d_item.get("concept_name")
                content = d_item.get("content", "Concepto distractor no aplicable a los reactivos planteados.")
                mult = d_item.get("points_multiplier", "1x")
            else:
                # Fallback verosímil contextual
                concept_name = f"Enfoque Antagónico {d_idx + 1}"
                content = "Concepto no correspondiente a las preguntas del circuito."
                mult = "1x"

            builder.add_card(
                card_id=card_id,
                concept_name=concept_name,
                content=content,
                points_multiplier=mult
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
# ==========================================
# UTILIDADES Y ENDPOINTS: AUTENTICACIÓN (EMAIL + PASSWORD)
# ==========================================
import secrets

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Genera hash seguro sha256 con salt para contraseñas."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return f"{salt}${hashed}"

def verify_password(stored_password_hash: str, provided_password: str) -> bool:
    """Verifica si la contraseña provista coincide con el hash almacenado."""
    try:
        salt, expected_hash = stored_password_hash.split("$")
        calculated = hashlib.sha256((salt + provided_password).encode("utf-8")).hexdigest()
        return secrets.compare_digest(calculated, expected_hash)
    except Exception:
        return False

# Almacén de fallback en memoria para sesiones, usuarios y carpetas locales
in_memory_auth_users = {}
in_memory_study_folders: Dict[str, Any] = {}

@app.post("/api/v1/auth/register", response_model=AuthResponse, tags=["Authentication"])
async def auth_register(payload: UserAuthRegisterRequest):
    """
    Registra una nueva cuenta de usuario con correo, contraseña, nombre, sexo y edad.
    Asegura email único y encriptación de credenciales.
    """
    clean_email = payload.email.strip().lower()
    clean_username = payload.username.strip()
    norm_gender = payload.gender.strip().lower()

    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Por favor ingresa un correo electrónico válido.")

    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres.")

    # Regla de voz complementaria de Capi
    if norm_gender in ("masculino", "hombre", "varon"):
        assigned_voice = "female"
    elif norm_gender in ("femenino", "mujer", "dama"):
        assigned_voice = "male"
    else:
        assigned_voice = "female"

    if payload.voice_preference and payload.voice_preference in ("female", "male"):
        assigned_voice = payload.voice_preference

    pwd_hash = hash_password(payload.password)
    user_id = f"user_{hashlib.md5(clean_email.encode()).hexdigest()[:10]}"
    token = secrets.token_hex(24)

    user_doc = {
        "email": clean_email,
        "password_hash": pwd_hash,
        "username": clean_username,
        "gender": norm_gender,
        "age": payload.age,
        "avatar": payload.avatar or "capy_fan",
        "voice_preference": payload.voice_preference or "auto",
        "assigned_voice_gender": assigned_voice,
        "created_at": "now"
    }

    if db_manager.db is not None:
        try:
            existing = await db_manager.db["users"].find_one({"email": clean_email})
            if existing:
                raise HTTPException(status_code=400, detail="Ya existe una cuenta registrada con este correo electrónico.")
            
            res = await db_manager.db["users"].insert_one(user_doc)
            user_id = str(res.inserted_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error registrando en MongoDB: {e}")
            in_memory_auth_users[clean_email] = {**user_doc, "id": user_id}
    else:
        if clean_email in in_memory_auth_users:
            raise HTTPException(status_code=400, detail="Ya existe una cuenta registrada con este correo electrónico.")
        in_memory_auth_users[clean_email] = {**user_doc, "id": user_id}

    profile = UserProfileResponse(
        id=user_id,
        email=clean_email,
        username=clean_username,
        gender=norm_gender,
        age=payload.age,
        avatar=payload.avatar or "capy_fan",
        voice_preference=payload.voice_preference or "auto",
        assigned_voice_gender=assigned_voice,
        created_at="now"
    )

    return AuthResponse(token=token, user=profile)

@app.post("/api/v1/auth/login", response_model=AuthResponse, tags=["Authentication"])
async def auth_login(payload: UserAuthLoginRequest):
    """
    Inicia sesión con correo y contraseña.
    Valida credenciales y retorna el perfil de usuario activo con su token.
    """
    clean_email = payload.email.strip().lower()
    provided_password = payload.password

    user_data = None
    user_id = None

    if db_manager.db is not None:
        try:
            user_db = await db_manager.db["users"].find_one({"email": clean_email})
            if user_db:
                user_data = user_db
                user_id = str(user_db["_id"])
        except Exception as e:
            logger.error(f"Error buscando usuario en MongoDB: {e}")

    if not user_data and clean_email in in_memory_auth_users:
        user_data = in_memory_auth_users[clean_email]
        user_id = user_data.get("id")

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas. No existe una cuenta con este correo."
        )

    stored_hash = user_data.get("password_hash")
    if not stored_hash or not verify_password(stored_hash, provided_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña incorrecta. Por favor verifica tus credenciales."
        )

    token = secrets.token_hex(24)
    profile = UserProfileResponse(
        id=user_id,
        email=user_data.get("email", clean_email),
        username=user_data.get("username", "Estudiante"),
        gender=user_data.get("gender", "masculino"),
        age=user_data.get("age", 20),
        avatar=user_data.get("avatar", "capy_fan"),
        voice_preference=user_data.get("voice_preference", "auto"),
        assigned_voice_gender=user_data.get("assigned_voice_gender", "female"),
        created_at=str(user_data.get("created_at", "now"))
    )

    return AuthResponse(token=token, user=profile)

@app.get("/api/v1/auth/me", response_model=UserProfileResponse, tags=["Authentication"])
async def auth_get_current_user(email: Optional[str] = None, user_id: Optional[str] = None):
    """Retorna el perfil del usuario actual según su email o id."""
    if not email and not user_id:
        raise HTTPException(status_code=400, detail="Se requiere email o user_id.")
    
    if db_manager.db is not None:
        try:
            from bson import ObjectId
            query = {}
            if email:
                query["email"] = email.strip().lower()
            elif user_id and len(user_id) == 24:
                query["_id"] = ObjectId(user_id)
            elif user_id:
                query["id"] = user_id

            u = await db_manager.db["users"].find_one(query)
            if u:
                return UserProfileResponse(
                    id=str(u["_id"]),
                    email=u.get("email"),
                    username=u.get("username", "Estudiante"),
                    gender=u.get("gender", "masculino"),
                    age=u.get("age", 20),
                    avatar=u.get("avatar", "capy_fan"),
                    voice_preference=u.get("voice_preference", "auto"),
                    assigned_voice_gender=u.get("assigned_voice_gender", "female"),
                    created_at=str(u.get("created_at", "now"))
                )
        except Exception as e:
            logger.error(f"Error consultando auth/me en MongoDB: {e}")

    # Fallback in-memory
    if email and email.strip().lower() in in_memory_auth_users:
        u = in_memory_auth_users[email.strip().lower()]
        return UserProfileResponse(
            id=u.get("id"),
            email=u.get("email"),
            username=u.get("username"),
            gender=u.get("gender"),
            age=u.get("age"),
            avatar=u.get("avatar"),
            voice_preference=u.get("voice_preference"),
            assigned_voice_gender=u.get("assigned_voice_gender"),
            created_at=str(u.get("created_at", "now"))
        )

    raise HTTPException(status_code=404, detail="Usuario no encontrado.")

# ==========================================
# ENDPOINTS: GESTIÓN Y REGISTRO DE USUARIOS
# ==========================================
@app.post("/api/v1/users/register", response_model=UserProfileResponse, tags=["Users"])
async def register_or_login_user(payload: UserRegisterRequest):
    """
    Registra o inicia sesión para un usuario con su nombre de usuario, sexo y edad.
    Asigna automáticamente el género de voz del Capibara:
    - Hombre -> Voz Femenina dulce y maternal.
    - Mujer -> Voz Masculina cálida y sabia.
    """
    clean_username = payload.username.strip()
    norm_gender = payload.gender.strip().lower()
    
    # Asignación de voz complementaria
    if norm_gender in ("masculino", "hombre", "varon"):
        assigned_voice = "female"
    elif norm_gender in ("femenino", "mujer", "dama"):
        assigned_voice = "male"
    else:
        assigned_voice = "female"

    if payload.voice_preference and payload.voice_preference in ("female", "male"):
        assigned_voice = payload.voice_preference

    user_doc = {
        "username": clean_username,
        "gender": norm_gender,
        "age": payload.age,
        "avatar": payload.avatar or "capy_fan",
        "voice_preference": payload.voice_preference or "auto",
        "assigned_voice_gender": assigned_voice,
        "updated_at": "now"
    }

    if db_manager.db is not None:
        try:
            # Buscar si ya existe por nombre de usuario (case-insensitive)
            existing = await db_manager.db["users"].find_one({
                "username": {"$regex": f"^{clean_username}$", "$options": "i"}
            })
            if existing:
                # Actualizar datos recientes (edad, sexo si cambiaron)
                await db_manager.db["users"].update_one(
                    {"_id": existing["_id"]},
                    {"$set": {
                        "gender": norm_gender,
                        "age": payload.age,
                        "assigned_voice_gender": assigned_voice,
                        "avatar": payload.avatar or existing.get("avatar", "capy_fan"),
                        "voice_preference": payload.voice_preference or existing.get("voice_preference", "auto")
                    }}
                )
                existing_id = str(existing["_id"])
                return UserProfileResponse(
                    id=existing_id,
                    username=existing["username"],
                    gender=norm_gender,
                    age=payload.age,
                    avatar=payload.avatar or existing.get("avatar", "capy_fan"),
                    voice_preference=payload.voice_preference or existing.get("voice_preference", "auto"),
                    assigned_voice_gender=assigned_voice,
                    created_at=str(existing.get("created_at", "now"))
                )
            
            # Nuevo usuario
            user_doc["created_at"] = "now"
            res = await db_manager.db["users"].insert_one(user_doc)
            user_doc["id"] = str(res.inserted_id)
            return UserProfileResponse(**user_doc)
        except Exception as e:
            logger.error(f"Error registrando usuario en MongoDB: {e}")

    # Fallback sin base de datos activa
    fallback_id = f"user_{hashlib.md5(clean_username.lower().encode()).hexdigest()[:8]}"
    return UserProfileResponse(
        id=fallback_id,
        username=clean_username,
        gender=norm_gender,
        age=payload.age,
        avatar=payload.avatar or "capy_fan",
        voice_preference=payload.voice_preference or "auto",
        assigned_voice_gender=assigned_voice,
        created_at="now"
    )

@app.get("/api/v1/users/{user_id}", response_model=UserProfileResponse, tags=["Users"])
async def get_user_profile(user_id: str):
    """Obtiene el perfil del usuario."""
    if db_manager.db is not None:
        try:
            from bson import ObjectId
            query = {"_id": ObjectId(user_id)} if len(user_id) == 24 else {"id": user_id}
            user = await db_manager.db["users"].find_one(query)
            if user:
                user["id"] = str(user["_id"])
                del user["_id"]
                return UserProfileResponse(**user)
        except Exception as e:
            logger.error(f"Error consultando usuario: {e}")
    raise HTTPException(status_code=404, detail="Usuario no encontrado.")

# ==========================================
# ENDPOINT: GESTIÓN DE CARPETAS DE ESTUDIO (AISLADAS POR USUARIO)
# ==========================================
class FolderCreateRequest(BaseModel):
    name: str
    description: Optional[str] = "Carpeta de estudio"
    icon: Optional[str] = "folder"
    color: Optional[str] = "emerald"
    user_id: Optional[str] = None

@app.get("/api/v1/folders", tags=["Folders"])
async def list_folders(user_id: Optional[str] = Query(None, description="ID del usuario para aislar sus carpetas")):
    """Retorna las carpetas creadas con sus juegos y preguntas asociadas al usuario solicitante."""
    folders = []
    if db_manager.db is not None:
        try:
            query = {}
            if user_id:
                query["user_id"] = user_id
            cursor = db_manager.db["study_folders"].find(query).sort("_id", -1)
            async for doc in cursor:
                doc["id"] = str(doc["_id"])
                del doc["_id"]
                folders.append(doc)
        except Exception as e:
            logger.error(f"Error listando carpetas de MongoDB: {e}")

    # Fallback en memoria si no hay base de datos o está vacía
    if not folders and in_memory_study_folders:
        for f in in_memory_study_folders.values():
            if not user_id or f.get("user_id") == user_id:
                folders.append(f)

    return {"folders": folders}

@app.post("/api/v1/folders", status_code=status.HTTP_201_CREATED, tags=["Folders"])
async def create_folder(payload: FolderCreateRequest):
    """Crea una nueva carpeta temática de estudio vinculada exclusivamente a su usuario."""
    folder_id = f"folder_{payload.name.lower().replace(' ', '_')}_{secrets.token_hex(4)}"
    new_folder = {
        "id": folder_id,
        "name": payload.name,
        "description": payload.description,
        "icon": payload.icon or "folder",
        "color": payload.color or "emerald",
        "user_id": payload.user_id or "default_user",
        "created_at": "now",
        "documents": [],
        "games": []
    }
    if db_manager.db is not None:
        try:
            res = await db_manager.db["study_folders"].insert_one(dict(new_folder))
            new_folder["id"] = str(res.inserted_id)
            if "_id" in new_folder:
                del new_folder["_id"]
            return new_folder
        except Exception as e:
            logger.error(f"Error guardando carpeta en MongoDB: {e}")

    # Almacenar en memoria local cuando no hay MongoDB
    in_memory_study_folders[new_folder["id"]] = new_folder
    return new_folder


class AddDocsToFolderRequest(BaseModel):
    documents: list

@app.post("/api/v1/folders/{folder_id}/documents", tags=["Folders"])
async def add_documents_to_folder(folder_id: str, payload: AddDocsToFolderRequest):
    """Guarda documentos dentro de una carpeta en MongoDB o fallback local."""
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

    if folder_id in in_memory_study_folders:
        in_memory_study_folders[folder_id].setdefault("documents", []).extend(payload.documents)
        return {"status": "documents_added", "count": len(payload.documents)}
    return {"status": "acknowledged"}

class AddGameToFolderRequest(BaseModel):
    game: dict

@app.post("/api/v1/folders/{folder_id}/games", tags=["Folders"])
async def add_game_to_folder(folder_id: str, payload: AddGameToFolderRequest):
    """Guarda una partida o juego generado dentro de la carpeta en MongoDB o fallback local."""
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

    if folder_id in in_memory_study_folders:
        in_memory_study_folders[folder_id].setdefault("games", []).append(payload.game)
        return {"status": "game_added"}
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

    if folder_id in in_memory_study_folders:
        docs = in_memory_study_folders[folder_id].get("documents", [])
        in_memory_study_folders[folder_id]["documents"] = [d for d in docs if d.get("id") != doc_id and d.get("name") != doc_id]
        return {"status": "document_deleted", "doc_id": doc_id}

    return {"status": "acknowledged"}

@app.delete("/api/v1/folders/{folder_id}", tags=["Folders"])
async def delete_folder(folder_id: str):
    """Elimina una carpeta completa de estudio y todos sus documentos en MongoDB o local."""
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

    in_memory_study_folders.pop(folder_id, None)
    return {"status": "folder_deleted", "folder_id": folder_id}


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
    else:
        if folder_id in in_memory_study_folders:
            in_memory_study_folders[folder_id].setdefault("documents", []).append(doc_record)
        else:
            in_memory_study_folders[folder_id] = {
                "id": folder_id,
                "name": folder_id.replace("folder_", "").replace("_", " ").title(),
                "documents": [doc_record],
                "games": [],
                "created_at": "now"
            }

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
    force: bool = Query(False, description="Forzar regeneración de preguntas nuevas sin usar caché"),
    level: int = Query(1, ge=1, le=5, description="Nivel de dificultad (1 a 5)"),
    question_count: Optional[int] = Query(None, ge=1, le=30, description="Cantidad exacta de preguntas requeridas"),
    difficulty: Optional[str] = Query(None, description="Dificultad: facil, seminormal, normal, semidificil, dificil")
):
    """
    Genera un tablero de juego usando EXCLUSIVAMENTE el texto extraído de los documentos
    almacenados en esta carpeta específica, calibrado exactamente para el NIVEL indicado (1 al 5).
    Nivel 1: Fácil (3 preguntas).
    Nivel 2: Semi-normal (5 preguntas).
    Nivel 3: Normal (8 preguntas).
    Nivel 4: Semi-difícil (15 preguntas).
    Nivel 5: Difícil (20 preguntas).
    """
    level_defaults = {
        1: (3, "facil"),
        2: (5, "seminormal"),
        3: (8, "normal"),
        4: (15, "semidificil"),
        5: (20, "dificil")
    }
    def_qc, def_diff = level_defaults.get(level, (3, "facil"))
    final_qc = question_count if question_count is not None else def_qc
    final_diff = difficulty if difficulty is not None else def_diff

    # Obtener la carpeta y sus documentos
    folder_doc = None
    if db_manager.db is not None:
        try:
            from bson import ObjectId
            try:
                folder_doc = await db_manager.db["study_folders"].find_one({"_id": ObjectId(folder_id)})
            except Exception:
                folder_doc = None

            if not folder_doc:
                folder_doc = await db_manager.db["study_folders"].find_one({"$or": [{"id": folder_id}, {"_id": folder_id}]})
        except Exception as e:
            logger.error(f"Error consultando carpeta {folder_id}: {e}")

    # Fallback si no hay base de datos o no se encontró en MongoDB
    if not folder_doc and folder_id in in_memory_study_folders:
        folder_doc = in_memory_study_folders[folder_id]

    if not folder_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Carpeta '{folder_id}' no encontrada."
        )

    documents = folder_doc.get("documents", [])
    folder_name = folder_doc.get("name", "Asignatura")
    folder_description = folder_doc.get("description", "")

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

    combined_text = (
        f"ASIGNATURA / MATERIA: {folder_name}\n"
        f"DESCRIPCIÓN: {folder_description}\n\n"
        + "\n\n".join(texts_with_source)
    )[:500000]

    folder_content_hash = hashlib.sha256(
        f"{combined_text.strip()}_lvl{level}_qc{final_qc}_{final_diff}".encode("utf-8")
    ).hexdigest()

    # 1. VERIFICAR SI LA CARPETA YA TIENE UN ANÁLISIS GUARDADO PARA ESTE NIVEL
    if not force and db_manager.db is not None:
        try:
            cached_folder_analysis = await db_manager.db["cached_analyses"].find_one({"content_hash": folder_content_hash})
            if cached_folder_analysis and "board" in cached_folder_analysis:
                logger.info(f"⚡ REUTILIZANDO ANÁLISIS DE CARPETA '{folder_name}' (Nivel {level}, {final_qc} preguntas): Recuperado de MongoDB al instante.")
                return GameBoardResponse(**cached_folder_analysis["board"])
        except Exception as cache_err:
            logger.warning(f"Error verificando análisis guardado de carpeta: {cache_err}")

    logger.info(
        f"Generando juego para carpeta '{folder_name}' ({folder_id}) [Nivel {level} ({final_diff}), {final_qc} preguntas, force={force}]: "
        f"{len(texts_with_source)} documentos, {len(combined_text)} caracteres."
    )

    seed = random.randint(1, 99999) if force else 0
    board_response = await generate_arena_board(
        GenerateBoardRequest(
            text=combined_text,
            level=level,
            question_count=final_qc,
            difficulty=final_diff
        ),
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

class CapySpeechRequest(BaseModel):
    situation: str = "correct"
    level: int = 1
    theme: str = ""
    history: List[str] = Field(default_factory=list)

@app.post("/api/v1/arena/capy-speech", tags=["Arena"])
async def get_capy_speech(payload: CapySpeechRequest):
    """Genera locución dinámica y serena de Capi como psicólogo cognitivo sin piropos y con no-repetición estricta."""
    speech = ai_service.generate_capy_speech(
        situation=payload.situation,
        level=payload.level,
        theme=payload.theme,
        history=payload.history
    )
    return {"speech": speech, "level": payload.level, "situation": payload.situation}

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
# ENDPOINT: VOZ TERAPÉUTICA ELEVENLABS / EDGE-TTS (CAPI PSICÓLOGO)
# ==========================================
class SpeechRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None
    profile: Optional[str] = "loving_psychologist" # "loving_psychologist" | "crisis_soothing" | "anxiety_relief" | "zen" | "cute"
    stress_level: Optional[float] = None
    voice_gender: Optional[str] = None # "female" | "male"
    user_gender: Optional[str] = None # "masculino" | "femenino"

@app.post("/api/v1/voice/speak", tags=["Voice"])
async def speak_zen_voice(payload: SpeechRequest):
    """
    Genera audio adaptando prosodia y género de voz:
    - Si el usuario es hombre -> Voz femenina dulce y maternal.
    - Si la usuaria es mujer -> Voz masculina sabia y serena.
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
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo generar el audio."
        )
    return Response(content=audio_bytes, media_type="audio/mpeg")



# ==========================================
# ENDPOINT: ASISTENTE INTERACTIVO DE VOZ CAPI
# ==========================================
class CapyAskRequest(BaseModel):
    message: str
    nodes: Optional[list] = []
    hand: Optional[list] = []
    theme: Optional[str] = ""
    user_profile: Optional[dict] = None # { username, gender, age }

@app.post("/api/v1/arena/capy-ask", tags=["Arena"])
async def ask_capybara(payload: CapyAskRequest):
    """
    Recibe la transcripción del micrófono del usuario y genera una pista pedagógica
    o intervención empática anti-estrés evaluada con NLP clínico y Gemini,
    personalizada según el nombre, edad y género del estudiante.
    """
    result = ai_service.generate_capy_response_with_psychology(
        user_message=payload.message,
        nodes_context=payload.nodes or [],
        hand_context=payload.hand or [],
        theme=payload.theme or "",
        user_profile=payload.user_profile or {}
    )
    return result



# ==========================================
# ENDPOINTS: PSICOLOGÍA CLÍNICA Y ANTI-ESTRÉS NLP
# ==========================================
class PsychologyAnalyzeRequest(BaseModel):
    text: str
    context: Optional[dict] = None

@app.post("/api/v1/psychology/analyze", response_model=PsychologyAnalysisResult, tags=["Psychology"])
async def analyze_student_stress(payload: PsychologyAnalyzeRequest):
    """
    Analiza el nivel de estrés, emociones, distorsiones cognitivas TCC y recomienda intervenciones somáticas.
    """
    return psychology_service.analyze_emotional_state(payload.text, context=payload.context)

@app.get("/api/v1/psychology/protocols", tags=["Psychology"])
async def get_anti_stress_protocols():
    """
    Retorna los protocolos clínicos de reducción de estrés y ansiedad basados en evidencia (4-7-8, suspiro fisiológico, 5-4-3-2-1).
    """
    return psychology_service.get_protocols()

class PsychologyReframeRequest(BaseModel):
    thought: str

@app.post("/api/v1/psychology/reframe", tags=["Psychology"])
async def reframe_negative_thought(payload: PsychologyReframeRequest):
    """
    Reestructura pensamientos catastróficos o autocríticos mediante TCC para aliviar la ansiedad ante exámenes.
    """
    return psychology_service.reframe_negative_thought(payload.thought)




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
