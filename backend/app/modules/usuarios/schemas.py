from typing import Optional
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.modules.auth.models import TipoRol


class UsuarioResponse(BaseModel):
    """Usuario sin datos sensibles: nunca incluye el hash de la contraseña."""

    id: int
    username: str
    correo: str
    nombre_completo: str
    rol: TipoRol
    estado: bool
    ultimo_login: Optional[datetime] = None
    #: HU-04: permisos efectivos del usuario (rol + desviaciones).
    permisos: list[str] = Field(default_factory=list)
    #: Claves donde el usuario se aparta de lo que otorga su rol.
    overrides: dict[str, bool] = Field(default_factory=dict)

    class Config:
        from_attributes = True


class PermisoCatalogo(BaseModel):
    clave: str
    etiqueta: str
    grupo: str
    #: True si el rol seleccionado lo otorga por defecto.
    base: bool


class PermisosUpdate(BaseModel):
    """HU-04: lista absoluta de permisos efectivos que se quiere asignar.

    El backend calcula la desviación contra la base del rol, así que el
    cliente no necesita enviar diferencias sino el resultado deseado.
    """

    permisos: list[str]


class UsuarioCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    correo: EmailStr
    password: str = Field(min_length=8, max_length=128)
    nombre_completo: str = Field(min_length=3, max_length=150)
    rol: TipoRol


class UsuarioUpdate(BaseModel):
    """Actualización parcial. `None` significa "no cambiar este campo"."""

    nombre_completo: Optional[str] = Field(default=None, min_length=3, max_length=150)
    correo: Optional[EmailStr] = None
    rol: Optional[TipoRol] = None
    estado: Optional[bool] = None


class PasswordReset(BaseModel):
    password: str = Field(min_length=8, max_length=128)


class UsuariosPaginados(BaseModel):
    items: list[UsuarioResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class RolesCatalogoResponse(BaseModel):
    """Catálogo de roles con su etiqueta visible, para pintar el selector."""

    valor: TipoRol
    etiqueta: str
    descripcion: str