"""
Hubzy para Colegios (B2B): instituciones → grados/paralelos → materias.

Jerarquía:
  Institución ("Colegio San Andrés")
    └── Grado ("5to Secundaria B")  — join_code para matricular estudiantes
          └── Materia = study_folder con grade_id + institution_id
                └── Temas = islands del folder (ya existen)

Roles: admin (director/coordinador), teacher (docente), student.
Matrícula sin fricción: código de clase estilo Google Classroom.

Privacidad de menores: el docente ve métricas pedagógicas (estrellas,
niveles, XP, temas débiles) — NUNCA las conversaciones con Hubzi.
"""

import logging
import re
import secrets
import string
import unicodedata

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.core.age_bands import band_for_age
from app.core.audit import audit_event
from app.core.config import settings
from app.core.database import db_manager
from app.core.rate_limit import limiter
from app.core.security import get_optional_user, hash_password, safe_redirect_url, utcnow_iso
from app.core.session_store import in_memory_auth_users, in_memory_study_folders

logger = logging.getLogger("hubzy.institutions")

router = APIRouter(prefix="/api/v1/institutions", tags=["Institutions"])

# Almacenes en memoria (modo sin MongoDB)
in_memory_institutions: dict[str, dict] = {}
in_memory_grades: dict[str, dict] = {}
in_memory_student_progress: dict[str, dict] = {}  # f"{folder_id}:{user_id}:{island_id or 'folder'}"

MAX_GRADES_PER_INSTITUTION = 40
MIN_SEATS = 30  # licencia mínima institucional
SCHOOL_SEAT_PRICE_USD = 100  # $1.00 USD por estudiante/mes


def _uid(user: dict | None) -> str | None:
    if not user:
        return None
    return str(user.get("id") or user.get("_id") or "")


def _gen_code(prefix: str = "HUBZY") -> str:
    alphabet = string.ascii_uppercase + string.digits
    return f"{prefix}-" + "".join(secrets.choice(alphabet) for _ in range(5))


def _slug(text: str) -> str:
    s = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", ".", s.lower()).strip(".") or "alumno"


def _new_id() -> str:
    return str(ObjectId())


def _gen_credential() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "HUB-" + "".join(secrets.choice(alphabet) for _ in range(8))


async def _ensure_school_credential(user: dict) -> str:
    """Devuelve la credencial escolar del usuario; la genera y persiste si no
    tiene una (cubre usuarios creados antes de esta feature). Única por
    institución — reintenta en el improbable caso de colisión."""
    cred = user.get("school_credential")
    if cred:
        return cred
    for _ in range(5):
        cred = _gen_credential()
        clash = None
        if db_manager.db is not None:
            clash = await db_manager.db["users"].find_one(
                {"institution_id": user.get("institution_id"), "school_credential": cred},
                {"_id": 1},
            )
        else:
            clash = next(
                (
                    u
                    for u in in_memory_auth_users.values()
                    if u.get("institution_id") == user.get("institution_id")
                    and u.get("school_credential") == cred
                ),
                None,
            )
        if not clash:
            break
    await _set_membership(user.get("id") or str(user.get("_id")), {"school_credential": cred})
    return cred


# ────────────────────── Helpers de acceso ──────────────────────


async def _get_institution(inst_id: str) -> dict | None:
    if db_manager.db is not None:
        query = {"_id": ObjectId(inst_id)} if ObjectId.is_valid(inst_id) else {"id": inst_id}
        return await db_manager.db["institutions"].find_one(query)
    return in_memory_institutions.get(inst_id)


async def _get_grade(grade_id: str) -> dict | None:
    if db_manager.db is not None:
        query = {"_id": ObjectId(grade_id)} if ObjectId.is_valid(grade_id) else {"id": grade_id}
        return await db_manager.db["grades"].find_one(query)
    return in_memory_grades.get(grade_id)


async def _save_institution(inst: dict) -> None:
    if db_manager.db is not None:
        query = (
            {"_id": ObjectId(inst["id"])} if ObjectId.is_valid(inst["id"]) else {"id": inst["id"]}
        )
        await db_manager.db["institutions"].update_one(query, {"$set": inst}, upsert=True)
    else:
        in_memory_institutions[inst["id"]] = inst


async def _save_grade(grade: dict) -> None:
    if db_manager.db is not None:
        query = (
            {"_id": ObjectId(grade["id"])}
            if ObjectId.is_valid(grade["id"])
            else {"id": grade["id"]}
        )
        await db_manager.db["grades"].update_one(query, {"$set": grade}, upsert=True)
    else:
        in_memory_grades[grade["id"]] = grade


async def _update_user_membership(user_id: str, updates: dict) -> None:
    """Persiste role/institution_id/grade_ids/plan en el usuario."""
    if db_manager.db is not None:
        query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"id": user_id}
        await db_manager.db["users"].update_one(query, {"$set": updates})
    else:
        for doc in in_memory_auth_users.values():
            if doc.get("id") == user_id:
                doc.update(updates)
                return


async def _set_membership(user_id: str, updates: dict) -> None:
    """Actualiza membresía sin destruir el rol global `superadmin`:
    si el target ya es superadmin de plataforma, el rol se conserva."""
    if "role" in updates:
        u = await _get_user(user_id)
        if u and u.get("role") == "superadmin":
            updates = {**updates, "role": "superadmin"}
    await _update_user_membership(user_id, updates)


async def _get_user(user_id: str) -> dict | None:
    if db_manager.db is not None:
        query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"id": user_id}
        return await db_manager.db["users"].find_one(query)
    for doc in in_memory_auth_users.values():
        if doc.get("id") == user_id:
            return doc
    return None


def _stripe():
    import stripe

    stripe.api_key = settings.STRIPE_SECRET_KEY
    if not stripe.api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="La clave secreta de Stripe no está configurada.",
        )
    return stripe


async def _count_enrolled_students(inst_id: str) -> int:
    """Estudiantes únicos matriculados en cualquier grado de la institución."""
    grades = await _list_institution_grades(inst_id)
    students: set[str] = set()
    for g in grades:
        students |= set(g.get("student_ids") or [])
    return len(students)


async def _activate_school_subscription(
    inst_id: str,
    seats: int,
    customer_id: str | None = None,
    subscription_id: str | None = None,
) -> None:
    """Marca la licencia institucional como activa (webhook/verify de Stripe)."""
    inst = await _get_institution(inst_id)
    if not inst:
        logger.warning(f"Institución {inst_id} no encontrada al activar licencia.")
        return
    inst["subscription"] = {
        "status": "active",
        "seats": int(seats),
        "stripe_customer": customer_id,
        "stripe_subscription": subscription_id,
        "activated_at": utcnow_iso(),
    }
    await _save_institution(inst)
    logger.info(f"🏫 Licencia school activada: {inst.get('name')} ({seats} seats).")


async def _cancel_school_subscription(customer_id: str) -> None:
    """Baja la licencia cuando Stripe reporta la suscripción cancelada."""
    inst = None
    if db_manager.db is not None:
        inst = await db_manager.db["institutions"].find_one(
            {"subscription.stripe_customer": customer_id}
        )
    else:
        inst = next(
            (
                i
                for i in in_memory_institutions.values()
                if (i.get("subscription") or {}).get("stripe_customer") == customer_id
            ),
            None,
        )
    if inst:
        sub = inst.get("subscription") or {}
        sub["status"] = "canceled"
        inst["subscription"] = sub
        await _save_institution(inst)
        logger.info(f"Licencia school cancelada para {inst.get('name')}.")


async def _list_institution_grades(inst_id: str) -> list[dict]:
    if db_manager.db is not None:
        cursor = db_manager.db["grades"].find({"institution_id": inst_id})
        return [g async for g in cursor]
    return [g for g in in_memory_grades.values() if g.get("institution_id") == inst_id]


