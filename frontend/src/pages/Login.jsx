import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { loginRequest } from '../services/api'

export function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setErrorMessage('')
    setIsLoading(true)

    try {
      // Login real contra FastAPI
      const data = await loginRequest({ correo: email, password })
      localStorage.setItem('access_token', data.access_token)
      navigate('/dashboard')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      <main className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl p-8 lg:p-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Bienvenido</h2>
          <p className="text-slate-500 mb-8">
            Ingrese sus credenciales para acceder al sistema
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Correo electrónico institucional
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                placeholder="dr.apellido@hospital.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-white font-semibold bg-linear-to-r from-sky-600 to-cyan-500 hover:opacity-90 disabled:opacity-70 transition"
            >
              {isLoading ? 'Validando...' : 'Iniciar sesión'}
            </button>

            {errorMessage && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </p>
            )}
          </form>

          <p className="mt-8 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Sistema deteccion neumonia. Todos los derechos reservados.
          </p>
        </div>
      </main>
    </div>
  )
}