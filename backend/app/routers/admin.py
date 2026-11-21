"""
Panel de superadministración de plataforma (/api/v1/admin).

Distinto del admin de INSTITUCIÓN (director de colegio): el superadmin
gobierna TODA la plataforma — instituciones, usuarios, licencias,
seguridad y salud del sistema.

Acceso: rol users.role="superadmin" o email en SUPERADMIN_EMAILS
(bootstrap). Toda mutación queda en `security_events` (audit trail).
Proyección estricta: jamás password_hash, secretos MFA ni tokens.
"""

import logging
import re
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field

from app.core.audit import audit_event
from app.core.config import settings
from app.core.database import db_manager
from app.core.rate_limit import limiter
from app.core.security import require_superadmin, revoke_all_user_sessions, utcnow_iso
from app.core.session_store import (
    in_memory_auth_users,
    in_memory_jobs,
    in_memory_security_events,
    in_memory_study_folders,
)
from app.routers.institutions import (
    _doc_query,
    _ensure_school_credential,
    _gen_code,
    _get_institution,
    _get_user,
    _list_institution_grades,
    _save_institution,
    _serialize_grade,
    _serialize_inst,
    _uid,
    delete_institution_cascade,
    in_memory_grades,
    in_memory_institutions,
)
from app.services.account_lifecycle import DeletionError, delete_user_everywhere

logger = logging.getLogger("hubzy.admin")

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin"],
    dependencies=[Depends(require_superadmin)],
)

USER_ROLES = {"individual", "student", "teacher", "admin", "superadmin"}
USER_PLANS = {"free", "pro", "guest", "school"}
INST_SUB_STATUSES = {"active", "trialing", "suspended", "canceled"}


def _user_query(uid: str) -> dict:
    return {"_id": ObjectId(uid)} if ObjectId.is_valid(uid) else {"id": uid}


def _admin_user(u: dict) -> dict:
    """Proyección segura de un usuario para el panel admin."""
    return {
        "id": str(u.get("id") or u.get("_id")),
        "email": u.get("email"),
        "username": u.get("username"),
        "role": u.get("role") or "individual",
        "plan": u.get("plan", "free"),
        "institution_id": u.get("institution_id"),
        "grade_ids": u.get("grade_ids") or [],
        "age_band": u.get("age_band"),
        "school_managed": bool(u.get("school_managed")),
        "email_verified": bool(u.get("email_verified")),
        "mfa_enabled": bool(u.get("mfa_enabled")),
        "disabled": bool(u.get("disabled")),
        "must_change_password": bool(u.get("must_change_password")),
        "school_credential": u.get("school_credential"),
        "created_at": u.get("created_at"),
    }


async def _all_users() -> list[dict]:
    if db_manager.db is not None:
        return await db_manager.db["users"].find(
            {}, {"password_hash": 0, "totp_secret": 0}
        ).to_list(5000)
    return list(in_memory_auth_users.values())


async def _count(collection: str, query: dict | None = None) -> int:
    if db_manager.db is None:
        return -1  # modo memoria: el caller usa len() de los stores
    return await db_manager.db[collection].count_documents(query or {})


