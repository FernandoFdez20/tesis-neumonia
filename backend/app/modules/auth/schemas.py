from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.modules.auth.models import TipoRol


class UsuarioCreate(BaseModel):
    username: str
    correo: EmailStr
    password: str
    nombre_completo: str
    rol: TipoRol


class UsuarioResponse(BaseModel):
    id: int
    username: str
    correo: str
    nombre_completo: str
    rol: TipoRol
    estado: bool
    ultimo_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
