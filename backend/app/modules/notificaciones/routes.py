from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_usuario_actual
from app.core.database import get_db
from app.modules.notificaciones.schemas import NotificacionResponse
from app.modules.notificaciones.service import NotificacionService

router = APIRouter(dependencies=[Depends(get_usuario_actual)])


@router.get("/pendientes", response_model=list[NotificacionResponse])
def listar_pendientes(db: Session = Depends(get_db)):
    return NotificacionService(db).listar_pendientes()


@router.patch("/{notificacion_id}/leer")
def marcar_leida(notificacion_id: int, db: Session = Depends(get_db)):
    return NotificacionService(db).marcar_leida(notificacion_id)


@router.patch("/{notificacion_id}/cerrar")
def cerrar_manual(notificacion_id: int, db: Session = Depends(get_db)):
    return NotificacionService(db).cerrar_manual(notificacion_id)
