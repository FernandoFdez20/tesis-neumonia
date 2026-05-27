import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
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

const recentAttentions = [
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
]

export function RecentAttentionsTable() {
  return (
    <Card>
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Atenciones recientes</CardTitle>
            <CardDescription className="mt-1">
              Registros de hoy · {recentAttentions.length} atenciones
            </CardDescription>
          </div>
          <Link
            to="#"
            className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors mt-0.5 tracking-tight"
          >
            Ver todas
            <ArrowRight className="size-3" strokeWidth={2.2} />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-xl border border-border/40 overflow-hidden bg-background/20 shadow-xs">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Evaluación presuntiva</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentAttentions.map((attention) => (
              <TableRow key={attention.id}>
                <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                  {attention.id}
                </TableCell>
                <TableCell className="font-medium">{attention.patient}</TableCell>
                <TableCell className="text-muted-foreground">{attention.age} a.</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{attention.time}</TableCell>
                <TableCell className="max-w-[220px] truncate text-muted-foreground">
                  {attention.presumptive}
                </TableCell>
                <TableCell>
                  <Badge variant={attention.statusVariant}>{attention.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  )
}
