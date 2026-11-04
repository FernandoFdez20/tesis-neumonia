import { PageHeader } from "@/components/shared/page-header"
import { useEffect, useState } from "react"
import {
  Activity,
  ClipboardList,
  HeartPulse,
  Stethoscope,
} from "lucide-react"

import { AtencionesList } from "@/components/atenciones/atenciones-list"
import { StatCard } from "@/components/dashboard/stat-card"
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-animation"
import { listarAtenciones, type AtencionResponse } from "@/services/atenciones.service"

export default function AtencionesPage() {
  const [atenciones, setAtenciones] = useState<AtencionResponse[]>([])
  
  useEffect(() => {
    listarAtenciones().then(setAtenciones).catch(console.error)
  }, [])

  const totalAtenciones = atenciones.length
  const atencionesEnProceso = atenciones.filter((a) => a.estado === "En proceso").length
  const atencionesFinalizadas = atenciones.filter((a) => a.estado === "Finalizada").length
  const atencionesSaturacionBaja = atenciones.filter((a) => a.saturacion_o2 && a.saturacion_o2 < 94).length

  const atencionesStats = [
    {
      title: "Atenciones registradas",
      value: totalAtenciones.toString(),
      description: "Registros clínicos del sistema",
      icon: ClipboardList,
      accent: "blue" as const,
    },
    {
      title: "En proceso",
      value: atencionesEnProceso.toString(),
      description: "Pendientes de diagnóstico",
      icon: Stethoscope,
      accent: "amber" as const,
    },
    {
      title: "Finalizadas",
      value: atencionesFinalizadas.toString(),
      description: "Atenciones cerradas",
      icon: HeartPulse,
      accent: "green" as const,
    },
    {
      title: "Sat. O2 baja",
      value: atencionesSaturacionBaja.toString(),
      description: "Menor a 94%",
      icon: Activity,
      accent: "red" as const,
    },
  ]

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Gestión clínica"
        title="Atenciones médicas"
        description="Consulta las atenciones, compara los signos vitales y continúa el flujo clínico de cada caso."
      />

      <StaggerContainer className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" delay={80}>
        {atencionesStats.map((stat, index) => (
          <StaggerItem key={stat.title} index={index}>
            <StatCard {...stat} compact />
          </StaggerItem>
        ))}
      </StaggerContainer>

      <StaggerContainer className="space-y-4" delay={100}>
        <StaggerItem index={0}>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Listado de atenciones
            </h2>
            <p className="text-sm text-muted-foreground">
              Seguimiento operativo de los registros clínicos capturados por el personal.
            </p>
          </div>
        </StaggerItem>
        <StaggerItem index={1}>
          <AtencionesList />
        </StaggerItem>
      </StaggerContainer>
    </div>
  )
}
