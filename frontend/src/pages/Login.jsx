import { useState } from 'react'
import { Activity, Eye, EyeOff, Stethoscope } from 'lucide-react'
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
      <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-16 bg-gradient-to-br from-slate-900 via-sky-900 to-cyan-700">
        <div className="absolute inset-0 opacity-15">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="absolute rounded-full border border-white/30"
              style={{
                width: `${220 + index * 110}px`,
                height: `${220 + index * 110}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-lg text-white">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm mb-8">
            <Stethoscope className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">
            Pneumonia Insight
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Sistema inteligente de apoyo clínico para diagnóstico presuntivo de neumonía
          </p>
          <div className="mt-12 flex items-center justify-center gap-8 text-white/70 text-sm">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Precisión clínica</span>
            </div>
            <div className="w-px h-4 bg-white/30" />
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              <span>Flujo médico</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl p-8 lg:p-10">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 flex items-center justify-center text-white">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900">Pneumonia Insight</span>
          </div>

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
              className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-sky-600 to-cyan-500 hover:opacity-90 disabled:opacity-70 transition"
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
            &copy; {new Date().getFullYear()} NeumoAI. Todos los derechos reservados.
          </p>
        </div>
      </main>
    </div>
  )
}