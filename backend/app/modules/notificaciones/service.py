import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.notificaciones.repository import NotificacionRepository

logger = logging.getLogger(__name__)

PRIORIDADES_ALERTA = ("Alta", "Crítica")

RANGO_PRIORIDAD = {"Crítica": 0, "Alta": 1}


class NotificacionService:
    def __init__(self, db: Session):
        self.repo = NotificacionRepository(db)

    def listar_pendientes(self) -> list[dict]:
        from app.modules.diagnosticos.models import Diagnostico
        from app.modules.atenciones.models import AtencionMedica
        from app.modules.pacientes.models import Paciente

        notifs = self.repo.pendientes()
        items = []
        for n in notifs:
            diag = n.diagnostico
            if not diag:
                continue
            atencion = (
                self.repo.db.query(AtencionMedica)
                .filter(AtencionMedica.id == diag.atencion_medica_id)
                .first()
            )
            if not atencion:
                continue
            paciente = (
                self.repo.db.query(Paciente)
                .filter(Paciente.id == atencion.paciente_id)
                .first()
            )
            items.append({
                "id": n.id,
                "diagnostico_id": n.diagnostico_id,
                "atencion_medica_id": diag.atencion_medica_id,
                "paciente_nombre": paciente.nombres_apellidos if paciente else "Paciente",
                "prioridad": n.prioridad,
                "mensaje": n.mensaje,
                "leida": n.leida,
                "created_at": n.created_at,
            })

        # Crítica primero; dentro de cada prioridad, la más reciente primero.
        def _clave(x):
            fecha = x["created_at"]
            return (
                RANGO_PRIORIDAD.get(x["prioridad"], 2),
                -(fecha.timestamp()) if fecha else float("inf"),
            )

        items.sort(key=_clave)
        return items

    def marcar_leida(self, notificacion_id: int) -> dict:
        notif = self.repo.por_id(notificacion_id)
        if not notif or notif.cerrada:
            raise HTTPException(
                status_code=404, detail="Notificación no encontrada")
        notif.leida = True
        self.repo.guardar(notif)
        return {"id": notif.id, "leida": True}

    def cerrar_manual(self, notificacion_id: int) -> dict:
        notif = self.repo.por_id(notificacion_id)
        if not notif:
            raise HTTPException(
                status_code=404, detail="Notificación no encontrada")
        self.repo.cerrar(notif, motivo="manual")
        return {"id": notif.id, "cerrada": True}

    def asegurar_para_diagnostico(
        self, diagnostico_id: int, prioridad: object, mensaje: str
    ) -> None:
        """Crea o reabre el aviso si la prioridad es Alta/Crítica; si bajó,
        cierra el aviso abierto (motivo 'recalculada'). No falla nunca: los
        errores solo se registran para no interrumpir el flujo clínico."""
        try:
            prio = getattr(prioridad, "value", str(prioridad))
            existente = self.repo.por_diagnostico(diagnostico_id)
            if prio in PRIORIDADES_ALERTA:
                if not existente:
                    self.repo.crear(diagnostico_id, prio, mensaje)
                elif existente.cerrada and existente.motivo_cierre == "manual":
                    self.repo.reabrir(existente, prio, mensaje)
                elif not existente.cerrada and existente.prioridad != prio:
                    existente.prioridad = prio
                    existente.mensaje = mensaje
                    self.repo.guardar(existente)
            else:
                if existente and not existente.cerrada:
                    self.repo.cerrar(existente, motivo="recalculada")
        except Exception as e:
            logger.warning(
                f"No se pudo sincronizar notificación del diagnóstico {diagnostico_id}: {e}")

    def cerrar_por_validacion(self, diagnostico_id: int) -> None:
        """Cierra el aviso al validar la atención. Nunca interrumpe la validación."""
        try:
            existente = self.repo.por_diagnostico(diagnostico_id)
            if existente and not existente.cerrada:
                self.repo.cerrar(existente, motivo="validacion")
        except Exception as e:
            logger.warning(
                f"No se pudo cerrar notificación del diagnóstico {diagnostico_id}: {e}")
