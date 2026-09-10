import { CheckCircle2, XCircle, Info, Gauge } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type Crb65Detalle = Record<
  string,
  { valor: boolean | number | string; puntos: number; descripcion: string }
> | null

type Crb65ResultadoProps = {
  puntaje?: number | null
  gravedad?: string | null
  detalle?: Crb65Detalle
}

const RECOMENDACIONES: Record<string, string> = {
  Leve: "Manejo ambulatorio habitual, salvo criterio clínico en contra.",
  Moderado: "Considerar evaluación hospitalaria u observación estrecha.",
  Grave: "Hospitalización; evaluar ingreso a UCI.",
}

const estilosGravedad: Record<string, { panel: string; insignia: "leve" | "moderado" | "grave" }> = {
  Leve: {
    panel: "border-emerald-500/20 bg-emerald-500/[0.06]",
    insignia: "leve",
  },
  Moderado: {
    panel: "border-amber-500/20 bg-amber-500/[0.06]",
    insignia: "moderado",
  },
  Grave: {
    panel: "border-red-500/20 bg-red-500/[0.06]",
    insignia: "grave",
  },
}

type CriterioMeta = {
  clave: string
  nombre: string
  umbral: string
  formatearValor: (valor: boolean | number | string) => string
}

const CRITERIOS: CriterioMeta[] = [
  {
    clave: "confusion",
    nombre: "Confusión",
    umbral: "Confusión de aparición nueva",
    formatearValor: (v) => (v === true ? "Presente" : "Ausente"),
  },
  {
    clave: "respiracion",
    nombre: "Frecuencia respiratoria",
    umbral: "≥ 30 rpm",
    formatearValor: (v) => `${v} rpm`,
  },
  {
    clave: "presion",
    nombre: "Presión arterial",
    umbral: "PAS < 90 o PAD ≤ 60",
    formatearValor: (v) => `${v} mmHg`,
  },
  {
    clave: "edad",
    nombre: "Edad",
    umbral: "≥ 65 años",
    formatearValor: (v) => `${v} años`,
  },
]

/**
 * Muestra el resultado del score CRB-65 ya calculado por el backend.
 * Componente de solo lectura: los valores se corrigen en el registro
 * de enfermería, no desde aquí.
 */
export function Crb65Resultado({ puntaje, gravedad, detalle }: Crb65ResultadoProps) {
  if (puntaje == null || detalle == null) {
    return (
      <div className="flex gap-3 rounded-xl border border-dashed border-border/60 bg-muted/10 p-4 text-sm">
        <Info className="size-4 shrink-0 mt-0.5 text-muted-foreground/60" />
        <div className="space-y-1">
          <p className="font-bold text-foreground/85">CRB-65 no calculado</p>
          <p className="text-muted-foreground/75 leading-relaxed font-medium">
            Faltan datos del registro de enfermería (frecuencia respiratoria, presión
            arterial o edad). Complete los signos vitales para obtener el score.
          </p>
        </div>
      </div>
    )
  }

  const estilo = estilosGravedad[gravedad ?? ""] ?? estilosGravedad.Leve

  return (
    <div className="space-y-3">
      {/* Bloque superior: puntaje destacado */}
      <div className={cn("rounded-xl border p-4", estilo.panel)}>
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border border-border/40 bg-background">
            <Gauge className="size-4 text-muted-foreground/60" />
            <span className="text-2xl font-extrabold tabular-nums leading-none text-foreground/90">
              {puntaje}
              <span className="text-sm font-bold text-muted-foreground/60">/4</span>
            </span>
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight text-foreground/90">
                CRB-65: {puntaje} punto{puntaje === 1 ? "" : "s"}
              </span>
              <Badge variant={estilo.insignia}>{gravedad}</Badge>
            </div>
            <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed">
              {RECOMENDACIONES[gravedad ?? ""] ?? ""}
            </p>
          </div>
        </div>
      </div>

      {/* Bloque inferior: desglose por criterio */}
      <div className="grid gap-2">
        {CRITERIOS.map((criterio) => {
          const dato = detalle[criterio.clave]
          const puntos = dato?.puntos ?? 0
          const puntuo = puntos > 0

          return (
            <div
              key={criterio.clave}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-2.5",
                puntuo
                  ? "border-red-500/20 bg-red-500/[0.04]"
                  : "border-border/50 bg-muted/20"
              )}
            >
              {puntuo ? (
                <CheckCircle2 className="size-5 shrink-0 text-red-500" />
              ) : (
                <XCircle className="size-5 shrink-0 text-muted-foreground/40" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground/85 leading-tight">
                  {criterio.nombre}
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground/70 leading-relaxed">
                  Registrado:{" "}
                  <span className="font-bold text-foreground/80">
                    {dato ? criterio.formatearValor(dato.valor) : "—"}
                  </span>{" "}
                  · Umbral: {criterio.umbral}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-md px-2 py-1 font-mono text-xs font-bold tabular-nums",
                  puntuo
                    ? "bg-red-500/10 text-red-700 dark:text-red-400"
                    : "bg-muted/60 text-muted-foreground/70"
                )}
              >
                +{puntos}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-[11px] font-medium text-muted-foreground/60 leading-relaxed">
        Solo lectura. Si algún valor registrado es incorrecto, corríjalo en el registro
        de enfermería. Apoyo a la decisión, no reemplaza el criterio médico.
      </p>
    </div>
  )
}
