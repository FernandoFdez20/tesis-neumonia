from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import requiere_permiso
from app.core.database import get_db
from app.modules.notificaciones.schemas import NotificacionResponse
from app.modules.notificaciones.service import NotificacionService

# HU-04: el panel de alertas exige su permiso.
router = APIRouter()


@router.get(
    "/pendientes",
    response_model=list[NotificacionResponse],
    dependencies=[Depends(requiere_permiso("alertas.ver"))],
)
def listar_pendientes(db: Session = Depends(get_db)):
    return NotificacionService(db).listar_pendientes()


@router.patch(
    "/{notificacion_id}/leer",
    dependencies=[Depends(requiere_permiso("alertas.ver"))],
)
def marcar_leida(notificacion_id: int, db: Session = Depends(get_db)):
    return NotificacionService(db).marcar_leida(notificacion_id)


@router.patch(
    "/{notificacion_id}/cerrar",
    dependencies=[Depends(requiere_permiso("alertas.ver"))],
)
def cerrar_manual(notificacion_id: int, db: Session = Depends(get_db)):
    return NotificacionService(db).cerrar_manual(notificacion_id)