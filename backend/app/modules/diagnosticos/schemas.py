from pydantic import BaseModel


class DiagnosticoCreateResponse(BaseModel):
    diagnostico_id: int
    paciente_id: int
    imagen_url: str
    mensaje: str


class DiagnosticoRecienteItem(BaseModel):
    diagnostico_id: int
    expediente_id: str
    paciente_nombre: str
    edad: int | None
    fecha_registro: str | None
    resultado_ia: str | None
    status: str
    confidence: int | None
