"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { readAuthSession } from "@/lib/auth-session"
import { IndeksBsanView } from "@/components/sekolah/IndeksBsanView"
import { IndeksBsanPusatView } from "@/components/pusat/IndeksBsanPusatView"

type Tab = "dinas" | "sekolah"

const TABS: { id: Tab; label: string }[] = [
  { id: "dinas", label: "Indeks Dinas" },
  { id: "sekolah", label: "Sekolah di Wilayah" },
]

// Cadangan demo bila sesi belum menyimpan wilayah.
const WILAYAH_DEMO = { provinsi: "Aceh", kabKota: "Banda Aceh" }

/** Wilayah dinas dari sesi, berformat "Provinsi - Kab/Kota". Tanpa kab/kota berarti seluruh provinsi. */
function bacaWilayah(): { provinsi: string; kabKota?: string } {
  const [provinsi, kabKota] = (readAuthSession()?.wilayah ?? "").split(" - ").map((v) => v.trim())
  return provinsi ? { provinsi, kabKota: kabKota || undefined } : WILAYAH_DEMO
}

/**
 * Indeks BSAN untuk Admin Dinas: skor dinas sendiri (tampilan sama dengan sekolah) dan skor akhir
 * sekolah di wilayahnya (tabel seperti BPMP, dibatasi pada wilayah dinas).
 */
export function IndeksBsanDinasView() {
  const [tab, setTab] = useState<Tab>("dinas")
  const [wilayah, setWilayah] = useState<{ provinsi: string; kabKota?: string }>(WILAYAH_DEMO)

  useEffect(() => setWilayah(bacaWilayah()), [])

  return (
    <div className="space-y-6">
      <div role="tablist" className="flex gap-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px pb-3 text-sm font-medium border-b-2 transition-colors",
              tab === t.id ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dinas" ? (
        <IndeksBsanView judul="Indeks BSAN Dinas" />
      ) : (
        <IndeksBsanPusatView
          wilayahProvinsi={wilayah.provinsi}
          wilayahKabKota={wilayah.kabKota}
          hanyaSekolah
          judul="Indeks BSAN Sekolah di Wilayah"
        />
      )}
    </div>
  )
}
