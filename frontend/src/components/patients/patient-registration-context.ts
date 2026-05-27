import { createContext } from "react"

export type PatientRegistrationContextValue = {
  openNewPatientDialog: () => void
}

export const PatientRegistrationContext =
  createContext<PatientRegistrationContextValue | null>(null)
