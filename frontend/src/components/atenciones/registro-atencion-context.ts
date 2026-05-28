import { createContext } from "react"

export type ContextoRegistroAtencionValor = {
  abrirDialogoNuevaAtencion: () => void
}

export const ContextoRegistroAtencion =
  createContext<ContextoRegistroAtencionValor | null>(null)
