"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, LogOut, RotateCcw, UserCircle2 } from "lucide-react"
import { NotificationBell } from "@/components/ui/NotificationBell"

interface SekolahHeaderProps {
  userName: string
  onLogout: () => void
}

export function SekolahHeader({ userName, onLogout }: SekolahHeaderProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const reset = () => {
    localStorage.removeItem("rujukanList")
    localStorage.removeItem("reportList")
    localStorage.removeItem("laporanAkhirTahunList")
    sessionStorage.removeItem("kegiatanList")
    setOpen(false)
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-end shadow-sm">
      <div className="flex items-center gap-3">
        <NotificationBell />

        <div className="relative" ref={wrapRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] hover:bg-gray-100 transition-colors"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <UserCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[200px] truncate">{userName}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 hidden sm:block transition ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50"
            >
              <div className="px-3 py-1.5">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Demo</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={reset}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50"
              >
                <RotateCcw className="w-4 h-4" />
                Reset ke Default
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); onLogout() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-[#F9F9F9]"
              >
                <LogOut className="w-4 h-4 text-gray-500" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
