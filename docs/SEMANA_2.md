# SEMANA 2

## Fase CRISP-DM: Comprensión de los Datos

### Actividad: Identificar variables y atributos
Se exploró la estructura interna del dataset "RSNA Pneumonia Detection Challenge", compuesto por imágenes médicas (DICOM) y metadatos tabulares, centrándose el análisis en los archivos de entrenamiento: `stage_2_train_labels.csv` y `stage_2_detailed_class_info.csv`.

### Entregable 1: Diccionario de datos
**Archivo: `stage_2_train_labels.csv`**
- `patientId` (Texto): Identificador único del paciente.
- `x` (Decimal): Coordenada X del punto superior izquierdo de la zona de la lesión.
- `y` (Decimal): Coordenada Y del punto superior izquierdo de la zona de la lesión.
- `width` (Decimal): Ancho del cuadro delimitador (bounding box).
- `height` (Decimal): Altura del cuadro delimitador.
- `Target` (Numérico entero): Variable objetivo primaria para clasificación binaria. `1` indica presencia de neumonía, `0` indica ausencia.

**Archivo: `stage_2_detailed_class_info.csv`**
- `patientId` (Texto): Identificador único del paciente.
- `class` (Texto): Clasificación clínica detallada en 3 niveles (`Normal`, `No Lung Opacity / Not Normal`, y `Lung Opacity`).

### Entregable 2: Exploración inicial
- **Volumen total:** 30,227 registros etiquetados.
- **Distribución de la variable predictiva (`Target`):** 
  - Negativos (`0`): 20,672 casos (68.4%).
  - Positivos (`1`): 9,555 casos (31.6%).
- **Estratificación por Clases Clínicas (`class`):**
  - *Normal*: 8,851 casos.
  - *No Lung Opacity / Not Normal* (Afecciones sin opacidad, ej. otras patologías): 11,821 casos.
  - *Lung Opacity* (Neumonía): 9,555 casos.

### Entregable 3: Diagnóstico de calidad de datos
1. **Valores Faltantes (Nulos):**
   - Las variables espaciales de coordenadas (`x, y, width, height`) presentan exactamente **20,672 valores nulos**. **No se trata de un error de calidad**. Esto tiene una justificación lógica directa: estos valores nulos corresponden exactamente a los pacientes con `Target = 0`. Al no tener neumonía, no existe un cuadro delimitador (Bounding Box).
2. **Valores Duplicados:**
   - El archivo de etiquetas clínicas (`stage_2_detailed_class_info.csv`) presenta **3,543 filas con `patientId` duplicados**. Esto tampoco es un error; ocurre porque algunos pacientes presentan múltiples focos de opacidad pulmonar, generando varios cuadros delimitadores para un solo ID.
   - El archivo principal de entrenamiento (`stage_2_train_labels.csv`) mantiene consistencia estructural (0 filas idénticas duplicadas al 100%).
3. **Integridad general:** 
   - La completitud de la variable dependiente (Target y Class) es del 100%, lo cual es un excelente indicador para proceder con el entrenamiento de los algoritmos de Deep Learning sin necesidad de imputación en dichas columnas.

---

## Actividades y Avances
- [x] Ejecución de script de análisis exploratorio sobre los metadatos de RSNA Pneumonia.
- [x] Elaboración de Diccionario de datos.
- [x] Diagnóstico de calidad y exploración volumétrica inicial (identificación de valores nulos naturales).

## Pendientes
- Exploración técnica de las imágenes DICOM (resolución, metadatos de edad/sexo incrustados en la imagen).
- Preparación de datos: Consolidar y unir (merge) los CSVs para su uso por el modelo.
