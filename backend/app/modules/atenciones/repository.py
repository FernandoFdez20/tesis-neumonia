from sqlalchemy.orm import Session
from app.modules.atenciones.models import AtencionMedica
from typing import Optional, List
from app.modules.atenciones.schemas import AtencionMedicaCreate


class AtencionMedicaRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_atencion(
        self, atencion_in: AtencionMedicaCreate, usuario_id: int
    ) -> AtencionMedica:
        db_atencion = AtencionMedica(
            paciente_id=atencion_in.paciente_id,
            usuario_id=usuario_id,
            temperatura=atencion_in.temperatura,
            frecuencia_cardiaca=atencion_in.frecuencia_cardiaca,
            frecuencia_respiratoria=atencion_in.frecuencia_respiratoria,
            saturacion_o2=atencion_in.saturacion_o2,
            presion_sistolica=atencion_in.presion_sistolica,
            presion_diastolica=atencion_in.presion_diastolica,
            tiempo_evolucion_dias=atencion_in.tiempo_evolucion_dias,
            sintomas_principales=atencion_in.sintomas_principales,
            examen_fisico=atencion_in.examen_fisico,
            confusion=atencion_in.confusion,
            crb65_puntaje=atencion_in.crb65_puntaje,
            crb65_gravedad=atencion_in.crb65_gravedad,
            crb65_detalle=atencion_in.crb65_detalle,
            estado=atencion_in.estado,
        )
        self.db.add(db_atencion)
        self.db.commit()
        self.db.refresh(db_atencion)
        return db_atencion

    def get_atenciones(self, skip: int = 0, limit: int = 100):
        from app.modules.pacientes.models import Paciente
        from app.modules.diagnosticos.models import Diagnostico
        resultados = (
            self.db.query(AtencionMedica, Paciente)
            .join(Paciente, AtencionMedica.paciente_id == Paciente.id)
            .order_by(AtencionMedica.fecha_registro.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        # Formatear el resultado
        atenciones_extendidas = []
        for atencion, paciente in resultados:
            from datetime import date
            hoy = date.today()
            edad = hoy.year - paciente.fecha_nacimiento.year - ((hoy.month, hoy.day) < (paciente.fecha_nacimiento.month, paciente.fecha_nacimiento.day)) if paciente.fecha_nacimiento else 0
            
            # Calcular estado dinámico de ESTA atención médica
            estado_atencion_especifico = "Pendiente de evaluación"
            if getattr(atencion.estado, 'value', str(atencion.estado)) == "Finalizada":
                estado_atencion_especifico = "Validado"
            else:
                diag = self.db.query(Diagnostico).filter(Diagnostico.atencion_medica_id == atencion.id).first()
                if diag:
                    val = getattr(diag.estado_validacion, 'value', str(diag.estado_validacion))
                    estado_atencion_especifico = val if val else "Pendiente de validación"
                elif atencion.examen_fisico:
                    estado_atencion_especifico = "Derivado a radiografía"
            
            atencion_dict = atencion.__dict__.copy()
            atencion_dict["presion_arterial"] = atencion.presion_arterial
            atencion_dict["paciente_nombre"] = paciente.nombres_apellidos
            atencion_dict["paciente_edad"] = edad
            atencion_dict["paciente_dni"] = paciente.dni
            atencion_dict["paciente_sexo"] = paciente.sexo
            atencion_dict["paciente_estado_clinico"] = estado_atencion_especifico
            atenciones_extendidas.append(atencion_dict)
            
        return atenciones_extendidas

    def get_atenciones_por_paciente(self, paciente_id: int) -> list[dict]:
        from app.modules.diagnosticos.models import Diagnostico
        atenciones = (
            self.db.query(AtencionMedica)
            .filter(AtencionMedica.paciente_id == paciente_id)
            .order_by(AtencionMedica.fecha_registro.desc())
            .all()
        )
        
        resultados = []
        for atencion in atenciones:
            estado_atencion_especifico = "Pendiente de evaluación"
            if getattr(atencion.estado, 'value', str(atencion.estado)) == "Finalizada":
                estado_atencion_especifico = "Validado"
            else:
                diag = self.db.query(Diagnostico).filter(Diagnostico.atencion_medica_id == atencion.id).first()
                if diag:
                    val = getattr(diag.estado_validacion, 'value', str(diag.estado_validacion))
                    estado_atencion_especifico = val if val else "Pendiente de validación"
                elif atencion.examen_fisico:
                    estado_atencion_especifico = "Derivado a radiografía"
                    
            atencion_dict = atencion.__dict__.copy()
            atencion_dict["presion_arterial"] = atencion.presion_arterial
            atencion_dict["paciente_estado_clinico"] = estado_atencion_especifico
            resultados.append(atencion_dict)
            
        return resultados

    def get_atencion_por_id(self, atencion_id: int) -> Optional[dict]:
        from app.modules.pacientes.models import Paciente
        from app.modules.diagnosticos.models import Diagnostico
        from datetime import date

        resultado = (
            self.db.query(AtencionMedica, Paciente)
            .join(Paciente, AtencionMedica.paciente_id == Paciente.id)
            .filter(AtencionMedica.id == atencion_id)
            .first()
        )
        if not resultado:
            return None
            
        atencion, paciente = resultado
        
        # Calcular edad
        hoy = date.today()
        nacimiento = paciente.fecha_nacimiento
        edad = hoy.year - nacimiento.year - ((hoy.month, hoy.day) < (nacimiento.month, nacimiento.day))

        # Calcular estado dinámico de ESTA atención médica
        estado_atencion_especifico = "Pendiente de evaluación"
        if getattr(atencion.estado, 'value', str(atencion.estado)) == "Finalizada":
            estado_atencion_especifico = "Validado"
        else:
            diag = self.db.query(Diagnostico).filter(Diagnostico.atencion_medica_id == atencion.id).first()
            if diag:
                val = getattr(diag.estado_validacion, 'value', str(diag.estado_validacion))
                estado_atencion_especifico = val if val else "Pendiente de validación"
            elif atencion.examen_fisico:
                estado_atencion_especifico = "Derivado a radiografía"

        atencion_dict = atencion.__dict__.copy()
        atencion_dict["presion_arterial"] = atencion.presion_arterial
        atencion_dict["paciente_nombre"] = paciente.nombres_apellidos
        atencion_dict["paciente_edad"] = edad
        atencion_dict["paciente_dni"] = paciente.dni
        atencion_dict["paciente_sexo"] = paciente.sexo
        atencion_dict["paciente_estado_clinico"] = estado_atencion_especifico
        return atencion_dict

    def update_atencion_evaluacion(self, atencion: AtencionMedica, examen_fisico: str, estado_final: str = None) -> AtencionMedica:
        atencion.examen_fisico = examen_fisico
        if estado_final:
            atencion.estado = estado_final
        self.db.commit()
        self.db.refresh(atencion)
        return atencion
