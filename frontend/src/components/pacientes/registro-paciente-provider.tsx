import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { DialogNuevoPaciente } from "@/components/pacientes/nuevo-paciente-dialog"
import { ContextoRegistroPaciente } from "@/components/pacientes/registro-paciente-context"
import type { RegistroPaciente } from "@/components/pacientes/registro-paciente-context"
import { registrarPacienteTemporal } from "@/components/pacientes/datos-pacientes"
import {
  escucharSolicitudRegistroPaciente,
  solicitarAbrirRegistroAtencion,
} from "@/lib/registro-clinico-events"

export function RegistroPacienteProvider({
  children,
}: {
  children: ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const [pacientesRegistrados, setPacientesRegistrados] = useState<RegistroPaciente[]>([])

  const abrirDialogoNuevoPaciente = useCallback(() => {
    setAbierto(true)
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

  const valor = useMemo(
    () => ({
      abrirDialogoNuevoPaciente,
      pacientesRegistrados,
      agregarPacienteRegistrado,
    }),
    [abrirDialogoNuevoPaciente, pacientesRegistrados, agregarPacienteRegistrado]
  )

  return (
    <ContextoRegistroPaciente.Provider value={valor}>
      {children}
      <DialogNuevoPaciente
        abierto={abierto}
        onCambioAbierto={setAbierto}
        onRegistrarCita={solicitarAbrirRegistroAtencion}
      />
    </ContextoRegistroPaciente.Provider>
  )
}
