import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Filter,
  Search,
  Stethoscope,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRecentDiagnosticosRequest } from '../services/api'

const PAGE_SIZE = 8

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

function formatRelativeDate(isoDate) {
  if (!isoDate) return 'Sin fecha'

  const now = new Date()
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'

  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return 'Hace minutos'
  if (diffHours < 24) return `Hace ${diffHours}h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Ayer'
  return `Hace ${diffDays}d`
}

export function Historial() {
  const navigate = useNavigate()
  const [cases, setCases] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let isMounted = true

    const loadCases = async () => {
      try {
        setLoadError('')
        // Carga un volumen mayor para habilitar busqueda y paginacion en el historial.
        const data = await getRecentDiagnosticosRequest(120)
        if (isMounted) {
          setCases(data)
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message || 'No se pudo cargar historial de diagnosticos')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadCases()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredCases = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()

    return cases.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false

      if (!normalized) return true

      return (
        String(item.paciente_nombre || '')
          .toLowerCase()
          .includes(normalized) ||
        String(item.expediente_id || '')
          .toLowerCase()
          .includes(normalized)
      )
    })
  }, [cases, searchTerm, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredCases.slice(start, start + PAGE_SIZE)
  }, [currentPage, filteredCases])

  const positiveCount = filteredCases.filter((item) => item.status === 'positive').length
  const negativeCount = filteredCases.filter((item) => item.status === 'negative').length

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-360 items-center justify-between px-6 lg:px-10">
          <button
            onClick={() => navigate('/panel')}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al dashboard
          </button>

          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-medical-blue" />
            <span className="font-display text-base font-semibold text-foreground">Historial de Diagnosticos</span>
          </div>

          <button
            onClick={() => navigate('/diagnostico')}
            className="gradient-primary rounded-md px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Nuevo diagnostico
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-360 space-y-6 px-6 py-8 lg:px-10">
        <motion.section {...fadeUp} transition={{ duration: 0.35 }} className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total visibles</p>
            <p className="mt-2 font-display text-3xl font-bold text-foreground">{filteredCases.length}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Positivos</p>
            <p className="mt-2 font-display text-3xl font-bold text-medical-danger">{positiveCount}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Negativos</p>
            <p className="mt-2 font-display text-3xl font-bold text-medical-success">{negativeCount}</p>
          </div>
        </motion.section>

        <motion.section {...fadeUp} transition={{ duration: 0.35, delay: 0.05 }} className="rounded-xl border border-border/50 bg-card p-4 shadow-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por paciente o expediente"
                className="h-10 w-full rounded-md border border-border bg-secondary/40 pl-9 pr-3 text-sm text-foreground outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                Estado
              </span>
              {[{ key: 'all', label: 'Todos' }, { key: 'positive', label: 'Positivos' }, { key: 'negative', label: 'Negativos' }].map(
                (option) => (
                  <button
                    key={option.key}
                    onClick={() => setStatusFilter(option.key)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      statusFilter === option.key
                        ? 'bg-medical-blue text-white'
                        : 'border border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                ),
              )}
            </div>
          </div>
        </motion.section>

        <motion.section {...fadeUp} transition={{ duration: 0.35, delay: 0.1 }} className="rounded-xl border border-border/50 bg-card shadow-card">
          <div className="border-b border-border/50 px-5 py-4">
            <h2 className="text-lg font-display font-semibold text-foreground">Lista de casos</h2>
            <p className="text-sm text-muted-foreground">Haz clic en un caso para ver el detalle completo</p>
          </div>

          {isLoading ? (
            <p className="p-5 text-sm text-muted-foreground">Cargando historial...</p>
          ) : loadError ? (
            <p className="p-5 text-sm text-medical-danger">{loadError}</p>
          ) : paginatedCases.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No hay casos que coincidan con el filtro actual.</p>
          ) : (
            <div className="divide-y divide-border/50">
              {paginatedCases.map((item) => (
                <button
                  key={item.diagnostico_id}
                  onClick={() =>
                    navigate(`/resultados?diagnostico_id=${item.diagnostico_id}`, {
                      state: { diagnostico_id: item.diagnostico_id },
                    })
                  }
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/25"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      item.status === 'positive'
                        ? 'bg-medical-danger/10 text-medical-danger'
                        : 'bg-medical-success/10 text-medical-success'
                    }`}
                  >
                    {item.status === 'positive' ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{item.paciente_nombre}</p>
                      <span className="rounded border px-1.5 py-0 text-[10px] font-mono">{item.expediente_id}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.edad ?? '-'} años</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatRelativeDate(item.fecha_registro)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-semibold ${
                        item.status === 'positive' ? 'text-medical-danger' : 'text-medical-success'
                      }`}
                    >
                      {item.status === 'positive' ? 'Positivo' : 'Negativo'}
                    </p>
                    <p className="text-xs text-muted-foreground">Conf. {item.confidence ?? 0}%</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/50 px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-secondary/30 text-muted-foreground disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-secondary/30 text-muted-foreground disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  )
}
