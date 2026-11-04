type EstiloEstado = { badge: string; boton: string }

const ESTILOS_ESTADO: Record<string, EstiloEstado> = {
  "Pendiente de evaluación": {
    badge: "border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200",
    boton: "border-orange-200 bg-orange-100 text-orange-800 hover:bg-orange-200 active:bg-orange-200 focus-visible:ring-orange-300/50 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200 dark:hover:bg-orange-900 dark:active:bg-orange-900",
  },
  "Derivado a radiografía": {
    badge: "border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
    boton: "border-sky-200 bg-sky-100 text-sky-800 hover:bg-sky-200 active:bg-sky-200 focus-visible:ring-sky-300/50 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200 dark:hover:bg-sky-900 dark:active:bg-sky-900",
  },
  "Diagnostico pendiente": {
    badge: "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
    boton: "border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-200 active:bg-amber-200 focus-visible:ring-amber-300/50 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900 dark:active:bg-amber-900",
  },
  "Pendiente de validación": {
    badge: "border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200",
    boton: "border-violet-200 bg-violet-100 text-violet-800 hover:bg-violet-200 active:bg-violet-200 focus-visible:ring-violet-300/50 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200 dark:hover:bg-violet-900 dark:active:bg-violet-900",
  },
  Validado: {
    badge: "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    boton: "border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 active:bg-emerald-200 focus-visible:ring-emerald-300/50 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900 dark:active:bg-emerald-900",
  },
}

const ESTILO_NEUTRO: EstiloEstado = {
  badge: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  boton: "border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-200 focus-visible:ring-slate-300/50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 dark:active:bg-slate-900",
}

export function obtenerEstiloEstadoClinico(estado: string | null | undefined): EstiloEstado {
  return (estado && ESTILOS_ESTADO[estado]) || ESTILO_NEUTRO
}
