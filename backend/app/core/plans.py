"""
Límites del modelo freemium de Hubzy.
None = ilimitado.
"""

from fastapi import HTTPException, status

PLAN_LIMITS = {
    "guest": {
        "max_folders": 3,
        "max_docs_per_folder": 5,
        "max_questions_per_game": 8,
    },
    "free": {
        "max_folders": 3,
        "max_docs_per_folder": 5,
        "max_questions_per_game": 8,
    },
    "pro": {
        "max_folders": None,
        "max_docs_per_folder": None,
        "max_questions_per_game": 30,
    },
    # Plan institucional (colegios): miembros con rol student/teacher/admin
    "school": {
        "max_folders": None,
        "max_docs_per_folder": None,
        "max_questions_per_game": 30,
    },
}


def get_limits(plan: str) -> dict:
    return PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])


def enforce_folder_limit(plan: str, current_folders: int):
    limit = get_limits(plan)["max_folders"]
    if limit is not None and current_folders >= limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Alcanzaste el límite de {limit} carpetas del plan gratuito. Pasa a Hubzy Pro para carpetas ilimitadas.",
        )


def enforce_docs_limit(plan: str, current_docs: int):
    limit = get_limits(plan)["max_docs_per_folder"]
    if limit is not None and current_docs >= limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Alcanzaste el límite de {limit} documentos por carpeta del plan gratuito. Pasa a Hubzy Pro.",
        )


def enforce_question_limit(plan: str, requested: int | None) -> int | None:
    limit = get_limits(plan)["max_questions_per_game"]
    if requested is not None and limit is not None and requested > limit:
        return limit
    return requested
