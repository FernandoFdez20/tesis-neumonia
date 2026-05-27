import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-5", className)} {...props}>
      {/* Encabezado del formulario */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Iniciar sesión
        </h2>
        <p className="text-sm text-muted-foreground">
          Ingresa tus credenciales institucionales para acceder al sistema.
        </p>
      </div>

      <Card className="shadow-none border-border/80">
        <CardHeader className="pb-2 pt-5 px-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            Acceso clínico
          </p>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <form className="space-y-4">
            {/* Campo usuario */}
            <div className="space-y-1.5">
              <Label htmlFor="usuario" className="text-sm font-medium text-foreground">
                Usuario
              </Label>
              <Input
                id="usuario"
                type="text"
                placeholder="Nombre de usuario"
                autoComplete="username"
                required
                className="h-10"
              />
            </div>

            {/* Campo contraseña */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contraseña
                </Label>
                <a
                  href="#"
                  className="text-xs text-primary hover:underline underline-offset-4 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-10"
              />
            </div>

            {/* Botón de acceso */}
            <div className="pt-1">
              <Button type="submit" size="lg" className="w-full h-10 font-semibold">
                Ingresar al sistema
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Pie del formulario */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5">
        <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
        <p className="text-xs text-amber-700 leading-relaxed">
          Herramienta de apoyo presuntivo.{" "}
          <span className="font-semibold">Validación médica siempre requerida.</span>
        </p>
      </div>
    </div>
  )
}
