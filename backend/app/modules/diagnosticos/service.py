import json
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.modules.enfermedades.models import Enfermedad

from .models import Diagnostico, Paciente, PacienteEnfermedad


UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads" / "radiografias"


def _calculate_age(fecha_nacimiento: date | None) -> int | None:
    if not fecha_nacimiento:
        return None

    today = date.today()
    age = today.year - fecha_nacimiento.year
    if (today.month, today.day) < (fecha_nacimiento.month, fecha_nacimiento.day):
        age -= 1
    return age


def _infer_status(resultado_ia: str | None) -> str:
    normalized = (resultado_ia or "").lower()
    if "detect" in normalized or "neumon" in normalized:
        return "positive"
    return "negative"


def get_recent_diagnosticos(db: Session, limit: int = 10):
    # Obtiene ultimos diagnosticos con datos de paciente para panel principal.
    items = (
        db.query(Diagnostico)
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
                "expediente_id": item.paciente.dni,
                "paciente_nombre": item.paciente.nombres_apellidos,
                "edad": _calculate_age(item.paciente.fecha_nacimiento),
                "fecha_registro": item.fecha_registro.isoformat()
                if item.fecha_registro
                else None,
                "resultado_ia": item.resultado_ia,
                "status": _infer_status(item.resultado_ia),
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
    imagen_file: UploadFile,
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
    if not imagen_file:
        raise HTTPException(status_code=400, detail="Radiografia requerida")

    if not nombre_completo or not expediente_id or not sexo:
        raise HTTPException(
            status_code=400, detail="Faltan datos obligatorios del paciente"
        )

    image_url = _save_image_file(imagen_file)

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
        imagen_url=image_url,
        temperatura=_parse_decimal(temperatura_c),
        frecuencia_cardiaca=_parse_int(frecuencia_cardiaca),
        frecuencia_respiratoria=_parse_int(frecuencia_respiratoria),
        saturacion_o2=_parse_int(saturacion_o2),
        presion_arterial=presion_arterial,
        tiempo_evolucion_dias=_parse_int(tiempo_evolucion_dias),
        sintomas_principales=sintomas_principales or motivo_consulta,
        updated_at=datetime.utcnow(),
    )

    db.add(diagnostico)
    db.commit()
    db.refresh(diagnostico)

    return diagnostico
