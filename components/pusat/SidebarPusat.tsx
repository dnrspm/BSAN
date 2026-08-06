"use client"
import { LayoutDashboard, Users, LogOut, GraduationCap, BookOpenCheck, CalendarDays, Menu, X, FileText, AlertTriangle, UserCog } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { clearAuthAndRedirectToLogin } from "@/lib/logout"

export type PusatMenu = "dashboard" | "pokja" | "sumber-rujukan" | "kegiatan" | "laporan-akhir-tahun" | "pelanggaran" | "pengguna"

interface SidebarPusatProps {
  activeMenu: PusatMenu
  onMenuChange: (menu: PusatMenu) => void
}

const navItems = [
  { id: "dashboard" as PusatMenu, label: "Beranda", icon: LayoutDashboard },
  { id: "pokja" as PusatMenu, label: "Kelompok Kerja", icon: Users },
  { id: "sumber-rujukan" as PusatMenu, label: "Sumber Dukungan", icon: BookOpenCheck },
  { id: "k" as PusatMenu, label: " Kegiatan", icon: CalendarDays },
  { id: "pelanggaran" as PusatMenu, label: "Pelanggaran", icon: AlertTriangle },
  { id: "laporan-akhir-tahun" as PusatMenu, label: "Laporan Akhir Tahun", icon: FileText },
  { id: "pengguna" as PusatMenu, label: "Akses Pengguna", icon: UserCog },
]

export function SidebarPusat({ activeMenu, onMenuChange }: SidebarPusatProps) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const logout = () => clearAuthAndRedirectToLogin(router)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">Admin Pusat</p>
          <p className="text-slate-200 text-xs leading-tight truncate">Puspeka</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeMenu === item.id
          return (
            <button
              key={item.id}
              onClick={() => {
                onMenuChange(item.id)
                setMobileOpen(false)
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-slate-100 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-100 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Keluar
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 bg-slate-900 sticky top-0 h-screen overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 flex items-center justify-between px-4 py-3 shadow">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-white" />
          <p className="text-white font-semibold text-sm">Admin Pusat</p>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white p-1"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="w-64 bg-slate-900 flex flex-col pt-16">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  )
}
