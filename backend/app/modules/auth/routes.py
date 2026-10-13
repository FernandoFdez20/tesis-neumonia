from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_usuario_actual, requiere_permiso
from app.core.database import get_db
from app.modules.auth.models import Usuario
from app.modules.auth.schemas import UsuarioCreate, UsuarioResponse, Token
from app.modules.auth.service import AuthService

router = APIRouter()


@router.post(
    "/register",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    # HU-04: exige `usuarios.gestionar`, que por defecto solo tiene Admin.
    dependencies=[Depends(requiere_permiso("usuarios.gestionar"))],
)
def register(usuario_in: UsuarioCreate, db: Session = Depends(get_db)):
    """Alta de cuentas. Antes era pública y aceptaba cualquier `rol`, con lo
    que cualquiera podía fabricar su propio administrador."""
    auth_service = AuthService(db)
    return auth_service.register(usuario_in)


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    auth_service = AuthService(db)
    sesion = auth_service.login(username=form_data.username, password=form_data.password)
    # HU-04: el frontend necesita los permisos efectivos para ocultar menús
    # y botones; se resuelven aquí para no obligar a un request extra.
    from app.core.permisos import resolver_permisos

    usuario = sesion["usuario"]
    datos = {
        "id": usuario.id,
        "username": usuario.username,
        "correo": usuario.correo,
        "nombre_completo": usuario.nombre_completo,
        "rol": usuario.rol,
        "estado": usuario.estado,
        "ultimo_login": usuario.ultimo_login,
        "permisos": sorted(resolver_permisos(db, usuario)),
    }
    return {
        "access_token": sesion["access_token"],
        "token_type": sesion["token_type"],
        "usuario": datos,
    }


@router.post("/logout")
def logout(usuario_actual: Usuario = Depends(get_usuario_actual)):
    # Los tokens JWT son stateless. Para un logout real se puede implementar en cliente eliminando el token.
    return {"message": "Cierre de sesión exitoso"}


@router.get("/me", response_model=UsuarioResponse)
def get_me(usuario_actual: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    """Devuelve el usuario con sus permisos efectivos (HU-04)."""
    from app.core.permisos import resolver_permisos

    datos = {
        "id": usuario_actual.id,
        "username": usuario_actual.username,
        "correo": usuario_actual.correo,
        "nombre_completo": usuario_actual.nombre_completo,
        "rol": usuario_actual.rol,
        "estado": usuario_actual.estado,
        "ultimo_login": usuario_actual.ultimo_login,
        "permisos": sorted(resolver_permisos(db, usuario_actual)),
    }
    return datos
