from pydantic import BaseModel, ConfigDict, Field
from typing import Literal, Optional, List
from datetime import datetime


class DiagnosticoImagenResponse(BaseModel):
    id: int
    diagnostico_id: int
    imagen_url: str
    orden: int
    tipo_vista: Optional[str] = None
    probabilidad_ia: Optional[float] = None
    confianza_radiografica: Optional[float] = None
    hallazgo_positivo: Optional[bool] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DiagnosticoResponse(BaseModel):
    id: int
    atencion_medica_id: int
    enfermo: Optional[bool] = None
    prioridad_final: Optional[str] = None
    prioridad_detalle: Optional[dict] = None
    imagen_referencia_id: Optional[int] = None
    estado_validacion: Optional[str] = None
    clasificacion_medico: Optional[str] = None
    diagnostico_final_medico: Optional[bool] = None
    concordancia_ia: Optional[str] = None
    diagnostico_descripcion: Optional[str] = None
    validado_por_id: Optional[int] = None
    fecha_validacion: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    imagenes: List[DiagnosticoImagenResponse] = []

    model_config = ConfigDict(from_attributes=True)
class DiagnosticoValidacionRequest(BaseModel):
    clasificacion_medico: Literal["Neumonía", "Sano", "Otro diagnóstico"]
    diagnostico_descripcion: str = Field(..., description="Observaciones médicas")
