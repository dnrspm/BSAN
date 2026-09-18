"use client"
import { LayoutDashboard, Users, LogOut, GraduationCap, Menu, X, BookOpenCheck, CalendarDays, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { clearAuthAndRedirectToLogin } from "@/lib/logout"
import { readAuthSession } from "@/lib/auth-session"

type ActiveMenu = "dashboard" | "data-pokja" | "sumber-rujukan" | "kegiatan" | "pelanggaran"

interface SidebarProps {
  activeMenu: ActiveMenu
  onMenuChange: (menu: ActiveMenu) => void
}

const navItems = [
  {
    id: "dashboard" as ActiveMenu,
    label: "Beranda",
    icon: LayoutDashboard,
  },
  {
    id: "data-pokja" as ActiveMenu,
    label: "Kelompok Kerja",
    icon: Users,
  },
  {
    id: "sumber-rujukan" as ActiveMenu,
    label: "Sumber Dukungan",
    icon: BookOpenCheck,
  },
  {
    id: "kegiatan" as ActiveMenu,
    label: "Kegiatan",
    icon: CalendarDays,
  },
  {
    id: "pelanggaran" as ActiveMenu,
    label: "Pelanggaran",
    icon: AlertTriangle,
  },
]

export function Sidebar({ activeMenu, onMenuChange }: SidebarProps) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [namaDinas, setNamaDinas] = useState<string | null>(null)
  const logout = () => clearAuthAndRedirectToLogin(router)

  useEffect(() => {
    const session = readAuthSession()
    if (session?.namaDinas) {
      const stripped = session.namaDinas.replace(/^dinas\s+pendidikan\s+/i, "").trim()
      setNamaDinas(stripped || session.namaDinas)
    }
  }, [])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-blue-700">
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">Dinas Pendidikan</p>
          {namaDinas && (
            <p className="text-blue-200 text-xs leading-tight truncate">{namaDinas}</p>
          )}
        </div>
      </div>

      {/* Nav */}
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
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-blue-700">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Keluar
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 bg-blue-800 sticky top-0 h-screen overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-blue-800 flex items-center justify-between px-4 py-3 shadow">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-white" />
          <p className="text-white font-semibold text-sm">Dinas Pendidikan</p>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white p-1"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="w-64 bg-blue-800 flex flex-col pt-16">
            <SidebarContent />
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  )
}
