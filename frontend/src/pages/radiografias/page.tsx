import { RadiografiasList } from "@/components/radiografias/radiografias-list"
import { PageHeader } from "@/components/shared/page-header"

export default function RadiografiasPage() {
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Soporte diagnóstico"
        title="Gestión de radiografías"
        description="Pacientes derivados a rayos X y radiografías cargadas."
      />
      <RadiografiasList />
    </div>
  )
}
