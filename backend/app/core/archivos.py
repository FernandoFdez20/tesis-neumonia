"""Archivos estáticos con sesión — protege el montaje /uploads.

Por qué el token va como parámetro y no en la cabecera: el frontend muestra las
radiografías con `<img src>` y `<a href>`, y el navegador **no** envía la
cabecera Authorization en esas peticiones. Si el token fuera solo por cabecera,
la pantalla de resultados y el reporte PDF se quedarían sin imágenes.

El token se valida contra la misma SECRET_KEY que usa el JWT de la API, así que
sigue siendo el mismo mecanismo de sesión, solo que leído de la query string.
"""
from urllib.parse import parse_qs

from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from jose import JWTError, jwt

from app.core.config import settings
from app.core.database import SessionLocal
from app.modules.auth.models import Usuario


def _rechazo(status: int, detalle: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"detail": detalle})


def _usuario_activo(token: str):
    """Devuelve (ok, codigo_http, detalle). ok=False si no se puede servir."""
    if not token:
        return False, 401, "No autenticado"

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
    except JWTError:
        return False, 403, "No se pudieron validar las credenciales"

    if payload.get("sub") is None:
        return False, 403, "No se pudieron validar las credenciales"

    db = SessionLocal()
    try:
        usuario = db.query(Usuario).filter(Usuario.id == payload["sub"]).first()
        if usuario is None:
            return False, 403, "Usuario no encontrado"
        if not usuario.estado:
            return False, 400, "Usuario inactivo"
    finally:
        db.close()

    return True, 0, ""


class ArchivosConSesion(StaticFiles):
    """StaticFiles que solo entrega el archivo si viene un JWT vigente."""

    async def get_response(self, path: str, scope):
        crudo = scope.get("query_string", b"").decode("latin-1")
        token = (parse_qs(crudo).get("token") or [None])[0]

        ok, codigo, detalle = _usuario_activo(token)
        if not ok:
            return _rechazo(codigo, detalle)

        return await super().get_response(path, scope)