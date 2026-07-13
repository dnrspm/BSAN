"use client"

import { useState, useEffect } from "react"
import { ArrowLeftRight } from "lucide-react"

const STORAGE_KEY = "useIdealSchoolMode"

export function getIdealMode(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

export function FormModeToggle({ onChange }: { onChange?: (isIdeal: boolean) => void }) {
  const [isIdeal, setIsIdeal] = useState(false)

  useEffect(() => {
    setIsIdeal(getIdealMode())
  }, [])

  const toggle = () => {
    const next = !isIdeal
    setIsIdeal(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {}
    onChange?.(next)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border text-xs font-semibold transition-all ${
          isIdeal
            ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
            : "bg-gray-800 text-white border-gray-700 hover:bg-gray-900"
        }`}
        title={isIdeal ? "Mode Ideal (DB Sekolah)" : "Mode MVP (Free Text)"}
      >
        <ArrowLeftRight className="w-3.5 h-3.5" />
        <span>{isIdeal ? "Ideal" : "MVP"}</span>
      </button>
      <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {isIdeal ? "Mode Ideal: DB Sekolah + NPSN" : "Mode MVP: Input Free Text"}
        <div className="absolute top-full right-3 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
      </div>
    </div>
  )
}
