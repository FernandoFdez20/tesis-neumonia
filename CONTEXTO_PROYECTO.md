# Contexto persistente del producto y la tesis

Última revisión: **2026-11-04**. Documento complementario de [AGENTS.md](AGENTS.md) para el desarrollo y mantenimiento del proyecto.

Este documento describe la aplicación, su propósito, el alcance académico, la arquitectura y las decisiones técnicas. Se basa en el informe aprobado y en la implementación del producto. Mantener actualizadas las secciones afectadas por cambios y registrar el alcance de las verificaciones.

## 1. Situación y propósito del trabajo

La tesis se desarrolla en el contexto del Hospital Las Mercedes. El producto es una plataforma web de **soporte al diagnóstico presuntivo de neumonía y estratificación de gravedad en adultos**, con priorización de casos y revisión del especialista.

**El producto está terminado en el alcance funcional declarado por el informe, como versión v1.0.0.** El informe fue revisado por las docentes y obtuvo nota aprobatoria. El plan de pulido está completado y la etapa actual corresponde a la preparación de la presentación final. No tratarlo como un prototipo con IA todavía pendiente ni iniciar una reestructuración o ampliar el alcance por iniciativa del agente.

La demostración representa el recorrido hospitalario mediante pacientes y datos clínicos de prueba e imágenes públicas. **La inferencia radiográfica usa un modelo entrenado real**. No confundir la simulación del escenario asistencial con una predicción aleatoria.

El sistema apoya al profesional. Su resultado automatizado es presuntivo, requiere validación médica y no acredita por sí mismo un diagnóstico clínico definitivo.

## 2. Título y objetivos vigentes

**Título:** Plataforma web basada en deep learning para el soporte diagnóstico y la estratificación de gravedad de neumonía en adultos del Hospital Las Mercedes.

**Objetivo general:** Desarrollar una plataforma web basada en deep learning para el soporte diagnóstico y la estratificación de gravedad de neumonía en pacientes adultos del Hospital Las Mercedes.

**Objetivos específicos:**

1. Implementar un modelo de deep learning entrenado para detectar signos radiológicos de neumonía en imágenes de tórax de adultos.
2. Integrar el modelo predictivo en una plataforma web que permita la carga de imágenes médicas, genere un soporte diagnóstico automatizado y realice la estratificación de gravedad cruzando los resultados visuales con los signos vitales del paciente.
3. Validar la precisión del modelo y la funcionalidad del sistema mediante pruebas con imágenes de datasets públicos de casos de neumonía en pacientes.
4. Evaluar la percepción de aceptación tecnológica de la plataforma web por parte de un experto en neumología, considerando factores como utilidad y facilidad de uso.

**Población:** pacientes de 18 años o más. El dataset de entrenamiento se filtró a edades de 18 a 100 años y vistas frontales AP/PA. No extender el alcance a pediatría, proyecciones laterales u otras enfermedades sin una decisión expresa.

## 3. Fuentes y alcance de la revisión

| Fuente | Qué establece |
| --- | --- |
| `SCRUM_FERNANDEZ_FERNANDO.pdf` | Metodología, evolución, alcance entregado, pruebas, modelo final, limitaciones e instrumento de aceptación. |
| Código de frontend/backend, `bd.sql` y notebooks | Implementación presente y resultados guardados que pueden contrastarse con el informe. |
| `doc_acciones.md` | Bitácora histórica; describe también etapas anteriores que ya no representan el producto actual. |

Ruta local del informe: `C:\Users\Fernando\OneDrive - Catholic University Santo Toribio de Mogrovejo\TESIS\SCRUM_FERNANDEZ_FERNANDO.pdf` (157 páginas; presentación fechada el 15/10/2026). Este archivo está fuera del repositorio y puede no estar disponible en otros equipos. No asumir acceso a otros documentos de esa carpeta.

Referencias útiles dentro del PDF, por página física:

- 5-19: metodología, requerimientos, historias y criterios de éxito.
- 71-75: demostración del flujo principal.
- 90-115: comparación de modelos, optimización, selección y evaluación.
- 117-129: seis escenarios, trazabilidad y criterios de aceptación.
- 130-145: versión candidata, integración, flujo de diez etapas y cierre v1.0.0.
- 147-151: resultados por objetivo.
- 155-157: cuestionario TAM adaptado y hoja de resultados.

