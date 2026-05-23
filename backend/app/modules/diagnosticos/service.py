import json
import random
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.modules.enfermedades.models import Enfermedad

from .models import Diagnostico, DiagnosticoImagen, Paciente, PacienteEnfermedad


UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads" / "radiografias"


def _calculate_age(fecha_nacimiento: date | None) -> int | None:
    if not fecha_nacimiento:
        return None

    today = date.today()
    age = today.year - fecha_nacimiento.year
    if (today.month, today.day) < (fecha_nacimiento.month, fecha_nacimiento.day):
        age -= 1
    return age


def _infer_status(resultado_ia: str | None, enfermo: bool | None = None) -> str:
    if enfermo is not None:
        return "positive" if enfermo else "negative"

    normalized = (resultado_ia or "").lower()
    if "detect" in normalized or "neumon" in normalized:
        return "positive"
    return "negative"


POSITIVE_FINDINGS = [
    {
        "area": "Lobulo inferior derecho",
        "description": "Opacidad alveolar difusa con broncograma aereo",
        "severity": "high",
    },
    {
        "area": "Lobulo medio derecho",
        "description": "Consolidacion parcial con patron intersticial",
        "severity": "medium",
    },
    {
        "area": "Base pulmonar izquierda",
        "description": "Leve derrame pleural asociado",
        "severity": "low",
    },
]

NEGATIVE_FINDINGS = [
    {
        "area": "Campos pulmonares",
        "description": "Sin opacidades focales compatibles con neumonia",
        "severity": "low",
    },
    {
        "area": "Pleuras",
        "description": "Sin derrame pleural visible",
        "severity": "low",
    },
    {
        "area": "Patron general",
        "description": "Sin hallazgos inflamatorios agudos relevantes",
        "severity": "low",
    },
]

POSITIVE_RECOMMENDATIONS = [
    "Realizar cultivo de esputo y hemocultivos",
    "Iniciar antibioticoterapia empirica segun guias locales",
    "Monitoreo continuo de saturacion de oxigeno",
    "Considerar tomografia de torax si no hay mejoria en 48-72h",
    "Evaluacion por neumologia si hay factores de riesgo",
]

NEGATIVE_RECOMMENDATIONS = [
    "Mantener observacion clinica y reevaluar si aparecen nuevos sintomas",
    "Continuar manejo sintomatico segun criterio medico",
    "Control de signos vitales en seguimiento ambulatorio",
    "Solicitar nueva imagen si hay empeoramiento clinico",
    "Registrar evolucion y factores de riesgo en la historia clinica",
]


def _random_int(min_value: int, max_value: int) -> int:
    return random.randint(min_value, max_value)


def _prioridad_from_nivel_gravedad(nivel_gravedad_ia: str | None) -> str:
    # Convierte la gravedad clínica en prioridad para mantener compatibilidad con el frontend.
    mapping = {
        "Grave": "Alta",
        "Moderado": "Moderada",
        "Leve": "Baja",
        "Normal": "Ninguna",
    }
    return mapping.get(nivel_gravedad_ia or "", "Ninguna")


def _build_desglose_confianza(
    confianza_radiografica: Decimal | None,
    confianza_clinica: Decimal | None,
    confianza_riesgo: Decimal | None,
):
    return [
        {
            "label": "Analisis radiografico",
            "value": int(float(confianza_radiografica or 0)),
        },
        {
            "label": "Correlacion clinica",
            "value": int(float(confianza_clinica or 0)),
        },
        {
            "label": "Factores de riesgo",
            "value": int(float(confianza_riesgo or 0)),
        },
    ]


