import { UserRoundPlus } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function RegistrarPacientePage() {
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Registrar paciente</h1>
        <p className="text-sm text-muted-foreground">
          Pagina base para el registro de pacientes adultos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundPlus className="size-5" />
            Datos del paciente
          </CardTitle>
          <CardDescription>
            Placeholder preparado para incorporar formulario, validaciones y
            conexion con backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aqui se registraran datos generales, antecedentes relevantes y
            criterios iniciales para una evaluacion presuntiva.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
