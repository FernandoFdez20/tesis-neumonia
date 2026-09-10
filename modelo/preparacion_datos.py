# preparacion_datos.py — Preparación de datos RSNA Pneumonia Detection Challenge
# Fase CRISP-DM: Preparación de los Datos
# Fuente oficial: https://www.kaggle.com/competitions/rsna-pneumonia-detection-challenge/data
#
# Script secuencial por bloques (corre de arriba a abajo, sin main).
# Solo usa: pandas + numpy + pydicom + PIL (corre en tu PC y en Colab/Kaggle).
# No requiere torch ni sklearn: el split estratificado se hace con numpy.
#
# Salidas (en esta misma carpeta modelo/):
#   dataset_filtrado.csv   -> 1 fila por imagen tras Fase 1 (lista maestra)
#   splits/train.csv       -> 70% para entrenar
#   splits/val.csv         -> 15% para validar
#   splits/test.csv        -> 15% para probar (se toca solo al final)

import numpy as np
import pandas as pd
from pathlib import Path
from PIL import Image

# ---------------------------------------------------------------------------
# Rutas y parámetros (lo único que cambia entre tu PC y Colab)
# ---------------------------------------------------------------------------
CARPETA_MODELO = Path(__file__).resolve().parent
CARPETA_DATASET = Path(
    r"C:\Users\Fernando\Downloads\rsna-pneumonia-detection-challenge")
CSV_TRAIN_LABELS = CARPETA_DATASET / "stage_2_train_labels.csv"
CSV_CLASS_INFO = CARPETA_DATASET / "stage_2_detailed_class_info.csv"
CARPETA_IMAGENES_TRAIN = CARPETA_DATASET / "stage_2_train_images"
# generado por exploracion.py (bloque #8)
CSV_HEADERS = CARPETA_MODELO / "dicom_headers.csv"

CSV_FILTRADO = CARPETA_MODELO / "dataset_filtrado.csv"
CARPETA_SPLITS = CARPETA_MODELO / "splits"

EDAD_MINIMA = 18    # criterio de inclusión: solo adultos
EDAD_MAXIMA = 100   # mayor a 100 se considera error de registro (atípico)
SEMILLA = 42        # para que el split sea repetible

# Media y desviación de ImageNet (las que espera DenseNet121 preentrenado)
MEDIA_IMAGENET = np.array([0.485, 0.456, 0.406], dtype=np.float32)
DESV_IMAGENET = np.array([0.229, 0.224, 0.225], dtype=np.float32)


# %%
# ===========================================================================
# BLOQUE 1 — FASE 1: FILTRADO (selección de registros)
# ===========================================================================
print("=" * 70)
print("FASE 1 — FILTRADO (selección de registros)")
print("=" * 70)

# 1.1 Cargar los dos CSV originales
df_train_labels = pd.read_csv(CSV_TRAIN_LABELS)
df_class_info = pd.read_csv(CSV_CLASS_INFO)
print(f"\n#1. Filas leídas: train_labels={len(df_train_labels):,} | "
      f"class_info={len(df_class_info):,}")

# 1.2 Deduplicar: 1 fila por imagen.
# Si la imagen tiene al menos una marca de neumonía -> Target=1
df_target = df_train_labels.groupby(
    "patientId", as_index=False)["Target"].max()
df_clase = df_class_info.drop_duplicates("patientId")
print(f"#2. Imágenes únicas tras deduplicar: {len(df_target):,}")

# 1.3 Cruzar ambos CSV por patientId (deben calzar 1 a 1, sin pérdidas)
df = df_target.merge(df_clase, on="patientId", how="inner")
assert len(df) == len(
    df_target), "Al cruzar se perdieron imágenes, revisar"
print(
    f"#3. Cruce por patientId OK: {len(df):,} imágenes (no se perdió ninguna)")

# 1.4 Validar coherencia: Target=1 debe ser class=Lung Opacity y viceversa.
# Chequeo de seguridad: si algún registro no concuerda, los CSV no calzan
# y el script se detiene antes de seguir filtrando con datos mezclados.
incoherentes = df[((df["Target"] == 1) != (df["class"] == "Lung Opacity"))]
print(f"#4. Registros incoherentes Target vs class: {len(incoherentes):,}")
assert len(incoherentes) == 0, "Hay incoherencias entre Target y class"