def _simulate_ai_result_payload():
    # Genera un resultado simulado para persistir diagnósticos mientras no exista IA productiva.
    is_positive = random.random() < 0.5
    resultado_ia = (
        "Hallazgos Compatibles con Neumonia"
        if is_positive
        else "Sin Hallazgos de Neumonia"
    )

    if is_positive:
        nivel_gravedad_ia = random.choice(["Grave", "Moderado", "Leve"])
        base_confidence = _random_int(72, 97)
    else:
        nivel_gravedad_ia = "Normal"
        base_confidence = _random_int(78, 99)

    conf_radiografica = _random_int(
        max(55, base_confidence - 14), min(99, base_confidence + 4)
    )
    conf_clinica = _random_int(
        max(55, base_confidence - 12), min(99, base_confidence + 5)
    )
    conf_riesgo = _random_int(
        max(50, base_confidence - 16), min(99, base_confidence + 3)
    )

    return {
        "enfermo": is_positive,
        "status": "positive" if is_positive else "negative",
        "badge": "Diagnostico Presuntivo Positivo"
        if is_positive
        else "Diagnostico Presuntivo Negativo",
        "resultado_ia": resultado_ia,
        "nivel_gravedad_ia": nivel_gravedad_ia,
        "prioridad": _prioridad_from_nivel_gravedad(nivel_gravedad_ia),
        "nivel_confianza": base_confidence,
        "confianza_radiografica": conf_radiografica,
        "confianza_clinica": conf_clinica,
        "confianza_riesgo": conf_riesgo,
        "hallazgos": POSITIVE_FINDINGS if is_positive else NEGATIVE_FINDINGS,
        "recomendaciones": POSITIVE_RECOMMENDATIONS
        if is_positive
        else NEGATIVE_RECOMMENDATIONS,
    }


def get_diagnostico_resultado(db: Session, diagnostico_id: int):
    diagnostico = (
        db.query(Diagnostico)
        .join(Paciente, Paciente.id == Diagnostico.paciente_id)
        .filter(Diagnostico.id == diagnostico_id)
        .first()
    )

    if not diagnostico:
        raise HTTPException(status_code=404, detail="Diagnostico no encontrado")

    comorbilidades_rows = (
        db.query(Enfermedad.nombre)
        .join(
            PacienteEnfermedad,
            PacienteEnfermedad.enfermedad_id == Enfermedad.id,
        )
        .filter(PacienteEnfermedad.paciente_id == diagnostico.paciente_id)
        .all()
    )
    comorbilidades = [row[0] for row in comorbilidades_rows]

    status = _infer_status(diagnostico.resultado_ia, diagnostico.enfermo)
    badge = (
        "Diagnostico Presuntivo Positivo"
        if status == "positive"
        else "Diagnostico Presuntivo Negativo"
    )
    prioridad = _prioridad_from_nivel_gravedad(diagnostico.nivel_gravedad_ia)
    nivel_confianza = int(float(diagnostico.probabilidad_ia or 0) * 100)

    hallazgos = diagnostico.hallazgos_json
    if not isinstance(hallazgos, list):
        hallazgos = POSITIVE_FINDINGS if status == "positive" else NEGATIVE_FINDINGS

    recomendaciones = (
        POSITIVE_RECOMMENDATIONS if status == "positive" else NEGATIVE_RECOMMENDATIONS
    )
    imagenes_urls = [img.imagen_url for img in (diagnostico.imagenes or [])]
    if not imagenes_urls and diagnostico.imagen_url:
        imagenes_urls = [diagnostico.imagen_url]

    return {
        "diagnostico_id": diagnostico.id,
        "enfermo": bool(diagnostico.enfermo),
        "status": status,
        "badge": badge,
        "resultado_ia": diagnostico.resultado_ia or "Sin Hallazgos de Neumonia",
        "prioridad": prioridad,
        "nivel_gravedad_ia": diagnostico.nivel_gravedad_ia,
        "nivel_confianza": nivel_confianza,
        "desglose_confianza": _build_desglose_confianza(
            diagnostico.confianza_radiografica,
            diagnostico.confianza_clinica,
            diagnostico.confianza_riesgo,
        ),
        "hallazgos": hallazgos,
        "recomendaciones": recomendaciones,
        "paciente": {
            "nombre_completo": diagnostico.paciente.nombres_apellidos,
            "expediente_id": diagnostico.paciente.dni,
            "edad": _calculate_age(diagnostico.paciente.fecha_nacimiento),
            "sexo": diagnostico.paciente.sexo,
            "temperatura_c": str(diagnostico.temperatura)
            if diagnostico.temperatura is not None
            else None,
            "saturacion_o2": diagnostico.saturacion_o2,
            "frecuencia_respiratoria": diagnostico.frecuencia_respiratoria,
            "comorbilidades": comorbilidades,
            "tiempo_evolucion_dias": diagnostico.tiempo_evolucion_dias,
        },
        "imagenes_url": imagenes_urls,
    }


