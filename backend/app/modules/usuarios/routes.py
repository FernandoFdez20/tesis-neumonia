from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_usuario_actual, requiere_permiso
from app.core.database import get_db
from app.modules.auth.models import TipoRol, Usuario
from app.modules.usuarios.schemas import (
    PasswordReset,
    PermisoCatalogo,
    PermisosUpdate,
    RolesCatalogoResponse,
    UsuarioCreate,
    UsuarioResponse,
    UsuariosPaginados,
    UsuarioUpdate,
)
from app.modules.usuarios.service import UsuarioService

# HU-03/HU-04: este módulo es exclusivo del Administrador.
router = APIRouter(dependencies=[Depends(requiere_permiso("usuarios.gestionar"))])


@router.get("/roles", response_model=list[RolesCatalogoResponse])
def listar_roles():
    """Catálogo de roles con su etiqueta y descripción, para el selector."""
    return UsuarioService.catalogo_roles()


@router.get("/permisos", response_model=list[PermisoCatalogo])
def listar_permisos(rol: Optional[TipoRol] = Query(default=None)):
    """Catálogo de permisos. Si se pasa `rol`, marca cuáles lo otorga."""
    return UsuarioService.catalogo_permisos(rol)


@router.get("/", response_model=UsuariosPaginados)
def listar_usuarios(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    buscar: Optional[str] = Query(default=None),
    rol: Optional[TipoRol] = Query(default=None),
    estado: Optional[bool] = Query(default=None),
    db: Session = Depends(get_db),
):
    return UsuarioService(db).listar(page, page_size, buscar, rol, estado)


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear_usuario(
    datos: UsuarioCreate, db: Session = Depends(get_db)
):
    return UsuarioService(db).crear(datos)


@router.patch("/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(
    usuario_id: int,
    datos: UsuarioUpdate,
    db: Session = Depends(get_db),
    actual: Usuario = Depends(get_usuario_actual),
):
    return UsuarioService(db).actualizar(usuario_id, datos, actual)


@router.put("/{usuario_id}/permisos", response_model=UsuarioResponse)
def asignar_permisos(
    usuario_id: int,
    datos: PermisosUpdate,
    db: Session = Depends(get_db),
):
    """HU-04: define la lista absoluta de permisos efectivos del usuario."""
    return UsuarioService(db).asignar_permisos(usuario_id, datos.permisos)


@router.patch("/{usuario_id}/password")
def resetear_password(
    usuario_id: int,
    datos: PasswordReset,
    db: Session = Depends(get_db),
):
    return UsuarioService(db).resetear_password(usuario_id, datos.password)