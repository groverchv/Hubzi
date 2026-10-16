import hashlib
import logging
import random
import secrets
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, Request, UploadFile, status
from pydantic import BaseModel

from app.core.database import db_manager
from app.core.plans import enforce_docs_limit, enforce_folder_limit, enforce_question_limit
from app.core.rate_limit import limiter
from app.core.security import (
    assert_can_access_user_resource,
    get_optional_user,
    get_user_plan,
    resolve_effective_user_id,
    utcnow_iso,
)
from app.core.session_store import in_memory_study_folders
from app.schemas.schemas import GameBoardResponse, GenerateBoardRequest
from app.services.ai_service import ai_service
from app.services.board_service import generate_board
from app.services.rag_service import rag_service
from app.routers.arena import _validate_upload

logger = logging.getLogger("hubzy.folders")
router = APIRouter(prefix="/api/v1/folders", tags=["Folders"])


def _folder_query(folder_id: str) -> dict:
    try:
        from bson import ObjectId
        if len(folder_id) == 24:
            return {"_id": ObjectId(folder_id)}
    except Exception:
        pass
    return {"$or": [{"id": folder_id}, {"_id": folder_id}]}


async def _load_folder(folder_id: str) -> Optional[dict]:
    if db_manager.db is not None:
        try:
            return await db_manager.db["study_folders"].find_one(_folder_query(folder_id))
        except Exception as e:
            logger.error(f"Error consultando carpeta {folder_id}: {e}")
    return in_memory_study_folders.get(folder_id)


class FolderCreateRequest(BaseModel):
    name: str
    description: Optional[str] = "Carpeta de estudio"
    icon: Optional[str] = "folder"
    color: Optional[str] = "emerald"
    user_id: Optional[str] = None  # ignorado si hay sesión autenticada


