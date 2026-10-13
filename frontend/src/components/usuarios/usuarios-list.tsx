import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { KeyRound, Pencil, Plus, Search, UserCheck, UserX } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth, ETIQUETA_ROL } from "@/hooks/use-auth"
import {
  actualizarUsuario,
  asignarPermisos,
  crearUsuario,
  listarPermisos,
  listarUsuarios,
  resetearPassword,
  type PermisoCatalogo,
  type Usuario,
} from "@/services/usuarios.service"
import {
  DialogResetPassword,
  DialogUsuario,
  type ValoresUsuario,
} from "@/components/usuarios/usuario-dialog"

const PAGE_SIZE = 6

/** Extrae el mensaje del backend para mostrarlo tal cual. */
function mensajeDeError(e: unknown): string {
  const detalle = (e as { response?: { data?: { detail?: string } } })?.response
    ?.data?.detail
  if (typeof detalle === "string") return detalle
  return e instanceof Error ? e.message : "Ocurrió un error inesperado"
}

function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "Nunca"
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return "Nunca"
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

/** Color del badge según el alcance real del rol. */
function varianteRol(rol: string): "default" | "secondary" | "outline" {
  if (rol === "Admin") return "default"
  if (rol === "Especialista") return "secondary"
  return "outline"
}

