import { PageHeader } from "@/components/shared/page-header"

import { useQuery } from "@tanstack/react-query"
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-animation"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentAttentionsTable } from "@/components/dashboard/recent-attentions-table"
import { PriorityCases } from "@/components/dashboard/priority-cases"
import { getPrioridadesPendientes } from "@/services/diagnosticos.service"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { PRIORIDADES, type Prioridad } from "@/types/diagnostico"

const prioridadColors: Record<Prioridad, string> = {
  "Baja": "bg-green-500/10 text-green-700 border-green-500/20",
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

  const conteos = prioridades?.conteos || { "Baja": 0, "Moderada": 0, "Alta": 0, "Crítica": 0 }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Soporte clínico"
        title="Panel principal"
        description="Evaluación presuntiva de neumonía en adultos y seguimiento de atenciones pendientes de validación médica."
        actions={<QuickActions />}
      />



      <StaggerContainer className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>div]:min-w-0" delay={80}>
        {PRIORIDADES.map((prio, index) => (
          <StaggerItem key={prio} index={index}>
            <div className={`rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${prioridadColors[prio]}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  Prioridad {prio}
                </span>
                <span className="text-2xl font-bold">
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

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px] items-start">
        <StaggerItem index={0} className="min-w-0 xl:col-start-2 xl:row-start-1">
          <PriorityCases casos={prioridades?.casos || []} />
        </StaggerItem>
        <StaggerItem index={1} className="min-w-0 xl:col-start-1 xl:row-start-1">
          <RecentAttentionsTable />
        </StaggerItem>
      </div>
    </div>
  )
}
