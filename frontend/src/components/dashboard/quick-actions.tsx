import { ClipboardPlus, UserRoundPlus } from "lucide-react"
import { Link } from "react-router-dom"

import { usePatientRegistration } from "@/components/patients/use-patient-registration"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PATHS } from "@/routes/paths"

export function QuickActions() {
  const { openNewPatientDialog } = usePatientRegistration()

  return (
    <Card className="hover:shadow-sm">
      <CardHeader className="pb-3 md:pb-4 flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">
            Accesos rápidos
          </CardTitle>
          <CardDescription className="mt-1.5 text-xs text-muted-foreground/75 leading-relaxed font-medium">
            Flujos principales para el registro clínico inicial en el sistema.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-3 pt-0 pb-4 px-5">
        <Button
          type="button"
          size="lg"
          className="h-10 justify-center sm:justify-start gap-2.5 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer font-bold rounded-xl bg-primary hover:bg-primary/95 px-4.5 flex-1 sm:flex-initial"
          onClick={openNewPatientDialog}
        >
          <UserRoundPlus className="size-4 shrink-0 text-white/95" strokeWidth={2.2} />
          <span>Registrar paciente</span>
        </Button>
        <Button asChild variant="outline" size="lg" className="justify-center sm:justify-start gap-2.5 h-10 hover:bg-accent/70 hover:text-accent-foreground transition-all duration-200 cursor-pointer font-bold rounded-xl shadow-xs px-4.5 flex-1 sm:flex-initial">
          <Link to={PATHS.NEW_ATTENTION}>
            <ClipboardPlus className="size-4 shrink-0 text-muted-foreground/80 group-hover:text-foreground/90" strokeWidth={2.2} />
            <span>Nueva atención</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
