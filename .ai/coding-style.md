# Coding Style

## General
- Código claro antes que código inteligente.
- Evitar sobreingeniería.
- Nombres descriptivos.
- Mantener funciones pequeñas.
- No duplicar lógica.
- Evitar comentarios innecesarios, pero si se recomienda comentarios minimamente.
- Comentar solo decisiones importantes o lógica no obvia.

## TypeScript / React
- Usar componentes funcionales.
- Usar TypeScript estricto.
- Evitar `any` salvo casos justificados.
- Separar UI de lógica cuando sea posible.
- Usar nombres claros:
  - PatientForm
  - DiagnosisResult
  - CasePriorityList
  - UploadRadiographCard

## Python / FastAPI
- Usar type hints.
- Usar modelos Pydantic para requests/responses.
- Separar routers, services y lógica ML.
- Manejar errores con HTTPException.
- No mezclar inferencia con configuración del servidor.

## Commits o cambios
- Cambios pequeños.
- Explicar qué se cambió y por qué.