La evidencia disponible comprende el informe, capturas, código, CSV, resultados guardados de notebooks y pruebas funcionales registradas en la bitácora. Las verificaciones del pulido se resumen en el apartado 12. Las métricas del modelo corresponden al entrenamiento y la evaluación documentados; los ajustes de interfaz no implican un nuevo entrenamiento.

## 4. Usuarios y autorización

| Rol actual en BD | Función base |
| --- | --- |
| `Admin` | Gestiona cuentas, estados, contraseñas, roles y permisos. No accede a datos clínicos. |
| `Enfermera` | Registra pacientes, antecedentes y atenciones con signos vitales; carga radiografías y consulta resultados, panel, alertas e historial. |
| `Especialista` | Tiene el acceso operativo clínico y además examen físico/derivación, validación del diagnóstico y reporte PDF. |

Los permisos efectivos se calculan como **base del rol + concedidos - revocados**, con desviaciones persistidas en `usuario_permisos_override`. El backend aplica `requiere_permiso()`; ocultar un botón o menú en React no sustituye esa comprobación. La exclusión de datos clínicos para el administrador se conserva incluso si se le conceden permisos clínicos.

No existe autorregistro público de cuentas en el flujo actual. El alta requiere autorización de gestión de usuarios. La autenticación usa JWT; las contraseñas se almacenan como hash PBKDF2-SHA256 con sal. El cliente conserva la sesión en `localStorage`.

## 5. Recorrido completo de la aplicación

| Etapa | Acción y resultado |
| --- | --- |
| 1. Acceso | Iniciar sesión con una cuenta activa; habilitar navegación y acciones según rol/permisos. |
| 2. Paciente | Buscar por DNI o registrar identificación, fecha de nacimiento, sexo y antecedentes. DNI de ocho dígitos y población adulta. |
| 3. Atención | Seleccionar al paciente, registrar síntomas, signos vitales, evolución y confusión; calcular CRB-65 y conservar su desglose. Se controla que no exista otra atención activa del mismo paciente. |
| 4. Evaluación | El especialista registra el examen físico; la interfaz ofrece guardar progreso o derivar a radiografía. |
| 5. Radiografías | Elegir una atención derivada, cargar AP y/o PA, previsualizar e iniciar el análisis. La interfaz tiene un archivo por vista. |
| 6. Inferencia | Preprocesar cada radiografía y ejecutar DenseNet121; guardar probabilidad, confianza y hallazgo de cada vista. |
| 7. Prioridad | Elegir la imagen de referencia, combinar el veredicto con CRB-65 y guardar la prioridad y la regla aplicada. Los casos Alta/Crítica generan aviso persistente. |
| 8. Validación | El especialista registra Neumonía, Sano u Otro diagnóstico, con observaciones; se conserva el resultado de IA y la concordancia. |
| 9. Cierre y reporte | La validación finaliza la atención, libera al paciente para otra y cierra su aviso. Se puede generar un PDF con información clínica, resultados, imágenes y validación. |
| 10. Historial | Buscar al paciente por DNI/nombre, consultar sus atenciones y volver a los resultados previos. |

**Paciente, atención y diagnóstico son entidades diferentes.** El paciente mantiene sus datos maestros; cada atención representa un episodio con datos clínicos propios; su diagnóstico reúne el análisis radiográfico y la revisión médica.

Los estados operativos incluyen `Pendiente de evaluación`, `Derivado a radiografía`, `Diagnostico pendiente`, `Pendiente de validación` y `Validado`; también existe `Sin atención pendiente`. No todos son transiciones guardadas en una sola columna: la API deriva parte del estado visible usando atención, examen físico y diagnóstico. La atención tiene además su propio estado `En proceso` / `Finalizada`, y el paciente el indicador `en_atencion`.

## 6. Reglas de resultado, gravedad y prioridad

Esta sección describe la implementación revisada; no constituye una validación médica independiente de las reglas.

### Resultado radiográfico

