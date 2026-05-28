import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  // Natively check if dark mode is active by reading the HTML class
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  const theme = isDark ? "dark" : "light"

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast rounded-xl border shadow-lg backdrop-blur-md",
          success:
            "border-emerald-500/30 bg-emerald-50 text-emerald-950 shadow-emerald-950/5 dark:border-emerald-400/25 dark:bg-emerald-950/40 dark:text-emerald-50 [&_[data-icon]]:text-emerald-600 dark:[&_[data-icon]]:text-emerald-300",
          warning:
            "border-amber-500/35 bg-amber-50 text-amber-950 shadow-amber-950/5 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-50 [&_[data-icon]]:text-amber-600 dark:[&_[data-icon]]:text-amber-300",
          error:
            "border-red-500/35 bg-red-50 text-red-950 shadow-red-950/5 dark:border-red-400/30 dark:bg-red-950/40 dark:text-red-50 [&_[data-icon]]:text-red-600 dark:[&_[data-icon]]:text-red-300",
          info:
            "border-sky-500/30 bg-sky-50 text-sky-950 shadow-sky-950/5 dark:border-sky-400/25 dark:bg-sky-950/40 dark:text-sky-50 [&_[data-icon]]:text-sky-600 dark:[&_[data-icon]]:text-sky-300",
          title: "font-bold",
          description: "text-current/75",
          closeButton:
            "border-current/15 bg-background/70 text-current hover:bg-background/90",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
