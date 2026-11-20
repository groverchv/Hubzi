from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEV_JWT_SECRET = "dev-only-insecure-secret-change-me"


class Settings(BaseSettings):
    PROJECT_NAME: str = "Hubzy API"
    VERSION: str = "0.2.0"
    API_V1_STR: str = "/api/v1"

    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "hubzy_db"

    # Qdrant Vector DB
    QDRANT_URL: str | None = None
    QDRANT_HOST: str = "qdrant"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: str | None = None

    # Google Gemini
    GEMINI_API_KEY: str | None = None

    # ElevenLabs
    ELEVENLABS_API_KEY: str | None = None

    # Groq Cloud
    GROQ_API_KEY: str | None = None

    # Stripe Payments
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_PUBLISHABLE_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    STRIPE_PRICE_ID: str | None = None  # price_... para suscripción mensual Pro
    STRIPE_SCHOOL_PRICE_ID: str | None = None  # price_... seat/mes institucional

    # Auth / JWT
    JWT_SECRET: str = _DEV_JWT_SECRET
    JWT_ALGORITHM: str = "HS256"
    # 24 h: un JWT en localStorage robado por XSS solo vale un día; la
    # revocación real viene de user.token_version (claim "tv" del token).
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    # Identidad de invitado por dispositivo (cookie HttpOnly): 30 días —
    # larga porque representa al dispositivo, no una sesión de cuenta.
    GUEST_TOKEN_EXPIRE_DAYS: int = 30
    # Rotación de JWT: si se configura, decode intenta JWT_SECRET y luego
    # esta clave vieja — permite rotar sin cerrar todas las sesiones.
    JWT_SECRET_PREVIOUS: str | None = None
    # Protección anti fuerza-bruta por cuenta (además del rate-limit por IP):
    # tras N fallos seguidos la cuenta queda bloqueada un tiempo creciente.
    LOGIN_MAX_FAILURES: int = 5
    LOGIN_LOCKOUT_BASE_MINUTES: int = 15  # backoff: 15, 30, 60… (2^racha x base)
    # Captcha (Cloudflare Turnstile) tras N fallos de login — corta el
    # credential stuffing antes de llegar al lockout. Sin secret = off.
    LOGIN_CAPTCHA_AFTER: int = 3
    TURNSTILE_SECRET_KEY: str | None = None
    # HaveIBeenPwned k-anonymity: rechaza contraseñas vistas en breaches.
    # Falla abierta (si la API no responde, no bloquea el registro).
    HIBP_ENABLED: bool = True
    # Retención: carpetas de invitados sin cuenta se purgan tras N días.
    GUEST_FOLDER_TTL_DAYS: int = 30
    # Retención de cuentas inactivas (GDPR minimización): aviso a los ~23
    # meses sin entrar, purga a los 24 con ≥30d de margen tras el aviso.
    INACTIVE_ACCOUNT_WARN_AFTER_DAYS: int = 700
    INACTIVE_ACCOUNT_PURGE_DAYS: int = 730
    RETENTION_SWEEP_ENABLED: bool = True
    # Cifrado field-level (Fernet urlsafe-b64 de 32B) para datos sensibles
    # en reposo — p. ej. notas de bienestar de menores en zen_logs.
    # Sin clave: se guarda en claro (dev) — OBLIGATORIA en producción.
    ENCRYPTION_KEY: str | None = None
    # Enforcement institucional de MFA: cuentas con mfa_required=True y sin
    # mfa_enabled quedan bloqueadas hasta enrolar. Desactivable en tests.
    MFA_ENFORCE_INSTITUTIONS: bool = True

    # Seguridad / Entorno
    ENVIRONMENT: str = "development"  # development | staging | production
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    ADMIN_EMAILS: str = ""  # lista separada por comas — acceso a dataset de IA
    FRONTEND_URL: str = "http://localhost:5173"
    SENTRY_DSN: str | None = None
    RATE_LIMIT_ENABLED: bool = True
    # Backend de almacenamiento de slowapi (memory:// por defecto).
    # Para múltiples workers/réplicas usar p. ej. redis://host:6379 o mongodb://host:27017
    RATE_LIMIT_STORAGE_URI: str | None = None

    # Recursos de crisis configurables (JSON: [{"name","detail","phone","url"}])
    # IMPORTANTE: verificar números locales reales antes de producción (ver docs/exploracion-ansiedad-uagrm.md)
    CRISIS_RESOURCES_JSON: str | None = None

    # Motores procedurales (matemática/física): generan ejercicios por
    # PLANTILLA, no desde el contenido del documento. Desactivados por
    # defecto — el requisito del producto es que todo salga del doc subido.
    # Activar solo si el público es genuinamente ejercicios de math/física.
    PROCEDURAL_ENGINES_ENABLED: bool = False
    # Confianza mínima para enrutar un doc al motor procedural (0-1).
    PROCEDURAL_MIN_CONFIDENCE: float = 0.45

    # Pre-generación del nivel 1 al subir el primer doc de una carpeta.
    # True = UX instantánea pero gasta tokens aunque el usuario nunca juegue;
    # False = se genera bajo demanda (menor gasto, primera carga más lenta).
    PREWARM_LEVEL1_ENABLED: bool = True

    # Modelos pretrained locales (opcional — requiere `pip install transformers torch`)
    # Desactivados por defecto; las heurísticas cubren el caso común. Activar
    # solo donde el peso del modelo justifica el recall extra.
    SAFETY_MODEL_ENABLED: bool = False
    SAFETY_MODEL_NAME: str = "unitary/toxic-bert"  # multilingüe limitado; configurable
    CRISIS_MODEL_ENABLED: bool = False
    CRISIS_MODEL_NAME: str = "finiteautomata/beto-emotion-analysis"  # emociones en español

    # Email transaccional (verificación + reset de contraseña)
    # Sin SMTP configurado, los emails se loguean en consola (modo dev).
    EMAIL_ENABLED: bool = True
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAIL_FROM: str = "noreply@hubzy.app"
    EMAIL_FROM_NAME: str = "Hubzy"
    SMTP_USE_TLS: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @model_validator(mode="after")
    def _reject_insecure_secrets_in_production(self):
        """Fail-fast: jamás arrancar en producción con credenciales por defecto."""
        if self.is_production:
            if (
                not self.JWT_SECRET
                or self.JWT_SECRET == _DEV_JWT_SECRET
                or len(self.JWT_SECRET) < 32
            ):
                raise ValueError(
                    "JWT_SECRET inseguro para producción. Genera uno con "
                    "`openssl rand -hex 32` y expórtalo como variable de entorno."
                )
        return self

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
