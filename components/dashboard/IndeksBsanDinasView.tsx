"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { bacaWilayahDinas, WILAYAH_DEMO, type WilayahDinas } from "@/lib/wilayah-dinas"
import { pilihHalaman } from "@/components/dashboard/SubMenuIndeks"
import { IndeksBsanView, type DetailInstansi } from "@/components/sekolah/IndeksBsanView"
import { IndeksBsanDaerahView } from "@/components/pusat/IndeksBsanDaerahView"
import { IndeksBsanPusatView } from "@/components/pusat/IndeksBsanPusatView"

const LABEL: Record<string, string> = {
  dinas: "Indeks Dinas",
  kabkota: "Kab/Kota di Wilayah",
  sekolah: "Sekolah di Wilayah",
}

/**
 * Indeks BSAN untuk Admin Dinas: skor dinas sendiri (tampilan sama dengan sekolah), skor kab/kota di
 * wilayahnya (hanya Dinas Provinsi), dan skor akhir sekolah di wilayahnya (tabel seperti BPMP).
 * Layar dipilih lewat submenu sidebar dan dibaca dari URL (`?halaman=dinas|kabkota|sekolah`).
 */
export function IndeksBsanDinasView() {
  const halaman = useSearchParams().get("halaman")
  const [detail, setDetail] = useState<DetailInstansi | null>(null)
  const [wilayah, setWilayah] = useState<WilayahDinas>(WILAYAH_DEMO)

  useEffect(() => setWilayah(bacaWilayahDinas()), [])

  // Skor kab/kota hanya untuk Dinas Provinsi.
  const layar = pilihHalaman(halaman, wilayah.kabKota ? (["dinas", "sekolah"] as const) : (["dinas", "kabkota", "sekolah"] as const))

  // Berpindah layar lewat sidebar atau tombol Back menutup detail yang sedang terbuka.
  useEffect(() => {
    setDetail(null)
    if (halaman) window.scrollTo({ top: 0 })
  }, [halaman])

  const bukaDetail = (d: DetailInstansi) => {
    setDetail(d)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="space-y-6">
      {/* Daftar tetap dipasang (hanya disembunyikan) agar filter dan halamannya tidak hilang saat kembali dari detail. */}
      <div className={cn("space-y-6", detail && "hidden")}>
        {layar === "dinas" ? (
          <IndeksBsanView judul="Indeks BSAN Dinas" />
        ) : layar === "kabkota" ? (
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
            { label: LABEL[layar], onClick: () => setDetail(null) },
            { label: detail.nama },
          ]}
        />
      )}
    </div>
  )
}
