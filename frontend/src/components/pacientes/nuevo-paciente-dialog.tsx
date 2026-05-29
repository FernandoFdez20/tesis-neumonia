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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { buscarPacientePorDni } from "@/components/pacientes/datos-pacientes"
import type { PacienteDisponible } from "@/components/pacientes/datos-pacientes"
import type { RegistroPaciente } from "@/components/pacientes/use-pacientes"

type DialogNuevoPacienteProps = {
  abierto: boolean
  onCambioAbierto: (abierto: boolean) => void
  onRegistrarCita: () => void
  pacientesRegistrados: RegistroPaciente[]
  agregarPacienteRegistrado: (paciente: RegistroPaciente) => RegistroPaciente
}

type FormularioPaciente = {
  nombreCompleto: string
  dni: string
  edad: string
  sexo: string
}

const formularioInicial: FormularioPaciente = {
  nombreCompleto: "",
  dni: "",
  edad: "",
  sexo: "",
}

export function DialogNuevoPaciente({
  abierto,
  onCambioAbierto,
  onRegistrarCita,
  pacientesRegistrados,
  agregarPacienteRegistrado,
}: DialogNuevoPacienteProps) {
  const formId = useId()
  const [formulario, setFormulario] = useState<FormularioPaciente>(formularioInicial)
  const [camposHabilitados, setCamposHabilitados] = useState(false)
  const [pacienteAConfirmar, setPacienteAConfirmar] = useState<PacienteDisponible | null>(null)
  const camposDesabilitados = !camposHabilitados

  const puedeGuardar = useMemo(
    () =>
      camposHabilitados &&
      formulario.nombreCompleto.trim().length > 0 &&
      formulario.dni.trim().length > 0 &&
      formulario.edad.trim().length > 0 &&
      formulario.sexo.length > 0,
    [formulario, camposHabilitados]
  )

  function actualizarCampo(campo: keyof FormularioPaciente, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  function actualizarDocumento(valor: string) {
    setFormulario({
      ...formularioInicial,
      dni: valor,
    })
    setCamposHabilitados(false)
    setPacienteAConfirmar(null)
  }

  function reiniciarEstadoDialogo() {
    setFormulario(formularioInicial)
    setCamposHabilitados(false)
    setPacienteAConfirmar(null)
  }

  function handleCambioAbierto(siguienteAbierto: boolean) {
    onCambioAbierto(siguienteAbierto)

    if (!siguienteAbierto) {
      reiniciarEstadoDialogo()
    }
  }

  function buscarPaciente() {
    const dni = formulario.dni.trim()

    if (!dni) {
      console.warn("[Búsqueda de Paciente] DNI vacío")
      return
    }

    console.log(`[Búsqueda de Paciente] Buscando DNI: ${dni}`)

    const paciente = buscarPacientePorDni(dni, pacientesRegistrados)

    if (paciente) {
      console.log("[Búsqueda de Paciente] ✓ Paciente encontrado", {
        nombre: paciente.nombreCompleto,
        dni: paciente.dni,
        edad: paciente.edad,
        sexo: paciente.sexo,
        registradoEn: (paciente as RegistroPaciente).registradoEn,
      })
      setFormulario(paciente)
      setCamposHabilitados(false)
      setPacienteAConfirmar(paciente)
      return
    }

    console.warn(`[Búsqueda de Paciente] ✗ No se encontró paciente con DNI: ${dni}`)
    setCamposHabilitados(true)
    setFormulario((actual) => ({
      ...formularioInicial,
      dni: actual.dni,
    }))

    toast.warning("No se tiene registrado a ningún paciente con ese documento", {
      description:
        "Completa los datos del paciente para crear un registro temporal.",
    })
  }

  function confirmarCita() {
    setPacienteAConfirmar(null)
    handleCambioAbierto(false)
    onRegistrarCita()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!puedeGuardar) {
      console.error("[Registro de Paciente] Formulario inválido o incompleto")
      return
    }

    console.group("📋 Registro de Paciente")
    console.log("Datos del formulario:", {
      nombreCompleto: formulario.nombreCompleto,
      dni: formulario.dni,
      edad: formulario.edad,
      sexo: formulario.sexo,
    })
    
    try {
      const nuevoPaciente = agregarPacienteRegistrado(formulario)
      console.log("✓ Paciente registrado exitosamente en el sistema:", nuevoPaciente)
      console.log(`Total de pacientes registrados: ${pacientesRegistrados.length + 1}`)
      console.groupEnd()

      toast.success("Paciente registrado correctamente", {
        description: `${formulario.nombreCompleto} (DNI ${formulario.dni}) ha sido añadido al registro temporal.`,
      })

      handleCambioAbierto(false)
    } catch (error) {
      console.error("✗ Error al registrar paciente:", error)
      console.groupEnd()
      
      toast.error("Error al registrar paciente", {
        description: "Hubo un problema al guardar los datos. Intenta nuevamente.",
      })
    }
  }

  return (
    <>
      <Dialog open={abierto} onOpenChange={handleCambioAbierto}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader className="px-5 pt-5 pb-1">
            <DialogTitle>Nuevo registro de paciente</DialogTitle>
            <DialogDescription className="mt-1">
              Busca primero el documento del paciente para validar si ya existe en el registro.
            </DialogDescription>
          </DialogHeader>

          <form id={formId} onSubmit={handleSubmit} className="grid gap-4.5 px-5 pb-5">
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-dni`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">
                DNI / Documento
              </Label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input
                  id={`${formId}-dni`}
                  value={formulario.dni}
                  onChange={(event) => actualizarDocumento(event.target.value)}
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
                  disabled={formulario.dni.trim().length === 0}
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
              <Label htmlFor={`${formId}-full-name`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">
                Nombres y Apellidos completos
              </Label>
              <Input
                id={`${formId}-full-name`}
                value={formulario.nombreCompleto}
                onChange={(event) => actualizarCampo("nombreCompleto", event.target.value)}
                placeholder="Ej. María Elena Vargas Ruiz"
                autoComplete="name"
                disabled={camposDesabilitados}
                className="h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 disabled:bg-muted/40 disabled:text-muted-foreground/70"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
              <div className="grid gap-2">
                <Label htmlFor={`${formId}-age`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">
                  Edad (Años)
                </Label>
                <Input
                  id={`${formId}-age`}
                  value={formulario.edad}
                  onChange={(event) => actualizarCampo("edad", event.target.value)}
                  placeholder="45"
                  type="number"
                  min={18}
                  max={120}
                  disabled={camposDesabilitados}
                  className="h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums disabled:bg-muted/40 disabled:text-muted-foreground/70"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`${formId}-sex`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">
                  Sexo biológico
                </Label>
                <Select
                  value={formulario.sexo}
                  onValueChange={(valor) => actualizarCampo("sexo", valor)}
                  disabled={camposDesabilitados}
                  required
                >
                  <SelectTrigger id={`${formId}-sex`} className="rounded-xl border-border/60 disabled:bg-muted/40 disabled:text-muted-foreground/70">
                    <SelectValue placeholder="Selecciona el sexo biológico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="femenino" className="rounded-lg">Femenino</SelectItem>
                    <SelectItem value="masculino" className="rounded-lg">Masculino</SelectItem>
                    <SelectItem value="no-especificado" className="rounded-lg">No especificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>

          <DialogFooter className="px-5 py-4 border-t border-border/40 bg-muted/10">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="cursor-pointer rounded-xl font-bold h-10 border border-border/50 hover:bg-accent/80 transition-all duration-200">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" form={formId} disabled={!puedeGuardar} className="cursor-pointer rounded-xl font-bold h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200">
              Guardar registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pacienteAConfirmar !== null}
        onOpenChange={(siguienteAbierto) => {
          if (!siguienteAbierto) {
            setPacienteAConfirmar(null)
          }
        }}
      >
        <DialogContent className="max-w-[400px]">
          <DialogHeader className="px-5 pt-5 pb-1">
            <DialogTitle>Paciente encontrado</DialogTitle>
            <DialogDescription className="mt-1">
              ¿Quiere registrar una cita para el paciente "{pacienteAConfirmar?.nombreCompleto}" con "{pacienteAConfirmar?.dni}"?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="px-5 py-4 border-t border-border/40 bg-muted/10">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="cursor-pointer rounded-xl font-bold h-10 border border-border/50 hover:bg-accent/80 transition-all duration-200">
                No
              </Button>
            </DialogClose>
            <Button type="button" onClick={confirmarCita} className="cursor-pointer rounded-xl font-bold h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200">
              Sí
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
