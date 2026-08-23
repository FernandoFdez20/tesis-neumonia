import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { patologiasRespiratoriasMock } from "@/components/diagnostico/datos-diagnostico"

type ResultadoDiagnostico = "sano" | "positivo-neumonia" | "otra-patologia"

type RegistroDiagnosticoFinalDialogProps = {
  abierto: boolean
  onCambioAbierto: (abierto: boolean) => void
}

export function RegistroDiagnosticoFinalDialog({
  abierto,
  onCambioAbierto,
}: RegistroDiagnosticoFinalDialogProps) {
  const [resultadoDiagnostico, setResultadoDiagnostico] = useState("")
  const [gravedad, setGravedad] = useState("")
  const [patologia, setPatologia] = useState("")
  const [descripcionClinica, setDescripcionClinica] = useState("")

  const esPositivoNeumonia = resultadoDiagnostico === "positivo-neumonia"
  const esOtraPatologia = resultadoDiagnostico === "otra-patologia"

  function handleCambioResultado(valor: ResultadoDiagnostico) {
    setResultadoDiagnostico(valor)

    if (valor !== "positivo-neumonia") {
      setGravedad("")
    }

    if (valor !== "otra-patologia") {
      setPatologia("")
    }
  }

  function handleCambioAbierto(siguienteAbierto: boolean) {
    onCambioAbierto(siguienteAbierto)

    if (!siguienteAbierto) {
      setResultadoDiagnostico("")
      setGravedad("")
      setPatologia("")
      setDescripcionClinica("")
    }
  }

  function handleGuardarDiagnostico() {
    toast.success("Diagnóstico final registrado", {
      description: "El registro quedó guardado temporalmente en modo plantilla.",
    })
    handleCambioAbierto(false)
  }

  return (
    <Dialog open={abierto} onOpenChange={handleCambioAbierto}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader className="px-5 pt-5 pb-1">
          <DialogTitle>Registro de Diagnóstico Final</DialogTitle>
          <DialogDescription className="mt-1">
            Completa el resultado clínico de la atención actual.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-5 pb-5">
          <div className="grid gap-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Resultado del diagnóstico
            </Label>
            <Select value={resultadoDiagnostico} onValueChange={handleCambioResultado}>
              <SelectTrigger className="rounded-xl border-border/60 bg-background/50">
                <SelectValue placeholder="Selecciona el resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sano">Sano</SelectItem>
                <SelectItem value="positivo-neumonia">Positivo para neumonía</SelectItem>
                <SelectItem value="otra-patologia">Otra patología</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {esPositivoNeumonia && (
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Gravedad
              </Label>
              <Select value={gravedad} onValueChange={setGravedad}>
                <SelectTrigger className="rounded-xl border-border/60 bg-background/50">
                  <SelectValue placeholder="Selecciona gravedad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leve">Leve</SelectItem>
                  <SelectItem value="moderada">Moderada</SelectItem>
                  <SelectItem value="grave">Grave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {esOtraPatologia && (
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Enfermedad respiratoria
              </Label>
              <Select value={patologia} onValueChange={setPatologia}>
                <SelectTrigger className="rounded-xl border-border/60 bg-background/50">
                  <SelectValue placeholder="Selecciona una patología" />
                </SelectTrigger>
                <SelectContent>
                  {patologiasRespiratoriasMock.map((enfermedad) => (
                    <SelectItem key={enfermedad} value={enfermedad.toLowerCase()}>
                      {enfermedad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Descripción clínica
            </Label>
            <Textarea
              value={descripcionClinica}
              onChange={(event) => setDescripcionClinica(event.target.value)}
              placeholder="Describe el criterio clínico, hallazgos relevantes y conducta médica."
              className="min-h-28 rounded-xl border-border/60 bg-background/50 px-3.5 py-2.5"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-border/40 bg-muted/10 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl font-bold"
            onClick={() => handleCambioAbierto(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="rounded-xl font-bold"
            disabled={!resultadoDiagnostico || !descripcionClinica.trim()}
            onClick={handleGuardarDiagnostico}
          >
            Guardar diagnóstico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
