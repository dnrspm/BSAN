"use client"
import { LayoutDashboard, Users, LogOut, GraduationCap, BookOpenCheck, AlertTriangle, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { clearAuthAndRedirectToLogin } from "@/lib/logout"
import { readAuthSession } from "@/lib/auth-session"

export type BpmpMenu = "pokja" | "sumber-dukungan" | "input-kasus"

interface SidebarBpmpProps {
  activeMenu: BpmpMenu
  onMenuChange: (menu: BpmpMenu) => void
}

const navItems = [
  { id: "pokja" as BpmpMenu, label: "Kelompok Kerja", icon: Users },
  { id: "sumber-dukungan" as BpmpMenu, label: "Sumber Dukungan", icon: BookOpenCheck },
  { id: "input-kasus" as BpmpMenu, label: "Pelanggaran", icon: AlertTriangle },
]

export function SidebarBpmp({ activeMenu, onMenuChange }: SidebarBpmpProps) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const logout = () => clearAuthAndRedirectToLogin(router)

  const namaBPMP = readAuthSession()?.namaBPMP?.replace(/^BPMP\s+/i, "")

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-violet-900">
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">BPMP</p>
          {namaBPMP && (
            <p className="text-violet-200 text-xs leading-tight truncate">{namaBPMP}</p>
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
              onClick={() => {
                onMenuChange(item.id)
                setMobileOpen(false)
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-violet-100 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-violet-900">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-violet-100 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Keluar
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 bg-violet-950 sticky top-0 h-screen overflow-y-auto">
        <SidebarContent />
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-violet-950 flex items-center justify-between px-4 py-3 shadow">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-white" />
          <p className="text-white font-semibold text-sm">BPMP</p>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white p-1"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="w-64 bg-violet-950 flex flex-col pt-16">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  )
}
