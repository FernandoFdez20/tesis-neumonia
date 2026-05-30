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
  evaluacion_presuntiva: string
  estado_atencion: EstadoAtencion
  observaciones: string | null
}

export type AtencionResponse = CrearAtencionRequest & {
  id: number
  codigo: string
}

export async function registrarAtencion(
  atencion: CrearAtencionRequest
): Promise<AtencionResponse> {
  console.info("Atención médica registrada temporalmente", atencion)

  await Promise.resolve()

  return {
    ...atencion,
    id: Date.now(),
    codigo: `AT-${Date.now().toString().slice(-4)}`,
  }
}
