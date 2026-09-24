import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarClock, ChevronRight, History, Search, User, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-animation"
import { PATHS } from "@/routes/paths"
import { listarPacientes, type PacienteResponse } from "@/services/pacientes.service"
import {
  listarAtencionesPorPaciente,
  type AtencionResponse,
} from "@/services/atenciones.service"
import { getDiagnosticoPorAtencion } from "@/services/diagnosticos.service"
import type { DiagnosticoResponse } from "@/types/diagnostico"
import { calcularEdad } from "@/components/pacientes/paciente-detalle-dialog"

type FiltroHistorial = "todos" | "con-diagnostico" | "validados" | "pendientes"

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

export default function HistorialPage() {
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState("")
  const [sugerencias, setSugerencias] = useState<PacienteResponse[]>([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [paciente, setPaciente] = useState<PacienteResponse | null>(null)
  const [atenciones, setAtenciones] = useState<AtencionResponse[]>([])
  const [diagnosticos, setDiagnosticos] = useState<Record<number, DiagnosticoResponse>>({})
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [filtro, setFiltro] = useState<FiltroHistorial>("todos")
  const cajaRef = useRef<HTMLDivElement>(null)

  // Sugerencias dinámicas por DNI o nombre mientras se escribe.
  useEffect(() => {
    const texto = busqueda.trim()
    if (texto.length < 2) {
      setSugerencias([])
      setMostrarSugerencias(false)
      return
    }
    const t = setTimeout(async () => {
      try {
        setBuscando(true)
        const resp = await listarPacientes({ buscar: texto, page: 1, page_size: 6 })
        setSugerencias(resp.items)
        setMostrarSugerencias(true)
      } catch {
        setSugerencias([])
      } finally {
        setBuscando(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [busqueda])

  // Cerrar sugerencias al hacer clic fuera.
  useEffect(() => {
    function alClicFuera(e: MouseEvent) {
      if (cajaRef.current && !cajaRef.current.contains(e.target as Node)) {
        setMostrarSugerencias(false)
      }
    }
    document.addEventListener("mousedown", alClicFuera)
    return () => document.removeEventListener("mousedown", alClicFuera)
  }, [])

  async function elegirPaciente(p: PacienteResponse) {
    setPaciente(p)
    setBusqueda(`${p.nombres_apellidos} · ${p.dni}`)
    setMostrarSugerencias(false)
    setFiltro("todos")
    setCargandoHistorial(true)
    setDiagnosticos({})
    try {
      const lista = await listarAtencionesPorPaciente(p.id)
      setAtenciones(lista)
      const resultados = await Promise.allSettled(
        lista.map((a) => getDiagnosticoPorAtencion(a.id))
      )
      const mapa: Record<number, DiagnosticoResponse> = {}
      resultados.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value) mapa[lista[i].id] = r.value
      })
      setDiagnosticos(mapa)
    } catch {
      setAtenciones([])
    } finally {
      setCargandoHistorial(false)
    }
  }

  function limpiar() {
    setBusqueda("")
    setSugerencias([])
    setPaciente(null)
    setAtenciones([])
    setDiagnosticos({})
    setFiltro("todos")
  }

  const totalDx = Object.keys(diagnosticos).length
  const items = atenciones.filter((a) => {
    const dx = diagnosticos[a.id]
    if (filtro === "con-diagnostico") return !!dx
    if (filtro === "validados") return dx?.estado_validacion === "Validado"
    if (filtro === "pendientes") return !!dx && dx.estado_validacion !== "Validado"
    return true
  })

  const edad = paciente ? calcularEdad(paciente.fecha_nacimiento) : null

  return (
    <div className="space-y-8">
      <StaggerContainer className="space-y-2 pb-1" delay={80}>
        <StaggerItem index={0}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary/70 leading-none">
            Historial clínico
          </p>
        </StaggerItem>
        <StaggerItem index={1}>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground/90 leading-tight flex items-center gap-2">
            <History className="size-6 text-primary" />
            Historial de diagnósticos por paciente
          </h1>
        </StaggerItem>
        <StaggerItem index={2}>
          <p className="max-w-3xl text-base text-muted-foreground/70 leading-relaxed font-medium">
            Busca por DNI o nombre, elige un paciente y revisa sus casos anteriores con su resultado.
          </p>
        </StaggerItem>
      </StaggerContainer>

      {/* Buscador dinámico */}
      <div ref={cajaRef} className="relative max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onFocus={() => sugerencias.length > 0 && setMostrarSugerencias(true)}
            placeholder="Escribe DNI o nombre... (mín. 2 letras)"
            className="pl-9 pr-9"
          />
          {busqueda && (
            <button
              onClick={limpiar}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
              title="Limpiar búsqueda"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {mostrarSugerencias && (
          <Card className="absolute z-20 mt-2 w-full overflow-hidden p-0">
            <CardContent className="p-0">
              {buscando ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">Buscando...</p>
              ) : sugerencias.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">Sin coincidencias.</p>
              ) : (
                sugerencias.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => elegirPaciente(s)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent/60"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <User className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-foreground/90">
                        {s.nombres_apellidos}
                      </span>
                      <span className="block font-mono text-xs text-muted-foreground">
                        DNI {s.dni}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Paciente elegido + filtros */}
      {paciente && (
        <Card className="min-w-0 max-w-full overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <CardTitle className="truncate text-lg">{paciente.nombres_apellidos}</CardTitle>
                <CardDescription className="break-words">
                  DNI {paciente.dni} · {edad != null ? `${edad} años` : "Edad no disponible"} ·{" "}
                  {atenciones.length} atención(es) · {totalDx} con diagnóstico
                </CardDescription>
              </div>
              <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1">
                {(
                  [
                    ["todos", "Todos"],
                    ["con-diagnostico", "Con diagnóstico"],
                    ["pendientes", "Pendientes"],
                    ["validados", "Validados"],
                  ] as [FiltroHistorial, string][]
                ).map(([v, etiqueta]) => (
                  <Button
                    key={v}
                    variant={filtro === v ? "default" : "outline"}
                    size="sm"
                    className="shrink-0 rounded-lg font-bold"
                    onClick={() => setFiltro(v)}
                  >
                    {etiqueta}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-w-0 space-y-2 overflow-hidden">
            {cargandoHistorial ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Cargando historial...
              </p>
            ) : items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sin casos para este filtro.
              </p>
            ) : (
              items.map((a) => {
                const dx = diagnosticos[a.id]
                return (
                  <div
                    key={a.id}
                    className="flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-border/50 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" />
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-bold text-muted-foreground">
                          AT-{String(a.id).padStart(4, "0")} · {formatearFecha(a.fecha_registro)}
                        </p>
                        <p className="line-clamp-2 break-words text-sm font-medium text-foreground/85">
                          {a.sintomas_principales || "Sin motivo registrado"}
                        </p>
                        {dx ? (
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
                        ) : (
                          <p className="mt-1 text-[11px] text-muted-foreground/60">
                            {a.paciente_estado_clinico || a.estado}
                          </p>
                        )}
                      </div>
                    </div>
                    {dx ? (
                      <Button
                        size="sm"
                        className="w-fit shrink-0 rounded-lg font-bold"
                        onClick={() =>
                          navigate(PATHS.RESULTS, { state: { atencionId: a.id } })
                        }
                      >
                        Ver diagnóstico
                        <ChevronRight className="size-3.5" />
                      </Button>
                    ) : (
                      <span className="shrink-0 text-[11px] font-medium text-muted-foreground/50">
                        Sin diagnóstico
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
