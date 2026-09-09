import { RadiografiasList } from "@/components/radiografias/radiografias-list"

export default function RadiografiasPage() {
  return (
    <div className="space-y-8">

      <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8 pt-6 overflow-hidden">
        <div className="flex flex-col gap-1 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Gestión de Radiografías
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-3xl">
            Pacientes derivados a rayos X y radiografías cargadas.
          </p>
        </div>

        <RadiografiasList />
      </div>
    </div>
  )
}
