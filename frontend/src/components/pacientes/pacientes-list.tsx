import { useEffect, useRef, useState } from "react"
import { Search, User } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import { listarPacientes, type PacienteResponse } from "@/services/pacientes.service"
import {
  PacienteDetalleDialog,
  calcularEdad,
  capitalizar,
} from "@/components/pacientes/paciente-detalle-dialog"

const PAGE_SIZE = 6

function formatearFechaCorta(fecha: string | null | undefined): string {
  if (!fecha) return "—"
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

export function PacientesList() {
  const [busqueda, setBusqueda] = useState("")
  const [busquedaDebounce, setBusquedaDebounce] = useState("")
  const [sexoFiltro, setSexoFiltro] = useState("todos")
  const [estadoFiltro, setEstadoFiltro] = useState("todos")
  const [pagina, setPagina] = useState(1)

  const [pacientes, setPacientes] = useState<PacienteResponse[]>([])
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  const [pacienteDetalle, setPacienteDetalle] = useState<PacienteResponse | null>(null)

  // Debounce de búsqueda para no saturar al backend
  useEffect(() => {
    const t = setTimeout(() => {
      setBusquedaDebounce(busqueda.trim())
      setPagina(1)
    }, 400)
    return () => clearTimeout(t)
  }, [busqueda])

  const primeraCarga = useRef(true)

  useEffect(() => {
    async function cargar() {
      try {
        if (primeraCarga.current) setCargando(true)
        setError(false)
        const resp = await listarPacientes({
          page: pagina,
          page_size: PAGE_SIZE,
          buscar: busquedaDebounce || undefined,
          sexo: sexoFiltro === "todos" ? undefined : sexoFiltro,
          en_atencion:
            estadoFiltro === "todos" ? undefined : estadoFiltro === "en-atencion",
        })
        setPacientes(resp.items)
        setTotal(resp.total)
        setTotalPaginas(resp.total_pages || 1)
      } catch {
        setError(true)
      } finally {
        setCargando(false)
        primeraCarga.current = false
      }
    }
    cargar()
  }, [pagina, busquedaDebounce, sexoFiltro, estadoFiltro])

  const reintentar = () => {
    primeraCarga.current = true
    setCargando(true)
    listarPacientes({
      page: pagina,
      page_size: PAGE_SIZE,
      buscar: busquedaDebounce || undefined,
      sexo: sexoFiltro === "todos" ? undefined : sexoFiltro,
      en_atencion:
        estadoFiltro === "todos" ? undefined : estadoFiltro === "en-atencion",
    })
      .then((resp) => {
        setPacientes(resp.items)
        setTotal(resp.total)
        setTotalPaginas(resp.total_pages || 1)
        setError(false)
      })
      .catch(() => setError(true))
      .finally(() => {
        setCargando(false)
        primeraCarga.current = false
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            value={sexoFiltro}
            onValueChange={(val) => {
              setSexoFiltro(val)
              setPagina(1)
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sexo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos (Sexo)</SelectItem>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="femenino">Femenino</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={estadoFiltro}
            onValueChange={(val) => {
              setEstadoFiltro(val)
              setPagina(1)
            }}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos (Estado)</SelectItem>
              <SelectItem value="en-atencion">En Atención</SelectItem>
              <SelectItem value="sin-atencion">Sin Atención Activa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {cargando ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[220px] rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center space-y-3 rounded-xl border border-dashed border-border/60 bg-muted/5">
          <p className="text-sm font-medium text-muted-foreground/80">
            No se pudieron cargar los pacientes.
          </p>
          <Button variant="outline" size="sm" onClick={reintentar} className="rounded-lg font-bold">
            Reintentar
          </Button>
        </div>
      ) : pacientes.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground rounded-xl border border-dashed border-border/60 bg-muted/5">
          No se encontraron pacientes con los filtros seleccionados.
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-muted-foreground/80">
            {total} paciente{total === 1 ? "" : "s"} registrado{total === 1 ? "" : "s"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pacientes.map((paciente) => {
              const edad = calcularEdad(paciente.fecha_nacimiento)
              return (
                <Card key={paciente.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="text-base font-bold line-clamp-1">
                        {paciente.nombres_apellidos}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground font-mono">
                        DNI: {paciente.dni}
                      </div>
                    </div>
                    <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-muted-foreground">Edad</div>
                      <div className="font-medium text-right">
                        {edad != null ? `${edad} años` : "—"}
                      </div>

                      <div className="text-muted-foreground">Sexo</div>
                      <div className="font-medium text-right">{capitalizar(paciente.sexo)}</div>

                      <div className="text-muted-foreground">Registro</div>
                      <div className="font-medium text-right">
                        {formatearFechaCorta(paciente.created_at)}
                      </div>

                      <div className="text-muted-foreground">Última atención</div>
                      <div className="font-medium text-right">
                        {formatearFechaCorta(paciente.ultima_atencion)}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/40 flex justify-between items-center">
                      <Badge variant={paciente.en_atencion ? "default" : "secondary"}>
                        {paciente.en_atencion ? "En atención" : "Sin atención activa"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-primary"
                        onClick={() => setPacienteDetalle(paciente)}
                      >
                        Ver perfil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
          >
            Anterior
          </Button>
          <span className="text-sm font-medium text-muted-foreground mx-2">
            Página {pagina} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
          >
            Siguiente
          </Button>
        </div>
      )}

      <PacienteDetalleDialog
        paciente={pacienteDetalle}
        abierto={!!pacienteDetalle}
        onCambioAbierto={(abierto) => {
          if (!abierto) setPacienteDetalle(null)
        }}
      />
    </div>
  )
}
