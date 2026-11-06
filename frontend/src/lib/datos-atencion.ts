import type { AtencionResponse } from "@/services/atenciones.service"

export function obtenerFechaHoraAtencion(atencion: AtencionResponse): string {
  // Fecha y hora locales, sin conversión UTC que desplace el día elegido.
  if (atencion.fecha_atencion && atencion.hora_atencion) {
    return `${atencion.fecha_atencion}T${atencion.hora_atencion}`
  }
  return atencion.fecha_registro
}

export function obtenerMotivoConsulta(atencion: AtencionResponse): string | null {
  // Los registros anteriores solo conservaban síntomas y observaciones.
  return atencion.motivo_consulta || atencion.sintomas_principales || null
}
