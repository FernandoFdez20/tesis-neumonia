export const PRIORIDADES = ["Baja", "Moderada", "Alta", "Crítica"] as const
export type Prioridad = typeof PRIORIDADES[number]

export interface DiagnosticoImagen {
  id: number
  diagnostico_id: number
  imagen_url: string
  orden: number
  tipo_vista: "AP" | "PA" | null
  probabilidad_ia: number | null
  confianza_radiografica: number | null
  hallazgo_positivo: boolean | null
  created_at: string
}

export interface PrioridadDetalle {
  crb65_gravedad?: string | null
  crb65_puntaje?: number | null
  resultado_ia?: string | null
  confianza_ia_maxima?: number | string | null
  regla_aplicada?: string | null
}

export interface DiagnosticoResponse {
  id: number
  atencion_medica_id: number
  enfermo: boolean | null
  prioridad_final?: string | null
  prioridad_detalle?: Record<string, any> | null
  imagen_referencia_id?: number | null
  estado_validacion: string | null
  clasificacion_medico?: string | null
  diagnostico_final_medico?: boolean | null
  concordancia_ia?: string | null
  diagnostico_descripcion: string | null
  validado_por_id: number | null
  fecha_validacion: string | null
  created_at: string
  updated_at?: string | null
  imagenes?: DiagnosticoImagen[]
}

export type DiagnosticoValidacionRequest = {
  clasificacion_medico: "Neumonía" | "Sano" | "Otro diagnóstico"
  diagnostico_descripcion: string
}
