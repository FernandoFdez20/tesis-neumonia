import type { FormEvent } from "react"
import { useId, useMemo, useState } from "react"
import { toast } from "sonner"

import { buscarPacientePorDni } from "@/components/pacientes/datos-pacientes"
import {
  registrarAtencion,
  type CrearAtencionRequest,
  type EstadoAtencion,
} from "@/services/atenciones.service"

type UseNuevaAtencionFormParams = {
  onCambioAbierto: (abierto: boolean) => void
  onRegistrarPaciente: () => void
}

export type FormularioAtencion = {
  documentoPaciente: string
  nombrePaciente: string
  fechaAtencion: string
  horaAtencion: string
  motivoConsulta: string
  presionArterial: string
  frecuenciaCardiaca: string
  frecuenciaRespiratoria: string
  temperatura: string
  saturacionOxigeno: string
  tiempoEvolucionDias: string
  sintomasPrincipales: string
  confusion: boolean
  estadoAtencion: EstadoAtencion
  observaciones: string
}

function crearFormularioInicial(): FormularioAtencion {
  const ahora = new Date()
  const anio = ahora.getFullYear()
  const mes = String(ahora.getMonth() + 1).padStart(2, "0")
  const dia = String(ahora.getDate()).padStart(2, "0")

  return {
    documentoPaciente: "",
    nombrePaciente: "",
    fechaAtencion: `${anio}-${mes}-${dia}`,
    horaAtencion: ahora.toTimeString().slice(0, 5),
    motivoConsulta: "",
    presionArterial: "",
    frecuenciaCardiaca: "",
    frecuenciaRespiratoria: "",
    temperatura: "",
    saturacionOxigeno: "",
    tiempoEvolucionDias: "",
    sintomasPrincipales: "",
    confusion: false,
    estadoAtencion: "pendiente-evaluacion",
    observaciones: "",
  }
}

function crearRequestAtencion(formulario: FormularioAtencion): CrearAtencionRequest {
  return {
    documento_paciente: formulario.documentoPaciente,
    nombre_paciente: formulario.nombrePaciente,
    fecha_atencion: formulario.fechaAtencion,
    hora_atencion: formulario.horaAtencion,
    motivo_consulta: formulario.motivoConsulta,
    temperatura: formulario.temperatura,
    frecuencia_cardiaca: formulario.frecuenciaCardiaca,
    frecuencia_respiratoria: formulario.frecuenciaRespiratoria,
    saturacion_o2: formulario.saturacionOxigeno,
    presion_arterial: formulario.presionArterial,
    tiempo_evolucion_dias: formulario.tiempoEvolucionDias,
    sintomas_principales: formulario.sintomasPrincipales,
    confusion: formulario.confusion,
    estado_atencion: formulario.estadoAtencion,
    observaciones: formulario.observaciones.trim() || null,
  }
}

export function useNuevaAtencionForm({
  onCambioAbierto,
  onRegistrarPaciente,
}: UseNuevaAtencionFormParams) {
  const formId = useId()
  const [formulario, setFormulario] = useState<FormularioAtencion>(crearFormularioInicial)
  const [guardando, setGuardando] = useState(false)
  const [confirmarRegistroPaciente, setConfirmarRegistroPaciente] = useState(false)

  const puedeGuardar = useMemo(
    () =>
      formulario.documentoPaciente.trim().length > 0 &&
      formulario.nombrePaciente.trim().length > 0 &&
      formulario.fechaAtencion.trim().length > 0 &&
      formulario.horaAtencion.trim().length > 0 &&
      formulario.motivoConsulta.trim().length > 0 &&
      formulario.presionArterial.trim().length > 0 &&
      formulario.frecuenciaCardiaca.trim().length > 0 &&
      formulario.frecuenciaRespiratoria.trim().length > 0 &&
      formulario.temperatura.trim().length > 0 &&
      formulario.saturacionOxigeno.trim().length > 0 &&
      formulario.tiempoEvolucionDias.trim().length > 0 &&
      formulario.sintomasPrincipales.trim().length > 0 &&
      !guardando,
    [formulario, guardando]
  )

  function actualizarCampo<T extends keyof FormularioAtencion>(
    campo: T,
    valor: FormularioAtencion[T]
  ) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  function actualizarEstadoAtencion(valor: string) {
    actualizarCampo("estadoAtencion", valor as EstadoAtencion)
  }

  function actualizarDocumentoPaciente(valor: string) {
    setFormulario((actual) => ({
      ...actual,
      documentoPaciente: valor,
      nombrePaciente: "",
    }))
  }

  function reiniciarFormulario() {
    setFormulario(crearFormularioInicial())
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

  function handleCambioConfirmacionPaciente(siguienteAbierto: boolean) {
    if (!siguienteAbierto) {
      setConfirmarRegistroPaciente(false)
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
      await registrarAtencion(crearRequestAtencion(formulario))

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

  return {
    formId,
    formulario,
    guardando,
    puedeGuardar,
    confirmarRegistroPaciente,
    actualizarCampo,
    actualizarEstadoAtencion,
    actualizarDocumentoPaciente,
    handleCambioAbierto,
    handleCambioConfirmacionPaciente,
    buscarPaciente,
    confirmarRegistroNuevoPaciente,
    handleSubmit,
  }
}
