const EVENTO_ABRIR_REGISTRO_PACIENTE = "registro-clinico:abrir-paciente"
const EVENTO_ABRIR_REGISTRO_ATENCION = "registro-clinico:abrir-atencion"

function emitirEvento(nombre: string) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new CustomEvent(nombre))
}

export function solicitarAbrirRegistroPaciente() {
  emitirEvento(EVENTO_ABRIR_REGISTRO_PACIENTE)
}

export function solicitarAbrirRegistroAtencion() {
  emitirEvento(EVENTO_ABRIR_REGISTRO_ATENCION)
}

export function escucharSolicitudRegistroPaciente(callback: () => void) {
  window.addEventListener(EVENTO_ABRIR_REGISTRO_PACIENTE, callback)

  return () => {
    window.removeEventListener(EVENTO_ABRIR_REGISTRO_PACIENTE, callback)
  }
}

export function escucharSolicitudRegistroAtencion(callback: () => void) {
  window.addEventListener(EVENTO_ABRIR_REGISTRO_ATENCION, callback)

  return () => {
    window.removeEventListener(EVENTO_ABRIR_REGISTRO_ATENCION, callback)
  }
}
