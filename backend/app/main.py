import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.database import db_manager
from app.core.rate_limit import limiter
from app.routers import (
    adaptive,
    ai,
    arena,
    auth,
    folders,
    institutions,
    jobs,
    payments,
    psychology,
    telemetry,
    users,
    voice,
    zen,
)

# Sin basicConfig los logger.info/warning de seguridad del código quedaban
# mudos (root logger en WARNING). Formato con nivel y nombre del logger.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("hubzy.main")


async def _retention_sweep_loop():
    """Pasada diaria de retención (aviso + purga de cuentas inactivas).
    Errores aislados — nunca tumba el loop ni la app."""
    import asyncio as _aio

    from app.services.retention import sweep_inactive_accounts

    while True:
        await _aio.sleep(60 * 60 * 24)
        try:
            await sweep_inactive_accounts()
        except Exception as e:
            logger.error(f"Sweep de retención falló: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando conexiones con MongoDB y Qdrant...")
    await db_manager.connect()
    from app.services.job_service import recover_interrupted_jobs

    await recover_interrupted_jobs()
    sweep_task = None
    if settings.RETENTION_SWEEP_ENABLED and db_manager.db is not None:
        import asyncio as _aio

        sweep_task = _aio.create_task(_retention_sweep_loop())
    yield
    if sweep_task:
        sweep_task.cancel()
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


_is_prod = settings.ENVIRONMENT == "production"

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API para Hubzi (SynapseHub) - Gamificación EdTech anti-estrés con Gemini, MongoDB, Qdrant y WebSockets.",
    version=settings.VERSION,
    lifespan=lifespan,
    # En producción el schema OpenAPI no es un recurso público: revela
    # endpoints internos (webhooks, admin) a quien enumere la API.
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
    openapi_url=None if _is_prod else "/openapi.json",
)

# Rate limiting
app.state.limiter = limiter
limiter.enabled = settings.RATE_LIMIT_ENABLED
if settings.RATE_LIMIT_ENABLED:
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    # Sin este middleware los default_limits no aplican a rutas sin decorador.
    app.add_middleware(SlowAPIMiddleware)

# CORS restringido a orígenes conocidos (nunca "*" con credenciales)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


_MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


@app.middleware("http")
async def csrf_guard(request: Request, call_next):
    """Capa anti-CSRF para la auth por cookie: un request mutador autenticado
    solo con la cookie HttpOnly (sin Bearer) debe llevar el header custom
    X-Requested-With — un <form> cross-site no puede ponerlo y el preflight
    CORS bloquea cualquier otro origen fuera de la allowlist."""
    from app.core.security import AUTH_COOKIE_NAME

    if (
        request.method in _MUTATING_METHODS
        and AUTH_COOKIE_NAME in request.cookies
        and "authorization" not in request.headers
        and request.headers.get("x-requested-with") != "XMLHttpRequest"
    ):
        from fastapi.responses import JSONResponse

        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": "CSRF check failed."},
        )
    return await call_next(request)


# Request-id + timing: correlación de logs por petición (observabilidad base)
@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    import time
    import uuid

    req_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Request-ID"] = req_id
    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} "
        f"[{elapsed_ms:.0f}ms] req={req_id}"
    )
    return response


# Headers de seguridad HTTP (OWASP baseline)
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), geolocation=(), payment=()"
    # CSP orientada a API: este servicio no sirve HTML en producción
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
    return response


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
            # El nombre de la BD era reconocimiento gratis para un atacante.
            "qdrant": qdrant_status,
        },
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
app.include_router(adaptive.router)
app.include_router(jobs.router)
app.include_router(institutions.router)
app.include_router(telemetry.router)
