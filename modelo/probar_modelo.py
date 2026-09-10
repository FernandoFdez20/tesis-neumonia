# probar_modelo.py — Prueba el modelo entrenado con 1 radiografía DICOM.
#
# Uso:
#   python modelo/probar_modelo.py --dicom RUTA_AL_ARCHIVO.dcm
#   python modelo/probar_modelo.py --dicom RUTA.dcm --modelo OTRO.pth --umbral 0.6
#
# Hace exactamente lo mismo que el entrenamiento (model-v1.ipynb), pero con 1 imagen:
#   DICOM -> gris 0-255 -> 224x224 -> RGB -> normalizado ImageNet (TODO EN MEMORIA,
#   no se guarda ningún .npy) -> DenseNet121 -> probabilidad 0-1 -> etiqueta con umbral.
#
# La arquitectura debe ser idéntica a la entrenada (Bloque 2.1 del notebook):
#   densenet121 + última capa reemplazada por 1 neurona (nn.Linear).

import argparse
import time
from pathlib import Path

import numpy as np
from PIL import Image

# Media y desviación de ImageNet (las mismas del entrenamiento, Bloque 0.5).
MEDIA_IMAGENET = np.array([0.485, 0.456, 0.406], dtype=np.float32)
DESV_IMAGENET = np.array([0.229, 0.224, 0.225], dtype=np.float32)

UMBRAL_DEFECTO = 0.5  # igual que en el entrenamiento (Bloque 0.4 del notebook)
MODELO_DEFECTO = Path(__file__).resolve().parent / "modelos" / "densenet121_v1_best.pth"


# ---------------------------------------------------------------------------
# Fase 2 del entrenamiento, copiada tal cual (Bloque 0.5 de model-v1.ipynb)
# ---------------------------------------------------------------------------
def leer_dicom_como_gris(ruta_dicom):
    """Paso 1: lee un .dcm y devuelve array uint8 de 0-255 en escala de grises."""
    import pydicom
    ds = pydicom.dcmread(str(ruta_dicom))
    img = ds.pixel_array
    if str(ds.get("PhotometricInterpretation", "")) == "MONOCHROME1":
        img = 255 - img  # fondo negro -> fondo blanco (estándar radiológico)
    img = img.astype(np.float32)
    if img.max() > 255:  # por si algún DICOM trae 16 bits
        img = img / img.max() * 255.0
    return np.clip(img, 0, 255).astype(np.uint8), ds


def redimensionar(imagen_gris, tamano=224):
    """Paso 2: achica la imagen al tamaño que pide DenseNet121 (224x224)."""
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
# Modelo: misma arquitectura del entrenamiento, pesos del .pth, solo CPU
# ---------------------------------------------------------------------------
def cargar_modelo(ruta_pth):
    """Reconstruye DenseNet121+1 neurona y carga los pesos entrenados."""
    import torch
    from torchvision import models

    modelo = models.densenet121(weights=None)  # sin descargar nada de internet
    n_entradas = modelo.classifier.in_features
    modelo.classifier = torch.nn.Linear(n_entradas, 1)  # igual que Bloque 2.1
    estado = torch.load(str(ruta_pth), map_location=torch.device("cpu"))
    modelo.load_state_dict(estado)
    modelo.eval()  # modo evaluación: no aprende, solo predice
    return modelo


def predecir(modelo, arr):
    """Pasa el array por el modelo. Devuelve probabilidad 0-1 (neumonía)."""
    import torch
    tensor = torch.from_numpy(arr).unsqueeze(0)  # (3,224,224) -> lote de 1
    with torch.no_grad():  # sin corregir nada, solo medir (más rápido)
        salida = modelo(tensor).squeeze(1)
        prob = torch.sigmoid(salida).item()  # número libre -> probabilidad 0-1
    return prob


def etiqueta_de(prob, umbral):
    """Convierte probabilidad en etiqueta con el umbral (igual que en test)."""
    return int(prob >= umbral)


def main():
    parser = argparse.ArgumentParser(description="Prueba DenseNet121 con 1 DICOM.")
    parser.add_argument("--dicom", required=True, help="Ruta al archivo .dcm")
    parser.add_argument("--modelo", default=str(MODELO_DEFECTO), help="Ruta al .pth")
    parser.add_argument("--umbral", type=float, default=UMBRAL_DEFECTO,
                        help="Probabilidad >= umbral se cuenta como neumonía (defecto 0.5)")
    args = parser.parse_args()

    ruta_dcm = Path(args.dicom)
    ruta_pth = Path(args.modelo)
    assert ruta_dcm.exists(), f"No existe el DICOM: {ruta_dcm}"
    assert ruta_pth.exists(), f"No existe el modelo: {ruta_pth}"

    t0 = time.time()
    arr, ds = preprocesar_imagen(ruta_dcm)
    t_pre = time.time() - t0

    modelo = cargar_modelo(ruta_pth)
    t1 = time.time()
    prob = predecir(modelo, arr)
    t_inf = time.time() - t1

    et = etiqueta_de(prob, args.umbral)
    confianza = prob if et == 1 else 1.0 - prob  # qué tan seguro está de su respuesta

    edad = str(ds.get("PatientAge", "desconocida")).strip() or "desconocida"
    sexo = str(ds.get("PatientSex", "desconocido")).strip() or "desconocido"
    vista = str(ds.get("ViewPosition", "desconocida")).strip() or "desconocida"

    print("=" * 70)
    print("RESULTADO DEL MODELO (DenseNet121 v1, solo CPU)")
    print("=" * 70)
    print(f"Imagen : {ruta_dcm.name}  (edad={edad} sexo={sexo} vista={vista})")
    print(f"Modelo : {ruta_pth.name}")
    print("-" * 70)
    print(f"Probabilidad de neumonía : {prob:.4f}  ({prob:.2%})")
    print(f"Umbral                   : {args.umbral}")
    print(f"Etiqueta                 : {et}  ({'CON neumonía' if et == 1 else 'SIN neumonía'})")
    print(f"Confianza en su respuesta: {confianza:.2%}")
    print(f"Tiempo preproceso        : {t_pre:.2f} s  |  inferencia: {t_inf:.2f} s")
    print("-" * 70)
    print("ADVERTENCIA: diagnóstico PRESUNTIVO de apoyo, no reemplaza al médico.")
    print("=" * 70)


if __name__ == "__main__":
    main()
