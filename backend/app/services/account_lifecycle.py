"""Ciclo de vida de la cuenta: borrado completo en cascada.

Extraído de `routers/users.py::delete_my_account` para reutilizarlo en la
purga de cuentas inactivas (`services/retention.py`) — una sola fuente de
verdad para "qué se borra cuando muere una cuenta".
"""
import logging

from app.core.database import db_manager
from app.core.session_store import in_memory_auth_users, in_memory_study_folders
from app.routers.institutions import in_memory_student_progress
from app.services.rag_service import rag_service

logger = logging.getLogger("hubzy.account_lifecycle")


class DeletionError(Exception):
    """La cascada falló a mitad — abortar antes que dejar datos huérfanos."""


async def delete_user_everywhere(uid: str, email: str) -> dict:
    """Borra la cuenta y TODOS sus datos asociados.

    Devuelve conteos {"folders", "vectors", "user"}. Lanza DeletionError si
    falla un paso con BD configurada (una supresión parcial silenciosa
    viola el derecho de supresión).
    """
    deleted = {"folders": 0, "vectors": 0, "user": False}

    # 1. Vectores RAG de los documentos del usuario (mejor esfuerzo).
    # folder_id es obligatorio: el doc_id incluye content_hash — el mismo
    # archivo en dos carpetas comparte doc_id y sin el filtro se borrarían
    # los vectores de la carpeta de OTRO usuario.
    if db_manager.db is not None:
        try:
            async for f in db_manager.db["study_folders"].find(
                {"user_id": uid}, {"documents.id": 1}
            ):
                for doc in f.get("documents", []):
                    if doc.get("id"):
                        await rag_service.delete_document_vectors(
                            doc["id"], folder_id=str(f["_id"])
                        )
                        deleted["vectors"] += 1
        except Exception as e:
            logger.warning(f"Error limpiando vectores RAG del usuario {uid}: {e}")

    for fid, f in in_memory_study_folders.items():
        if f.get("user_id") == uid:
            for doc in f.get("documents", []):
                if doc.get("id"):
                    await rag_service.delete_document_vectors(doc["id"], folder_id=fid)
                    deleted["vectors"] += 1

    # 2. Carpetas del usuario.
    if db_manager.db is not None:
        try:
            res = await db_manager.db["study_folders"].delete_many({"user_id": uid})
            deleted["folders"] += res.deleted_count
        except Exception as e:
            raise DeletionError(f"eliminando carpetas de {uid}: {e}") from e

    mem_folder_ids = [fid for fid, f in in_memory_study_folders.items() if f.get("user_id") == uid]
    for fid in mem_folder_ids:
        del in_memory_study_folders[fid]
        deleted["folders"] += 1

    # 3. Datos asociados: bienestar, progreso, habilidades, jobs, dataset IA,
    # materiales y membresías escolares.
    if db_manager.db is not None:
        try:
            await db_manager.db["student_progress"].delete_many({"user_id": uid})
            await db_manager.db["zen_logs"].delete_many({"user_id": uid})
            await db_manager.db["skill_mastery"].delete_many({"user_id": uid})
            await db_manager.db["jobs"].delete_many({"user_id": uid})
            await db_manager.db["ai_training_dataset"].delete_many({"user_id": uid})
            await db_manager.db["study_materials"].delete_many({"user_id": uid})
            await db_manager.db["grades"].update_many(
                {}, {"$pull": {"student_ids": uid, "teacher_ids": uid}}
            )
            await db_manager.db["institutions"].update_many(
                {}, {"$pull": {"teacher_ids": uid, "admin_ids": uid}}
            )
        except Exception as e:
            raise DeletionError(f"eliminando datos asociados de {uid}: {e}") from e

    for key in [k for k in in_memory_student_progress if k.split(":")[1:2] == [uid]]:
        in_memory_student_progress.pop(key, None)

    # 4. El usuario.
    if db_manager.db is not None:
        try:
            from bson import ObjectId

            query = {"_id": ObjectId(uid)} if ObjectId.is_valid(uid) else {"id": uid}
            res = await db_manager.db["users"].delete_one(query)
            deleted["user"] = deleted["user"] or res.deleted_count > 0
        except Exception as e:
            raise DeletionError(f"eliminando usuario {uid}: {e}") from e

    if email and email in in_memory_auth_users:
        del in_memory_auth_users[email]
        deleted["user"] = True
    else:
        for key, u in list(in_memory_auth_users.items()):
            if u.get("id") == uid:
                del in_memory_auth_users[key]
                deleted["user"] = True

    logger.info(
        f"Cuenta eliminada: user={uid} folders={deleted['folders']} vectors={deleted['vectors']}"
    )
    return deleted