- Modelo: DenseNet121 v2, una salida binaria, con sigmoide.
- Umbral operativo: **0.50**; `p >= 0.50` produce hallazgo positivo.
- La probabilidad `p` representa la salida para la clase positiva. La confianza mostrada para la clase elegida es `max(p, 1-p) × 100`; no es la exactitud global ni una garantía clínica.
- AP y PA se analizan individualmente. Con ambas, se usa la **mayor probabilidad** como referencia del veredicto consolidado (`imagen_referencia_id`); no se promedian.
- El modelo clasifica hallazgos radiográficos. No calcula la gravedad directamente ni realiza localización, segmentación o mapas de calor en el flujo actual.

### Gravedad clínica CRB-65

El código asigna un punto por cada criterio: confusión nueva, frecuencia respiratoria >= 30, presión sistólica < 90 o diastólica <= 60, y edad >= 65. Total de 0 a 4:

| Puntaje | Gravedad guardada |
| --- | --- |
| 0 | Leve |
| 1-2 | Moderado |
| 3-4 | Grave |

Se registran otros signos vitales y antecedentes como contexto, pero no todos intervienen en esta fórmula. No atribuir a saturación, temperatura o frecuencia cardíaca una intervención automática que el código no contiene.

### Prioridad final de la atención

| Gravedad CRB-65 | IA negativa | IA positiva |
| --- | --- | --- |
| Leve | Baja | Moderada |
| Moderado | Moderada | Alta |
| Grave | Alta | Crítica |

`prioridad_detalle` conserva el puntaje, gravedad, veredicto, confianza y regla. Los casos Alta/Crítica pendientes se ordenan por prioridad (Crítica primero), luego mayor CRB-65 y mayor edad. Dashboard y campana consultan actualizaciones cada **30 segundos**; también hay invalidación de consultas tras ciertas acciones. No describirlo como WebSocket.

La validación guarda clasificación y descripción del especialista, profesional, fecha y concordancia `Confirmado` / `Corregido`, sin reemplazar el hallazgo original de IA.

## 7. Modelo y preparación de datos

**Fuente:** RSNA Pneumonia Detection Challenge. Las etiquetas positivas corresponden a opacidad compatible con neumonía anotada en radiografías; no equivalen a confirmación clínica de infección.

La preparación cruza los CSV por `patientId`, deduplica imágenes con múltiples cajas, conserva `Lung Opacity` y `Normal`, y excluye `No Lung Opacity/Not Normal` y población fuera del filtro etario. El conjunto final contiene **14.013 imágenes: 5.627 positivas y 8.386 negativas**.

| Protocolo | Entrenamiento | Validación | Prueba | Estratificación |
| --- | --- | --- | --- | --- |
| v1 | 9.808 | 2.102 | 2.103 | Etiqueta |
| v2, CSV locales actuales | 9.807 | 2.102 | 2.104 | Etiqueta + vista AP/PA |

Semilla 42 y proporciones aproximadas 70/15/15. Se verificó por lectura de los CSV actuales que sus `patientId` no se superponen. v1 y v2 comparten el conjunto de origen, pero cambian los repartos: sus diferencias no aíslan únicamente el efecto de la optimización del entrenamiento.

Preproceso: **DICOM -> gris -> 224 × 224 -> tres canales replicados -> normalización ImageNet**. El PNG generado para visualizar el DICOM es una vista previa, no la entrada normalizada del modelo.

Se compararon DenseNet121, ResNet50 y EfficientNetB0 con protocolo base común. DenseNet121 fue seleccionado por su desempeño global y sensibilidad. La optimización v2 incorpora aumento solo en entrenamiento (volteo horizontal y rotación ±8°), ReduceLROnPlateau y parada temprana (paciencia 3, máximo 15 épocas). Se conserva el checkpoint con mejor AUC de validación. Los notebooks `model_v2_corrida_1.ipynb` y `model_v2_corrida_2.ipynb` contienen controles de determinismo y resultados coincidentes.

**Modelo final declarado por el informe:** DenseNet121 v2, corrida `20261013_062105`, umbral 0.50. Archivo cargado por la aplicación: `modelo/modelos/densenet121_v2_best.pth`. El nombre del archivo por sí solo no acredita su procedencia; comprobarla si se sustituyen los pesos.

