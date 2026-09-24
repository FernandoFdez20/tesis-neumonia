import { useState } from "react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

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
import { validarDiagnostico } from "@/services/diagnosticos.service"
import type { DiagnosticoValidacionRequest } from "@/types/diagnostico"

type RegistroDiagnosticoFinalDialogProps = {
  diagnosticoId: number
  abierto: boolean
  onCambioAbierto: (abierto: boolean) => void
  onValidadoExitosamente?: () => void
}

export function RegistroDiagnosticoFinalDialog({
  diagnosticoId,
  abierto,
  onCambioAbierto,
  onValidadoExitosamente,
}: RegistroDiagnosticoFinalDialogProps) {
  const queryClient = useQueryClient()
  const [clasificacionMedico, setClasificacionMedico] = useState<DiagnosticoValidacionRequest["clasificacion_medico"] | "">("")
  const [descripcionClinica, setDescripcionClinica] = useState("")
  const [estaCargando, setEstaCargando] = useState(false)

  function handleCambioAbierto(siguienteAbierto: boolean) {
    if (estaCargando) return
    onCambioAbierto(siguienteAbierto)
    if (!siguienteAbierto) {
      setClasificacionMedico("")
      setDescripcionClinica("")
    }
  }

  async function handleGuardarDiagnostico() {
    if (!clasificacionMedico || !descripcionClinica.trim()) return

    setEstaCargando(true)
    try {
      await validarDiagnostico(diagnosticoId, {
        clasificacion_medico: clasificacionMedico as DiagnosticoValidacionRequest["clasificacion_medico"],
        diagnostico_descripcion: descripcionClinica,
      })

      toast.success("Diagnóstico validado exitosamente")
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["diagnostico", diagnosticoId] })
      queryClient.invalidateQueries({ queryKey: ["estadisticasDashboard"] })
      queryClient.invalidateQueries({ queryKey: ["atencionesRecientes"] })

      if (onValidadoExitosamente) {
        onValidadoExitosamente()
      }
      handleCambioAbierto(false)
    } catch (error: any) {
      toast.error("Error al validar", {
        description: error.response?.data?.detail || "Ocurrió un error inesperado."
      })
    } finally {
      setEstaCargando(false)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={handleCambioAbierto}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader className="px-5 pt-5 pb-1">
          <DialogTitle>Validación Médica del Diagnóstico</DialogTitle>
          <DialogDescription className="mt-1">
            Revisa el caso y emite tu conclusión clínica final.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-5 pb-5">
          <div className="grid gap-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Clasificación médica final
            </Label>
            <Select 
              value={clasificacionMedico} 
              onValueChange={(v: any) => setClasificacionMedico(v)}
              disabled={estaCargando}
            >
              <SelectTrigger className="rounded-xl border-border/60 bg-background/50">
                <SelectValue placeholder="Selecciona el resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Neumonía">Neumonía</SelectItem>
                <SelectItem value="Sano">Sano</SelectItem>
                <SelectItem value="Otro diagnóstico">Otro diagnóstico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Descripción / discrepancias
            </Label>
            <Textarea
              value={descripcionClinica}
              onChange={(event) => setDescripcionClinica(event.target.value)}
              placeholder="Documenta observaciones clínicas, coincidencias o diferencias respecto al resultado de la IA."
              className="min-h-28 rounded-xl border-border/60 bg-background/50 px-3.5 py-2.5"
              disabled={estaCargando}
            />
          </div>
        </div>

        <DialogFooter className="border-t border-border/40 bg-muted/10 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl font-bold"
            disabled={estaCargando}
            onClick={() => handleCambioAbierto(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="rounded-xl font-bold"
            disabled={!clasificacionMedico || !descripcionClinica.trim() || estaCargando}
            onClick={handleGuardarDiagnostico}
          >
            {estaCargando ? "Guardando..." : "Firmar y Validar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
