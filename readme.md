# Plataforma web de soporte diagnóstico de neumonía

**Deep learning · Estratificación de gravedad · Priorización de casos · Validación médica**

Plataforma web desarrollada como proyecto de tesis para el **soporte diagnóstico presuntivo de neumonía y la estratificación de gravedad en adultos**, en el contexto del Hospital Las Mercedes. Integra radiografías de tórax, signos vitales y evaluación del especialista en un mismo recorrido clínico.

El análisis radiográfico utiliza un modelo **DenseNet121 entrenado con PyTorch**. La gravedad se calcula con **CRB-65** y se combina con el resultado de imagen para determinar la prioridad de atención. El especialista revisa el resultado y registra su conclusión antes del cierre del caso.

> **Alcance clínico:** herramienta académica de apoyo a la decisión. Los resultados de IA son presuntivos y requieren evaluación profesional. La demostración utiliza datos clínicos de prueba e imágenes públicas; la inferencia del modelo es real. La evaluación con datasets públicos no acredita validación prospectiva con pacientes del hospital.

## Contenido

- [Propósito y objetivos](#propósito-y-objetivos)
- [Funcionalidades](#funcionalidades)
- [Flujo de trabajo](#flujo-de-trabajo)
- [Usuarios y permisos](#usuarios-y-permisos)
- [Modelo, gravedad y prioridad](#modelo-gravedad-y-prioridad)
- [Resultados de evaluación](#resultados-de-evaluación)
- [Arquitectura y tecnologías](#arquitectura-y-tecnologías)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Instalación y ejecución local](#instalación-y-ejecución-local)
- [Pruebas y compilación](#pruebas-y-compilación)
- [API](#api)
- [Problemas frecuentes](#problemas-frecuentes)
- [Alcance y límites](#alcance-y-límites)
- [Documentación](#documentación)
- [Autoría y licencia](#autoría-y-licencia)

## Propósito y objetivos

**Título de la tesis:** Plataforma web basada en deep learning para el soporte diagnóstico y la estratificación de gravedad de neumonía en adultos del Hospital Las Mercedes.

**Objetivo general:** Desarrollar una plataforma web basada en deep learning para el soporte diagnóstico y la estratificación de gravedad de neumonía en pacientes adultos del Hospital Las Mercedes.

**Objetivos específicos:**

1. Implementar un modelo de deep learning entrenado para detectar signos radiológicos de neumonía en imágenes de tórax de adultos.
2. Integrar el modelo predictivo en una plataforma web que permita la carga de imágenes médicas, genere un soporte diagnóstico automatizado y realice la estratificación de gravedad cruzando los resultados visuales con los signos vitales del paciente.
3. Validar la precisión del modelo y la funcionalidad del sistema mediante pruebas con imágenes de datasets públicos de casos de neumonía en pacientes.
4. Evaluar la percepción de aceptación tecnológica de la plataforma web por parte de un experto en neumología, considerando factores como utilidad y facilidad de uso.

El alcance funcional corresponde a la versión académica **v1.0.0**, con 22 historias de usuario y 21 requerimientos funcionales documentados.

## Funcionalidades

| Módulo | Capacidades |
| --- | --- |
| Acceso y administración | Inicio de sesión, cuentas activas/inactivas, roles y permisos por usuario. |
| Pacientes | Registro por DNI, validación de población adulta, antecedentes, búsqueda y ficha con historial de atenciones. |
| Atenciones médicas | Registro de signos vitales, síntomas, evolución y confusión; cálculo y desglose de CRB-65. |
| Evaluación médica | Registro del examen físico y continuidad del flujo hacia radiografías. |
| Radiografías | Carga por vista AP/PA, vista previa y análisis independiente de cada imagen. |
| Resultados | Resumen del caso, probabilidades, confianza por imagen, resultado consolidado, gravedad y prioridad. |
| Priorización y alertas | Seguimiento de casos pendientes y avisos persistentes para prioridades Alta y Crítica. |
| Validación especializada | Clasificación médica, observaciones, concordancia con la IA, profesional y fecha de validación. |
| Reportes e historial | Reporte PDF y consulta de episodios previos. |
| Navegación | Buscador de secciones y acciones, filtros, paginación y vistas de tabla o tarjetas para atenciones. |

## Flujo de trabajo

1. **Acceso:** iniciar sesión con una cuenta activa y permisos asignados.
2. **Paciente:** buscar por DNI o registrar un paciente adulto.
3. **Atención:** registrar signos vitales y síntomas; calcular CRB-65.
4. **Evaluación:** registrar el examen físico y continuar hacia la carga radiográfica.
5. **Análisis:** cargar una o dos vistas frontales, AP y/o PA, y ejecutar DenseNet121.
6. **Priorización:** combinar el resultado radiográfico con la gravedad clínica y consultar las alertas.
7. **Validación:** registrar la conclusión del especialista y sus observaciones.
8. **Cierre:** finalizar la atención, habilitar un nuevo episodio del paciente y consultar el reporte o historial.

Paciente, atención y diagnóstico son entidades distintas: un paciente puede tener varias atenciones a lo largo del tiempo y cada episodio conserva sus propios datos clínicos y resultados. Se controla que no exista otra atención activa del mismo paciente.

## Usuarios y permisos

| Rol | Responsabilidad base |
| --- | --- |
| **Admin** | Gestionar cuentas, roles y permisos. Sin acceso a datos clínicos. |
| **Enfermera** | Registrar pacientes y atenciones, cargar radiografías y consultar resultados, alertas e historial. |
| **Especialista** | Acceso al flujo clínico, examen físico, validación del diagnóstico y generación del reporte PDF. |

Los permisos efectivos combinan la base del rol con concesiones y revocaciones individuales. La API verifica los permisos de cada operación. El alta de cuentas requiere autorización; no hay autorregistro público.

## Modelo, gravedad y prioridad

### Análisis radiográfico

El modelo final es **DenseNet121 v2**, seleccionado tras comparar DenseNet121, ResNet50 y EfficientNetB0.

- **Dataset:** [RSNA Pneumonia Detection Challenge](https://www.kaggle.com/competitions/rsna-pneumonia-detection-challenge).
- **Selección:** adultos de 18 a 100 años, proyecciones AP/PA y clases Normal y Lung Opacity.
- **Conjunto final:** 14.013 imágenes; 5.627 positivas y 8.386 negativas.
- **Partición v2:** 9.807 entrenamiento, 2.102 validación y 2.104 prueba; semilla 42 y estratificación por etiqueta y vista.
- **Preprocesamiento:** lectura DICOM, escala de grises, redimensionamiento a 224 × 224, réplica a tres canales y normalización ImageNet.
- **Umbral operativo:** 0,50 para la clase positiva.
- **Pesos:** `modelo/modelos/densenet121_v2_best.pth`.

AP y PA se analizan por separado. Cuando existen ambas, la imagen con mayor probabilidad positiva determina el resultado consolidado; se conserva el detalle individual de cada vista.

La confianza mostrada para la clase elegida es `max(p, 1 − p) × 100`. Este valor corresponde a una predicción individual y debe distinguirse de la exactitud medida sobre el conjunto de prueba.

### Gravedad clínica y prioridad

CRB-65 utiliza confusión, frecuencia respiratoria, presión arterial y edad. El sistema conserva el puntaje y su desglose. La prioridad combina esa gravedad con el resultado de IA mediante las reglas implementadas:

| Gravedad CRB-65 | IA negativa | IA positiva |
| --- | --- | --- |
| Leve · 0 puntos | Baja | Moderada |
| Moderado · 1–2 puntos | Moderada | Alta |
| Grave · 3–4 puntos | Alta | Crítica |

El modelo clasifica hallazgos radiográficos; la gravedad y la prioridad se obtienen mediante la lógica clínica del sistema. La validación registra la conclusión médica y conserva el resultado original de IA.

## Resultados de evaluación

Resultados de DenseNet121 v2, corrida `20261013_062105`, sobre **2.104 imágenes de prueba**, documentados en el informe y los notebooks de evaluación:

| Métrica | Resultado |
| --- | ---: |
| Exactitud | 94,49 % |
| Sensibilidad | 94,56 % |
| Especificidad | 94,44 % |
| Precisión positiva | 91,94 % |
| F1 | 93,23 % |
| AUC-ROC | 0,9885 |
| Average Precision · AP | 0,9867 |

Matriz de confusión: **1.189 verdaderos negativos, 70 falsos positivos, 46 falsos negativos y 799 verdaderos positivos**.

El informe documenta coincidencia de las 2.104 predicciones entre notebook y plataforma. Estas cifras corresponden al subconjunto público evaluado y al protocolo descrito; no representan una garantía de desempeño sobre cualquier población o imagen.

## Arquitectura y tecnologías

```mermaid
flowchart LR
    U[Personal autorizado] --> F[Frontend React]
    F --> A[API FastAPI]
    A --> D[(PostgreSQL)]
    A --> M[Inferencia PyTorch / DenseNet121]
    A --> R[Archivos DICOM y vistas PNG]
    F --> P[Reporte PDF]
```

| Capa | Tecnologías y función |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, shadcn/ui, React Router, Axios y TanStack Query. |
| Backend | FastAPI, Pydantic, SQLAlchemy, PostgreSQL y Uvicorn. |
| Autenticación | JWT HS256 con python-jose; contraseñas con PBKDF2-SHA256 mediante Passlib. |
| Inferencia | PyTorch, torchvision, NumPy, pydicom y Pillow. |
| Visualización y reportes | Recharts, jsPDF y AutoTable. |

El modelo se carga una vez al iniciar FastAPI y se reutiliza en CPU. El módulo ML está separado por responsabilidad dentro del backend. El panel y las notificaciones se actualizan mediante consultas periódicas cada 30 segundos.

## Estructura del repositorio

```text
tesis-neumonia/
├── frontend/
│   ├── src/
│   │   ├── components/       # UI y componentes de los módulos
│   │   ├── pages/            # Pantallas de la aplicación
│   │   ├── routes/           # Rutas y protección de acceso
│   │   ├── services/         # Comunicación con la API y reportes
│   │   └── hooks/, lib/, types/, layouts/
│   ├── tests/                # Pruebas de estados y permisos
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/              # Router y dependencias de autorización
│   │   ├── core/             # Configuración, BD, seguridad y archivos
│   │   ├── ml/               # Modelo, preprocesamiento y vistas previas
│   │   └── modules/          # Auth, usuarios, pacientes, atenciones,
│   │                         # diagnósticos y notificaciones
│   ├── scripts/              # Herramientas de desarrollo
│   └── tests/                # Regresión del flujo clínico
├── modelo/
│   ├── colab/                # Entrenamiento, comparación y evaluación
│   ├── modelos/              # Pesos entrenados
│   ├── splits/               # Particiones train/val/test
│   └── *.py                  # Exploración, preparación y prueba
├── bd.sql                    # Esquema PostgreSQL
├── CONTEXTO_PROYECTO.md       # Contexto funcional, académico y técnico
├── doc_acciones.md            # Bitácora de implementación
└── AGENTS.md                 # Reglas de mantenimiento para agentes
```

Las radiografías cargadas se almacenan en `backend/uploads/`, directorio generado durante la ejecución y excluido de Git. El dataset original se obtiene por separado.

## Instalación y ejecución local

Las instrucciones siguientes utilizan **PowerShell en Windows**. Ejecutar los servicios en terminales separadas.

### 1. Requisitos

- Git.
- **Node.js 22.12 o superior**, compatible con Vite 8, y pnpm.
- **Python 3.11** como base de instalación de las dependencias indicadas.
- PostgreSQL en ejecución, con `createdb` y `psql` disponibles en el PATH.
- Pesos de DenseNet121 v2 en la ruta indicada.
- Imágenes DICOM de tórax AP/PA para probar el análisis.

La inferencia local utiliza CPU; no requiere CUDA. Los notebooks de entrenamiento tienen sus propios requisitos y no son necesarios para iniciar la plataforma.

### 2. Obtener el proyecto

```powershell
git clone https://github.com/FernandoFdez20/tesis-neumonia.git
cd tesis-neumonia
```

Comprobar que existe `modelo/modelos/densenet121_v2_best.pth` y que es el archivo de pesos completo. El backend puede responder a la ruta raíz aun cuando falten los pesos; esa respuesta no comprueba la disponibilidad del modelo.

### 3. Crear la base de datos

Desde la raíz del repositorio, crear una base vacía e importar el esquema:

```powershell
createdb -h localhost -U postgres -W tesis_db
psql -h localhost -U postgres -W -d tesis_db -v ON_ERROR_STOP=1 -f bd.sql
```

El script define tablas y tipos; no incluye cuentas ni contraseñas. Está preparado para una base nueva. No volver a ejecutarlo sobre una base con información existente como método de actualización.

### 4. Preparar el backend

```powershell
cd backend
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary pydantic pydantic-settings python-multipart python-jose passlib email-validator numpy pillow pydicom
python -m pip install torch==2.7.0 torchvision==0.22.0 --index-url https://download.pytorch.org/whl/cpu
```

El repositorio todavía no incluye un manifiesto de dependencias Python con versiones fijadas; el comando enumera las dependencias de ejecución identificadas en el código. El entorno frontend sí utiliza `pnpm-lock.yaml`.

Configurar la conexión y una clave propia **en esta misma terminal**, antes de iniciar Python o la API:

```powershell
$env:DATABASE_URL = "postgresql://postgres:TU_CLAVE_POSTGRES@localhost:5432/tesis_db"
$env:SECRET_KEY = python -c "import secrets; print(secrets.token_hex(32))"
```

Sustituir `TU_CLAVE_POSTGRES` por la contraseña local y codificar los caracteres especiales si corresponde a una URL de conexión. Conservar la misma `SECRET_KEY` para los siguientes arranques; cambiarla invalida las sesiones anteriores. Estas variables solo afectan a la terminal actual. También se admite `SQLALCHEMY_DATABASE_URI` como configuración directa de la conexión.

### 5. Crear el primer administrador

El registro de cuentas exige permisos de administración. En una base nueva, crear la cuenta inicial desde la consola local, manteniendo las variables anteriores y el directorio `backend`:

```powershell
python
```

Ejecutar este bloque en el intérprete. Solicita los datos localmente y utiliza el mismo hash de contraseñas que la aplicación:

```python
from getpass import getpass
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.modules.auth.models import Usuario, TipoRol

usuario = input("Usuario administrador: ").strip()
correo = input("Correo: ").strip()
nombre = input("Nombre completo: ").strip()
clave = getpass("Contraseña: ")
assert usuario and correo and nombre and clave, "Completar todos los datos"
db = SessionLocal()
assert not db.query(Usuario).filter((Usuario.username == usuario) | (Usuario.correo == correo)).first(), "La cuenta ya existe"
db.add(Usuario(username=usuario, correo=correo, nombre_completo=nombre, password=get_password_hash(clave), rol=TipoRol.Admin, estado=True))
db.commit()
db.close()
exit()
```

Este procedimiento se realiza una vez por base nueva. Después, el administrador crea las cuentas de Enfermera y Especialista desde el módulo Usuarios. Utilizar esas cuentas para recorrer las pantallas clínicas.

### 6. Iniciar la API

Desde `backend`, con el entorno virtual activo y las variables configuradas:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Si la recarga automática no se aplica correctamente en Windows, el repositorio incluye esta alternativa; ejecutar solo uno de los dos servidores:

```powershell
python scripts/dev_server.py
```

### 7. Iniciar el frontend

En otra terminal, desde la raíz del repositorio:

```powershell
cd frontend
pnpm install --frozen-lockfile
pnpm dev --host localhost --port 5173 --strictPort
```

| Servicio | Dirección local |
| --- | --- |
| Plataforma | [localhost:5173](http://localhost:5173/) |
| API | [localhost:8000](http://localhost:8000/) |
| Documentación Swagger | [localhost:8000/docs](http://localhost:8000/docs) |
| Esquema OpenAPI | [localhost:8000/openapi.json](http://localhost:8000/openapi.json) |

El cliente Axios utiliza `http://localhost:8000/api/v1` en `frontend/src/lib/api.ts`. La resolución de archivos usa `frontend/src/lib/archivos.ts`, con soporte para `VITE_API_URL`. Cambiar esa variable por sí sola no modifica la URL del cliente Axios.

### 8. Preparar una demostración

1. Crear cuentas de Enfermera y Especialista con el administrador.
2. Registrar un paciente adulto con identidad ficticia y un DNI de prueba de ocho dígitos.
3. Registrar una atención y sus datos clínicos de prueba.
4. Continuar la evaluación con la cuenta del especialista.
5. Cargar una radiografía DICOM AP o PA del dataset público y ejecutar el análisis.
6. Revisar resultado, gravedad, prioridad, validación e historial.

Para reproducir el análisis documentado, utilizar **DICOM `.dcm`**. La entrada del pipeline actual se interpreta con pydicom; no asumir equivalencia de análisis para JPG/PNG a partir de la vista previa de la interfaz.

## Pruebas y compilación

### Frontend

Desde `frontend`:

```powershell
pnpm build
node --test tests/flujo-clinico.test.cjs
pnpm lint
```

- `build`: comprobación TypeScript y generación de archivos en `frontend/dist/`.
- Pruebas: coherencia de colores por estado, acciones del flujo y permisos.
- `lint`: análisis estático del proyecto; sus resultados son independientes de la compilación.

La compilación del frontend no inicia la API ni prepara la base de datos.

### Backend

Las pruebas de regresión requieren PostgreSQL, los pesos del modelo y archivos DICOM locales. Desde `backend`, con el entorno activo y las variables de conexión configuradas:

```powershell
$env:RSNA_DATASET_DIR = "C:\ruta\rsna-pneumonia-detection-challenge"
python -m unittest discover -s tests -v
```

`RSNA_DATASET_DIR` debe contener `stage_2_train_images/` con imágenes presentes en `modelo/splits/test.csv`, de ambas clases. Si faltan, la prueba se omite: un resultado `skipped` no acredita que el recorrido se haya ejecutado.

La regresión recorre autenticación, permisos, registro, CRB-65, evaluación, inferencia real, validación, cierre e historial. Crea un esquema transaccional aislado y archivos temporales; necesita permiso para crear esquemas y revierte los cambios al terminar.

## API

Las rutas funcionales utilizan el prefijo **`/api/v1`**. Las operaciones protegidas reciben `Authorization: Bearer <token>`.

| Método | Ruta | Propósito |
| --- | --- | --- |
| `POST` | `/auth/login` | Obtener sesión y permisos efectivos. |
| `GET` | `/auth/me` | Consultar la cuenta autenticada. |
| `POST` | `/auth/register` | Crear cuentas con permiso de administración. |
| `GET` / `POST` | `/pacientes/` | Buscar o registrar pacientes. |
| `POST` | `/atenciones/` | Registrar una atención. |
| `PATCH` | `/atenciones/{id}/evaluar` | Registrar evaluación y acción del flujo. |
| `POST` | `/diagnosticos/atenciones/{id}/radiografias` | Cargar imágenes mediante multipart y ejecutar inferencia. |
| `GET` | `/diagnosticos/atenciones/{id}/diagnostico` | Consultar el resultado del caso. |
| `PATCH` | `/diagnosticos/{id}/validar` | Registrar la validación del especialista. |
| `GET` | `/diagnosticos/prioridades/pendientes` | Consultar prioridades y casos pendientes. |
| `GET` | `/notificaciones/pendientes` | Consultar avisos activos. |

El formulario de login usa `username` y `password`. Los campos multipart de carga son `archivo_ap` y `archivo_pa`; se exige al menos una vista. Swagger contiene los contratos completos y las respuestas de cada endpoint.

## Problemas frecuentes

| Situación | Comprobación |
| --- | --- |
| No conecta con PostgreSQL | Verificar servicio, base importada, usuario, contraseña y `DATABASE_URL` en la terminal del backend. |
| La API responde, pero no analiza | Revisar el log de arranque y la presencia de los pesos completos en `modelo/modelos/densenet121_v2_best.pth`. |
| El administrador no ve pacientes o resultados | Es el comportamiento del rol. Crear una cuenta clínica y utilizar sus permisos. |
| Error de sesión o acceso denegado | Iniciar sesión nuevamente y revisar estado de la cuenta, permisos y continuidad de `SECRET_KEY`. |
| Fallo al interpretar una imagen | Utilizar DICOM `.dcm` válido; verificar que corresponde a una vista frontal del protocolo evaluado. |
| El frontend no inicia con una versión antigua de Node | Utilizar Node.js 22.12 o superior compatible con Vite 8 y reinstalar con el lockfile. |
| Los cambios del backend no aparecen | Detener el servidor anterior y usar la alternativa `scripts/dev_server.py` para la recarga en Windows. |

## Alcance y límites

- **Población y proyecciones:** el desarrollo se centra en adultos y vistas frontales AP/PA. Otras edades, proyecciones y patologías quedan fuera del protocolo evaluado.
- **Etiquetas del dataset:** Lung Opacity representa opacidad compatible con neumonía; la etiqueta radiográfica no constituye confirmación clínica de infección.
- **Gravedad:** la evaluación verifica la consistencia de las reglas implementadas. El dataset RSNA no aporta una referencia clínica de gravedad para validar esa estratificación.
- **Aceptación tecnológica:** su evaluación mediante un experto en neumología es un objetivo independiente del desempeño predictivo. No se incluyen aquí puntajes de aceptación sin resultados documentados.
- **Despliegue:** las instrucciones corresponden a ejecución local. Un entorno asistencial requiere configuración específica de acceso, transporte cifrado, almacenamiento y respaldo. La configuración de desarrollo no acredita un despliegue hospitalario.
- **Datos:** no publicar credenciales, tokens, bases con información personal ni radiografías clínicas identificables. El dataset original debe obtenerse bajo las condiciones de su fuente.

## Documentación

| Recurso | Contenido |
| --- | --- |
| [Contexto del proyecto](CONTEXTO_PROYECTO.md) | Definiciones académicas, recorrido funcional, modelo, decisiones y límites de evidencia. |
| [Esquema de base de datos](bd.sql) | Tablas, relaciones y tipos PostgreSQL. |
| [Notebooks](modelo/colab/) | Comparación de arquitecturas, entrenamiento y evaluación. |
| [Particiones del dataset](modelo/splits/) | CSV de entrenamiento, validación y prueba. |
| [Bitácora técnica](doc_acciones.md) | Implementaciones y verificaciones por entrega; incluye etapas históricas. |
| [Reglas de mantenimiento](AGENTS.md) | Convenciones y contexto para trabajar en el repositorio con agentes. |

El informe académico es **SCRUM_FERNANDEZ_FERNANDO.pdf**. Se mantiene como documento externo al repositorio; los resultados principales y la estructura del producto se resumen aquí.

## Autoría y licencia

**Fernando Fernandez** — Proyecto de tesis de Ingeniería de Tecnologías de la Información.

El repositorio no incluye una licencia general de distribución del código. Las bibliotecas y el dataset conservan sus respectivas licencias y condiciones de uso.
