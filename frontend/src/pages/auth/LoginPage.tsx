import { LoginForm } from "@/components/auth/login-form"
import { Activity } from "lucide-react"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full">
      {/* Panel izquierdo — identidad clínica */}
      <div className="hidden lg:flex lg:w-[420px] lg:shrink-0 flex-col justify-between bg-primary px-10 py-12">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
            <Activity className="size-4.5 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">NeumoCare</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-white leading-snug">
              Sistema de soporte clínico para neumonia
            </h1>
            <p className="text-sm text-white/70 leading-relaxed">
              Evaluación presuntiva, priorización dinámica por gravedad y seguimiento de atenciones en adultos.
            </p>
          </div>

          <ul className="space-y-2.5">
            {[
              "Evaluación clínica presuntiva asistida",
              "Priorización dinámica por severidad",
              "Seguimiento de atenciones registradas",
              "Soporte para decisión médica",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-white/80">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-white/50" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/40 leading-relaxed">
          Herramienta de apoyo clínico presuntivo.{" "}
          <span className="text-white/60">Validación médica siempre requerida.</span>
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo solo en mobile */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-4" />
            </div>
            <span className="text-sm font-bold text-foreground">NeumoCare</span>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
