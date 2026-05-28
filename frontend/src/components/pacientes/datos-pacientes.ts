export type PacienteDisponible = {
  nombreCompleto: string
  dni: string
  edad: string
  sexo: string
  registradoEn?: string
}

export const datosPacientes: PacienteDisponible[] = [
  {
    nombreCompleto: "Mariana Rojas",
    dni: "70451298",
    edad: "62",
    sexo: "femenino",
  },
  {
    nombreCompleto: "Carlos Medina",
    dni: "44812673",
    edad: "71",
    sexo: "masculino",
  },
  {
    nombreCompleto: "Elena Torres",
    dni: "72948315",
    edad: "54",
    sexo: "femenino",
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
