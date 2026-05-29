import { useMemo, useState } from "react"
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

// Mock data
const MOCK_PACIENTES = Array.from({ length: 45 }).map((_, i) => ({
  id: `P-${(i + 1).toString().padStart(4, "0")}`,
  nombre: `Paciente de prueba ${i + 1}`,
  dni: `${10000000 + i * 12345}`,
  edad: 20 + (i % 60),
  sexo: i % 2 === 0 ? "Masculino" : "Femenino",
  fechaRegistro: `2024-${String((i % 12) + 1).padStart(2, "0")}-15`,
  atenciones: (i % 5) + 1,
  ultimaAtencion: `2024-${String((i % 12) + 1).padStart(2, "0")}-20`,
  estado: i % 3 === 0 ? "Crítico" : i % 2 === 0 ? "Estable" : "En evaluación",
}))

const ITEMS_PER_PAGE = 6

export function PacientesList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [generoFilter, setGeneroFilter] = useState("todos")
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredPacientes = useMemo(() => {
    return MOCK_PACIENTES.filter((p) => {
      const matchSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dni.includes(searchTerm)
      const matchGenero = generoFilter === "todos" || p.sexo.toLowerCase() === generoFilter
      const matchEstado =
        estadoFilter === "todos" ||
        p.estado.toLowerCase().replace(" ", "-") === estadoFilter
      return matchSearch && matchGenero && matchEstado
    })
  }, [searchTerm, generoFilter, estadoFilter])

  const totalPages = Math.ceil(filteredPacientes.length / ITEMS_PER_PAGE)
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

      {paginatedPacientes.length === 0 ? (
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
                    {paciente.nombre}
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
                  <div className="font-medium text-right">{paciente.edad} años</div>
                  
                  <div className="text-muted-foreground">Sexo</div>
                  <div className="font-medium text-right">{paciente.sexo}</div>
                  
                  <div className="text-muted-foreground">Registro</div>
                  <div className="font-medium text-right">{paciente.fechaRegistro}</div>
                  
                  <div className="text-muted-foreground">Atenciones</div>
                  <div className="font-medium text-right">{paciente.atenciones}</div>
                  
                  <div className="text-muted-foreground">Última</div>
                  <div className="font-medium text-right">{paciente.ultimaAtencion}</div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Estado
                  </span>
                  <Badge
                    variant={
                      paciente.estado === "Crítico"
                        ? "destructive"
                        : paciente.estado === "Estable"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      paciente.estado === "Estable"
                        ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400"
                        : paciente.estado === "En evaluación"
                        ? "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-400"
                        : ""
                    }
                  >
                    {paciente.estado}
                  </Badge>
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
