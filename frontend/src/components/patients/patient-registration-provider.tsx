import type { ReactNode } from "react"
import { useCallback, useMemo, useState } from "react"

import { NewPatientDialog } from "@/components/patients/new-patient-dialog"
import { PatientRegistrationContext } from "@/components/patients/patient-registration-context"

export function PatientRegistrationProvider({
  children,
}: {
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  const openNewPatientDialog = useCallback(() => {
    setOpen(true)
  }, [])

  const value = useMemo(
    () => ({
      openNewPatientDialog,
    }),
    [openNewPatientDialog]
  )

  return (
    <PatientRegistrationContext.Provider value={value}>
      {children}
      <NewPatientDialog open={open} onOpenChange={setOpen} />
    </PatientRegistrationContext.Provider>
  )
}
