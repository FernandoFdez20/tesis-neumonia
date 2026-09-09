from typing import Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.modules.pacientes.models import Enfermedad, EstadoClinico, Paciente
from app.modules.pacientes.schemas import PacienteCreate, PacienteUpdate


class PacienteRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar_pacientes(
        self,
        page: int,
        page_size: int,
        buscar: Optional[str] = None,
        sexo: Optional[str] = None,
        estado_clinico: Optional[EstadoClinico] = None,
    ) -> tuple[list[Paciente], int]:
        query = self.db.query(Paciente).options(joinedload(Paciente.enfermedades))

        if buscar:
            busqueda = f"%{buscar.strip()}%"
            query = query.filter(
                or_(
                    Paciente.nombres_apellidos.ilike(busqueda),
                    Paciente.dni.ilike(busqueda),
                )
            )

        if sexo:
            query = query.filter(func.lower(Paciente.sexo) == sexo.strip().lower())

        if estado_clinico:
            query = query.filter(Paciente.estado_clinico == estado_clinico)

        total = query.count()
        pacientes = (
            query.order_by(Paciente.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return pacientes, total

    def get_paciente_por_id(self, paciente_id: int) -> Optional[Paciente]:
        return (
            self.db.query(Paciente)
            .options(joinedload(Paciente.enfermedades))
            .filter(Paciente.id == paciente_id)
            .first()
        )

    def get_paciente_por_dni(self, dni: str) -> Optional[Paciente]:
        return (
            self.db.query(Paciente)
            .options(joinedload(Paciente.enfermedades))
            .filter(Paciente.dni == dni)
            .first()
        )

    def listar_enfermedades(self) -> list[Enfermedad]:
        return self.db.query(Enfermedad).order_by(Enfermedad.nombre.asc()).all()

    def get_enfermedades_por_ids(self, enfermedad_ids: list[int]) -> list[Enfermedad]:
        if not enfermedad_ids:
            return []

        return self.db.query(Enfermedad).filter(Enfermedad.id.in_(enfermedad_ids)).all()

    def create_paciente(
        self,
        paciente_in: PacienteCreate,
        enfermedades: list[Enfermedad],
    ) -> Paciente:
        datos_paciente = paciente_in.model_dump(exclude={"enfermedad_ids"})
        paciente = Paciente(**datos_paciente)
        paciente.enfermedades = enfermedades

        self.db.add(paciente)
        self.db.commit()
        self.db.refresh(paciente)
        return paciente

    def update_paciente(
        self,
        paciente: Paciente,
        paciente_in: PacienteUpdate,
        enfermedades: Optional[list[Enfermedad]] = None,
    ) -> Paciente:
        datos_paciente = paciente_in.model_dump(
            exclude_unset=True,
            exclude={"enfermedad_ids"},
        )

        for campo, valor in datos_paciente.items():
            setattr(paciente, campo, valor)

        # None conserva enfermedades; lista vacía limpia los antecedentes marcados.
        if enfermedades is not None:
            paciente.enfermedades = enfermedades

        self.db.commit()
        self.db.refresh(paciente)
        return paciente

    def update_estado_clinico(self, paciente: Paciente, estado: EstadoClinico) -> Paciente:
        paciente.estado_clinico = estado
        self.db.commit()
        self.db.refresh(paciente)
        return paciente
