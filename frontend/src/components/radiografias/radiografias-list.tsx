import { useEffect, useState, useMemo } from "react"
import { CalendarClock, Search, Upload, Activity } from "lucide-react"
import { useNavigate } from "react-router-dom"

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
import { listarAtenciones, type AtencionResponse } from "@/services/atenciones.service"
import { PATHS } from "@/routes/paths"

const ITEMS_PER_PAGE = 6

function formatearFecha(fechaRegistro: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fechaRegistro))
}

function RadiografiaCard({ atencion }: { atencion: AtencionResponse }) {
  const navigate = useNavigate()

  return (
    <Card className="transition-all duration-300 hover:shadow-md border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-muted-foreground">
                AT-{String(atencion.id).padStart(4, '0')}
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400">
                {atencion.paciente_estado_clinico}
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
          Derivado el: {formatearFecha(atencion.fecha_registro)}
        </div>
      </CardContent>

      <CardFooter className="border-t border-border/40 bg-muted/10 px-5 py-4">
        <Button 
          className="w-full gap-2 rounded-xl font-bold shadow-md shadow-primary/10"
          variant={atencion.paciente_estado_clinico !== "Derivado a radiografía" ? "secondary" : "default"}
          onClick={() => navigate(PATHS.UPLOAD_RADIOGRAPHY.replace(":atencionId", String(atencion.id)))}
        >
          {atencion.paciente_estado_clinico === "Derivado a radiografía" ? (
            <>
              <Upload className="size-4" />
              Cargar
            </>
          ) : ["Pendiente de validación", "Validado"].includes(atencion.paciente_estado_clinico || "") ? (
            <>Ver</>
          ) : (
            <>Ver / Recargar</>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export function RadiografiasList() {
  const [busqueda, setBusqueda] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)

  const [mostrarSoloPendientes, setMostrarSoloPendientes] = useState(true)

  const [atenciones, setAtenciones] = useState<AtencionResponse[]>([])
  const [cargando, setCargando] = useState(true)

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

  // Filtrar según el estado seleccionado
  const filtradas = useMemo(() => {
    return atenciones.filter((a) => {
      const estado = a.paciente_estado_clinico;
      if (mostrarSoloPendientes) {
        if (estado !== "Derivado a radiografía") return false
      } else {
        const estadosValidos = [
          "Derivado a radiografía",
          "Diagnostico pendiente",
          "Pendiente de validación",
          "Validado"
        ]
        if (!estadosValidos.includes(estado || "")) return false
      }

      if (busqueda) {
        const query = busqueda.toLowerCase()
        const matchNombre = a.paciente_nombre?.toLowerCase().includes(query)
        const matchId = String(a.id).includes(query)
        if (!matchNombre && !matchId) return false
      }

      return true
    })
  }, [atenciones, busqueda, mostrarSoloPendientes])

  const totalPaginas = Math.ceil(filtradas.length / ITEMS_PER_PAGE) || 1
  const atencionesPaginadas = filtradas.slice(
    (paginaActual - 1) * ITEMS_PER_PAGE,
    paginaActual * ITEMS_PER_PAGE
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          <Input
            placeholder="Buscar por paciente o código..."
            className="pl-9 bg-background shadow-sm border-border/50 focus-visible:ring-primary/20 h-10 rounded-xl"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPaginaActual(1)
            }}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={mostrarSoloPendientes ? "default" : "outline"} 
            onClick={() => {
              setMostrarSoloPendientes(true)
              setPaginaActual(1)
            }}
            className="rounded-xl h-10"
          >
            Pendientes
          </Button>
          <Button 
            variant={!mostrarSoloPendientes ? "default" : "outline"} 
            onClick={() => {
              setMostrarSoloPendientes(false)
              setPaginaActual(1)
            }}
            className="rounded-xl h-10"
          >
            Todas
          </Button>
        </div>
      </div>

      {cargando ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] rounded-xl bg-muted/30 animate-pulse border border-border/40" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed bg-muted/10">
          <div className="size-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
            <Activity className="size-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            {mostrarSoloPendientes ? "No hay pacientes pendientes" : "No hay pacientes con radiografías"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1">
            {mostrarSoloPendientes
              ? "Actualmente no hay pacientes derivados al área de rayos X."
              : "Actualmente no hay pacientes derivados al área de rayos X ni con radiografías cargadas."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {atencionesPaginadas.map((atencion) => (
            <RadiografiaCard 
              key={atencion.id} 
              atencion={atencion} 
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
    </div>
  )
}
