"use client"

import { AlertTriangle, BookOpenCheck, CalendarCheck, FileText, GraduationCap, LogOut, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { readAuthSession } from "@/lib/auth-session"

export type SekolahMenu = "sumber-rujukan" | "kegiatan" | "pelanggaran" | "laporan-akhir-tahun"

interface SekolahSidebarProps {
  activeMenu: SekolahMenu
  onMenuChange: (menu: SekolahMenu) => void
  onLogout: () => void
}

const navItems: { id: SekolahMenu; label: string; icon: typeof AlertTriangle }[] = [
  { id: "sumber-rujukan", label: "Sumber Dukungan", icon: BookOpenCheck },
  { id: "kegiatan", label: "Kegiatan", icon: CalendarCheck },
  { id: "pelanggaran", label: "Pelanggaran", icon: AlertTriangle },
  { id: "laporan-akhir-tahun", label: "Laporan Akhir Tahun", icon: FileText },
]

export function SekolahSidebar({ activeMenu, onMenuChange, onLogout }: SekolahSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [namaSekolah, setNamaSekolah] = useState<string | null>(null)

  useEffect(() => {
    const session = readAuthSession()
    if (session?.namaSekolah) setNamaSekolah(session.namaSekolah)
  }, [])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-emerald-800">
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">Admin Sekolah BSAN</p>
          {namaSekolah && (
            <p className="text-emerald-200 text-xs leading-tight truncate">{namaSekolah}</p>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeMenu === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onMenuChange(item.id)
                setMobileOpen(false)
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-emerald-100 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-emerald-800">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-100 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Keluar
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 bg-emerald-900 sticky top-0 h-screen overflow-y-auto">
        <SidebarContent />
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-emerald-900 flex items-center justify-between px-4 py-3 shadow">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-white" />
          <p className="text-white font-semibold text-sm">Admin Sekolah BSAN</p>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white p-1"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="w-64 bg-emerald-900 flex flex-col pt-16">
            <SidebarContent />
          </div>
          <button type="button" className="flex-1 bg-black/40 cursor-default" aria-hidden onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  )
}
