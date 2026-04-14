import { motion } from 'framer-motion'
import {
	Activity,
	AlertTriangle,
	BarChart3,
	Bell,
	CheckCircle2,
	ChevronRight,
	Clock,
	FileImage,
	LogOut,
	Plus,
	Search,
	Stethoscope,
	TrendingUp,
	Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUsuario, getRecentDiagnosticosRequest } from '../services/api'

const stats = [
	{ label: 'Total analisis', value: '1,284', change: '+12%', icon: FileImage, color: 'bg-medical-blue/10 text-medical-blue' },
	{ label: 'Pacientes activos', value: '342', change: '+5%', icon: Users, color: 'bg-medical-teal/10 text-medical-teal' },
	{ label: 'Precision modelo', value: '94.7%', change: '+2.1%', icon: TrendingUp, color: 'bg-medical-success/10 text-medical-success' },
	{ label: 'Alertas pendientes', value: '8', change: '-3', icon: AlertTriangle, color: 'bg-medical-warning/10 text-medical-warning' },
]

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

export function PanelMedico() {
	const navigate = useNavigate()
	const [usuario, setUsuario] = useState(null)
	const [isLoadingUsuario, setIsLoadingUsuario] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [recentCases, setRecentCases] = useState([])
	const [isLoadingCases, setIsLoadingCases] = useState(true)
	const [casesError, setCasesError] = useState('')

	// Mantiene la funcionalidad actual: validar token y cargar usuario real desde backend.
	useEffect(() => {
		let isMounted = true

		const loadUsuario = async () => {
			try {
				const data = await getCurrentUsuario()
				if (isMounted) {
					setUsuario(data)
				}
			} catch {
				localStorage.removeItem('access_token')
				navigate('/login')
			} finally {
				if (isMounted) {
					setIsLoadingUsuario(false)
				}
			}
		}

		loadUsuario()

		return () => {
			isMounted = false
		}
	}, [navigate])

	useEffect(() => {
		let isMounted = true

		const loadRecentCases = async () => {
			try {
				setCasesError('')
				const data = await getRecentDiagnosticosRequest(10)
				if (isMounted) {
					setRecentCases(data)
				}
			} catch (error) {
				if (isMounted) {
					setCasesError(error.message || 'No se pudo cargar casos recientes')
				}
			} finally {
				if (isMounted) {
					setIsLoadingCases(false)
				}
			}
		}

		loadRecentCases()

		return () => {
			isMounted = false
		}
	}, [])

	// Mantiene el cierre de sesion funcional del proyecto actual.
	const handleLogout = () => {
		localStorage.removeItem('access_token')
		navigate('/login')
	}

	const filteredCases = recentCases.filter((item) => {
		const normalized = searchTerm.trim().toLowerCase()
		if (!normalized) return true
		return item.paciente_nombre.toLowerCase().includes(normalized) || item.expediente_id.toLowerCase().includes(normalized)
	})

	if (isLoadingUsuario) {
		return <div className="grid min-h-screen place-content-center bg-background text-muted-foreground">Cargando usuario...</div>
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
				<div className="mx-auto flex h-16 w-full max-w-360 items-center justify-between px-6 lg:px-10">
					<div className="flex items-center gap-3">
						<div className="gradient-primary flex h-9 w-9 items-center justify-center rounded-lg">
							<Stethoscope className="h-5 w-5 text-white" />
						</div>
						<span className="hidden text-lg font-display font-bold text-foreground sm:block">
							PneumoAI<span className="text-medical-teal">Dx</span>
						</span>
					</div>

					<div className="hidden items-center gap-1 rounded-full bg-secondary/60 px-1 py-1 md:flex">
						<button className="rounded-full bg-card px-4 py-1.5 text-sm font-medium text-foreground shadow-sm">
							Dashboard
						</button>
						<button
							onClick={() => navigate('/diagnostico')}
							className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							Nuevo Analisis
						</button>
						<button className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
							Historial
						</button>
					</div>

					<div className="flex items-center gap-3">
						<button className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/60 transition-colors hover:bg-secondary">
							<Bell className="h-4 w-4 text-muted-foreground" />
							<span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-medical-danger" />
						</button>
						<div className="gradient-primary flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold text-white">
							{(usuario?.nombre_completo || 'DR').slice(0, 2).toUpperCase()}
						</div>
						<button
							onClick={handleLogout}
							className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/60 transition-colors hover:bg-secondary"
						>
							<LogOut className="h-4 w-4 text-muted-foreground" />
						</button>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-360 space-y-8 px-6 py-8 lg:px-10">
				<motion.div {...fadeUp} transition={{ duration: 0.5 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-display font-bold text-foreground lg:text-3xl">
							Buenos dias, {usuario?.nombre_completo || 'Dr. Rodriguez'}
						</h1>
						<p className="mt-1 text-muted-foreground">Resumen de actividad del sistema de diagnostico</p>
					</div>
					<button
						onClick={() => navigate('/diagnostico')}
						className="gradient-primary shadow-glow flex h-11 items-center gap-2 px-6 font-semibold text-primary-foreground transition-opacity hover:opacity-90 rounded-md"
					>
						<Plus className="h-4 w-4" />
						Nuevo Diagnostico
					</button>
				</motion.div>

				<motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{stats.map((stat) => (
						<div key={stat.label} className="shadow-card-hover rounded-xl border border-border/50 bg-card p-5 transition-shadow">
							<div className="mb-4 flex items-center justify-between">
								<div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
									<stat.icon className="h-5 w-5" />
								</div>
								<span className="rounded-full bg-medical-success/10 px-2 py-0.5 text-xs font-medium text-medical-success">
									{stat.change}
								</span>
							</div>
							<p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
							<p className="mt-0.5 text-sm text-muted-foreground">{stat.label}</p>
						</div>
					))}
				</motion.div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.2 }} className="lg:col-span-2">
						<div className="shadow-card rounded-xl border border-border/50 bg-card">
							<div className="flex items-center justify-between border-b border-border/50 p-5 pb-4">
								<div>
									<h2 className="text-lg font-display font-semibold text-foreground">Casos Recientes</h2>
									<p className="text-sm text-muted-foreground">Ultimos diagnosticos realizados</p>
								</div>
								<div className="relative">
									<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<input
										type="text"
										value={searchTerm}
										onChange={(event) => setSearchTerm(event.target.value)}
										placeholder="Buscar..."
										className="h-9 w-48 rounded-md border border-border bg-secondary/50 pl-9 pr-3 text-sm text-foreground outline-none"
									/>
								</div>
							</div>

							<div className="divide-y divide-border/50">
								{isLoadingCases ? (
									<p className="p-5 text-sm text-muted-foreground">Cargando casos recientes...</p>
								) : casesError ? (
									<p className="p-5 text-sm text-medical-danger">{casesError}</p>
								) : filteredCases.length === 0 ? (
									<p className="p-5 text-sm text-muted-foreground">No hay diagnosticos registrados</p>
								) : (
									filteredCases.map((item) => (
										<button
											key={item.diagnostico_id}
											className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-secondary/30"
										>
											<div
												className={`flex h-10 w-10 items-center justify-center rounded-lg ${
													item.status === 'positive'
														? 'bg-medical-danger/10 text-medical-danger'
														: 'bg-medical-success/10 text-medical-success'
												}`}
											>
												{item.status === 'positive' ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<p className="truncate font-medium text-foreground">{item.paciente_nombre}</p>
													<span className="rounded border px-1.5 py-0 text-[10px] font-mono">{item.expediente_id}</span>
												</div>
												<p className="text-sm text-muted-foreground">{item.edad ?? '-'} anos · {formatRelativeDate(item.fecha_registro)}</p>
											</div>
											<div className="shrink-0 text-right">
												<p className={`text-sm font-semibold ${item.status === 'positive' ? 'text-medical-danger' : 'text-medical-success'}`}>
													{item.status === 'positive' ? 'Positivo' : 'Negativo'}
												</p>
												<p className="text-xs text-muted-foreground">Conf. {item.confidence ?? 0}%</p>
											</div>
											<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
										</button>
									))
								)}
							</div>
						</div>
					</motion.div>

					<motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.3 }} className="space-y-6">
						<div className="shadow-card rounded-xl border border-border/50 bg-card p-5">
							<h3 className="mb-4 text-base font-display font-semibold text-foreground">Acciones Rapidas</h3>
							<div className="space-y-2">
								{[
									{ label: 'Nuevo diagnostico', icon: Plus },
									{ label: 'Ver estadisticas', icon: BarChart3 },
									{ label: 'Historial completo', icon: Clock },
									{ label: 'Actividad reciente', icon: Activity },
								].map((action) => (
									<button
										key={action.label}
										onClick={() => {
											if (action.label === 'Nuevo diagnostico') {
												navigate('/diagnostico')
											}
										}}
										className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-secondary/60"
									>
										<action.icon className="h-4 w-4 text-medical-blue" />
										<span className="text-sm font-medium text-foreground">{action.label}</span>
										<ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
									</button>
								))}
							</div>
						</div>

						<div className="gradient-hero rounded-xl p-5 text-white">
							<div className="mb-3 flex items-center gap-2">
								<Activity className="h-4 w-4 text-medical-teal" />
								<span className="text-xs uppercase tracking-wider text-white/60">Estado del Modelo</span>
							</div>
							<p className="mb-1 text-2xl font-display font-bold">v3.2.1</p>
							<p className="mb-4 text-sm text-white/60">Ultima actualizacion: 12 Abr 2026</p>
							<div className="flex items-center gap-2">
								<span className="h-2 w-2 animate-pulse rounded-full bg-medical-teal" />
								<span className="text-xs text-white/70">Modelo operativo · Sin incidencias</span>
							</div>
						</div>
					</motion.div>
				</div>
			</main>
		</div>
	)
}