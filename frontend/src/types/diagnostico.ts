export interface DiagnosticoImagen {
  id: number
  diagnostico_id: number
  imagen_url: string
  orden: number
  tipo_vista: "AP" | "PA" | null
  created_at: string
}

export interface DiagnosticoResponse {
  id: number
  atencion_medica_id: number
  enfermo: boolean | null
  resultado_ia: string | null
  nivel_gravedad_ia: string | null
  probabilidad_ia: number | null
  confianza_radiografica: number | null
  confianza_clinica: number | null
  confianza_riesgo: number | null
  hallazgos_json: Record<string, unknown> | null
  estado_validacion: string | null
  diagnostico_descripcion: string | null
  validado_por_id: number | null
  fecha_validacion: string | null
  updated_at: string | null
  imagenes: DiagnosticoImagen[]
}
