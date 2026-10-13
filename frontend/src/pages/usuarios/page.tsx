import { ShieldCheck } from "lucide-react"

import {
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/stagger-animation"
import { UsuariosList } from "@/components/usuarios/usuarios-list"
import { ETIQUETA_ROL, useAuth } from "@/hooks/use-auth"

/**
 * HU-03 — Panel de gestión de usuarios (exclusivo del Administrador).
 *
 * El catálogo de roles vive en el backend para no duplicar la definición;
 * aquí solo se explica qué alcanza cada rol, como referencia para el admin.
 */
export default function UsuariosPage() {
  const { esAdmin } = useAuth()

  // La ruta ya está bloqueada por rol en el enrutador; esto es solo una red
  // de seguridad para quien entre por URL directa.
  if (!esAdmin) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/30 p-10 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-bold">Acceso restringido</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          La gestión de usuarios está reservada al rol Administrador.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <StaggerContainer className="space-y-2 pb-1" delay={80}>
        <StaggerItem index={0}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary/70 leading-none">
            Administración
          </p>
        </StaggerItem>
        <StaggerItem index={1}>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground/90 leading-tight">
            Usuarios
          </h1>
        </StaggerItem>
        <StaggerItem index={2}>
          <p className="max-w-3xl text-base text-muted-foreground/70 leading-relaxed font-medium">
            Gestiona las cuentas del personal, sus roles y el acceso al sistema.
          </p>
        </StaggerItem>
      </StaggerContainer>

      <div className="rounded-xl border border-blue-200/70 bg-blue-50/60 px-4 py-3 text-sm leading-relaxed text-blue-800">
        <span className="font-semibold">Alcance por rol:</span>{" "}
        {ETIQUETA_ROL.Admin} gestiona estas cuentas y no accede a datos
        clínicos. {ETIQUETA_ROL.Enfermera} registra pacientes, antecedentes y
        signos vitales, y carga radiografías. {ETIQUETA_ROL.Especialista}
        añade examen físico, derivación, validación del diagnóstico y reporte
        PDF.
      </div>

      <UsuariosList />
    </div>
  )
}