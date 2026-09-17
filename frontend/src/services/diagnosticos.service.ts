import api from "@/lib/api"
import type { DiagnosticoResponse } from "@/types/diagnostico"

/**
 * Sube las radiografías AP y/o PA de una atención médica.
 * El backend crea el diagnóstico, guarda las imágenes en disco
 * y cambia el estado clínico del paciente a "Diagnostico pendiente".
 */
export async function cargarRadiografias(
  atencionMedicaId: number,
  archivoAP: File | null,
  archivoPA: File | null
): Promise<DiagnosticoResponse> {
  const form = new FormData()

  if (archivoAP) form.append("archivo_ap", archivoAP)
  if (archivoPA) form.append("archivo_pa", archivoPA)

  const response = await api.post<DiagnosticoResponse>(
    `/diagnosticos/atenciones/${atencionMedicaId}/radiografias`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  )

  return response.data
}

export async function getDiagnosticoPorAtencion(
  atencionMedicaId: number
): Promise<DiagnosticoResponse> {
  const response = await api.get<DiagnosticoResponse>(
    `/diagnosticos/atenciones/${atencionMedicaId}/diagnostico`
  )
  return response.data
}

export async function validarDiagnostico(
  diagnosticoId: number,
  payload: import("@/types/diagnostico").DiagnosticoValidacionRequest
): Promise<DiagnosticoResponse> {
  const response = await api.patch<DiagnosticoResponse>(
    `/diagnosticos/${diagnosticoId}/validar`,
    payload
  )
  return response.data
}

export type PrioridadesPendientesResponse = {
  conteos: Record<string, number>
  casos: Array<{
    diagnostico_id: number
    atencion_medica_id: number
    paciente_nombre: string
    prioridad_final: string
    created_at: string
    crb65_puntaje?: number | null
    edad?: number | null
  }>
}

export async function getPrioridadesPendientes(): Promise<PrioridadesPendientesResponse> {
  const response = await api.get<PrioridadesPendientesResponse>(`/diagnosticos/prioridades/pendientes`)
  return response.data
}

/**
 * Genera la vista previa PNG de un DICOM sin guardarlo en disco.
 * El backend lo convierte en memoria y devuelve la imagen.
 * Retorna un object URL listo para usar en un <img> (revocarlo al descartar).
 */
export async function vistaPreviaDicom(archivo: File): Promise<string> {
  const form = new FormData()
  form.append("archivo", archivo)

  const response = await api.post<Blob>(`/diagnosticos/radiografias/vista-previa`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    responseType: "blob",
  })
  return URL.createObjectURL(response.data)
}
