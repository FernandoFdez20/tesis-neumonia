from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi import HTTPException, Response
from typing import Optional
from sqlalchemy.orm import Session

from app.api.deps import get_usuario_actual, requiere_permiso
from app.core.database import get_db
from app.modules.diagnosticos.service import DiagnosticoService
from app.modules.diagnosticos.schemas import DiagnosticoResponse, DiagnosticoValidacionRequest
from app.modules.diagnosticos.crb65_service import CRB65Request, CRB65Response, calcular_crb65
from app.ml.vista_previa import vista_png_desde_bytes
from app.modules.atenciones.models import AtencionMedica
from fastapi import HTTPException
from datetime import date
from app.modules.pacientes.models import Paciente

# HU-04: cada endpoint exige el permiso que le corresponde.
router = APIRouter()


@router.post(
    "/atenciones/{atencion_medica_id}/crb65",
    response_model=CRB65Response,
    summary="Calcular escala de gravedad CRB-65",
    dependencies=[Depends(requiere_permiso("atenciones.registrar"))],
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
    "/radiografias/vista-previa",
    summary="Vista previa PNG de un DICOM sin guardarlo en disco",
    dependencies=[Depends(requiere_permiso("radiografias.cargar"))],
)
def vista_previa_radiografia(archivo: UploadFile = File(..., description="Archivo DICOM")):
    nombre = (archivo.filename or "").lower()
    if not nombre.endswith(".dcm"):
        raise HTTPException(status_code=400, detail="Solo se admiten archivos DICOM (.dcm).")
    datos = archivo.file.read()
    if len(datos) > 30 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande (máx. 30 MB).")
    try:
        png = vista_png_desde_bytes(datos)
    except Exception:
        raise HTTPException(status_code=422, detail="No se pudo interpretar el archivo DICOM.")
    return Response(content=png, media_type="image/png")


@router.post(
    "/atenciones/{atencion_medica_id}/radiografias",
    response_model=DiagnosticoResponse,
    summary="Cargar radiografías AP y/o PA de una atención médica",
    dependencies=[Depends(requiere_permiso("radiografias.cargar"))],
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
    dependencies=[Depends(requiere_permiso("resultados.ver"))],
)
def get_diagnostico(
    atencion_medica_id: int,
    db: Session = Depends(get_db),
):
    service = DiagnosticoService(db)
    return service.get_por_atencion(atencion_medica_id)

@router.patch(
    "/{diagnostico_id}/validar",
    response_model=DiagnosticoResponse,
    dependencies=[Depends(requiere_permiso("diagnostico.validar"))],
)
def validar_diagnostico(
    diagnostico_id: int,
    payload: DiagnosticoValidacionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_usuario_actual)
):
    service = DiagnosticoService(db)
    return service.validar_diagnostico(diagnostico_id, payload, current_user)

@router.get(
    "/prioridades/pendientes",
    dependencies=[Depends(requiere_permiso("alertas.ver"))],
)
def get_prioridades_pendientes(
    db: Session = Depends(get_db),
    current_user = Depends(get_usuario_actual)
):
    service = DiagnosticoService(db)
    return service.get_prioridades_pendientes()