export function UsuariosList() {
  const queryClient = useQueryClient()
  const { usuario: actual } = useAuth()

  const [busqueda, setBusqueda] = useState("")
  const [busquedaDebounce, setBusquedaDebounce] = useState("")
  const [rolFiltro, setRolFiltro] = useState("todos")
  const [estadoFiltro, setEstadoFiltro] = useState("todos")
  const [pagina, setPagina] = useState(1)

  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [modo, setModo] = useState<"crear" | "editar">("crear")
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [resetAbierto, setResetAbierto] = useState(false)
  const [resetObjetivo, setResetObjetivo] = useState<Usuario | null>(null)

  // Debounce para no saturar al backend con cada tecla.
  useEffect(() => {
    const t = setTimeout(() => {
      setBusquedaDebounce(busqueda.trim())
      setPagina(1)
    }, 400)
    return () => clearTimeout(t)
  }, [busqueda])

  const params = {
    page: pagina,
    page_size: PAGE_SIZE,
    buscar: busquedaDebounce || undefined,
    rol: rolFiltro === "todos" ? undefined : rolFiltro,
    estado: estadoFiltro === "todos" ? undefined : estadoFiltro === "activos",
  }

  const { data, isPending, isError } = useQuery({
    queryKey: ["usuarios", params],
    queryFn: () => listarUsuarios(params),
  })

  function refrescar() {
    queryClient.invalidateQueries({ queryKey: ["usuarios"] })
  }

  const { data: catalogoPermisos = [] } = useQuery<PermisoCatalogo[]>({
    queryKey: ["usuarios", "permisos-catalogo"],
    queryFn: () => listarPermisos(),
    staleTime: 5 * 60 * 1000,
  })

  const mutationPermisos = useMutation({
    mutationFn: async ({ id, permisos }: { id: number; permisos: string[] }) => {
      await asignarPermisos(id, permisos)
    },
    onSuccess: refrescar,
  })

  const mutationGuardar = useMutation({
    mutationFn: async (valores: ValoresUsuario) => {
      if (modo === "crear") {
        await crearUsuario({
          username: valores.username.trim(),
          correo: valores.correo.trim(),
          password: valores.password,
          nombre_completo: valores.nombre.trim(),
          rol: valores.rol,
        })
      } else if (usuarioEditando) {
        await actualizarUsuario(usuarioEditando.id, {
          nombre_completo: valores.nombre.trim(),
          correo: valores.correo.trim(),
          rol: valores.rol,
        })
      }
      refrescar()
    },
  })

  const mutationEstado = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: boolean }) =>
      actualizarUsuario(id, { estado }),
    onSuccess: (_d, variables) => {
      refrescar()
      toast.success(
        variables.estado ? "Acceso reactivado" : "Acceso suspendido"
      )
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  })

  const mutationReset = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      await resetearPassword(id, password)
    },
    onSuccess: refrescar,
  })

  const totalPaginas = data?.total_pages ?? 1

  return (
    <div className="space-y-6">
      {/* Barra de herramientas */}
      <div className="flex flex-col gap-4 justify-between items-start sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, usuario o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto flex-wrap items-center">
          <Select
            value={rolFiltro}
            onValueChange={(v) => {
              setRolFiltro(v)
              setPagina(1)
            }}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los roles</SelectItem>
              <SelectItem value="Admin">Administrador</SelectItem>
              <SelectItem value="Enfermera">Enfermería</SelectItem>
              <SelectItem value="Especialista">Especialista</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={estadoFiltro}
            onValueChange={(v) => {
              setEstadoFiltro(v)
              setPagina(1)
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activos">Solo activos</SelectItem>
              <SelectItem value="inactivos">Solo inactivos</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => {
              setModo("crear")
              setUsuarioEditando(null)
              setDialogoAbierto(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo usuario
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isPending ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="p-10 text-center">
                <p className="font-medium text-foreground">
                  No se pudieron cargar los usuarios
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Revisa que el backend esté activo.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={refrescar}
                >
                  Reintentar
                </Button>
              </div>
            ) : !data?.items.length ? (
              <div className="p-10 text-center">
                <p className="font-medium text-foreground">
                  Sin resultados
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {busquedaDebounce
                    ? "Ningún usuario coincide con la búsqueda."
                    : "Todavía no hay usuarios registrados."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="hidden md:table-cell">Correo</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Último acceso
                    </TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((u) => {
                    const esYo = u.id === actual?.id
                    return (
                      <TableRow key={u.id} className={!u.estado ? "opacity-60" : ""}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {u.nombre_completo}
                              {esYo && (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                  (tú)
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              @{u.username}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {u.correo}
                        </TableCell>
                        <TableCell>
                          <Badge variant={varianteRol(u.rol)}>
                            {ETIQUETA_ROL[u.rol] ?? u.rol}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                          {formatearFecha(u.ultimo_login)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={u.estado ? "default" : "destructive"}
                            className="gap-1"
                          >
                            {u.estado ? (
                              <>
                                <UserCheck className="h-3 w-3" />
                                Activo
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3" />
                                Inactivo
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              onClick={() => {
                                setModo("editar")
                                setUsuarioEditando(u)
                                setDialogoAbierto(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Reasignar contraseña"
                              onClick={() => {
                                setResetObjetivo(u)
                                setResetAbierto(true)
                              }}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={esYo}
                              title={
                                esYo
                                  ? "No puedes desactivar tu propia cuenta"
                                  : u.estado
                                    ? "Suspender acceso"
                                    : "Reactivar acceso"
                              }
                              onClick={() =>
                                mutationEstado.mutate({
                                  id: u.id,
                                  estado: !u.estado,
                                })
                              }
                            >
                              {u.estado ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Paginación */}
      {data && data.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {data.total}{" "}
            {data.total === 1 ? "usuario" : "usuarios"} en total
          </p>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                Página {pagina} de {totalPaginas}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}

      <DialogUsuario
        abierto={dialogoAbierto}
        onCambioAbierto={setDialogoAbierto}
        modo={modo}
        usuario={usuarioEditando}
        onGuardar={(v) => mutationGuardar.mutateAsync(v)}
        catalogoPermisos={catalogoPermisos}
        onGuardarPermisos={(permisos) => {
          if (!usuarioEditando) return Promise.resolve()
          return mutationPermisos.mutateAsync({
            id: usuarioEditando.id,
            permisos,
          })
        }}
      />

      <DialogResetPassword
        abierto={resetAbierto}
        onCambioAbierto={setResetAbierto}
        usuario={resetObjetivo}
        onConfirmar={(id, password) =>
          mutationReset.mutateAsync({ id, password })
        }
      />
    </div>
  )
}