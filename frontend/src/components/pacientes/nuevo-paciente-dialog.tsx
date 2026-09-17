import type { FormEvent } from "react"
import { useId, useMemo, useState } from "react"
import { ChevronDown, Search } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PacienteDisponible } from "@/components/pacientes/datos-pacientes"
import type { RegistroPaciente } from "@/components/pacientes/use-pacientes"
import { registrarPaciente } from "@/services/pacientes.service"

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
  fechaNacimiento: string
  sexo: string
  antecedentesFamiliares: string[]
  antecedentesPersonales: string[]
}

const formularioInicial: FormularioPaciente = {
  nombreCompleto: "",
  dni: "",
  fechaNacimiento: "",
  sexo: "",
  antecedentesFamiliares: [],
  antecedentesPersonales: [],
}

/** El sistema solo atiende adultos (18 años o más), igual que el modelo de IA. */
export function esMayorDeEdad(fechaNacimiento: string): boolean {
  if (!fechaNacimiento) return false
  const hoy = new Date()
  const nac = new Date(fechaNacimiento)
  if (Number.isNaN(nac.getTime())) return false
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
    edad--
  }
  return edad >= 18
}

type OpcionAntecedente = {
  value: string
  label: string
}

const antecedentesFamiliaresOpciones: OpcionAntecedente[] = [
  { value: "asma", label: "Asma" },
  { value: "epoc", label: "EPOC" },
  { value: "diabetes", label: "Diabetes mellitus" },
  { value: "hipertension", label: "Hipertensión arterial" },
  { value: "tuberculosis", label: "Tuberculosis" },
  { value: "neumonia-recurrente", label: "Neumonía recurrente" },
]

const antecedentesPersonalesOpciones: OpcionAntecedente[] = [
  { value: "asma", label: "Asma" },
  { value: "epoc", label: "EPOC" },
  { value: "diabetes", label: "Diabetes mellitus" },
  { value: "hipertension", label: "Hipertensión arterial" },
  { value: "tabaquismo", label: "Tabaquismo" },
  { value: "inmunosupresion", label: "Inmunosupresión" },
]

