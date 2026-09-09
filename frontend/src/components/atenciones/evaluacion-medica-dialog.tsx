import { useState } from "react"
import { Activity, Thermometer, HeartPulse, Wind, Save, ArrowRight } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type AtencionResponse, evaluarAtencion } from "@/services/atenciones.service"
import { toast } from "sonner"

type EvaluacionMedicaDialogProps = {
  atencion: AtencionResponse | null
  abierto: boolean
  onCambioAbierto: (abierto: boolean) => void
  onEvaluacionCompletada: () => void
}

function SignoVitalMini({ label, value, unit, icon: Icon, alert = false }: { label: string, value: string | number, unit?: string, icon: any, alert?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1 rounded-lg border p-2", alert ? "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400" : "bg-muted/30 border-border/50")}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-70">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="text-sm font-bold">
        {value} <span className="text-[10px] font-medium opacity-70">{unit}</span>
      </div>
    </div>
  )
}

export function EvaluacionMedicaDialog({
  atencion,
  abierto,
  onCambioAbierto,
  onEvaluacionCompletada,
}: EvaluacionMedicaDialogProps) {
  const [examenFisico, setExamenFisico] = useState(atencion?.examen_fisico || "")
  const [guardando, setGuardando] = useState(false)
  const [derivando, setDerivando] = useState(false)

  // Actualizar el estado local cuando cambia la atención seleccionada
  useState(() => {
    if (atencion) setExamenFisico(atencion.examen_fisico || "")
  })

  if (!atencion) return null

  const handleGuardar = async () => {
    try {
      setGuardando(true)
      await evaluarAtencion(atencion.id, examenFisico, "guardar_progreso")
      toast.success("Progreso guardado correctamente")
      onEvaluacionCompletada()
    } catch (error) {
      toast.error("Error al guardar la evaluación")
    } finally {
      setGuardando(false)
    }
  }

  const handleDerivar = async () => {
    if (examenFisico.trim().length < 10) {
      toast.error("Por favor ingrese un examen físico más detallado antes de derivar")
      return
    }

    try {
      setDerivando(true)
      await evaluarAtencion(atencion.id, examenFisico, "derivar_radiografia")
      toast.success("Paciente derivado a radiografía exitosamente")
      onCambioAbierto(false)
      onEvaluacionCompletada()
    } catch (error) {
      toast.error("Error al derivar al paciente")
    } finally {
      setDerivando(false)
    }
  }

  const esSatBaja = atencion.saturacion_o2 ? atencion.saturacion_o2 < 94 : false

  return (
    <Dialog open={abierto} onOpenChange={onCambioAbierto}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <div className="bg-primary/5 px-6 py-4 border-b">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="bg-background">
                AT-{String(atencion.id).padStart(4, '0')}
              </Badge>
              <Badge variant={atencion.paciente_estado_clinico === "Pendiente de evaluación" ? "secondary" : "default"}>
                {atencion.paciente_estado_clinico || atencion.estado}
              </Badge>
            </div>
            <DialogTitle className="text-xl">Evaluación Médica</DialogTitle>
            <DialogDescription>
              {atencion.paciente_nombre} ({atencion.paciente_edad} años)
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Motivo de consulta */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Motivo de consulta</h4>
            <div className="text-sm bg-muted/20 p-3 rounded-lg border border-border/50">
              {atencion.sintomas_principales || "No se registró motivo de consulta"}
            </div>
          </div>

          {/* Signos vitales */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Signos Vitales</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <SignoVitalMini 
                label="Sat O2" 
                value={atencion.saturacion_o2 || "--"} 
                unit="%" 
                icon={Activity} 
                alert={esSatBaja} 
              />
              <SignoVitalMini 
                label="Temp" 
                value={atencion.temperatura || "--"} 
                unit="°C" 
                icon={Thermometer} 
              />
              <SignoVitalMini 
                label="F. Card" 
                value={atencion.frecuencia_cardiaca || "--"} 
                unit="lpm" 
                icon={HeartPulse} 
              />
              <SignoVitalMini 
                label="F. Resp" 
                value={atencion.frecuencia_respiratoria || "--"} 
                unit="rpm" 
                icon={Wind} 
              />
            </div>
          </div>

          {/* Examen físico (Editable) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Examen Físico <span className="text-destructive">*</span>
            </h4>
            <Textarea
              value={examenFisico}
              onChange={(e) => setExamenFisico(e.target.value)}
              placeholder="Ej. Paciente presenta crepitantes en base pulmonar derecha..."
              className="min-h-[120px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="bg-muted/10 px-6 py-4 border-t gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={handleGuardar} 
            disabled={guardando || derivando}
          >
            <Save className="size-4 mr-2" />
            {guardando ? "Guardando..." : "Guardar progreso"}
          </Button>
          
          <Button 
            onClick={handleDerivar} 
            disabled={guardando || derivando || !examenFisico.trim()}
          >
            <ArrowRight className="size-4 mr-2" />
            {derivando ? "Derivando..." : "Derivar a Radiografía"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
