from datetime import date, datetime, time
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator
import re

from app.modules.atenciones.models import EstadoAtencion


class AtencionMedicaBase(BaseModel):
    paciente_id: int
    fecha_atencion: Optional[date] = None
    hora_atencion: Optional[time] = None
    motivo_consulta: Optional[str] = None
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
    temperatura: Optional[float] = Field(default=None, ge=30, le=45, allow_inf_nan=False)
    frecuencia_cardiaca: Optional[int] = Field(default=None, ge=20, le=240)
    frecuencia_respiratoria: Optional[int] = Field(default=None, ge=5, le=80)
    saturacion_o2: Optional[int] = Field(default=None, ge=50, le=100)
    presion_sistolica: Optional[int] = Field(default=None, ge=50, le=300)
    presion_diastolica: Optional[int] = Field(default=None, ge=30, le=200)
    tiempo_evolucion_dias: Optional[int] = Field(default=None, ge=0, le=90)
    estado: Literal[EstadoAtencion.EnProceso] = EstadoAtencion.EnProceso

    @model_validator(mode="after")
    def validar_presion(self):
        if self.presion_arterial is not None:
            partes = re.fullmatch(r"\s*(\d+)\s*/\s*(\d+)\s*", self.presion_arterial)
            if not partes:
                raise ValueError("Presión arterial: formato SYS/DIA, ej. 120/80")
            sis, dia = map(int, partes.groups())
            if not 50 <= sis <= 300 or not 30 <= dia <= 200:
                raise ValueError("Presión arterial fuera de rango")
            if ((self.presion_sistolica is not None and self.presion_sistolica != sis)
                    or (self.presion_diastolica is not None and self.presion_diastolica != dia)):
                raise ValueError("Los valores de presión arterial no coinciden")
            self.presion_sistolica, self.presion_diastolica = sis, dia
        if (self.presion_sistolica is None) != (self.presion_diastolica is None):
            raise ValueError("Indique ambas presiones: sistólica y diastólica")
        if self.presion_sistolica is not None and self.presion_sistolica <= self.presion_diastolica:
            raise ValueError("La sistólica debe ser mayor que la diastólica")
        return self


class AtencionMedicaResponse(AtencionMedicaBase):
    id: int
    usuario_id: int
    fecha_registro: datetime
    derivado_radiografia: bool = False
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
    accion: Literal["guardar_progreso", "derivar_radiografia"]


