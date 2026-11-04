from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.pacientes.models import Enfermedad, Paciente
from app.modules.pacientes.repository import PacienteRepository
from app.modules.pacientes.schemas import (
    PacienteCreate,
    PacienteUpdate,
    PacienteResponse,
    PacientesPaginados,
)


class PacienteService:
    def __init__(self, db: Session):
        self.repo = PacienteRepository(db)

    def listar_pacientes(
        self,
        page: int,
        page_size: int,
        buscar: str | None = None,
        sexo: str | None = None,
        en_atencion: bool | None = None,
    ) -> PacientesPaginados:
        pacientes, total = self.repo.listar_pacientes(
            page=page,
            page_size=page_size,
            buscar=buscar,
            sexo=sexo,
            en_atencion=en_atencion,
        )

        return PacientesPaginados.crear(
            items=self._serializar_pacientes(pacientes),
            total=total,
            page=page,
            page_size=page_size,
        )

    def _serializar_pacientes(self, pacientes: list[Paciente]) -> list[PacienteResponse]:
        fechas = self.repo.obtener_ultimas_atenciones([p.id for p in pacientes])
        return [
            PacienteResponse.model_validate(p).model_copy(
                update={"ultima_atencion": fechas.get(p.id)}
            )
            for p in pacientes
        ]

    def respuesta_paciente(self, paciente: Paciente) -> PacienteResponse:
        return self._serializar_pacientes([paciente])[0]

    def get_paciente(self, paciente_id: int):
        paciente = self.repo.get_paciente_por_id(paciente_id)
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        return paciente

    def get_paciente_por_dni(self, dni: str):
        paciente = self.repo.get_paciente_por_dni(dni)
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        return paciente

    def listar_enfermedades(self) -> list[Enfermedad]:
        return self.repo.listar_enfermedades()

    def create_paciente(self, paciente_in: PacienteCreate):
        if self.repo.get_paciente_por_dni(paciente_in.dni):
            raise HTTPException(status_code=400, detail="El DNI ya está registrado")

        enfermedades = self._obtener_enfermedades_validas(paciente_in.enfermedad_ids)
        return self.repo.create_paciente(paciente_in, enfermedades)

    def update_paciente(self, paciente_id: int, paciente_in: PacienteUpdate):
        paciente = self.get_paciente(paciente_id)

        if paciente_in.dni and paciente_in.dni != paciente.dni:
            paciente_existente = self.repo.get_paciente_por_dni(paciente_in.dni)
            if paciente_existente:
                raise HTTPException(status_code=400, detail="El DNI ya está registrado")

        enfermedades = None
        if paciente_in.enfermedad_ids is not None:
            enfermedades = self._obtener_enfermedades_validas(
                paciente_in.enfermedad_ids
            )

        return self.repo.update_paciente(paciente, paciente_in, enfermedades)

    def _obtener_enfermedades_validas(
        self,
        enfermedad_ids: list[int],
    ) -> list[Enfermedad]:
        enfermedad_ids_unicos = list(dict.fromkeys(enfermedad_ids))
        enfermedades = self.repo.get_enfermedades_por_ids(enfermedad_ids_unicos)

        if len(enfermedades) != len(enfermedad_ids_unicos):
            raise HTTPException(
                status_code=400,
                detail="Una o más enfermedades no existen",
            )

        return enfermedades
