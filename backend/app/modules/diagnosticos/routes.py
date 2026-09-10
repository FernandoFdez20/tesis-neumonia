from fastapi import APIRouter, Depends, File, Form, UploadFile
from typing import Optional
from sqlalchemy.orm import Session

from app.api.deps import get_usuario_actual
from app.core.database import get_db
from app.modules.diagnosticos.service import DiagnosticoService
from app.modules.diagnosticos.schemas import DiagnosticoResponse
from app.modules.diagnosticos.crb65_service import CRB65Request, CRB65Response, calcular_crb65
from app.modules.atenciones.models import AtencionMedica
from fastapi import HTTPException
from datetime import date
from app.modules.pacientes.models import Paciente

router = APIRouter(dependencies=[Depends(get_usuario_actual)])


@router.post(
    "/atenciones/{atencion_medica_id}/crb65",
    response_model=CRB65Response,
    summary="Calcular escala de gravedad CRB-65",
)
def evaluar_crb65(
    atencion_medica_id: int,
    datos: CRB65Request,
    db: Session = Depends(get_db)
):
    # Buscar atención
    atencion = db.query(AtencionMedica).filter_by(id=atencion_medica_id).first()
    if not atencion:
        raise HTTPException(status_code=404, detail="Atención no encontrada")
    
    # Buscar paciente para calcular edad
    paciente = db.query(Paciente).filter_by(id=atencion.paciente_id).first()
    edad_paciente = None
    if paciente and paciente.fecha_nacimiento:
        today = date.today()
        nac = paciente.fecha_nacimiento
        edad_paciente = today.year - nac.year - ((today.month, today.day) < (nac.month, nac.day))
    
    try:
        resultado = calcular_crb65(datos, edad_paciente)
        return resultado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/atenciones/{atencion_medica_id}/radiografias",
    response_model=DiagnosticoResponse,
    summary="Cargar radiografías AP y/o PA de una atención médica",
)
def cargar_radiografias(
    atencion_medica_id: int,
    archivo_ap: Optional[UploadFile] = File(None, description="Imagen AP"),
    archivo_pa: Optional[UploadFile] = File(None, description="Imagen PA"),
    db: Session = Depends(get_db),
):
    service = DiagnosticoService(db)
    return service.cargar_radiografias(atencion_medica_id, archivo_ap, archivo_pa)


@router.get(
    "/atenciones/{atencion_medica_id}/diagnostico",
    response_model=DiagnosticoResponse,
    summary="Obtener el diagnóstico de una atención médica",
)
def get_diagnostico(
    atencion_medica_id: int,
    db: Session = Depends(get_db),
):
    service = DiagnosticoService(db)
    return service.get_por_atencion(atencion_medica_id)
