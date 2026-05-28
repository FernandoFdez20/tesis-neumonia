import { createContext } from "react"

export type RegistroPaciente = {
  nombreCompleto: string
  dni: string
  edad: string
  sexo: string
  registradoEn?: string
}

export type ContextoRegistroPacienteValor = {
  abrirDialogoNuevoPaciente: () => void
  pacientesRegistrados: RegistroPaciente[]
  agregarPacienteRegistrado: (paciente: RegistroPaciente) => RegistroPaciente
}

export const ContextoRegistroPaciente =
  createContext<ContextoRegistroPacienteValor | null>(null)
