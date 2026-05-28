import { useContext } from "react"

import { ContextoRegistroAtencion } from "@/components/atenciones/registro-atencion-context"

export function useRegistroAtencion() {
  const context = useContext(ContextoRegistroAtencion)

  if (!context) {
    throw new Error(
      "useRegistroAtencion debe usarse dentro de RegistroAtencionProvider."
    )
  }

  return context
}
