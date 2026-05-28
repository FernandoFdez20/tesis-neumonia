# Project Decisions

## Decisiones tomadas

1. El sistema será web.
2. El frontend usará React + Vite + TypeScript.
3. La UI usará shadcn/ui como base.
4. El backend usará FastAPI.
5. El modelo de IA estará separado de la lógica de API.
6. El sistema trabajará con radiografías de tórax.
7. El diagnóstico será presuntivo.
8. La priorización será dinámica cuando existan múltiples casos.
9. La evaluación de aceptación tecnológica se realizará con experto en neumología.
10. La validación del modelo y funcionalidad puede realizarse con datasets públicos.

## Decisiones de diseño

- UI moderna, clínica y sobria.
- No diseño futurista.
- Componentes reutilizables.
- Estilos globales cuando correspondan.
- Evitar Tailwind desordenado por todo el proyecto.
- Usar tokens visuales y componentes base.

## Decisiones clínicas

- El sistema no reemplaza al médico.
- La IA solo apoya la toma de decisiones.
- Los resultados deben mostrarse con advertencia clínica.