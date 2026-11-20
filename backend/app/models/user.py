from pydantic import BaseModel, EmailStr, Field

_USERNAME_PATTERN = r"^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ ._'-]+$"


class UserRegisterRequest(BaseModel):
    username: str = Field(
        ...,
        min_length=2,
        max_length=50,
        pattern=_USERNAME_PATTERN,
        description="Nombre de usuario o apodo",
    )
    gender: str = Field(..., description="Género: 'masculino' | 'femenino' | 'otro'")
    age: int = Field(..., ge=4, le=120, description="Edad del estudiante")
    avatar: str | None = "capy_fan"
    voice_preference: str | None = "auto"  # "auto" | "female" | "male"
    parental_consent: bool | None = Field(
        default=None,
        description="Consentimiento parental — requerido si la edad implica banda infantil",
    )


class UserAuthRegisterRequest(BaseModel):
    # EmailStr valida formato y rechaza \r\n → cierra la inyección de
    # cabeceras SMTP en los emails transaccionales.
    email: EmailStr = Field(..., max_length=254, description="Correo electrónico del usuario")
    password: str = Field(
        ..., min_length=8, max_length=128, description="Contraseña de al menos 8 caracteres"
    )
    username: str = Field(
        ...,
        min_length=2,
        max_length=50,
        pattern=_USERNAME_PATTERN,
        description="Nombre o apodo",
    )
    gender: str = Field(..., description="Género: 'masculino' | 'femenino' | 'otro'")
    age: int = Field(..., ge=4, le=120, description="Edad del estudiante")
    avatar: str | None = "capy_fan"
    voice_preference: str | None = "auto"
    parental_consent: bool | None = Field(
        default=None,
        description="Consentimiento del padre/madre/tutor — obligatorio para menores de 11 años",
    )


class UserAuthLoginRequest(BaseModel):
    email: EmailStr = Field(..., max_length=254, description="Correo electrónico del usuario")
    password: str = Field(..., max_length=128, description="Contraseña del usuario")
    # Token Cloudflare Turnstile — exigido tras LOGIN_CAPTCHA_AFTER fallos.
    captcha_token: str | None = Field(default=None, max_length=2048)


class UserUpdateRequest(BaseModel):
    gender: str | None = None
    age: int | None = None
    avatar: str | None = None
    voice_preference: str | None = None


class UserProfileResponse(BaseModel):
    id: str
    email: str | None = None
    username: str
    gender: str
    age: int
    age_band: str | None = None  # sprout|explorer|adventurer|challenger|scholar|pro
    avatar: str
    voice_preference: str
    assigned_voice_gender: str  # "female" si es hombre, "male" si es mujer
    created_at: str | None = None
    plan: str = "free"  # free | pro | school
    pro_since: str | None = None  # inicio del ciclo Pro de 30 días
    trial_days_left: int | None = None  # días restantes de prueba (solo plan free)
    must_change_password: bool = False  # cuenta escolar con contraseña temporal
    email_verified: bool = False  # correo confirmado vía enlace firmado
    mfa_enabled: bool = False  # TOTP activo — para mostrar estado en ajustes
    ai_training_consent: bool = False  # opt-in: su material puede entrenar la IA


class AuthResponse(BaseModel):
    token: str
    user: UserProfileResponse
