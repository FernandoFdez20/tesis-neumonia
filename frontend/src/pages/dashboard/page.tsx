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
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-animation"

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
    <div className="space-y-8">
      {/* Header del dashboard con stagger */}
      <StaggerContainer className="space-y-2 pb-1" delay={80}>
        <StaggerItem index={0}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary/70 leading-none">
            Panel principal
          </p>
        </StaggerItem>
        <StaggerItem index={1}>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground/90 leading-tight">
            Bienvenido al sistema de soporte clínico
          </h1>
        </StaggerItem>
        <StaggerItem index={2}>
          <p className="max-w-3xl text-base text-muted-foreground/70 leading-relaxed font-medium">
            Evaluación presuntiva de neumonía en adultos, priorización dinámica y
            seguimiento de atenciones pendientes de validación médica.
          </p>
        </StaggerItem>
      </StaggerContainer>

      {/* Accesos rápidos con stagger */}
      <StaggerContainer delay={60}>
        <StaggerItem index={0}>
          <QuickActions />
        </StaggerItem>
      </StaggerContainer>

      {/* Estadísticas con stagger */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" delay={80}>
        {dashboardStats.map((stat, index) => (
          <StaggerItem key={stat.title} index={index}>
            <StatCard {...stat} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Tabla y casos prioritarios con stagger */}
      <StaggerContainer className="grid gap-5 xl:grid-cols-[1fr_360px] items-start" delay={100}>
        <StaggerItem index={0}>
          <RecentAttentionsTable />
        </StaggerItem>
        <StaggerItem index={1}>
          <PriorityCases />
        </StaggerItem>
      </StaggerContainer>
    </div>
  )
}
