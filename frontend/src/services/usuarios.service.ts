import api from "@/lib/api"
import type { Usuario as UsuarioBase } from "@/services/auth.service"

/** HU-04: el usuario del panel además trae sus permisos efectivos. */
export type Usuario = UsuarioBase & {
  permisos: string[]
  /** Claves donde el usuario se aparta de lo que otorga su rol. */
  overrides: Record<string, boolean>
}

export type RolCatalogo = {
  valor: string
  etiqueta: string
  descripcion: string
}

export type UsuariosPaginados = {
  items: Usuario[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export type UsuarioCreate = {
  username: string
  correo: string
  password: string
  nombre_completo: string
  rol: string
}

export type PermisoCatalogo = {
  clave: string
  etiqueta: string
  grupo: string
  /** El rol seleccionado lo otorga por defecto. */
  base: boolean
}

export type UsuarioUpdate = {
  nombre_completo?: string
  correo?: string
  rol?: string
  estado?: boolean
}

export function listarUsuarios(params: {
  page?: number
  page_size?: number
  buscar?: string
  rol?: string
  estado?: boolean
}): Promise<UsuariosPaginados> {
  return api.get("/usuarios/", { params }).then((r) => r.data)
}

export function listarRoles(): Promise<RolCatalogo[]> {
  return api.get("/usuarios/roles").then((r) => r.data)
}

export function crearUsuario(datos: UsuarioCreate): Promise<Usuario> {
  return api.post("/usuarios/", datos).then((r) => r.data)
}

export function actualizarUsuario(
  usuarioId: number,
  datos: UsuarioUpdate,
): Promise<Usuario> {
  return api.patch(`/usuarios/${usuarioId}`, datos).then((r) => r.data)
}

export function resetearPassword(
  usuarioId: number,
  password: string,
): Promise<{ message: string }> {
  return api
    .patch(`/usuarios/${usuarioId}/password`, { password })
    .then((r) => r.data)
}

/** HU-04: catálogo de permisos; con `rol` marca cuáles lo otorga. */
export function listarPermisos(rol?: string): Promise<PermisoCatalogo[]> {
  return api.get("/usuarios/permisos", { params: { rol } }).then((r) => r.data)
}

/** HU-04: define la lista absoluta de permisos efectivos del usuario. */
export function asignarPermisos(
  usuarioId: number,
  permisos: string[],
): Promise<Usuario> {
  return api.put(`/usuarios/${usuarioId}/permisos`, { permisos }).then((r) => r.data)
}