# 1.5 Selección de clases: solo Lung Opacity + Normal.
# Se excluye No Lung Opacity/Not Normal (otra patología, no sirve al binario).
df = df[df["class"].isin(["Lung Opacity", "Normal"])].copy()
df["etiqueta"] = (df["class"] == "Lung Opacity").astype(int)  # 1=sí, 0=no
print("#5. Solo Lung Opacity + Normal (se excluye No Lung Opacity/Not Normal):")
for clase, conteo in df["class"].value_counts().items():
    print(f"   - {clase}: {conteo:,}")

# 1.6 Filtro de edad: solo adultos 18-100 (criterio de inclusión de la tesis).
# Fuera pediátricos (<18), atípicos (>100, error de registro) y sin edad.
df_headers = pd.read_csv(CSV_HEADERS)[
    ["patientId", "edad", "sexo", "vista"]]
df = df.merge(df_headers, on="patientId", how="left")
antes_edad = len(df)
df = df[df["edad"].notna() & (df["edad"] >= EDAD_MINIMA) &
        (df["edad"] <= EDAD_MAXIMA)].copy()
print(f"#6. Filtro edad {EDAD_MINIMA}-{EDAD_MAXIMA} años: {antes_edad:,} -> {len(df):,} "
      f"(fuera {antes_edad - len(df):,} pediátricos/atípicos/sin edad)")

# 1.7 Verificación final: ni un patientId duplicado tras todo el filtro
n_dup = int(df["patientId"].duplicated().sum())
print(f"#7. Duplicados tras el filtro: {n_dup:,}")
assert n_dup == 0, "Quedaron patientId duplicados"

# 1.8 Guardar: ruta del DICOM + dataset filtrado a CSV (lista maestra)
df["ruta_dicom"] = df["patientId"].apply(
    lambda pid: str(CARPETA_IMAGENES_TRAIN / f"{pid}.dcm"))
df_filtrado = df[["patientId", "etiqueta", "class",
                  "edad", "sexo", "vista", "ruta_dicom"]]
df_filtrado.to_csv(CSV_FILTRADO, index=False)
print(f"\nGuardado: {CSV_FILTRADO} ({len(df_filtrado):,} filas)")
print("Distribución final:")
for et, conteo in df_filtrado["etiqueta"].value_counts().items():
    nombre = "con neumonía (1)" if et == 1 else "sin neumonía (0)"
    print(f"   - {nombre}: {conteo:,} ({conteo / len(df_filtrado):.2%})")


# %%
# ===========================================================================
# BLOQUE 2 — FASE 2: TRANSFORMACIÓN (4 funciones + demo)
# Una radiografía DICOM (gris, 1024x1024) -> array RGB 3x224x224 normalizado.
# Gris->RGB porque DenseNet121 preentrenado espera 3 canales (ImageNet).
# ===========================================================================
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
    return np.clip(img, 0, 255).astype(np.uint8)


def redimensionar(imagen_gris, tamano=224):
    """Paso 2: achica la imagen al tamaño que pide DenseNet121 (224x224)."""
    return np.array(Image.fromarray(imagen_gris).resize((tamano, tamano), Image.BILINEAR))


def gris_a_rgb(imagen_gris):
    """Paso 3: copia el gris en 3 canales RGB (0-1) para que encaje en DenseNet121."""
    rgb = np.stack([imagen_gris, imagen_gris, imagen_gris], axis=0)
    return rgb.astype(np.float32) / 255.0


def normalizar_imagenet(imagen_rgb):
    """Paso 4: ajusta los valores con media/desviación de ImageNet."""
    return (imagen_rgb - MEDIA_IMAGENET[:, None, None]) / DESV_IMAGENET[:, None, None]


def preprocesar_imagen(ruta_dicom, tamano=224):
    """Aplica los 4 pasos en orden: DICOM -> array (3, tamano, tamano) normalizado."""
    gris = leer_dicom_como_gris(ruta_dicom)
    gris_224 = redimensionar(gris, tamano)
    rgb = gris_a_rgb(gris_224)
    return normalizar_imagenet(rgb)


