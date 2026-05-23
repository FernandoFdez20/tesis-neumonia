from typing import List

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db

from . import schemas, service

router = APIRouter(prefix="/diagnosticos", tags=["Diagnosticos"])


def _extract_usuario_id_from_bearer(authorization: str | None) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")

    token = authorization.replace("Bearer ", "", 1).strip()
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalido o expirado")

    usuario_id = payload.get("usuario_id")
    if not usuario_id:
        raise HTTPException(status_code=401, detail="Token invalido")

    return int(usuario_id)


def _prioridad_from_nivel_gravedad(nivel_gravedad_ia: str | None) -> str:
    mapping = {
        "Grave": "Alta",
        "Moderado": "Moderada",
        "Leve": "Baja",
        "Normal": "Ninguna",
    }
    return mapping.get(nivel_gravedad_ia or "", "Ninguna")


@router.get("/recientes", response_model=List[schemas.DiagnosticoRecienteItem])
def listar_diagnosticos_recientes(
    limit: int = 10,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    # Mantiene acceso autenticado igual que el resto de operaciones clinicas.
    _extract_usuario_id_from_bearer(authorization)

    return service.get_recent_diagnosticos(db=db, limit=limit)


@router.get(
    "/{diagnostico_id}/resultado", response_model=schemas.DiagnosticoResultadoResponse
)
def obtener_resultado_diagnostico(
    diagnostico_id: int,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    _extract_usuario_id_from_bearer(authorization)
    return service.get_diagnostico_resultado(db=db, diagnostico_id=diagnostico_id)


@router.post("/", response_model=schemas.DiagnosticoCreateResponse)
def crear_diagnostico(
    nombre_completo: str = Form(...),
    expediente_id: str = Form(...),
    fecha_nacimiento: str = Form(...),
    sexo: str = Form(...),
    peso_kg: str | None = Form(default=None),
    motivo_consulta: str | None = Form(default=None),
    temperatura_c: str | None = Form(default=None),
    frecuencia_cardiaca: str | None = Form(default=None),
    frecuencia_respiratoria: str | None = Form(default=None),
    saturacion_o2: str | None = Form(default=None),
    presion_arterial: str | None = Form(default=None),
    tiempo_evolucion_dias: str | None = Form(default=None),
    sintomas_principales: str | None = Form(default=None),
    otros_antecedentes: str | None = Form(default=None),
    antecedentes_familiares: str | None = Form(default=None),
    enfermedades_cronicas: str | None = Form(default=None),
    imagen_files: list[UploadFile] | None = File(default=None),
    imagen_file: UploadFile | None = File(default=None),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    usuario_id = _extract_usuario_id_from_bearer(authorization)

    incoming_images = list(imagen_files or [])
    if imagen_file is not None:
        incoming_images.append(imagen_file)

    diagnostico = service.create_diagnostico_desde_form(
        db=db,
        usuario_id=int(usuario_id),
        imagen_files=incoming_images,
        nombre_completo=nombre_completo,
        expediente_id=expediente_id,
        fecha_nacimiento=fecha_nacimiento,
        sexo=sexo,
        peso_kg=peso_kg,
        motivo_consulta=motivo_consulta,
        temperatura_c=temperatura_c,
        frecuencia_cardiaca=frecuencia_cardiaca,
        frecuencia_respiratoria=frecuencia_respiratoria,
        saturacion_o2=saturacion_o2,
        presion_arterial=presion_arterial,
        tiempo_evolucion_dias=tiempo_evolucion_dias,
        sintomas_principales=sintomas_principales,
        otros_antecedentes=otros_antecedentes,
        antecedentes_familiares=antecedentes_familiares,
        enfermedades_cronicas=enfermedades_cronicas,
    )

    return {
        "diagnostico_id": diagnostico.id,
        "paciente_id": diagnostico.paciente_id,
        "imagen_url": diagnostico.imagen_url,
        "imagenes_url": [img.imagen_url for img in (diagnostico.imagenes or [])],
        "resultado_ia": diagnostico.resultado_ia,
        "enfermo": bool(diagnostico.enfermo),
        "nivel_gravedad_ia": diagnostico.nivel_gravedad_ia,
        "prioridad": _prioridad_from_nivel_gravedad(diagnostico.nivel_gravedad_ia),
        "nivel_confianza": int(float(diagnostico.probabilidad_ia or 0) * 100),
        "mensaje": "Diagnostico registrado correctamente",
    }
