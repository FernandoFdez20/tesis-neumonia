import os
import uuid
import shutil
from pathlib import Path
from typing import Optional, List
from fastapi import HTTPException, UploadFile

from sqlalchemy.orm import Session
from app.modules.diagnosticos.repository import DiagnosticoRepository
from app.modules.diagnosticos.models import Diagnostico
from app.modules.atenciones.repository import AtencionMedicaRepository
from app.modules.pacientes.repository import PacienteRepository
from app.modules.pacientes.models import EstadoClinico

# Carpeta base para guardar imágenes, relativa al directorio del backend
UPLOAD_DIR = Path(__file__).resolve().parents[4] / "uploads" / "radiografias"

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".dcm"}


def _validar_extension(filename: str):
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato no válido: {filename}. Solo se aceptan {ALLOWED_EXTENSIONS}"
        )
    return ext


def _guardar_archivo(archivo: UploadFile, subfolder: str) -> str:
    """Guarda el archivo en disco y retorna la URL relativa."""
    ext = _validar_extension(archivo.filename)
    nombre_unico = f"{uuid.uuid4().hex}{ext}"
    destino = UPLOAD_DIR / subfolder / nombre_unico

    destino.parent.mkdir(parents=True, exist_ok=True)

    with destino.open("wb") as buffer:
        shutil.copyfileobj(archivo.file, buffer)

    # URL relativa que se guarda en BD (servida por FastAPI StaticFiles)
    return f"/uploads/radiografias/{subfolder}/{nombre_unico}"


class DiagnosticoService:
    def __init__(self, db: Session):
        self.repo = DiagnosticoRepository(db)
        self.atencion_repo = AtencionMedicaRepository(db)
        self.paciente_repo = PacienteRepository(db)

    def cargar_radiografias(
        self,
        atencion_medica_id: int,
        archivo_ap: Optional[UploadFile],
        archivo_pa: Optional[UploadFile],
    ) -> Diagnostico:
        """
        Crea o reutiliza el diagnóstico de la atención,
        guarda las imágenes en disco y registra en BD.
        """
        if not archivo_ap and not archivo_pa:
            raise HTTPException(
                status_code=400,
                detail="Debe subir al menos una imagen (AP o PA)."
            )

        # Verificar que la atención existe
        atencion = (
            self.atencion_repo.db.query(__import__(
                "app.modules.atenciones.models", fromlist=["AtencionMedica"]).AtencionMedica)
            .filter_by(id=atencion_medica_id)
            .first()
        )
        if not atencion:
            raise HTTPException(
                status_code=404, detail="Atención no encontrada")

        # Crear diagnóstico si no existe aún
        diagnostico = self.repo.get_por_atencion(atencion_medica_id)
        if not diagnostico:
            diagnostico = self.repo.crear_diagnostico(atencion_medica_id)

        subfolder = str(atencion_medica_id)
        orden = 1

        if archivo_ap:
            url = _guardar_archivo(archivo_ap, subfolder)
            self.repo.agregar_imagen(diagnostico.id, url, orden, "AP")
            orden += 1

        if archivo_pa:
            url = _guardar_archivo(archivo_pa, subfolder)
            self.repo.agregar_imagen(diagnostico.id, url, orden, "PA")

        # Cambiar estado clínico del paciente a "Diagnostico pendiente"
        paciente = self.paciente_repo.get_paciente_por_id(atencion.paciente_id)
        if paciente:
            self.paciente_repo.update_estado_clinico(
                paciente, EstadoClinico.DiagnosticoPendiente
            )

        self.repo.commit()
        self.repo.refresh(diagnostico)
        return diagnostico

    def get_por_atencion(self, atencion_medica_id: int) -> Diagnostico:
        diag = self.repo.get_por_atencion(atencion_medica_id)
        if not diag:
            raise HTTPException(
                status_code=404, detail="Diagnóstico no encontrado")
        return diag
