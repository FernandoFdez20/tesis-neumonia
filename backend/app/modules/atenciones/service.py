from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.modules.atenciones.models import AtencionMedica
from app.modules.atenciones.repository import AtencionMedicaRepository
from app.modules.atenciones.schemas import AtencionMedicaCreate
from app.modules.pacientes.repository import PacienteRepository


class AtencionMedicaService:
    def __init__(self, db: Session):
        self.repo = AtencionMedicaRepository(db)
        self.paciente_repo = PacienteRepository(db)

    def create_atencion(
        self, atencion_in: AtencionMedicaCreate, usuario_id: int
    ) -> AtencionMedica:
        paciente = self.paciente_repo.get_paciente_por_id(atencion_in.paciente_id)
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        return self.repo.create_atencion(atencion_in, usuario_id)

    def get_atenciones(self, skip: int = 0, limit: int = 100) -> list[AtencionMedica]:
        return self.repo.get_atenciones(skip=skip, limit=limit)

    def get_atenciones_por_paciente(self, paciente_id: int) -> list[AtencionMedica]:
        paciente = self.paciente_repo.get_paciente_por_id(paciente_id)
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        return self.repo.get_atenciones_por_paciente(paciente_id)

    def get_atencion_por_id(self, atencion_id: int) -> AtencionMedica:
        atencion = self.repo.get_atencion_por_id(atencion_id)
        if not atencion:
            raise HTTPException(status_code=404, detail="Atención no encontrada")
        return atencion
