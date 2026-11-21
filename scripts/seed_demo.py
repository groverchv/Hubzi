"""Seed de datos demo para desarrollo local (Hubzy).

Uso:
    backend/venv/Scripts/python scripts/seed_demo.py           # limpia tests + siembra 5 colegios
    backend/venv/Scripts/python scripts/seed_demo.py --no-clean  # solo siembra

Crea 5 instituciones realistas con licencias variadas (active/trialing/suspended/
canceled), cada una con director, docentes, grados, alumnos, materias con islas
y progreso de juego — para que ambos paneles muestren datos útiles.

Credenciales demo: todas las cuentas usan password "Hubzy2025!".
"""

import asyncio
import random
import string
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from bson import ObjectId  # noqa: E402
from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402

from app.core.security import hash_password  # noqa: E402

PASSWORD = "Hubzy2025!"
NOW = datetime.now(timezone.utc)

# Cuentas que NO se tocan en la limpieza
KEEP_EMAILS = {
    "superadmin@hubzy.dev",
    "director@hubzy.dev",
    "muertemuerte60@gmail.com",
}
KEEP_INSTITUTIONS = {"Colegio Demo Local"}

SCHOOLS = [
    {
        "name": "Colegio San Andrés",
        "slug": "sanandres",
        "subscription": {"status": "active", "seats": 120, "period": "yearly"},
        "grades": ["3ro Primaria A", "4to Primaria A", "5to Primaria A"],
        "subjects": [("Matemáticas", ["Fracciones", "Geometría", "Ecuaciones"]),
                     ("Ciencias Sociales", ["Historia Regional", "Geografía"])],
    },
    {
        "name": "Instituto Técnico Bolívar",
        "slug": "bolivar",
        "subscription": {"status": "active", "seats": 80, "period": "yearly"},
        "grades": ["1ro Secundaria A", "2do Secundaria A"],
        "subjects": [("Física", ["Mecánica", "Electricidad", "Ondas"]),
                     ("Química", ["Tabla Periódica", "Reacciones"])],
    },
    {
        "name": "Escuela Nueva Era",
        "slug": "nuevaera",
        "subscription": {"status": "trialing", "seats": 30, "period": "monthly"},
        "grades": ["Kinder A", "Preparatoria A"],
        "subjects": [("Lectura", ["Vocales", "Sílabas", "Palabras"]),
                     ("Matemáticas", ["Números 1-10", "Sumas simples"])],
    },
    {
        "name": "Liceo del Sol",
        "slug": "liceosol",
        "subscription": {"status": "suspended", "seats": 60, "period": "yearly"},
        "grades": ["5to Secundaria A", "5to Secundaria B"],
        "subjects": [("Biología", ["Célula", "Genética", "Ecología"]),
                     ("Literatura", ["Narrativa", "Poesía"])],
    },
    {
        "name": "Colegio Santa María",
        "slug": "santamaria",
        "subscription": {"status": "canceled", "seats": 50, "period": "yearly"},
        "grades": ["6to Primaria A", "1ro Secundaria A"],
        "subjects": [("Inglés", ["Vocabulary", "Grammar", "Reading"]),
                     ("Arte", ["Dibujo", "Historia del Arte"])],
    },
]

FIRST_NAMES = ["Ana", "Luis", "María", "Diego", "Sofía", "Carlos", "Valentina",
               "Mateo", "Camila", "Andrés", "Lucía", "Emilio", "Isabella", "Bruno"]
LAST_NAMES = ["Torres", "García", "Mendoza", "Rojas", "Vargas", "Castillo",
              "Morales", "Paredes", "Salinas", "Quispe", "Flores", "Rivera"]
TEACHER_NAMES = ["Prof. Elena Ruiz", "Prof. Marco Soto", "Prof. Julia Campos",
                 "Prof. Raúl Vega", "Prof. Carmen Ibañez", "Prof. Hugo Luna"]


def oid() -> tuple[ObjectId, str]:
    o = ObjectId()
    return o, str(o)


def code(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices('ABCDEFGHJKMNPQRSTUVWXYZ123456789', k=5))}"


