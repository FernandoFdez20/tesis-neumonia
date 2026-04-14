import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AuthRequired() {
  return (
    <div className="grid min-h-screen place-content-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3 text-amber-700">
          <ShieldAlert className="h-6 w-6" />
          <h2 className="text-xl font-bold">Acceso restringido</h2>
        </div>

        <p className="mb-5 text-slate-700">Primero debe iniciar sesion para ingresar al panel.</p>

        <Link
          to="/login"
          className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Ir al login
        </Link>
      </section>
    </div>
  )
}
