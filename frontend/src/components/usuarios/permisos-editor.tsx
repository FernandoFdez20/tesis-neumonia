import { useMemo } from "react"

import { Label } from "@/components/ui/label"
import { PERMISOS } from "@/hooks/use-auth"
import type { PermisoCatalogo } from "@/services/usuarios.service"

/**
 * HU-04 — Editor de permisos por usuario.
 *
 * Las casillas parten de lo que otorga el rol; las que difieren se marcan
 * como desviación (extra si se conceden, restringido si se quitan). Al
 * guardar se envía la lista absoluta y el backend calcula la diferencia.
 */
export function PermisosEditor({
  catalogo,
  seleccionados,
  onCambio,
  esAdmin,
}: {
  catalogo: PermisoCatalogo[]
  seleccionados: Set<string>
  onCambio: (clave: string, activo: boolean) => void
  esAdmin: boolean
}) {
  const porGrupo = useMemo(() => {
    const mapa = new Map<string, PermisoCatalogo[]>()
    catalogo.forEach((p) => {
      const lista = mapa.get(p.grupo) ?? []
      lista.push(p)
      mapa.set(p.grupo, lista)
    })
    return [...mapa.entries()]
  }, [catalogo])

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <Label>Permisos</Label>
        <span className="text-xs text-muted-foreground">
          {seleccionados.size} de {catalogo.length} activos
        </span>
      </div>

      {esAdmin && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          El rol Administrador nunca accede a datos clínicos, así que esos
          permisos no se pueden activar en esta cuenta.
        </p>
      )}

      {/* Sin max-height propio: el scroll lo aporta el cuerpo del diálogo,
          para no anidar dos barras de desplazamiento. */}
      <div className="space-y-3 rounded-lg border border-border/60 p-3">
        {porGrupo.map(([grupo, permisos]) => (
          <div key={grupo}>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {grupo}
            </p>
            <div className="space-y-1.5">
              {permisos.map((p) => {
                const activo = seleccionados.has(p.clave)
                const esClinico =
                  p.clave !== PERMISOS.USUARIOS_GESTIONAR && esAdmin
                const bloqueado = esClinico
                // Desviación respecto del rol: no viene de la base.
                const desviado = activo !== p.base

                return (
                  <label
                    key={p.clave}
                    className={`flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors ${
                      bloqueado
                        ? "opacity-45"
                        : "cursor-pointer hover:bg-accent/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={activo}
                      disabled={bloqueado}
                      onChange={(e) => onCambio(p.clave, e.target.checked)}
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                    />
                    <span className="flex-1 text-sm leading-tight">
                      <span className="text-foreground/90">{p.etiqueta}</span>
                      {desviado && activo && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                          añadido
                        </span>
                      )}
                      {desviado && !activo && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                          restringido
                        </span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}