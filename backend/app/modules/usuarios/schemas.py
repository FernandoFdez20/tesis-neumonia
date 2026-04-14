from pydantic import BaseModel, EmailStr


class UsuarioBase(BaseModel):
    nombre: str
    correo: EmailStr
    estado: bool = True


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioRead(UsuarioBase):
    id: int

    class Config:
        from_attributes = True
