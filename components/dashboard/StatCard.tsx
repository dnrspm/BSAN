"use client"

// Accepts both old (color) and new (borderColor/textColor/Icon) prop shapes
// so stale browser chunks don't crash while new chunks load.
export function StatCard({
  label,
  count,
  // new props
  borderColor = "border-l-gray-300",
  textColor,
  Icon,
  // legacy prop
  color,
}: {
  label: string
  count: number
  borderColor?: string
  textColor?: string
  Icon?: React.ElementType
  color?: string
}) {
  const resolvedTextColor = textColor ?? color ?? "text-gray-900"

  return (
    <div className={`bg-white rounded-[4px] border border-gray-100 border-l-4 ${borderColor} px-4 py-3.5 shadow-sm flex items-center justify-between gap-3`}>
      <div>
        <p suppressHydrationWarning className={`text-2xl font-bold leading-none ${resolvedTextColor}`}>
          {count}
        </p>
        <p className="text-xs text-gray-500 mt-1 leading-tight">{label}</p>
      </div>
      {Icon && <Icon className="w-5 h-5 text-gray-200 flex-shrink-0" />}
    </div>
  )
}
