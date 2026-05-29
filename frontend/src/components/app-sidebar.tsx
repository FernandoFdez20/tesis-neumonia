import { Activity, ClipboardPlus, Home, LogOut, UserRoundPlus, UsersRound } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { PATHS } from "@/routes/paths"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
  SidebarRail,
} from "@/components/ui/sidebar"

const rutasPacientes: string[] = [PATHS.PATIENTS, PATHS.NEW_ATTENTION]

type AppSidebarProps = {
  onRegistrarPaciente: () => void
  onNuevaAtencion: () => void
}

export function AppSidebar({ onRegistrarPaciente, onNuevaAtencion }: AppSidebarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { setOpenMobile } = useSidebar()
  const esRutaPaciente = rutasPacientes.includes(pathname)

  function handleCerrarSesion() {
    navigate(PATHS.LOGIN)
  }

  function handleRegistrarPaciente() {
    onRegistrarPaciente()
    setOpenMobile(false)
  }

  function handleNuevaAtencion() {
    onNuevaAtencion()
    setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon">
      {/* ── Brand ──────────────────────────────────────────── */}
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
            <Activity className="size-4.5" strokeWidth={2.4} />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-[15px] font-extrabold tracking-tight text-foreground leading-tight">
              NeumoCare
            </p>
            <p className="truncate text-[11px] text-muted-foreground font-medium leading-tight mt-1">
              Soporte clínico · Adultos
            </p>
          </div>
        </div>
      </SidebarHeader>

      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent group-data-[collapsible=icon]:mx-2" />

      {/* ── Navegación ─────────────────────────────────────── */}
      <SidebarContent className="px-3 pt-4">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2.5 mb-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === PATHS.DASHBOARD || pathname === PATHS.APP}
                  tooltip="Página principal"
                  className="h-10 px-3 rounded-xl transition-all duration-200 hover:bg-accent/80 data-active:bg-primary/8 data-active:text-primary data-active:shadow-sm data-active:shadow-primary/10"
                >
                  <Link to={PATHS.DASHBOARD}>
                    <Home className="size-[18px]" strokeWidth={2} />
                    <span className="font-medium">Página principal</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Pacientes */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={esRutaPaciente}
                  tooltip="Pacientes"
                  className="h-10 px-3 rounded-xl transition-all duration-200 hover:bg-accent/80 data-active:bg-primary/8 data-active:text-primary data-active:shadow-sm data-active:shadow-primary/10"
                >
                  <Link to={PATHS.PATIENTS}>
                    <UsersRound className="size-[18px]" strokeWidth={2} />
                    <span className="font-medium">Pacientes</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuSub className="ml-3.5 pl-3 border-l border-border/50 gap-1 py-1.5">
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={false}
                      className="h-9 px-3 rounded-lg transition-all duration-200 hover:bg-accent/60"
                    >
                      <button type="button" onClick={handleRegistrarPaciente}>
                        <UserRoundPlus className="size-4" strokeWidth={2} />
                        <span className="font-medium">Registrar paciente</span>
                      </button>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={false}
                      className="h-9 px-3 rounded-lg transition-all duration-200 hover:bg-accent/60 data-active:bg-primary/8 data-active:text-primary"
                    >
                      <button type="button" onClick={handleNuevaAtencion}>
                        <ClipboardPlus className="size-4" strokeWidth={2} />
                        <span className="font-medium">Nueva atención</span>
                      </button>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ─────────────────────────────────────────── */}
      <SidebarFooter className="px-3 pb-4 pt-2 gap-3">
        {/* Aviso clínico */}
        <div className="mx-1 rounded-xl bg-gradient-to-br from-primary/5 to-primary/[0.02] border border-primary/10 p-3.5 group-data-[collapsible=icon]:hidden transition-all duration-200 hover:border-primary/15">
          <div className="flex items-start gap-2.5">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary/60 animate-pulse" />
            <p className="text-[11px] leading-relaxed text-muted-foreground/80 font-medium">
              Apoyo presuntivo.{" "}
              <span className="font-semibold text-foreground/70">
                Validación médica siempre requerida.
              </span>
            </p>
          </div>
        </div>

        <div className="mx-2 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent group-data-[collapsible=icon]:hidden" />

        {/* Salir del sistema */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Salir del sistema"
              onClick={handleCerrarSesion}
              className="h-10 px-3 rounded-xl text-muted-foreground/80 hover:bg-red-500/5 hover:text-red-600 hover:border-red-500/10 border border-transparent transition-all duration-200 [&_svg]:text-muted-foreground/60 hover:[&_svg]:text-red-500"
            >
              <LogOut className="size-[18px]" strokeWidth={2} />
              <span className="font-medium">Salir del sistema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
