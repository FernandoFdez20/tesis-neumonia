import { LogOut, Settings, User } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { PATHS } from "@/routes/paths"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserNav() {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem("token")
    localStorage.removeItem("usuario")
    navigate(PATHS.LOGIN, { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative size-9 rounded-full p-0 hover:bg-accent/60 transition-all duration-200"
        >
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 text-[11px] font-extrabold text-primary select-none tracking-wider shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/25">
            DF
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-base font-semibold text-foreground/90">Dr. Fernández</p>
            <p className="text-sm text-muted-foreground/65">Médico residente</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer gap-2.5 py-2">
            <User className="size-4 text-muted-foreground/60" />
            <span>Mi perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer gap-2.5 py-2">
            <Settings className="size-4 text-muted-foreground/60" />
            <span>Configuración</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer gap-2.5 py-2"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
