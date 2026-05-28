import { useState } from "react"
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

const allAttentions = [
  {
    id: "AT-1042",
    patient: "Mariana Rojas",
    age: 62,
    time: "08:20",
    presumptive: "Neumonía adquirida en comunidad",
    status: "Pendiente de validación",
    statusVariant: "pendiente" as const,
  },
  {
    id: "AT-1041",
    patient: "Carlos Medina",
    age: 71,
    time: "09:05",
    presumptive: "Evaluación presuntiva en curso",
    status: "Atención registrada",
    statusVariant: "leve" as const,
  },
  {
    id: "AT-1040",
    patient: "Elena Torres",
    age: 54,
    time: "10:10",
    presumptive: "Sospecha clínica respiratoria",
    status: "Pendiente de evaluación",
    statusVariant: "pendiente" as const,
  },
  {
    id: "AT-1039",
    patient: "Jorge Salinas",
    age: 68,
    time: "11:15",
    presumptive: "Neumonía probable",
    status: "Caso priorizado",
    statusVariant: "grave" as const,
  },
  {
    id: "AT-1038",
    patient: "Ana Gutiérrez",
    age: 45,
    time: "11:45",
    presumptive: "Bronquitis aguda",
    status: "Atención registrada",
    statusVariant: "leve" as const,
  },
  {
    id: "AT-1037",
    patient: "Roberto Díaz",
    age: 58,
    time: "12:30",
    presumptive: "Neumonía aspirativa",
    status: "Pendiente de validación",
    statusVariant: "pendiente" as const,
  },
]

const ITEMS_PER_PAGE = 4

export function RecentAttentionsTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(allAttentions.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentItems = allAttentions.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-foreground/90 tracking-tight">
              Atenciones recientes
            </CardTitle>
            <CardDescription className="mt-1.5 text-xs text-muted-foreground/65 font-medium">
              Registros de hoy · {allAttentions.length} atenciones
            </CardDescription>
          </div>
          <Link
            to="#"
            className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors duration-200 mt-0.5 tracking-tight hover:gap-1.5"
          >
            Ver todas
            <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.2} />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-xl border border-border/30 overflow-hidden bg-background/30 shadow-xs">
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
              {currentItems.map((attention) => (
                <TableRow
                  key={attention.id}
                  className="cursor-pointer hover:bg-accent/30 transition-colors duration-150"
                >
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                    {attention.id}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground/85">
                    {attention.patient}
                  </TableCell>
                  <TableCell className="text-muted-foreground/70">
                    {attention.age} a.
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground/70">
                    {attention.time}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-[220px] truncate text-muted-foreground/70">
                    {attention.presumptive}
                  </TableCell>
                  <TableCell>
                    <Badge variant={attention.statusVariant}>
                      {attention.status}
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
            <p className="text-xs text-muted-foreground/60 font-medium">
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
