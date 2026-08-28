import api from "@/lib/api"

export type PacienteCreate = {
  dni: string
  nombres_apellidos: string
  sexo: string
  fecha_nacimiento: string
  otros_antecedentes?: string | null
  antecedentes_familiares?: string | null
  enfermedad_ids?: number[]
}

export type PacienteResponse = PacienteCreate & {
  id: number
  estado_clinico: string
  created_at: string
}

export async function registrarPaciente(data: PacienteCreate): Promise<PacienteResponse> {
  const response = await api.post<PacienteResponse>("/pacientes/", data)
  return response.data
}

export type PaginatedPacientes = {
  items: PacienteResponse[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export async function listarPacientes(params?: {
  page?: number
  page_size?: number
  buscar?: string
  sexo?: string
  estado_clinico?: string
}): Promise<PaginatedPacientes> {
  const response = await api.get<PaginatedPacientes>("/pacientes/", { params })
  return response.data
}

export async function getPacientePorDni(dni: string): Promise<PacienteResponse> {
  const response = await api.get<PacienteResponse>(`/pacientes/dni/${dni}`)
  return response.data
}
