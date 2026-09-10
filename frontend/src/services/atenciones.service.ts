import api from "@/lib/api"

export type EstadoAtencion =
  | "pendiente-evaluacion"
  | "pendiente-validacion"
  | "atencion-registrada"
  | "caso-priorizado"

export type CrearAtencionRequest = {
  documento_paciente: string
  nombre_paciente: string
  fecha_atencion: string
  hora_atencion: string
  motivo_consulta: string
  temperatura: string
  frecuencia_cardiaca: string
  frecuencia_respiratoria: string
  saturacion_o2: string
  presion_arterial: string
  tiempo_evolucion_dias: string
  sintomas_principales: string
  confusion: boolean
  estado_atencion: EstadoAtencion
  observaciones: string | null
}

export type AtencionResponse = {
  id: number
  paciente_id: number
  paciente_nombre?: string
  paciente_edad?: number
  paciente_estado_clinico?: string
  usuario_id: number
  fecha_registro: string
  temperatura?: number | null
  frecuencia_cardiaca?: number | null
  frecuencia_respiratoria?: number | null
  saturacion_o2?: number | null
  presion_arterial?: string | null
  tiempo_evolucion_dias?: number | null
  sintomas_principales?: string | null
  examen_fisico?: string | null
  estado: string
  confusion?: boolean | null
  crb65_puntaje?: number | null
  crb65_gravedad?: string | null
  crb65_detalle?: Record<
    string,
    { valor: boolean | number | string; puntos: number; descripcion: string }
  > | null
}

export async function registrarAtencion(
  atencion: CrearAtencionRequest
): Promise<AtencionResponse> {
  console.info("Registrando atención médica en DB", atencion)

  // 1. Obtener paciente por DNI para sacar el paciente_id
  const pacienteRes = await api.get(`/pacientes/dni/${atencion.documento_paciente}`)
  const pacienteId = pacienteRes.data.id

  // 2. Mapear al schema del backend (AtencionMedicaCreate)
  const payload = {
    paciente_id: pacienteId,
    temperatura: parseFloat(atencion.temperatura),
    frecuencia_cardiaca: parseInt(atencion.frecuencia_cardiaca),
    frecuencia_respiratoria: parseInt(atencion.frecuencia_respiratoria),
    saturacion_o2: parseInt(atencion.saturacion_o2),
    presion_arterial: atencion.presion_arterial,
    tiempo_evolucion_dias: parseInt(atencion.tiempo_evolucion_dias),
    sintomas_principales: atencion.sintomas_principales + (atencion.observaciones ? ` | Obs: ${atencion.observaciones}` : ""),
    examen_fisico: null, // Se registrará después por el médico
    estado: "En proceso" // o mapear desde atencion.estado_atencion si lo requieres
  }

  // 3. Crear atención
  const response = await api.post<AtencionResponse>("/atenciones/", payload)
  return response.data
}

export async function listarAtenciones(): Promise<AtencionResponse[]> {
  const response = await api.get<AtencionResponse[]>("/atenciones/")
  return response.data
}

export async function evaluarAtencion(
  atencionId: number,
  examenFisico: string,
  accion: "guardar_progreso" | "derivar_radiografia"
): Promise<AtencionResponse> {
  const response = await api.patch<AtencionResponse>(`/atenciones/${atencionId}/evaluar`, {
    examen_fisico: examenFisico,
    accion,
  })
  return response.data
}

export async function getAtencionPorId(atencionId: number): Promise<AtencionResponse> {
  const response = await api.get<AtencionResponse>(`/atenciones/${atencionId}`)
  return response.data
}
