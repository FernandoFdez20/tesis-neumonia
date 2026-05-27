import { ClipboardPlus } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function NuevaAtencionPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva atencion</h1>
        <p className="text-sm text-muted-foreground">
          Pagina base para registrar una atencion clinica respiratoria.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardPlus className="size-5" />
            Evaluacion presuntiva
          </CardTitle>
          <CardDescription>
            Placeholder para sintomas, signos vitales, apoyo de IA y prioridad
            clinica pendiente de validacion medica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aqui se capturaran datos de la atencion registrada y se mostrara la
            prioridad clinica referencial sin reemplazar el criterio medico.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
