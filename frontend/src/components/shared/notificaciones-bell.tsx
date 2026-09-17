import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, BellRing, CheckCheck, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PATHS } from "@/routes/paths"
import { cn } from "@/lib/utils"
import {
  cerrarNotificacion,
  listarNotificacionesPendientes,
  marcarNotificacionLeida,
  type Notificacion,
} from "@/services/notificaciones.service"

const INTERVALO_ACTUALIZACION = 60000

/**
 * Campana de notificaciones persistentes de casos prioritarios.
 * Las notificaciones viven en BD: no expiran y solo se cierran
 * manualmente o al validar la atención.
 */
export function NotificacionesBell() {
  const navigate = useNavigate()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [abierto, setAbierto] = useState(false)

  const cargar = useCallback(async () => {
    try {
      setNotificaciones(await listarNotificacionesPendientes())
    } catch {
      // Sin notificaciones si el backend no responde; no interrumpe la vista.
    }
  }, [])

  useEffect(() => {
    cargar()
    const t = setInterval(cargar, INTERVALO_ACTUALIZACION)
    return () => clearInterval(t)
  }, [cargar])

  const noLeidas = notificaciones.filter((n) => !n.leida).length

  const irAlCaso = async (n: Notificacion) => {
    if (!n.leida) {
      try {
        await marcarNotificacionLeida(n.id)
        setNotificaciones((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x)))
      } catch {
        // Navega igual aunque falle el marcado.
      }
    }
    setAbierto(false)
    navigate(PATHS.RESULTS, { state: { atencionId: n.atencion_medica_id } })
  }

  const descartar = async (e: React.MouseEvent, n: Notificacion) => {
    e.stopPropagation()
    try {
      await cerrarNotificacion(n.id)
      setNotificaciones((prev) => prev.filter((x) => x.id !== n.id))
    } catch {
      // Se reintentará en el siguiente ciclo de actualización.
    }
  }

  return (
    <DropdownMenu open={abierto} onOpenChange={setAbierto}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          title={noLeidas > 0 ? `${noLeidas} notificación(es) pendiente(s)` : "Sin notificaciones"}
          className="text-muted-foreground/60 hover:text-foreground hover:bg-accent/60 transition-all duration-200 rounded-lg relative"
        >
          {noLeidas > 0 ? <BellRing className="size-4" strokeWidth={2} /> : <Bell className="size-4" strokeWidth={2} />}
          {notificaciones.length > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-background">
              {noLeidas > 9 ? "9+" : noLeidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20">
          <p className="text-sm font-bold text-foreground/90">Notificaciones</p>
          <span className="text-[11px] font-medium text-muted-foreground/70">
            {notificaciones.length === 0
              ? "Sin pendientes"
              : `${noLeidas} sin leer`}
          </span>
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {notificaciones.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-8 text-center">
              <CheckCheck className="size-8 text-emerald-500/60 mb-2" />
              <p className="text-sm font-bold text-foreground/80">Sin notificaciones pendientes</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Los casos con prioridad Alta o Crítica aparecerán aquí.
              </p>
            </div>
          ) : (
            notificaciones.map((n) => (
              <div
                key={n.id}
                onClick={() => irAlCaso(n)}
                className={cn(
                  "group flex items-start gap-3 px-4 py-3 border-b border-border/30 last:border-0 cursor-pointer transition-colors hover:bg-accent/50",
                  !n.leida && "bg-primary/[0.04]"
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    n.prioridad === "Crítica" ? "bg-red-500" : "bg-orange-500"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[13px] leading-snug", n.leida ? "font-medium text-foreground/70" : "font-bold text-foreground/90")}>
                    {n.mensaje}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">
                    hace {formatDistanceToNow(new Date(n.created_at), { locale: es })}
                  </p>
                </div>
                <button
                  onClick={(e) => descartar(e, n)}
                  title="Descartar notificación"
                  className="shrink-0 rounded-md p-1 text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
