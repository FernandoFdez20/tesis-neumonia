import { useCallback, useMemo } from "react"

import type { Usuario } from "@/services/auth.service"

/**
 * Roles del sistema (HU-03). El valor es el que viaja en `usuario.rol`
 * y coincide con el enum `tipo_rol` del backend.
 */
export const ROLES = {
  ADMIN: "Admin",
  ENFERMERA: "Enfermera",
  ESPECIALISTA: "Especialista",
} as const

export type Rol = (typeof ROLES)[keyof typeof ROLES]

/** Etiquetas visibles para cada rol. */
export const ETIQUETA_ROL: Record<string, string> = {
  [ROLES.ADMIN]: "Administrador",
  [ROLES.ENFERMERA]: "Enfermería",
  [ROLES.ESPECIALISTA]: "Especialista",
}

/**
 * HU-04 — Permisos del catálogo del backend (ver app/core/permisos.py).
 * Se declaran aquí solo para tipar y para filtrar la interfaz; la decisión
 * de acceso la toma el backend, que es la autoridad.
 */
export const PERMISOS = {
  DASHBOARD_VER: "dashboard.ver",
  PACIENTES_VER: "pacientes.ver",
  PACIENTES_REGISTRAR: "pacientes.registrar",
  ATENCIONES_VER: "atenciones.ver",
  ATENCIONES_REGISTRAR: "atenciones.registrar",
  EXAMEN_FISICO: "atenciones.examen_fisico",
  RADIOGRAFIAS_CARGAR: "radiografias.cargar",
  RESULTADOS_VER: "resultados.ver",
  DIAGNOSTICO_VALIDAR: "diagnostico.validar",
  REPORTE_PDF: "reporte.pdf",
  HISTORIAL_VER: "historial.ver",
  ALERTAS_VER: "alertas.ver",
  USUARIOS_GESTIONAR: "usuarios.gestionar",
} as const

const CLAVE_USUARIO = "usuario"
const CLAVE_TOKEN = "token"

/**
 * Lee la sesión guardada en localStorage.
 *
 * El backend es la autoridad: esto solo controla qué se muestra. Si un rol
 * cambiara en la BD, la sesión quedaría desactualizada y el usuario tendrá
 * que volver a iniciar sesión para pick up el cambio.
 */
export function useAuth() {
  const usuario = useMemo<Usuario | null>(() => {
    try {
      const bruto = localStorage.getItem(CLAVE_USUARIO)
      return bruto ? (JSON.parse(bruto) as Usuario) : null
    } catch {
      return null
    }
  }, [])

  const token = localStorage.getItem(CLAVE_TOKEN) ?? null
  const rol = usuario?.rol ?? null

  /** HU-04: permisos efectivos que devolvió el backend al iniciar sesión. */
  const permisos = useMemo(
    () => new Set(usuario?.permisos ?? []),
    [usuario?.permisos]
  )

  /** ¿El usuario tiene este permiso? Acepta cualquiera de los indicados. */
  const tienePermiso = useCallback(
    (...claves: string[]) => claves.some((c) => permisos.has(c)),
    [permisos]
  )

  /**
   * Administrador: gestiona cuentas y roles, sin acceso a datos clínicos.
   * Es un atajo por rol; el detalle fino se resuelve con `tienePermiso`.
   */
  const esAdmin = rol === ROLES.ADMIN

  /** Enfermería o Especialista: acceso a datos clínicos. */
  const esClinico = rol === ROLES.ENFERMERA || rol === ROLES.ESPECIALISTA

  /**
   * Especialista: todo lo de enfermería más examen físico, derivación,
   * validación del diagnóstico de la IA y reporte PDF.
   */
  const esEspecialista = rol === ROLES.ESPECIALISTA

  const etiquetaRol = rol ? (ETIQUETA_ROL[rol] ?? rol) : null

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(CLAVE_TOKEN)
    localStorage.removeItem(CLAVE_USUARIO)
  }, [])

  return {
    usuario,
    token,
    rol,
    etiquetaRol,
    permisos,
    tienePermiso,
    esAdmin,
    esClinico,
    esEspecialista,
    cerrarSesion,
  }
}