def get_recent_diagnosticos(db: Session, limit: int = 10):
    # Consulta solo columnas estables para evitar fallos en esquemas de BD aún no migrados.
    items = (
        db.query(
            Diagnostico.id,
            Diagnostico.fecha_registro,
            Diagnostico.resultado_ia,
            Diagnostico.enfermo,
            Diagnostico.probabilidad_ia,
            Paciente.dni,
            Paciente.nombres_apellidos,
            Paciente.fecha_nacimiento,
        )
        .join(Paciente, Paciente.id == Diagnostico.paciente_id)
        .order_by(Diagnostico.fecha_registro.desc(), Diagnostico.id.desc())
        .limit(limit)
        .all()
    )

    recent = []
    for item in items:
        confidence = None
        if item.probabilidad_ia is not None:
            confidence = int(float(item.probabilidad_ia) * 100)

        recent.append(
            {
                "diagnostico_id": item.id,
                "expediente_id": item.dni,
                "paciente_nombre": item.nombres_apellidos,
                "edad": _calculate_age(item.fecha_nacimiento),
                "fecha_registro": item.fecha_registro.isoformat()
                if item.fecha_registro
                else None,
                "resultado_ia": item.resultado_ia,
                "enfermo": bool(item.enfermo),
                "status": _infer_status(item.resultado_ia, item.enfermo),
                "confidence": confidence,
            }
        )

    return recent


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _parse_int(value: str | None) -> int | None:
    if not value or not value.strip():
        return None
    try:
        return int(value)
    except ValueError:
        return None


def _parse_decimal(value: str | None) -> Decimal | None:
    if not value or not value.strip():
        return None
    try:
        return Decimal(value)
    except Exception:
        return None


def _save_image_file(file: UploadFile) -> str:
    # Guarda la radiografia en carpeta local por defecto: backend/uploads/radiografias.
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    extension = Path(file.filename or "").suffix.lower() or ".jpg"
    safe_extension = (
        extension
        if extension in {".jpg", ".jpeg", ".png", ".webp", ".dicom", ".dcm"}
        else ".jpg"
    )
    filename = f"rx_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:8]}{safe_extension}"
    full_path = UPLOAD_DIR / filename

    file.file.seek(0)
    with full_path.open("wb") as buffer:
        buffer.write(file.file.read())

    return f"/uploads/radiografias/{filename}"


def _upsert_paciente(
    db: Session,
    *,
    expediente_id: str,
    nombre_completo: str,
    sexo: str,
    fecha_nacimiento: str,
    peso_kg: str | None,
    otros_antecedentes: str | None,
    antecedentes_familiares: str | None,
) -> Paciente:
    fecha = _parse_date(fecha_nacimiento)
    if not fecha:
        raise HTTPException(status_code=400, detail="Fecha de nacimiento invalida")

    paciente = db.query(Paciente).filter(Paciente.dni == expediente_id).first()
    if not paciente:
        paciente = Paciente(dni=expediente_id)
        # Asegura timestamp de alta incluso si la BD no aplica default por esquema previo.
        paciente.created_at = datetime.utcnow()
        db.add(paciente)

    # Si existe, actualizamos datos para mantener la informacion mas reciente desde formulario.
    paciente.nombres_apellidos = nombre_completo
    paciente.sexo = sexo
    paciente.fecha_nacimiento = fecha
    paciente.peso_kg = _parse_decimal(peso_kg)
    paciente.otros_antecedentes = otros_antecedentes
    paciente.antecedentes_familiares = antecedentes_familiares

    return paciente


def _sync_paciente_enfermedades(
    db: Session, paciente_id: int, enfermedades_cronicas: list[str]
) -> None:
    # Limpia relacion previa y vuelve a insertar la seleccion actual del formulario.
    db.execute(
        delete(PacienteEnfermedad).where(PacienteEnfermedad.paciente_id == paciente_id)
    )

    if not enfermedades_cronicas:
        return

    enfermedades = (
        db.query(Enfermedad).filter(Enfermedad.nombre.in_(enfermedades_cronicas)).all()
    )

    for enfermedad in enfermedades:
        db.add(
            PacienteEnfermedad(
                paciente_id=paciente_id,
                enfermedad_id=enfermedad.id,
            )
        )


