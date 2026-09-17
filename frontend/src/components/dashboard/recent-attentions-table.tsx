import { useEffect, useState } from "react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { listarAtenciones, type AtencionResponse } from "@/services/atenciones.service"

const ITEMS_PER_PAGE = 4

export function RecentAttentionsTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const [attentions, setAttentions] = useState<AtencionResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await listarAtenciones()
        setAttentions(data)
      } catch (error) {
        console.error("Error al cargar atenciones:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const totalPages = Math.ceil(attentions.length / ITEMS_PER_PAGE) || 1
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentItems = attentions.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-foreground/90 tracking-tight">
              Atenciones recientes
            </CardTitle>
            <CardDescription className="mt-1.5 text-sm text-muted-foreground/70 font-medium">
              Registros de hoy · {attentions.length} atenciones
            </CardDescription>
          </div>
          <Link
            to="#"
            className="flex shrink-0 items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors duration-200 mt-0.5 tracking-tight hover:gap-1.5"
          >
            Ver todas
            <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.2} />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-xl border border-border/30 overflow-x-auto bg-background/30 shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead>Código</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead className="hidden lg:table-cell">Evaluación presuntiva</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Cargando atenciones...
                  </TableCell>
                </TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay atenciones registradas.
                  </TableCell>
                </TableRow>
              ) : currentItems.map((attention) => (
                <TableRow
                  key={attention.id}
                  className="cursor-pointer hover:bg-accent/30 transition-colors duration-150"
                >
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                    AT-{String(attention.id).padStart(4, '0')}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground/85">
                    {attention.paciente_nombre || `Paciente ${attention.paciente_id}`}
                  </TableCell>
                  <TableCell className="text-muted-foreground/70">
                    {attention.paciente_edad} a.
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground/70">
                    {new Date(attention.fecha_registro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-[220px] truncate text-muted-foreground/70">
                    {attention.sintomas_principales || attention.examen_fisico || "Sin evaluación"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={attention.paciente_estado_clinico === "Pendiente de evaluación" ? "secondary" : "default"}>
                      {attention.paciente_estado_clinico || attention.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <p className="text-sm text-muted-foreground/65 font-medium">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-lg"
              >
                <ChevronLeft className="size-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon-sm"
                  onClick={() => setCurrentPage(page)}
                  className="h-8 w-8 rounded-lg"
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 rounded-lg"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
