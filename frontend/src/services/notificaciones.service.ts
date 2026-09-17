import api from "@/lib/api"

export type Notificacion = {
  id: number
  diagnostico_id: number
  atencion_medica_id: number
  paciente_nombre: string
  prioridad: string
  mensaje: string
  leida: boolean
  created_at: string
}

export async function listarNotificacionesPendientes(): Promise<Notificacion[]> {
  const response = await api.get<Notificacion[]>(`/notificaciones/pendientes`)
  return response.data
}

export async function marcarNotificacionLeida(id: number): Promise<void> {
  await api.patch(`/notificaciones/${id}/leer`)
}

export async function cerrarNotificacion(id: number): Promise<void> {
  await api.patch(`/notificaciones/${id}/cerrar`)
}
