type EstiloEstado = { badge: string; boton: string }

const ESTILOS_ESTADO: Record<string, EstiloEstado> = {
  "Pendiente de evaluación": {
    badge: "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
    boton: "bg-amber-700 text-white hover:bg-amber-800 active:bg-amber-900 focus-visible:ring-amber-500/40",
  },
  "Derivado a radiografía": {
    badge: "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
    boton: "bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900 focus-visible:ring-blue-500/40",
  },
  "Diagnostico pendiente": {
    badge: "border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200",
    boton: "bg-orange-700 text-white hover:bg-orange-800 active:bg-orange-900 focus-visible:ring-orange-500/40",
  },
  "Pendiente de validación": {
    badge: "border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200",
    boton: "bg-violet-700 text-white hover:bg-violet-800 active:bg-violet-900 focus-visible:ring-violet-500/40",
  },
  Validado: {
    badge: "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    boton: "bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 focus-visible:ring-emerald-500/40",
  },
}

const ESTILO_NEUTRO: EstiloEstado = {
  badge: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  boton: "bg-slate-700 text-white hover:bg-slate-800 active:bg-slate-900 focus-visible:ring-slate-500/40",
}

export function obtenerEstiloEstadoClinico(estado: string | null | undefined): EstiloEstado {
  return (estado && ESTILOS_ESTADO[estado]) || ESTILO_NEUTRO
}
