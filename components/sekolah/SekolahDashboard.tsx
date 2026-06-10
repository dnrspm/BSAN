"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SekolahSidebar, type SekolahMenu } from "@/components/sekolah/SekolahSidebar"
import { SekolahHeader } from "@/components/sekolah/SekolahHeader"
import { SekolahSumberRujukanView } from "@/components/sekolah/SekolahSumberRujukanView"
import { KegiatanView } from "@/components/dashboard/KegiatanView"
import { PelanggaranView } from "@/components/sekolah/PelanggaranView"
import { LaporanAkhirTahunView } from "@/components/sekolah/LaporanAkhirTahunView"
import { clearAuthAndRedirectToLogin } from "@/lib/logout"

type AuthPayload = {
  username?: string
  role?: string
  wilayah?: string
  namaSekolah?: string
}

interface SekolahDashboardProps {
  searchParams?: { get: (key: string) => string | null }
}

export function SekolahDashboard({ searchParams }: SekolahDashboardProps) {
  const router = useRouter()
  const [menu, setMenu] = useState<SekolahMenu>("sumber-rujukan")
  const [wilayah, setWilayah] = useState("Aceh - Banda Aceh")
  const [displayName, setDisplayName] = useState("Admin Sekolah")

  useEffect(() => {
    const menuParam = searchParams?.get("menu") as SekolahMenu | null
    if (menuParam && ["sumber-rujukan", "kegiatan", "pelanggaran", "laporan-akhir-tahun"].includes(menuParam)) {
      setMenu(menuParam)
    }
  }, [searchParams])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth")
      if (!raw) return
      const parsed = JSON.parse(raw) as AuthPayload
      if (parsed.wilayah) setWilayah(parsed.wilayah)
      if (parsed.namaSekolah) setDisplayName(parsed.namaSekolah)
      else if (parsed.username) setDisplayName(parsed.username.replace(/\./g, " "))
    } catch {
      /* ignore */
    }
  }, [])

  const logout = () => clearAuthAndRedirectToLogin(router)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <SekolahSidebar activeMenu={menu} onMenuChange={setMenu} onLogout={logout} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="md:hidden h-14" aria-hidden="true" />
        <SekolahHeader userName={displayName} onLogout={logout} />
        <main className="flex-1 px-4 md:px-6 py-6">
          {menu === "sumber-rujukan" && <SekolahSumberRujukanView wilayah={wilayah} />}
          {menu === "kegiatan" && <KegiatanView />}
          {menu === "pelanggaran" && <PelanggaranView readOnly />}
          {menu === "laporan-akhir-tahun" && <LaporanAkhirTahunView />}
        </main>
      </div>
    </div>
  )
}
