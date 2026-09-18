"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { GraduationCap, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navLinks = [
  { label: "Beranda", href: "/" },
  { label: "Kelompok Kerja", href: "/kelompok-kerja" },
  { label: "Sumber Dukungan", href: "/sumber-dukungan" },
  { label: "Kegiatan", href: "/kegiatan" },
]

export function LandingNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNavClick = (link: { href: string }) => {
    setMobileOpen(false)
    router.push(link.href)
  }

  return (
    <header className="fixed top-0 w-full z-50 bg-white shadow-sm border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900">BSAN</span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button key={link.href} onClick={() => handleNavClick(link)}
              className={cn(
                "px-3 py-2 rounded-md text-sm transition-colors",
                pathname === link.href
                  ? "text-blue-700 font-semibold"
                  : "text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900"
              )}>{link.label}</button>
          ))}
          <Button onClick={() => router.push("/login")} className="ml-4 bg-blue-600 hover:bg-blue-800 text-white px-5" size="sm">Masuk</Button>
        </nav>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-slate-700">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <button key={link.href} onClick={() => handleNavClick(link)} className="text-left px-3 py-2.5 text-sm text-slate-700 rounded-md transition-colors hover:bg-slate-100 hover:text-slate-900">{link.label}</button>
            ))}
            <div className="pt-2"><Button onClick={() => router.push("/login")} className="w-full bg-blue-600 hover:bg-blue-800 text-white">Masuk ke Sistem</Button></div>
          </div>
        </div>
      )}
    </header>
  )
}