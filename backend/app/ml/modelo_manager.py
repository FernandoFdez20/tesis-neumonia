"""
modelo_manager.py — Singleton que carga el modelo UNA sola vez al iniciar
FastAPI y lo mantiene en memoria para todas las requests.

Uso desde cualquier módulo:
    from app.ml.modelo_manager import get_modelo
    modelo = get_modelo()
"""
from pathlib import Path
from typing import Optional
import logging

from app.ml.inferencia import cargar_modelo

logger = logging.getLogger(__name__)

# Ruta al .pth relativa a la raíz del proyecto
# backend/app/ml/modelo_manager.py → parents[3] = raíz tesis-neumonia/
RUTA_PTH = (
    Path(__file__).resolve().parents[3]
    / "modelo" / "modelos" / "densenet121_v1_best.pth"
)

_modelo = None   # instancia única (singleton)


def inicializar_modelo():
    """Llamar UNA vez al arrancar FastAPI (en lifespan)."""
    global _modelo
    if not RUTA_PTH.exists():
        logger.error(f"Modelo no encontrado en: {RUTA_PTH}")
        return
    logger.info(f"Cargando modelo desde {RUTA_PTH} ...")
    _modelo = cargar_modelo(RUTA_PTH)
    logger.info("Modelo cargado y listo.")


def get_modelo():
    """Retorna el modelo ya cargado. Lanza error si no fue inicializado."""
    if _modelo is None:
        raise RuntimeError(
            "El modelo no está cargado. "
            "Asegúrate de llamar inicializar_modelo() al arrancar la app."
        )
    return _modelo
