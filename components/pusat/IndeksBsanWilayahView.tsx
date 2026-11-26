"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { pilihHalaman } from "@/components/dashboard/SubMenuIndeks"
import { IndeksBsanView, type DetailInstansi } from "@/components/sekolah/IndeksBsanView"
import { IndeksBsanPusatView } from "@/components/pusat/IndeksBsanPusatView"
import { IndeksBsanDaerahView } from "@/components/pusat/IndeksBsanDaerahView"
import { UnggahDataPusatView } from "@/components/pusat/UnggahDataPusatView"

interface IndeksBsanWilayahViewProps {
  /** BPMP: batasi pada provinsi kewenangan; kosong = seluruh Indonesia (Admin Pusat, Internal, Nasional). */
  provinsi?: string
  /** Izinkan layar Metadata & Unggah Data (hanya Admin Pusat). */
  bolehUnggah?: boolean
}

/**
 * Indeks BSAN untuk peran tanpa halaman indeks sendiri (Admin Pusat, Internal, Nasional, dan BPMP):
 * daftar skor sekolah, daftar skor provinsi dan kab/kota, dan (Admin Pusat) Unggah Data.
 * Layar dipilih lewat submenu sidebar dan dibaca dari URL (`?halaman=sekolah|daerah|unggah`).
 */
export function IndeksBsanWilayahView({ provinsi, bolehUnggah = false }: IndeksBsanWilayahViewProps) {
  const halaman = useSearchParams().get("halaman")
  const layar = pilihHalaman(halaman, bolehUnggah ? (["sekolah", "daerah", "unggah"] as const) : (["sekolah", "daerah"] as const))
  const [detail, setDetail] = useState<DetailInstansi | null>(null)

  // Berpindah layar lewat sidebar atau tombol Back menutup detail yang sedang terbuka.
  useEffect(() => {
    setDetail(null)
    if (halaman) window.scrollTo({ top: 0 })
  }, [halaman])

  const bukaDetail = (d: DetailInstansi) => {
    setDetail(d)
    window.scrollTo({ top: 0 })
  }

  const unggah = layar === "unggah"

  return (
    <div className="space-y-6">
      {/* Daftar tetap dipasang (hanya disembunyikan) agar filter dan halamannya tidak hilang saat kembali dari detail. */}
      <div className={cn("space-y-6", (detail || unggah) && "hidden")}>
        {layar === "daerah" ? (
          <IndeksBsanDaerahView provinsi={provinsi} sertakanProvinsi judul="Indeks BSAN Provinsi dan Kab/Kota" onLihatDetail={bukaDetail} />
        ) : (
          <IndeksBsanPusatView wilayahProvinsi={provinsi} hanyaSekolah judul="Indeks BSAN Sekolah" onLihatDetail={bukaDetail} />
        )}
      </div>

      {unggah && <UnggahDataPusatView />}

      {detail && !unggah && (
        <IndeksBsanView
          judul="Detail Indeks BSAN"
          instansi={detail}
          breadcrumb={[
            { label: layar === "daerah" ? "Provinsi dan Kab/Kota" : "Sekolah", onClick: () => setDetail(null) },
            { label: detail.nama },
          ]}
        />
      )}
    </div>
  )
}
