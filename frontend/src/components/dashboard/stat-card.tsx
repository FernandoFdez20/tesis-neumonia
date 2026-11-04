import type { LucideIcon } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatCardProps = {
  title: string
  value: string
  description: string
  icon: LucideIcon
  accent?: "blue" | "green" | "amber" | "red"
  compact?: boolean
}

const accentStyles = {
  blue: {
    icon: "bg-blue-500/8 text-blue-600 border border-blue-500/15 dark:bg-blue-950/35 dark:text-blue-400",
    value: "text-foreground/90",
    border: "border-l-blue-500/70",
    glow: "group-hover/card:shadow-blue-500/5",
  },
  green: {
    icon: "bg-emerald-500/8 text-emerald-600 border border-emerald-500/15 dark:bg-emerald-950/35 dark:text-emerald-400",
    value: "text-foreground/90",
    border: "border-l-emerald-500/70",
    glow: "group-hover/card:shadow-emerald-500/5",
  },
  amber: {
    icon: "bg-amber-500/8 text-amber-600 border border-amber-500/15 dark:bg-amber-950/35 dark:text-amber-400",
    value: "text-foreground/90",
    border: "border-l-amber-500/70",
    glow: "group-hover/card:shadow-amber-500/5",
  },
  red: {
    icon: "bg-red-500/8 text-red-600 border border-red-500/15 dark:bg-red-950/35 dark:text-red-400",
    value: "text-foreground/90",
    border: "border-l-red-500/70",
    glow: "group-hover/card:shadow-red-500/5",
  },
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent = "blue",
  compact = false,
}: StatCardProps) {
  const styles = accentStyles[accent]

  if (compact) {
    return (
      <Card size="sm" className="h-full data-[size=sm]:py-0">
        <CardContent className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "border-l-[3px] transition-all duration-300 hover:border-l-[4px] ease-out hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5",
        styles.border,
        styles.glow
      )}
      size="sm"
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
        <CardTitle className="text-xs font-bold text-muted-foreground/55 uppercase tracking-[0.12em] leading-none">
          {title}
        </CardTitle>
        <CardAction className="m-0 col-start-auto row-span-auto row-start-auto">
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-xl transition-all duration-300 group-hover/card:scale-110 group-hover/card:shadow-sm",
              styles.icon
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.8} />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="pb-5 pt-0 px-5">
        <p
          className={cn(
            "text-3xl font-extrabold tracking-tight tabular-nums leading-none",
            styles.value
          )}
        >
          {value}
        </p>
        <p className="mt-1.5 text-sm font-medium text-muted-foreground/75 leading-normal">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
