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
}

const accentStyles = {
  blue: {
    icon: "bg-blue-500/8 text-blue-600 border border-blue-500/15 dark:bg-blue-950/35 dark:text-blue-400",
    value: "text-foreground/90",
    border: "border-l-blue-500/80",
  },
  green: {
    icon: "bg-emerald-500/8 text-emerald-600 border border-emerald-500/15 dark:bg-emerald-950/35 dark:text-emerald-400",
    value: "text-foreground/90",
    border: "border-l-emerald-500/80",
  },
  amber: {
    icon: "bg-amber-500/8 text-amber-600 border border-amber-500/15 dark:bg-amber-950/35 dark:text-amber-400",
    value: "text-foreground/90",
    border: "border-l-amber-500/80",
  },
  red: {
    icon: "bg-red-500/8 text-red-600 border border-red-500/15 dark:bg-red-950/35 dark:text-red-400",
    value: "text-foreground/90",
    border: "border-l-red-500/80",
  },
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent = "blue",
}: StatCardProps) {
  const styles = accentStyles[accent]

  return (
    <Card className={cn("border-l-[3px] transition-all duration-200 hover:border-l-[4px] ease-in-out hover:bg-card/90", styles.border)} size="sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">
          {title}
        </CardTitle>
        <CardAction className="m-0 col-start-auto row-span-auto row-start-auto">
          <div className={cn("flex size-8 items-center justify-center rounded-xl transition-all duration-300 group-hover/card:scale-105", styles.icon)}>
            <Icon className="size-4" strokeWidth={2} />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="pb-4 pt-0 px-4">
        <p className={cn("text-2xl font-extrabold tracking-tight tabular-nums", styles.value)}>{value}</p>
        <p className="mt-1 text-[11px] font-medium text-muted-foreground/80 leading-normal">{description}</p>
      </CardContent>
    </Card>
  )
}
