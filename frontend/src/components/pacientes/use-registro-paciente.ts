import { useContext } from "react"

import { ContextoRegistroPaciente } from "@/components/pacientes/registro-paciente-context"

export function useRegistroPaciente() {
  const context = useContext(ContextoRegistroPaciente)

  if (!context) {
    throw new Error(
      "useRegistroPaciente debe usarse dentro de RegistroPacienteProvider."
    )
  }

  return context
}
