# SEMANA 1

## Fase CRISP-DM: Comprensión del Negocio

### Actividad: Precisar el problema de negocio/organización
Para esta actividad, se analizó el contexto clínico y administrativo del Hospital Las Mercedes en Chiclayo (basado en el documento de tesis), enfocándose en el incremento de casos de neumonía en pacientes adultos y la carga operativa que esto representa. Se evaluó cómo la falta de médicos especialistas suficientes y las demoras inherentes al proceso de diagnóstico tradicional limitan una atención oportuna, impactando directamente en la salud de los pacientes. 

### Entregable: Definición del problema
**Contexto del Problema:**
La neumonía en adultos (especialmente en mayores de 65 años) presenta altas tasas de morbilidad y mortalidad a nivel nacional y regional. En el contexto local de Lambayeque, el Hospital Las Mercedes enfrenta un incremento sostenido de casos de neumonía. Actualmente, el flujo de atención, que incluye consultas, exámenes y la interpretación manual de radiografías de tórax, puede tomar hasta dos horas por paciente. Esta situación se agrava drásticamente en días de alta demanda, sobrecargando a los médicos.

**Problema Principal:**
La demora en la emisión del diagnóstico y la **carencia de un mecanismo objetivo, automatizado y dinámico para priorizar la atención** de los pacientes según la gravedad de su condición. Esta deficiencia metodológica provoca que adultos en estado crítico (que requieren atención inmediata) se enfrenten a tiempos de espera prolongados y riesgosos.

**Objetivo de la Solución (Alineamiento Tecnológico):**
Implementar una plataforma web soportada por deep learning que no solo detecte signos radiológicos de neumonía en imágenes de tórax, sino que estratifique la gravedad de los pacientes cruzando dichos hallazgos con sus signos vitales. El objetivo principal es generar un panel de alertas clínicas que **priorice dinámicamente** los casos graves, optimizando el tiempo de respuesta del personal médico.

### Actividad: Definir objetivo analítico
Se tradujo la necesidad clínica y de negocio en metas técnicas de modelado de datos, determinando de forma concisa qué predecirá el modelo y cómo se integrarán estas predicciones en el flujo de la aplicación.

### Entregable: Objetivos analíticos
1. **Detección visual:** Entrenar un modelo de Deep Learning capaz de identificar signos de neumonía a partir de radiografías de tórax de adultos.
2. **Estratificación:** Determinar el nivel de gravedad del paciente (leve, moderado o grave) combinando las características extraídas por el modelo con sus signos vitales.
3. **Priorización:** Computar un índice dinámico que ordene la cola de atención médica, alertando de inmediato sobre pacientes críticos.
4. **Optimización de métricas:** Alcanzar niveles altos de Sensibilidad (Recall) en el modelo para garantizar que no se omitan casos reales de la enfermedad (minimizar falsos negativos).

### Actividad: Establecer criterios de éxito
Se definieron los parámetros medibles (clínicos y técnicos) extraídos de los requerimientos de la tesis, permitiendo evaluar objetivamente si la solución implementada cumple su propósito final.

### Entregable: Criterios de éxito
**Criterios Clínicos y Operativos (Negocio):**
1. **Aceptación experta:** Validación favorable de la utilidad y facilidad de uso del sistema por parte de un especialista en neumología.
2. **Optimización del flujo:** Reducción sustancial del tiempo necesario para identificar y priorizar casos críticos frente al proceso manual actual (que demora hasta 2 horas).

**Criterios Técnicos (Minería de Datos):**
1. **Rendimiento del modelo:** Alcanzar métricas de *Accuracy* y *Sensibilidad (Recall)* altamente competitivas (e.g., > 90%) en validación, asegurando viabilidad médica.
2. **Latencia:** Tiempo de respuesta integral (procesamiento de imagen, predicción y estratificación) menor a 20 segundos.
3. **Integración:** El modelo predictivo debe integrarse sin errores al backend y actualizar dinámicamente el panel de priorización web.

---

## Actividades y Avances
- [x] Lectura y extracción de datos del archivo `final.docx` (Problemática, Justificación, Objetivos).
- [x] Elaboración de la actividad: "Precisar el problema de negocio/organización".
- [x] Redacción del entregable: "Definición del problema".
- [x] Elaboración de la actividad: "Definir objetivo analítico".
- [x] Redacción del entregable: "Objetivos analíticos".
- [x] Elaboración de la actividad: "Establecer criterios de éxito".
- [x] Redacción del entregable: "Criterios de éxito".

## Pendientes
- Elaborar el inventario de recursos (datos, personal, herramientas y hardware).
- Evaluar los riesgos del proyecto (riesgos de datos y técnicos).
