import { Flag, Info } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { DiagnosticoResponse } from "@/types/diagnostico"
import type { AtencionResponse } from "@/services/atenciones.service"

type EstiloPrioridad = {
  borde: string
  insignia: string
  icono: string
}

const ESTILOS: Record<string, EstiloPrioridad> = {
  Baja: {
    borde: "border-l-emerald-500/70",
    insignia:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-400",
    icono:
      "bg-emerald-500/8 text-emerald-600 border-emerald-500/15 dark:bg-emerald-950/35 dark:text-emerald-400",
  },
  Moderada: {
    borde: "border-l-amber-500/70",
    insignia:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-400",
    icono:
      "bg-amber-500/8 text-amber-600 border-amber-500/15 dark:bg-amber-950/35 dark:text-amber-400",
  },
  Alta: {
    borde: "border-l-orange-500/70",
    insignia:
      "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:border-orange-500/30 dark:bg-orange-950/20 dark:text-orange-400",
    icono:
      "bg-orange-500/8 text-orange-600 border-orange-500/15 dark:bg-orange-950/35 dark:text-orange-400",
  },
  "Crítica": {
    borde: "border-l-red-500/70",
    insignia:
      "border-red-500/20 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:bg-red-950/20 dark:text-red-400",
    icono:
      "bg-red-500/8 text-red-600 border-red-500/15 dark:bg-red-950/35 dark:text-red-400",
  },
}

const ESTILO_NEUTRO: EstiloPrioridad = {
  borde: "border-l-muted-foreground/30",
  insignia: "",
  icono: "bg-muted/40 text-muted-foreground/60 border-border/50",
}

type PrioridadFinalProps = {
  diagnostico: DiagnosticoResponse
  atencion: AtencionResponse | null
}

/**
 * Muestra la prioridad final ya calculada por el backend
 * (fusión CRB-65 + resultado de IA sobre la imagen de referencia).
 * Componente de solo lectura.
 */
export function PrioridadFinal({ diagnostico, atencion }: PrioridadFinalProps) {
  const prioridad = diagnostico.prioridad_final

  if (!prioridad) {
    return (
      <Card size="sm" className="border-l-[3px] border-l-muted-foreground/30">
        <CardContent className="flex gap-3 pt-5">
          <Info className="size-4 shrink-0 mt-0.5 text-muted-foreground/60" />
          <div className="text-sm space-y-1">
            <p className="font-bold text-foreground/90">Prioridad sin determinar</p>
            <p className="text-muted-foreground/75 leading-relaxed font-medium">
              Falta información para determinar la prioridad (CRB-65 no calculado
              o sin imágenes procesadas).
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const estilo = ESTILOS[prioridad] ?? ESTILO_NEUTRO
  const detalle = diagnostico.prioridad_detalle

  // Solo la combinación real de este paciente (detalle o respaldos, sin recalcular).
  const crbGravedad = detalle?.crb65_gravedad ?? atencion?.crb65_gravedad ?? "—"
  const crbPuntaje = detalle?.crb65_puntaje ?? atencion?.crb65_puntaje
  const resultadoIa =
    detalle?.resultado_ia ?? (diagnostico.enfermo === true ? "Positivo" : diagnostico.enfermo === false ? "Negativo" : "—")

  // Probabilidad de la imagen de referencia (la peor vista, según el backend).
  const imagenes = diagnostico.imagenes ?? []
  const imagenRef =
    imagenes.find((i) => i.id === diagnostico.imagen_referencia_id) ??
    [...imagenes]
      .filter((i) => i.probabilidad_ia != null)
      .sort((a, b) => Number(b.probabilidad_ia) - Number(a.probabilidad_ia))[0]
  const probRef = imagenRef?.probabilidad_ia != null ? Number(imagenRef.probabilidad_ia) * 100 : null

  return (
    <Card size="sm" className={cn("border-l-[3px] hover:border-l-[4px]", estilo.borde)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className={cn("flex size-9 items-center justify-center rounded-xl border", estilo.icono)}>
            <Flag className="size-[18px]" strokeWidth={1.8} />
          </div>
          <div>
            <CardTitle>Prioridad final</CardTitle>
            <CardDescription>Sugerencia de orden de atención</CardDescription>
          </div>
        </div>
        <CardAction className="m-0">
          <Badge className={cn("font-bold", estilo.insignia)}>{prioridad}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl border border-border/40 bg-muted/20 px-3.5 py-3 font-mono text-xs leading-relaxed text-foreground/80">
          CRB-65: <span className="font-bold">{crbGravedad}</span>
          {crbPuntaje != null && <span> ({crbPuntaje} pts)</span>}
          {" + Imagen: "}
          <span className="font-bold">{resultadoIa}</span>
          {probRef != null && <span> ({probRef.toFixed(2)}%)</span>}
          {" → "}
          <span className="font-bold">{prioridad}</span>
        </div>
        <p className="text-xs text-muted-foreground/70 font-medium leading-relaxed">
          Sugerencia de orden de atención basada en la combinación del resultado clínico
          (CRB-65) y el de imagen. No reemplaza el criterio médico final.
        </p>
      </CardContent>
    </Card>
  )
}