export function DialogNuevoPaciente({
  abierto,
  onCambioAbierto,
  onRegistrarCita,
  pacientesRegistrados: _pacientesRegistrados,
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
      formulario.fechaNacimiento.trim().length > 0 &&
      esMayorDeEdad(formulario.fechaNacimiento) &&
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

  function alternarAntecedente(
    campo: "antecedentesFamiliares" | "antecedentesPersonales",
    valor: string
  ) {
    setFormulario((actual) => {
      const valoresActuales = actual[campo]
      const siguienteValores = valoresActuales.includes(valor)
        ? valoresActuales.filter((antecedente) => antecedente !== valor)
        : [...valoresActuales, valor]

      return {
        ...actual,
        [campo]: siguienteValores,
      }
    })
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

  const [buscando, setBuscando] = useState(false)

  async function buscarPaciente() {
    const dni = formulario.dni.trim()

    if (!dni) {
      console.warn("[Búsqueda de Paciente] DNI vacío")
      return
    }

    console.log(`[Búsqueda de Paciente] Buscando DNI: ${dni}`)
    setBuscando(true)

    try {
      const { getPacientePorDni } = await import("@/services/pacientes.service")
      const paciente = await getPacientePorDni(dni)
      
      console.log("[Búsqueda de Paciente] ✓ Paciente encontrado")
      
      if (paciente.en_atencion) {
        toast.error("Atención en proceso", {
          description: "El paciente ya existe y actualmente tiene una atención médica activa.",
        })
        setFormulario((actual) => ({
          ...formularioInicial,
          dni: actual.dni,
        }))
        return
      }

      // Mapear al formato del estado (si es necesario) para mostrarlo
      const formPaciente: FormularioPaciente = {
        nombreCompleto: paciente.nombres_apellidos,
        dni: paciente.dni,
        fechaNacimiento: paciente.fecha_nacimiento,
        sexo: paciente.sexo,
        antecedentesFamiliares: paciente.antecedentes_familiares ? paciente.antecedentes_familiares.split(", ") : [],
        antecedentesPersonales: paciente.otros_antecedentes ? paciente.otros_antecedentes.split(", ") : []
      }
      
      setFormulario(formPaciente)
      setCamposHabilitados(false)
      
      // Adaptar al tipo que espera el modal
      setPacienteAConfirmar({
        ...formPaciente,
        registradoEn: paciente.created_at
      } as any)
      
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`[Búsqueda de Paciente] ✗ No se encontró paciente con DNI: ${dni}`)
        setCamposHabilitados(true)
        setFormulario((actual) => ({
          ...formularioInicial,
          dni: actual.dni,
        }))

        toast.warning("No se tiene registrado a ningún paciente con ese documento", {
          description: "Completa los datos del paciente para crear un nuevo registro.",
        })
      } else {
        toast.error("Error al buscar el paciente")
      }
    } finally {
      setBuscando(false)
    }
  }

  function confirmarCita() {
    setPacienteAConfirmar(null)
    handleCambioAbierto(false)
    onRegistrarCita()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!puedeGuardar) {
      console.error("[Registro de Paciente] Formulario inválido o incompleto")
      return
    }

    try {
      await registrarPaciente({
        dni: formulario.dni,
        nombres_apellidos: formulario.nombreCompleto,
        sexo: formulario.sexo,
        fecha_nacimiento: formulario.fechaNacimiento,
        antecedentes_familiares: formulario.antecedentesFamiliares.join(", "),
        otros_antecedentes: formulario.antecedentesPersonales.join(", "),
      })

      // Actualizar el estado visual del frontend
      agregarPacienteRegistrado(formulario)

      toast.success("Paciente registrado correctamente", {
        description: `${formulario.nombreCompleto} ha sido guardado en la base de datos.`,
      })

      handleCambioAbierto(false)
    } catch (error) {
      console.error("✗ Error al registrar paciente:", error)
      toast.error("Error al registrar paciente", {
        description: "Hubo un problema al guardar en la BD. Revisa la conexión.",
      })
    }
  }

  return (
    <>
      <Dialog open={abierto} onOpenChange={handleCambioAbierto}>
        <DialogContent className="max-w-[680px]">
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
                  disabled={formulario.dni.trim().length === 0 || buscando}
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
                <Label htmlFor={`${formId}-birth-date`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">
                  Fecha de nacimiento
                </Label>
                <Input
                  id={`${formId}-birth-date`}
                  value={formulario.fechaNacimiento}
                  onChange={(event) => actualizarCampo("fechaNacimiento", event.target.value)}
                  type="date"
                  disabled={camposDesabilitados}
                  className="h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums disabled:bg-muted/40 disabled:text-muted-foreground/70"
                  required
                />
                {formulario.fechaNacimiento.trim().length > 0 &&
                  !esMayorDeEdad(formulario.fechaNacimiento) && (
                    <p className="text-xs font-medium text-destructive">
                      El paciente debe tener 18 años o más.
                    </p>
                  )}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <MultiComboboxAntecedentes
                id={`${formId}-antecedentes-familiares`}
                label="Antecedentes familiares"
                placeholder="Selecciona antecedentes familiares"
                opciones={antecedentesFamiliaresOpciones}
                valores={formulario.antecedentesFamiliares}
                disabled={camposDesabilitados}
                onToggle={(valor) => alternarAntecedente("antecedentesFamiliares", valor)}
              />

              <MultiComboboxAntecedentes
                id={`${formId}-antecedentes-personales`}
                label="Antecedentes personales"
                placeholder="Selecciona antecedentes personales"
                opciones={antecedentesPersonalesOpciones}
                valores={formulario.antecedentesPersonales}
                disabled={camposDesabilitados}
                onToggle={(valor) => alternarAntecedente("antecedentesPersonales", valor)}
              />
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

type MultiComboboxAntecedentesProps = {
  id: string
  label: string
  placeholder: string
  opciones: OpcionAntecedente[]
  valores: string[]
  disabled: boolean
  onToggle: (valor: string) => void
}

function MultiComboboxAntecedentes({
  id,
  label,
  placeholder,
  opciones,
  valores,
  disabled,
  onToggle,
}: MultiComboboxAntecedentesProps) {
  const opcionesSeleccionadas = opciones.filter((opcion) =>
    valores.includes(opcion.value)
  )

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">
        {label}
      </Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-auto min-h-10 justify-between rounded-xl border-border/60 bg-background/50 px-3.5 py-2 text-left font-medium text-foreground/80 hover:bg-background disabled:bg-muted/40 disabled:text-muted-foreground/70"
          >
            <span className="line-clamp-1 text-sm">
              {opcionesSeleccionadas.length > 0
                ? `${opcionesSeleccionadas.length} seleccionado(s)`
                : placeholder}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground/60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] rounded-xl p-1.5">
          {opciones.map((opcion) => (
            <DropdownMenuCheckboxItem
              key={opcion.value}
              checked={valores.includes(opcion.value)}
              onCheckedChange={() => onToggle(opcion.value)}
              onSelect={(event) => event.preventDefault()}
              className="cursor-pointer rounded-lg py-2"
            >
              {opcion.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {opcionesSeleccionadas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {opcionesSeleccionadas.map((opcion) => (
            <Badge key={opcion.value} variant="outline" className="h-6 rounded-lg bg-background/60">
              {opcion.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
