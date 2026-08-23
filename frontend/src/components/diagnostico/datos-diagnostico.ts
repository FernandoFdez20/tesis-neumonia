import { atencionesMedicasMock } from "@/components/atenciones/datos-atenciones"
import type { AtencionMedica } from "@/components/atenciones/datos-atenciones"

export type EstadoAtencionDiagnostico = "En proceso" | "Finalizada"

export type DatosDiagnosticoMock = {
  atencionId: number
  codigoAtencion: string
  pacienteId: number
  paciente: string
  dni: string
  sexo: string
  edad: number
  responsableAtencion: string
  medicoResponsable: string
  fechaRegistro: string
  temperatura: string
  frecuenciaCardiaca: string
  frecuenciaRespiratoria: string
  saturacionO2: string
  presionArterial: string
  tiempoEvolucionDias: string
  sintomasPrincipales: string
  examenFisico: string
  observacionesClinicas: string
  estado: EstadoAtencionDiagnostico
}

export const diagnosticoMock: DatosDiagnosticoMock = {
  atencionId: 1042,
  codigoAtencion: "AT-1042",
  pacienteId: 1,
  paciente: "Mariana Rojas",
  dni: "70451298",
  sexo: "Femenino",
  edad: 64,
  responsableAtencion: "Enf. Rosa Quispe",
  medicoResponsable: "Dr. Fernando Fernández",
  fechaRegistro: "2026-05-30 08:20",
  temperatura: "38.4",
  frecuenciaCardiaca: "96",
  frecuenciaRespiratoria: "27",
  saturacionO2: "91",
  presionArterial: "128/82",
  tiempoEvolucionDias: "4",
  sintomasPrincipales: "Fiebre, tos productiva y disnea al esfuerzo",
  examenFisico:
    "Paciente vigil, orientada, con uso leve de musculatura accesoria. Murmullo vesicular disminuido en base derecha.",
  observacionesClinicas:
    "Se recomienda completar evaluación médica y decidir si requiere radiografía de tórax según evolución clínica.",
  estado: "En proceso",
}

const datosPacientePorCodigo: Record<
  string,
  Pick<DatosDiagnosticoMock, "sexo" | "edad" | "examenFisico" | "observacionesClinicas">
> = {
  "AT-1042": {
    sexo: "Femenino",
    edad: 64,
    examenFisico:
      "Paciente vigil, orientada, con uso leve de musculatura accesoria. Murmullo vesicular disminuido en base derecha.",
    observacionesClinicas:
      "Se recomienda completar evaluación médica y decidir si requiere radiografía de tórax según evolución clínica.",
  },
  "AT-1041": {
    sexo: "Masculino",
    edad: 73,
    examenFisico:
      "Paciente estable, sin tirajes. Murmullo vesicular conservado con roncus dispersos.",
    observacionesClinicas:
      "Controlar evolución de síntomas y respuesta a tratamiento sintomático.",
  },
  "AT-1039": {
    sexo: "Masculino",
    edad: 68,
    examenFisico:
      "Paciente con disnea evidente, taquipnea y crepitantes bibasales predominantes en hemitórax derecho.",
    observacionesClinicas:
      "Cuadro clínico compatible con infección respiratoria baja. Priorizar conducta diagnóstica.",
  },
  "AT-1037": {
    sexo: "Masculino",
    edad: 58,
    examenFisico:
      "Paciente cansado, febril, con murmullo vesicular disminuido en bases y tos productiva durante evaluación.",
    observacionesClinicas:
      "Requiere correlación clínica y seguimiento estrecho por saturación limítrofe.",
  },
  "AT-1035": {
    sexo: "Masculino",
    edad: 61,
    examenFisico:
      "Paciente con dolor pleurítico, frecuencia respiratoria elevada y crepitantes en campo pulmonar izquierdo.",
    observacionesClinicas:
      "Considerar radiografía por persistencia de síntomas y saturación baja.",
  },
}

function crearDiagnosticoDesdeAtencion(atencion: AtencionMedica): DatosDiagnosticoMock {
  const datosPaciente = datosPacientePorCodigo[atencion.codigo] ?? {
    sexo: "No especificado",
    edad: 0,
    examenFisico: "",
    observacionesClinicas: "",
  }

  return {
    atencionId: atencion.id,
    codigoAtencion: atencion.codigo,
    pacienteId: atencion.pacienteId,
    paciente: atencion.paciente,
    dni: atencion.dni,
    sexo: datosPaciente.sexo,
    edad: datosPaciente.edad,
    responsableAtencion: atencion.responsable,
    medicoResponsable: "Dr. Fernando Fernández",
    fechaRegistro: atencion.fechaRegistro,
    temperatura: atencion.temperatura.toString(),
    frecuenciaCardiaca: atencion.frecuenciaCardiaca.toString(),
    frecuenciaRespiratoria: atencion.frecuenciaRespiratoria.toString(),
    saturacionO2: atencion.saturacionO2.toString(),
    presionArterial: atencion.presionArterial,
    tiempoEvolucionDias: atencion.tiempoEvolucionDias.toString(),
    sintomasPrincipales: atencion.sintomasPrincipales,
    examenFisico: datosPaciente.examenFisico,
    observacionesClinicas: datosPaciente.observacionesClinicas,
    estado: atencion.estado,
  }
}

export function buscarDiagnosticoPorCodigoAtencion(codigoAtencion: string) {
  const atencion = atencionesMedicasMock.find(
    (registro) => registro.codigo.toLowerCase() === codigoAtencion.toLowerCase()
  )

  if (!atencion) {
    return null
  }

  return crearDiagnosticoDesdeAtencion(atencion)
}

export const patologiasRespiratoriasMock = [
  "Bronquitis",
  "Asma",
  "EPOC",
  "Tuberculosis",
  "Influenza",
  "Derrame pleural",
  "Atelectasia",
]
