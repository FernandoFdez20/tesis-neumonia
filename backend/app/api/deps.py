from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from pydantic import ValidationError
from app.core.config import settings
from app.core.database import get_db
from app.core.permisos import (
    CATALOGO_POR_CLAVE,
    es_permiso_valido,
    resolver_permisos,
)
from app.modules.auth.models import TipoRol, Usuario
from app.modules.auth.schemas import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_usuario_actual(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> Usuario:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            raise HTTPException(
                status_code=403,
                detail="No se pudieron validar las credenciales",
            )
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=403,
            detail="No se pudieron validar las credenciales",
        )
    usuario = db.query(Usuario).filter(Usuario.id == token_data.sub).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not usuario.estado:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return usuario


# HU-04 — Control de acceso por permisos.
# Cada permiso puede venir del rol del usuario o de una desviación que el
# Administrador le asignó (ver app/core/permisos.py). El enforcement ya no
# pregunta "¿qué rol tienes?" sino "¿qué permisos tienes?".


def requiere_permiso(*claves: str):
    """Dependencia de FastAPI que exige al usuario al menos uno de `claves`.

    No mira el rol directamente: consulta el conjunto de permisos efectivos,
    que ya tiene en cuenta la base del rol más las desviaciones.
    """
    desconocidas = [c for c in claves if not es_permiso_valido(c)]
    if desconocidas:
        # Falla al importar el módulo: es un error de código, no de datos.
        raise ValueError(f"Permisos inexistentes en el catálogo: {desconocidas}")
    if not claves:
        raise ValueError("requiere_permiso() necesita al menos un permiso")

    def _verificar(
        db: Session = Depends(get_db),
        usuario: Usuario = Depends(get_usuario_actual),
    ) -> Usuario:
        efectivos = resolver_permisos(db, usuario)
        if not efectivos.intersection(claves):
            nombres = ", ".join(
                f"'{CATALOGO_POR_CLAVE[c].etiqueta}'" for c in claves
            )
            raise HTTPException(
                status_code=403,
                detail=(
                    "No tiene permisos para esta acción. "
                    f"Se requiere alguno de: {nombres}."
                ),
            )
        return usuario

    return _verificar
