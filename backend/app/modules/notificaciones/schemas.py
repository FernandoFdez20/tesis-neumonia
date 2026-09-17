from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class NotificacionResponse(BaseModel):
    id: int
    diagnostico_id: int
    atencion_medica_id: int
    paciente_nombre: str
    prioridad: str
    mensaje: str
    leida: bool = False
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
