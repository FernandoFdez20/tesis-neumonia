import { createContext, useContext, useState, ReactNode } from "react"
import { type Usuario } from "@/services/auth.service"

type AuthContextType = {
  usuario: Usuario | null
  token: string | null
  guardarSesion: (token: string, usuario: Usuario) => void
  cerrarSesion: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// Inicializamos desde localStorage para que la sesión sobreviva recargas
function getEstadoInicial() {
  const token = localStorage.getItem("token")
  const usuarioRaw = localStorage.getItem("usuario")

  if (token && usuarioRaw) {
    return { token, usuario: JSON.parse(usuarioRaw) as Usuario }
  }

  return { token: null, usuario: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState(getEstadoInicial)

  function guardarSesion(token: string, usuario: Usuario) {
    localStorage.setItem("token", token)
    localStorage.setItem("usuario", JSON.stringify(usuario))
    setSesion({ token, usuario })
  }

  function cerrarSesion() {
    localStorage.removeItem("token")
    localStorage.removeItem("usuario")
    setSesion({ token: null, usuario: null })
  }

  return (
    <AuthContext.Provider
      value={{ ...sesion, guardarSesion, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth debe usarse dentro de <AuthProvider>")
  return context
}
