import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { mes: "Ene", atenciones: 65 },
  { mes: "Feb", atenciones: 59 },
  { mes: "Mar", atenciones: 80 },
  { mes: "Abr", atenciones: 81 },
  { mes: "May", atenciones: 56 },
  { mes: "Jun", atenciones: 55 },
  { mes: "Jul", atenciones: 40 },
  { mes: "Ago", atenciones: 60 },
  { mes: "Sep", atenciones: 72 },
  { mes: "Oct", atenciones: 90 },
  { mes: "Nov", atenciones: 110 },
  { mes: "Dic", atenciones: 130 },
]

const chartConfig = {
  atenciones: {
    label: "Atenciones",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function PacientesChart() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Atenciones por Mes</CardTitle>
        <CardDescription>Resumen anual de pacientes atendidos</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
            <XAxis
              dataKey="mes"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={12}
            />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--muted)/0.4)" }}
              content={<ChartTooltipContent />}
            />
            <Bar
              dataKey="atenciones"
              fill="var(--color-atenciones)"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
