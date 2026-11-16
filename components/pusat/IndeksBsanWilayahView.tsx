"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { IndeksBsanView, type DetailInstansi } from "@/components/sekolah/IndeksBsanView"
import { IndeksBsanPusatView } from "@/components/pusat/IndeksBsanPusatView"
import { IndeksBsanDaerahView } from "@/components/pusat/IndeksBsanDaerahView"
import { UnggahIndeksBsanView } from "@/components/pusat/UnggahIndeksBsanView"

type Tab = "sekolah" | "daerah"

const TABS: { id: Tab; label: string }[] = [
  { id: "sekolah", label: "Sekolah" },
  { id: "daerah", label: "Provinsi dan Kab/Kota" },
]

interface IndeksBsanWilayahViewProps {
  /** BPMP: batasi pada provinsi kewenangan; kosong = seluruh Indonesia (Admin Pusat, Internal, Nasional). */
  provinsi?: string
  /** Tampilkan tombol Unggah Data (hanya Admin Pusat). */
  bolehUnggah?: boolean
}

/**
 * Indeks BSAN untuk peran tanpa halaman indeks sendiri (Admin Pusat, Internal, Nasional, dan BPMP):
 * daftar skor sekolah dan daftar skor daerah (provinsi dan kab/kota), dengan detail skor tiap baris.
 */
export function IndeksBsanWilayahView({ provinsi, bolehUnggah = false }: IndeksBsanWilayahViewProps) {
  const [tab, setTab] = useState<Tab>("sekolah")
  const [detail, setDetail] = useState<DetailInstansi | null>(null)
  const [unggah, setUnggah] = useState(false)

  const bukaDetail = (d: DetailInstansi) => {
    setDetail(d)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="space-y-6">
      {/* Daftar tetap dipasang (hanya disembunyikan) agar filter dan halamannya tidak hilang saat kembali dari detail. */}
      <div className={cn("space-y-6", (detail || unggah) && "hidden")}>
        <div className="flex items-end justify-between gap-4 border-b border-gray-200">
          <div role="tablist" className="flex gap-6">
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
          {bolehUnggah && (
            <button
              type="button"
              onClick={() => {
                setUnggah(true)
                window.scrollTo({ top: 0 })
              }}
              className="mb-2 flex h-9 shrink-0 items-center gap-1.5 rounded-[4px] border border-blue-600 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Upload className="h-4 w-4" /> Unggah Data
            </button>
          )}
        </div>

        {tab === "sekolah" ? (
          <IndeksBsanPusatView wilayahProvinsi={provinsi} hanyaSekolah judul="Indeks BSAN Sekolah" onLihatDetail={bukaDetail} />
        ) : (
          <IndeksBsanDaerahView provinsi={provinsi} sertakanProvinsi judul="Indeks BSAN Provinsi dan Kab/Kota" onLihatDetail={bukaDetail} />
        )}
      </div>

      {unggah && <UnggahIndeksBsanView onKembali={() => setUnggah(false)} />}

      {detail && !unggah && (
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
