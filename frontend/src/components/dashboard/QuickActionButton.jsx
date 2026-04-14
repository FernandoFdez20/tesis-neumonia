export function QuickActionButton({ icon, label, colorClass }) {
  const Icon = icon

  return (
    <button
      type="button"
      className={`flex h-14 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-sm transition-colors ${colorClass}`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  )
}
