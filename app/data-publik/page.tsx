"use client"

import { Suspense } from "react"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { DataPublikContent } from "@/components/landing/DataPublikContent"

function DataPublikContentFallback() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] pt-16">
      <div className="bg-[#C8F1F7]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="pb-16 pt-16">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Data Publik BSAN</h1>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-[4px] border border-[#D9DBDD] shadow-sm p-8 flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Memuat data...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DataPublikPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <LandingNavbar />
      <Suspense fallback={<DataPublikContentFallback />}>
        <DataPublikContent showBackButton={true} />
      </Suspense>
      <LandingFooter />
    </div>
  )
}