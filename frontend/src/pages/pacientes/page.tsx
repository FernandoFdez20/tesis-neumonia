import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
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
        {stats.map((stat, index) => (
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
              <PacientesChart datos={porMes} />
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
