import {
	AlertTriangle,
	CircleCheck,
	ClipboardCheck,
	HeartPulse,
	Info,
	Upload,
} from 'lucide-react'
import { MetricCard } from '../components/dashboard/MetricCard'
import { QuickActionButton } from '../components/dashboard/QuickActionButton'
import { Sidebar } from '../components/dashboard/Sidebar'
import { WeeklyActivityChart } from '../components/dashboard/WeeklyActivityChart'

// Datos estaticos del tablero principal (mock visual para futura integracion con backend)
const kpiCards = [
	{
		title: 'Total Diagnosticos',
		value: '20',
		icon: HeartPulse,
		iconBg: 'bg-sky-100',
		iconColor: 'text-sky-500',
	},
	{
		title: 'Casos Neumonia',
		value: '14',
		icon: CircleCheck,
		iconBg: 'bg-amber-100',
		iconColor: 'text-amber-500',
	},
	{
		title: 'Casos Graves',
		value: '3',
		icon: AlertTriangle,
		iconBg: 'bg-rose-100',
		iconColor: 'text-rose-500',
	},
	{
		title: 'Pendientes Validacion',
		value: '8',
		icon: ClipboardCheck,
		iconBg: 'bg-violet-100',
		iconColor: 'text-violet-500',
	},
]

// Acciones sin logica real: solo representacion visual
const quickActions = [
	{
		label: 'Cargar nueva radiografia',
		icon: Upload,
		colorClass: 'bg-sky-600 hover:bg-sky-700',
	},
	{
		label: 'Ver casos prioritarios',
		icon: Info,
		colorClass: 'bg-amber-600 hover:bg-amber-700',
	},
	{
		label: 'Validar diagnosticos',
		icon: CircleCheck,
		colorClass: 'bg-emerald-600 hover:bg-emerald-700',
	},
]

// Serie semanal usada por Recharts
const weeklyActivity = [
	{ dia: 'Lun', detectados: 12, validados: 10 },
	{ dia: 'Mar', detectados: 19, validados: 15 },
	{ dia: 'Mie', detectados: 15, validados: 14 },
	{ dia: 'Jue', detectados: 22, validados: 18 },
	{ dia: 'Vie', detectados: 18, validados: 16 },
	{ dia: 'Sab', detectados: 8, validados: 8 },
	{ dia: 'Dom', detectados: 5, validados: 4 },
]

export function PanelMedico() {
	return (
		<div className="h-screen overflow-hidden bg-transparent p-0">
			<div className="grid h-full grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)]">
				<Sidebar />

				<main className="overflow-y-auto px-8 py-6">
					<header className="mb-6">
						<h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Panel de Control</h2>
						<p className="mt-1 text-xl font-semibold text-slate-500">
							Sabado, 11 De Abril De 2026 • Hola, Dr. Garcia
						</p>
					</header>

					<section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
						{kpiCards.map((card) => (
							<MetricCard key={card.title} {...card} />
						))}
					</section>

					<section className="mb-6">
						<h3 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-800">Acciones Rapidas</h3>

						<div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
							{quickActions.map((action) => (
								<QuickActionButton key={action.label} {...action} />
							))}
						</div>
					</section>

					<WeeklyActivityChart data={weeklyActivity} />
				</main>
			</div>
		</div>
	)
}