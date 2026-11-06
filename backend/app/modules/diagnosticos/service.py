import uuid
import shutil
import logging
import enum
import os
import tempfile
import math
from pathlib import Path
from typing import Optional
from fastapi import HTTPException, UploadFile

from sqlalchemy.orm import Session
from app.modules.diagnosticos.repository import DiagnosticoRepository
from app.modules.diagnosticos.models import Diagnostico, NivelGravedad
from app.modules.atenciones.repository import AtencionMedicaRepository
from app.modules.atenciones.models import AtencionMedica
from app.modules.pacientes.repository import PacienteRepository
from app.modules.pacientes.models import EstadoClinico
from app.ml.inferencia import preprocesar_imagen, predecir, etiqueta_de
from app.ml.vista_previa import generar_vista_png
from app.ml.modelo_manager import get_modelo

logger = logging.getLogger(__name__)

# Carpeta base para guardar imágenes.
# Se puede redirigir con la variable UPLOAD_DIR (lo usa la evaluación masiva
# para no mezclarse con las radiografías reales del paciente).
UPLOAD_DIR = Path(
    os.getenv("UPLOAD_DIR")
    or Path(__file__).resolve().parents[4] / "uploads" / "radiografias"
)

UMBRAL = 0.5


def _comprobar_archivos(archivo_ap: Optional[UploadFile], archivo_pa: Optional[UploadFile]) -> dict:
    """Valida todas las vistas antes de reemplazar archivos o filas existentes."""
    with tempfile.TemporaryDirectory(prefix="validar_radiografias_") as temporal:
        rutas = {}
        for vista, archivo in (("AP", archivo_ap), ("PA", archivo_pa)):
            if archivo is None:
                continue
            if Path(archivo.filename or "").suffix.lower() != ".dcm":
                raise HTTPException(status_code=400, detail="Solo se admiten archivos DICOM (.dcm)")
            datos = archivo.file.read(30 * 1024 * 1024 + 1)
            archivo.file.seek(0)
            if len(datos) > 30 * 1024 * 1024:
                raise HTTPException(status_code=413, detail="Archivo demasiado grande (máx. 30 MB)")
            ruta = Path(temporal) / f"{vista}.dcm"
            ruta.write_bytes(datos)
            try:
                generar_vista_png(ruta)
                preprocesar_imagen(ruta)
            except Exception:
                raise HTTPException(status_code=422, detail=f"No se pudo interpretar el archivo DICOM {vista}")
            rutas[vista] = ruta
        try:
            resultados = _ejecutar_inferencia(rutas.get("AP"), rutas.get("PA"))
        except Exception:
            raise HTTPException(status_code=503, detail="No se pudo completar el análisis; intente nuevamente")
        if any(v not in resultados or not math.isfinite(resultados[v])
               or not 0 <= resultados[v] <= 1 for v in rutas):
            raise HTTPException(status_code=503, detail="No se pudo completar el análisis; intente nuevamente")
        return resultados


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
    """Convierte ruta absoluta a URL relativa a /uploads para guardar en BD."""
    partes = ruta_abs.parts
    # Se busca 'radiografias' y se incluye la carpeta que lo contiene
    # ('uploads'), para no depender de una ruta absoluta fija.
    for i in range(len(partes) - 1, -1, -1):
        if partes[i] == "radiografias":
            return "/" + "/".join(partes[i - 1:])
    return "/" + ruta_abs.name


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
            print(
                f"\n[MODELO IA] Resultado crudo para AP ({ruta_ap.name}): {prob}")
        except Exception as e:
            logger.warning(f"No se pudo procesar AP: {e}")

    if ruta_pa:
        try:
            arr, _ = preprocesar_imagen(ruta_pa)
            prob = float(predecir(modelo, arr))
            resultados_crudos["PA"] = prob
            print(
                f"[MODELO IA] Resultado crudo para PA ({ruta_pa.name}): {prob}\n")
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
            .with_for_update()
            .first()
        )
        if not atencion:
            raise HTTPException(
                status_code=404, detail="Atención no encontrada")

        subfolder = str(atencion_medica_id)

        from app.modules.atenciones.estado import exigir_atencion_abierta
        exigir_atencion_abierta(self.repo.db, atencion)
        if not atencion.derivado_radiografia:
            raise HTTPException(status_code=400, detail="La atención debe estar derivada a radiografía")
        diagnostico = self.repo.get_por_atencion(atencion_medica_id)
        if diagnostico:
            raise HTTPException(status_code=400, detail="El caso ya tiene un análisis radiográfico; no se permite sustituirlo")
        resultados_crudos = _comprobar_archivos(archivo_ap, archivo_pa)
        diagnostico = self.repo.crear_diagnostico(atencion_medica_id)

        # --- Guardar nuevas imágenes en disco ---
        ruta_ap: Optional[Path] = None
        ruta_pa: Optional[Path] = None

        if archivo_ap:
            ruta_ap = _guardar_archivo(archivo_ap, subfolder)
        if archivo_pa:
            ruta_pa = _guardar_archivo(archivo_pa, subfolder)

        # --- Generar vista previa PNG junto a cada DICOM (para la interfaz) ---
        # Si falla, solo se registra: la subida y la inferencia no se interrumpen.
        for ruta in filter(None, [ruta_ap, ruta_pa]):
            try:
                if ruta.suffix.lower() == ".dcm":
                    generar_vista_png(ruta)
            except Exception as e:
                logger.warning(
                    f"No se pudo generar vista previa de {ruta.name}: {e}")

        # --- Ejecutar inferencia IA (independiente) ---
        print(
            f"Diccionario de resultados crudos devueltos: {resultados_crudos}")

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
            if prob_ap is not None:
                probs_totales.append(prob_ap)
            img_ap = self.repo.agregar_imagen(
                diagnostico.id, _url_relativa(ruta_ap), orden, "AP",
                prob_ap, conf_ap, hallazgo_ap
            )
            imagenes_creadas.append(img_ap)
            orden += 1

        if ruta_pa:
            prob_pa, conf_pa, hallazgo_pa = preparar_resultados("PA")
            if prob_pa is not None:
                probs_totales.append(prob_pa)
            img_pa = self.repo.agregar_imagen(
                diagnostico.id, _url_relativa(ruta_pa), orden, "PA",
                prob_pa, conf_pa, hallazgo_pa
            )
            imagenes_creadas.append(img_pa)

        self.repo.db.flush()

        # --- Resultados Globales en Diagnostico (Usando Imagen de Referencia) ---
        if imagenes_creadas:
            imgs_con_prob = [
                i for i in imagenes_creadas if i.probabilidad_ia is not None]
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
                        prioridad = NivelGravedad.Critica
                        regla = "Grave + Positivo → Crítica"
                    elif crb_g == "grave" and not ia_pos:
                        prioridad = NivelGravedad.Alta
                        regla = "Grave + Negativo → Alta"
                    elif crb_g == "moderado" and ia_pos:
                        prioridad = NivelGravedad.Alta
                        regla = "Moderado + Positivo → Alta"
                    elif crb_g == "moderado" and not ia_pos:
                        prioridad = NivelGravedad.Moderada
                        regla = "Moderado + Negativo → Moderada"
                    elif crb_g == "leve" and ia_pos:
                        prioridad = NivelGravedad.Moderada
                        regla = "Leve + Positivo → Moderada"
                    else:
                        prioridad = NivelGravedad.Baja
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

        # --- El paciente sigue en atencion ---
        # No necesitamos actualizar el campo en_atencion porque ya está en True

        self.repo.commit()
        self.repo.refresh(diagnostico)

        # --- Notificación persistente si la prioridad es Alta/Crítica ---
        # Fuera de la transacción principal: si falla, solo se registra.
        if diagnostico.prioridad_final is not None:
            from app.modules.notificaciones.service import NotificacionService
            prio = getattr(diagnostico.prioridad_final, "value",
                           str(diagnostico.prioridad_final))
            paciente = self.paciente_repo.get_paciente_por_id(
                atencion.paciente_id)
            nombre = paciente.nombres_apellidos if paciente else "Paciente"
            ia_txt = "Positivo" if diagnostico.enfermo else "Negativo"
            mensaje = (
                f"Caso prioritario: {nombre} — Prioridad {prio} "
                f"(CRB-65 {atencion.crb65_gravedad} + IA {ia_txt})"
            )
            NotificacionService(self.repo.db).asegurar_para_diagnostico(
                diagnostico.id, diagnostico.prioridad_final, mensaje
            )

        return diagnostico

    def get_por_atencion(self, atencion_medica_id: int) -> Diagnostico:
        diag = self.repo.get_por_atencion(atencion_medica_id)
        if not diag:
            raise HTTPException(
                status_code=404, detail="Diagnóstico no encontrado")
        return diag

    def validar_diagnostico(self, diagnostico_id: int, payload, current_user) -> Diagnostico:
        from datetime import datetime
        from sqlalchemy.orm import Session
        from app.modules.atenciones.models import AtencionMedica

        # HU-04: validar el diagnóstico requiere el permiso `diagnostico.validar`
        # (base del rol: Especialista). La ruta ya lo exige, pero se repite
        # aquí para que el service no quede abierto a un uso interno.
        from app.core.permisos import resolver_permisos

        if "diagnostico.validar" not in resolver_permisos(self.repo.db, current_user):
            raise HTTPException(
                status_code=403,
                detail="No tiene el permiso para validar diagnósticos",
            )

        diag = self.repo.db.query(Diagnostico).filter(
            Diagnostico.id == diagnostico_id).first()
        if not diag:
            raise HTTPException(
                status_code=404, detail="Diagnóstico no encontrado")

        if diag.estado_validacion == EstadoClinico.Validado:
            raise HTTPException(
                status_code=400, detail="Este diagnóstico ya fue validado")

        atencion = self.repo.db.query(AtencionMedica).filter_by(
            id=diag.atencion_medica_id).with_for_update().first()
        from app.modules.atenciones.estado import exigir_atencion_abierta
        if not atencion:
            raise HTTPException(status_code=404, detail="Atención no encontrada")
        exigir_atencion_abierta(self.repo.db, atencion)
        self.repo.db.refresh(diag)
        if diag.estado_validacion != EstadoClinico.PendienteDeValidacion:
            raise HTTPException(status_code=400, detail="El diagnóstico no está pendiente de validación")

        # Reglas Clínicas
        diag.clasificacion_medico = payload.clasificacion_medico
        diag.diagnostico_descripcion = payload.diagnostico_descripcion

        if payload.clasificacion_medico == "Neumonía":
            diag.diagnostico_final_medico = True
        else:
            diag.diagnostico_final_medico = False

        if diag.diagnostico_final_medico == diag.enfermo:
            diag.concordancia_ia = "Confirmado"
        else:
            diag.concordancia_ia = "Corregido"

        diag.estado_validacion = EstadoClinico.Validado
        diag.validado_por_id = current_user.id
        diag.fecha_validacion = datetime.now()

        # Actualizar atención médica y paciente
        atencion = self.repo.db.query(AtencionMedica).filter(
            AtencionMedica.id == diag.atencion_medica_id).first()
        if atencion:
            atencion.estado = "Finalizada"
            paciente = self.paciente_repo.get_paciente_por_id(
                atencion.paciente_id)
            if paciente:
                paciente.en_atencion = False

        # Transaccionalidad
        try:
            self.repo.db.commit()
            self.repo.db.refresh(diag)
        except Exception as e:
            self.repo.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

        # Cierre automático del aviso persistente (no interrumpe la validación).
        from app.modules.notificaciones.service import NotificacionService
        NotificacionService(self.repo.db).cerrar_por_validacion(diag.id)

        return diag

    def get_prioridades_pendientes(self):
        # Casos prioritarios: prioridad Alta/Crítica + diagnóstico pendiente de validación.
        # Orden: prioridad (Crítica primero), luego crb65_puntaje (mayor primero),
        # luego edad (mayor primero). Sin fecha de creación en diagnosticos:
        # se expone updated_at como referencia temporal.
        from datetime import date
        from sqlalchemy import func
        from app.modules.atenciones.models import AtencionMedica
        from app.modules.pacientes.models import Paciente

        pendientes = Diagnostico.estado_validacion == EstadoClinico.PendienteDeValidacion

        # Conteo agrupado
        conteos_brutos = self.repo.db.query(
            Diagnostico.prioridad_final, func.count(Diagnostico.id)
        ).filter(
            pendientes,
            Diagnostico.prioridad_final.isnot(None)
        ).group_by(Diagnostico.prioridad_final).all()

        conteo_dict = {p.value: 0 for p in NivelGravedad}
        for prioridad, cantidad in conteos_brutos:
            # SQLAlchemy Enum might return the python Enum object or the string depending on how it's queried.
            val = prioridad.value if isinstance(
                prioridad, enum.Enum) else prioridad
            if val in conteo_dict:
                conteo_dict[val] = cantidad

        # Lista Alta y Crítica
        casos = self.repo.db.query(Diagnostico, AtencionMedica, Paciente)\
            .join(AtencionMedica, Diagnostico.atencion_medica_id == AtencionMedica.id)\
            .join(Paciente, AtencionMedica.paciente_id == Paciente.id)\
            .filter(
                pendientes,
                Diagnostico.prioridad_final.in_(
                    [NivelGravedad.Alta, NivelGravedad.Critica])
        ).all()

        def edad_en_anos(fecha_nac):
            if not fecha_nac:
                return None
            hoy = date.today()
            return hoy.year - fecha_nac.year - (
                (hoy.month, hoy.day) < (fecha_nac.month, fecha_nac.day)
            )

        lista_casos = []
        for diag, aten, pac in casos:
            val = diag.prioridad_final.value if isinstance(
                diag.prioridad_final, enum.Enum) else diag.prioridad_final
            lista_casos.append({
                "diagnostico_id": diag.id,
                "atencion_medica_id": diag.atencion_medica_id,
                "paciente_nombre": pac.nombres_apellidos,
                "prioridad_final": val,
                "crb65_puntaje": aten.crb65_puntaje,
                "edad": edad_en_anos(pac.fecha_nacimiento),
                "created_at": diag.updated_at.isoformat() if diag.updated_at else None,
            })

        # Orden: prioridad (Crítica primero), crb65_puntaje desc, edad desc.
        # None siempre al final de su criterio.
        rango = {"Crítica": 0, "Alta": 1}
        lista_casos.sort(key=lambda x: (
            rango.get(x["prioridad_final"], 2),
            -(x["crb65_puntaje"]) if x["crb65_puntaje"] is not None else float("inf"),
            -(x["edad"]) if x["edad"] is not None else float("inf"),
        ))

        return {
            "conteos": conteo_dict,
            "casos": lista_casos
        }
