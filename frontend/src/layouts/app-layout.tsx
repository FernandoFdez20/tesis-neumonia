import { Outlet } from "react-router-dom"

import { AppSidebar } from "@/components/app-sidebar"
import { PatientRegistrationProvider } from "@/components/patients/patient-registration-provider"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function AppLayout() {
  return (
    <PatientRegistrationProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* ── Header ──────────────────────────────────────────── */}
          <header className="sticky top-0 z-10 flex h-15 shrink-0 items-center gap-3.5 border-b border-border/40 bg-background/85 px-5 md:px-6 backdrop-blur-md transition-all duration-200">
            <SidebarTrigger className="-ml-1 size-8 text-muted-foreground/80 hover:text-foreground hover:bg-accent/80 transition-all duration-200 rounded-lg cursor-pointer" />

            <Separator orientation="vertical" className="h-5 bg-border/60" />

            {/* Título de la sección activa */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-foreground/90 leading-none tracking-tight truncate">
                Sistema clínico de neumonía
              </p>
              <p className="text-[11px] text-muted-foreground/75 leading-none font-medium mt-1.5">
                Evaluación presuntiva · Adultos
              </p>
            </div>

            {/* Estado del sistema - Premium traslúcido */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/8 px-2.5 py-0.5">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75 duration-1000" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">En línea</span>
            </div>

            <Separator orientation="vertical" className="h-5 bg-border/60 hidden sm:block" />

            {/* Usuario */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col items-end leading-none gap-1">
                <span className="text-xs font-bold text-foreground/90">Dr. Fernández</span>
                <span className="text-[10px] text-muted-foreground/75 font-semibold">Médico residente</span>
              </div>
              <div className="flex size-8.5 items-center justify-center rounded-full bg-primary/8 border border-primary/15 text-[11px] font-extrabold text-primary select-none tracking-wider shadow-xs">
                DF
              </div>
            </div>
          </header>

          {/* ── Contenido ────────────────────────────────────── */}
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </PatientRegistrationProvider>
  )
}
