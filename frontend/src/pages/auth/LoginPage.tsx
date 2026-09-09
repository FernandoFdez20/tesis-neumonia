import { LoginForm } from "@/components/auth/login-form"
import { Activity } from "lucide-react"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-4" />
          </div>
          <span className="text-xl font-bold text-foreground">Plataforma Web</span>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
