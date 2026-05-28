import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { DialogNuevaAtencion } from "@/components/atenciones/nueva-atencion-dialog"
import { ContextoRegistroAtencion } from "@/components/atenciones/registro-atencion-context"
import {
  escucharSolicitudRegistroAtencion,
  solicitarAbrirRegistroPaciente,
} from "@/lib/registro-clinico-events"

export function RegistroAtencionProvider({
  children,
}: {
  children: ReactNode
}) {
  const [abierto, setAbierto] = useState(false)

  const abrirDialogoNuevaAtencion = useCallback(() => {
    setAbierto(true)
  }, [])

  useEffect(() => escucharSolicitudRegistroAtencion(abrirDialogoNuevaAtencion), [
    abrirDialogoNuevaAtencion,
  ])

  const abrirRegistroPacienteDesdeAtencion = useCallback(() => {
    setAbierto(false)
    solicitarAbrirRegistroPaciente()
  }, [])

  const valor = useMemo(
    () => ({
      abrirDialogoNuevaAtencion,
    }),
    [abrirDialogoNuevaAtencion]
  )

  return (
    <ContextoRegistroAtencion.Provider value={valor}>
      {children}
      <DialogNuevaAtencion
        abierto={abierto}
        onCambioAbierto={setAbierto}
        onRegistrarPaciente={abrirRegistroPacienteDesdeAtencion}
      />
    </ContextoRegistroAtencion.Provider>
  )
}
