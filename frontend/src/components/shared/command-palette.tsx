import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Activity, FileText, Home, Image, Search, UserPlus, Users } from "lucide-react"

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { PERMISOS, useAuth } from "@/hooks/use-auth"
import { PATHS } from "@/routes/paths"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { tienePermiso } = useAuth()
  const secciones = [
    { nombre: "Página principal", ruta: PATHS.DASHBOARD, permiso: PERMISOS.DASHBOARD_VER, icono: Home },
    { nombre: "Pacientes", ruta: PATHS.PATIENTS, permiso: PERMISOS.PACIENTES_VER, icono: Users },
    { nombre: "Atenciones médicas", ruta: PATHS.ATTENTIONS, permiso: PERMISOS.ATENCIONES_VER, icono: Activity },
    { nombre: "Radiografías", ruta: PATHS.RADIOGRAPHY, permiso: PERMISOS.RADIOGRAFIAS_CARGAR, icono: Image },
    { nombre: "Historial clínico", ruta: PATHS.HISTORY, permiso: PERMISOS.HISTORIAL_VER, icono: FileText },
  ]
  const acciones = [
    { nombre: "Registrar paciente", ruta: PATHS.REGISTER_PATIENT, permiso: PERMISOS.PACIENTES_REGISTRAR, icono: UserPlus },
    { nombre: "Nueva atención", ruta: PATHS.NEW_ATTENTION, permiso: PERMISOS.ATENCIONES_REGISTRAR, icono: Activity },
  ]

  useEffect(() => {
    function atajo(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((actual) => !actual)
      }
    }
    document.addEventListener("keydown", atajo)
    return () => document.removeEventListener("keydown", atajo)
  }, [])

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Buscar secciones y acciones"
        className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 transition-colors">
        <Search className="size-3.5" />
        Buscar...
        <kbd className="rounded border border-border/40 bg-muted/30 px-1.5 text-[10px]">Ctrl K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar secciones y acciones..." />
        <CommandList>
          <CommandEmpty>No se encontraron secciones ni acciones.</CommandEmpty>
          {[{ titulo: "Navegación", items: secciones }, { titulo: "Acciones", items: acciones }].map((grupo) => (
            <CommandGroup key={grupo.titulo} heading={grupo.titulo}>
              {grupo.items.filter((item) => tienePermiso(item.permiso)).map((item) => (
                <CommandItem key={item.ruta} onSelect={() => {
                  setOpen(false)
                  navigate(item.ruta)
                }} className="cursor-pointer">
                  <item.icono className="mr-2 size-4" />
                  {item.nombre}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
