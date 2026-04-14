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
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
      <h3 className="mb-5 text-4xl font-extrabold tracking-tight text-slate-800">Actividad Semanal</h3>

      {/* Recharts maneja el responsive del grafico dentro de este contenedor fijo */}
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={12} margin={{ top: 18, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#d9e2ec" />
            <XAxis
              dataKey="dia"
              tick={{ fill: '#64748b', fontSize: 16, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 15, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 24]}
              ticks={[0, 6, 12, 18, 24]}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #dbe3ee',
                boxShadow: '0 8px 26px rgba(15, 23, 42, 0.10)',
              }}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: '14px', fontSize: '18px', color: '#0f172a' }}
              formatter={(value) => <span style={{ color: '#0f172a', fontWeight: 700 }}>{value}</span>}
            />

            <Bar dataKey="detectados" name="Casos Detectados" radius={barRadius}>
              {data.map((entry) => (
                <Cell key={`d-${entry.dia}`} fill="#1fa6e6" />
              ))}
            </Bar>
            <Bar dataKey="validados" name="Validados" radius={barRadius}>
              {data.map((entry) => (
                <Cell key={`v-${entry.dia}`} fill="#19b882" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
