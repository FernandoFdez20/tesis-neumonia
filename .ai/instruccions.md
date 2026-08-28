# AI Agent Instructions

Este proyecto es una tesis de sistema web clínico para soporte al diagnóstico presuntivo de neumonía en adultos mediante deep learning.
**Fuente de verdad universal:** `AGENTS.md` en raíz + `.ai/memory.md` (memoria conversacional). Leer ambos al iniciar.

Reglas generales para agentes:
- No reestructurar todo el proyecto sin necesidad.
- Mantener la arquitectura existente.
- Priorizar cambios pequeños, seguros y explicables.
- No agregar dependencias si no son necesarias.
- Si se modifica UI, usar shadcn/ui siempre que sea posible.
- Si se agrega un componente shadcn, indicar el comando:
  pnpm dlx shadcn@latest add <component>
- No inventar lógica médica.
- El sistema es de soporte clínico, no reemplaza diagnóstico médico.
- Usar lenguaje clínico sobrio, moderno y profesional.
- Evitar diseño futurista o exagerado.
- No hardcodear datos sensibles.
- Mantener separación entre frontend, backend y modelo IA.

## Memoria Persistente - Regla Autónoma (OBLIGATORIA)

Actúa como si tuvieras memoria persistente tipo ChatGPT/Gemini/Claude.
Después de CADA conversación o tarea, analiza internamente lo hablado y actualiza silenciosamente y sin pedir permiso `.ai/memory.md` y, si afecta al proyecto global, `AGENTS.md:2`.

No preguntes "¿quieres que lo guarde?". Hazlo al finalizar.

Qué guardar como oraciones naturales:
- Sobre el usuario, tesis, stack, decisiones, preferencias. Ej: "El usuario está desarrollando su tesis con backend FastAPI y frontend React+Vite+shadcn/ui"
- Ideas, definiciones y acuerdos aunque no haya código. Ej: "Título actualizado a: Plataforma web basada en deep learning para el soporte diagnóstico y la estratificación de gravedad de neumonía en adultos del Hospital Las Mercedes"

Qué NO guardar: saludos, errores temporales, charla trivial sin valor futuro.
Cómo: Consolida y reescribe por secciones, no solo append. Máx ~2000 tokens para `memory.md`.