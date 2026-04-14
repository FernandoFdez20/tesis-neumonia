import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Clock,
  Droplets,
  FileText,
  HeartPulse,
  ImageIcon,
  Stethoscope,
  Thermometer,
  Upload,
  User,
  Wind,
  X,
} from 'lucide-react'
import { createDiagnosticoRequest, getEnfermedadesRequest } from '../services/api'

const steps = [
  { id: 1, label: 'Radiografia', icon: ImageIcon },
  { id: 2, label: 'Datos del Paciente', icon: User },
  { id: 3, label: 'Signos Vitales', icon: HeartPulse },
  { id: 4, label: 'Antecedentes', icon: FileText },
]

const fadeSlide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

// Clases base copiadas de la libreria UI del proyecto fuente para mantener el mismo look.
const inputBaseClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

const textareaBaseClass =
  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const selectBaseClass =
  'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-md px-5 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

export function Diagnostico() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [image, setImage] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedDiseases, setSelectedDiseases] = useState([])
  const [enfermedadesCatalogo, setEnfermedadesCatalogo] = useState([])
  const [isLoadingEnfermedades, setIsLoadingEnfermedades] = useState(true)
  const [errorEnfermedades, setErrorEnfermedades] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [formData, setFormData] = useState({
    nombre_completo: '',
    expediente_id: '',
    fecha_nacimiento: '',
    sexo: '',
    peso_kg: '',
    motivo_consulta: '',
    temperatura_c: '',
    frecuencia_cardiaca: '',
    frecuencia_respiratoria: '',
    saturacion_o2: '',
    presion_arterial: '',
    tiempo_evolucion_dias: '',
    sintomas_principales: '',
    otros_antecedentes: '',
    antecedentes_familiares: '',
  })

  // Mantiene actualizaciones directas y legibles para todos los campos del formulario.
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Convierte archivo de imagen a base64 para previsualizacion igual al flujo original.
  const readImageFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (event) => setImage(event.target?.result || null)
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault()
      setDragActive(false)
      const file = event.dataTransfer.files?.[0]
      readImageFile(file)
    },
    [readImageFile],
  )

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    readImageFile(file)
  }

  const toggleDisease = (disease) => {
    setSelectedDiseases((prev) =>
      prev.includes(disease) ? prev.filter((item) => item !== disease) : [...prev, disease],
    )
  }

  useEffect(() => {
    let isMounted = true

    const loadEnfermedades = async () => {
      try {
        setErrorEnfermedades('')
        // Trae catalogo real desde backend para evitar listas hardcodeadas en frontend.
        const data = await getEnfermedadesRequest()
        if (isMounted) {
          setEnfermedadesCatalogo(data)
        }
      } catch (error) {
        if (isMounted) {
          setErrorEnfermedades(error.message || 'No se pudo cargar el catalogo de enfermedades')
        }
      } finally {
        if (isMounted) {
          setIsLoadingEnfermedades(false)
        }
      }
    }

    loadEnfermedades()

    return () => {
      isMounted = false
    }
  }, [])

  // Calcula edad exacta en anios a partir de fecha de nacimiento para evitar ingreso manual.
  const calculateAgeYears = (birthDate) => {
    if (!birthDate) return null

    const today = new Date()
    const date = new Date(birthDate)
    if (Number.isNaN(date.getTime()) || date > today) return null

    let age = today.getFullYear() - date.getFullYear()
    const monthDiff = today.getMonth() - date.getMonth()
    const dayDiff = today.getDate() - date.getDate()

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1
    }

    return age
  }

  const calculatedAge = useMemo(
    () => calculateAgeYears(formData.fecha_nacimiento),
    [formData.fecha_nacimiento],
  )

  const payload = useMemo(
    () => ({
      ...formData,
      edad: calculatedAge !== null ? String(calculatedAge) : '',
      enfermedades_cronicas: selectedDiseases,
      radiografia_cargada: Boolean(image),
    }),
    [calculatedAge, formData, image, selectedDiseases],
  )

  // Envía el formulario completo al backend para persistir paciente, diagnostico y relacion de enfermedades.
  const handleSubmit = async () => {
    if (!imageFile) {
      setSubmitError('Debe cargar una radiografia antes de analizar')
      setCurrentStep(1)
      return
    }

    setSubmitError('')
    setIsSubmitting(true)

    try {
      const requestPayload = {
        nombre_completo: formData.nombre_completo,
        expediente_id: formData.expediente_id,
        fecha_nacimiento: formData.fecha_nacimiento,
        sexo: formData.sexo,
        peso_kg: formData.peso_kg,
        motivo_consulta: formData.motivo_consulta,
        temperatura_c: formData.temperatura_c,
        frecuencia_cardiaca: formData.frecuencia_cardiaca,
        frecuencia_respiratoria: formData.frecuencia_respiratoria,
        saturacion_o2: formData.saturacion_o2,
        presion_arterial: formData.presion_arterial,
        tiempo_evolucion_dias: formData.tiempo_evolucion_dias,
        sintomas_principales: formData.sintomas_principales,
        otros_antecedentes: formData.otros_antecedentes,
        antecedentes_familiares: formData.antecedentes_familiares,
        enfermedades_cronicas: JSON.stringify(selectedDiseases),
        imagen_file: imageFile,
      }

      const response = await createDiagnosticoRequest(requestPayload)

      navigate('/resultados', {
        state: {
          diagnostico: payload,
          registro: response,
        },
      })
    } catch (error) {
      setSubmitError(error.message || 'No se pudo registrar el diagnostico')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <button
            onClick={() => navigate('/panel')}
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-medical-blue" />
            <span className="font-display font-semibold text-foreground">Nuevo Diagnostico</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-10 flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  currentStep === step.id
                    ? 'gradient-primary text-white shadow-glow'
                    : currentStep > step.id
                    ? 'bg-medical-teal/10 text-medical-teal'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                <step.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={`mx-1 h-px w-8 ${currentStep > step.id ? 'bg-medical-teal' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.section key="step1" {...fadeSlide} className="mx-auto max-w-2xl">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-display font-bold text-foreground">Cargar Radiografia de Torax</h2>
                <p className="mt-2 text-muted-foreground">Suba la imagen de rayos X del paciente para el analisis</p>
              </div>

              {!image ? (
                <div
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragActive(true)
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-16 text-center transition-all ${
                    dragActive
                      ? 'border-medical-blue bg-medical-blue/5'
                      : 'border-border hover:border-medical-blue/50 hover:bg-secondary/30'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-medical-blue/10">
                      <Upload className="h-8 w-8 text-medical-blue" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">Arrastre y suelte la radiografia aqui</p>
                      <p className="mt-1 text-sm text-muted-foreground">o haga clic para seleccionar un archivo</p>
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG o DICOM · Maximo 25MB</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card">
                  <div className="relative">
                    <img src={image} alt="Radiografia" className="h-96 w-full bg-black/5 object-contain" />
                    <button
                      onClick={() => {
                        setImage(null)
                        setImageFile(null)
                      }}
                      className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-card/90 shadow-sm transition-colors hover:bg-medical-danger hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 border-t border-border/50 p-4 text-medical-success">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Imagen cargada correctamente</span>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {currentStep === 2 && (
            <motion.section key="step2" {...fadeSlide} className="mx-auto max-w-2xl">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-display font-bold text-foreground">Datos del Paciente</h2>
                <p className="mt-2 text-muted-foreground">Informacion demografica y clinica del paciente</p>
              </div>

              <div className="space-y-6 rounded-2xl border border-border/50 bg-card p-8 shadow-card">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nombre completo</label>
                    <input
                      value={formData.nombre_completo}
                      onChange={(event) => updateField('nombre_completo', event.target.value)}
                      placeholder="Nombre del paciente"
                      className={`${inputBaseClass} h-11 bg-secondary/30`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">ID / Expediente</label>
                    <input
                      value={formData.expediente_id}
                      onChange={(event) => updateField('expediente_id', event.target.value)}
                      placeholder="Ej: PX-0000"
                      className={`${inputBaseClass} h-11 bg-secondary/30`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Fecha de nacimiento</label>
                    <input
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(event) => updateField('fecha_nacimiento', event.target.value)}
                      className={`${inputBaseClass} h-11 bg-secondary/30`}
                    />
                    <p className="text-xs text-muted-foreground">
                      {calculatedAge !== null ? `Edad calculada: ${calculatedAge} anios` : 'Edad calculada: -'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Sexo</label>
                    <select
                      value={formData.sexo}
                      onChange={(event) => updateField('sexo', event.target.value)}
                      className={`${selectBaseClass} h-11 bg-secondary/30`}
                    >
                      <option value="">Seleccionar</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Peso (kg)</label>
                    <input
                      type="number"
                      value={formData.peso_kg}
                      onChange={(event) => updateField('peso_kg', event.target.value)}
                      placeholder="kg"
                      className={`${inputBaseClass} h-11 bg-secondary/30`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Motivo de consulta</label>
                  <textarea
                    value={formData.motivo_consulta}
                    onChange={(event) => updateField('motivo_consulta', event.target.value)}
                    placeholder="Describa brevemente el motivo de la consulta..."
                    className={`${textareaBaseClass} min-h-25 bg-secondary/30`}
                  />
                </div>
              </div>
            </motion.section>
          )}

          {currentStep === 3 && (
            <motion.section key="step3" {...fadeSlide} className="mx-auto max-w-2xl">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-display font-bold text-foreground">Signos Vitales</h2>
                <p className="mt-2 text-muted-foreground">Registre los signos vitales actuales del paciente</p>
              </div>

              <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-card">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {[
                    { key: 'temperatura_c', label: 'Temperatura (°C)', icon: Thermometer, placeholder: '36.5' },
                    { key: 'frecuencia_cardiaca', label: 'Frecuencia Cardiaca (lpm)', icon: HeartPulse, placeholder: '72' },
                    { key: 'frecuencia_respiratoria', label: 'Frecuencia Respiratoria (rpm)', icon: Wind, placeholder: '18' },
                    { key: 'saturacion_o2', label: 'Saturacion O2 (%)', icon: Droplets, placeholder: '98' },
                    { key: 'presion_arterial', label: 'Presion Arterial (mmHg)', icon: Activity, placeholder: '120/80' },
                    { key: 'tiempo_evolucion_dias', label: 'Tiempo de evolucion (dias)', icon: Clock, placeholder: '3' },
                  ].map((vital) => (
                    <div key={vital.key} className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <vital.icon className="h-4 w-4 text-medical-blue" />
                        {vital.label}
                      </label>
                      <input
                        value={formData[vital.key]}
                        onChange={(event) => updateField(vital.key, event.target.value)}
                        placeholder={vital.placeholder}
                        className={`${inputBaseClass} h-11 bg-secondary/30`}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2">
                  <label className="text-sm font-medium text-foreground">Sintomas principales</label>
                  <textarea
                    value={formData.sintomas_principales}
                    onChange={(event) => updateField('sintomas_principales', event.target.value)}
                    placeholder="Ej: Tos productiva, fiebre de 3 dias de evolucion, disnea al esfuerzo..."
                    className={`${textareaBaseClass} min-h-25 bg-secondary/30`}
                  />
                </div>
              </div>
            </motion.section>
          )}

          {currentStep === 4 && (
            <motion.section key="step4" {...fadeSlide} className="mx-auto max-w-2xl">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-display font-bold text-foreground">Antecedentes Clinicos</h2>
                <p className="mt-2 text-muted-foreground">Historial medico y enfermedades cronicas del paciente</p>
              </div>

              <div className="space-y-8 rounded-2xl border border-border/50 bg-card p-8 shadow-card">
                <div>
                  <label className="mb-4 block text-base font-semibold text-foreground">Enfermedades Cronicas</label>
                  {isLoadingEnfermedades ? (
                    <p className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
                      Cargando catalogo de enfermedades...
                    </p>
                  ) : errorEnfermedades ? (
                    <p className="rounded-xl border border-medical-danger/30 bg-medical-danger/10 px-4 py-3 text-sm text-medical-danger">
                      {errorEnfermedades}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {enfermedadesCatalogo.map((enfermedad) => {
                        const isChecked = selectedDiseases.includes(enfermedad.nombre)
                        return (
                          <label
                            key={enfermedad.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                              isChecked
                                ? 'border-medical-blue bg-medical-blue/5'
                                : 'border-border hover:border-medical-blue/30 hover:bg-secondary/30'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleDisease(enfermedad.nombre)}
                              className="h-4 w-4 rounded-sm border border-primary accent-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                            <span className="text-sm text-foreground">{enfermedad.nombre}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Otros antecedentes</label>
                  <textarea
                    value={formData.otros_antecedentes}
                    onChange={(event) => updateField('otros_antecedentes', event.target.value)}
                    placeholder="Cirugias previas, alergias, medicamentos actuales, tabaquismo, etc."
                    className={`${textareaBaseClass} min-h-30 bg-secondary/30`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Antecedentes familiares relevantes</label>
                  <textarea
                    value={formData.antecedentes_familiares}
                    onChange={(event) => updateField('antecedentes_familiares', event.target.value)}
                    placeholder="Enfermedades pulmonares, cardiovasculares o autoinmunes en familiares directos..."
                    className={`${textareaBaseClass} min-h-20 bg-secondary/30`}
                  />
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {submitError && (
          <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-medical-danger/30 bg-medical-danger/10 px-4 py-3 text-sm text-medical-danger">
            {submitError}
          </div>
        )}

        <div className="mx-auto mt-10 flex max-w-2xl items-center justify-between">
          <button
            onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}
            disabled={currentStep === 1}
            className={`${secondaryButtonClass} h-11 gap-2`}
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep((step) => Math.min(4, step + 1))}
              className={`${primaryButtonClass} gradient-primary shadow-glow h-11 gap-2 font-semibold hover:opacity-90`}
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`${primaryButtonClass} gradient-primary shadow-glow h-11 gap-2 px-8 font-semibold hover:opacity-90`}
            >
              <Stethoscope className="h-4 w-4" />
              {isSubmitting ? 'Guardando...' : 'Analizar con IA'}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
