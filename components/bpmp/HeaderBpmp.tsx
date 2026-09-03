"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, LogOut, RotateCcw, ShieldCheck } from "lucide-react"
import { NotificationBell } from "@/components/ui/NotificationBell"
import { clearAuthAndRedirectToLogin } from "@/lib/logout"
import { readAuthSession } from "@/lib/auth-session"

export function HeaderBpmp() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const logout = () => clearAuthAndRedirectToLogin(router)

  const reset = () => {
    localStorage.removeItem("rujukanList")
    localStorage.removeItem("pelanggaranList")
    setOpen(false)
    window.location.reload()
  }

  const namaBPMP = readAuthSession()?.namaBPMP ?? "BPMP"

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end shadow-sm">
      <div className="flex items-center gap-3">
        <NotificationBell />

        <div className="relative" ref={wrapRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <ShieldCheck className="w-5 h-5 text-slate-700 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{namaBPMP}</span>
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
                onClick={() => { setOpen(false); logout() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
