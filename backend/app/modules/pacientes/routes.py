from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_usuario_actual
from app.core.database import get_db
from app.modules.pacientes.models import EstadoClinico
from app.modules.pacientes.schemas import (
    EnfermedadResponse,
    PacienteCreate,
    PacienteResponse,
    PacienteUpdate,
    PacientesPaginados,
)
from app.modules.pacientes.service import PacienteService

router = APIRouter(dependencies=[Depends(get_usuario_actual)])


@router.get("/", response_model=PacientesPaginados)
def listar_pacientes(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    buscar: Optional[str] = Query(default=None),
    sexo: Optional[str] = Query(default=None),
    estado_clinico: Optional[EstadoClinico] = Query(default=None),
    db: Session = Depends(get_db),
):
    paciente_service = PacienteService(db)
    return paciente_service.listar_pacientes(
        page=page,
        page_size=page_size,
        buscar=buscar,
        sexo=sexo,
        estado_clinico=estado_clinico,
    )


@router.post(
    "/",
    response_model=PacienteResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_paciente(paciente_in: PacienteCreate, db: Session = Depends(get_db)):
    paciente_service = PacienteService(db)
    return paciente_service.create_paciente(paciente_in)


@router.get("/enfermedades", response_model=list[EnfermedadResponse])
def listar_enfermedades(db: Session = Depends(get_db)):
    paciente_service = PacienteService(db)
    return paciente_service.listar_enfermedades()


@router.get("/dni/{dni}", response_model=PacienteResponse)
def get_paciente_por_dni(dni: str, db: Session = Depends(get_db)):
    paciente_service = PacienteService(db)
    return paciente_service.get_paciente_por_dni(dni)


@router.get("/{paciente_id}", response_model=PacienteResponse)
def get_paciente(paciente_id: int, db: Session = Depends(get_db)):
    paciente_service = PacienteService(db)
    return paciente_service.get_paciente(paciente_id)


@router.patch("/{paciente_id}", response_model=PacienteResponse)
def actualizar_paciente(
    paciente_id: int,
    paciente_in: PacienteUpdate,
    db: Session = Depends(get_db),
):
    paciente_service = PacienteService(db)
    return paciente_service.update_paciente(paciente_id, paciente_in)
