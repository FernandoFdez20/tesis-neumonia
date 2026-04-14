import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  Download,
  FileText,
  Printer,
  Share2,
  Shield,
  Stethoscope,
  TrendingUp,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const findings = [
  { area: 'Lobulo inferior derecho', description: 'Opacidad alveolar difusa con broncograma aereo', severity: 'high' },
  { area: 'Lobulo medio derecho', description: 'Consolidacion parcial con patron intersticial', severity: 'medium' },
  { area: 'Base pulmonar izquierda', description: 'Leve derrame pleural asociado', severity: 'low' },
]

const recommendations = [
  'Realizar cultivo de esputo y hemocultivos',
  'Iniciar antibioticoterapia empirica segun guias locales',
  'Monitoreo continuo de saturacion de oxigeno',
  'Considerar tomografia de torax si no hay mejoria en 48-72h',
  'Evaluacion por neumologia si hay factores de riesgo',
]

function ProgressBar({ value, colorClass }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/70">
      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${value}%` }} />
    </div>
  )
}

export function Resultados() {
  const navigate = useNavigate()
  const location = useLocation()

  // Recupera datos del formulario de diagnostico para mantener continuidad del proceso.
  const diagnostico = location.state?.diagnostico

  const patientName = diagnostico?.nombre_completo || 'Paciente sin nombre'
  const patientAge = diagnostico?.edad || 'N/D'
  const patientSex = diagnostico?.sexo === 'M' ? 'Masculino' : diagnostico?.sexo === 'F' ? 'Femenino' : 'N/D'
  const patientId = diagnostico?.expediente_id || 'N/D'
  const patientTemp = diagnostico?.temperatura_c || 'N/D'
  const patientSat = diagnostico?.saturacion_o2 || 'N/D'
  const patientFR = diagnostico?.frecuencia_respiratoria || 'N/D'
  const patientComorb = diagnostico?.enfermedades_cronicas?.length
    ? diagnostico.enfermedades_cronicas.join(', ')
    : 'Sin datos'
  const patientDays = diagnostico?.tiempo_evolucion_dias || 'N/D'

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <button
            onClick={() => navigate('/panel')}
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-medical-blue" />
            <span className="font-display font-semibold text-foreground">Resultado del Analisis</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-foreground">
              <Printer className="h-3.5 w-3.5" /> Imprimir
            </button>
            <button className="flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-foreground">
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card"
        >
          <div className="gradient-hero p-8 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-medical-danger/30 bg-medical-danger/20 px-3 py-1 text-xs font-semibold">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Diagnostico Presuntivo Positivo
                  </span>
                </div>
                <h1 className="mb-2 text-3xl font-display font-bold">Neumonia Bacteriana</h1>
                <p className="text-lg text-white/70">Patron compatible con neumonia adquirida en la comunidad (NAC)</p>
              </div>
              <div className="text-center md:text-right">
                <div className="font-display text-5xl font-bold text-medical-teal">92%</div>
                <p className="mt-1 text-sm text-white/60">Nivel de confianza</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Desglose de confianza</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { label: 'Analisis radiografico', value: 94, colorClass: 'bg-medical-blue' },
                { label: 'Correlacion clinica', value: 89, colorClass: 'bg-medical-teal' },
                { label: 'Factores de riesgo', value: 91, colorClass: 'bg-medical-warning' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-secondary/30 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <span className="text-sm font-bold text-foreground">{item.value}%</span>
                  </div>
                  <ProgressBar value={item.value} colorClass={item.colorClass} />
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
          >
            <div className="mb-6 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-medical-blue" />
              <h2 className="text-lg font-display font-semibold text-foreground">Hallazgos Radiologicos</h2>
            </div>
            <div className="space-y-4">
              {findings.map((item) => (
                <article key={item.area} className="flex gap-4 rounded-xl bg-secondary/30 p-4">
                  <div
                    className={`w-2 flex-shrink-0 rounded-full ${
                      item.severity === 'high'
                        ? 'bg-medical-danger'
                        : item.severity === 'medium'
                        ? 'bg-medical-warning'
                        : 'bg-medical-success'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.area}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
          >
            <div className="mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-medical-blue" />
              <h2 className="text-lg font-display font-semibold text-foreground">Resumen del Paciente</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Paciente', value: patientName },
                { label: 'Edad / Sexo', value: `${patientAge} anios / ${patientSex}` },
                { label: 'Expediente', value: patientId },
                { label: 'Temperatura', value: patientTemp === 'N/D' ? 'N/D' : `${patientTemp}°C` },
                { label: 'Sat. O2', value: patientSat === 'N/D' ? 'N/D' : `${patientSat}%` },
                { label: 'F. Respiratoria', value: patientFR === 'N/D' ? 'N/D' : `${patientFR} rpm` },
                { label: 'Comorbilidades', value: patientComorb },
                { label: 'Evolucion', value: patientDays === 'N/D' ? 'N/D' : `${patientDays} dias` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b border-border/30 py-2 last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
        >
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-medical-teal" />
            <h2 className="text-lg font-display font-semibold text-foreground">Recomendaciones</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {recommendations.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl bg-secondary/30 p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-medical-teal" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-medical-warning/20 bg-medical-warning/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-medical-warning" />
              <div>
                <p className="text-sm font-semibold text-foreground">Aviso Importante</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Este es un diagnostico presuntivo generado por inteligencia artificial. Los resultados deben ser
                  validados por un profesional medico cualificado antes de tomar decisiones clinicas.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="flex flex-col items-center justify-center gap-4 pb-8 sm:flex-row">
          <button
            onClick={() => navigate('/diagnostico')}
            className="flex h-11 items-center gap-2 rounded-md border border-border px-6 text-sm font-medium text-foreground"
          >
            <Activity className="h-4 w-4" />
            Nuevo Analisis
          </button>
          <button
            onClick={() => navigate('/panel')}
            className="gradient-primary shadow-glow flex h-11 items-center gap-2 rounded-md px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Share2 className="h-4 w-4" />
            Volver al Dashboard
          </button>
        </div>
      </main>
    </div>
  )
}
