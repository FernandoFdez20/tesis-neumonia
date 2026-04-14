import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  Grid2X2,
  History,
  LogOut,
  Settings,
  Upload,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const menuItems = [
  { label: 'Dashboard', icon: Grid2X2, active: true },
  { label: 'Cargar Radiografia', icon: Upload },
  { label: 'Casos Prioritarios', icon: AlertTriangle },
  { label: 'Validacion', icon: ClipboardCheck },
  { label: 'Historial', icon: History },
  { label: 'Administracion', icon: Settings },
]

export function Sidebar({ usuario }) {
  const navigate = useNavigate()

  const nombreCompleto = usuario?.nombre_completo || 'Usuario'
  const rol = usuario?.rol || 'Sin rol'
  const iniciales = nombreCompleto
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')

  const handleLogout = () => {
    // Cerramos sesion local y volvemos al login
    localStorage.removeItem('access_token')
    navigate('/login')
  }

  return (
    <aside className="flex h-full w-64 flex-col overflow-hidden border-r border-slate-700 bg-slate-800 text-slate-100 shadow-md">
      <div className="border-b border-slate-700 px-6 py-5">
        <div className="flex items-center gap-2.5">
          <Activity className="h-6 w-6 text-cyan-300" strokeWidth={2.2} />
          <h1 className="text-2xl font-bold tracking-tight text-white">NeumoAI</h1>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5">
        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <li key={item.label}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-base font-medium transition-colors ${
                    item.active
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-200 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-slate-700 bg-slate-900/35 px-4 py-5">
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-slate-700/40 px-3 py-3">
          <div className="grid h-10 w-10 place-content-center rounded-lg bg-cyan-700 font-bold text-white">{iniciales || 'US'}</div>
          <div>
            <p className="text-sm font-semibold text-white">{nombreCompleto}</p>
            <p className="text-xs text-slate-300">{rol}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesion</span>
        </button>
      </div>
    </aside>
  )
}
