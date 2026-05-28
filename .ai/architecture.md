# Arquitectura General

El sistema está dividido en tres capas principales:

## 1. Frontend

Responsable de:
- Interfaz clínica.
- Registro de pacientes.
- Carga de radiografías.
- Visualización de resultados.
- Priorización de casos.
- Dashboard o listado clínico.

Debe mantenerse modular:
- pages/
- components/
- services/
- hooks/
- types/
- lib/

Los componentes reutilizables deben ir en components/.
La lógica de consumo de API debe estar en services/.
Los tipos compartidos deben estar en types/.

## 2. Backend

Responsable de:
- Recibir datos del frontend.
- Procesar imágenes.
- Invocar el modelo de deep learning.
- Devolver resultados estructurados.
- Manejar validaciones básicas.
- Exponer endpoints REST.

No debe contener lógica visual.

## 3. Modelo IA

Responsable de:
- Recibir radiografía.
- Preprocesar imagen.
- Ejecutar inferencia.
- Retornar predicción.
- Retornar nivel de confianza.
- Apoyar clasificación de gravedad.

La lógica del modelo debe estar separada de los endpoints.