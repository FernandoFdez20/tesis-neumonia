import { PageHeader } from "@/components/shared/page-header"
import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  ChevronDown,
  UsersRound,
  UserCheck,
  UserX,
} from "lucide-react"

import { StatCard } from "@/components/dashboard/stat-card"
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-animation"
import { PacientesChart } from "@/components/pacientes/pacientes-chart"
import { PacientesList } from "@/components/pacientes/pacientes-list"
import { listarPacientes } from "@/services/pacientes.service"

const MESES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export default function PacientesPage() {
  const [total, setTotal] = useState(0)
  const [enAtencion, setEnAtencion] = useState(0)
  const [sinAtencion, setSinAtencion] = useState(0)
  const [nuevosMes, setNuevosMes] = useState(0)
  const [porMes, setPorMes] = useState<{ mes: string; pacientes: number }[]>([])

  useEffect(() => {
    async function cargarResumen() {
      try {
        const [todos, enAt, sinAt, recientes] = await Promise.all([
          listarPacientes({ page: 1, page_size: 1 }),
          listarPacientes({ page: 1, page_size: 1, en_atencion: true }),
          listarPacientes({ page: 1, page_size: 1, en_atencion: false }),
          listarPacientes({ page: 1, page_size: 100 }),
        ])
        setTotal(todos.total)
        setEnAtencion(enAt.total)
        setSinAtencion(sinAt.total)

        const ahora = new Date()
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
        setNuevosMes(
          recientes.items.filter((p) => new Date(p.created_at) >= inicioMes).length
        )

        // Últimos 6 meses con conteo de registros (base: lo traído del backend)
        const buckets: { mes: string; pacientes: number }[] = []
        for (let i = 5; i >= 0; i--) {
          const f = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
          buckets.push({ mes: MESES_CORTO[f.getMonth()], pacientes: 0 })
        }
        recientes.items.forEach((p) => {
          const f = new Date(p.created_at)
          const diff =
            (ahora.getFullYear() - f.getFullYear()) * 12 + (ahora.getMonth() - f.getMonth())
          if (diff >= 0 && diff < 6) {
            buckets[5 - diff].pacientes++
          }
        })
        setPorMes(buckets)
      } catch (error) {
        console.error("Error cargando resumen de pacientes:", error)
      }
    }
    cargarResumen()
  }, [])

  const stats = useMemo(
    () => [
      {
        title: "Total Registrados",
        value: String(total),
        description: "Pacientes en el sistema",
        icon: UsersRound,
        accent: "blue" as const,
      },
      {
        title: "En Atención",
        value: String(enAtencion),
        description: "Con atención activa",
        icon: UserCheck,
        accent: "amber" as const,
      },
      {
        title: "Nuevos este mes",
        value: String(nuevosMes),
        description: "Registrados en el mes actual",
        icon: CalendarDays,
        accent: "green" as const,
      },
      {
        title: "Sin Atención Activa",
        value: String(sinAtencion),
        description: "Pacientes sin atención en curso",
        icon: UserX,
        accent: "red" as const,
      },
    ],
    [total, enAtencion, nuevosMes, sinAtencion]
  )

  return (
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Gestión"
        title="Pacientes"
        description="Administra el registro, historial y seguimiento de los pacientes atendidos."
      />

      {/* Estadísticas */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" delay={80}>
        {stats.map((stat, index) => (
          <StaggerItem key={stat.title} index={index}>
            <StatCard {...stat} compact />
          </StaggerItem>
        ))}
      </StaggerContainer>

      <section className="space-y-4" aria-labelledby="directorio-pacientes">
        <div className="space-y-1">
          <h2 id="directorio-pacientes" className="text-lg font-semibold tracking-tight">Directorio de pacientes</h2>
          <p className="text-sm text-muted-foreground">Listado de pacientes registrados y su estado actual.</p>
        </div>
        <PacientesList />
      </section>

      <details className="group rounded-xl border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Estadística de registros</h2>
            <p className="text-xs text-muted-foreground">Ver la evolución de pacientes en los últimos seis meses.</p>
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t p-4"><PacientesChart datos={porMes} /></div>
      </details>
    </div>
  )
}
