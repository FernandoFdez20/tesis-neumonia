import type { FormEvent } from "react"
import { useId, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"

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
import { buscarPacientePorDni } from "@/components/pacientes/datos-pacientes"

type DialogNuevaAtencionProps = {
  abierto: boolean
  onCambioAbierto: (abierto: boolean) => void
  onRegistrarPaciente: () => void
}

type FormularioAtencion = {
  documentoPaciente: string
  nombrePaciente: string
  presionArterial: string
  frecuenciaCardiaca: string
  temperatura: string
  saturacionOxigeno: string
}

const formularioInicial: FormularioAtencion = {
  documentoPaciente: "",
  nombrePaciente: "",
  presionArterial: "",
  frecuenciaCardiaca: "",
  temperatura: "",
  saturacionOxigeno: "",
}

export function DialogNuevaAtencion({
  abierto,
  onCambioAbierto,
  onRegistrarPaciente,
}: DialogNuevaAtencionProps) {
  const formId = useId()
  const [formulario, setFormulario] = useState<FormularioAtencion>(formularioInicial)
  const [guardando, setGuardando] = useState(false)
  const [confirmarRegistroPaciente, setConfirmarRegistroPaciente] = useState(false)

  const puedeGuardar = useMemo(
    () =>
      formulario.documentoPaciente.trim().length > 0 &&
      formulario.nombrePaciente.trim().length > 0 &&
      formulario.presionArterial.trim().length > 0 &&
      formulario.frecuenciaCardiaca.trim().length > 0 &&
      formulario.temperatura.trim().length > 0 &&
      formulario.saturacionOxigeno.trim().length > 0 &&
      !guardando,
    [formulario, guardando]
  )

  function actualizarCampo(campo: keyof FormularioAtencion, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  function actualizarDocumentoPaciente(valor: string) {
    setFormulario((actual) => ({
      ...actual,
      documentoPaciente: valor,
      nombrePaciente: "",
    }))
  }

  function reiniciarFormulario() {
    setFormulario(formularioInicial)
    setConfirmarRegistroPaciente(false)
  }

  function handleCambioAbierto(siguienteAbierto: boolean) {
    if (guardando) {
      return
    }

    onCambioAbierto(siguienteAbierto)

    if (!siguienteAbierto) {
      reiniciarFormulario()
    }
  }

  function buscarPaciente() {
    const paciente = buscarPacientePorDni(formulario.documentoPaciente)

    if (paciente) {
      setFormulario((actual) => ({
        ...actual,
        documentoPaciente: paciente.dni,
        nombrePaciente: paciente.nombreCompleto,
      }))
      return
    }

    setFormulario((actual) => ({
      ...actual,
      nombrePaciente: "",
    }))
    setConfirmarRegistroPaciente(true)
  }

  function confirmarRegistroNuevoPaciente() {
    setConfirmarRegistroPaciente(false)
    handleCambioAbierto(false)
    onRegistrarPaciente()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!puedeGuardar) {
      return
    }

    setGuardando(true)

    try {
      console.info("Atención registrada temporalmente", formulario)

      await Promise.resolve()

      toast.success("Atención guardada correctamente", {
        description:
          "Los signos vitales fueron registrados y quedarán listos para la evaluación clínica.",
      })

      handleCambioAbierto(false)
    } catch (error) {
      console.error("No se pudo guardar la atención", error)

      toast.error("No se pudo guardar la atención", {
        description:
          "Verifica la información ingresada o intenta nuevamente cuando el servicio esté disponible.",
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={handleCambioAbierto}>
      <DialogContent className="max-w-[460px]">
        <DialogHeader className="px-5 pt-5 pb-1">
          <DialogTitle>Nueva Atención</DialogTitle>
          <DialogDescription className="mt-1">
            Registra la toma inicial de signos vitales para la atención clínica respiratoria.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit} className="grid gap-4.5 px-5 pb-5">
          <div className="grid gap-4">
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
                  className="h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums"
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
              placeholder="Ej. 120/80 mmHg"
              autoComplete="off"
              className="h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                className="h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums"
                required
              />
            </div>

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
                className="h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor={`${formId}-saturacion-oxigeno`}
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5"
            >
              Saturación de oxígeno
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
              className="h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums"
              required
            />
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
        onOpenChange={(siguienteAbierto) => {
          if (!siguienteAbierto) {
            setConfirmarRegistroPaciente(false)
          }
        }}
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
