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

        if paciente.en_atencion:
            raise HTTPException(status_code=400, detail="El paciente ya tiene una atención médica en proceso")

        # Parsear presion_arterial desde string a ints
        if getattr(atencion_in, 'presion_arterial', None):
            partes = atencion_in.presion_arterial.split('/')
            if len(partes) == 2:
                try:
                    atencion_in.presion_sistolica = int(partes[0].strip())
                    atencion_in.presion_diastolica = int(partes[1].strip())
                except ValueError:
                    pass

        # El resultado calculado no se acepta desde el cliente.
        atencion_in.crb65_puntaje = None
        atencion_in.crb65_gravedad = None
        atencion_in.crb65_detalle = None
        # Calcular CRB-65 si tenemos los datos necesarios
        if (atencion_in.frecuencia_respiratoria is not None and 
            atencion_in.presion_sistolica is not None and 
            atencion_in.presion_diastolica is not None):
            
            from datetime import date
            from app.modules.diagnosticos.crb65_service import CRB65Request, calcular_crb65
            
            edad_paciente = None
            if paciente.fecha_nacimiento:
                today = date.today()
                nac = paciente.fecha_nacimiento
                edad_paciente = today.year - nac.year - ((today.month, today.day) < (nac.month, nac.day))
            
            req = CRB65Request(
                confusion=atencion_in.confusion or False,
                frecuencia_respiratoria=atencion_in.frecuencia_respiratoria,
                presion_sistolica=atencion_in.presion_sistolica,
                presion_diastolica=atencion_in.presion_diastolica,
                edad=edad_paciente
            )
            
            try:
                crb65 = calcular_crb65(req)
                atencion_in.crb65_puntaje = crb65.puntaje_total
                atencion_in.crb65_gravedad = crb65.gravedad
                atencion_in.crb65_detalle = crb65.criterios
            except Exception as e:
                pass # Si falta edad u otro error, omitir el cálculo automático

        self.paciente_repo.update_en_atencion(paciente, True)

        return self.repo.create_atencion(atencion_in, usuario_id)

    def get_atenciones(self, skip: int = 0, limit: int = 100) -> list[AtencionMedica]:
        return self.repo.get_atenciones(skip=skip, limit=limit)

    def get_atenciones_por_paciente(self, paciente_id: int) -> list[dict]:
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
        
        atencion = self.repo.db.query(AtencionMedica).filter(AtencionMedica.id == atencion_id).with_for_update().first()
        if not atencion:
            raise HTTPException(status_code=404, detail="Atención no encontrada")
        from app.modules.atenciones.estado import exigir_atencion_abierta
        from app.modules.diagnosticos.models import Diagnostico
        exigir_atencion_abierta(self.repo.db, atencion)
        if self.repo.db.query(Diagnostico).filter_by(atencion_medica_id=atencion.id).first():
            raise HTTPException(status_code=400, detail="La evaluación ya tiene un análisis radiográfico")
            
        paciente = self.paciente_repo.get_paciente_por_id(atencion.paciente_id)
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
            
        if accion not in {"guardar_progreso", "derivar_radiografia"}:
            raise HTTPException(status_code=400, detail="Acción no válida")

        if accion == "derivar_radiografia" and len(examen_fisico.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="Ingrese un examen físico más detallado antes de derivar",
            )

        self.repo.update_atencion_evaluacion(
            atencion, examen_fisico, derivar=accion == "derivar_radiografia"
        )
            
        return self.get_atencion_por_id(atencion_id)
