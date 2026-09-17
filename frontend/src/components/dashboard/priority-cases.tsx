
import { ChevronRight, AlertTriangle, Info } from "lucide-react"
import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type CasoPrio = {
  diagnostico_id: number
  atencion_medica_id: number
  paciente_nombre: string
  prioridad_final: string
  created_at: string
  crb65_puntaje?: number | null
  edad?: number | null
}

export function PriorityCases({ casos }: { casos: CasoPrio[] }) {
  
  const getBadgeColor = (prio: string) => {
    if (prio === "Crítica") return "bg-red-500/10 text-red-700 hover:bg-red-500/20"
    if (prio === "Alta") return "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20"
    return "bg-slate-500/10 text-slate-700"
  }

  const getBorderColor = (prio: string) => {
    if (prio === "Crítica") return "border-l-red-500/70 hover:border-l-red-500"
    if (prio === "Alta") return "border-l-orange-500/70 hover:border-l-orange-500"
    return "border-l-slate-500/70"
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-foreground/90 tracking-tight flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-500" />
              Casos Prioritarios
            </CardTitle>
            <CardDescription className="mt-1.5 text-sm text-muted-foreground/70 font-medium">
              Solo prioridades Alta y Crítica pendientes.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        {casos.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50">
            <Info className="size-5 mx-auto mb-2 text-muted-foreground/50" />
            No hay casos de alta prioridad pendientes.
          </div>
        ) : (
          casos.map((c) => (
            <Link
              key={c.diagnostico_id}
              to={`/resultado`}
              state={{ atencionId: c.atencion_medica_id }} 
              className={cn(
                "group flex items-start justify-between gap-3 rounded-xl border border-border/30 bg-background/40 p-4 border-l-[3px] transition-all duration-300 hover:border-l-[4px] shadow-xs hover:shadow-md hover:bg-background/60 hover:-translate-y-px",
                getBorderColor(c.prioridad_final)
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-bold text-foreground/90 tracking-tight">
                      {c.paciente_nombre}
                    </p>
                    <p className="text-xs text-muted-foreground/65 font-bold tracking-wider mt-0.5">
                      hace {formatDistanceToNow(new Date(c.created_at), { locale: es })}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs px-2.5 py-0.5 rounded-full font-bold border-none", getBadgeColor(c.prioridad_final))}
                  >
                    {c.prioridad_final}
                  </Badge>
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 transition-all duration-200 mt-1" />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}
