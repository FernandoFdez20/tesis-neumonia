import uuid
import shutil
import logging
from pathlib import Path
from typing import Optional
from fastapi import HTTPException, UploadFile

from sqlalchemy.orm import Session
from app.modules.diagnosticos.repository import DiagnosticoRepository
from app.modules.diagnosticos.models import Diagnostico
from app.modules.atenciones.repository import AtencionMedicaRepository
from app.modules.atenciones.models import AtencionMedica
from app.modules.pacientes.repository import PacienteRepository
from app.modules.pacientes.models import EstadoClinico
from app.ml.inferencia import preprocesar_imagen, predecir, etiqueta_de
from app.ml.modelo_manager import get_modelo

logger = logging.getLogger(__name__)

# Carpeta base para guardar imágenes
UPLOAD_DIR = Path(__file__).resolve().parents[4] / "uploads" / "radiografias"

UMBRAL = 0.5


def _guardar_archivo(archivo: UploadFile, subfolder: str) -> Path:
    """Guarda el archivo en disco. Devuelve la ruta absoluta."""
    ext = Path(archivo.filename).suffix.lower()
    nombre_unico = f"{uuid.uuid4().hex}{ext}"
    destino = UPLOAD_DIR / subfolder / nombre_unico
    destino.parent.mkdir(parents=True, exist_ok=True)

    with destino.open("wb") as buffer:
        shutil.copyfileobj(archivo.file, buffer)

    return destino


def _url_relativa(ruta_abs: Path) -> str:
    """Convierte ruta absoluta a URL relativa para guardar en BD."""
    partes = ruta_abs.parts
    idx = next(i for i, p in enumerate(partes) if p == "uploads")
    return "/" + "/".join(partes[idx:])


