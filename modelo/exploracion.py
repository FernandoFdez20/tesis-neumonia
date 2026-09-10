# exploracion.py — Exploración inicial del dataset RSNA Pneumonia Detection Challenge
# Fase CRISP-DM: Comprensión de los Datos
# Fuente oficial: https://www.kaggle.com/competitions/rsna-pneumonia-detection-challenge/data

import pandas as pd
from pathlib import Path

# ---------------------------------------------------------------------------
# 0. Ruta del dataset descargado de Kaggle (página oficial del challenge)
# ---------------------------------------------------------------------------
CARPETA_DATASET = Path(
    r"C:\Users\Fernando\Downloads\rsna-pneumonia-detection-challenge")
CSV_TRAIN_LABELS = CARPETA_DATASET / "stage_2_train_labels.csv"
CSV_CLASS_INFO = CARPETA_DATASET / "stage_2_detailed_class_info.csv"
CARPETA_IMAGENES_TRAIN = CARPETA_DATASET / "stage_2_train_images"
CARPETA_IMAGENES_TEST = CARPETA_DATASET / "stage_2_test_images"

# ---------------------------------------------------------------------------
# Carga de los dos archivos CSV
# ---------------------------------------------------------------------------
# Etiqueta binaria (Target 0/1) + ubicación
df_train_labels = pd.read_csv(CSV_TRAIN_LABELS)
df_class_info = pd.read_csv(CSV_CLASS_INFO)  # Detalle clínico (3 clases)

# Archivos de imagen DICOM en disco
archivos_dicom_train = list(
    CARPETA_IMAGENES_TRAIN.glob("*.dcm"))  # Con etiqueta
archivos_dicom_test = list(CARPETA_IMAGENES_TEST.glob(
    "*.dcm"))  # Sin etiqueta (reto original)

print("=" * 70)
print("EXPLORACIÓN DEL DATASET RSNA PNEUMONIA DETECTION CHALLENGE")
print("=" * 70)

# ---------------------------------------------------------------------------
# 1. Total de registros (filas) en cada CSV
# ---------------------------------------------------------------------------
print("\n#1. Total de registros por archivo CSV:")
print(f"   - stage_2_train_labels.csv      : {len(df_train_labels):,} filas")
print(f"   - stage_2_detailed_class_info.csv: {len(df_class_info):,} filas")

# ---------------------------------------------------------------------------
# 2. Radiografías únicas (cada patientId = una persona / un archivo .dcm)
# ---------------------------------------------------------------------------
n_imagenes_unicas = df_train_labels["patientId"].nunique()
print("\n#2. Radiografías únicas (patientId distintos):")
print(f"   - Total: {n_imagenes_unicas:,}")
print("   - Nota: hay más filas que imágenes porque una radiografía con")
print("     neumonía en 2 lugares ocupa 2 filas (una por cada marca).")

# ---------------------------------------------------------------------------
# 3. Imágenes DICOM físicas en disco
# ---------------------------------------------------------------------------
print("\n#3. Archivos DICOM en disco:")
print(f"   - Train (con etiqueta): {len(archivos_dicom_train):,}")
print(f"   - Test  (sin etiqueta): {len(archivos_dicom_test):,}")
print(f"   - Total: {len(archivos_dicom_train) + len(archivos_dicom_test):,}")

# ---------------------------------------------------------------------------
# 4. Distribución binaria: ¿cuántas tienen neumonía y cuántas no?
#    (Se agrupa por imagen: si tiene al menos una marca, es positiva)
# ---------------------------------------------------------------------------
target_por_imagen = df_train_labels.groupby("patientId")["Target"].max()
n_positivas = int((target_por_imagen == 1).sum())
n_negativas = int((target_por_imagen == 0).sum())
print("\n#4. Clasificación binaria por imagen (Target: 1 = sí / 0 = no):")
print(
    f"   - Con neumonía (1)   : {n_positivas:,} ({n_positivas / n_imagenes_unicas:.1%})")
print(
    f"   - Sin neumonía (0)   : {n_negativas:,} ({n_negativas / n_imagenes_unicas:.1%})")

# ---------------------------------------------------------------------------
# 5. Detalle clínico por imagen (sin contar filas repetidas)
# ---------------------------------------------------------------------------
clase_por_imagen = df_class_info.drop_duplicates("patientId")["class"]
print("\n#5. Detalle clínico por imagen (class):")
total_clase = len(clase_por_imagen)
for clase, conteo in clase_por_imagen.value_counts().items():
    print(f"   - {clase}: {conteo:,} ({conteo / total_clase:.2%})")
print("   - Nota: Target=0 agrupa 'Normal' + 'No Lung Opacity / Not Normal'.")

