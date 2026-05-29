import { useCallback, useEffect, useState } from "react"

import { escucharSolicitudRegistroAtencion } from "@/lib/registro-clinico-events"

export function useAtenciones() {
  const [dialogNuevaAtencionAbierto, setDialogNuevaAtencionAbierto] = useState(false)

  const abrirDialogoNuevaAtencion = useCallback(() => {
    setDialogNuevaAtencionAbierto(true)
  }, [])

  useEffect(() => escucharSolicitudRegistroAtencion(abrirDialogoNuevaAtencion), [
    abrirDialogoNuevaAtencion,
  ])

  return {
    dialogNuevaAtencionAbierto,
    setDialogNuevaAtencionAbierto,
    abrirDialogoNuevaAtencion,
  }
}
