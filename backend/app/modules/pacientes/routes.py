from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import requiere_permiso
from app.core.database import get_db
from app.modules.pacientes.schemas import (
    EnfermedadResponse,
    PacienteCreate,
    PacienteResponse,
    PacienteUpdate,
    PacientesPaginados,
)
from app.modules.pacientes.service import PacienteService

# HU-04: cada endpoint exige el permiso que le corresponde.
router = APIRouter()


@router.get(
    "/",
    response_model=PacientesPaginados,
    dependencies=[Depends(requiere_permiso("pacientes.ver"))],
)
def listar_pacientes(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    buscar: Optional[str] = Query(default=None),
    sexo: Optional[str] = Query(default=None),
    en_atencion: Optional[bool] = Query(default=None),
    db: Session = Depends(get_db),
):
    paciente_service = PacienteService(db)
    return paciente_service.listar_pacientes(
        page=page,
        page_size=page_size,
        buscar=buscar,
        sexo=sexo,
        en_atencion=en_atencion,
    )


@router.post(
    "/",
    response_model=PacienteResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requiere_permiso("pacientes.registrar"))],
)
def registrar_paciente(paciente_in: PacienteCreate, db: Session = Depends(get_db)):
    paciente_service = PacienteService(db)
    return paciente_service.create_paciente(paciente_in)


@router.get(
    "/enfermedades",
    response_model=list[EnfermedadResponse],
    dependencies=[Depends(requiere_permiso("pacientes.registrar", "pacientes.ver"))],
)
def listar_enfermedades(db: Session = Depends(get_db)):
    paciente_service = PacienteService(db)
    return paciente_service.listar_enfermedades()


@router.get(
    "/dni/{dni}",
    response_model=PacienteResponse,
    dependencies=[Depends(requiere_permiso("pacientes.registrar", "atenciones.registrar"))],
)
def get_paciente_por_dni(dni: str, db: Session = Depends(get_db)):
    paciente_service = PacienteService(db)
    return paciente_service.get_paciente_por_dni(dni)


@router.get(
    "/{paciente_id}",
    response_model=PacienteResponse,
    dependencies=[Depends(requiere_permiso("pacientes.ver", "historial.ver"))],
)
def get_paciente(paciente_id: int, db: Session = Depends(get_db)):
    paciente_service = PacienteService(db)
    return paciente_service.get_paciente(paciente_id)


@router.patch(
    "/{paciente_id}",
    response_model=PacienteResponse,
    dependencies=[Depends(requiere_permiso("pacientes.registrar"))],
)
def actualizar_paciente(
    paciente_id: int,
    paciente_in: PacienteUpdate,
    db: Session = Depends(get_db),
):
    paciente_service = PacienteService(db)
    return paciente_service.update_paciente(paciente_id, paciente_in)