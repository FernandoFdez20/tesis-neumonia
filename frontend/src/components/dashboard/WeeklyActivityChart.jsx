import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const barRadius = [6, 6, 0, 0]

export function WeeklyActivityChart({ data }) {
  return (
    <section className="rounded-xl bg-white px-6 py-6 shadow-sm ring-1 ring-slate-200/70">
      <h3 className="mb-4 text-2xl font-semibold tracking-tight text-slate-800">Actividad Semanal</h3>

      {/* Recharts maneja el responsive del grafico dentro de este contenedor fijo */}
      <div className="h-95 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={12} margin={{ top: 18, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="dia"
              tick={{ fill: '#64748b', fontSize: 14, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 24]}
              ticks={[0, 6, 12, 18, 24]}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              contentStyle={{
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
              }}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: '14px', fontSize: '14px', color: '#334155' }}
              formatter={(value) => <span style={{ color: '#334155', fontWeight: 600 }}>{value}</span>}
            />

            <Bar dataKey="detectados" name="Casos Detectados" radius={barRadius}>
              {data.map((entry) => (
                <Cell key={`d-${entry.dia}`} fill="#0e7490" />
              ))}
            </Bar>
            <Bar dataKey="validados" name="Validados" radius={barRadius}>
              {data.map((entry) => (
                <Cell key={`v-${entry.dia}`} fill="#0f766e" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