# ---------------------------------------------------------------------------
# 6. Imágenes repetidas (con neumonía en más de un lugar)
# ---------------------------------------------------------------------------
conteo_por_imagen = df_train_labels["patientId"].value_counts()
n_repetidas = int((conteo_por_imagen > 1).sum())
print("\n#6. Imágenes con más de una fila (neumonía en varios lugares):")
print(f"   - Total: {n_repetidas:,}")
print(
    f"   - Máximo de filas en una misma imagen: {int(conteo_por_imagen.max())}")

# ---------------------------------------------------------------------------
# 7. Ejemplo de cómo se ve el identificador patientId
# ---------------------------------------------------------------------------
ejemplo_id = df_train_labels["patientId"].iloc[0]
print("\n#7. Ejemplo de identificador patientId:")
print(f"   - En CSV train_labels : {ejemplo_id}")
print(f"   - En CSV class_info   : {df_class_info['patientId'].iloc[0]}")
print(f"   - Como archivo DICOM  : {ejemplo_id}.dcm")
print(
    f"   - Existe en disco     : {(CARPETA_IMAGENES_TRAIN / f'{ejemplo_id}.dcm').exists()}")

# ---------------------------------------------------------------------------
# 8. Datos del header DICOM: edad, sexo, vista (AP/PA) y resolución
#    Cada .dcm trae un header con los datos del paciente. Se lee una sola
#    vez y se guarda en modelo/dicom_headers.csv (caché) para no re-leer
#    los 26,684 archivos en cada ejecución. Requiere: pip install pydicom
# ---------------------------------------------------------------------------
print("\n#8. Datos demográficos del header DICOM (edad, sexo, vista):")

try:
    import pydicom
    TIENE_PYDICOM = True
except ImportError:
    TIENE_PYDICOM = False
    print("   - Falta pydicom: instala con 'pip install pydicom' y re-ejecuta.")

if TIENE_PYDICOM:
    CSV_HEADERS = Path(__file__).resolve().parent / "dicom_headers.csv"
    # Columnas que debe tener el caché. Si el caché es antiguo y le falta
    # alguna (p. ej. filas/columnas), se regenera solo automáticamente.
    COLUMNAS_CACHE = {"patientId", "edad", "sexo", "vista", "filas", "columnas"}
    df_headers = None
    if CSV_HEADERS.exists():
        df_tmp = pd.read_csv(CSV_HEADERS)
        if COLUMNAS_CACHE.issubset(df_tmp.columns):
            df_headers = df_tmp
            print("   - (headers cargados desde caché dicom_headers.csv)")
        else:
            print("   - (caché antigua incompleta: se regenera, tarda unos minutos...)")
    if df_headers is None:
        print("   - Leyendo headers de los DICOMs (tarda unos minutos, solo la primera vez)...")
        filas_header = []
        for dcm in sorted(CARPETA_IMAGENES_TRAIN.glob("*.dcm")):
            ds = pydicom.dcmread(str(dcm), stop_before_pixels=True)
            edad_txt = str(ds.get("PatientAge", "")).strip()
            digitos = "".join(ch for ch in edad_txt if ch.isdigit())
            filas_header.append({
                "patientId": dcm.stem,
                "edad": int(digitos) if digitos else None,
                "sexo": str(ds.get("PatientSex", "")).strip() or "VACIO",
                "vista": str(ds.get("ViewPosition", "")).strip() or "VACIO",
                "filas": int(ds.get("Rows", 0)),        # alto de la imagen en píxeles
                "columnas": int(ds.get("Columns", 0)),  # ancho de la imagen en píxeles
            })
        df_headers = pd.DataFrame(filas_header)
        df_headers.to_csv(CSV_HEADERS, index=False)
        print("   - (headers guardados en dicom_headers.csv)")

    total_h = len(df_headers)
    sin_edad = int(df_headers["edad"].isna().sum())
    con_edad = total_h - sin_edad
    mayores_18 = int((df_headers["edad"] >= 18).sum())
    menores_18 = int((df_headers["edad"] < 18).sum())
    edad_cero = int((df_headers["edad"] == 0).sum())
    edad_mayor_100 = int((df_headers["edad"] > 100).sum())

    print(f"   - Total headers leídos: {total_h:,}")
    print(f"   - Sin edad (vacío): {sin_edad:,} ({sin_edad / total_h:.2%})")
    print(
        f"   - Edad >= 18 (adultos): {mayores_18:,} ({mayores_18 / total_h:.2%})")
    print(f"   - Edad < 18: {menores_18:,} ({menores_18 / total_h:.2%})")
    print(
        f"   - Atípicos: edad = 0 -> {edad_cero:,} | edad > 100 -> {edad_mayor_100:,}")
    print(
        f"   - Rango de edad: {int(df_headers['edad'].min())} a {int(df_headers['edad'].max())}")

    print("   - Por sexo:")
    for sexo, conteo in df_headers["sexo"].value_counts().items():
        print(f"     * {sexo}: {conteo:,} ({conteo / total_h:.2%})")

    print("   - Por vista (ViewPosition):")
    for vista, conteo in df_headers["vista"].value_counts().items():
        print(f"     * {vista}: {conteo:,} ({conteo / total_h:.2%})")
    total_vista = int(df_headers["vista"].notna().sum())
    print(
        f"   - Total con vista conocida: {total_vista:,} ({total_vista / total_h:.2%})")

