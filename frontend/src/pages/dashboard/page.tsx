
import { useQuery } from "@tanstack/react-query"
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-animation"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentAttentionsTable } from "@/components/dashboard/recent-attentions-table"
import { PriorityCases } from "@/components/dashboard/priority-cases"
import { getPrioridadesPendientes } from "@/services/diagnosticos.service"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

const prioridadColors: Record<string, string> = {
  "Leve": "bg-green-500/10 text-green-700 border-green-500/20",
  "Moderada": "bg-amber-500/10 text-amber-700 border-amber-500/20",
  "Alta": "bg-orange-500/10 text-orange-700 border-orange-500/20",
  "Crítica": "bg-red-500/10 text-red-700 border-red-500/20",
}

export default function DashboardPage() {
  const { data: prioridades, isLoading } = useQuery({
    queryKey: ["estadisticasDashboard"],
    queryFn: getPrioridadesPendientes,
    refetchInterval: 30000, // Panel de alertas dinámico: cada caso nuevo aparece sin recargar
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  })

  // Los avisos de casos prioritarios viven en la campana del header
  // (notificaciones persistentes en BD) y en la tarjeta de abajo.
  if (isLoading) return <DashboardSkeleton />

  const conteos = prioridades?.conteos || { "Leve": 0, "Moderada": 0, "Alta": 0, "Crítica": 0 }

  return (
    <div className="space-y-8">
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

      <StaggerContainer delay={60}>
        <StaggerItem index={0}>
          <QuickActions />
        </StaggerItem>
      </StaggerContainer>

      <StaggerContainer className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>div]:min-w-0" delay={80}>
        {["Leve", "Moderada", "Alta", "Crítica"].map((prio, index) => (
          <StaggerItem key={prio} index={index}>
            <div className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${prioridadColors[prio]}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider opacity-80">
                  Prioridad {prio}
                </span>
                <span className="text-3xl font-extrabold">
                  {conteos[prio] || 0}
                </span>
              </div>
              <p className="text-xs font-medium opacity-70 mt-2">
                Casos pendientes de validación
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <StaggerContainer className="grid gap-5 xl:grid-cols-[1fr_400px] items-start [&>div]:min-w-0" delay={100}>
        <StaggerItem index={0}>
          <RecentAttentionsTable />
        </StaggerItem>
        <StaggerItem index={1}>
          <PriorityCases casos={prioridades?.casos || []} />
        </StaggerItem>
      </StaggerContainer>
    </div>
  )
}
