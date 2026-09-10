from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class CRB65Request(BaseModel):
    confusion: bool = Field(..., description="Confusión mental de aparición nueva")
    frecuencia_respiratoria: int = Field(..., description="Frecuencia respiratoria por minuto")
    presion_sistolica: int = Field(..., description="Presión arterial sistólica (mmHg)")
    presion_diastolica: int = Field(..., description="Presión arterial diastólica (mmHg)")
    edad: Optional[int] = Field(None, description="Edad del paciente en años (opcional, se puede autocompletar)")

class CRB65Response(BaseModel):
    puntaje_total: int
    gravedad: str
    criterios: Dict[str, Dict[str, Any]]

def calcular_crb65(datos: CRB65Request, edad_paciente: int = None) -> CRB65Response:
    # Usar edad provista en el request, o la edad_paciente inyectada desde la BD
    edad_evaluar = datos.edad if datos.edad is not None else edad_paciente
    if edad_evaluar is None:
        raise ValueError("Se requiere la edad del paciente para el cálculo CRB-65")

    puntaje = 0
    criterios_detalle = {
        "confusion": {"valor": datos.confusion, "puntos": 0, "descripcion": "Confusión ausente"},
        "respiracion": {"valor": datos.frecuencia_respiratoria, "puntos": 0, "descripcion": "Frecuencia respiratoria < 30"},
        "presion": {"valor": f"{datos.presion_sistolica}/{datos.presion_diastolica}", "puntos": 0, "descripcion": "Presión arterial normal (>90/60)"},
        "edad": {"valor": edad_evaluar, "puntos": 0, "descripcion": "Edad < 65 años"}
    }

    # 1. Confusión
    if datos.confusion:
        puntaje += 1
        criterios_detalle["confusion"]["puntos"] = 1
        criterios_detalle["confusion"]["descripcion"] = "Presencia de confusión mental de aparición nueva"

    # 2. Respiratory rate (Frecuencia respiratoria >= 30)
    if datos.frecuencia_respiratoria >= 30:
        puntaje += 1
        criterios_detalle["respiracion"]["puntos"] = 1
        criterios_detalle["respiracion"]["descripcion"] = "Frecuencia respiratoria ≥ 30 rpm"

    # 3. Blood pressure (Sistólica < 90 o Diastólica <= 60)
    if datos.presion_sistolica < 90 or datos.presion_diastolica <= 60:
        puntaje += 1
        criterios_detalle["presion"]["puntos"] = 1
        criterios_detalle["presion"]["descripcion"] = "PAS < 90 mmHg o PAD ≤ 60 mmHg"

    # 4. Edad (65 años o más)
    if edad_evaluar >= 65:
        puntaje += 1
        criterios_detalle["edad"]["puntos"] = 1
        criterios_detalle["edad"]["descripcion"] = "Edad ≥ 65 años"

    # Determinar gravedad
    gravedad = "Leve"
    if puntaje >= 3:
        gravedad = "Grave"
    elif puntaje >= 1:
        gravedad = "Moderado"

    return CRB65Response(
        puntaje_total=puntaje,
        gravedad=gravedad,
        criterios=criterios_detalle
    )
