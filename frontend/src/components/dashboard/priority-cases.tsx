import { ArrowRight, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const priorityCases = [
  {
    id: "CP-221",
    patient: "Jorge Salinas",
    severity: "Grave",
    detail: "Saturación baja y compromiso respiratorio referido",
    badgeVariant: "grave" as const,
    borderColor: "border-l-red-500/70 hover:border-l-red-500 hover:bg-red-500/[0.02]",
  },
  {
    id: "CP-220",
    patient: "Rosa Paredes",
    severity: "Moderada",
    detail: "Fiebre persistente y factores de riesgo en adulto mayor",
    badgeVariant: "moderado" as const,
    borderColor: "border-l-amber-500/70 hover:border-l-amber-500 hover:bg-amber-500/[0.02]",
  },
  {
    id: "CP-219",
    patient: "Mario Alva",
    severity: "Alta prioridad",
    detail: "Pendiente de validación médica por criterios clínicos",
    badgeVariant: "pendiente" as const,
    borderColor: "border-l-sky-500/70 hover:border-l-sky-500 hover:bg-sky-500/[0.02]",
  },
]

export function PriorityCases() {
  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-foreground/90 tracking-tight">
              Casos prioritarios
            </CardTitle>
            <CardDescription className="mt-1.5 text-sm text-muted-foreground/70 font-medium">
              Priorización clínica referencial, no concluyente.
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
      <CardContent className="space-y-2.5 pt-0">
        {priorityCases.map((caseItem) => (
          <Link
            key={caseItem.id}
            to={`/casos/${caseItem.id}`}
            className={cn(
              "group flex items-start justify-between gap-3 rounded-xl border border-border/30 bg-background/40 p-4 border-l-[3px] transition-all duration-300 hover:border-l-[4px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 shadow-xs hover:shadow-md hover:bg-background/60 hover:-translate-y-px",
              caseItem.borderColor
            )}
            aria-label={`Ver detalle del caso ${caseItem.id} — ${caseItem.patient}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-bold text-foreground/90 tracking-tight">
                    {caseItem.patient}
                  </p>
                  <p className="text-xs text-muted-foreground/65 font-bold font-mono tracking-wider mt-0.5">
                    {caseItem.id}
                  </p>
                </div>
                <Badge
                  variant={caseItem.badgeVariant}
                  className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                >
                  {caseItem.severity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground/80 leading-relaxed font-medium">
                {caseItem.detail}
              </p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 transition-all duration-200 mt-1" />
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