async def clean_test_data(db):
    """Elimina usuarios/instituciones de pytest y datos huérfanos."""
    deleted_users = await db["users"].find(
        {"email": {"$regex": "^(pytest_|alumno\\.|director\\.|docente|.*@hubzy\\.school$)", "$options": "i"}},
        {"_id": 1, "id": 1},
    ).to_list(None)
    uids = {str(u.get("id") or u["_id"]) for u in deleted_users}
    keep = await db["users"].find(
        {"role": {"$in": ["admin", "teacher", "student"]}}, {"_id": 1, "id": 1, "email": 1}
    ).to_list(None)
    for u in keep:
        if u.get("email") not in KEEP_EMAILS:
            uids.add(str(u.get("id") or u["_id"]))

    insts = await db["institutions"].find({}, {"_id": 1, "id": 1, "name": 1}).to_list(None)
    keep_inst = {i["name"] for i in insts if i.get("name") in KEEP_INSTITUTIONS}
    del_inst_ids = [str(i.get("id") or i["_id"]) for i in insts if i.get("name") not in keep_inst]
    del_inst_oids = [i["_id"] for i in insts if i.get("name") not in keep_inst]

    # Grados/carpetas/progreso de las instituciones eliminadas
    grades = await db["grades"].find(
        {"institution_id": {"$in": del_inst_ids + [str(x) for x in del_inst_oids]}}, {"_id": 1, "id": 1}
    ).to_list(None)
    grade_ids = [str(g.get("id") or g["_id"]) for g in grades]
    grade_oids = [g["_id"] for g in grades]

    folders = await db["study_folders"].find(
        {"is_school_folder": True}, {"_id": 1, "id": 1, "grade_id": 1, "user_id": 1}
    ).to_list(None)
    del_folder_ids = [
        str(f.get("id") or f["_id"]) for f in folders
        if f.get("grade_id") in grade_ids or f.get("user_id") in uids
    ]
    del_folder_oids = [f["_id"] for f in folders
                       if f.get("grade_id") in grade_ids or f.get("user_id") in uids]

    user_oids = [ObjectId(u) for u in uids if ObjectId.is_valid(u)]

    r1 = await db["users"].delete_many({"_id": {"$in": user_oids}})
    r2 = await db["institutions"].delete_many({"_id": {"$in": del_inst_oids}})
    r3 = await db["grades"].delete_many({"_id": {"$in": grade_oids}})
    r4 = await db["study_folders"].delete_many({"_id": {"$in": del_folder_oids}})
    r5 = await db["student_progress"].delete_many(
        {"$or": [{"user_id": {"$in": list(uids)}}, {"folder_id": {"$in": del_folder_ids}}]}
    )
    # Sesiones y referencias sueltas
    await db["sessions"].delete_many({"user_id": {"$in": list(uids)}})
    await db["users"].update_many(
        {"institution_id": {"$in": del_inst_ids}},
        {"$set": {"institution_id": None, "grade_ids": [], "role": "individual", "plan": "free"}},
    )
    print(f"  cleanup: {r1.deleted_count} usuarios, {r2.deleted_count} instituciones, "
          f"{r3.deleted_count} grados, {r4.deleted_count} materias, {r5.deleted_count} progresos")


def make_user(email, username, role, inst_id, grade_ids=None):
    _id, sid = oid()
    return {
        "_id": _id,
        "id": sid,
        "email": email,
        "password_hash": hash_password(PASSWORD),
        "username": username,
        "school_credential": f"HUB-{''.join(random.choices(string.ascii_uppercase + string.digits, k=8))}",
        "gender": "otro",
        "age": 15 if role == "student" else 34,
        "age_band": "scholar" if role == "student" else "pro",
        "avatar": "capy_fan",
        "plan": "school",
        "role": role,
        "institution_id": inst_id,
        "grade_ids": grade_ids or [],
        "email_verified": True,
        "disabled": False,
        "must_change_password": False,
        "school_managed": role in ("student", "teacher", "admin"),
        "created_at": (NOW - timedelta(days=random.randint(10, 120))).isoformat(),
        "last_activity": (NOW - timedelta(days=random.randint(0, 6))).isoformat(),
    }


