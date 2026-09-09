import { useEffect, useState, useMemo } from "react"
import {
  Activity,
  CalendarClock,
  HeartPulse,
  Search,
  SlidersHorizontal,
  Stethoscope,
  Thermometer,
  Wind,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { listarAtenciones, type AtencionResponse } from "@/services/atenciones.service"
import { EvaluacionMedicaDialog } from "./evaluacion-medica-dialog"

const ITEMS_PER_PAGE = 6

function formatearFecha(fechaRegistro: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fechaRegistro))
}

function obtenerClaseSaturacion(saturacionO2: number | null | undefined) {
  if (!saturacionO2) return "text-foreground"
  if (saturacionO2 < 90) return "text-red-600"
  if (saturacionO2 < 94) return "text-amber-600"
  return "text-emerald-600"
}

function SignoVital({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Activity
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className={cn("mt-1 text-sm font-bold tabular-nums text-foreground/85", className)}>
        {value}
      </p>
    </div>
  )
}

function AtencionCard({ atencion, onAtender }: { atencion: AtencionResponse, onAtender: (a: AtencionResponse) => void }) {
  const esEnProceso = atencion.estado === "En proceso"

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-muted-foreground">
                AT-{String(atencion.id).padStart(4, '0')}
              </span>
              <Badge
                variant={atencion.paciente_estado_clinico === "Pendiente de evaluación" ? "secondary" : "outline"}
                className={
                  atencion.paciente_estado_clinico === "Pendiente de evaluación"
                    ? "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-400"
                    : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
                }
              >
                {atencion.paciente_estado_clinico || atencion.estado}
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-foreground/90 leading-tight">
              {atencion.paciente_nombre || `Paciente ${atencion.paciente_id}`}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground/80">
          <CalendarClock className="size-4" />
          {formatearFecha(atencion.fecha_registro)}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <SignoVital
              icon={Activity}
              label="Sat. O2"
              value={atencion.saturacion_o2 ? `${atencion.saturacion_o2}%` : "--"}
              className={obtenerClaseSaturacion(atencion.saturacion_o2)}
            />
            <SignoVital
              icon={Thermometer}
              label="Temp."
              value={atencion.temperatura ? `${atencion.temperatura}°C` : "--"}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SignoVital
              icon={HeartPulse}
              label="FC"
              value={atencion.frecuencia_cardiaca ? `${atencion.frecuencia_cardiaca} lpm` : "--"}
            />
            <SignoVital
              icon={Wind}
              label="FR"
              value={atencion.frecuencia_respiratoria ? `${atencion.frecuencia_respiratoria} rpm` : "--"}
            />
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
            Motivo de consulta
          </div>
          <p className="text-sm font-medium text-foreground/80 line-clamp-2">
            {atencion.sintomas_principales || "Sin registrar"}
          </p>
        </div>
      </CardContent>

      {esEnProceso && (
        <CardFooter className="border-t border-border/40 bg-muted/10 px-5 py-4">
          <Button 
            className="w-full gap-2 rounded-xl font-bold"
            onClick={() => onAtender(atencion)}
          >
            <Stethoscope className="size-4" />
            Atender
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

export function AtencionesList() {
  const [busqueda, setBusqueda] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState("todos")
  const [saturacionFiltro, setSaturacionFiltro] = useState("todos")
  const [paginaActual, setPaginaActual] = useState(1)

  const [atenciones, setAtenciones] = useState<AtencionResponse[]>([])
  const [cargando, setCargando] = useState(true)

  // Estado para el modal de evaluación
  const [atencionEvaluando, setAtencionEvaluando] = useState<AtencionResponse | null>(null)

  const load = async () => {
    try {
      const data = await listarAtenciones()
      setAtenciones(data)
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const atencionesFiltradas = useMemo(() => {
    return atenciones.filter((atencion) => {
      const textoBusqueda = busqueda.toLowerCase()
      const coincideBusqueda =
        (atencion.paciente_nombre || "").toLowerCase().includes(textoBusqueda) ||
        String(atencion.id).includes(busqueda) ||
        (atencion.sintomas_principales || "").toLowerCase().includes(textoBusqueda)
      const coincideEstado =
        estadoFiltro === "todos" || atencion.estado === estadoFiltro
      const coincideSaturacion =
        saturacionFiltro === "todos" ||
        (saturacionFiltro === "baja" && atencion.saturacion_o2 && atencion.saturacion_o2 < 94) ||
        (saturacionFiltro === "normal" && atencion.saturacion_o2 && atencion.saturacion_o2 >= 94)

      return coincideBusqueda && coincideEstado && coincideSaturacion
    })
  }, [atenciones, busqueda, estadoFiltro, saturacionFiltro])

  const totalPaginas = Math.ceil(atencionesFiltradas.length / ITEMS_PER_PAGE) || 1
  const atencionesPaginadas = atencionesFiltradas.slice(
    (paginaActual - 1) * ITEMS_PER_PAGE,
    paginaActual * ITEMS_PER_PAGE
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente, código o síntomas..."
            value={busqueda}
            onChange={(event) => {
              setBusqueda(event.target.value)
              setPaginaActual(1)
            }}
            className="pl-9"
          />
        </div>
        
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <Select
            value={estadoFiltro}
            onValueChange={(valor) => {
              setEstadoFiltro(valor)
              setPaginaActual(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="En proceso">En proceso</SelectItem>
              <SelectItem value="Finalizada">Finalizada</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={saturacionFiltro}
            onValueChange={(valor) => {
              setSaturacionFiltro(valor)
              setPaginaActual(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Sat. O2" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Cualquier Sat. O2</SelectItem>
              <SelectItem value="normal">Normal (≥94%)</SelectItem>
              <SelectItem value="baja">Baja (&lt;94%)</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" className="hidden shrink-0 sm:flex" title="Más filtros">
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {cargando ? (
        <div className="py-12 text-center text-sm font-medium text-muted-foreground/80">
          Cargando atenciones...
        </div>
      ) : atencionesPaginadas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/5 py-12 text-center text-sm font-medium text-muted-foreground/80">
          No se encontraron atenciones con los filtros actuales.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {atencionesPaginadas.map((atencion) => (
            <AtencionCard 
              key={atencion.id} 
              atencion={atencion} 
              onAtender={setAtencionEvaluando}
            />
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between border-t border-border/40 pt-4">
          <p className="text-sm font-medium text-muted-foreground/80">
            Página {paginaActual} de {totalPaginas}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="rounded-lg font-bold"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="rounded-lg font-bold"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <EvaluacionMedicaDialog 
        abierto={!!atencionEvaluando}
        atencion={atencionEvaluando}
        onCambioAbierto={(open) => !open && setAtencionEvaluando(null)}
        onEvaluacionCompletada={() => {
          load()
        }}
      />
    </div>
  )
}
