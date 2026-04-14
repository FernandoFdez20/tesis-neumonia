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

const menuItems = [
  { label: 'Dashboard', icon: Grid2X2, active: true },
  { label: 'Cargar Radiografia', icon: Upload },
  { label: 'Casos Prioritarios', icon: AlertTriangle },
  { label: 'Validacion', icon: ClipboardCheck },
  { label: 'Historial', icon: History },
  { label: 'Administracion', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col overflow-hidden border-r border-[var(--neumo-sidebar-border)] bg-gradient-to-b from-[var(--neumo-sidebar-top)] to-[var(--neumo-sidebar-bottom)] text-slate-100 shadow-2xl">
      <div className="border-b border-[var(--neumo-sidebar-border)] px-6 py-5">
        <div className="flex items-center gap-2.5">
          <Activity className="h-6 w-6 text-sky-300" strokeWidth={2.2} />
          <h1 className="text-3xl font-extrabold tracking-tight text-white">NeumoAI</h1>
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
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-lg font-semibold transition-colors ${
                    item.active
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-slate-200 hover:bg-slate-700/40 hover:text-white'
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

      <div className="mt-auto border-t border-[var(--neumo-sidebar-border)] bg-slate-900/25 px-4 py-5">
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-800/30 px-3 py-3">
          <div className="grid h-10 w-10 place-content-center rounded-full bg-sky-500 font-bold text-white">DR</div>
          <div>
            <p className="text-base font-bold text-white">Dr. Garcia</p>
            <p className="text-sm text-slate-300">Radiologo</p>
          </div>
        </div>

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-base font-semibold text-slate-200 transition-colors hover:bg-slate-700/40 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesion</span>
        </button>
      </div>
    </aside>
  )
}
