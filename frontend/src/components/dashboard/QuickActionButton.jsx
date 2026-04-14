export function QuickActionButton({ icon, label, colorClass }) {
  const Icon = icon

  return (
    <button
      type="button"
      className={`flex h-14 items-center justify-center gap-2 rounded-2xl px-5 text-lg font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 ${colorClass}`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  )
}