def _can_manage(user: dict | None, inst: dict) -> bool:
    # El rol es GLOBAL del usuario — NO otorga poder sobre instituciones
    # ajenas (cross-tenant). Solo la membresía explícita admin_ids cuenta.
    uid = _uid(user)
    return bool(uid and uid in (inst.get("admin_ids") or []))


def _can_teach(user: dict | None, inst: dict, grade: dict | None = None) -> bool:
    uid = _uid(user)
    if not uid:
        return False
    if _can_manage(user, inst):
        return True
    teachers = set(inst.get("teacher_ids") or [])
    if grade:
        teachers |= set(grade.get("teacher_ids") or [])
    return uid in teachers


def _serialize_inst(inst: dict, for_student: bool = False) -> dict:
    out = {
        "id": inst.get("id") or str(inst.get("_id")),
        "name": inst.get("name"),
        "plan": inst.get("plan", "school"),
        "created_at": inst.get("created_at"),
    }
    if not for_student:
        # El código PROF permite auto-elevarse a docente: jamás exponerlo a
        # estudiantes.
        out["teacher_code"] = inst.get("teacher_code")
        out["admin_ids"] = inst.get("admin_ids", [])
        out["subscription"] = inst.get("subscription")  # {status, seats, ...}
    return out


def _serialize_grade(g: dict, for_student: bool = False) -> dict:
    out = {
        "id": g.get("id") or str(g.get("_id")),
        "institution_id": g.get("institution_id"),
        "name": g.get("name"),
        "join_code": g.get("join_code"),
        "folder_ids": g.get("folder_ids", []),
        "created_at": g.get("created_at"),
    }
    if for_student:
        # Privacidad de menores: un estudiante no recibe la lista de IDs de
        # sus compañeros ni el código de clase (ya está matriculado).
        out["student_count"] = len(g.get("student_ids") or [])
        out.pop("join_code", None)
    else:
        out["teacher_ids"] = g.get("teacher_ids", [])
        out["student_ids"] = g.get("student_ids", [])
        out["student_count"] = len(g.get("student_ids") or [])
    return out


# ────────────────────── Schemas ──────────────────────


class InstitutionCreateRequest(BaseModel):
    name: str


class SchoolCheckoutRequest(BaseModel):
    seats: int  # estudiantes licenciados (mínimo MIN_SEATS)
    success_url: str | None = Field(default=None, max_length=500)
    cancel_url: str | None = Field(default=None, max_length=500)


class GradeCreateRequest(BaseModel):
    name: str  # "5to Secundaria B", "3ro Primaria"… libre


class JoinByCodeRequest(BaseModel):
    code: str


class GradeFolderRequest(BaseModel):
    name: str  # nombre de la materia
    description: str = ""


class AssignRequest(BaseModel):
    folder_id: str
    island_id: str | None = None  # None = toda la materia
    title: str = ""
    due_date: str | None = None  # ISO "2026-10-20"


class BulkStudentRow(BaseModel):
    username: str
    age: int | None = None
    password: str | None = None  # si vacío, se genera una temporal


class BulkEnrollRequest(BaseModel):
    students: list[BulkStudentRow]


# ────────────────────── Endpoints ──────────────────────


@router.post("", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def create_institution(
    request: Request,
    payload: InstitutionCreateRequest,
    current_user: dict | None = Depends(get_optional_user),
):
    """Crea una institución educativa. El creador queda como admin."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Inicia sesión para crear una institución.")
    uid = _uid(current_user)
    name = payload.name.strip()
    if len(name) < 3:
        raise HTTPException(status_code=400, detail="El nombre de la institución es muy corto.")

    inst = {
        "id": _new_id(),
        "name": name,
        "admin_ids": [uid],
        "teacher_ids": [],
        "teacher_code": _gen_code("PROF"),
        "plan": "school",
        "created_at": utcnow_iso(),
    }
    await _save_institution(inst)
    # El plan "school" lo activa el checkout Stripe — el plan PERSONAL del
    # usuario no cambia (las carpetas escolares no consumen su cuota).
    # Quien administra datos de menores lleva MFA obligatorio — el gate
    # `mfa_required` de security.py le fuerza el enrolamiento en su siguiente
    # request hasta completar /auth/mfa/setup+enable.
    await _set_membership(
        uid, {"institution_id": inst["id"], "role": "admin", "mfa_required": True}
    )
    logger.info(f"🏫 Institución '{name}' creada por {uid}")
    return {"institution": _serialize_inst(inst)}


@router.post("/join")
@limiter.limit("20/minute")
async def join_by_code(
    request: Request,
    payload: JoinByCodeRequest,
    current_user: dict | None = Depends(get_optional_user),
):
    """
    Matrícula por código:
      - código de GRADO (HUBZY-XXXXX)  → rol student en ese grado
      - código de DOCENTE (PROF-XXXXX) → rol teacher en la institución
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Inicia sesión para unirte con un código.")
    uid = _uid(current_user)
    code = payload.code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Ingresa un código válido.")

    # ¿Código de grado?
    grades_all = []
    if db_manager.db is not None:
        grades_all = await db_manager.db["grades"].find({"join_code": code}).to_list(10)
    else:
        grades_all = [g for g in in_memory_grades.values() if g.get("join_code") == code]

    if grades_all:
        grade = grades_all[0]
        gid = grade.get("id") or str(grade.get("_id"))
        students = set(grade.get("student_ids") or [])
        already_member = uid in students

        # Matrícula atómica: $addToSet elimina duplicados y la carrera entre
        # dos joins concurrentes. Después se re-cuenta la licencia y si la
        # institución quedó por encima del tope se hace rollback ($pull).
        if not already_member:
            grade_query = (
                {"_id": ObjectId(gid)} if ObjectId.is_valid(gid) else {"id": gid}
            )
            if db_manager.db is not None:
                res = await db_manager.db["grades"].update_one(
                    {**grade_query, "student_ids": {"$ne": uid}},
                    {"$addToSet": {"student_ids": uid}},
                )
                if res.matched_count == 0:
                    already_member = True  # join concurrente ya lo añadió
            else:
                grade["student_ids"] = sorted(students | {uid})
                await _save_grade(grade)

            inst_doc = await _get_institution(grade["institution_id"])
            # Institución suspendida (impago/baja): no entran nuevos alumnos.
            if ((inst_doc or {}).get("subscription") or {}).get("status") == "suspended":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="La institución está suspendida. Contacta a tu dirección.",
                )
            # Trial gratuito hasta MIN_SEATS; con suscripción activa el tope
            # son los seats pagados. Re-unirse nunca consume licencia.
            seat_limit = await _seat_limit(inst_doc or {})
            enrolled = await _count_enrolled_students(grade["institution_id"])
            if not already_member and enrolled > seat_limit:
                # Rollback: el seat excede la licencia → deshacer el $addToSet
                if db_manager.db is not None:
                    await db_manager.db["grades"].update_one(
                        grade_query, {"$pull": {"student_ids": uid}}
                    )
                else:
                    grade["student_ids"] = sorted(students)
                    await _save_grade(grade)
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail=(
                        f"La institución alcanzó su límite de {seat_limit} "
                        "estudiantes. Pide a tu dirección ampliar la licencia."
                    ),
                )
            grade = await _get_grade(gid) or grade

        user_doc = await _get_user(uid) or {}
        grade_ids = set(user_doc.get("grade_ids") or [])
        grade_ids.add(gid)
        await _set_membership(
            uid,
            {
                "institution_id": grade["institution_id"],
                "role": "student",
                "grade_ids": sorted(grade_ids),
            },
        )
        inst = await _get_institution(grade["institution_id"])
        return {
            "role": "student",
            "grade": _serialize_grade(grade, for_student=True),
            "institution": _serialize_inst(inst, for_student=True) if inst else None,
        }

    # ¿Código de docente?
    insts = []
    if db_manager.db is not None:
        insts = await db_manager.db["institutions"].find({"teacher_code": code}).to_list(5)
    else:
        insts = [i for i in in_memory_institutions.values() if i.get("teacher_code") == code]

    if insts:
        inst = insts[0]
        teachers = set(inst.get("teacher_ids") or [])
        teachers.add(uid)
        inst["teacher_ids"] = sorted(teachers)
        await _save_institution(inst)
        # Docente = acceso a datos de menores → MFA obligatorio.
        await _set_membership(
            uid,
            {"institution_id": inst["id"], "role": "teacher", "mfa_required": True},
        )
        return {"role": "teacher", "institution": _serialize_inst(inst)}

    raise HTTPException(status_code=404, detail="Código no válido o expirado.")


