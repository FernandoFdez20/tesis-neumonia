import { useState } from "react"
import {
  Activity,
  CalendarClock,
  FileText,
  HeartPulse,
  ImagePlus,
  Save,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  UserRound,
  Wind,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { DatosDiagnosticoMock } from "@/components/diagnostico/datos-diagnostico"
import { RegistroDiagnosticoFinalDialog } from "@/components/diagnostico/registro-diagnostico-final-dialog"

type CampoEditable =
  | "temperatura"
  | "frecuenciaCardiaca"
  | "frecuenciaRespiratoria"
  | "saturacionO2"
  | "presionArterial"
  | "tiempoEvolucionDias"
  | "sintomasPrincipales"
  | "examenFisico"
  | "observacionesClinicas"
  | "estado"

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground/85">{value}</p>
    </div>
  )
}

function SignoVitalField({
  id,
  label,
  value,
  icon: Icon,
  onChange,
}: {
  id: string
  label: string
  value: string
  icon: typeof Activity
  onChange: (valor: string) => void
}) {
  return (
    <div className="grid gap-2">
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
      >
        <Icon className="size-3.5" />
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-xl border-border/60 bg-background/50 px-3.5 tabular-nums"
      />
    </div>
  )
}

type DiagnosticoFormProps = {
  diagnosticoInicial: DatosDiagnosticoMock
}

export function DiagnosticoForm({ diagnosticoInicial }: DiagnosticoFormProps) {
  const [formulario, setFormulario] = useState(diagnosticoInicial)
  const [dialogDiagnosticoAbierto, setDialogDiagnosticoAbierto] = useState(false)

  function actualizarCampo(campo: CampoEditable, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  function handleActualizarDatos() {
    toast.success("Datos de atención actualizados", {
      description: "Los cambios quedaron guardados temporalmente en modo plantilla.",
    })
  }

  function handleGenerarOrdenRadiografia() {
    toast.success("Orden de radiografía generada", {
      description:
        "La atención queda pendiente de imágenes para continuar el flujo diagnóstico.",
    })
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary/70 leading-none">
              Evaluación médica
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground/90 leading-tight">
                Diagnóstico
              </h1>
              <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-400">
                {formulario.estado}
              </Badge>
            </div>
            <p className="max-w-3xl text-base text-muted-foreground/70 leading-relaxed font-medium">
              Actualiza la atención médica, registra examen físico y decide la conducta
              diagnóstica inicial.
            </p>
          </div>

          <Button
            type="button"
            size="lg"
            className="gap-2 rounded-xl font-bold"
            onClick={handleActualizarDatos}
          >
            <Save className="size-4" />
            Actualizar datos
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <UserRound className="size-4.5 text-primary" />
                Información del paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Paciente" value={formulario.paciente} />
              <InfoItem label="DNI" value={formulario.dni} />
              <InfoItem label="Edad / Sexo" value={`${formulario.edad} años · ${formulario.sexo}`} />
              <InfoItem label="Paciente ID" value={`#${formulario.pacienteId}`} />
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <CalendarClock className="size-4.5 text-primary" />
                Información de la atención
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Código" value={formulario.codigoAtencion} />
              <InfoItem label="Fecha registro" value={formulario.fechaRegistro} />
              <InfoItem label="Registrado por" value={formulario.responsableAtencion} />
              <InfoItem label="Médico" value={formulario.medicoResponsable} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <HeartPulse className="size-4.5 text-primary" />
              Signos vitales
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SignoVitalField
              id="temperatura"
              label="Temperatura (°C)"
              value={formulario.temperatura}
              icon={Thermometer}
              onChange={(valor) => actualizarCampo("temperatura", valor)}
            />
            <SignoVitalField
              id="frecuencia-cardiaca"
              label="Frecuencia cardíaca"
              value={formulario.frecuenciaCardiaca}
              icon={HeartPulse}
              onChange={(valor) => actualizarCampo("frecuenciaCardiaca", valor)}
            />
            <SignoVitalField
              id="frecuencia-respiratoria"
              label="Frecuencia respiratoria"
              value={formulario.frecuenciaRespiratoria}
              icon={Wind}
              onChange={(valor) => actualizarCampo("frecuenciaRespiratoria", valor)}
            />
            <SignoVitalField
              id="saturacion-o2"
              label="Saturación O2"
              value={formulario.saturacionO2}
              icon={Activity}
              onChange={(valor) => actualizarCampo("saturacionO2", valor)}
            />
            <SignoVitalField
              id="presion-arterial"
              label="Presión arterial"
              value={formulario.presionArterial}
              icon={Activity}
              onChange={(valor) => actualizarCampo("presionArterial", valor)}
            />
            <SignoVitalField
              id="tiempo-evolucion"
              label="Tiempo evolución (días)"
              value={formulario.tiempoEvolucionDias}
              icon={CalendarClock}
              onChange={(valor) => actualizarCampo("tiempoEvolucionDias", valor)}
            />
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <FileText className="size-4.5 text-primary" />
                Síntomas y examen físico
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="sintomas-principales"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
                >
                  Síntomas principales
                </Label>
                <Textarea
                  id="sintomas-principales"
                  value={formulario.sintomasPrincipales}
                  onChange={(event) =>
                    actualizarCampo("sintomasPrincipales", event.target.value)
                  }
                  className="min-h-28 rounded-xl border-border/60 bg-background/50 px-3.5 py-2.5"
                />
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="examen-fisico"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
                >
                  Examen físico
                </Label>
                <Textarea
                  id="examen-fisico"
                  value={formulario.examenFisico}
                  onChange={(event) => actualizarCampo("examenFisico", event.target.value)}
                  className="min-h-32 rounded-xl border-border/60 bg-background/50 px-3.5 py-2.5"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <ShieldCheck className="size-4.5 text-primary" />
                Observaciones clínicas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="observaciones-clinicas"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
                >
                  Observaciones
                </Label>
                <Textarea
                  id="observaciones-clinicas"
                  value={formulario.observacionesClinicas}
                  onChange={(event) =>
                    actualizarCampo("observacionesClinicas", event.target.value)
                  }
                  className="min-h-40 rounded-xl border-border/60 bg-background/50 px-3.5 py-2.5"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Estado de atención
                </Label>
                <Select
                  value={formulario.estado}
                  onValueChange={(valor) => actualizarCampo("estado", valor)}
                >
                  <SelectTrigger className="rounded-xl border-border/60 bg-background/50">
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="En proceso">En proceso</SelectItem>
                    <SelectItem value="Finalizada">Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="gap-2 rounded-xl border-primary/30 font-bold text-primary hover:bg-primary/8"
              onClick={() => setDialogDiagnosticoAbierto(true)}
            >
              <Stethoscope className="size-4" />
              Dar Veredicto Directo
            </Button>
            <Button
              type="button"
              size="lg"
              className="gap-2 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
              onClick={handleGenerarOrdenRadiografia}
            >
              <ImagePlus className="size-4" />
              Generar Orden de Radiografía
            </Button>
          </CardContent>
        </Card>
      </div>

      <RegistroDiagnosticoFinalDialog
        abierto={dialogDiagnosticoAbierto}
        onCambioAbierto={setDialogDiagnosticoAbierto}
      />
    </>
  )
}
