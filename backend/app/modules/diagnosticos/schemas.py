from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class DiagnosticoImagenResponse(BaseModel):
    id: int
    diagnostico_id: int
    imagen_url: str
    orden: int
    tipo_vista: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DiagnosticoResponse(BaseModel):
    id: int
    atencion_medica_id: int
    enfermo: Optional[bool] = None
    resultado_ia: Optional[str] = None
    nivel_gravedad_ia: Optional[str] = None
    probabilidad_ia: Optional[float] = None
    confianza_radiografica: Optional[float] = None
    confianza_clinica: Optional[float] = None
    confianza_riesgo: Optional[float] = None
    hallazgos_json: Optional[dict] = None
    estado_validacion: Optional[str] = None
    diagnostico_descripcion: Optional[str] = None
    validado_por_id: Optional[int] = None
    fecha_validacion: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    imagenes: List[DiagnosticoImagenResponse] = []

    model_config = ConfigDict(from_attributes=True)
