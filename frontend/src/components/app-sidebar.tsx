import { Activity, ClipboardPlus, Home, LogOut, UserRoundPlus, UsersRound } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { usePatientRegistration } from "@/components/patients/use-patient-registration"
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

const patientRoutes: string[] = [PATHS.NEW_ATTENTION]

export function AppSidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { setOpenMobile } = useSidebar()
  const { openNewPatientDialog } = usePatientRegistration()
  const isPatientRoute = patientRoutes.includes(pathname)

  function handleLogout() {
    navigate(PATHS.LOGIN)
  }

  function handleRegisterPatient() {
    openNewPatientDialog()
    setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon">
      {/* ── Brand ──────────────────────────────────────────── */}
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          {/* Logotipo: cuadrado con icono clínico */}
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30">
            <Activity className="size-4.5" strokeWidth={2.4} />
          </div>
          {/* Nombre y subtítulo */}
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

      {/* Divisor con margen horizontal */}
      <div className="mx-4 h-px bg-sidebar-border/60 group-data-[collapsible=icon]:mx-2" />

      {/* ── Navegación ─────────────────────────────────────── */}
      <SidebarContent className="px-2 pt-3">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2.5 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === PATHS.DASHBOARD || pathname === PATHS.APP}
                  tooltip="Página principal"
                >
                  <Link to={PATHS.DASHBOARD}>
                    <Home />
                    <span>Página principal</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Pacientes */}
              <SidebarMenuItem>
                <SidebarMenuButton isActive={isPatientRoute} tooltip="Pacientes">
                  <UsersRound />
                  <span>Pacientes</span>
                </SidebarMenuButton>
                <SidebarMenuSub className="ml-3.5 pl-3 border-l border-sidebar-border/50 gap-1.5 py-1">
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={false}
                    >
                      <button type="button" onClick={handleRegisterPatient}>
                        <UserRoundPlus />
                        <span>Registrar paciente</span>
                      </button>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={pathname === PATHS.NEW_ATTENTION}
                    >
                      <Link to={PATHS.NEW_ATTENTION}>
                        <ClipboardPlus />
                        <span>Nueva atención</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ─────────────────────────────────────────── */}
      <SidebarFooter className="px-2 pb-4 pt-2 gap-3">
        {/* Aviso clínico */}
        <div className="mx-1.5 rounded-xl bg-accent/40 border border-accent-foreground/5 p-3 group-data-[collapsible=icon]:hidden transition-all duration-200">
          <div className="flex items-start gap-2.5">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
            <p className="text-[11px] leading-relaxed text-muted-foreground/80 font-medium">
              Apoyo presuntivo.{" "}
              <span className="font-semibold text-foreground/75">
                Validación médica siempre requerida.
              </span>
            </p>
          </div>
        </div>

        {/* Divisor */}
        <div className="mx-2 h-px bg-sidebar-border/60 group-data-[collapsible=icon]:hidden" />

        {/* Salir del sistema */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Salir del sistema"
              onClick={handleLogout}
              className="group/logout text-muted-foreground/80 hover:bg-red-500/5 hover:text-red-600 hover:border-red-500/10 border border-transparent transition-all duration-200 [&_svg]:text-muted-foreground/60 hover:[&_svg]:text-red-500"
            >
              <LogOut />
              <span>Salir del sistema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
