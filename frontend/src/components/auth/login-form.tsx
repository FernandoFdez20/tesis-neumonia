import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader className="flex flex-col items-center gap-1 text-center">
					<CardTitle className="text-2xl font-bold my-3">
						Iniciar sesión
					</CardTitle>
					<CardDescription className="text-sm text-balance text-muted-foreground">
						Inicia sesión con tu cuenta para continuar.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="usuario">Usuario</FieldLabel>
								<Input
									id="usuario"
									type="text"
									placeholder="Nombre de usuario"
									required
								/>
							</Field>
							<Field>
								<div className="flex items-center">
									<FieldLabel htmlFor="password">Contraseña</FieldLabel>
									<a
										href="#"
										className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
									>
										¿Olvidaste tu contraseña?
									</a>
								</div>
								<Input id="password" type="password" required />
							</Field>
							<Field>
								<Button variant="default" size="lg" type="submit">
									Iniciar sesión
								</Button>
								<FieldDescription className="text-center">
									¿No tienes una cuenta? <a href="#">Regístrate</a>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
