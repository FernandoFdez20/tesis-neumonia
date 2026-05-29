import { useEffect } from "react"
import { Bell } from "lucide-react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"

import { DialogNuevaAtencion } from "@/components/atenciones/nueva-atencion-dialog"
import { useAtenciones } from "@/components/atenciones/use-atenciones"
import { AppSidebar } from "@/components/app-sidebar"
import { DialogNuevoPaciente } from "@/components/pacientes/nuevo-paciente-dialog"
import { usePacientes } from "@/components/pacientes/use-pacientes"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { UserNav } from "@/components/shared/user-nav"
import { CommandPalette, CommandPaletteTrigger } from "@/components/shared/command-palette"
import { PATHS } from "@/routes/paths"

export function AppLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const {
    dialogNuevoPacienteAbierto,
    setDialogNuevoPacienteAbierto,
    abrirDialogoNuevoPaciente,
    pacientesRegistrados,
    agregarPacienteRegistrado,
  } = usePacientes()
  const {
    dialogNuevaAtencionAbierto,
    setDialogNuevaAtencionAbierto,
    abrirDialogoNuevaAtencion,
  } = useAtenciones()

  useEffect(() => {
    if (pathname === PATHS.REGISTER_PATIENT) {
      abrirDialogoNuevoPaciente()
      navigate(PATHS.DASHBOARD, { replace: true })
      return
    }

    if (pathname === PATHS.NEW_ATTENTION) {
      abrirDialogoNuevaAtencion()
      navigate(PATHS.DASHBOARD, { replace: true })
    }
  }, [pathname, navigate, abrirDialogoNuevoPaciente, abrirDialogoNuevaAtencion])

  function abrirRegistroPacienteDesdeAtencion() {
    setDialogNuevaAtencionAbierto(false)
    abrirDialogoNuevoPaciente()
  }

  return (
    <>
      <SidebarProvider>
        <AppSidebar
          onRegistrarPaciente={abrirDialogoNuevoPaciente}
          onNuevaAtencion={abrirDialogoNuevaAtencion}
        />
        <SidebarInset>
          {/* ── Header ──────────────────────────────────────────── */}
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-border/40 bg-background/90 px-5 md:px-6 backdrop-blur-xl transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <SidebarTrigger className="-ml-1 size-8 text-muted-foreground/80 hover:text-foreground hover:bg-accent/80 transition-all duration-200 rounded-lg cursor-pointer" />

            <Separator orientation="vertical" className="h-5 bg-border/50" />

            {/* Título de la sección activa */}
            <div className="flex-1 min-w-0 hidden sm:block">
              <p className="text-sm font-bold text-foreground/90 leading-none tracking-tight truncate">
                Sistema clínico de neumonía
              </p>
              <p className="text-xs text-muted-foreground/70 leading-none font-medium mt-1.5">
                Evaluación presuntiva · Adultos
              </p>
            </div>

            {/* Búsqueda - Command Palette */}
            <div className="flex-1 sm:flex-none">
              <CommandPaletteTrigger />
              <CommandPalette />
            </div>

            {/* Acciones del header */}
            <div className="flex items-center gap-1">
              {/* Notificaciones */}
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground/60 hover:text-foreground hover:bg-accent/60 transition-all duration-200 rounded-lg relative"
              >
                <Bell className="size-4" strokeWidth={2} />
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-red-500 ring-2 ring-background" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-5 bg-border/50 hidden sm:block" />

            {/* Estado del sistema */}
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75 duration-1000" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">En línea</span>
            </div>

            <Separator orientation="vertical" className="h-5 bg-border/50 hidden sm:block" />

            {/* Usuario con Dropdown */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="hidden sm:flex flex-col items-end leading-none gap-1">
                <span className="text-md font-bold text-foreground/85">Dr. Fernández</span>
                <span className="text-xs text-muted-foreground/65 font-semibold">Médico residente</span>
              </div>
              <UserNav />
            </div>
          </header>

          {/* ── Contenido ────────────────────────────────────── */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
      <DialogNuevaAtencion
        abierto={dialogNuevaAtencionAbierto}
        onCambioAbierto={setDialogNuevaAtencionAbierto}
        onRegistrarPaciente={abrirRegistroPacienteDesdeAtencion}
      />
      <DialogNuevoPaciente
        abierto={dialogNuevoPacienteAbierto}
        onCambioAbierto={setDialogNuevoPacienteAbierto}
        onRegistrarCita={abrirDialogoNuevaAtencion}
        pacientesRegistrados={pacientesRegistrados}
        agregarPacienteRegistrado={agregarPacienteRegistrado}
      />
    </>
  )
}
