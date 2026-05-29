import axios from "axios"

// Instancia base de Axios apuntando al backend
const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
})

// Agrega el token JWT en cada petición si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
