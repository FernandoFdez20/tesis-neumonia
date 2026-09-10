"""
inferencia.py — Pipeline de preproceso e inferencia para DenseNet121.

Las funciones son idénticas a modelo/probar_modelo.py (Bloque 0.5 del notebook
de entrenamiento). NO modificar sin actualizar también el script de prueba.
"""
import numpy as np
from pathlib import Path

# Media y desviación de ImageNet (las mismas del entrenamiento, Bloque 0.5).
MEDIA_IMAGENET = np.array([0.485, 0.456, 0.406], dtype=np.float32)
DESV_IMAGENET  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

UMBRAL_DEFECTO = 0.5


# ---------------------------------------------------------------------------
# Preproceso — copiado literal de probar_modelo.py
# ---------------------------------------------------------------------------

def leer_dicom_como_gris(ruta_dicom):
    """Paso 1: lee un .dcm y devuelve array uint8 de 0-255 en escala de grises."""
    import pydicom
    ds = pydicom.dcmread(str(ruta_dicom))
    img = ds.pixel_array
    if str(ds.get("PhotometricInterpretation", "")) == "MONOCHROME1":
        img = 255 - img  # fondo negro -> fondo blanco (estándar radiológico)
    img = img.astype(np.float32)
    if img.max() > 255:          # por si algún DICOM trae 16 bits
        img = img / img.max() * 255.0
    return np.clip(img, 0, 255).astype(np.uint8), ds


def redimensionar(imagen_gris, tamano=224):
    """Paso 2: achica la imagen al tamaño que pide DenseNet121 (224x224)."""
    from PIL import Image
    return np.array(Image.fromarray(imagen_gris).resize((tamano, tamano), Image.BILINEAR))


def gris_a_rgb(imagen_gris):
    """Paso 3: copia el gris en 3 canales RGB (0-1)."""
    rgb = np.stack([imagen_gris, imagen_gris, imagen_gris], axis=0)
    return rgb.astype(np.float32) / 255.0


def normalizar_imagenet(imagen_rgb):
    """Paso 4: ajusta los valores con media/desviación de ImageNet."""
    return (imagen_rgb - MEDIA_IMAGENET[:, None, None]) / DESV_IMAGENET[:, None, None]


def preprocesar_imagen(ruta_dicom):
    """Aplica los 4 pasos en orden. Devuelve (array (3,224,224), header DICOM)."""
    gris, ds = leer_dicom_como_gris(ruta_dicom)
    return normalizar_imagenet(gris_a_rgb(redimensionar(gris))), ds


# ---------------------------------------------------------------------------
# Inferencia
# ---------------------------------------------------------------------------

def predecir(modelo, arr):
    """Pasa el array por el modelo. Devuelve probabilidad 0-1 (neumonía)."""
    import torch
    tensor = torch.from_numpy(arr).unsqueeze(0)   # (3,224,224) -> lote de 1
    with torch.no_grad():
        salida = modelo(tensor).squeeze(1)
        prob   = torch.sigmoid(salida).item()      # número libre -> 0-1
    return prob


def etiqueta_de(prob, umbral=UMBRAL_DEFECTO):
    """Convierte probabilidad en etiqueta 0/1 con el umbral."""
    return int(prob >= umbral)


def cargar_modelo(ruta_pth: Path):
    """Reconstruye DenseNet121+1 neurona y carga los pesos entrenados."""
    import torch
    from torchvision import models

    modelo = models.densenet121(weights=None)
    n_entradas = modelo.classifier.in_features
    modelo.classifier = torch.nn.Linear(n_entradas, 1)
    estado = torch.load(str(ruta_pth), map_location=torch.device("cpu"))
    modelo.load_state_dict(estado)
    modelo.eval()
    return modelo
