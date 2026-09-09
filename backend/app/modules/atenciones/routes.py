from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_usuario_actual
from app.core.database import get_db
from app.modules.auth.models import Usuario
from app.modules.atenciones.schemas import (
    AtencionMedicaCreate,
    AtencionMedicaResponse,
    AtencionMedicaConPacienteResponse,
    AtencionMedicaEvaluar,
)
from app.modules.atenciones.service import AtencionMedicaService

router = APIRouter(dependencies=[Depends(get_usuario_actual)])

@router.post(
    "/",
    response_model=AtencionMedicaResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_atencion(
    atencion_in: AtencionMedicaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_usuario_actual),
):
    service = AtencionMedicaService(db)
    return service.create_atencion(atencion_in, current_user.id)

@router.get("/", response_model=list[AtencionMedicaConPacienteResponse])
def get_atenciones(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    service = AtencionMedicaService(db)
    return service.get_atenciones(skip=skip, limit=limit)


@router.get("/paciente/{paciente_id}", response_model=list[AtencionMedicaResponse])
def get_atenciones_por_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
):
    service = AtencionMedicaService(db)
    return service.get_atenciones_por_paciente(paciente_id)


@router.get("/{atencion_id}", response_model=AtencionMedicaConPacienteResponse)
def get_atencion(
    atencion_id: int,
    db: Session = Depends(get_db),
):
    service = AtencionMedicaService(db)
    return service.get_atencion_por_id(atencion_id)

@router.patch("/{atencion_id}/evaluar", response_model=AtencionMedicaConPacienteResponse)
def evaluar_atencion(
    atencion_id: int,
    evaluacion: AtencionMedicaEvaluar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_usuario_actual),
):
    service = AtencionMedicaService(db)
    return service.evaluar_atencion(atencion_id, evaluacion.examen_fisico, evaluacion.accion)
