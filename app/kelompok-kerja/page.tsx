"use client"

import { useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { DataPublikContent } from "@/components/landing/DataPublikContent"

function DataPublikContentFallback() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] pt-16">
      <div className="bg-[#C8F1F7]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="pb-16 pt-16">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Kelompok Kerja BSAN</h1>
            <p className="mt-3 text-slate-700 text-base max-w-xl">
              Lihat informasi pembentukan kelompok kerja BSAN di seluruh Indonesia
            </p>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-[4px] border border-slate-100 shadow-sm p-8 flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Memuat data...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function KelompokKerjaPage() {
  const router = useRouter()

  useEffect(() => {
    const auth = localStorage.getItem("auth")
    if (auth) {
      try {
        const parsed = JSON.parse(auth)
        if (parsed.role === "pusat" || parsed.role === "dinas" || parsed.role === "sekolah") {
          router.replace("/dashboard")
          return
        }
      } catch {}
    }
  }, [router])

  return (
    <main>
      <LandingNavbar />
      <Suspense fallback={<DataPublikContentFallback />}>
        <DataPublikContent 
          heroTitle="Kelompok Kerja BSAN" 
          heroSubtitle="Lihat informasi pembentukan kelompok kerja BSAN di seluruh Indonesia"
          hideHeroPrefix={true}
        />
      </Suspense>
      <LandingFooter />
    </main>
  )
}