async def _find_user_by_email(email: str) -> dict | None:
    email = email.strip().lower()
    if db_manager.db is not None:
        return await db_manager.db["users"].find_one(
            {"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}}
        )
    for u in in_memory_auth_users.values():
        if (u.get("email") or "").lower() == email:
            return u
    return None


async def _patch_user(uid: str, updates: dict) -> None:
    if db_manager.db is not None:
        await db_manager.db["users"].update_one(_user_query(uid), {"$set": updates})
    else:
        for u in in_memory_auth_users.values():
            if str(u.get("id")) == uid:
                u.update(updates)
                return


async def _audit(request: Request, actor: dict, action: str, target: str, extra: dict | None = None):
    await audit_event(
        "admin_action",
        request=request,
        actor_id=_uid(actor),
        detail={"action": action, "target": target, **(extra or {})},
    )


# ────────────────────── Overview / sistema ──────────────────────


@router.get("/overview")
@limiter.limit("30/minute")
async def admin_overview(request: Request):
    """KPIs globales de la plataforma."""
    cutoff_7d = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    out: dict = {"generated_at": utcnow_iso()}

    if db_manager.db is not None:
        users_total = await _count("users")
        pro_users = await _count("users", {"plan": "pro"})
        inst_total = await _count("institutions")
        inst_active = await _count("institutions", {"subscription.status": "active"})
        inst_suspended = await _count("institutions", {"subscription.status": "suspended"})
        folders_total = await _count("study_folders")
        grades_total = await _count("grades")
        jobs_failed = await _count("jobs", {"status": "failed"})

        # Usuarios con actividad reciente (jugaron en los últimos 7 días)
        active: set[str] = set()
        cursor = db_manager.db["student_progress"].find(
            {"progress.last_played_at": {"$gte": cutoff_7d}}, {"user_id": 1}
        )
        async for p in cursor:
            active.add(p.get("user_id"))
        new_users_7d = await _count("users", {"created_at": {"$gte": cutoff_7d}})
    else:
        users_total = len(in_memory_auth_users)
        pro_users = sum(1 for u in in_memory_auth_users.values() if u.get("plan") == "pro")
        inst_total = len(in_memory_institutions)
        inst_active = sum(
            1
            for i in in_memory_institutions.values()
            if (i.get("subscription") or {}).get("status") == "active"
        )
        inst_suspended = sum(
            1
            for i in in_memory_institutions.values()
            if (i.get("subscription") or {}).get("status") == "suspended"
        )
        folders_total = len(in_memory_study_folders)
        grades_total = len(in_memory_grades)
        jobs_failed = sum(1 for j in in_memory_jobs.values() if j.get("status") == "failed")
        new_users_7d = sum(
            1
            for u in in_memory_auth_users.values()
            if str(u.get("created_at") or "") >= cutoff_7d
        )
        active = set()

    out["users"] = {"total": users_total, "pro": pro_users, "active_7d": len(active), "new_7d": new_users_7d}
    out["institutions"] = {
        "total": inst_total,
        "licensed": inst_active,
        "suspended": inst_suspended,
        "trial_or_unlicensed": inst_total - inst_active - inst_suspended,
    }
    out["content"] = {"study_folders": folders_total, "grades": grades_total}
    out["jobs"] = {"failed": jobs_failed}
    return out


@router.get("/system")
@limiter.limit("30/minute")
async def admin_system(request: Request):
    """Salud del sistema: almacenes, flags activos y versión."""
    mongo_ok = db_manager.db is not None
    qdrant_ok = False
    if db_manager.qdrant_client is not None:
        try:
            db_manager.qdrant_client.get_collections()
            qdrant_ok = True
        except Exception:
            qdrant_ok = False
    return {
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "databases": {
            "mongodb": "connected" if mongo_ok else "disconnected",
            "qdrant": "connected" if qdrant_ok else "disconnected",
        },
        "flags": {
            "rate_limit": settings.RATE_LIMIT_ENABLED,
            "hibp": settings.HIBP_ENABLED,
            "mfa_enforce_institutions": settings.MFA_ENFORCE_INSTITUTIONS,
            "email_enabled": settings.EMAIL_ENABLED,
            "procedural_engines": settings.PROCEDURAL_ENGINES_ENABLED,
            "prewarm_level1": settings.PREWARM_LEVEL1_ENABLED,
        },
        "integrations": {
            "stripe": bool(settings.STRIPE_SECRET_KEY),
            "gemini": bool(settings.GEMINI_API_KEY),
            "groq": bool(settings.GROQ_API_KEY),
            "sentry": bool(settings.SENTRY_DSN),
            "respan": bool(settings.RESPAN_API_KEY),
        },
    }


# ────────────────────── Instituciones ──────────────────────


@router.get("/institutions")
@limiter.limit("30/minute")
async def admin_list_institutions(
    request: Request,
    q: str | None = Query(None, max_length=120),
    status_filter: str | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """Lista de instituciones con búsqueda y filtro por estado de licencia."""
    if db_manager.db is not None:
        query: dict = {}
        if q and q.strip():
            query["name"] = {"$regex": re.escape(q.strip()), "$options": "i"}
        if status_filter:
            query["subscription.status"] = status_filter
        cursor = (
            db_manager.db["institutions"]
            .find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        insts = await cursor.to_list(limit)
        total = await db_manager.db["institutions"].count_documents(query)
    else:
        insts = list(in_memory_institutions.values())
        if q and q.strip():
            needle = q.strip().lower()
            insts = [i for i in insts if needle in (i.get("name") or "").lower()]
        if status_filter:
            insts = [
                i for i in insts if (i.get("subscription") or {}).get("status") == status_filter
            ]
        insts = sorted(insts, key=lambda i: i.get("created_at") or "", reverse=True)
        total = len(insts)
        insts = insts[skip : skip + limit]

    # Enriquecer con conteos (grados + alumnos) — N+1 acotado por `limit`.
    rows = []
    for inst in insts:
        iid = inst.get("id") or str(inst.get("_id"))
        grades = await _list_institution_grades(iid)
        students = set()
        folders = 0
        for g in grades:
            students |= set(g.get("student_ids") or [])
            folders += len(g.get("folder_ids") or [])
        rows.append(
            {
                **_serialize_inst(inst),
                "grades_count": len(grades),
                "students_enrolled": len(students),
                "subjects_count": folders,
                "teachers_count": len(inst.get("teacher_ids") or []),
            }
        )
    return {"institutions": rows, "total": total, "skip": skip, "limit": limit}


@router.get("/institutions/{inst_id}")
@limiter.limit("30/minute")
async def admin_get_institution(request: Request, inst_id: str):
    """Detalle completo: grados con materias, miembros y licencia."""
    inst = await _get_institution(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
    grades = await _list_institution_grades(inst["id"])
    members = set(inst.get("admin_ids") or []) | set(inst.get("teacher_ids") or [])
    students: set[str] = set()
    grade_rows = []
    for g in grades:
        students |= set(g.get("student_ids") or [])
        grade_rows.append(_serialize_grade(g))
    async def _member(uid: str) -> dict | None:
        u = await _get_user(uid)
        if not u:
            return None
        row = _admin_user(u)
        row["school_credential"] = await _ensure_school_credential(u)
        return row

    return {
        "institution": _serialize_inst(inst),
        "grades": grade_rows,
        "members": {
            "admins": [m for m in [await _member(a) for a in inst.get("admin_ids") or []] if m],
            "teachers": [m for m in [await _member(t) for t in inst.get("teacher_ids") or []] if m],
            "students_count": len(students),
        },
    }


class AdminInstitutionCreate(BaseModel):
    name: str = Field(min_length=3, max_length=160)
    admin_email: str = Field(min_length=3, max_length=254)


@router.post("/institutions", status_code=201)
@limiter.limit("10/minute")
async def admin_create_institution(
    request: Request,
    payload: AdminInstitutionCreate,
    current_user: dict = Depends(require_superadmin),
):
    """Onboarding asistido: crea la institución y nombra director por email
    (la cuenta debe existir — gana role=admin + MFA obligatorio)."""
    admin_user = await _find_user_by_email(payload.admin_email)
    if not admin_user:
        raise HTTPException(
            status_code=404,
            detail="No existe una cuenta con ese email para nombrarla directora.",
        )
    admin_uid = str(admin_user.get("id") or admin_user.get("_id"))
    inst = {
        "id": str(ObjectId()),
        "name": payload.name.strip(),
        "admin_ids": [admin_uid],
        "teacher_ids": [],
        "teacher_code": _gen_code("PROF"),
        "plan": "school",
        "created_at": utcnow_iso(),
    }
    await _save_institution(inst)
    await _patch_user(
        admin_uid,
        {"institution_id": inst["id"], "role": "admin", "mfa_required": True},
    )
    await _audit(request, current_user, "institution_create", inst["id"], {"name": inst["name"]})
    return {"institution": _serialize_inst(inst)}


class AdminInstitutionPatch(BaseModel):
    name: str | None = Field(default=None, max_length=160)
    seats: int | None = Field(default=None, ge=0, le=100000)
    status: str | None = None  # active | trialing | suspended | canceled
    teacher_ids: list[str] | None = None
    admin_ids: list[str] | None = None


@router.patch("/institutions/{inst_id}")
@limiter.limit("20/minute")
async def admin_patch_institution(
    request: Request,
    inst_id: str,
    payload: AdminInstitutionPatch,
    current_user: dict = Depends(require_superadmin),
):
    """Ajusta licencia (seats/estado), nombre o membresías de una institución."""
    inst = await _get_institution(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")

    changes: dict = {}
    if payload.name is not None and payload.name.strip():
        changes["name"] = payload.name.strip()
    if payload.seats is not None or payload.status is not None:
        if payload.status is not None and payload.status not in INST_SUB_STATUSES:
            raise HTTPException(status_code=400, detail="Estado de licencia inválido.")
        sub = dict(inst.get("subscription") or {})
        if payload.seats is not None:
            sub["seats"] = payload.seats
        if payload.status is not None:
            sub["status"] = payload.status
            if payload.status == "active" and not sub.get("activated_at"):
                sub["activated_at"] = utcnow_iso()
        changes["subscription"] = sub
    if payload.teacher_ids is not None:
        changes["teacher_ids"] = sorted(set(payload.teacher_ids))
    if payload.admin_ids is not None:
        if not payload.admin_ids:
            raise HTTPException(status_code=400, detail="La institución necesita al menos un admin.")
        changes["admin_ids"] = sorted(set(payload.admin_ids))
    if not changes:
        raise HTTPException(status_code=400, detail="Nada que actualizar.")

    inst.update(changes)
    await _save_institution(inst)
    await _audit(request, current_user, "institution_patch", inst["id"], {"changes": list(changes)})
    return {"institution": _serialize_inst(inst)}


@router.delete("/institutions/{inst_id}")
@limiter.limit("5/minute")
async def admin_delete_institution(
    request: Request,
    inst_id: str,
    current_user: dict = Depends(require_superadmin),
):
    """Borrado en cascada (misma lógica que el delete del admin de colegio)."""
    inst = await _get_institution(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
    result = await delete_institution_cascade(inst)
    await _audit(request, current_user, "institution_delete", inst["id"], result)
    return {"status": "institution_deleted", **result}


class AdminIdsRequest(BaseModel):
    user_id: str


@router.post("/institutions/{inst_id}/admins")
@limiter.limit("20/minute")
async def admin_add_inst_admin(
    request: Request,
    inst_id: str,
    payload: AdminIdsRequest,
    current_user: dict = Depends(require_superadmin),
):
    """Añade un co-admin (por user_id) a la institución."""
    inst = await _get_institution(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
    target = await _get_user(payload.user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    admins = set(inst.get("admin_ids") or [])
    admins.add(payload.user_id)
    inst["admin_ids"] = sorted(admins)
    await _save_institution(inst)
    # superadmin se vincula como admin de la escuela SIN perder su rol global
    target_role = "superadmin" if target.get("role") == "superadmin" else "admin"
    await _patch_user(
        payload.user_id,
        {"institution_id": inst["id"], "role": target_role, "mfa_required": True},
    )
    await _audit(request, current_user, "institution_admin_add", inst["id"], {"user_id": payload.user_id})
    return {"institution": _serialize_inst(inst)}


@router.delete("/institutions/{inst_id}/admins/{user_id}")
@limiter.limit("20/minute")
async def admin_remove_inst_admin(
    request: Request,
    inst_id: str,
    user_id: str,
    current_user: dict = Depends(require_superadmin),
):
    """Quita un admin de la institución (debe quedar al menos uno)."""
    inst = await _get_institution(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
    admins = [a for a in (inst.get("admin_ids") or []) if a != user_id]
    if not admins:
        raise HTTPException(status_code=400, detail="Debe quedar al menos un administrador.")
    inst["admin_ids"] = admins
    await _save_institution(inst)
    target = await _get_user(user_id)
    if target and target.get("institution_id") == inst["id"]:
        # superadmin nunca pierde su rol de plataforma al desvincularse
        fallback_role = "individual" if target.get("role") != "superadmin" else "superadmin"
        await _patch_user(
            user_id,
            {"institution_id": None, "role": fallback_role, "mfa_required": False},
        )
    await _audit(request, current_user, "institution_admin_remove", inst["id"], {"user_id": user_id})
    return {"institution": _serialize_inst(inst)}


# ────────────────────── Usuarios ──────────────────────


@router.get("/users")
@limiter.limit("30/minute")
async def admin_list_users(
    request: Request,
    q: str | None = Query(None, max_length=120),
    role: str | None = Query(None),
    plan: str | None = Query(None),
    institution_id: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """Búsqueda de usuarios (email/username) con filtros y paginación."""
    if db_manager.db is not None:
        query: dict = {}
        if q and q.strip():
            rx = {"$regex": re.escape(q.strip()), "$options": "i"}
            query["$or"] = [{"email": rx}, {"username": rx}]
        if role:
            query["role"] = role
        if plan:
            query["plan"] = plan
        if institution_id:
            query["institution_id"] = institution_id
        cursor = (
            db_manager.db["users"]
            .find(query, {"password_hash": 0, "totp_secret": 0})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        users = await cursor.to_list(limit)
        total = await db_manager.db["users"].count_documents(query)
    else:
        users = list(in_memory_auth_users.values())
        if q and q.strip():
            needle = q.strip().lower()
            users = [
                u
                for u in users
                if needle in (u.get("email") or "").lower()
                or needle in (u.get("username") or "").lower()
            ]
        if role:
            users = [u for u in users if (u.get("role") or "individual") == role]
        if plan:
            users = [u for u in users if u.get("plan", "free") == plan]
        if institution_id:
            users = [u for u in users if u.get("institution_id") == institution_id]
        users = sorted(users, key=lambda u: u.get("created_at") or "", reverse=True)
        total = len(users)
        users = users[skip : skip + limit]

    return {"users": [_admin_user(u) for u in users], "total": total, "skip": skip, "limit": limit}


@router.get("/users/{user_id}")
@limiter.limit("30/minute")
async def admin_get_user(request: Request, user_id: str):
    """Detalle de un usuario: perfil + carpetas propias + sesiones activas."""
    user = await _get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    folders = []
    if db_manager.db is not None:
        cursor = db_manager.db["study_folders"].find(
            {"user_id": user_id}, {"documents.extracted_text": 0, "cached_board": 0, "cached_boards": 0}
        )
        async for f in cursor:
            folders.append(
                {
                    "id": f.get("id") or str(f.get("_id")),
                    "name": f.get("name"),
                    "is_school_folder": bool(f.get("is_school_folder")),
                    "documents_count": len(f.get("documents") or []),
                    "created_at": f.get("created_at"),
                }
            )
    else:
        for f in in_memory_study_folders.values():
            if f.get("user_id") == user_id:
                folders.append(
                    {
                        "id": f.get("id"),
                        "name": f.get("name"),
                        "is_school_folder": bool(f.get("is_school_folder")),
                        "documents_count": len(f.get("documents") or []),
                        "created_at": f.get("created_at"),
                    }
                )

    sessions = []
    if db_manager.db is not None:
        cursor = (
            db_manager.db["sessions"]
            .find({"user_id": user_id, "revoked": False}, {"_id": 0, "jti": 0})
            .sort("last_seen", -1)
            .limit(10)
        )
        sessions = await cursor.to_list(10)

    return {"user": _admin_user(user), "folders": folders, "active_sessions": sessions}


class AdminUserPatch(BaseModel):
    plan: str | None = None
    role: str | None = None
    disabled: bool | None = None
    reset_sessions: bool | None = None


@router.patch("/users/{user_id}")
@limiter.limit("20/minute")
async def admin_patch_user(
    request: Request,
    user_id: str,
    payload: AdminUserPatch,
    current_user: dict = Depends(require_superadmin),
):
    """Cambia plan/rol, suspende (disabled) o cierra todas las sesiones."""
    user = await _get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    updates: dict = {}
    if payload.plan is not None:
        if payload.plan not in USER_PLANS:
            raise HTTPException(status_code=400, detail="Plan inválido.")
        updates["plan"] = payload.plan
        if payload.plan == "pro" and not user.get("pro_since"):
            updates["pro_since"] = utcnow_iso()
    if payload.role is not None:
        if payload.role not in USER_ROLES:
            raise HTTPException(status_code=400, detail="Rol inválido.")
        updates["role"] = payload.role
        if payload.role == "superadmin":
            updates["mfa_required"] = True
    if payload.disabled is not None:
        updates["disabled"] = bool(payload.disabled)

    if payload.reset_sessions:
        await revoke_all_user_sessions(user_id)
        updates["token_version"] = int(user.get("token_version") or 0) + 1

    if not updates:
        raise HTTPException(status_code=400, detail="Nada que actualizar.")

    await _patch_user(user_id, updates)
    await _audit(request, current_user, "user_patch", user_id, {"changes": list(updates)})
    fresh = await _get_user(user_id)
    return {"user": _admin_user(fresh or {**user, **updates})}


@router.delete("/users/{user_id}")
@limiter.limit("5/minute")
async def admin_delete_user(
    request: Request,
    user_id: str,
    current_user: dict = Depends(require_superadmin),
):
    """Borrado GDPR administrado — misma cascada que DELETE /users/me."""
    user = await _get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    if _uid(current_user) == user_id:
        raise HTTPException(
            status_code=400,
            detail="No puedes eliminar tu propia cuenta de superadmin desde el panel.",
        )
    try:
        deleted = await delete_user_everywhere(user_id, (user.get("email") or "").strip().lower())
    except DeletionError as e:
        logger.error(f"Error en borrado admin del usuario {user_id}: {e}")
        raise HTTPException(status_code=500, detail="No se completó la eliminación.") from e
    await _audit(request, current_user, "user_delete", user_id, {"deleted": deleted})
    return {"status": "user_deleted", "deleted": deleted}


# ────────────────────── Suscripciones ──────────────────────


@router.get("/subscriptions")
@limiter.limit("30/minute")
async def admin_subscriptions(request: Request):
    """Todas las suscripciones: usuarios Pro + licencias escolares."""
    pro_users = []
    if db_manager.db is not None:
        cursor = db_manager.db["users"].find(
            {"plan": "pro"},
            {"password_hash": 0, "totp_secret": 0},
        ).limit(500)
        pro_users = await cursor.to_list(500)
    else:
        pro_users = [u for u in in_memory_auth_users.values() if u.get("plan") == "pro"]

    if db_manager.db is not None:
        insts = await db_manager.db["institutions"].find(
            {"subscription": {"$exists": True}}
        ).to_list(500)
    else:
        insts = [i for i in in_memory_institutions.values() if i.get("subscription")]

    return {
        "pro_users": [
            {"id": _admin_user(u)["id"], "email": u.get("email"), "username": u.get("username"),
             "pro_since": u.get("pro_since"), "stripe_customer": u.get("stripe_customer")}
            for u in pro_users
        ],
        "school_licenses": [
            {
                "institution_id": i.get("id") or str(i.get("_id")),
                "name": i.get("name"),
                "subscription": i.get("subscription"),
            }
            for i in insts
        ],
    }


# ────────────────────── Seguridad / jobs ──────────────────────


@router.get("/security-events")
@limiter.limit("30/minute")
async def admin_security_events(
    request: Request,
    type: str | None = Query(None, max_length=60),
    limit: int = Query(50, ge=1, le=200),
):
    """Feed del audit log (security_events), más recientes primero."""
    if db_manager.db is not None:
        query = {"type": type} if type else {}
        cursor = db_manager.db["security_events"].find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
        events = await cursor.to_list(limit)
    else:
        events = [e for e in in_memory_security_events if not type or e.get("type") == type]
        events = sorted(events, key=lambda e: e.get("created_at") or "", reverse=True)[:limit]
    return {"events": events}


@router.get("/jobs")
@limiter.limit("30/minute")
async def admin_jobs(request: Request, limit: int = Query(50, ge=1, le=200)):
    """Jobs asíncronos recientes (generación de tableros, etc.)."""
    if db_manager.db is not None:
        cursor = db_manager.db["jobs"].find({}, {"result": 0}).sort("created_at", -1).limit(limit)
        jobs = await cursor.to_list(limit)
        for j in jobs:
            j.pop("_id", None)
    else:
        jobs = sorted(
            in_memory_jobs.values(), key=lambda j: j.get("created_at") or "", reverse=True
        )[:limit]
    return {"jobs": jobs}


# ────────────────────── Superadmins ──────────────────────


@router.get("/superadmins")
@limiter.limit("30/minute")
async def admin_list_superadmins(request: Request):
    """Quién puede entrar aquí: rol persistido + bootstrap por env."""
    supers = []
    if db_manager.db is not None:
        cursor = db_manager.db["users"].find(
            {"role": "superadmin"}, {"password_hash": 0, "totp_secret": 0}
        )
        supers = await cursor.to_list(100)
    else:
        supers = [u for u in in_memory_auth_users.values() if u.get("role") == "superadmin"]
    return {
        "superadmins": [_admin_user(u) for u in supers],
        "env_bootstrap_emails": [
            e.strip() for e in (settings.SUPERADMIN_EMAILS or "").split(",") if e.strip()
        ],
    }


class SuperadminEmailRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)


@router.post("/superadmins")
@limiter.limit("10/minute")
async def admin_add_superadmin(
    request: Request,
    payload: SuperadminEmailRequest,
    current_user: dict = Depends(require_superadmin),
):
    """Eleva una cuenta existente a superadmin (MFA obligatorio)."""
    target = await _find_user_by_email(payload.email)
    if not target:
        raise HTTPException(status_code=404, detail="No existe una cuenta con ese email.")
    uid = str(target.get("id") or target.get("_id"))
    await _patch_user(uid, {"role": "superadmin", "mfa_required": True})
    await _audit(request, current_user, "superadmin_add", uid)
    return {"status": "superadmin_added", "user_id": uid}


@router.delete("/superadmins/{user_id}")
@limiter.limit("10/minute")
async def admin_remove_superadmin(
    request: Request,
    user_id: str,
    current_user: dict = Depends(require_superadmin),
):
    """Revoca el rol superadmin. No puedes revocarte a ti mismo (evita
    dejar la plataforma sin nadie al mando)."""
    if _uid(current_user) == user_id:
        raise HTTPException(status_code=400, detail="No puedes revocar tu propio rol.")
    target = await _get_user(user_id)
    if not target or target.get("role") != "superadmin":
        raise HTTPException(status_code=404, detail="Ese usuario no es superadmin.")
    await _patch_user(user_id, {"role": "individual"})
    await _audit(request, current_user, "superadmin_remove", user_id)
    return {"status": "superadmin_removed"}