# Demo con 2 imágenes de muestra (1 con neumonía, 1 sin). No modifica nada en disco.
print("\n" + "=" * 70)
print("FASE 2 — TRANSFORMACIÓN (demo con 2 imágenes de muestra)")
print("=" * 70)
for etiqueta in [1, 0]:
    pid = df_filtrado[df_filtrado["etiqueta"] == etiqueta].iloc[0]["patientId"]
    arr = preprocesar_imagen(CARPETA_IMAGENES_TRAIN / f"{pid}.dcm")
    print(f"   - etiqueta={etiqueta}: forma={arr.shape} dtype={arr.dtype} "
          f"min={arr.min():.2f} max={arr.max():.2f} media={arr.mean():.2f}")
print("   (forma esperada: (3, 224, 224) lista para DenseNet121)")


# %%
# ===========================================================================
# BLOQUE 3 — FASE 3: PARTICIONAMIENTO (split estratificado 70/15/15)
# Estratificado = cada split conserva el mismo % de neumonía que el total.
# No requiere sklearn: el reparto se hace con numpy (semilla fija = repetible).
# ===========================================================================
def split_estratificado(indices_por_clase, proporciones=(0.70, 0.15, 0.15), semilla=SEMILLA):
    """Reparte índices por clase según proporciones. Devuelve 3 listas de índices."""
    rng = np.random.default_rng(semilla)
    partes = [[] for _ in proporciones]
    for _, idx in indices_por_clase:
        idx = np.array(idx)
        rng.shuffle(idx)
        n = len(idx)
        cortes = [int(n * proporciones[0]),
                  int(n * (proporciones[0] + proporciones[1]))]
        partes[0].extend(idx[:cortes[0]])
        partes[1].extend(idx[cortes[0]:cortes[1]])
        partes[2].extend(idx[cortes[1]:])
    return partes


print("\n" + "=" * 70)
print("FASE 3 — PARTICIONAMIENTO (split estratificado 70/15/15)")
print("=" * 70)
CARPETA_SPLITS.mkdir(exist_ok=True)
grupos = [(et, g.index.tolist()) for et, g in df_filtrado.groupby("etiqueta")]
idx_train, idx_val, idx_test = split_estratificado(grupos)
splits = {"train.csv": idx_train, "val.csv": idx_val, "test.csv": idx_test}
for nombre, idx in splits.items():
    sub = df_filtrado.loc[sorted(idx)]
    sub.to_csv(CARPETA_SPLITS / nombre, index=False)
    pct_pos = (sub["etiqueta"] == 1).mean()
    print(f"   - {nombre}: {len(sub):,} filas | neumonía={pct_pos:.2%}")
print(f"\nGuardados en: {CARPETA_SPLITS}")
print("Regla: el test/ solo se usa al final para reportar resultados.")


# %%
# ===========================================================================
# BLOQUE 4 — EXPORTACIÓN (opcional, DESACTIVADO)
# Aplica las 4 funciones a TODO el dataset y guarda los arrays ya listos
# en modelo/dataset_filtrado/train|val|test/ como archivos .npy (~8 GB).
# Para activarlo: selecciona este bloque y quita el triple comillado.
# ===========================================================================
"""
CARPETA_SALIDA = CARPETA_MODELO / "dataset_filtrado"
for split in ["train", "val", "test"]:
    df_split = pd.read_csv(CARPETA_SPLITS / f"{split}.csv")
    carpeta_split = CARPETA_SALIDA / split
    carpeta_split.mkdir(parents=True, exist_ok=True)
    print(f"   - Procesando {split}: {len(df_split):,} imágenes...")
    for i, fila in df_split.iterrows():
        arr = preprocesar_imagen(
            CARPETA_IMAGENES_TRAIN / f"{fila['patientId']}.dcm")
        np.save(carpeta_split / f"{fila['patientId']}.npy", arr)
        if (i + 1) % 1000 == 0:
            print(f"     ...{i + 1:,}/{len(df_split):,}")
    print(f"   - {split} OK: {len(df_split):,} archivos en {carpeta_split}")
print("EXPORTACIÓN COMPLETA")
"""


print("\n" + "=" * 70)
print("PREPARACIÓN COMPLETA")
print("=" * 70)
