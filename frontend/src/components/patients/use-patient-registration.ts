import { useContext } from "react"

import { PatientRegistrationContext } from "@/components/patients/patient-registration-context"

export function usePatientRegistration() {
  const context = useContext(PatientRegistrationContext)

  if (!context) {
    throw new Error(
      "usePatientRegistration must be used within PatientRegistrationProvider."
    )
  }

  return context
}
