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
    presion_arterial: Optional[str] = None
    tiempo_evolucion_dias: Optional[int] = None
    sintomas_principales: Optional[str] = None
    examen_fisico: Optional[str] = None
    estado: EstadoAtencion = EstadoAtencion.EnProceso


class AtencionMedicaCreate(AtencionMedicaBase):
    pass


class AtencionMedicaResponse(AtencionMedicaBase):
    id: int
    usuario_id: int
    fecha_registro: datetime

    model_config = ConfigDict(from_attributes=True)

class AtencionMedicaConPacienteResponse(AtencionMedicaResponse):
    paciente_nombre: str = Field(default="Desconocido")
    paciente_edad: int = Field(default=0)