def create_diagnostico_desde_form(
    db: Session,
    *,
    usuario_id: int,
    imagen_files: list[UploadFile],
    nombre_completo: str,
    expediente_id: str,
    fecha_nacimiento: str,
    sexo: str,
    peso_kg: str | None,
    motivo_consulta: str | None,
    temperatura_c: str | None,
    frecuencia_cardiaca: str | None,
    frecuencia_respiratoria: str | None,
    saturacion_o2: str | None,
    presion_arterial: str | None,
    tiempo_evolucion_dias: str | None,
    sintomas_principales: str | None,
    otros_antecedentes: str | None,
    antecedentes_familiares: str | None,
    enfermedades_cronicas: str | None,
):
    if not imagen_files:
        raise HTTPException(status_code=400, detail="Radiografia requerida")

    if len(imagen_files) > 4:
        raise HTTPException(
            status_code=400,
            detail="Maximo 4 imagenes por diagnostico",
        )

    if not nombre_completo or not expediente_id or not sexo:
        raise HTTPException(
            status_code=400, detail="Faltan datos obligatorios del paciente"
        )

    image_urls = [_save_image_file(file) for file in imagen_files]

    paciente = _upsert_paciente(
        db,
        expediente_id=expediente_id,
        nombre_completo=nombre_completo,
        sexo=sexo,
        fecha_nacimiento=fecha_nacimiento,
        peso_kg=peso_kg,
        otros_antecedentes=otros_antecedentes,
        antecedentes_familiares=antecedentes_familiares,
    )

    db.flush()

    enfermedades_list: list[str] = []
    if enfermedades_cronicas:
        try:
            parsed = json.loads(enfermedades_cronicas)
            if isinstance(parsed, list):
                enfermedades_list = [str(item) for item in parsed]
        except json.JSONDecodeError:
            enfermedades_list = []

    _sync_paciente_enfermedades(db, paciente.id, enfermedades_list)

    diagnostico = Diagnostico(
        paciente_id=paciente.id,
        usuario_id=usuario_id,
        fecha_registro=datetime.utcnow(),
        # Conserva compatibilidad con esquema actual usando la primera imagen como principal.
        imagen_url=image_urls[0],
        temperatura=_parse_decimal(temperatura_c),
        frecuencia_cardiaca=_parse_int(frecuencia_cardiaca),
        frecuencia_respiratoria=_parse_int(frecuencia_respiratoria),
        saturacion_o2=_parse_int(saturacion_o2),
        presion_arterial=presion_arterial,
        tiempo_evolucion_dias=_parse_int(tiempo_evolucion_dias),
        sintomas_principales=sintomas_principales or motivo_consulta,
        updated_at=datetime.utcnow(),
    )

    simulated_result = _simulate_ai_result_payload()
    diagnostico.resultado_ia = simulated_result["resultado_ia"]
    diagnostico.enfermo = simulated_result["enfermo"]
    diagnostico.nivel_gravedad_ia = simulated_result["nivel_gravedad_ia"]
    diagnostico.probabilidad_ia = Decimal(
        str(simulated_result["nivel_confianza"] / 100)
    )
    diagnostico.confianza_radiografica = Decimal(
        str(simulated_result["confianza_radiografica"])
    )
    diagnostico.confianza_clinica = Decimal(str(simulated_result["confianza_clinica"]))
    diagnostico.confianza_riesgo = Decimal(str(simulated_result["confianza_riesgo"]))
    diagnostico.hallazgos_json = simulated_result["hallazgos"]
    diagnostico.diagnostico_descripcion = f"Prioridad: {simulated_result['prioridad']}"

    db.add(diagnostico)
    db.flush()

    for index, image_url in enumerate(image_urls, start=1):
        db.add(
            DiagnosticoImagen(
                diagnostico_id=diagnostico.id,
                imagen_url=image_url,
                orden=index,
            )
        )

    db.commit()
    # Refresca campos mínimos para evitar lecturas de columnas opcionales aún no migradas.
    db.refresh(diagnostico, attribute_names=["id", "paciente_id", "imagen_url"])
    db.refresh(diagnostico, attribute_names=["imagenes"])

    return diagnostico
