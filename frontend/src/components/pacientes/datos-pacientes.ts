export type PacienteDisponible = {
  nombreCompleto: string
  dni: string
  fechaNacimiento: string
  sexo: string
  antecedentesFamiliares: string[]
  antecedentesPersonales: string[]
  registradoEn?: string
}

export const datosPacientes: PacienteDisponible[] = [
  {
    nombreCompleto: "Mariana Rojas",
    dni: "70451298",
    fechaNacimiento: "1962-04-18",
    sexo: "femenino",
    antecedentesFamiliares: ["asma", "diabetes"],
    antecedentesPersonales: ["hipertension"],
  },
  {
    nombreCompleto: "Carlos Medina",
    dni: "44812673",
    fechaNacimiento: "1953-09-07",
    sexo: "masculino",
    antecedentesFamiliares: ["epoc"],
    antecedentesPersonales: ["tabaquismo"],
  },
  {
    nombreCompleto: "Elena Torres",
    dni: "72948315",
    fechaNacimiento: "1970-12-22",
    sexo: "femenino",
    antecedentesFamiliares: [],
    antecedentesPersonales: ["asma"],
  },
]

const pacientesTemporales: PacienteDisponible[] = []

export function registrarPacienteTemporal(paciente: PacienteDisponible) {
  const indiceExistente = pacientesTemporales.findIndex(
    (registro) => registro.dni === paciente.dni
  )

  if (indiceExistente >= 0) {
    pacientesTemporales[indiceExistente] = paciente
    return paciente
  }

  pacientesTemporales.push(paciente)
  return paciente
}

export function buscarPacientePorDni(
  dni: string,
  registrosAdicionales: PacienteDisponible[] = []
) {
  const documento = dni.trim()

  return [...datosPacientes, ...pacientesTemporales, ...registrosAdicionales].find(
    (registro) => registro.dni === documento
  )
}