async def seed_schools(db):
    existing = {i.get("name") for i in await db["institutions"].find({}, {"name": 1}).to_list(None)}
    for school in SCHOOLS:
        if school["name"] in existing:
            print(f"  skip {school['name']} (ya existe)")
            continue
        inst_oid, inst_id = oid()
        teacher_docs, grade_docs, folder_docs, student_docs, progress_docs = [], [], [], [], []

        # Director + docentes
        slug = school["slug"]
        director = make_user(f"director.{slug}@hubzy.dev", f"Director {school['name']}", "admin", inst_id)
        teachers = [
            make_user(f"docente{i+1}.{slug}@hubzy.dev", TEACHER_NAMES[i % len(TEACHER_NAMES)], "teacher", inst_id)
            for i in range(2)
        ]

        for g_idx, grade_name in enumerate(school["grades"]):
            g_oid, grade_id = oid()
            teacher = teachers[g_idx % len(teachers)]
            folder_ids, student_ids = [], []

            for subject, islands in school["subjects"]:
                f_oid, folder_id = oid()
                folder_ids.append(folder_id)
                island_defs = [
                    {"id": str(ObjectId()), "name": isl, "total_levels": random.choice([3, 4, 5])}
                    for isl in islands
                ]
                folder_docs.append({
                    "_id": f_oid, "id": folder_id, "name": subject, "subject": subject,
                    "description": f"Materia de {subject} — {grade_name}",
                    "user_id": teacher["id"], "teacher_ids": [teacher["id"]],
                    "institution_id": inst_id,
                    "grade_id": grade_id, "is_school_folder": True,
                    "islands": island_defs, "documents": [],
                    "created_at": (NOW - timedelta(days=random.randint(20, 90))).isoformat(),
                })

            n_students = random.randint(6, 8)
            for s_idx in range(n_students):
                fname = FIRST_NAMES[(g_idx * 3 + s_idx) % len(FIRST_NAMES)]
                lname = LAST_NAMES[(g_idx * 5 + s_idx) % len(LAST_NAMES)]
                st = make_user(
                    f"{fname.lower()}.{lname.lower()}.{s_idx}.{slug}@hubzy.school",
                    f"{fname} {lname}", "student", inst_id, [grade_id],
                )
                st["age"] = random.randint(9, 16)
                student_docs.append(st)
                student_ids.append(st["id"])

                # ~65% de alumnos con progreso en algunas islas
                if random.random() < 0.65:
                    for fdoc in random.sample(folder_docs, k=random.randint(1, len(folder_docs))):
                        for isl in random.sample(fdoc["islands"], k=random.randint(1, len(fdoc["islands"]))):
                            total = isl["total_levels"]
                            level = random.randint(1, total + 1)
                            stars = {str(l): random.randint(1, 3) for l in range(1, min(level, total) + 1)}
                            progress_docs.append({
                                "_key": f"{fdoc['id']}:{st['id']}:{isl['id']}",
                                "folder_id": fdoc["id"], "user_id": st["id"], "island_id": isl["id"],
                                "progress": {
                                    "current_level": min(level, total),
                                    "unlocked_level": level,
                                    "level_stars": stars,
                                    "total_xp": random.randint(50, 900),
                                    "campaign_completed": level > total,
                                    "last_played_at": (NOW - timedelta(days=random.randint(0, 10))).isoformat(),
                                },
                                "updated_at": NOW.isoformat(),
                            })

            grade_docs.append({
                "_id": g_oid, "id": grade_id, "institution_id": inst_id,
                "name": grade_name, "join_code": code("HUBZY"),
                "student_ids": student_ids, "teacher_ids": [teacher["id"]],
                "folder_ids": folder_ids,
                "created_at": (NOW - timedelta(days=random.randint(20, 90))).isoformat(),
            })

        sub = dict(school["subscription"])
        if sub.get("status") in ("active", "trialing"):
            sub["activated_at"] = (NOW - timedelta(days=random.randint(30, 200))).isoformat()
        inst_doc = {
            "_id": inst_oid, "id": inst_id, "name": school["name"],
            "admin_ids": [director["id"]],
            "teacher_ids": [t["id"] for t in teachers],
            "teacher_code": code("PROF"), "plan": "school",
            "subscription": sub,
            "created_at": (NOW - timedelta(days=random.randint(30, 200))).isoformat(),
        }

        await db["institutions"].insert_one(inst_doc)
        await db["users"].insert_many([director, *teachers, *student_docs])
        if grade_docs:
            await db["grades"].insert_many(grade_docs)
        if folder_docs:
            await db["study_folders"].insert_many(folder_docs)
        if progress_docs:
            await db["student_progress"].insert_many(progress_docs)
        print(f"  + {school['name']}: director.{slug}@hubzy.dev | "
              f"credencial {director['school_credential']} | "
              f"{len(teachers)} docentes · {len(grade_docs)} grados · "
              f"{len(student_docs)} alumnos · {len(folder_docs)} materias · "
              f"{len(progress_docs)} progresos [{sub['status']}]")


async def main():
    do_clean = "--no-clean" not in sys.argv
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["hubzy_db"]
    random.seed(42)

    print("Seed demo — hubzy_db @ localhost")
    if do_clean:
        await clean_test_data(db)
    await seed_schools(db)
    total = await db["institutions"].count_documents({})
    users = await db["users"].count_documents({})
    print(f"Final: {total} instituciones · {users} usuarios")


if __name__ == "__main__":
    asyncio.run(main())
