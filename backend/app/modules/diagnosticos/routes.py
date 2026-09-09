from fastapi import APIRouter, Depends, File, Form, UploadFile
from typing import Optional
from sqlalchemy.orm import Session

from app.api.deps import get_usuario_actual
from app.core.database import get_db
from app.modules.diagnosticos.service import DiagnosticoService
from app.modules.diagnosticos.schemas import DiagnosticoResponse

router = APIRouter(dependencies=[Depends(get_usuario_actual)])


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