| Métrica en prueba, n = 2.104 | Resultado final documentado y presente en las dos corridas |
| --- | --- |
| Exactitud | 94,49 % |
| Sensibilidad | 94,56 % |
| Especificidad | 94,44 % |
| Precisión positiva | 91,94 % |
| F1 | 93,23 % |
| AUC-ROC | 0,9885 |
| AP | 0,9867 |
| TN / FP / FN / TP | 1.189 / 70 / 46 / 799 |

El barrido en validación encontró un umbral de 0.85 por Youden/F1. Se mantuvo **0.50** porque 0.85 eleva los falsos negativos de 46 a 66, aunque mejora exactitud/especificidad. No cambiarlo para aumentar una métrica aislada ni mezclar cifras de corridas anteriores.

El informe documenta paridad de las **2.104 predicciones** entre plataforma y notebook (1.988 aciertos y 116 errores). También documenta tiempos locales de 241,4 ms promedio por radiografía y 749,2 ms máximo en 48 imágenes; con dos usuarios, 673,2 ms promedio y 2,33 s máximo. Estas mediciones corresponden a la evaluación local documentada en el informe y deben distinguirse de los tiempos de inferencia por lote en GPU de Colab.

## 8. Arquitectura y mapa para localizar cambios

Monorepo con frontend React + TypeScript + Vite + Tailwind CSS + shadcn/ui, React Router, Axios/fetch y TanStack Query; gestión con pnpm. Backend FastAPI + Pydantic + SQLAlchemy + PostgreSQL, autenticación JWT. ML con PyTorch/torchvision, NumPy, pydicom y Pillow.

El módulo ML está separado por responsabilidades, pero se ejecuta **dentro del backend**: FastAPI carga el modelo una vez en su ciclo de inicio y lo reutiliza en CPU. No existe un microservicio ML independiente en el flujo revisado. PDF generado en frontend con jsPDF y AutoTable.

| Área | Archivos o directorios de referencia |
| --- | --- |
| Rutas y sesión | `frontend/src/routes/index.tsx`, `routes/paths.ts`, `hooks/use-auth.ts`, `lib/api.ts` |
| Pacientes | `frontend/src/components/pacientes/`, `backend/app/modules/pacientes/` |
| Registro/evaluación de atención | `frontend/src/components/atenciones/`, `backend/app/modules/atenciones/` |
| Carga de imágenes | `frontend/src/pages/radiografias/cargar/page.tsx`, `backend/app/modules/diagnosticos/service.py` |
| Resultados y revisión médica | `frontend/src/pages/resultado/page.tsx`, `components/diagnostico/`, `backend/app/modules/diagnosticos/` |
| CRB-65 y prioridad | `backend/app/modules/diagnosticos/crb65_service.py`, `diagnosticos/service.py` |
| Panel y avisos | `frontend/src/pages/dashboard/page.tsx`, `components/dashboard/`, `components/shared/notificaciones-bell.tsx`, `backend/app/modules/notificaciones/` |
| Historial y PDF | `frontend/src/pages/historial/page.tsx`, `frontend/src/services/reporte-pdf.service.ts` |
| Usuarios y autorización | `backend/app/modules/auth/`, `modules/usuarios/`, `core/permisos.py`, `api/deps.py`, `frontend/src/components/usuarios/` |
| Inferencia y vistas previas | `backend/app/ml/modelo_manager.py`, `inferencia.py`, `vista_previa.py`, `backend/app/main.py` |
| Dataset y experimentos | `modelo/exploracion.py`, `preparacion_datos.py`, `splits/`, `colab/`, `modelos/` |
| Esquema y archivos clínicos | `bd.sql`, `backend/app/core/archivos.py`; almacenamiento previsto en `backend/uploads/` (directorio generado en ejecución, ausente en esta revisión) |

En las rutas abreviadas de la tabla se conserva como base el directorio completo indicado en la misma celda. Revisar los archivos reales antes de editar.

Pantallas principales: `/login`, `/dashboard`, `/pacientes`, `/atenciones`, `/radiografias`, `/radiografias/cargar/:atencionId`, `/resultado`, `/historial` y `/usuarios`. El alta de paciente y atención se realiza mediante diálogos; no asumir que las rutas antiguas `/diagnostico`, `/panel` o `/resultados` siguen activas. `/resultado` obtiene el identificador de atención del estado de navegación.