# ---------------------------------------------------------------------------
# 9. Resolución estándar de los DICOM (verificación)
#    Cómo se verificó: se leyó el header (Rows x Columns) de CADA .dcm
#    con pydicom, no se asumió. Train viene del caché del bloque #8
#    y test (3,000) se lee directo porque es rápido.
# ---------------------------------------------------------------------------
print("\n#9. Resolución de los DICOM (verificación por header):")
if TIENE_PYDICOM:
    res_train = (df_headers["filas"].astype(int).astype(str)
                 + "x" + df_headers["columnas"].astype(int).astype(str))
    print(f"   - Train ({len(df_headers):,} imágenes):")
    for tam, conteo in res_train.value_counts().items():
        print(f"     * {tam}: {conteo:,} ({conteo / len(df_headers):.2%})")
    tam_test = []
    for dcm in sorted(CARPETA_IMAGENES_TEST.glob("*.dcm")):
        ds_test = pydicom.dcmread(str(dcm), stop_before_pixels=True)
        tam_test.append(f"{int(ds_test.get('Rows', 0))}x{int(ds_test.get('Columns', 0))}")
    serie_test = pd.Series(tam_test)
    print(f"   - Test ({len(serie_test):,} imágenes):")
    for tam, conteo in serie_test.value_counts().items():
        print(f"     * {tam}: {conteo:,} ({conteo / len(serie_test):.2%})")

# ---------------------------------------------------------------------------
# 10. Integridad referencial entre ambos CSV
#     Se verifica que todo patientId de stage_2_train_labels.csv exista
#     en stage_2_detailed_class_info.csv, y viceversa (en ambos sentidos).
# ---------------------------------------------------------------------------
print("\n#10. Integridad referencial entre ambos CSV:")
ids_labels = set(df_train_labels["patientId"].unique())
ids_info = set(df_class_info["patientId"].unique())
solo_en_labels = ids_labels - ids_info  # IDs huérfanos en train_labels
solo_en_info = ids_info - ids_labels  # IDs huérfanos en class_info
print(f"   - IDs en train_labels pero NO en class_info: {len(solo_en_labels):,}")
print(f"   - IDs en class_info pero NO en train_labels: {len(solo_en_info):,}")
if not solo_en_labels and not solo_en_info:
    print(f"   - OK: ambos archivos contienen exactamente los mismos {len(ids_labels):,} IDs.")

# ---------------------------------------------------------------------------
# 11. Coherencia entre Target (train_labels) y class (class_info)
#     Se verifica registro por registro (las 30,227 filas): todo Target=1
#     debe ser class='Lung Opacity', y todo Target=0 debe ser 'Normal'
#     o 'No Lung Opacity / Not Normal'. La clase se busca por patientId.
# ---------------------------------------------------------------------------
print("\n#11. Coherencia Target vs class (verificación registro por registro):")
# Tabla patientId -> class (una fila por imagen, sin duplicados)
clase_de_imagen = df_class_info.drop_duplicates("patientId").set_index("patientId")["class"]
# A cada fila de train_labels se le pega la clase de su imagen
clase_en_labels = df_train_labels["patientId"].map(clase_de_imagen)
n_target_1 = int((df_train_labels["Target"] == 1).sum())
n_target_0 = int((df_train_labels["Target"] == 0).sum())
# Regla 1: Target=1 <--> class='Lung Opacity' (en ambos sentidos a la vez)
ok_positivos = bool(((df_train_labels["Target"] == 1) == (clase_en_labels == "Lung Opacity")).all())
# Regla 2: Target=0 --> class es 'Normal' o 'No Lung Opacity / Not Normal'
clases_negativas = {"Normal", "No Lung Opacity / Not Normal"}
ok_negativos = bool(clase_en_labels[df_train_labels["Target"] == 0].isin(clases_negativas).all())
print(f"   - Registros con Target=1: {n_target_1:,} -> todos 'Lung Opacity': {ok_positivos}")
print(f"   - Registros con Target=0: {n_target_0:,} -> todos 'Normal' o 'No Lung Opacity': {ok_negativos}")
if ok_positivos and ok_negativos:
    print("   - OK: coherencia total, Target no distingue 'Normal' de 'No Lung Opacity'.")

print("\n" + "=" * 70)
print("FIN DE LA EXPLORACIÓN")
print("=" * 70)
