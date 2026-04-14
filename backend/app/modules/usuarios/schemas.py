from pydantic import BaseModel, EmailStr


class UsuarioBase(BaseModel):
    correo: EmailStr
    estado: bool = True


class UsuarioCreate(UsuarioBase):
    nombre_completo: str
    rol: str
    username: str | None = None
    password: str


class UsuarioRead(UsuarioBase):
    id: int
    username: str | None = None
    nombre_completo: str
    rol: str

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    correo: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
