# AI Agent Instructions

Este proyecto es una tesis de sistema web clínico para soporte al diagnóstico presuntivo de neumonía en adultos mediante deep learning.

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