La API se monta bajo **`/api/v1`**, con módulos `auth`, `usuarios`, `pacientes`, `atenciones`, `diagnosticos` y `notificaciones`. Ejemplos vigentes:

- `POST /auth/login`, `GET /auth/me`.
- `GET /pacientes/dni/{dni}`, `POST /pacientes/`.
- `POST /atenciones/`, `PATCH /atenciones/{id}/evaluar`.
- `POST /diagnosticos/atenciones/{id}/radiografias`.
- `GET /diagnosticos/atenciones/{id}/diagnostico`.
- `PATCH /diagnosticos/{id}/validar`.
- `GET /diagnosticos/prioridades/pendientes`, `GET /notificaciones/pendientes`.

Los datos principales están en `usuarios`, `usuario_permisos_override`, `pacientes`, `enfermedades`, `paciente_enfermedades`, `atenciones_medicas`, `diagnosticos`, `diagnostico_imagenes` y `notificaciones`. Consultar `bd.sql` y los modelos; el esquema escrito no demuestra el estado de una BD en ejecución.

## 9. Alcance aprobado, evaluación y límites

El informe usa **Scrum** para el producto y **CRISP-DM** para datos/modelo. Registra cuatro sprints con hitos de 30, 40, 50, 65, 80, 90 y 100 %. La versión final declarada es v1.0.0, con fecha de cierre 14/10/2026; el cronograma incluye un hito del 15/11/2026. Son referencias documentales, no una verificación de etiquetas Git o de un despliegue público.

El cierre documenta 22 historias, 21 requerimientos funcionales, 27 criterios de aceptación evaluados y seis escenarios: caso grave, caso normal, archivo inválido, acceso no autorizado, gestión de usuarios y persistencia/historial. No interpretar el 100 % del alcance funcional como ausencia de límites o detalles por pulir.

- **Despliegue:** el propio informe declara pendiente RNF-03, cifrado en reposo y TLS. La operación revisada es local; autenticar archivos no equivale a cifrar el almacenamiento.
- **Validación de gravedad:** se verificó la consistencia de las reglas. RSNA no aporta signos vitales ni etiquetas de gravedad para una validación clínica de esa estratificación.
- **Aceptación tecnológica:** TAM adaptado, 13 ítems (5 utilidad, 5 facilidad, 3 intención de uso), escala 1-5, aceptación si cada dimensión promedia >= 4.0. El PDF alterna entre instrumento pendiente y aplicado; la hoja de resultados del anexo no tiene promedios finales. No inventar puntajes ni concluir aceptación positiva sin evidencia adicional.
- **Alcance radiográfico:** la evaluación es sobre el subconjunto público filtrado, no demuestra validación prospectiva con pacientes del Hospital Las Mercedes ni desempeño ante cualquier patología torácica.
- **Futuro mencionado:** validación cruzada, otras pérdidas y mapas de calor son propuestas de mejora, no requisitos que el agente deba implementar automáticamente para dar por terminado el producto.

## 10. Observaciones de la revisión inicial

La siguiente tabla conserva observaciones de la revisión inicial del 2026-11-04. Es una referencia histórica para contrastar documentación y versiones del código; no constituye una lista vigente de tareas pendientes. Antes de reutilizar una observación, comprobar si sigue presente en la versión actual.

| Tema | Diferencia o límite de la implementación revisada |
| --- | --- |
| Formatos | Informe y selector mencionan JPG/PNG/DICOM; el preproceso de inferencia actual lee con pydicom. No dar por verificado el análisis de JPG/PNG. |
| Vistas | Parte del informe dice AP requerida/PA opcional; el código exige al menos una de AP o PA. |
| Panel | El informe habla de totales/positivos; el panel actual cuenta prioridades pendientes. Además usa `Leve` donde la API devuelve `Baja`, diferencia relevante para ese contador. |
| Evaluación y derivación | Las acciones guardar progreso y derivar terminan guardando el examen físico; el estado visible se deduce de su existencia. Revisar antes de afirmar que ambas transiciones son independientes. |
| Validaciones | DNI/adulto tienen validación en backend; varios rangos de signos vitales están en frontend y no tienen la misma exigencia en los esquemas de atención. |
| Archivos clínicos | `/uploads` exige JWT y usuario activo por parámetro de consulta; esa comprobación por sí sola no aplica la misma resolución de permisos clínicos que los endpoints. |
| Antecedentes | Backend mantiene catálogo y relación con enfermedades; el diálogo actual presenta listas locales y envía antecedentes como texto. No asumir que esa UI consume el catálogo dinámico antiguo. |

