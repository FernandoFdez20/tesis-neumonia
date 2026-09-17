from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.modules.notificaciones.models import Notificacion


class NotificacionRepository:
    def __init__(self, db: Session):
        self.db = db

    def pendientes(self) -> list[Notificacion]:
        """Notificaciones no cerradas, Crítica primero y luego por fecha."""
        return (
            self.db.query(Notificacion)
            .options(joinedload(Notificacion.diagnostico))
            .filter(Notificacion.cerrada == False)  # noqa: E712
            .all()
        )

    def por_diagnostico(self, diagnostico_id: int) -> Optional[Notificacion]:
        return (
            self.db.query(Notificacion)
            .filter(Notificacion.diagnostico_id == diagnostico_id)
            .first()
        )

    def por_id(self, notificacion_id: int) -> Optional[Notificacion]:
        return (
            self.db.query(Notificacion)
            .filter(Notificacion.id == notificacion_id)
            .first()
        )

    def crear(self, diagnostico_id: int, prioridad: str, mensaje: str) -> Notificacion:
        notif = Notificacion(
            diagnostico_id=diagnostico_id,
            prioridad=prioridad,
            mensaje=mensaje,
        )
        self.db.add(notif)
        self.db.commit()
        self.db.refresh(notif)
        return notif

    def guardar(self, notif: Notificacion) -> Notificacion:
        self.db.commit()
        self.db.refresh(notif)
        return notif

    def cerrar(self, notif: Notificacion, motivo: str) -> Notificacion:
        """Cierre idempotente: si ya está cerrada, la devuelve sin cambios."""
        if notif.cerrada:
            return notif
        notif.cerrada = True
        notif.motivo_cierre = motivo
        notif.fecha_cierre = datetime.now()
        return self.guardar(notif)

    def reabrir(self, notif: Notificacion, prioridad: str, mensaje: str) -> Notificacion:
        notif.cerrada = False
        notif.motivo_cierre = None
        notif.fecha_cierre = None
        notif.leida = False
        notif.prioridad = prioridad
        notif.mensaje = mensaje
        return self.guardar(notif)
