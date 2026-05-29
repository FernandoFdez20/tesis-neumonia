import { ClipboardPlus, UserRoundPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  solicitarAbrirRegistroAtencion,
  solicitarAbrirRegistroPaciente,
} from "@/lib/registro-clinico-events"

export function QuickActions() {
  return (
    <Card className="hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 md:pb-4 flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xs font-bold text-muted-foreground/55 uppercase tracking-[0.12em] leading-none">
            Accesos rápidos
          </CardTitle>
          <CardDescription className="mt-2 text-sm text-muted-foreground/75 leading-relaxed font-medium">
            Flujos principales para el registro clínico inicial en el sistema.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-3 pt-0 pb-5 px-5">
        <Button
          type="button"
          size="lg"
          className="h-11 justify-center sm:justify-start gap-2.5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer font-semibold rounded-xl bg-primary hover:bg-primary/90 px-5 flex-1 sm:flex-initial hover:scale-[1.02] active:scale-[0.98]"
          onClick={solicitarAbrirRegistroPaciente}
        >
          <UserRoundPlus className="size-[18px] shrink-0 text-white/95" strokeWidth={2} />
          <span>Registrar paciente</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="justify-center sm:justify-start gap-2.5 h-11 hover:bg-accent/60 hover:text-accent-foreground hover:border-border/60 transition-all duration-300 cursor-pointer font-semibold rounded-xl shadow-sm px-5 flex-1 sm:flex-initial hover:scale-[1.02] active:scale-[0.98]"
          onClick={solicitarAbrirRegistroAtencion}
        >
          <ClipboardPlus className="size-[18px] shrink-0 text-muted-foreground/70 group-hover:text-foreground/90" strokeWidth={2} />
          <span>Crear Nueva Atención</span>
        </Button>
      </CardContent>
    </Card>
  )
}
