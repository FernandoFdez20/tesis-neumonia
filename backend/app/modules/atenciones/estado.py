"""Guardas de escritura del episodio clínico; las consultas siguen disponibles."""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.atenciones.models import AtencionMedica, EstadoAtencion
from app.modules.diagnosticos.models import Diagnostico
from app.modules.pacientes.models import EstadoClinico


def exigir_atencion_abierta(db: Session, atencion: AtencionMedica) -> None:
    diagnostico = db.query(Diagnostico).filter_by(atencion_medica_id=atencion.id).first()
    if atencion.estado == EstadoAtencion.Finalizada or (
        diagnostico and diagnostico.estado_validacion == EstadoClinico.Validado
    ):
        raise HTTPException(status_code=400, detail="El caso está cerrado; no admite modificaciones")
