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

        from app.modules.pacientes.models import EstadoClinico
        self.paciente_repo.update_estado_clinico(paciente, EstadoClinico.PendienteDeEvaluacion)

        return self.repo.create_atencion(atencion_in, usuario_id)

    def get_atenciones(self, skip: int = 0, limit: int = 100) -> list[AtencionMedica]:
        return self.repo.get_atenciones(skip=skip, limit=limit)

    def get_atenciones_por_paciente(self, paciente_id: int) -> list[AtencionMedica]:
        paciente = self.paciente_repo.get_paciente_por_id(paciente_id)
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        return self.repo.get_atenciones_por_paciente(paciente_id)

    def get_atencion_por_id(self, atencion_id: int) -> dict:
        atencion = self.repo.get_atencion_por_id(atencion_id)
        if not atencion:
            raise HTTPException(status_code=404, detail="Atención no encontrada")
        return atencion

    def evaluar_atencion(self, atencion_id: int, examen_fisico: str, accion: str) -> dict:
        from app.modules.atenciones.models import AtencionMedica
        
        atencion = self.repo.db.query(AtencionMedica).filter(AtencionMedica.id == atencion_id).first()
        if not atencion:
            raise HTTPException(status_code=404, detail="Atención no encontrada")
            
        paciente = self.paciente_repo.get_paciente_por_id(atencion.paciente_id)
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
            
        from app.modules.pacientes.models import EstadoClinico
        
        if accion == "derivar_radiografia":
            self.paciente_repo.update_estado_clinico(paciente, EstadoClinico.DerivadoARadiografia)
            # Solo guarda el examen físico; la atención permanece "En proceso"
            # hasta el alta definitiva del paciente.
            self.repo.update_atencion_evaluacion(atencion, examen_fisico)
        elif accion == "guardar_progreso":
            self.repo.update_atencion_evaluacion(atencion, examen_fisico)
        else:
            raise HTTPException(status_code=400, detail="Acción no válida")
            
        return self.get_atencion_por_id(atencion_id)
