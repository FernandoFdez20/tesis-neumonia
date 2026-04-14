export function MetricCard({ icon, title, value, iconBg, iconColor, iconStroke = 2 }) {
  const Icon = icon

  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`grid h-14 w-14 place-content-center rounded-full ${iconBg}`}>
          <Icon className={`h-7 w-7 ${iconColor}`} strokeWidth={iconStroke} />
        </div>

        <div>
          <p className="text-xl font-semibold text-slate-500">{title}</p>
          <p className="text-5xl font-extrabold leading-none text-slate-900">{value}</p>
        </div>
      </div>
    </article>
  )
}
