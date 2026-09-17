"""
vista_previa.py — Genera el PNG de visualización junto a cada DICOM subido.

Reutiliza leer_dicom_como_gris() de inferencia.py (misma lectura validada
que usa el modelo), pero a resolución completa y sin normalizar: el PNG es
solo para mostrar la radiografía en la interfaz, no para inferencia.
"""
from pathlib import Path

from app.ml.inferencia import leer_dicom_como_gris


def generar_vista_png(ruta_dcm: Path) -> Path:
    """Lee un .dcm y guarda un .png junto al original. Devuelve la ruta del PNG."""
    from PIL import Image

    gris, _ = leer_dicom_como_gris(ruta_dcm)
    destino = ruta_dcm.with_suffix(".png")
    Image.fromarray(gris).save(str(destino))
    return destino


def es_dicom(nombre_archivo: str) -> bool:
    """True si el archivo es DICOM por extensión."""
    return nombre_archivo.lower().endswith(".dcm")


def url_vista_png(imagen_url: str) -> str | None:
    """
    Convención compartida con el frontend:
    /uploads/.../abc.dcm -> /uploads/.../abc.png. None si no es DICOM.
    """
    if not es_dicom(imagen_url):
        return None
    return imagen_url[:-4] + ".png"


def vista_png_desde_bytes(datos: bytes) -> bytes:
    """
    Convierte un DICOM en memoria a PNG sin guardarlo en uploads.
    Usa un archivo temporal transitorio que siempre se elimina.
    Para previsualizar antes de "Iniciar análisis".
    """
    import tempfile

    with tempfile.TemporaryDirectory(prefix="vista_dcm_") as tmp:
        ruta_tmp = Path(tmp) / "vista.dcm"
        ruta_tmp.write_bytes(datos)
        ruta_png = generar_vista_png(ruta_tmp)
        return ruta_png.read_bytes()
