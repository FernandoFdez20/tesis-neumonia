import { AuthRequired } from './AuthRequired'
import { getStoredToken } from '../services/api'

export function ProtectedRoute({ children }) {
  // Si no existe token, mostramos aviso en lugar del contenido protegido
  const token = getStoredToken()

  if (!token) {
    return <AuthRequired />
  }

  return children
}