## 11. Criterio para las próximas tareas

Definir el alcance de cada cambio y su efecto en el recorrido clínico antes de modificar el producto. Mantener el alcance aprobado y la separación UI/API/ML. Usar shadcn/ui, español y diseño clínico sobrio. No cambiar umbral, pesos, preprocesamiento ni reglas médicas por ajustes de interfaz. Si cambia el comportamiento, contrastarlo con el informe y registrar la diferencia.

Antes de editar, revisar el estado de Git y conservar las modificaciones existentes. Separar los cambios propios de cada tarea y evitar revertir trabajo ajeno. El estado del repositorio debe consultarse directamente, sin asumir que una fotografía anterior sigue vigente.

Validar según lo modificado y explicar qué se comprobó. Los resúmenes antiguos sobre IA aleatoria, cinco roles, carga de cuatro imágenes y rutas eliminadas describen fases anteriores; no usarlos para orientar nuevas implementaciones.


## 12. Pulido funcional y de usabilidad

El plan de pulido está completado. Se conservan la separación UI/API/ML, los permisos, las categorías de gravedad y prioridad, el umbral del modelo y las reglas clínicas.

### Navegación y acciones por estado

- Ver todas abre Atenciones. El buscador por clic y Ctrl/Meta+K permite encontrar secciones y acciones según permisos.
- Los filtros disponibles tienen una función definida. La presión arterial se incluye en las respuestas de listado, detalle e historial, y la última atención se calcula desde el historial del paciente.
- El panel identifica los registros como Últimas atenciones.
- Las acciones corresponden a cada etapa: Evaluar atención, Cargar radiografía, Revisar y validar o Ver diagnóstico y reporte. Los permisos determinan las variantes de consulta disponibles.

### Identificación de estados

Botón y badge comparten fondo pastel y texto oscuro. Evaluación: naranja suave; derivación a radiografía: celeste; diagnóstico pendiente: ámbar; validación pendiente: lavanda; validado: verde suave. Los estilos se centralizan en `frontend/src/lib/estado-clinico.ts`.

### Jerarquía visual

El panel incorpora accesos rápidos compactos, indicadores de prioridad y casos prioritarios antes de las atenciones recientes en pantallas estrechas. Pacientes presenta primero el directorio y después el gráfico mensual plegable. Atenciones ofrece Tabla y Tarjetas con filtros, paginación y acciones compartidos. Resultados comienza con paciente, resultado presuntivo, prioridad y estado de validación; el fundamento y los datos clínicos completos aparecen después. Encabezados y márgenes mantienen un patrón común.

### Registro clínico

Nueva atención agrupa Paciente, Signos vitales y Síntomas/observaciones. El encabezado y las acciones permanecen visibles, con desplazamiento del cuerpo. Las unidades acompañan a los valores y las ayudas distinguen motivo de consulta, síntomas y observaciones opcionales.

El plan de pulido también comprende las mejoras del visor de radiografías y del contexto de navegación. El archivo temporal de seguimiento se retiró al cerrar el plan.

### Verificación registrada

- Compilación TypeScript/Vite y cuatro pruebas frontend de estados y permisos aprobadas.
- Integración ASGI/PostgreSQL con dos flujos de inferencia real, normal y positivo, en un esquema aislado revertido al terminar; conservación de los datos de demostración.
- Revisión de navegación, búsqueda entre vistas, paginación, estado vacío, evaluación, carga, validación, gráfico plegable y resumen del caso.
- Revisión del formulario clínico en escritorio y 390 × 844, con unidades, errores de validación, enfoque y cancelación sin guardar registros.
- La descarga de un nuevo PDF no quedó comprobada automáticamente. Las limitaciones de ESLint preexistentes se detallan en la bitácora.

Las comprobaciones corresponden a las entregas registradas; no sustituyen una prueba de regresión de cada versión posterior. Las ampliaciones de corrección/anulación y trazabilidad de eventos quedan fuera del alcance funcional aprobado.