@router.get("/directory")
@limiter.limit("30/minute")
async def institutions_directory(request: Request):
    """Directorio público (id+nombre) para el selector de colegio del login.
    Solo nombres — nada de conteos, miembros ni licencias."""
    if db_manager.db is not None:
        insts = await db_manager.db["institutions"].find(
            {}, {"name": 1}
        ).sort("name", 1).to_list(500)
    else:
        insts = sorted(in_memory_institutions.values(), key=lambda i: i.get("name") or "")
    return {
        "institutions": [
            {"id": i.get("id") or str(i.get("_id")), "name": i.get("name")}
            for i in insts
        ]
    }


@router.get("/mine")
async def my_institution(current_user: dict | None = Depends(get_optional_user)):
    """Institución del usuario + sus grados (como docente/admin o estudiante)."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Inicia sesión.")
    inst_id = current_user.get("institution_id")
    inst = await _get_institution(inst_id) if inst_id else None
    if not inst:
        return {"institution": None, "grades": [], "role": current_user.get("role", "individual")}

    grades = await _list_institution_grades(inst["id"])
    role = current_user.get("role") or "individual"
    if role == "student":
        mine = set(current_user.get("grade_ids") or [])
        grades = [g for g in grades if (g.get("id") or str(g.get("_id"))) in mine]
    return {
        "institution": _serialize_inst(inst, for_student=role == "student"),
        "grades": [_serialize_grade(g, for_student=role == "student") for g in grades],
        "role": role,
        "my_school_credential": await _ensure_school_credential(current_user),
    }


@router.post("/{inst_id}/checkout")
@limiter.limit("5/minute")
async def school_checkout(
    request: Request,
    inst_id: str,
    payload: SchoolCheckoutRequest,
    current_user: dict | None = Depends(get_optional_user),
):
    """
    Licencia institucional: suscripción Stripe de `seats` estudiantes/mes.
    Solo el admin de la institución puede pagar. Al confirmarse el pago
    (webhook o verify-session) se activa `institution.subscription`.
    """
    inst = await _get_institution(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
    if not _can_manage(current_user, inst):
        raise HTTPException(
            status_code=403, detail="Solo el administrador gestiona la licencia."
        )
    seats = int(payload.seats)
    if seats < MIN_SEATS:
        raise HTTPException(
            status_code=400, detail=f"La licencia mínima es de {MIN_SEATS} estudiantes."
        )

    stripe = _stripe()
    frontend = settings.FRONTEND_URL.rstrip("/")
    # URLs de retorno solo al frontend configurado (anti-phishing).
    success_url = safe_redirect_url(
        payload.success_url, f"{frontend}/arena?school_payment=success"
    )
    cancel_url = safe_redirect_url(
        payload.cancel_url, f"{frontend}/arena?school_payment=cancelled"
    )

    if settings.STRIPE_SCHOOL_PRICE_ID:
        line_items = [{"price": settings.STRIPE_SCHOOL_PRICE_ID, "quantity": seats}]
    else:
        line_items = [
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"Hubzy Escuelas — {inst.get('name')}",
                        "description": (
                            "Licencia por estudiante: grados, materias, islas de "
                            "temas y panel docente con progreso."
                        ),
                    },
                    "unit_amount": SCHOOL_SEAT_PRICE_USD,
                    "recurring": {"interval": "month"},
                },
                "quantity": seats,
            }
        ]

    try:
        session = stripe.checkout.Session.create(
            line_items=line_items,
            mode="subscription",
            customer_email=current_user.get("email"),
            client_reference_id=inst["id"],
            success_url=f"{success_url}&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=cancel_url,
            metadata={
                "kind": "school",
                "institution_id": inst["id"],
                "seats": str(seats),
            },
        )
        return {
            "checkout_url": session.url,
            "session_id": session.id,
            "publishable_key": settings.STRIPE_PUBLISHABLE_KEY,
            "seats": seats,
        }
    except Exception as e:
        logger.error(f"Error creando checkout institucional: {e}")
        raise HTTPException(status_code=400, detail=f"Error en Stripe: {e!s}") from e


@router.post("/{inst_id}/grades", status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def create_grade(
    request: Request,
    inst_id: str,
    payload: GradeCreateRequest,
    current_user: dict | None = Depends(get_optional_user),
):
    """Admin/docente crea un grado o paralelo: '5to Secundaria B'."""
    inst = await _get_institution(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
    if not _can_teach(current_user, inst):
        raise HTTPException(status_code=403, detail="Solo docentes/admins crean grados.")

    existing = await _list_institution_grades(inst_id)
    if len(existing) >= MAX_GRADES_PER_INSTITUTION:
        raise HTTPException(status_code=400, detail="Límite de grados por institución alcanzado.")

    name = payload.name.strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Nombre de grado muy corto.")

    grade = {
        "id": _new_id(),
        "institution_id": inst["id"],
        "name": name,
        "join_code": _gen_code(),
        "teacher_ids": [_uid(current_user)] if current_user.get("role") == "teacher" else [],
        "folder_ids": [],
        "student_ids": [],
        "created_at": utcnow_iso(),
    }
    await _save_grade(grade)
    return {"grade": _serialize_grade(grade)}


@router.post("/grades/{grade_id}/folders", status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def create_grade_folder(
    request: Request,
    grade_id: str,
    payload: GradeFolderRequest,
    current_user: dict | None = Depends(get_optional_user),
):
    """Docente crea una MATERIA dentro del grado (= carpeta vinculada)."""
    grade = await _get_grade(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grado no encontrado.")
    inst = await _get_institution(grade["institution_id"])
    if not inst or not _can_teach(current_user, inst, grade):
        raise HTTPException(status_code=403, detail="Solo docentes del grado crean materias.")

    name = payload.name.strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Nombre de materia muy corto.")

    folder = {
        "id": _new_id(),
        "name": name,
        "description": payload.description.strip(),
        "user_id": _uid(current_user),  # el docente es dueño
        "institution_id": inst["id"],
        "grade_id": grade_id,
        "subject": name,
        "is_school_folder": True,
        "documents": [],
        "created_at": utcnow_iso(),
    }
    if db_manager.db is not None:
        res = await db_manager.db["study_folders"].insert_one(
            {**folder, "_id": ObjectId(folder["id"])}
        )
        folder["_id"] = res.inserted_id
    else:
        in_memory_study_folders[folder["id"]] = folder

    folder_ids = set(grade.get("folder_ids") or [])
    folder_ids.add(folder["id"])
    grade["folder_ids"] = sorted(folder_ids)
    await _save_grade(grade)
    return {"folder": {k: v for k, v in folder.items() if k != "_id"}}


@router.post("/grades/{grade_id}/assign")
@limiter.limit("30/minute")
async def assign_activity(
    request: Request,
    grade_id: str,
    payload: AssignRequest,
    current_user: dict | None = Depends(get_optional_user),
):
    """Docente asigna una isla/materia con fecha objetivo (badge 📌, sin castigo)."""
    grade = await _get_grade(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grado no encontrado.")
    inst = await _get_institution(grade["institution_id"])
    if not inst or not _can_teach(current_user, inst, grade):
        raise HTTPException(status_code=403, detail="Solo docentes del grado asignan tareas.")

    # La tarea solo puede apuntar a una materia del propio grado — nunca a
    # una carpeta ajena (la asignación se escribe en el doc de la carpeta).
    if payload.folder_id not in (grade.get("folder_ids") or []):
        raise HTTPException(
            status_code=400,
            detail="Esa materia no pertenece a este grado.",
        )

    assignment = {
        "folder_id": payload.folder_id,
        "island_id": payload.island_id,
        "title": payload.title.strip() or "Repaso asignado",
        "due_date": payload.due_date,
        "assigned_by": _uid(current_user),
        "assigned_at": utcnow_iso(),
    }
    if db_manager.db is not None:
        await db_manager.db["study_folders"].update_one(
            {"_id": ObjectId(payload.folder_id)}
            if ObjectId.is_valid(payload.folder_id)
            else {"id": payload.folder_id},
            {"$set": {"assignment": assignment}},
        )
    else:
        f = in_memory_study_folders.get(payload.folder_id)
        if f:
            f["assignment"] = assignment
    return {"status": "assigned", "assignment": assignment}


@router.get("/grades/{grade_id}/dashboard")
@limiter.limit("30/minute")
async def grade_dashboard(
    request: Request,
    grade_id: str,
    current_user: dict | None = Depends(get_optional_user),
):
    """
    Panel docente: progreso pedagógico por estudiante × materia × isla.
    Métricas de aprendizaje únicamente — jamás contenido emocional/chat.
    """
    grade = await _get_grade(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grado no encontrado.")
    inst = await _get_institution(grade["institution_id"])
    if not inst or not _can_teach(current_user, inst, grade):
        raise HTTPException(status_code=403, detail="Solo docentes/admins ven el panel.")

    rows = []
    # Temas débiles del curso: islas donde estudiantes jugaron pero no
    # completaron (o con baja estrella media) — señal pedagógica para el docente.
    weak_islands: dict[str, dict] = {}
    for student_id in grade.get("student_ids") or []:
        rows.append(await _student_progress_entry(grade, student_id, weak_islands))

    weak_sorted = sorted(weak_islands.values(), key=lambda x: -x["students"])
    return {
        "grade": _serialize_grade(grade),
        "students": rows,
        "weak_topics": weak_sorted,
    }


async def _student_progress_entry(
    grade: dict, student_id: str, weak_islands: dict | None = None
) -> dict:
    """Fila de progreso de UN estudiante sobre todas las materias del grado.
    `weak_islands` (opcional) acumula temas débiles del curso."""
    user_doc = await _get_user(student_id)
    entry = {
        "student_id": student_id,
        "username": (user_doc or {}).get("username", "Estudiante"),
        "subjects": [],
    }
    for fid in grade.get("folder_ids") or []:
        folder = None
        if db_manager.db is not None:
            folder = await db_manager.db["study_folders"].find_one(
                {"_id": ObjectId(fid)} if ObjectId.is_valid(fid) else {"id": fid},
                {"documents.extracted_text": 0},
            )
        else:
            folder = in_memory_study_folders.get(fid)
        if not folder:
            continue

        # Progreso por isla del estudiante en esta materia
        island_rows = []
        for isl in folder.get("islands") or []:
            prog = await get_student_progress_doc(folder["id"], student_id, isl["id"])
            if not prog:
                continue
            total = isl.get("total_levels") or 1
            stars_map = prog.get("level_stars") or {}
            stars_sum = sum(v for v in stars_map.values())
            completed = bool(
                prog.get("campaign_completed")
                or (prog.get("unlocked_level") or 1) > total
                or len([s for s in stars_map.values() if s >= 1]) >= total
            )
            avg_stars = stars_sum / max(1, len(stars_map))
            island_rows.append(
                {
                    "island_id": isl["id"],
                    "island_name": isl.get("name"),
                    "current_level": prog.get("current_level", 1),
                    "unlocked_level": prog.get("unlocked_level", 1),
                    "total_levels": total,
                    "completed": completed,
                    "stars": stars_sum,
                    "xp": prog.get("total_xp", 0),
                    "last_played_at": prog.get("last_played_at"),
                }
            )
            # Jugada pero no dominada → cuenta como tema débil del curso
            if weak_islands is not None and (not completed or avg_stars < 2):
                wkey = f"{folder.get('subject') or folder.get('name')} · {isl.get('name')}"
                slot = weak_islands.setdefault(wkey, {"topic": wkey, "students": 0})
                slot["students"] += 1
        subj_prog = await get_student_progress_doc(folder["id"], student_id, None)
        entry["subjects"].append(
            {
                "folder_id": folder["id"],
                "subject": folder.get("subject") or folder.get("name"),
                "islands": island_rows,
                "folder_progress": subj_prog,
            }
        )
    return entry


@router.post("/grades/{grade_id}/students/bulk")
@limiter.limit("10/minute")
async def bulk_enroll_students(
    request: Request,
    grade_id: str,
    payload: BulkEnrollRequest,
    current_user: dict | None = Depends(get_optional_user),
):
    """
    Matrícula masiva (import CSV): crea cuentas de estudiante gestionadas
    por el colegio con credenciales temporales que el docente distribuye.
    Respeta el límite de seats de la licencia.
    """
    grade = await _get_grade(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grado no encontrado.")
    inst = await _get_institution(grade["institution_id"])
    if not inst or not _can_teach(current_user, inst, grade):
        raise HTTPException(status_code=403, detail="Solo docentes del grado matriculan.")

    rows = [r for r in payload.students if r.username.strip()]
    if not rows:
        raise HTTPException(status_code=400, detail="La lista de estudiantes está vacía.")
    if len(rows) > 200:
        raise HTTPException(status_code=400, detail="Máximo 200 estudiantes por importación.")

    gid = grade.get("id") or str(grade.get("_id"))
    enrolled = await _count_enrolled_students(inst["id"])
    seat_limit = await _seat_limit(inst)
    if enrolled + len(rows) > seat_limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=(
                f"Cupos insuficientes: quedan {max(0, seat_limit - enrolled)} de "
                f"{seat_limit}. Amplía la licencia institucional."
            ),
        )

    students_set = set(grade.get("student_ids") or [])
    created = []
    for row in rows:
        cred = await _create_managed_student(inst, gid, row.username, row.age, row.password)
        if not cred:
            continue
        students_set.add(cred["id"])
        created.append({
            "username": cred["username"],
            "email": cred["email"],
            "password": cred["password"],
            "school_credential": cred["school_credential"],
        })

    grade["student_ids"] = sorted(students_set)
    await _save_grade(grade)
    logger.info(
        f"🏫 Matrícula masiva: {len(created)} estudiantes en '{grade.get('name')}'."
    )
    return {
        "created": created,
        "count": len(created),
        "seats_used": enrolled + len(created),
        "seat_limit": seat_limit,
    }


@router.get("/grades/{grade_id}/students/{student_id}/report")
@limiter.limit("30/minute")
async def student_report(
    request: Request,
    grade_id: str,
    student_id: str,
    current_user: dict | None = Depends(get_optional_user),
):
    """Reporte individual imprimible (padres/docente): progreso por materia e isla."""
    grade = await _get_grade(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grado no encontrado.")
    inst = await _get_institution(grade["institution_id"])
    if not inst or not _can_teach(current_user, inst, grade):
        raise HTTPException(status_code=403, detail="Solo docentes/admins ven reportes.")
    if student_id not in (grade.get("student_ids") or []):
        raise HTTPException(status_code=404, detail="El estudiante no pertenece al grado.")

    entry = await _student_progress_entry(grade, student_id)
    return {
        "institution": _serialize_inst(inst),
        "grade": _serialize_grade(grade),
        "student": entry,
        "generated_at": utcnow_iso(),
    }


async def _get_student_progress(folder_id: str, user_id: str, island_id: str | None) -> dict | None:
    """Lee progreso por estudiante en carpeta escolar (colección separada)."""
    key = f"{folder_id}:{user_id}:{island_id or 'folder'}"
    if db_manager.db is not None:
        return await db_manager.db["student_progress"].find_one({"_key": key})
    return in_memory_student_progress.get(key)


async def save_student_progress(
    folder_id: str, user_id: str, island_id: str | None, progress: dict
) -> None:
    """Persiste progreso por estudiante (carpetas escolares compartidas)."""
    key = f"{folder_id}:{user_id}:{island_id or 'folder'}"
    doc = {
        "_key": key,
        "folder_id": folder_id,
        "user_id": user_id,
        "island_id": island_id,
        "progress": progress,
    }
    if db_manager.db is not None:
        await db_manager.db["student_progress"].update_one(
            {"_key": key}, {"$set": doc}, upsert=True
        )
    else:
        in_memory_student_progress[key] = doc


async def get_student_progress_doc(
    folder_id: str, user_id: str, island_id: str | None
) -> dict | None:
    """Devuelve solo el subdoc 'progress' o None."""
    doc = await _get_student_progress(folder_id, user_id, island_id)
    return (doc or {}).get("progress")


async def delete_student_progress(folder_id: str, user_id: str, island_id: str | None) -> None:
    key = f"{folder_id}:{user_id}:{island_id or 'folder'}"
    if db_manager.db is not None:
        await db_manager.db["student_progress"].delete_one({"_key": key})
    else:
        in_memory_student_progress.pop(key, None)


# ────────────────────── Gestión: helpers ──────────────────────


def _doc_query(doc_id: str) -> dict:
    return {"_id": ObjectId(doc_id)} if ObjectId.is_valid(doc_id) else {"id": doc_id}


async def _seat_limit(inst: dict) -> int:
    sub = inst.get("subscription") or {}
    return int(sub.get("seats") or MIN_SEATS) if sub.get("status") == "active" else MIN_SEATS


async def _create_managed_student(
    inst: dict, gid: str, uname: str, age: int | None, password: str | None
) -> dict | None:
    """Crea la cuenta gestionada de UN estudiante (email sintético +
    contraseña temporal). Devuelve {username, email, password} o None."""
    uname = uname.strip()[:40]
    if len(uname) < 2:
        return None
    inst_suffix = inst["id"][-4:]
    email = f"alumno.{_slug(uname)}.{secrets.token_hex(4)}.{inst_suffix}@hubzy.school"
    password = (password or secrets.token_urlsafe(6))[:64]
    uid = _new_id()
    # Edad opcional: sin ella usamos 12 (banda neutral de secundaria).
    age_val = age if isinstance(age, int) and 4 <= age <= 120 else 12
    user_doc = {
        "id": uid,
        "email": email,
        "password_hash": hash_password(password),
        "username": uname,
        "age": age_val,
        "age_band": band_for_age(age_val),
        "role": "student",
        "institution_id": inst["id"],
        "grade_ids": [gid],
        "school_managed": True,
        "school_credential": _gen_credential(),
        "email_verified": True,
        "must_change_password": True,
        "created_at": utcnow_iso(),
    }
    if db_manager.db is not None:
        try:
            await db_manager.db["users"].insert_one({**user_doc, "_id": ObjectId(uid)})
        except Exception:
            # Colisión de email sintético: reintenta con sufijo nuevo.
            email = (
                f"alumno.{_slug(uname)}.{secrets.token_hex(4)}."
                f"{inst_suffix}@hubzy.school"
            )
            user_doc["email"] = email
            await db_manager.db["users"].insert_one({**user_doc, "_id": ObjectId(uid)})
    else:
        in_memory_auth_users[email] = user_doc
    return {
        "username": uname,
        "email": email,
        "password": password,
        "id": uid,
        "school_credential": user_doc["school_credential"],
    }


async def _delete_school_folder(folder_id: str) -> None:
    """Borra una materia escolar: doc + vectores RAG + progreso por estudiante."""
    from app.services.rag_service import rag_service

    try:
        await rag_service.delete_folder_vectors(folder_id)
    except Exception as e:
        logger.warning(f"Error limpiando vectores de {folder_id}: {e}")
    if db_manager.db is not None:
        await db_manager.db["student_progress"].delete_many({"folder_id": folder_id})
        await db_manager.db["study_folders"].delete_one(_doc_query(folder_id))
    else:
        prefix = f"{folder_id}:"
        for key in [k for k in in_memory_student_progress if k.startswith(prefix)]:
            in_memory_student_progress.pop(key, None)
        in_memory_study_folders.pop(folder_id, None)


async def _resolve_users(uids: list[str], with_credential: bool = False) -> list[dict]:
    """Mini-perfil de usuarios por id (para listas de docentes/estudiantes).
    `with_credential` añade `school_credential` (solo para vistas de admin)."""
    out = []
    for uid in uids or []:
        u = await _get_user(uid)
        if u:
            item = {
                "id": str(u.get("id") or u.get("_id")),
                "username": u.get("username"),
                "email": u.get("email"),
                "role": u.get("role"),
                "must_change_password": bool(u.get("must_change_password")),
            }
            if with_credential:
                item["school_credential"] = await _ensure_school_credential(u)
            out.append(item)
    return out


# ────────────────────── Gestión: institución ──────────────────────


class InstitutionUpdateRequest(BaseModel):
    name: str


@router.patch("/{inst_id}")
@limiter.limit("20/minute")
async def update_institution(
    request: Request,
    inst_id: str,
    payload: InstitutionUpdateRequest,
    current_user: dict | None = Depends(get_optional_user),
):
    """Admin renombra la institución."""
    inst = await _get_institution(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
    if not _can_manage(current_user, inst):
        raise HTTPException(status_code=403, detail="Solo el administrador edita la institución.")
    name = payload.name.strip()
    if len(name) < 3:
        raise HTTPException(status_code=400, detail="El nombre de la institución es muy corto.")
    inst["name"] = name
    await _save_institution(inst)
    return {"institution": _serialize_inst(inst)}


@router.post("/{inst_id}/regenerate-teacher-code")
@limiter.limit("10/minute")
async def regenerate_teacher_code(
    request: Request,
    inst_id: str,
    current_user: dict | None = Depends(get_optional_user),
):
    """Rota el código PROF- (el anterior queda inválido de inmediato)."""
    inst = await _get_institution(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
    if not _can_manage(current_user, inst):
        raise HTTPException(status_code=403, detail="Solo el administrador rota el código.")
    inst["teacher_code"] = _gen_code("PROF")
    await _save_institution(inst)
    await audit_event("institution_teacher_code_rotated", request=request, actor_id=_uid(current_user))
    return {"teacher_code": inst["teacher_code"]}


@router.get("/{inst_id}/teachers")
@limiter.limit("30/minute")
async def list_teachers(
    request: Request,
    inst_id: str,
    current_user: dict | None = Depends(get_optional_user),
):
    """Docentes de la institución (y a qué grados están asignados)."""
    inst = await _get_institution(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
    if not _can_teach(current_user, inst):
        raise HTTPException(status_code=403, detail="Solo staff de la institución.")
    is_admin = _can_manage(current_user, inst)
    teachers = await _resolve_users(inst.get("teacher_ids") or [], with_credential=is_admin)
    grades = await _list_institution_grades(inst["id"])
    for t in teachers:
        t["grade_ids"] = [
            g.get("id") or str(g.get("_id"))
            for g in grades
            if t["id"] in (g.get("teacher_ids") or [])
        ]
    admins = await _resolve_users(inst.get("admin_ids") or [], with_credential=is_admin)
    return {"teachers": teachers, "admins": admins}


@router.delete("/{inst_id}/teachers/{teacher_id}")
@limiter.limit("20/minute")
async def remove_teacher(
    request: Request,
    inst_id: str,
    teacher_id: str,
    current_user: dict | None = Depends(get_optional_user),
):
    """Admin quita un docente: sale de la institución y de todos sus grados."""
    inst = await _get_institution(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
    if not _can_manage(current_user, inst):
        raise HTTPException(status_code=403, detail="Solo el administrador quita docentes.")

    inst["teacher_ids"] = [t for t in (inst.get("teacher_ids") or []) if t != teacher_id]
    inst["admin_ids"] = [a for a in (inst.get("admin_ids") or []) if a != teacher_id]
    await _save_institution(inst)

    for g in await _list_institution_grades(inst["id"]):
        if teacher_id in (g.get("teacher_ids") or []):
            g["teacher_ids"] = [t for t in g["teacher_ids"] if t != teacher_id]
            await _save_grade(g)

    udoc = await _get_user(teacher_id)
    if udoc and udoc.get("institution_id") == inst["id"]:
        await _set_membership(
            teacher_id,
            {"institution_id": None, "role": "individual", "mfa_required": False},
        )
    await audit_event(
        "institution_teacher_removed",
        request=request,
        actor_id=_uid(current_user),
        detail={"institution_id": inst["id"], "teacher_id": teacher_id},
    )
    return {"status": "teacher_removed"}


class TeacherCreateRequest(BaseModel):
    username: str = Field(min_length=2, max_length=40)
    grade_ids: list[str] = []


@router.post("/{inst_id}/teachers", status_code=201)
@limiter.limit("20/minute")
async def create_teacher(
    request: Request,
    inst_id: str,
    payload: TeacherCreateRequest,
    current_user: dict | None = Depends(get_optional_user),
):
    """Admin crea directamente la cuenta gestionada de un docente (email
    sintético + contraseña temporal + credencial HUB-) y lo asigna a grados.
    Alternativa al auto-registro con código PROF-."""
    inst = await _get_institution(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
    if not _can_manage(current_user, inst):
        raise HTTPException(status_code=403, detail="Solo el administrador crea docentes.")

    grades = await _list_institution_grades(inst["id"])
    valid_gids = {g.get("id") or str(g.get("_id")) for g in grades}
    gids = [g for g in payload.grade_ids if g in valid_gids]

    uname = payload.username.strip()[:40]
    inst_suffix = inst["id"][-4:]
    email = f"docente.{_slug(uname)}.{secrets.token_hex(4)}.{inst_suffix}@hubzy.school"
    password = secrets.token_urlsafe(6)
    uid = _new_id()
    user_doc = {
        "id": uid,
        "email": email,
        "password_hash": hash_password(password),
        "username": uname,
        "age": 34,
        "age_band": "pro",
        "role": "teacher",
        "institution_id": inst["id"],
        "grade_ids": gids,
        "school_managed": True,
        "school_credential": _gen_credential(),
        "email_verified": True,
        "must_change_password": True,
        "created_at": utcnow_iso(),
    }
    if db_manager.db is not None:
        await db_manager.db["users"].insert_one({**user_doc, "_id": ObjectId(uid)})
    else:
        in_memory_auth_users[email] = user_doc

    inst["teacher_ids"] = list({*(inst.get("teacher_ids") or []), uid})
    await _save_institution(inst)
    for g in grades:
        gid = g.get("id") or str(g.get("_id"))
        if gid in gids:
            g["teacher_ids"] = list({*(g.get("teacher_ids") or []), uid})
            await _save_grade(g)

    await audit_event(
        "institution_teacher_created",
        request=request,
        actor_id=_uid(current_user),
        detail={"institution_id": inst["id"], "teacher_id": uid},
    )
    return {
        "teacher": {
            "id": uid,
            "username": uname,
            "email": email,
            "role": "teacher",
            "grade_ids": gids,
            "school_credential": user_doc["school_credential"],
            "password": password,
        }
    }


class TeacherUpdateRequest(BaseModel):
    username: str | None = Field(default=None, min_length=2, max_length=40)
    regenerate_credential: bool = False


@router.patch("/{inst_id}/teachers/{teacher_id}")
@limiter.limit("20/minute")
async def update_teacher(
    request: Request,
    inst_id: str,
    teacher_id: str,
    payload: TeacherUpdateRequest,
    current_user: dict | None = Depends(get_optional_user),
):
    """Admin edita un docente: renombrar y/o regenerar su credencial escolar
    (al regenerarla, la anterior deja de funcionar)."""
    inst = await _get_institution(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
    if not _can_manage(current_user, inst):
        raise HTTPException(status_code=403, detail="Solo el administrador edita docentes.")
    if teacher_id not in ((inst.get("teacher_ids") or []) + (inst.get("admin_ids") or [])):
        raise HTTPException(status_code=404, detail="Docente no pertenece a la institución.")

    updates: dict = {}
    if payload.username:
        updates["username"] = payload.username.strip()[:40]
    if payload.regenerate_credential:
        updates["school_credential"] = _gen_credential()
    if not updates:
        raise HTTPException(status_code=400, detail="Nada que actualizar.")
    await _set_membership(teacher_id, updates)
    await audit_event(
        "institution_teacher_updated",
        request=request,
        actor_id=_uid(current_user),
        detail={"institution_id": inst["id"], "teacher_id": teacher_id},
    )
    udoc = await _get_user(teacher_id)
    return {
        "teacher": {
            "id": teacher_id,
            "username": udoc.get("username"),
            "email": udoc.get("email"),
            "role": udoc.get("role"),
            "school_credential": udoc.get("school_credential"),
        }
    }


@router.get("/{inst_id}/overview")
@limiter.limit("30/minute")
async def institution_overview(
    request: Request,
    inst_id: str,
    current_user: dict | None = Depends(get_optional_user),
):
    """KPIs de la institución para su panel: grados, materias, docentes,
    estudiantes matriculados y uso de la licencia (seats)."""
    inst = await _get_institution(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
    if not _can_teach(current_user, inst):
        raise HTTPException(status_code=403, detail="Solo staff de la institución.")

    grades = await _list_institution_grades(inst["id"])
    folder_ids: list[str] = []
    students: set[str] = set()
    for g in grades:
        folder_ids += g.get("folder_ids") or []
        students |= set(g.get("student_ids") or [])

    # Estudiantes activos (7d): jugaron alguna materia del colegio recientemente.
    from datetime import datetime, timedelta, timezone

    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    active: set[str] = set()
    if db_manager.db is not None and folder_ids:
        cursor = db_manager.db["student_progress"].find(
            {"folder_id": {"$in": folder_ids}},
            {"user_id": 1, "progress.last_played_at": 1},
        )
        async for p in cursor:
            if ((p.get("progress") or {}).get("last_played_at") or "") >= cutoff:
                active.add(p.get("user_id"))
    elif folder_ids:
        for doc in in_memory_student_progress.values():
            if (
                doc.get("folder_id") in folder_ids
                and ((doc.get("progress") or {}).get("last_played_at") or "") >= cutoff
            ):
                active.add(doc.get("user_id"))

    sub = inst.get("subscription") or {}
    return {
        "institution": _serialize_inst(inst),
        "grades_count": len(grades),
        "subjects_count": len(set(folder_ids)),
        "teachers_count": len(inst.get("teacher_ids") or []),
        "students_enrolled": len(students),
        "students_active_7d": len(active),
        "seat_limit": await _seat_limit(inst),
        "subscription": sub or None,
    }


async def delete_institution_cascade(inst: dict) -> dict:
    """
    Borrado en cascada de una institución: grados, materias escolares
    (con su progreso y vectores) y la membresía de todos sus usuarios —
    las CUENTAS se conservan y pasan a individuales. Reusado por el
    endpoint del admin de la institución y por el superadmin (/admin).
    """
    grades = await _list_institution_grades(inst["id"])
    folders_deleted = 0
    for g in grades:
        for fid in g.get("folder_ids") or []:
            try:
                await _delete_school_folder(fid)
                folders_deleted += 1
            except Exception as e:
                logger.warning(f"Error borrando materia {fid}: {e}")
        if db_manager.db is not None:
            await db_manager.db["grades"].delete_one(_doc_query(g.get("id") or str(g.get("_id"))))
        else:
            in_memory_grades.pop(g.get("id") or str(g.get("_id")), None)

    # Desvincular miembros: conservan su cuenta como individuales.
    member_ids = set(inst.get("admin_ids") or []) | set(inst.get("teacher_ids") or [])
    for g in grades:
        member_ids |= set(g.get("student_ids") or [])
    if db_manager.db is not None:
        cursor = db_manager.db["users"].find({"institution_id": inst["id"]}, {"_id": 1})
        async for u in cursor:
            member_ids.add(str(u["_id"]))
    for uid in member_ids:
        udoc = await _get_user(uid)
        if udoc and udoc.get("institution_id") == inst["id"]:
            await _set_membership(
                uid,
                {
                    "institution_id": None,
                    "role": "individual",
                    "grade_ids": [],
                    "mfa_required": False,
                },
            )

    if db_manager.db is not None:
        await db_manager.db["institutions"].delete_one(_doc_query(inst["id"]))
    else:
        in_memory_institutions.pop(inst["id"], None)
    logger.info(f"🏫 Institución '{inst.get('name')}' eliminada ({len(grades)} grados).")
    return {"grades_deleted": len(grades), "folders_deleted": folders_deleted}


@router.delete("/{inst_id}")
@limiter.limit("5/minute")
async def delete_institution(
    request: Request,
    inst_id: str,
    current_user: dict | None = Depends(get_optional_user),
):
    """Borrado en cascada de la institución (solo su admin)."""
    inst = await _get_institution(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
    if not _can_manage(current_user, inst):
        raise HTTPException(status_code=403, detail="Solo el administrador elimina la institución.")

    result = await delete_institution_cascade(inst)
    await audit_event(
        "institution_deleted",
        request=request,
        actor_id=_uid(current_user),
        detail={"institution_id": inst["id"], **result},
    )
    return {"status": "institution_deleted", **result}


# ────────────────────── Gestión: grados ──────────────────────


class GradeUpdateRequest(BaseModel):
    name: str


@router.patch("/grades/{grade_id}")
@limiter.limit("20/minute")
async def update_grade(
    request: Request,
    grade_id: str,
    payload: GradeUpdateRequest,
    current_user: dict | None = Depends(get_optional_user),
):
    """Renombra un grado/paralelo."""
    grade = await _get_grade(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grado no encontrado.")
    inst = await _get_institution(grade["institution_id"])
    if not inst or not _can_teach(current_user, inst, grade):
        raise HTTPException(status_code=403, detail="Solo staff del grado.")
    name = payload.name.strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Nombre de grado muy corto.")
    grade["name"] = name
    await _save_grade(grade)
    return {"grade": _serialize_grade(grade)}


@router.post("/grades/{grade_id}/regenerate-code")
@limiter.limit("10/minute")
async def regenerate_grade_code(
    request: Request,
    grade_id: str,
    current_user: dict | None = Depends(get_optional_user),
):
    """Rota el código de unión del grado (el anterior deja de funcionar)."""
    grade = await _get_grade(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grado no encontrado.")
    inst = await _get_institution(grade["institution_id"])
    if not inst or not _can_teach(current_user, inst, grade):
        raise HTTPException(status_code=403, detail="Solo staff del grado.")
    grade["join_code"] = _gen_code()
    await _save_grade(grade)
    return {"join_code": grade["join_code"]}


@router.delete("/grades/{grade_id}")
@limiter.limit("10/minute")
async def delete_grade(
    request: Request,
    grade_id: str,
    delete_folders: bool = False,
    current_user: dict | None = Depends(get_optional_user),
):
    """
    Elimina un grado (solo admin). Las materias se BORRAN con
    ?delete_folders=true o, por defecto, pasan a ser carpetas personales
    del docente que las creó (conserva su material). Los estudiantes
    quedan desmatriculados del grado.
    """
    grade = await _get_grade(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grado no encontrado.")
    inst = await _get_institution(grade["institution_id"])
    if not inst or not _can_manage(current_user, inst):
        raise HTTPException(status_code=403, detail="Solo el administrador elimina grados.")

    gid = grade.get("id") or str(grade.get("_id"))
    for fid in grade.get("folder_ids") or []:
        if delete_folders:
            await _delete_school_folder(fid)
        else:
            # Reasignar como carpeta personal del docente que la creó
            updates = {"is_school_folder": False, "grade_id": None, "institution_id": None}
            if db_manager.db is not None:
                await db_manager.db["study_folders"].update_one(_doc_query(fid), {"$set": updates})
            elif fid in in_memory_study_folders:
                in_memory_study_folders[fid].update(updates)

    for uid in grade.get("student_ids") or []:
        udoc = await _get_user(uid)
        if udoc:
            remaining = [g for g in (udoc.get("grade_ids") or []) if g != gid]
            await _update_user_membership(uid, {"grade_ids": remaining})

    if db_manager.db is not None:
        await db_manager.db["grades"].delete_one(_doc_query(gid))
    else:
        in_memory_grades.pop(gid, None)

    await audit_event(
        "grade_deleted",
        request=request,
        actor_id=_uid(current_user),
        detail={"grade_id": gid, "folders_deleted": delete_folders},
    )
    return {"status": "grade_deleted", "grade_id": gid, "folders_deleted": delete_folders}


# ────────────────────── Gestión: materias del grado ──────────────────────


@router.get("/grades/{grade_id}/folders")
@limiter.limit("30/minute")
async def list_grade_folders(
    request: Request,
    grade_id: str,
    current_user: dict | None = Depends(get_optional_user),
):
    """Materias del grado (proyección ligera: sin texto extraído ni tableros)."""
    grade = await _get_grade(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grado no encontrado.")
    inst = await _get_institution(grade["institution_id"])
    if not inst or not _can_teach(current_user, inst, grade):
        raise HTTPException(status_code=403, detail="Solo staff del grado.")

    out = []
    for fid in grade.get("folder_ids") or []:
        f = None
        if db_manager.db is not None:
            f = await db_manager.db["study_folders"].find_one(
                _doc_query(fid), {"documents.extracted_text": 0, "cached_board": 0, "cached_boards": 0}
            )
        else:
            f = in_memory_study_folders.get(fid)
        if not f:
            continue
        owner = await _get_user(str(f.get("user_id") or ""))
        out.append(
            {
                "id": f.get("id") or str(f.get("_id")),
                "name": f.get("name"),
                "subject": f.get("subject"),
                "description": f.get("description"),
                "documents_count": len(f.get("documents") or []),
                "islands": [
                    {"id": i.get("id"), "name": i.get("name"), "total_levels": i.get("total_levels")}
                    for i in (f.get("islands") or [])
                ],
                "assignment": f.get("assignment"),
                "owner_name": (owner or {}).get("username"),
                "created_at": f.get("created_at"),
            }
        )
    return {"folders": out}


# ────────────────────── Gestión: estudiantes ──────────────────────


@router.get("/grades/{grade_id}/students")
@limiter.limit("30/minute")
async def list_grade_students(
    request: Request,
    grade_id: str,
    current_user: dict | None = Depends(get_optional_user),
):
    """Lista simple de estudiantes del grado (para la tabla de gestión)."""
    grade = await _get_grade(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grado no encontrado.")
    inst = await _get_institution(grade["institution_id"])
    if not inst or not _can_teach(current_user, inst, grade):
        raise HTTPException(status_code=403, detail="Solo staff del grado.")
    return {
        "students": await _resolve_users(
            grade.get("student_ids") or [],
            with_credential=_can_manage(current_user, inst),
        )
    }


class SingleEnrollRequest(BaseModel):
    username: str
    age: int | None = None
    password: str | None = None


@router.post("/grades/{grade_id}/students", status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def enroll_student(
    request: Request,
    grade_id: str,
    payload: SingleEnrollRequest,
    current_user: dict | None = Depends(get_optional_user),
):
    """Matrícula individual: crea la cuenta gestionada de un estudiante."""
    grade = await _get_grade(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grado no encontrado.")
    inst = await _get_institution(grade["institution_id"])
    if not inst or not _can_teach(current_user, inst, grade):
        raise HTTPException(status_code=403, detail="Solo staff del grado matricula.")

    gid = grade.get("id") or str(grade.get("_id"))
    enrolled = await _count_enrolled_students(inst["id"])
    seat_limit = await _seat_limit(inst)
    if enrolled + 1 > seat_limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Cupos agotados: {enrolled} de {seat_limit}. Amplía la licencia.",
        )

    cred = await _create_managed_student(inst, gid, payload.username, payload.age, payload.password)
    if not cred:
        raise HTTPException(status_code=400, detail="Nombre de estudiante inválido.")

    grade["student_ids"] = sorted(set(grade.get("student_ids") or []) | {cred["id"]})
    await _save_grade(grade)
    return {
        "created": {
            "username": cred["username"],
            "email": cred["email"],
            "password": cred["password"],
            "school_credential": cred["school_credential"],
        },
        "seats_used": enrolled + 1,
        "seat_limit": seat_limit,
    }


@router.delete("/grades/{grade_id}/students/{student_id}")
@limiter.limit("20/minute")
async def unenroll_student(
    request: Request,
    grade_id: str,
    student_id: str,
    current_user: dict | None = Depends(get_optional_user),
):
    """Desmatricula un estudiante del grado (su cuenta se conserva)."""
    grade = await _get_grade(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grado no encontrado.")
    inst = await _get_institution(grade["institution_id"])
    if not inst or not _can_teach(current_user, inst, grade):
        raise HTTPException(status_code=403, detail="Solo staff del grado.")

    gid = grade.get("id") or str(grade.get("_id"))
    if student_id not in (grade.get("student_ids") or []):
        raise HTTPException(status_code=404, detail="El estudiante no pertenece al grado.")
    grade["student_ids"] = [s for s in grade["student_ids"] if s != student_id]
    await _save_grade(grade)

    udoc = await _get_user(student_id)
    if udoc:
        await _update_user_membership(
            student_id, {"grade_ids": [g for g in (udoc.get("grade_ids") or []) if g != gid]}
        )
    await audit_event(
        "student_unenrolled",
        request=request,
        actor_id=_uid(current_user),
        detail={"grade_id": gid, "student_id": student_id},
    )
    return {"status": "student_unenrolled"}


@router.post("/grades/{grade_id}/students/{student_id}/reset-password")
@limiter.limit("10/minute")
async def reset_student_password(
    request: Request,
    grade_id: str,
    student_id: str,
    current_user: dict | None = Depends(get_optional_user),
):
    """Nueva contraseña temporal para un estudiante (el docente se la entrega).
    Sus sesiones quedan cerradas (token_version+1) y debe cambiarla al entrar."""
    grade = await _get_grade(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grado no encontrado.")
    inst = await _get_institution(grade["institution_id"])
    if not inst or not _can_teach(current_user, inst, grade):
        raise HTTPException(status_code=403, detail="Solo staff del grado.")
    if student_id not in (grade.get("student_ids") or []):
        raise HTTPException(status_code=404, detail="El estudiante no pertenece al grado.")

    udoc = await _get_user(student_id)
    if not udoc:
        raise HTTPException(status_code=404, detail="Cuenta de estudiante no encontrada.")

    new_password = secrets.token_urlsafe(6)[:64]
    await _update_user_membership(
        student_id,
        {
            "password_hash": hash_password(new_password),
            "must_change_password": True,
            "token_version": int(udoc.get("token_version") or 0) + 1,
        },
    )
    await audit_event(
        "student_password_reset",
        request=request,
        actor_id=_uid(current_user),
        detail={"grade_id": grade.get("id"), "student_id": student_id},
    )
    return {"status": "password_reset", "username": udoc.get("username"), "password": new_password}


class MoveStudentRequest(BaseModel):
    target_grade_id: str


@router.post("/grades/{grade_id}/students/{student_id}/move")
@limiter.limit("20/minute")
async def move_student(
    request: Request,
    grade_id: str,
    student_id: str,
    payload: MoveStudentRequest,
    current_user: dict | None = Depends(get_optional_user),
):
    """Mueve un estudiante a otro grado DE LA MISMA institución."""
    grade = await _get_grade(grade_id)
    target = await _get_grade(payload.target_grade_id)
    if not grade or not target:
        raise HTTPException(status_code=404, detail="Grado no encontrado.")
    if grade["institution_id"] != target["institution_id"]:
        raise HTTPException(status_code=400, detail="Solo entre grados de la misma institución.")
    inst = await _get_institution(grade["institution_id"])
    if not inst or not _can_teach(current_user, inst, grade):
        raise HTTPException(status_code=403, detail="Solo staff del grado.")
    if student_id not in (grade.get("student_ids") or []):
        raise HTTPException(status_code=404, detail="El estudiante no pertenece al grado de origen.")

    gid = grade.get("id") or str(grade.get("_id"))
    tid = target.get("id") or str(target.get("_id"))

    grade["student_ids"] = [s for s in grade["student_ids"] if s != student_id]
    await _save_grade(grade)
    target["student_ids"] = sorted(set(target.get("student_ids") or []) | {student_id})
    await _save_grade(target)

    udoc = await _get_user(student_id) or {}
    grade_ids = [g for g in (udoc.get("grade_ids") or []) if g != gid]
    if tid not in grade_ids:
        grade_ids.append(tid)
    await _update_user_membership(student_id, {"grade_ids": grade_ids})
    return {"status": "student_moved", "from": gid, "to": tid}


class GradeTeachersRequest(BaseModel):
    teacher_ids: list[str]


@router.patch("/grades/{grade_id}/teachers")
@limiter.limit("20/minute")
async def set_grade_teachers(
    request: Request,
    grade_id: str,
    payload: GradeTeachersRequest,
    current_user: dict | None = Depends(get_optional_user),
):
    """Asigna el equipo docente del grado (solo admin; deben ser docentes o
    admins ya miembros de la institución)."""
    grade = await _get_grade(grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grado no encontrado.")
    inst = await _get_institution(grade["institution_id"])
    if not inst or not _can_manage(current_user, inst):
        raise HTTPException(status_code=403, detail="Solo el administrador asigna docentes.")

    allowed = set(inst.get("teacher_ids") or []) | set(inst.get("admin_ids") or [])
    invalid = [t for t in payload.teacher_ids if t not in allowed]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail="Solo puedes asignar docentes ya miembros de la institución.",
        )
    grade["teacher_ids"] = sorted(set(payload.teacher_ids))
    await _save_grade(grade)
    return {"grade": _serialize_grade(grade)}
