import { cn } from "@/lib/utils"

export interface BadgeProps {
  children: React.ReactNode
  variant?:
    | "success"
    | "warning"
    | "critical"
    | "informational"
    | "neutral"
    | "expressive-success"
    | "expressive-warning"
    | "expressive-critical"
    | "expressive-informational"
    | "expressive-neutral"
  size?: "sm" | "md"
  className?: string
}

const variants: Record<string, string> = {
  success: "bg-emerald-300 text-emerald-950",
  warning: "bg-amber-200 text-amber-950",
  critical: "bg-rose-100 text-rose-950",
  informational: "bg-sky-200 text-sky-950",
  neutral: "bg-[#efefef] text-[#2f3031]",
  "expressive-success": "bg-green-600 text-white",
  "expressive-warning": "bg-yellow-500 text-white",
  "expressive-critical": "bg-red-600 text-white",
  "expressive-informational": "bg-blue-600 text-white",
  "expressive-neutral": "bg-gray-500 text-white",
}

const sizes: Record<string, string> = {
  sm: "text-[13px] px-2.5 py-0.5",
  md: "text-sm px-3 py-1",
}

export function Badge({ children, variant = "neutral", size = "sm", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full font-semibold",
        sizes[size],
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
