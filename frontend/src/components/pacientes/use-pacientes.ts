import { useCallback, useEffect, useState } from "react"

import {
  registrarPacienteTemporal,
  type PacienteDisponible,
} from "@/components/pacientes/datos-pacientes"
import { escucharSolicitudRegistroPaciente } from "@/lib/registro-clinico-events"

export type RegistroPaciente = PacienteDisponible

export function usePacientes() {
  const [dialogNuevoPacienteAbierto, setDialogNuevoPacienteAbierto] = useState(false)
  const [pacientesRegistrados, setPacientesRegistrados] = useState<RegistroPaciente[]>([])

  const abrirDialogoNuevoPaciente = useCallback(() => {
    setDialogNuevoPacienteAbierto(true)
  }, [])

  useEffect(() => escucharSolicitudRegistroPaciente(abrirDialogoNuevoPaciente), [
    abrirDialogoNuevoPaciente,
  ])

  const agregarPacienteRegistrado = useCallback((paciente: RegistroPaciente) => {
    const nuevoPaciente: RegistroPaciente = {
      ...paciente,
      registradoEn: new Date().toISOString(),
    }

    registrarPacienteTemporal(nuevoPaciente)
    setPacientesRegistrados((actual) => [...actual, nuevoPaciente])

    return nuevoPaciente
  }, [])

  return {
    dialogNuevoPacienteAbierto,
    setDialogNuevoPacienteAbierto,
    abrirDialogoNuevoPaciente,
    pacientesRegistrados,
    agregarPacienteRegistrado,
  }
}
