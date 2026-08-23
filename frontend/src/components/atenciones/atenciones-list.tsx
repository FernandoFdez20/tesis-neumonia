import { useMemo, useState } from "react"
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
import { Link } from "react-router-dom"

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
import { atencionesMedicasMock } from "@/components/atenciones/datos-atenciones"
import type { AtencionMedica } from "@/components/atenciones/datos-atenciones"
import { PATHS } from "@/routes/paths"

const ITEMS_PER_PAGE = 6

function formatearFecha(fechaRegistro: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fechaRegistro.replace(" ", "T")))
}

function obtenerClaseSaturacion(saturacionO2: number) {
  if (saturacionO2 < 90) {
    return "text-red-600"
  }

  if (saturacionO2 < 94) {
    return "text-amber-600"
  }

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

function AtencionCard({ atencion }: { atencion: AtencionMedica }) {
  const esEnProceso = atencion.estado === "En proceso"

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-muted-foreground">
                {atencion.codigo}
              </span>
              <Badge
                variant={esEnProceso ? "secondary" : "outline"}
                className={
                  esEnProceso
                    ? "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-400"
                    : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
                }
              >
                {atencion.estado}
              </Badge>
            </div>
            <CardTitle className="line-clamp-1 text-base font-bold">
              {atencion.paciente}
            </CardTitle>
            <p className="text-sm font-medium text-muted-foreground/75">
              DNI {atencion.dni} · Paciente #{atencion.pacienteId}
            </p>
          </div>
          <div className="rounded-xl border border-primary/15 bg-primary/8 p-2 text-primary">
            <Stethoscope className="size-4.5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/75">
          <CalendarClock className="size-4" />
          <span className="font-medium">{formatearFecha(atencion.fechaRegistro)}</span>
          <span className="text-muted-foreground/35">·</span>
          <span>{atencion.responsable}</span>
        </div>

        <p className="line-clamp-2 min-h-10 text-sm leading-relaxed text-foreground/80">
          {atencion.sintomasPrincipales}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <SignoVital
            icon={Thermometer}
            label="Temp."
            value={`${atencion.temperatura.toFixed(1)} °C`}
          />
          <SignoVital
            icon={HeartPulse}
            label="FC"
            value={`${atencion.frecuenciaCardiaca} lpm`}
          />
          <SignoVital
            icon={Wind}
            label="FR"
            value={`${atencion.frecuenciaRespiratoria} rpm`}
          />
          <SignoVital
            icon={Activity}
            label="Sat. O2"
            value={`${atencion.saturacionO2} %`}
            className={obtenerClaseSaturacion(atencion.saturacionO2)}
          />
        </div>

        <div className="grid grid-cols-2 gap-y-2 border-t border-border/50 pt-3 text-sm">
          <span className="text-muted-foreground">Presión arterial</span>
          <span className="text-right font-semibold tabular-nums">
            {atencion.presionArterial}
          </span>
          <span className="text-muted-foreground">Evolución</span>
          <span className="text-right font-semibold">
            {atencion.tiempoEvolucionDias} días
          </span>
        </div>
      </CardContent>

      {esEnProceso && (
        <CardFooter className="border-t border-border/40 bg-muted/10 px-5 py-4">
          <Button asChild className="w-full gap-2 rounded-xl font-bold">
            <Link to={`${PATHS.DIAGNOSIS}/${atencion.codigo}`}>
              <Stethoscope className="size-4" />
              Atender
            </Link>
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

  const atencionesFiltradas = useMemo(() => {
    return atencionesMedicasMock.filter((atencion) => {
      const textoBusqueda = busqueda.toLowerCase()
      const coincideBusqueda =
        atencion.paciente.toLowerCase().includes(textoBusqueda) ||
        atencion.dni.includes(busqueda) ||
        atencion.codigo.toLowerCase().includes(textoBusqueda) ||
        atencion.sintomasPrincipales.toLowerCase().includes(textoBusqueda)
      const coincideEstado =
        estadoFiltro === "todos" || atencion.estado === estadoFiltro
      const coincideSaturacion =
        saturacionFiltro === "todos" ||
        (saturacionFiltro === "baja" && atencion.saturacionO2 < 94) ||
        (saturacionFiltro === "normal" && atencion.saturacionO2 >= 94)

      return coincideBusqueda && coincideEstado && coincideSaturacion
    })
  }, [busqueda, estadoFiltro, saturacionFiltro])

  const totalPaginas = Math.ceil(atencionesFiltradas.length / ITEMS_PER_PAGE)
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
            placeholder="Buscar por paciente, DNI, código o síntomas..."
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
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Saturación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Toda saturación</SelectItem>
              <SelectItem value="baja">Menor a 94%</SelectItem>
              <SelectItem value="normal">94% o más</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" title="Filtros">
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {atencionesPaginadas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 py-12 text-center text-sm font-medium text-muted-foreground">
          No se encontraron atenciones médicas con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {atencionesPaginadas.map((atencion) => (
            <AtencionCard key={atencion.id} atencion={atencion} />
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaginaActual((pagina) => Math.max(1, pagina - 1))}
            disabled={paginaActual === 1}
          >
            Anterior
          </Button>
          <span className="mx-2 text-sm font-medium text-muted-foreground">
            Página {paginaActual} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPaginaActual((pagina) => Math.min(totalPaginas, pagina + 1))
            }
            disabled={paginaActual === totalPaginas}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
