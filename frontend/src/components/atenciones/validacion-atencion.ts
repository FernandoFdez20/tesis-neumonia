import type { FormularioAtencion } from "@/components/atenciones/use-nueva-atencion-form"

/**
 * Validación en vivo del formulario de nueva atención.
 * Usa los mismos rangos de los inputs (no inventa criterios clínicos nuevos);
 * las cotas de presión son amplias de plausibilidad física, solo para
 * atrapar errores de tipeo, no para decidir conducta clínica.
 * Cada validador devuelve el mensaje de error o null si está válido o vacío
 * (vacío = sin error: lo obligatorio lo controla puedeGuardar/required).
 */

export const RANGOS = {
  temperatura: { min: 30, max: 45, unidad: "°C" },
  frecuenciaCardiaca: { min: 20, max: 240, unidad: "lpm" },
  frecuenciaRespiratoria: { min: 5, max: 80, unidad: "rpm" },
  saturacionOxigeno: { min: 50, max: 100, unidad: "%" },
  tiempoEvolucionDias: { min: 0, max: 90, unidad: "días" },
  presionSistolica: { min: 50, max: 300 },
  presionDiastolica: { min: 30, max: 200 },
} as const

type CampoNumerico =
  | "temperatura"
  | "frecuenciaCardiaca"
  | "frecuenciaRespiratoria"
  | "saturacionOxigeno"
  | "tiempoEvolucionDias"

function validarNumerico(campo: CampoNumerico, texto: string): string | null {
  const limpio = texto.trim()
  if (!limpio) return null
  const numero = Number(limpio.replace(",", "."))
  if (!Number.isFinite(numero)) return "Debe ser un número válido."
  const { min, max, unidad } = RANGOS[campo]
  if (numero < min || numero > max) {
    return `Debe estar entre ${min} y ${max} ${unidad}.`
  }
  return null
}

export function validarDocumento(texto: string): string | null {
  const limpio = texto.trim()
  if (!limpio) return null
  if (!/^\d+$/.test(limpio)) return "Solo se admiten números."
  if (limpio.length !== 8) return `Debe tener 8 dígitos (lleva ${limpio.length}).`
  return null
}

export function validarPresion(texto: string): string | null {
  const limpio = texto.trim().replace(/\s+/g, "")
  if (!limpio) return null
  const partes = limpio.split("/")
  if (partes.length !== 2 || partes.some((p) => !/^\d+$/.test(p))) {
    return "Formato SYS/DIA, ej. 120/80."
  }
  const [sis, dia] = partes.map(Number)
  const { min: minSis, max: maxSis } = RANGOS.presionSistolica
  const { min: minDia, max: maxDia } = RANGOS.presionDiastolica
  if (sis < minSis || sis > maxSis) return `Sistólica fuera de rango (${minSis}–${maxSis}).`
  if (dia < minDia || dia > maxDia) return `Diastólica fuera de rango (${minDia}–${maxDia}).`
  if (sis <= dia) return "La sistólica debe ser mayor que la diastólica."
  return null
}

export function validarFechaAtencion(texto: string): string | null {
  if (!texto.trim()) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(`${texto}T00:00:00`)
  if (Number.isNaN(fecha.getTime())) return "Fecha no válida."
  if (fecha > hoy) return "La fecha no puede ser futura."
  return null
}

export type ErroresAtencion = Partial<Record<keyof FormularioAtencion, string>>

/** Calcula todos los errores del formulario (para mostrar al tipeo). */
export function validarFormularioAtencion(form: FormularioAtencion): ErroresAtencion {
  const errores: ErroresAtencion = {}
  const doc = validarDocumento(form.documentoPaciente)
  if (doc) errores.documentoPaciente = doc
  const fecha = validarFechaAtencion(form.fechaAtencion)
  if (fecha) errores.fechaAtencion = fecha
  const presion = validarPresion(form.presionArterial)
  if (presion) errores.presionArterial = presion
  const numericos: CampoNumerico[] = [
    "frecuenciaCardiaca",
    "temperatura",
    "frecuenciaRespiratoria",
    "saturacionOxigeno",
    "tiempoEvolucionDias",
  ]
  for (const campo of numericos) {
    const e = validarNumerico(campo, form[campo])
    if (e) errores[campo] = e
  }
  return errores
}
