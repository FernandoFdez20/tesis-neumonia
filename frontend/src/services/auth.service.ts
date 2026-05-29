import api from "@/lib/api"

export type Usuario = {
  id: number
  username: string
  correo: string
  nombre_completo: string
  rol: string
  estado: boolean
}

type LoginResponse = {
  access_token: string
  token_type: string
  usuario: Usuario
}

// El backend espera el formato de OAuth2: application/x-www-form-urlencoded
export async function login(username: string, password: string): Promise<LoginResponse> {
  const formData = new URLSearchParams()
  formData.append("username", username)
  formData.append("password", password)

  const { data } = await api.post<LoginResponse>("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  })

  return data
}
