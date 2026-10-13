import type { FormEvent } from "react"
import { useEffect, useId, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ROLES } from "@/hooks/use-auth"
import type { Usuario } from "@/services/usuarios.service"
import { PermisosEditor } from "@/components/usuarios/permisos-editor"
import type { PermisoCatalogo } from "@/services/usuarios.service"

export type ValoresUsuario = {
  username: string
  correo: string
  password: string
  nombre: string
  rol: string
}

type Modo = "crear" | "editar"

type Props = {
  abierto: boolean
  onCambioAbierto: (abierto: boolean) => void
  modo: Modo
  /** Usuario a editar; en modo "crear" va undefined. */
  usuario: Usuario | null
  onGuardar: (valores: ValoresUsuario) => Promise<void>
  /** HU-04: catálogo de permisos y los ya efectivos del usuario. */
  catalogoPermisos: PermisoCatalogo[]
  onGuardarPermisos: (permisos: string[]) => Promise<void>
}

const ROLES_DISPONIBLES: { valor: string; texto: string }[] = [
  {
    valor: ROLES.ADMIN,
    texto: "Administrador — gestiona cuentas y roles, sin datos clínicos",
  },
  {
    valor: ROLES.ENFERMERA,
    texto: "Enfermería — registro, signos vitales, carga de radiografías",
  },
  {
    valor: ROLES.ESPECIALISTA,
    texto: "Especialista — lo anterior más examen físico, validación y PDF",
  },
]

/** Coincide con las validaciones del backend (UsuarioCreate / UsuarioUpdate). */
export function validarFormulario(
  valores: ValoresUsuario,
  modo: Modo
): Record<string, string> {
  const errores: Record<string, string> = {}

  if (modo === "crear") {
    if (valores.username.trim().length < 3)
      errores.username = "Mínimo 3 caracteres"
    if (valores.password.length < 8) errores.password = "Mínimo 8 caracteres"
  }
  if (valores.nombre.trim().length < 3)
    errores.nombre = "Ingresa el nombre completo"
  if (!/^\S+@\S+\.\S+$/.test(valores.correo.trim()))
    errores.correo = "Correo no válido"
  if (!valores.rol) errores.rol = "Selecciona un rol"

  return errores
}

