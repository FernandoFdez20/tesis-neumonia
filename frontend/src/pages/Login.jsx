import { useState } from 'react'
import { Stethoscope, Mail, Lock } from 'lucide-react'
import { Link } from 'react-router-dom';

export function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // Simulate authentication
    if (email && password && typeof onLogin === 'function') {
      onLogin()
    }
  }

  return (
    // En tu código JSX:
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <Link to="/panel" className="text-blue-500">Ir al Panel</Link>

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="bg-sky-100 p-3 rounded-full mb-4">
              <Stethoscope className="w-8 h-8 text-sky-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">NeumoAI</h1>
            <p className="text-sm text-slate-500 mt-1 text-center">
              Sistema de Diagnóstico Asistido por IA
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Correo electrónico institucional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors"
                  placeholder="dr.apellido@hospital.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-slate-700"
                >
                  Recordar mi sesión
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-sky-600 hover:text-sky-500"
                >
                  ¿Olvidé mi contraseña?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
              >
                Iniciar Sesión
              </button>
            </div>
          </form>
        </div>
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100">
          <p className="text-xs text-center text-slate-500">
            &copy; {new Date().getFullYear()} NeumoAI. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </div>


  )
}