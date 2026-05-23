from pydantic import BaseModel


class DiagnosticoCreateResponse(BaseModel):
    diagnostico_id: int
    paciente_id: int
    imagen_url: str
    imagenes_url: list[str]
    resultado_ia: str | None
    enfermo: bool
    nivel_gravedad_ia: str | None
    prioridad: str
    nivel_confianza: int | None
    mensaje: str


class DiagnosticoRecienteItem(BaseModel):
    diagnostico_id: int
    expediente_id: str
    paciente_nombre: str
    edad: int | None
    fecha_registro: str | None
    resultado_ia: str | None
    enfermo: bool
    status: str
    confidence: int | None


class DesgloseConfianzaItem(BaseModel):
    label: str
    value: int


class HallazgoItem(BaseModel):
    area: str
    description: str
    severity: str


class PacienteResumenResultado(BaseModel):
    nombre_completo: str
    expediente_id: str
    edad: int | None
    sexo: str
    temperatura_c: str | None
    saturacion_o2: int | None
    frecuencia_respiratoria: int | None
    comorbilidades: list[str]
    tiempo_evolucion_dias: int | None


class DiagnosticoResultadoResponse(BaseModel):
    diagnostico_id: int
    enfermo: bool
    status: str
    badge: str
    resultado_ia: str
    prioridad: str
    nivel_gravedad_ia: str | None
    nivel_confianza: int
    desglose_confianza: list[DesgloseConfianzaItem]
    hallazgos: list[HallazgoItem]
    recomendaciones: list[str]
    paciente: PacienteResumenResultado
    imagenes_url: list[str]
