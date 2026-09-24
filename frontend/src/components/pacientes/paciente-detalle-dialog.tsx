import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarClock, ChevronRight, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  listarAtencionesPorPaciente,
  type AtencionResponse,
} from "@/services/atenciones.service"
import { getDiagnosticoPorAtencion } from "@/services/diagnosticos.service"
import type { DiagnosticoResponse } from "@/types/diagnostico"
import { PATHS } from "@/routes/paths"
import type { PacienteResponse } from "@/services/pacientes.service"

type PacienteDetalleDialogProps = {
  paciente: PacienteResponse | null
  abierto: boolean
  onCambioAbierto: (abierto: boolean) => void
}

export function calcularEdad(fechaNacimiento: string): number | null {
  if (!fechaNacimiento) return null
  const hoy = new Date()
  const fechaNac = new Date(fechaNacimiento)
  if (Number.isNaN(fechaNac.getTime())) return null
  let edad = hoy.getFullYear() - fechaNac.getFullYear()
  const m = hoy.getMonth() - fechaNac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--
  }
  return edad
}

export function capitalizar(texto: string | null | undefined): string {
  if (!texto) return "—"
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "—"
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {etiqueta}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground/85">{valor}</p>
    </div>
  )
}

export function PacienteDetalleDialog({
  paciente,
  abierto,
  onCambioAbierto,
}: PacienteDetalleDialogProps) {
  const navigate = useNavigate()
  const [atenciones, setAtenciones] = useState<AtencionResponse[]>([])
  const [diagnosticos, setDiagnosticos] = useState<Record<number, DiagnosticoResponse>>({})
  const [cargandoAtenciones, setCargandoAtenciones] = useState(false)

  function verDiagnostico(atencionId: number) {
    onCambioAbierto(false)
    navigate(PATHS.RESULTS, { state: { atencionId } })
  }

  useEffect(() => {
    if (!abierto || !paciente) return
    let cancelado = false
    setCargandoAtenciones(true)
    setDiagnosticos({})
    listarAtencionesPorPaciente(paciente.id)
      .then(async (lista) => {
        if (cancelado) return
        setAtenciones(lista)
        // Se intenta traer el diagnóstico de TODAS las atenciones: si existe (200) hay caso para revisar,
        // si da 404 es que aún no tiene Rx. Así el botón no depende del campo de estado del backend.
        const resultados = await Promise.allSettled(
          lista.map((a) => getDiagnosticoPorAtencion(a.id))
        )
        if (cancelado) return
        const mapa: Record<number, DiagnosticoResponse> = {}
        resultados.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value) mapa[lista[i].id] = r.value
        })
        setDiagnosticos(mapa)
      })
      .catch(() => {
        if (!cancelado) setAtenciones([])
      })
      .finally(() => {
        if (!cancelado) setCargandoAtenciones(false)
      })
    return () => {
      cancelado = true
    }
  }, [abierto, paciente])

  if (!paciente) return null

  const edad = calcularEdad(paciente.fecha_nacimiento)

  return (
    <Dialog open={abierto} onOpenChange={onCambioAbierto}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden">
        <div className="bg-primary/5 px-6 py-4 border-b">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="bg-background font-mono">
                DNI {paciente.dni}
              </Badge>
              <Badge variant={paciente.en_atencion ? "default" : "secondary"}>
                {paciente.en_atencion ? "En atención" : "Sin atención activa"}
              </Badge>
            </div>
            <DialogTitle className="text-xl flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="size-4" />
              </span>
              {paciente.nombres_apellidos}
            </DialogTitle>
            <DialogDescription>
              {edad != null ? `${edad} años` : "Edad no disponible"} ·{" "}
              {capitalizar(paciente.sexo)}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5 max-h-[62vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Dato etiqueta="Fecha de nacimiento" valor={formatearFecha(paciente.fecha_nacimiento)} />
            <Dato etiqueta="Registro" valor={formatearFecha(paciente.created_at)} />
            <Dato etiqueta="Última atención" valor={formatearFecha(paciente.ultima_atencion)} />
            <Dato
              etiqueta="Atenciones"
              valor={cargandoAtenciones ? "Cargando..." : `${atenciones.length} registrada(s)`}
            />
          </div>

          {(paciente.antecedentes_familiares || paciente.otros_antecedentes) && (
            <>
              <Separator className="bg-border/50" />
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Antecedentes
                </h4>
                {paciente.antecedentes_familiares && (
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    <span className="font-bold">Familiares: </span>
                    {paciente.antecedentes_familiares}
                  </p>
                )}
                {paciente.enfermedades && paciente.enfermedades.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {paciente.enfermedades.map((e) => (
                      <Badge key={e.id} variant="outline">
                        {e.nombre}
                      </Badge>
                    ))}
                  </div>
                )}
                {paciente.otros_antecedentes && (
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    <span className="font-bold">Otros: </span>
                    {paciente.otros_antecedentes}
                  </p>
                )}
              </div>
            </>
          )}

          <Separator className="bg-border/50" />

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Historial clínico de diagnósticos
            </h4>
            {cargandoAtenciones ? (
              <p className="text-sm text-muted-foreground">Cargando historial...</p>
            ) : atenciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este paciente aún no tiene atenciones registradas.
              </p>
            ) : (
              <div className="space-y-2">
                {atenciones.map((a) => {
                  const dx = diagnosticos[a.id]
                  return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CalendarClock className="size-4 shrink-0 text-muted-foreground/60" />
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold text-muted-foreground">
                          AT-{String(a.id).padStart(4, "0")} · {formatearFecha(a.fecha_registro)}
                        </p>
                        <p className="text-xs text-muted-foreground/80 truncate">
                          {a.sintomas_principales || "Sin motivo registrado"}
                        </p>
                        {dx && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <Badge variant={dx.enfermo ? "grave" : "leve"}>
                              {dx.enfermo ? "Positivo" : "Negativo"}
                            </Badge>
                            {dx.prioridad_final && (
                              <Badge variant="outline">{dx.prioridad_final}</Badge>
                            )}
                            {dx.estado_validacion && (
                              <Badge variant="pendiente">{dx.estado_validacion}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      {dx ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs font-bold text-primary hover:text-primary/80"
                          onClick={() => verDiagnostico(a.id)}
                          title="Abrir el resultado IA, prioridad y validación de este caso anterior"
                        >
                          Ver diagnóstico
                          <ChevronRight className="size-3.5" />
                        </Button>
                      ) : (
                        <span className="text-[11px] font-medium text-muted-foreground/50">
                          {a.paciente_estado_clinico || a.estado}
                        </span>
                      )}
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="bg-muted/10 px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onCambioAbierto(false)} className="rounded-xl font-bold">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
