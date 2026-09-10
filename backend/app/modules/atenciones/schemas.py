from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.modules.atenciones.models import EstadoAtencion


class AtencionMedicaBase(BaseModel):
    paciente_id: int
    # Signos Vitales
    temperatura: Optional[float] = None
    frecuencia_cardiaca: Optional[int] = None
    frecuencia_respiratoria: Optional[int] = None
    saturacion_o2: Optional[int] = None
    presion_sistolica: Optional[int] = None
    presion_diastolica: Optional[int] = None
    tiempo_evolucion_dias: Optional[int] = None
    sintomas_principales: Optional[str] = None
    examen_fisico: Optional[str] = None
    confusion: Optional[bool] = False
    
    # CRB-65
    crb65_puntaje: Optional[int] = None
    crb65_gravedad: Optional[str] = None
    crb65_detalle: Optional[dict] = None
    
    estado: EstadoAtencion = EstadoAtencion.EnProceso


class AtencionMedicaCreate(AtencionMedicaBase):
    presion_arterial: Optional[str] = None


class AtencionMedicaResponse(AtencionMedicaBase):
    id: int
    usuario_id: int
    fecha_registro: datetime
    presion_arterial: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AtencionMedicaConPacienteResponse(AtencionMedicaResponse):
    paciente_nombre: str = Field(default="Desconocido")
    paciente_edad: int = Field(default=0)
    paciente_dni: str = Field(default="")
    paciente_sexo: str = Field(default="")
    paciente_estado_clinico: str = Field(default="")

class AtencionMedicaEvaluar(BaseModel):
    examen_fisico: str = Field(..., description="Notas del examen físico")
    accion: str = Field(..., description="'guardar_progreso' o 'derivar_radiografia'")