@router.get("")
async def list_folders(
    user_id: Optional[str] = Query(None, description="Solo para invitados sin sesión"),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """Retorna las carpetas del usuario efectivo (del token si hay sesión)."""
    effective_uid = resolve_effective_user_id(current_user, user_id)
    folders = []
    if db_manager.db is not None:
        try:
            cursor = db_manager.db["study_folders"].find(
                {"user_id": effective_uid},
                {"documents.text": 0, "documents.full_text": 0, "documents.extracted_text": 0,
                 "cached_board": 0, "cached_boards": 0}
            ).sort("_id", -1)
            async for doc in cursor:
                doc["id"] = str(doc["_id"])
                del doc["_id"]
                folders.append(doc)
        except Exception as e:
            logger.error(f"Error listando carpetas de MongoDB: {e}")

    if not folders and in_memory_study_folders:
        for f in in_memory_study_folders.values():
            if f.get("user_id") == effective_uid:
                folders.append({k: v for k, v in f.items() if k not in ("cached_board", "cached_boards")})

    return {"folders": folders, "plan": get_user_plan(current_user)}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_folder(
    payload: FolderCreateRequest,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """Crea una carpeta de estudio vinculada al usuario efectivo."""
    effective_uid = resolve_effective_user_id(current_user, payload.user_id)

    # Límite freemium
    if db_manager.db is not None:
        try:
            current_count = await db_manager.db["study_folders"].count_documents({"user_id": effective_uid})
            enforce_folder_limit(get_user_plan(current_user), current_count)
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"No se pudo verificar límite de carpetas: {e}")

    folder_id = f"folder_{payload.name.lower().replace(' ', '_')}_{secrets.token_hex(4)}"
    new_folder = {
        "id": folder_id,
        "name": payload.name,
        "description": payload.description,
        "icon": payload.icon or "folder",
        "color": payload.color or "emerald",
        "user_id": effective_uid,
        "created_at": utcnow_iso(),
        "documents": [],
        "games": []
    }
    if db_manager.db is not None:
        try:
            res = await db_manager.db["study_folders"].insert_one(dict(new_folder))
            new_folder["id"] = str(res.inserted_id)
            new_folder.pop("_id", None)
            return new_folder
        except Exception as e:
            logger.error(f"Error guardando carpeta en MongoDB: {e}")

    in_memory_study_folders[new_folder["id"]] = new_folder
    return new_folder


class AddDocsToFolderRequest(BaseModel):
    documents: list


@router.post("/{folder_id}/documents")
async def add_documents_to_folder(
    folder_id: str,
    payload: AddDocsToFolderRequest,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    folder_doc = await _load_folder(folder_id)
    if folder_doc:
        assert_can_access_user_resource(current_user, folder_doc.get("user_id"))
    if db_manager.db is not None:
        try:
            await db_manager.db["study_folders"].update_one(
                _folder_query(folder_id),
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


@router.post("/{folder_id}/games")
async def add_game_to_folder(
    folder_id: str,
    payload: AddGameToFolderRequest,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    folder_doc = await _load_folder(folder_id)
    if folder_doc:
        assert_can_access_user_resource(current_user, folder_doc.get("user_id"))
    if db_manager.db is not None:
        try:
            await db_manager.db["study_folders"].update_one(
                _folder_query(folder_id),
                {"$push": {"games": payload.game}}
            )
            return {"status": "game_added"}
        except Exception as e:
            logger.warning(f"Error agregando juego a carpeta en MongoDB: {e}")

    if folder_id in in_memory_study_folders:
        in_memory_study_folders[folder_id].setdefault("games", []).append(payload.game)
        return {"status": "game_added"}
    return {"status": "acknowledged"}


@router.delete("/{folder_id}/documents/{doc_id}")
async def delete_document_from_folder(
    folder_id: str,
    doc_id: str,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    folder_doc = await _load_folder(folder_id)
    if folder_doc:
        assert_can_access_user_resource(current_user, folder_doc.get("user_id"))

    if db_manager.db is not None:
        try:
            result = await db_manager.db["study_folders"].update_one(
                _folder_query(folder_id),
                {
                    "$pull": {"documents": {"$or": [{"id": doc_id}, {"name": doc_id}]}},
                    "$unset": {"cached_board": "", "cached_boards": "", "cached_content_hash": ""}
                }
            )
            logger.info(f"Documento '{doc_id}' eliminado de carpeta '{folder_id}'. Modificados: {result.modified_count}")
            await rag_service.delete_document_vectors(doc_id)
            return {"status": "document_deleted", "doc_id": doc_id}
        except Exception as e:
            logger.error(f"Error eliminando documento de carpeta en MongoDB: {e}")
            raise HTTPException(status_code=500, detail=f"Error al eliminar documento: {str(e)}")

    if folder_id in in_memory_study_folders:
        docs = in_memory_study_folders[folder_id].get("documents", [])
        in_memory_study_folders[folder_id]["documents"] = [
            d for d in docs if d.get("id") != doc_id and d.get("name") != doc_id
        ]
        await rag_service.delete_document_vectors(doc_id)
        return {"status": "document_deleted", "doc_id": doc_id}

    return {"status": "acknowledged"}


@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: str,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    folder_doc = await _load_folder(folder_id)
    if folder_doc:
        assert_can_access_user_resource(current_user, folder_doc.get("user_id"))

    if db_manager.db is not None:
        try:
            await db_manager.db["study_folders"].delete_one(_folder_query(folder_id))
            logger.info(f"Carpeta '{folder_id}' eliminada con éxito de MongoDB.")
            return {"status": "folder_deleted", "folder_id": folder_id}
        except Exception as e:
            logger.error(f"Error eliminando carpeta de MongoDB: {e}")
            raise HTTPException(status_code=500, detail="Error al eliminar la carpeta.")

    in_memory_study_folders.pop(folder_id, None)
    return {"status": "folder_deleted", "folder_id": folder_id}


@router.post("/{folder_id}/upload-document")
@limiter.limit("15/minute")
async def upload_document_to_folder(
    request: Request,
    folder_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """
    Sube un archivo real (PDF, TXT, imagen), extrae su texto completo y lo guarda
    en la carpeta. Indexa chunks en Qdrant (RAG) para búsqueda semántica.
    """
    folder_doc = await _load_folder(folder_id)
    if folder_doc:
        assert_can_access_user_resource(current_user, folder_doc.get("user_id"))
        enforce_docs_limit(get_user_plan(current_user), len(folder_doc.get("documents", [])))

    file_bytes = await file.read()
    filename = file.filename or "archivo"
    _validate_upload(file_bytes, filename)

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

    content_hash = hashlib.sha256(file_bytes).hexdigest()

    existing_analysis = None
    if db_manager.db is not None:
        try:
            cached = await db_manager.db["cached_analyses"].find_one({"content_hash": content_hash})
            if cached and "ai_data" in cached:
                existing_analysis = cached["ai_data"]
                logger.info(f"Archivo '{filename}' coincide con análisis previo ({content_hash[:8]}). Vinculando caché...")
        except Exception as ex_c:
            logger.warning(f"Error buscando análisis previo para '{filename}': {ex_c}")

    doc_id = f"doc_{filename}_{len(file_bytes)}"
    doc_record = {
        "id": doc_id,
        "name": filename,
        "size": f"{len(file_bytes) / 1024:.1f} KB",
        "type": filename.split('.')[-1].lower(),
        "content_hash": content_hash,
        "extracted_text": extracted_text,
        "char_count": len(extracted_text),
        "is_analyzed": existing_analysis is not None,
        "analysis_result": existing_analysis,
        "uploaded_at": utcnow_iso()
    }

    if db_manager.db is not None:
        try:
            await db_manager.db["study_folders"].update_one(
                _folder_query(folder_id),
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
                "user_id": resolve_effective_user_id(current_user, None),
                "documents": [doc_record],
                "games": [],
                "created_at": utcnow_iso()
            }

    # Indexar en Qdrant para RAG (búsqueda semántica + preguntas fundamentadas)
    background_tasks.add_task(
        rag_service.index_document,
        folder_id, doc_id, filename, extracted_text,
        resolve_effective_user_id(current_user, None),
    )

    return {
        "status": "uploaded",
        "id": doc_record["id"],
        "name": doc_record["name"],
        "size": doc_record["size"],
        "type": doc_record["type"],
        "content_hash": content_hash,
        "is_analyzed": doc_record["is_analyzed"],
        "char_count": doc_record["char_count"],
        "uploaded_at": doc_record["uploaded_at"],
        "rag_indexed": rag_service.available,
    }


@router.post("/{folder_id}/generate-game", response_model=GameBoardResponse, status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def generate_game_from_folder(
    request: Request,
    folder_id: str,
    force: bool = Query(False, description="Forzar regeneración sin usar caché"),
    level: int = Query(1, ge=1, le=5),
    question_count: Optional[int] = Query(None, ge=1, le=30),
    difficulty: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """
    Genera un tablero usando EXCLUSIVAMENTE el texto de los documentos de la
    carpeta, calibrado al nivel pedagógico indicado (1-5).
    """
    plan = get_user_plan(current_user)
    question_count = enforce_question_limit(plan, question_count)

    level_defaults = {
        1: (3, "facil"), 2: (5, "seminormal"), 3: (8, "normal"),
        4: (15, "semidificil"), 5: (20, "dificil")
    }
    def_qc, def_diff = level_defaults.get(level, (3, "facil"))
    final_qc = question_count if question_count is not None else def_qc
    final_diff = difficulty if difficulty is not None else def_diff

    folder_doc = await _load_folder(folder_id)
    if not folder_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Carpeta '{folder_id}' no encontrada.")
    assert_can_access_user_resource(current_user, folder_doc.get("user_id"))

    documents = folder_doc.get("documents", [])
    folder_name = folder_doc.get("name", "Asignatura")
    folder_description = folder_doc.get("description", "")

    texts_with_source = []
    for doc in documents:
        extracted = doc.get("extracted_text", "").strip()
        if extracted and len(extracted) > 20:
            texts_with_source.append(f"--- DOCUMENTO: {doc.get('name', 'Archivo')} ---\n{extracted}")

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

    if not force:
        cached_boards_dict = folder_doc.get("cached_boards", {})
        lvl_key = f"level_{level}"
        if lvl_key in cached_boards_dict:
            logger.info(f"⚡ REUTILIZACIÓN INSTANTÁNEA (0 ms, 0 tokens): Tablero de '{folder_name}' ({lvl_key}) recuperado de MongoDB.")
            return GameBoardResponse(**cached_boards_dict[lvl_key])

        existing_board = folder_doc.get("cached_board")
        if existing_board and len(existing_board.get("nodes", [])) == final_qc:
            logger.info(f"⚡ REUTILIZACIÓN INSTANTÁNEA: Tablero guardado de '{folder_name}' reutilizado.")
            return GameBoardResponse(**existing_board)

        if db_manager.db is not None:
            try:
                cached_folder_analysis = await db_manager.db["cached_analyses"].find_one({"content_hash": folder_content_hash})
                if cached_folder_analysis and "board" in cached_folder_analysis:
                    logger.info(f"⚡ REUTILIZACIÓN INSTANTÁNEA: Análisis global de '{folder_name}' ({folder_content_hash[:8]}) cargado.")
                    return GameBoardResponse(**cached_folder_analysis["board"])
            except Exception as cache_err:
                logger.warning(f"Error verificando análisis guardado de carpeta: {cache_err}")

    # Conceptos evaluados en niveles previos para garantizar cobertura total sin repetir
    previously_evaluated_concepts = []
    cached_boards_dict = folder_doc.get("cached_boards", {})
    for prev_lvl in range(1, level):
        prev_board = cached_boards_dict.get(f"level_{prev_lvl}")
        if prev_board and "cards" in prev_board:
            for c in prev_board["cards"]:
                cname = c.get("concept_name")
                if cname and not c.get("id", "").startswith("card_distractor"):
                    previously_evaluated_concepts.append(cname)

    logger.info(
        f"Generando juego para carpeta '{folder_name}' ({folder_id}) [Nivel {level} ({final_diff}), {final_qc} preguntas, force={force}]: "
        f"{len(texts_with_source)} documentos, {len(combined_text)} caracteres. "
        f"Excluyendo {len(previously_evaluated_concepts)} conceptos previos."
    )

    seed = random.randint(1, 99999) if force else 0
    uid = str(current_user.get("id") or current_user.get("_id")) if current_user else None
    board_response = await generate_board(
        GenerateBoardRequest(
            text=combined_text,
            level=level,
            question_count=final_qc,
            difficulty=final_diff,
            excluded_concepts=previously_evaluated_concepts
        ),
        force_refresh=force,
        variation_seed=seed,
        user_id=uid,
    )

    if db_manager.db is not None:
        try:
            lvl_field = f"cached_boards.level_{level}"
            await db_manager.db["study_folders"].update_one(
                _folder_query(folder_id),
                {"$set": {
                    "cached_board": board_response.model_dump(),
                    lvl_field: board_response.model_dump(),
                    "cached_content_hash": folder_content_hash,
                    "last_analyzed_at": utcnow_iso()
                }}
            )
            logger.info(f"Análisis guardado en la carpeta '{folder_name}' (Nivel {level}) en MongoDB.")
        except Exception as fe:
            logger.warning(f"Error guardando cached_board en la carpeta: {fe}")

    if folder_id in in_memory_study_folders:
        in_memory_folder = in_memory_study_folders[folder_id]
        in_memory_folder.setdefault("cached_boards", {})[f"level_{level}"] = board_response.model_dump()
        in_memory_folder["cached_board"] = board_response.model_dump()

    return board_response


class FolderAskRequest(BaseModel):
    question: str
    top_k: Optional[int] = 5


@router.post("/{folder_id}/ask")
@limiter.limit("20/minute")
async def ask_folder_documents(
    request: Request,
    folder_id: str,
    payload: FolderAskRequest,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """
    "Pregúntale a tus apuntes": RAG sobre Qdrant — recupera los chunks más
    relevantes de los documentos de la carpeta y responde con Gemini/Groq.
    """
    folder_doc = await _load_folder(folder_id)
    if not folder_doc:
        raise HTTPException(status_code=404, detail="Carpeta no encontrada.")
    assert_can_access_user_resource(current_user, folder_doc.get("user_id"))

    chunks = await rag_service.search(folder_id, payload.question, top_k=payload.top_k or 5)
    if not chunks:
        if not rag_service.available:
            raise HTTPException(
                status_code=503,
                detail="La búsqueda semántica no está disponible (Qdrant o Gemini no configurados)."
            )
        return {"answer": "No encontré información relevante en tus apuntes para esa pregunta.", "sources": []}

    context = "\n\n".join(f"[{c['doc_name']}] {c['text']}" for c in chunks)

    answer = None
    # Groq primero (rápido y barato)
    try:
        from app.services.ai_service import ai_service as _ai
        if getattr(_ai, "groq_client", None):
            comp = _ai.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": (
                        "Eres Capi, tutora de Hubzy. Responde SOLO con base en el contexto de apuntes "
                        "provisto. Si la respuesta no está en el contexto, dilo honestamente. "
                        "Sé concisa, cálida y pedagógica (máx. 120 palabras)."
                    )},
                    {"role": "user", "content": f"Contexto de apuntes:\n{context}\n\nPregunta del estudiante: {payload.question}"},
                ],
                temperature=0.3,
                max_tokens=400,
            )
            answer = (comp.choices[0].message.content or "").strip()
    except Exception as e:
        logger.warning(f"Groq no respondió para /ask: {e}")

    if not answer:
        answer = "Encontré fragmentos relevantes en tus apuntes pero no pude redactar la respuesta ahora. Revisa las fuentes abajo."

    return {
        "answer": answer,
        "sources": [{"doc_name": c["doc_name"], "excerpt": c["text"][:280], "score": round(c["score"], 3)} for c in chunks],
    }
