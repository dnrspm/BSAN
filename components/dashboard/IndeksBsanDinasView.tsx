"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { readAuthSession } from "@/lib/auth-session"
import { IndeksBsanView, type DetailInstansi } from "@/components/sekolah/IndeksBsanView"
import { IndeksBsanDaerahView } from "@/components/pusat/IndeksBsanDaerahView"
import { IndeksBsanPusatView } from "@/components/pusat/IndeksBsanPusatView"

type Tab = "dinas" | "kabkota" | "sekolah"

const TABS: { id: Tab; label: string }[] = [
  { id: "dinas", label: "Indeks Dinas" },
  { id: "kabkota", label: "Kab/Kota di Wilayah" },
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
 * Indeks BSAN untuk Admin Dinas: skor dinas sendiri (tampilan sama dengan sekolah), skor kab/kota di
 * wilayahnya (hanya Dinas Provinsi), dan skor akhir sekolah di wilayahnya (tabel seperti BPMP).
 */
export function IndeksBsanDinasView() {
  const [tab, setTab] = useState<Tab>("dinas")
  const [detail, setDetail] = useState<DetailInstansi | null>(null)
  const [wilayah, setWilayah] = useState<{ provinsi: string; kabKota?: string }>(WILAYAH_DEMO)

  useEffect(() => setWilayah(bacaWilayah()), [])

  const bukaDetail = (d: DetailInstansi) => {
    setDetail(d)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="space-y-6">
      {/* Daftar tetap dipasang (hanya disembunyikan) agar filter dan halamannya tidak hilang saat kembali dari detail. */}
      <div className={cn("space-y-6", detail && "hidden")}>
        <div role="tablist" className="flex gap-6 border-b border-gray-200">
          {TABS.filter((t) => t.id !== "kabkota" || !wilayah.kabKota).map((t) => (
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
        ) : tab === "kabkota" ? (
          <IndeksBsanDaerahView provinsi={wilayah.provinsi} judul="Indeks BSAN Kabupaten/Kota" onLihatDetail={bukaDetail} />
        ) : (
          <IndeksBsanPusatView
            wilayahProvinsi={wilayah.provinsi}
            wilayahKabKota={wilayah.kabKota}
            hanyaSekolah
            judul="Indeks BSAN Sekolah di Wilayah"
            onLihatDetail={bukaDetail}
          />
        )}
      </div>

      {detail && (
        <IndeksBsanView
          judul="Detail Indeks BSAN"
          instansi={detail}
          breadcrumb={[
            { label: "Indeks BSAN", onClick: () => setDetail(null) },
            { label: TABS.find((t) => t.id === tab)?.label ?? "", onClick: () => setDetail(null) },
            { label: detail.nama },
          ]}
        />
      )}
    </div>
  )
}
