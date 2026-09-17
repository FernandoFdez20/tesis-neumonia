import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useNuevaAtencionForm } from "@/components/atenciones/use-nueva-atencion-form"
import { cn } from "@/lib/utils"

function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null
  return (
    <p role="alert" className="text-xs font-medium text-destructive leading-snug">
      {mensaje}
    </p>
  )
}

/** Borde rojo cuando el campo tiene error en vivo; si no, clases base. */
function claseConError(base: string, hayError: boolean) {
  return cn(
    base,
    hayError && "border-destructive/60 focus-visible:ring-destructive/20 focus-visible:border-destructive"
  )
}
type DialogNuevaAtencionProps = {
  abierto: boolean
  onCambioAbierto: (abierto: boolean) => void
  onRegistrarPaciente: () => void
}

export function DialogNuevaAtencion({
  abierto,
  onCambioAbierto,
  onRegistrarPaciente,
}: DialogNuevaAtencionProps) {
  const {
    formId,
    formulario,
    guardando,
    puedeGuardar,
    confirmarRegistroPaciente,
    errores,
    actualizarCampo,
    actualizarDocumentoPaciente,
    handleCambioAbierto,
    handleCambioConfirmacionPaciente,
    buscarPaciente,
    confirmarRegistroNuevoPaciente,
    handleSubmit,
  } = useNuevaAtencionForm({ onCambioAbierto, onRegistrarPaciente })

  return (
    <Dialog open={abierto} onOpenChange={handleCambioAbierto}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[760px]">
        <DialogHeader className="px-5 pt-5 pb-1">
          <DialogTitle>Nueva Atención</DialogTitle>
          <DialogDescription className="mt-1">
            Registra los datos de la atención médica respiratoria antes de la evaluación clínica.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit} className="grid gap-4.5 px-5 pb-5">
          <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-2">
              <Label
                htmlFor={`${formId}-documento-paciente`}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5"
              >
                Documento de identidad
              </Label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input
                  id={`${formId}-documento-paciente`}
                  value={formulario.documentoPaciente}
                  onChange={(event) => actualizarDocumentoPaciente(event.target.value)}
                  placeholder="Ej. 70451298"
                  inputMode="numeric"
                  maxLength={8}
                  autoComplete="off"
                  aria-invalid={!!errores.documentoPaciente}
                  className={claseConError("h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums", !!errores.documentoPaciente)}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={formulario.documentoPaciente.trim().length === 0 || guardando}
                  onClick={buscarPaciente}
                  className="h-10 rounded-xl border border-border/50 px-3.5 font-bold transition-all duration-200 hover:bg-accent/80"
                  aria-label="Buscar paciente por documento"
                >
                  <Search className="size-4" strokeWidth={2.2} />
                  <span className="hidden sm:inline">Buscar</span>
                </Button>
              </div>
              <ErrorCampo mensaje={errores.documentoPaciente} />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor={`${formId}-nombre-paciente`}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5"
              >
                Nombres
              </Label>
              <Input
                id={`${formId}-nombre-paciente`}
                value={formulario.nombrePaciente}
                placeholder="Paciente encontrado por documento"
                disabled
                className="h-10 bg-muted/40 px-3.5 rounded-xl border border-border/60 transition-all duration-200 placeholder:text-muted-foreground/45 disabled:text-muted-foreground/80"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label
                htmlFor={`${formId}-fecha-atencion`}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5"
              >
                Fecha de atención
              </Label>
              <Input
                id={`${formId}-fecha-atencion`}
                value={formulario.fechaAtencion}
                onChange={(event) => actualizarCampo("fechaAtencion", event.target.value)}
                type="date"
                aria-invalid={!!errores.fechaAtencion}
                className={claseConError("h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums", !!errores.fechaAtencion)}
                required
              />
              <ErrorCampo mensaje={errores.fechaAtencion} />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor={`${formId}-hora-atencion`}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5"
              >
                Hora
              </Label>
              <Input
                id={`${formId}-hora-atencion`}
                value={formulario.horaAtencion}
                onChange={(event) => actualizarCampo("horaAtencion", event.target.value)}
                type="time"
                className="h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums"
                required
              />
            </div>

          </div>

          <div className="grid gap-2">
            <Label
              htmlFor={`${formId}-motivo-consulta`}
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5"
            >
              Motivo de consulta
            </Label>
            <Textarea
              id={`${formId}-motivo-consulta`}
              value={formulario.motivoConsulta}
              onChange={(event) => actualizarCampo("motivoConsulta", event.target.value)}
              placeholder="Ej. Tos productiva, fiebre y dificultad respiratoria."
              className="min-h-20 rounded-xl border-border/60 bg-background/50 px-3.5 py-2.5 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label
                htmlFor={`${formId}-presion-arterial`}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5"
              >
                Presión arterial
              </Label>
              <Input
                id={`${formId}-presion-arterial`}
                value={formulario.presionArterial}
                onChange={(event) => actualizarCampo("presionArterial", event.target.value)}
                placeholder="Ej. 120/80"
                autoComplete="off"
                aria-invalid={!!errores.presionArterial}
                className={claseConError("h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums", !!errores.presionArterial)}
                required
              />
              <ErrorCampo mensaje={errores.presionArterial} />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor={`${formId}-frecuencia-cardiaca`}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5"
              >
                Frecuencia cardíaca
              </Label>
              <Input
                id={`${formId}-frecuencia-cardiaca`}
                value={formulario.frecuenciaCardiaca}
                onChange={(event) => actualizarCampo("frecuenciaCardiaca", event.target.value)}
                placeholder="Ej. 82 lpm"
                type="number"
                min={20}
                max={240}
                inputMode="numeric"
                aria-invalid={!!errores.frecuenciaCardiaca}
                className={claseConError("h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums", !!errores.frecuenciaCardiaca)}
                required
              />
              <ErrorCampo mensaje={errores.frecuenciaCardiaca} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label
                htmlFor={`${formId}-temperatura`}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5"
              >
                Temperatura
              </Label>
              <Input
                id={`${formId}-temperatura`}
                value={formulario.temperatura}
                onChange={(event) => actualizarCampo("temperatura", event.target.value)}
                placeholder="Ej. 37.2 °C"
                type="number"
                min={30}
                max={45}
                step="0.1"
                inputMode="decimal"
                aria-invalid={!!errores.temperatura}
                className={claseConError("h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums", !!errores.temperatura)}
                required
              />
              <ErrorCampo mensaje={errores.temperatura} />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor={`${formId}-frecuencia-respiratoria`}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5"
              >
                Frecuencia respiratoria
              </Label>
              <Input
                id={`${formId}-frecuencia-respiratoria`}
                value={formulario.frecuenciaRespiratoria}
                onChange={(event) => actualizarCampo("frecuenciaRespiratoria", event.target.value)}
                placeholder="Ej. 18 rpm"
                type="number"
                min={5}
                max={80}
                inputMode="numeric"
                aria-invalid={!!errores.frecuenciaRespiratoria}
                className={claseConError("h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums", !!errores.frecuenciaRespiratoria)}
                required
              />
              <ErrorCampo mensaje={errores.frecuenciaRespiratoria} />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor={`${formId}-saturacion-oxigeno`}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5"
              >
                Saturación O2
              </Label>
              <Input
                id={`${formId}-saturacion-oxigeno`}
                value={formulario.saturacionOxigeno}
                onChange={(event) => actualizarCampo("saturacionOxigeno", event.target.value)}
                placeholder="Ej. 96 %"
                type="number"
                min={50}
                max={100}
                inputMode="numeric"
                aria-invalid={!!errores.saturacionOxigeno}
                className={claseConError("h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums", !!errores.saturacionOxigeno)}
                required
              />
              <ErrorCampo mensaje={errores.saturacionOxigeno} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
            <div className="grid gap-2">
              <Label
                htmlFor={`${formId}-tiempo-evolucion`}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5"
              >
                Tiempo de evolución
              </Label>
              <Input
                id={`${formId}-tiempo-evolucion`}
                value={formulario.tiempoEvolucionDias}
                onChange={(event) => actualizarCampo("tiempoEvolucionDias", event.target.value)}
                placeholder="Ej. 3 días"
                type="number"
                min={0}
                max={90}
                inputMode="numeric"
                aria-invalid={!!errores.tiempoEvolucionDias}
                className={claseConError("h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums", !!errores.tiempoEvolucionDias)}
                required
              />
              <ErrorCampo mensaje={errores.tiempoEvolucionDias} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-row items-center justify-between rounded-xl border border-border/60 bg-background/50 p-4 shadow-sm">
              <div className="space-y-0.5">
                <Label
                  htmlFor={`${formId}-confusion`}
                  className="text-sm font-bold text-foreground"
                >
                  Confusión Mental
                </Label>
                <p className="text-xs text-muted-foreground">
                  ¿Presenta el paciente confusión mental aguda o desorientación de nueva aparición? (Requisito CRB-65)
                </p>
              </div>
              <Switch
                id={`${formId}-confusion`}
                checked={formulario.confusion}
                onCheckedChange={(checked) => actualizarCampo("confusion", checked)}
              />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor={`${formId}-sintomas-principales`}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5"
              >
                Síntomas principales
              </Label>
              <Textarea
                id={`${formId}-sintomas-principales`}
                value={formulario.sintomasPrincipales}
                onChange={(event) => actualizarCampo("sintomasPrincipales", event.target.value)}
                placeholder="Ej. Tos, fiebre, disnea, dolor torácico."
                className="min-h-24 rounded-xl border-border/60 bg-background/50 px-3.5 py-2.5 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor={`${formId}-observaciones`}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5"
              >
                Observaciones
              </Label>
              <Textarea
                id={`${formId}-observaciones`}
                value={formulario.observaciones}
                onChange={(event) => actualizarCampo("observaciones", event.target.value)}
                placeholder="Notas clínicas adicionales si corresponde."
                className="min-h-24 rounded-xl border-border/60 bg-background/50 px-3.5 py-2.5 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45"
              />
            </div>
          </div>
        </form>

        <DialogFooter className="px-5 py-4 border-t border-border/40 bg-muted/10">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={guardando}
              className="cursor-pointer rounded-xl font-bold h-10 border border-border/50 hover:bg-accent/80 transition-all duration-200"
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form={formId}
            disabled={!puedeGuardar}
            className="cursor-pointer rounded-xl font-bold h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200"
          >
            {guardando ? "Guardando..." : "Guardar Atención"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <Dialog
        open={confirmarRegistroPaciente}
        onOpenChange={handleCambioConfirmacionPaciente}
      >
        <DialogContent className="max-w-[400px]">
          <DialogHeader className="px-5 pt-5 pb-1">
            <DialogTitle>Paciente no registrado</DialogTitle>
            <DialogDescription className="mt-1">
              ¿El paciente no existe, desea registrar el paciente?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="px-5 py-4 border-t border-border/40 bg-muted/10">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer rounded-xl font-bold h-10 border border-border/50 hover:bg-accent/80 transition-all duration-200"
              >
                No
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={confirmarRegistroNuevoPaciente}
              className="cursor-pointer rounded-xl font-bold h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200"
            >
              Sí
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
