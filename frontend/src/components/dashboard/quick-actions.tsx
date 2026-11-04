import { ClipboardPlus, UserRoundPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  solicitarAbrirRegistroAtencion,
  solicitarAbrirRegistroPaciente,
} from "@/lib/registro-clinico-events"

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Accesos rápidos">
      <Button variant="outline" className="gap-2 rounded-lg" onClick={solicitarAbrirRegistroPaciente}>
        <UserRoundPlus className="size-4" />
        Registrar paciente
      </Button>
      <Button className="gap-2 rounded-lg" onClick={solicitarAbrirRegistroAtencion}>
        <ClipboardPlus className="size-4" />
        Nueva atención
      </Button>
    </div>
  )
}
