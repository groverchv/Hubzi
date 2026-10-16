import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.core.config import settings
from app.core.database import db_manager
from app.core.rate_limit import limiter
from app.routers import (
    auth, users, arena, folders, zen, voice, psychology, payments, ai, ws,
)

logger = logging.getLogger("hubzy.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando conexiones con MongoDB y Qdrant...")
    await db_manager.connect()
    yield
    await db_manager.close()


# Sentry solo si está configurado (nunca rompe el arranque)
if settings.SENTRY_DSN:
    try:
        import sentry_sdk
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENVIRONMENT,
            traces_sample_rate=0.1,
        )
        logger.info("Sentry inicializado para observabilidad.")
    except Exception as e:
        logger.warning(f"No se pudo inicializar Sentry: {e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API para Hubzi (SynapseHub) - Gamificación EdTech anti-estrés con Gemini, MongoDB, Qdrant y WebSockets.",
    version=settings.VERSION,
    lifespan=lifespan
)

# Rate limiting
app.state.limiter = limiter
limiter.enabled = settings.RATE_LIMIT_ENABLED
if settings.RATE_LIMIT_ENABLED:
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS restringido a orígenes conocidos (nunca "*" con credenciales)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
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
        "version": settings.VERSION,
        "databases": {
            "mongodb": mongo_status,
            "mongodb_db": settings.MONGODB_DB_NAME,
            "qdrant": qdrant_status
        }
    }


# Routers de dominio
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(arena.router)
app.include_router(folders.router)
app.include_router(zen.router)
app.include_router(voice.router)
app.include_router(psychology.router)
app.include_router(payments.router)
app.include_router(ai.router)
app.include_router(ws.router)
