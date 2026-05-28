# UI Rules

El sistema debe verse moderno, clínico y confiable.

## Estilo visual
- Moderno, no futurista.
- Sobrio, limpio y profesional.
- Inspiración: sistemas clínicos modernos, dashboards médicos, shadcn/ui bien aplicado.
- Evitar apariencia de "cajitas planas".
- Usar sombras suaves, bordes redondeados y buen espaciado.
- Mantener sensación viva con microinteracciones sutiles.

## Componentes
Usar shadcn/ui como base visual principal.

Si se necesita un componente nuevo, usar:
pnpm dlx shadcn@latest add <component>

Componentes recomendados:
- button
- card
- dialog
- input
- label
- select
- textarea
- table
- badge
- toast/sonner (importante para cada acción de usuario con el sistema)
- tabs
- dropdown-menu
- alert-dialog
- skeleton

## Formularios
- Usar Dialog para formularios pequeños como "Nuevo Paciente".
- Validar campos visibles.
- Mostrar errores claros.
- Botones principales:
  - Guardar
  - Cancelar

## UX clínica
- No saturar con colores.
- Prioridad alta puede usar indicadores visuales claros.
- Los resultados del modelo deben dejar claro que son presuntivos.
- No usar textos alarmistas.
- Evitar animaciones exageradas.