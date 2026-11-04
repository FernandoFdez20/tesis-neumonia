import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { obtenerEstiloEstadoClinico } from "@/lib/estado-clinico"
import type { AtencionResponse } from "@/services/atenciones.service"
import type { DiagnosticoResponse } from "@/types/diagnostico"

const coloresPrioridad: Record<string, string> = {
  Baja: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Moderada: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Alta: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  Crítica: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
}

export function ResumenCaso({ diagnostico, atencion }: {
  diagnostico: DiagnosticoResponse
  atencion: AtencionResponse | null
}) {
  return (
    <section aria-label="Resumen del caso">
      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-2 xl:grid-cols-[1.4fr_1.2fr_0.7fr_1fr]">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Paciente · AT-{String(diagnostico.atencion_medica_id).padStart(4, "0")}</p>
            <h2 className="text-base font-semibold leading-snug">{atencion?.paciente_nombre || "Paciente sin datos disponibles"}</h2>
            <p className="text-xs text-muted-foreground">
              DNI {atencion?.paciente_dni || "—"}{atencion?.paciente_edad != null && ` · ${atencion.paciente_edad} años`}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Resultado presuntivo de IA</p>
            <p className="text-base font-semibold leading-snug">
              {diagnostico.enfermo === true ? "Positivo para neumonía" : diagnostico.enfermo === false ? "Sin signos de neumonía" : "Pendiente de análisis"}
            </p>
            <p className="text-xs text-muted-foreground">Apoyo al criterio médico</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Prioridad final</p>
            <Badge variant="outline" className={coloresPrioridad[diagnostico.prioridad_final || ""]}>{diagnostico.prioridad_final || "Sin determinar"}</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Estado de validación</p>
            <Badge variant="outline" className={obtenerEstiloEstadoClinico(diagnostico.estado_validacion).badge}>{diagnostico.estado_validacion || "Sin estado"}</Badge>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
