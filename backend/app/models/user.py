from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50, description="Nombre de usuario o apodo")
    gender: str = Field(..., description="Género: 'masculino' | 'femenino' | 'otro'")
    age: int = Field(..., ge=4, le=120, description="Edad del estudiante")
    avatar: Optional[str] = "capy_fan"
    voice_preference: Optional[str] = "auto" # "auto" | "female" | "male"
    parental_consent: Optional[bool] = Field(default=None, description="Consentimiento parental — requerido si la edad implica banda infantil")

class UserAuthRegisterRequest(BaseModel):
    email: str = Field(..., description="Correo electrónico del usuario")
    password: str = Field(..., min_length=6, description="Contraseña de al menos 6 caracteres")
    username: str = Field(..., min_length=2, max_length=50, description="Nombre o apodo")
    gender: str = Field(..., description="Género: 'masculino' | 'femenino' | 'otro'")
    age: int = Field(..., ge=4, le=120, description="Edad del estudiante")
    avatar: Optional[str] = "capy_fan"
    voice_preference: Optional[str] = "auto"
    parental_consent: Optional[bool] = Field(default=None, description="Consentimiento del padre/madre/tutor — obligatorio para menores de 11 años")

class UserAuthLoginRequest(BaseModel):
    email: str = Field(..., description="Correo electrónico del usuario")
    password: str = Field(..., description="Contraseña del usuario")

class UserUpdateRequest(BaseModel):
    gender: Optional[str] = None
    age: Optional[int] = None
    avatar: Optional[str] = None
    voice_preference: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: str
    email: Optional[str] = None
    username: str
    gender: str
    age: int
    age_band: Optional[str] = None  # sprout|explorer|adventurer|challenger|scholar|pro
    avatar: str
    voice_preference: str
    assigned_voice_gender: str # "female" si es hombre, "male" si es mujer
    created_at: Optional[str] = None

class AuthResponse(BaseModel):
    token: str
    user: UserProfileResponse