def _ejecutar_inferencia(ruta_ap: Optional[Path], ruta_pa: Optional[Path]) -> dict:
    """
    Corre DenseNet121 sobre la(s) imagen(es) DICOM.
    Devuelve resultados crudos independientes por cada vista.
    """
    modelo = get_modelo()
    resultados_crudos = {}

    if ruta_ap:
        try:
            arr, _ = preprocesar_imagen(ruta_ap)
            prob = float(predecir(modelo, arr))
            resultados_crudos["AP"] = prob
            print(f"\n[MODELO IA] Resultado crudo para AP ({ruta_ap.name}): {prob}")
        except Exception as e:
            logger.warning(f"No se pudo procesar AP: {e}")

    if ruta_pa:
        try:
            arr, _ = preprocesar_imagen(ruta_pa)
            prob = float(predecir(modelo, arr))
            resultados_crudos["PA"] = prob
            print(f"[MODELO IA] Resultado crudo para PA ({ruta_pa.name}): {prob}\n")
        except Exception as e:
            logger.warning(f"No se pudo procesar PA: {e}")

    return resultados_crudos


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
        if not archivo_ap and not archivo_pa:
            raise HTTPException(
                status_code=400,
                detail="Debe subir al menos una imagen AP o PA."
            )

        # Verificar que la atención existe
        atencion = (
            self.atencion_repo.db.query(AtencionMedica)
            .filter_by(id=atencion_medica_id)
            .first()
        )
        if not atencion:
            raise HTTPException(status_code=404, detail="Atención no encontrada")

        subfolder = str(atencion_medica_id)

        # --- Limpiar historial anterior si ya existe diagnóstico ---
        diagnostico = self.repo.get_por_atencion(atencion_medica_id)
        if diagnostico:
            # 1. Borrar filas de la BD
            self.repo.limpiar_imagenes(diagnostico.id)
            # 2. Borrar archivos físicos
            dir_atencion = UPLOAD_DIR / subfolder
            if dir_atencion.exists():
                shutil.rmtree(dir_atencion)
        else:
            diagnostico = self.repo.crear_diagnostico(atencion_medica_id)

        # --- Guardar nuevas imágenes en disco ---
        ruta_ap: Optional[Path] = None
        ruta_pa: Optional[Path] = None

        if archivo_ap:
            ruta_ap = _guardar_archivo(archivo_ap, subfolder)
        if archivo_pa:
            ruta_pa = _guardar_archivo(archivo_pa, subfolder)

        # --- Ejecutar inferencia IA (independiente) ---
        resultados_crudos = _ejecutar_inferencia(ruta_ap, ruta_pa)
        print(f"Diccionario de resultados crudos devueltos: {resultados_crudos}")

        # --- Registrar imágenes en BD (con resultados IA independientes) ---
        def preparar_resultados(vista: str):
            prob = resultados_crudos.get(vista)
            if prob is None:
                return None, None, None
            etiq = etiqueta_de(prob, UMBRAL)
            confianza = prob if etiq == 1 else 1.0 - prob
            return prob, round(confianza * 100, 2), bool(etiq)

        orden = 1
        probs_totales = []
        imagenes_creadas = []
        
        if ruta_ap:
            prob_ap, conf_ap, hallazgo_ap = preparar_resultados("AP")
            if prob_ap is not None: probs_totales.append(prob_ap)
            img_ap = self.repo.agregar_imagen(
                diagnostico.id, _url_relativa(ruta_ap), orden, "AP",
                prob_ap, conf_ap, hallazgo_ap
            )
            imagenes_creadas.append(img_ap)
            orden += 1
        
        if ruta_pa:
            prob_pa, conf_pa, hallazgo_pa = preparar_resultados("PA")
            if prob_pa is not None: probs_totales.append(prob_pa)
            img_pa = self.repo.agregar_imagen(
                diagnostico.id, _url_relativa(ruta_pa), orden, "PA",
                prob_pa, conf_pa, hallazgo_pa
            )
            imagenes_creadas.append(img_pa)
            
        self.repo.db.flush()
        
        # --- Resultados Globales en Diagnostico (Usando Imagen de Referencia) ---
        if imagenes_creadas:
            imgs_con_prob = [i for i in imagenes_creadas if i.probabilidad_ia is not None]
            if imgs_con_prob:
                img_ref = max(imgs_con_prob, key=lambda x: x.probabilidad_ia)
                diagnostico.imagen_referencia_id = img_ref.id

                # Ya no promediamos. El resultado final del paciente es el de la peor imagen.
                prob_final = img_ref.probabilidad_ia
                confianza_final = img_ref.confianza_radiografica
                etiq_final = etiqueta_de(prob_final, UMBRAL)
                
                diagnostico.enfermo = bool(etiq_final)
                
                # --- Cálculo de Prioridad Final (Fusión CRB-65 + IA) ---
                if atencion.crb65_gravedad:
                    crb_g = atencion.crb65_gravedad.lower()
                    ia_pos = diagnostico.enfermo
                    prioridad = "Baja"
                    regla = ""
                    
                    if crb_g == "grave" and ia_pos:
                        prioridad = "Crítica"
                        regla = "Grave + Positivo → Crítica"
                    elif crb_g == "grave" and not ia_pos:
                        prioridad = "Alta"
                        regla = "Grave + Negativo → Alta"
                    elif crb_g == "moderado" and ia_pos:
                        prioridad = "Alta"
                        regla = "Moderado + Positivo → Alta"
                    elif crb_g == "moderado" and not ia_pos:
                        prioridad = "Moderada"
                        regla = "Moderado + Negativo → Moderada"
                    elif crb_g == "leve" and ia_pos:
                        prioridad = "Moderada"
                        regla = "Leve + Positivo → Moderada"
                    else:
                        prioridad = "Baja"
                        regla = "Leve + Negativo → Baja"
                    
                    diagnostico.prioridad_final = prioridad
                    diagnostico.prioridad_detalle = {
                        "crb65_gravedad": atencion.crb65_gravedad,
                        "crb65_puntaje": atencion.crb65_puntaje,
                        "resultado_ia": "Positivo" if ia_pos else "Negativo",
                        "confianza_ia_maxima": confianza_final,
                        "regla_aplicada": regla
                    }
        
        diagnostico.estado_validacion = EstadoClinico.PendienteDeValidacion

        # --- Cambiar estado clínico del paciente ---
        paciente = self.paciente_repo.get_paciente_por_id(atencion.paciente_id)
        if paciente:
            self.paciente_repo.update_estado_clinico(
                paciente, EstadoClinico.PendienteDeValidacion
            )

        self.repo.commit()
        self.repo.refresh(diagnostico)
        return diagnostico

    def get_por_atencion(self, atencion_medica_id: int) -> Diagnostico:
        diag = self.repo.get_por_atencion(atencion_medica_id)
        if not diag:
            raise HTTPException(status_code=404, detail="Diagnóstico no encontrado")
        return diag