export function DialogUsuario({
  abierto,
  onCambioAbierto,
  modo,
  usuario,
  onGuardar,
  catalogoPermisos,
  onGuardarPermisos,
}: Props) {
  const formId = useId()
  const editando = modo === "editar"

  const [username, setUsername] = useState("")
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [nombre, setNombre] = useState("")
  const [rol, setRol] = useState<string>(ROLES.ENFERMERA)
  // HU-04: permisos efectivos mientras se edita.
  const [permisos, setPermisos] = useState<Set<string>>(new Set())
  const [tocado, setTocado] = useState(false)
  const [errorServidor, setErrorServidor] = useState("")
  const [guardando, setGuardando] = useState(false)

  // Al abrir, cargamos los datos del usuario editado (o formulario vacío).
  useEffect(() => {
    if (!abierto) return
    setUsername(usuario?.username ?? "")
    setCorreo(usuario?.correo ?? "")
    setPassword("")
    setNombre(usuario?.nombre_completo ?? "")
    setRol(usuario?.rol ?? ROLES.ENFERMERA)
    setPermisos(new Set(usuario?.permisos ?? []))
    setTocado(false)
    setErrorServidor("")
  }, [abierto, usuario])

  const valores = useMemo<ValoresUsuario>(
    () => ({ username, correo, password, nombre, rol }),
    [username, correo, password, nombre, rol]
  )

  const todosErrores = useMemo(
    () => validarFormulario(valores, modo),
    [valores, modo]
  )

  // Los errores solo se muestran tras intentar guardar o abandonar un campo.
  const errores = useMemo(() => {
    if (!tocado) return {} as Record<string, string>
    return todosErrores
  }, [tocado, todosErrores])

  const puedeGuardar = Object.keys(todosErrores).length === 0

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault()
    setTocado(true)
    if (!puedeGuardar) return

    setGuardando(true)
    setErrorServidor("")
    try {
      await onGuardar(valores)
      // Los permisos solo aplican a cuentas ya creadas (tienen id).
      if (usuario) {
        await onGuardarPermisos([...permisos])
      }
      toast.success(
        editando ? "Usuario actualizado" : "Usuario creado correctamente"
      )
      onCambioAbierto(false)
    } catch (e) {
      // El backend es la autoridad: su mensaje se muestra tal cual.
      setErrorServidor(
        e instanceof Error ? e.message : "No se pudo guardar el usuario"
      )
    } finally {
      setGuardando(false)
    }
  }

  function alternarPermiso(clave: string, activo: boolean) {
    setPermisos((prev) => {
      const siguiente = new Set(prev)
      if (activo) siguiente.add(clave)
      else siguiente.delete(clave)
      return siguiente
    })
  }

  return (
    <Dialog open={abierto} onOpenChange={onCambioAbierto}>
      {/* DialogContent es p-0: el cuerpo aporta su propio px-5 para que los
          campos no toquen el borde. max-h + filas fijas dejan el cuerpo como
          única zona scrolleable y el pie siempre visible. */}
      <DialogContent className="gap-0 overflow-hidden sm:max-w-lg max-h-[92vh] grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader className="pb-4">
          <DialogTitle>
            {editando ? "Editar usuario" : "Nuevo usuario"}
          </DialogTitle>
          <DialogDescription>
            {editando
              ? "Modifica los datos, el rol y el estado de acceso de la cuenta."
              : "Crea una cuenta. El acceso a datos clínicos depende del rol asignado."}
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          onSubmit={manejarEnvio}
          noValidate
          className="grid min-h-0 min-w-0 gap-4.5 overflow-y-auto px-5 pb-5"
        >
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-nombre`} className="text-sm font-medium">
              Nombre completo
            </Label>
            <Input
              id={`${formId}-nombre`}
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value)
                setTocado(true)
              }}
              placeholder="Ej. María Torres"
              className={errores.nombre ? "border-destructive" : ""}
              aria-invalid={!!errores.nombre}
            />
            {errores.nombre && (
              <p className="text-xs text-destructive">{errores.nombre}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-username`} className="text-sm font-medium">
              Nombre de usuario
            </Label>
            <Input
              id={`${formId}-username`}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setTocado(true)
              }}
              placeholder="Ej. mtorres"
              disabled={editando}
              autoComplete="off"
              className={errores.username ? "border-destructive" : ""}
              aria-invalid={!!errores.username}
            />
            {errores.username ? (
              <p className="text-xs text-destructive">{errores.username}</p>
            ) : (
              editando && (
                <p className="text-xs text-muted-foreground">
                  El nombre de usuario no se puede modificar.
                </p>
              )
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-correo`} className="text-sm font-medium">
              Correo institucional
            </Label>
            <Input
              id={`${formId}-correo`}
              type="email"
              value={correo}
              onChange={(e) => {
                setCorreo(e.target.value)
                setTocado(true)
              }}
              placeholder="nombre@ejemplo.com"
              className={errores.correo ? "border-destructive" : ""}
              aria-invalid={!!errores.correo}
            />
            {errores.correo && (
              <p className="text-xs text-destructive">{errores.correo}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-password`} className="text-sm font-medium">
              Contraseña
            </Label>
            <Input
              id={`${formId}-password`}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setTocado(true)
              }}
              placeholder={
                editando ? "No se modifica aquí" : "Mínimo 8 caracteres"
              }
              disabled={editando}
              autoComplete="new-password"
              className={errores.password ? "border-destructive" : ""}
              aria-invalid={!!errores.password}
            />
            {errores.password && (
              <p className="text-xs text-destructive">{errores.password}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-rol`} className="text-sm font-medium">
              Rol
            </Label>
            <Select
              value={rol}
              onValueChange={(v) => {
                setRol(v)
                setTocado(true)
              }}
            >
              <SelectTrigger id={`${formId}-rol`}>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLES_DISPONIBLES.map((r) => (
                  <SelectItem key={r.valor} value={r.valor}>
                    {r.texto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errores.rol && (
              <p className="text-xs text-destructive">{errores.rol}</p>
            )}
          </div>

          {/* HU-04: permisos. Solo tiene sentido sobre una cuenta existente. */}
          {editando && usuario && (
            <PermisosEditor
              catalogo={catalogoPermisos}
              seleccionados={permisos}
              onCambio={alternarPermiso}
              esAdmin={rol === ROLES.ADMIN}
            />
          )}

          {errorServidor && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {errorServidor}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onCambioAbierto(false)}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={!puedeGuardar || guardando}
          >
            {guardando
              ? "Guardando..."
              : editando
                ? "Guardar cambios"
                : "Crear usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Diálogo simple para reasignar la contraseña de un usuario. */
export function DialogResetPassword({
  abierto,
  onCambioAbierto,
  usuario,
  onConfirmar,
}: {
  abierto: boolean
  onCambioAbierto: (abierto: boolean) => void
  usuario: Usuario | null
  onConfirmar: (usuarioId: number, password: string) => Promise<void>
}) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (abierto) {
      setPassword("")
      setError("")
    }
  }, [abierto])

  async function confirmar() {
    if (password.length < 8) {
      setError("Mínimo 8 caracteres")
      return
    }
    if (!usuario) return
    setGuardando(true)
    try {
      await onConfirmar(usuario.id, password)
      toast.success(`Contraseña de ${usuario.username} actualizada`)
      onCambioAbierto(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={onCambioAbierto}>
      <DialogContent className="gap-0 overflow-hidden sm:max-w-sm grid-rows-[auto_auto]">
        <DialogHeader className="pb-4">
          <DialogTitle>Reasignar contraseña</DialogTitle>
          <DialogDescription>
            {usuario
              ? `Se reemplaza la contraseña actual de ${usuario.username}.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5 px-5 pb-5">
          <Label htmlFor="nueva-password" className="text-sm font-medium">
            Nueva contraseña
          </Label>
          <Input
            id="nueva-password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError("")
            }}
            autoComplete="new-password"
            className={error ? "border-destructive" : ""}
            aria-invalid={!!error}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onCambioAbierto(false)}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={confirmar} disabled={guardando}>
            {guardando ? "Actualizando..." : "Actualizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}