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
