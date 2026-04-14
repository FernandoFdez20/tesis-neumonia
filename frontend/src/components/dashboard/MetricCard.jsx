export function MetricCard({ icon, title, value, iconBg, iconColor, iconStroke = 2 }) {
  const Icon = icon

  return (
    <article className="rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex items-center gap-4">
        <div className={`grid h-12 w-12 place-content-center rounded-lg ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} strokeWidth={iconStroke} />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-4xl font-bold leading-none text-slate-900">{value}</p>
        </div>
      </div>
    </article>
  )
}
