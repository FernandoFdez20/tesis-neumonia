import { ClipboardList, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AtencionResponse } from "@/services/atenciones.service"

function capitalizar(texto: string | null | undefined): string {
  if (!texto) return "—"
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}


function fechaCorta(fecha: string | null | undefined): string {
  if (!fecha) return "—"
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
      {children}
    </p>
  )
}

/**
 * Paciente y atención médica que originó el análisis.
 * Solo lectura.
 */
export function InfoPacienteAtencion({ atencion }: { atencion: AtencionResponse | null }) {
  if (!atencion) {
    return (
      <Card size="sm">
        <CardContent className="py-4">
          <p className="text-sm font-medium text-muted-foreground/75">
            Información clínica no disponible para esta atención.
          </p>
        </CardContent>
      </Card>
    )
  }

  const vitales: [string, string | number | null | undefined, string][] = [
    ["Temperatura", atencion.temperatura, "°C"],
    ["Frec. cardíaca", atencion.frecuencia_cardiaca, "lpm"],
    ["Frec. respiratoria", atencion.frecuencia_respiratoria, "rpm"],
    ["Sat. O2", atencion.saturacion_o2, "%"],
    ["Presión arterial", atencion.presion_arterial, "mmHg"],
    ["T. evolución", atencion.tiempo_evolucion_dias, "días"],
  ]

  return (
    <Card size="sm" className="overflow-hidden shadow-sm">
      <CardHeader className="bg-muted/10 border-b border-border/40 pb-3">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="size-3.5" />
            </div>
            <CardTitle className="text-base">Paciente y Atención</CardTitle>
          </div>
          <Badge variant="outline" className="font-mono bg-background text-xs">
            AT-{String(atencion.id).padStart(4, "0")}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4">
        {/* Paciente Header */}
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-primary shadow-sm">
            <User className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-foreground leading-tight truncate">
              {atencion.paciente_nombre || `Paciente ${atencion.paciente_id}`}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="secondary" className="font-medium text-[10px] px-1.5 py-0 h-4 leading-4">
                {atencion.paciente_edad != null ? `${atencion.paciente_edad} años` : "—"}
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">
                {capitalizar(atencion.paciente_sexo)}
                {atencion.paciente_dni ? ` • DNI ${atencion.paciente_dni}` : ""}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <Etiqueta>Ingreso</Etiqueta>
            <p className="mt-0.5 text-xs font-semibold text-foreground">
              {fechaCorta(atencion.fecha_registro)}
            </p>
          </div>
        </div>

        {/* Vitales Grid */}
        <div>
          <Etiqueta>Signos vitales al ingreso</Etiqueta>
          <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {vitales.map(([etiqueta, valor, unidad]) => (
              <div key={etiqueta} className="flex flex-col justify-center rounded-md border border-border/50 bg-muted/20 px-2 py-1.5">
                <span className="text-[10px] font-medium text-muted-foreground">{etiqueta}</span>
                <span className="mt-0.5 text-[13px] font-semibold text-foreground">
                  {valor != null && valor !== "" ? (
                    <>
                      {valor} <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unidad}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Motivo + examen físico */}
        <div className="grid gap-3 sm:grid-cols-2 pt-3 border-t border-border/40">
          <div className="border-l-2 border-primary/20 pl-2.5">
            <Etiqueta>Motivo de consulta</Etiqueta>
            <p className="mt-1 text-xs text-foreground/80 leading-relaxed italic">
              "{atencion.sintomas_principales || "No registrado"}"
            </p>
          </div>
          <div className="border-l-2 border-primary/20 pl-2.5">
            <Etiqueta>Examen físico</Etiqueta>
            <p className="mt-1 text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
              {atencion.examen_fisico || "No registrado"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
