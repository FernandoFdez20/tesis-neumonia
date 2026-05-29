import {
  CalendarDays,
  CalendarRange,
  UsersRound,
  UserCheck,
} from "lucide-react"

import { StatCard } from "@/components/dashboard/stat-card"
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-animation"
import { PacientesChart } from "@/components/pacientes/pacientes-chart"
import { PacientesList } from "@/components/pacientes/pacientes-list"

const pacientesStats = [
  {
    title: "Total Registrados",
    value: "1,248",
    description: "Pacientes en el sistema",
    icon: UsersRound,
    accent: "blue" as const,
  },
  {
    title: "Registrados este mes",
    value: "128",
    description: "+14% respecto al mes anterior",
    icon: CalendarDays,
    accent: "amber" as const,
  },
  {
    title: "Registrados este año",
    value: "845",
    description: "Crecimiento constante",
    icon: CalendarRange,
    accent: "green" as const,
  },
  {
    title: "Atendidos Hoy",
    value: "24",
    description: "En las últimas 24 horas",
    icon: UserCheck,
    accent: "red" as const,
  },
]

export default function PacientesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <StaggerContainer className="space-y-2 pb-1" delay={80}>
        <StaggerItem index={0}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary/70 leading-none">
            Gestión
          </p>
        </StaggerItem>
        <StaggerItem index={1}>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground/90 leading-tight">
            Pacientes
          </h1>
        </StaggerItem>
        <StaggerItem index={2}>
          <p className="max-w-3xl text-base text-muted-foreground/70 leading-relaxed font-medium">
            Administra el registro, historial y seguimiento de los pacientes atendidos.
          </p>
        </StaggerItem>
      </StaggerContainer>

      {/* Estadísticas */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" delay={80}>
        {pacientesStats.map((stat, index) => (
          <StaggerItem key={stat.title} index={index}>
            <StatCard {...stat} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Gráfico y Listado */}
      <StaggerContainer className="grid gap-6 xl:grid-cols-1 items-start" delay={100}>
        <StaggerItem index={0}>
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-3">
              <PacientesChart />
            </div>
          </div>
        </StaggerItem>
        
        <StaggerItem index={1} className="mt-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Directorio de Pacientes</h2>
              <p className="text-sm text-muted-foreground">Listado completo de pacientes registrados y su estado actual.</p>
            </div>
            <PacientesList />
          </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  )
}
