import {
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  UsersRound,
} from "lucide-react"

import { PriorityCases } from "@/components/dashboard/priority-cases"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentAttentionsTable } from "@/components/dashboard/recent-attentions-table"
import { StatCard } from "@/components/dashboard/stat-card"

const dashboardStats = [
  {
    title: "Total de pacientes",
    value: "128",
    description: "Pacientes adultos registrados",
    icon: UsersRound,
    accent: "blue" as const,
  },
  {
    title: "Atenciones del día",
    value: "16",
    description: "Registradas hoy",
    icon: CalendarCheck,
    accent: "green" as const,
  },
  {
    title: "Pendientes de evaluación",
    value: "7",
    description: "Requieren validación médica",
    icon: ClipboardList,
    accent: "amber" as const,
  },
  {
    title: "Casos graves priorizados",
    value: "3",
    description: "Requieren revisión prioritaria",
    icon: AlertTriangle,
    accent: "red" as const,
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-1.5 pb-2 transition-all duration-200">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80 leading-none">
          Panel principal
        </p>
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground/90 leading-tight">
          Bienvenido al sistema de soporte clínico
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground/80 leading-relaxed font-medium">
          Evaluación presuntiva de neumonía en adultos, priorización dinámica y
          seguimiento de atenciones pendientes de validación médica.
        </p>
      </section>

      <QuickActions />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_340px] items-start">
        <RecentAttentionsTable />
        <PriorityCases />
      </section>
    </div>
  )
}
