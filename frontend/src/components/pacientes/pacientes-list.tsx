import { useEffect, useState } from "react"
import { Search, SlidersHorizontal, User } from "lucide-react"

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

import { listarPacientes, type PacienteResponse } from "@/services/pacientes.service"

export function PacientesList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [generoFilter, setGeneroFilter] = useState("todos")
  const [estadoFilter, setEstadoFilter] = useState("todos")
  
  const [pacientes, setPacientes] = useState<PacienteResponse[]>([])
  const [cargando, setCargando] = useState(true)

  // Función sencilla para calcular edad
  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date()
    const fechaNac = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - fechaNac.getFullYear()
    const m = hoy.getMonth() - fechaNac.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--
    }
    return edad
  }

  useEffect(() => {
    async function cargarPacientes() {
      try {
        setCargando(true)
        const response = await listarPacientes({ page: 1, page_size: 100 })
        setPacientes(response.items)
      } catch (error) {
        console.error("Error cargando pacientes:", error)
      } finally {
        setCargando(false)
      }
    }
    cargarPacientes()
  }, [])

  const filteredPacientes = pacientes.filter((p) => {
    const matchSearch =
      p.nombres_apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dni.includes(searchTerm)
    const matchGenero = generoFilter === "todos" || p.sexo.toLowerCase() === generoFilter.toLowerCase()
    const matchEstado =
      estadoFilter === "todos" ||
      p.estado_clinico.toLowerCase().replace(/ /g, "-") === estadoFilter.toLowerCase()
    return matchSearch && matchGenero && matchEstado
  })

  const ITEMS_PER_PAGE = 6
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(filteredPacientes.length / ITEMS_PER_PAGE) || 1
  const paginatedPacientes = filteredPacientes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o DNI..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 w-full"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            value={generoFilter}
            onValueChange={(val) => {
              setGeneroFilter(val)
              setCurrentPage(1)
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
            value={estadoFilter}
            onValueChange={(val) => {
              setEstadoFilter(val)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos (Estado)</SelectItem>
              <SelectItem value="estable">Estable</SelectItem>
              <SelectItem value="en-evaluacion">En evaluación</SelectItem>
              <SelectItem value="crítico">Crítico</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" title="Más filtros">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {cargando ? (
        <div className="py-12 text-center text-muted-foreground">Cargando pacientes...</div>
      ) : paginatedPacientes.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No se encontraron pacientes con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedPacientes.map((paciente) => (
            <Card key={paciente.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold line-clamp-1">
                    {paciente.nombres_apellidos}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    DNI: {paciente.dni}
                  </div>
                </div>
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <User className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Edad</div>
                  <div className="font-medium text-right">{calcularEdad(paciente.fecha_nacimiento)} años</div>
                  
                  <div className="text-muted-foreground">Sexo</div>
                  <div className="font-medium text-right">{paciente.sexo}</div>
                  
                  <div className="text-muted-foreground">Registro</div>
                  <div className="font-medium text-right">{new Date(paciente.created_at).toLocaleDateString()}</div>
                  
                  <div className="text-muted-foreground">Atenciones</div>
                  <div className="font-medium text-right">{"-"}</div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/40 flex justify-between items-center">
                  <Badge
                    variant={
                      paciente.estado_clinico === "Sin atención pendiente"
                        ? "default"
                        : paciente.estado_clinico === "Pendiente de validación"
                        ? "secondary"
                        : "destructive"
                    }
                    className="font-medium"
                  >
                    {paciente.estado_clinico}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-primary">
                    Ver perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm font-medium text-muted-foreground mx-2">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
