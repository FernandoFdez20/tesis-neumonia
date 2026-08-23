import { ArrowLeft, SearchX } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { DiagnosticoForm } from "@/components/diagnostico/diagnostico-form"
import { buscarDiagnosticoPorCodigoAtencion } from "@/components/diagnostico/datos-diagnostico"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PATHS } from "@/routes/paths"

export default function DiagnosticoPage() {
  const { codigoAtencion } = useParams()
  const diagnostico = codigoAtencion
    ? buscarDiagnosticoPorCodigoAtencion(codigoAtencion)
    : null

  if (!diagnostico) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Card className="max-w-lg text-center">
          <CardHeader className="items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600">
              <SearchX className="size-6" />
            </div>
            <CardTitle>Atención no encontrada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              No existe una atención médica registrada con el código{" "}
              <span className="font-mono font-bold text-foreground">
                {codigoAtencion ?? "sin código"}
              </span>
              .
            </p>
            <Button asChild className="gap-2 rounded-xl font-bold">
              <Link to={PATHS.ATTENTIONS}>
                <ArrowLeft className="size-4" />
                Volver a atenciones
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <DiagnosticoForm
      key={diagnostico.codigoAtencion}
      diagnosticoInicial={diagnostico}
    />
  )
}
