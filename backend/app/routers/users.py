import logging
import re

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.age_bands import band_for_age, needs_parental_consent
from app.core.audit import audit_event
from app.core.crypto import decrypt_field
from app.core.database import db_manager
from app.core.plans import trial_days_left
from app.core.rate_limit import limiter
from app.core.security import (
    get_current_user,
    get_current_verified_user,
    utcnow_iso,
    verify_password,
)
from app.core.session_store import in_memory_auth_users, in_memory_study_folders
from app.models.user import UserProfileResponse, UserRegisterRequest
from app.routers.auth import assign_voice_gender
from app.services.account_lifecycle import DeletionError, delete_user_everywhere

logger = logging.getLogger("hubzy.users")
router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.post("/register", response_model=UserProfileResponse)
@limiter.limit("10/minute")
async def register_or_login_user(request: Request, payload: UserRegisterRequest):
    """
    Flujo ligero (sin contraseña) para invitados: registra o actualiza un perfil
    con nombre, sexo y edad, y asigna el género de voz complementario de Hubzi.
    """
    clean_username = payload.username.strip()
    norm_gender = payload.gender.strip().lower()
    assigned_voice = assign_voice_gender(norm_gender, payload.voice_preference)
    age_band = band_for_age(payload.age)

    if needs_parental_consent(age_band) and not payload.parental_consent:
        raise HTTPException(
            status_code=400,
            detail="Las cuentas de menores de 11 años requieren el consentimiento de un padre, madre o tutor.",
        )

    user_doc = {
        "username": clean_username,
        "gender": norm_gender,
        "age": payload.age,
        "age_band": age_band,
        "avatar": payload.avatar or "capy_fan",
        "voice_preference": payload.voice_preference or "auto",
        "assigned_voice_gender": assigned_voice,
        "updated_at": utcnow_iso(),
    }

    if db_manager.db is not None:
        try:
            existing = await db_manager.db["users"].find_one(
                {
                    "username": {
                        "$regex": f"^{re.escape(clean_username)}$",
                        "$options": "i",
                    }
                }
            )
            if existing and existing.get("password_hash"):
                # Cuenta real con credenciales — jamás se toca desde el
                # registro de invitados (evita hijack del perfil ajeno).
                raise HTTPException(
                    status_code=409,
                    detail="Ese nombre pertenece a una cuenta registrada. Inicia sesión con tu correo.",
                )
            if existing:
                await db_manager.db["users"].update_one(
                    {"_id": existing["_id"]},
                    {
                        "$set": {
                            "gender": norm_gender,
                            "age": payload.age,
                            "assigned_voice_gender": assigned_voice,
                            "avatar": payload.avatar or existing.get("avatar", "capy_fan"),
                            "voice_preference": payload.voice_preference
                            or existing.get("voice_preference", "auto"),
                        }
                    },
                )
                existing_id = str(existing["_id"])
                return UserProfileResponse(
                    id=existing_id,
                    username=existing["username"],
                    gender=norm_gender,
                    age=payload.age,
                    age_band=age_band,
                    avatar=payload.avatar or existing.get("avatar", "capy_fan"),
                    voice_preference=payload.voice_preference
                    or existing.get("voice_preference", "auto"),
                    assigned_voice_gender=assigned_voice,
                    created_at=str(existing.get("created_at", "")),
                )

            user_doc["created_at"] = utcnow_iso()
            res = await db_manager.db["users"].insert_one(user_doc)
            user_doc["id"] = str(res.inserted_id)
            return UserProfileResponse(**user_doc)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error registrando usuario en MongoDB: {e}")
            raise HTTPException(
                status_code=503,
                detail="Servicio de base de datos no disponible. Intenta de nuevo.",
            ) from e

    import hashlib

    fallback_id = f"user_{hashlib.md5(clean_username.lower().encode()).hexdigest()[:8]}"
    return UserProfileResponse(
        id=fallback_id,
        username=clean_username,
        gender=norm_gender,
        age=payload.age,
        avatar=payload.avatar or "capy_fan",
        voice_preference=payload.voice_preference or "auto",
        assigned_voice_gender=assigned_voice,
        created_at=utcnow_iso(),
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Perfil del usuario autenticado (desde JWT)."""
    user_id = str(current_user.get("id") or current_user.get("_id"))
    age = current_user.get("age") or 20  # tolera age=None en docs legacy
    plan = current_user.get("plan", "free")
    return UserProfileResponse(
        id=user_id,
        email=current_user.get("email"),
        username=current_user.get("username", "Estudiante"),
        gender=current_user.get("gender", "masculino"),
        age=age,
        age_band=current_user.get("age_band") or band_for_age(age),
        avatar=current_user.get("avatar", "capy_fan"),
        voice_preference=current_user.get("voice_preference", "auto"),
        assigned_voice_gender=current_user.get("assigned_voice_gender", "female"),
        created_at=str(current_user.get("created_at", "")),
        plan=plan,
        pro_since=current_user.get("pro_since"),
        role=current_user.get("role") or "individual",
        institution_id=current_user.get("institution_id"),
        grade_ids=current_user.get("grade_ids"),
        trial_days_left=(
            trial_days_left(str(current_user.get("created_at", "")))
            if plan == "free"
            else None
        ),
    )


@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: str, current_user: dict = Depends(get_current_user)):
    """Obtiene el perfil del usuario — solo el propio perfil autenticado."""
    uid = str(current_user.get("id") or current_user.get("_id"))
    if user_id != uid:
        raise HTTPException(status_code=403, detail="Solo puedes consultar tu propio perfil.")
    return await get_my_profile(current_user)


@router.delete("/me")
async def delete_my_account(request: Request, current_user: dict = Depends(get_current_user)):
    """
    Elimina la cuenta del usuario autenticado y todos sus datos asociados
    (carpetas, documentos y vectores RAG). Requisito de privacidad para datos
    sensibles: el usuario siempre puede ejercer su derecho de supresión.
    """
    uid = str(current_user.get("id") or current_user.get("_id"))
    email = (current_user.get("email") or "").strip().lower()
    try:
        deleted = await delete_user_everywhere(uid, email)
    except DeletionError as e:
        logger.error(f"Error en borrado en cascada del usuario {uid}: {e}")
        raise HTTPException(
            status_code=500,
            detail="No se pudo completar la eliminación de tus datos. Intenta de nuevo.",
        ) from e

    await audit_event("account_deleted", request=request, actor_id=uid)
    return {"status": "account_deleted", "deleted": deleted}


class AiConsentRequest(BaseModel):
    consent: bool


@router.put("/me/ai-consent")
async def set_ai_consent(
    request: Request,
    payload: AiConsentRequest,
    current_user: dict = Depends(get_current_user),
):
    """Opt-in/out: el usuario decide si su material puede alimentar el
    dataset de entrenamiento de Hubzy. Default False — nadie aporta
    contenido de menores sin consentimiento explícito."""
    uid = str(current_user.get("id") or current_user.get("_id"))
    email = (current_user.get("email") or "").strip().lower()

    if db_manager.db is not None:
        from bson import ObjectId

        query = {"_id": ObjectId(uid)} if ObjectId.is_valid(uid) else {"id": uid}
        await db_manager.db["users"].update_one(
            query, {"$set": {"ai_training_consent": bool(payload.consent)}}
        )
    elif email in in_memory_auth_users:
        in_memory_auth_users[email]["ai_training_consent"] = bool(payload.consent)

    # Al retirar el consentimiento, purgar lo ya aportado al dataset.
    if not payload.consent and db_manager.db is not None:
        await db_manager.db["ai_training_dataset"].delete_many({"user_id": uid})

    await audit_event("ai_consent_changed", request=request, actor_id=uid)
    return {"status": "ok", "ai_training_consent": bool(payload.consent)}


class ExportDataRequest(BaseModel):
    password: str = Field(min_length=1, max_length=128)


@router.post("/me/export")
@limiter.limit("5/minute")
async def export_my_data(
    request: Request,
    payload: ExportDataRequest,
    current_user: dict = Depends(get_current_verified_user),
):
    """
    Portabilidad de datos: devuelve TODO lo que el sistema guarda del usuario
    autenticado en un solo JSON descargable (perfil, carpetas con documentos,
    dominio de habilidades BKT, registros zen y progreso).

    Step-up auth: exige la contraseña actual — quien robe una sesión no puede
    exportar la vida entera del usuario. Requiere email verificado.
    """
    uid = str(current_user.get("id") or current_user.get("_id"))
    if not verify_password(current_user.get("password_hash", ""), payload.password):
        await audit_event("data_export_denied", request=request, actor_id=uid)
        raise HTTPException(status_code=401, detail="Contraseña incorrecta.")

    profile = {
        "id": uid,
        "email": current_user.get("email"),
        "username": current_user.get("username"),
        "gender": current_user.get("gender"),
        "age_band": current_user.get("age_band"),
        "plan": current_user.get("plan", "free"),
        "email_verified": current_user.get("email_verified", False),
        "created_at": str(current_user.get("created_at", "")),
    }

    # Con BD configurada un fallo aborta: una exportación parcial silenciosa
    # incumpliría la promesa de portabilidad completa.
    folders = []
    if db_manager.db is not None:
        try:
            async for f in db_manager.db["study_folders"].find({"user_id": uid}):
                f.pop("_id", None)
                folders.append(f)
        except Exception as e:
            logger.error(f"Error exportando carpetas del usuario {uid}: {e}")
            raise HTTPException(
                status_code=500, detail="No se pudo completar la exportación. Intenta de nuevo."
            ) from e
    else:
        for f in in_memory_study_folders.values():
            if f.get("user_id") == uid:
                folders.append(f)

    async def _collect(collection: str) -> list:
        if db_manager.db is None:
            return []
        out = []
        async for doc in db_manager.db[collection].find({"user_id": uid}):
            doc.pop("_id", None)
            out.append(doc)
        return out

    try:
        skills = await _collect("skill_mastery")
        zen_logs = await _collect("zen_logs")
        progress = await _collect("student_progress")
    except Exception as e:
        logger.error(f"Error exportando datos del usuario {uid}: {e}")
        raise HTTPException(
            status_code=500, detail="No se pudo completar la exportación. Intenta de nuevo."
        ) from e

    # zen_logs.notes va cifrado en reposo — se descifra para el dueño
    for log in zen_logs:
        if log.get("notes"):
            log["notes"] = decrypt_field(log["notes"])

    await audit_event("data_export", request=request, actor_id=uid)
    return {
        "exported_at": utcnow_iso(),
        "profile": profile,
        "folders": folders,
        "skill_mastery": skills,
        "student_progress": progress,
        "zen_logs": zen_logs,
        "note": "Exportación completa de tus datos personales en Hubzy.",
    }
