from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    PROJECT_NAME: str = "Hubzy API"
    VERSION: str = "0.2.0"
    API_V1_STR: str = "/api/v1"

    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "hubzy_db"

    # Qdrant Vector DB
    QDRANT_URL: Optional[str] = None
    QDRANT_HOST: str = "qdrant"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: Optional[str] = None

    # Google Gemini
    GEMINI_API_KEY: Optional[str] = None

    # ElevenLabs
    ELEVENLABS_API_KEY: Optional[str] = None

    # Groq Cloud
    GROQ_API_KEY: Optional[str] = None

    # Stripe Payments
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PRICE_ID: Optional[str] = None  # price_... para suscripción mensual Pro

    # Auth / JWT
    JWT_SECRET: str = "dev-only-insecure-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 días

    # Seguridad / Entorno
    ENVIRONMENT: str = "development"  # development | staging | production
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    FRONTEND_URL: str = "http://localhost:5173"
    SENTRY_DSN: Optional[str] = None
    RATE_LIMIT_ENABLED: bool = True

    # Recursos de crisis configurables (JSON: [{"name","detail","phone","url"}])
    # IMPORTANTE: verificar números locales reales antes de producción (ver docs/exploracion-ansiedad-uagrm.md)
    CRISIS_RESOURCES_JSON: Optional[str] = None

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
