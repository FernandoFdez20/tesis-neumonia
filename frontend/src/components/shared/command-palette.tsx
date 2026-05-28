import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  FileText,
  Home,
  Settings,
  User,
  Users,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { PATHS } from "@/routes/paths"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  function runCommand(command: () => void) {
    setOpen(false)
    command()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar pacientes, atenciones..." />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
        <CommandGroup heading="Navegación">
          <CommandItem
            onSelect={() => runCommand(() => navigate(PATHS.DASHBOARD))}
            className="cursor-pointer"
          >
            <Home className="mr-2 size-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate(PATHS.NEW_ATTENTION))}
            className="cursor-pointer"
          >
            <FileText className="mr-2 size-4" />
            <span>Nueva atención</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Acciones">
          <CommandItem
            onSelect={() => runCommand(() => navigate(PATHS.NEW_ATTENTION))}
            className="cursor-pointer"
          >
            <Users className="mr-2 size-4" />
            <span>Registrar paciente</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Configuración">
          <CommandItem className="cursor-pointer">
            <User className="mr-2 size-4" />
            <span>Mi perfil</span>
          </CommandItem>
          <CommandItem className="cursor-pointer">
            <Settings className="mr-2 size-4" />
            <span>Configuración</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export function CommandPaletteTrigger({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/50 px-3 py-1.5 text-sm text-muted-foreground/60 hover:bg-accent/50 hover:text-muted-foreground transition-all duration-200 cursor-pointer"
    >
      <span>Buscar...</span>
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/40 bg-muted/30 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/50">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
}
