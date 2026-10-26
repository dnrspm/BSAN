"use client"

import { ArrowDown, ArrowUp, ChevronDown, Lightbulb, Minus, ShieldCheck, Heart, Smartphone, HandHeart } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Subindikator {
  nama: string
  /** Skor 0–10, atau persentase 0–100 bila `satuan` bernilai "persen". */
  skor: number
  satuan?: "persen"
}

export interface Indikator {
  id: string
  nama: string
  icon: typeof ShieldCheck
  skor: number
  subindikator: Subindikator[]
  rekomendasi: string[]
}

// Data contoh: skor diberikan oleh Admin Pusat (0–10, satu angka desimal).
export const INDIKATOR: Indikator[] = [
  {
    id: "spiritual",
    nama: "Pemenuhan Kebutuhan Spiritual",
    icon: HandHeart,
    skor: 8.2,
    subindikator: [
      { nama: "Ketersediaan sarana ibadah yang layak", skor: 8.5 },
      { nama: "Persentase murid mengikuti kegiatan keagamaan", skor: 80, satuan: "persen" },
      { nama: "Ketersediaan pendidik agama sesuai keyakinan murid", skor: 8.1 },
    ],
    rekomendasi: [
      "Pertahankan kegiatan keagamaan rutin dan dokumentasikan pelaksanaannya.",
      "Lengkapi layanan pendidik agama bagi murid dengan keyakinan minoritas.",
    ],
  },
  {
    id: "fisik",
    nama: "Pelindungan Fisik",
    icon: ShieldCheck,
    skor: 6.4,
    subindikator: [
      { nama: "Persentase Murid Melaksanakan CKG", skor: 58, satuan: "persen" },
      { nama: "Kelayakan sarana dan prasarana sekolah", skor: 7.0 },
      { nama: "Ketersediaan protokol keselamatan dan tanggap darurat", skor: 6.4 },
    ],
    rekomendasi: [
      "Tingkatkan cakupan Cek Kesehatan Gratis (CKG) hingga seluruh murid terlayani.",
      "Lakukan simulasi tanggap darurat minimal dua kali dalam setahun.",
    ],
  },
  {
    id: "psikologis",
    nama: "Kesejahteraan Psikologis dan Keamanan Sosiokultural",
    icon: Heart,
    skor: 4.7,
    subindikator: [
      { nama: "Ketersediaan layanan konseling", skor: 5.5 },
      { nama: "Penanganan kasus perundungan dan kekerasan", skor: 4.0 },
      { nama: "Iklim sekolah yang inklusif terhadap keberagaman", skor: 4.6 },
    ],
    rekomendasi: [
      "Aktifkan layanan konseling dengan jadwal yang jelas dan mudah diakses murid.",
      "Perkuat Tim Pencegahan dan Penanganan Kekerasan (TPPK) serta alur pelaporannya.",
      "Adakan program penguatan toleransi dan keberagaman bagi murid dan pendidik.",
    ],
  },
  {
    id: "digital",
    nama: "Keadaban dan Keamanan Digital",
    icon: Smartphone,
    skor: 7.3,
    subindikator: [
      { nama: "Literasi digital murid dan pendidik", skor: 7.5 },
      { nama: "Kebijakan penggunaan gawai di sekolah", skor: 8.0 },
      { nama: "Penanganan kasus perundungan siber", skor: 6.4 },
    ],
    rekomendasi: [
      "Sosialisasikan kanal pelaporan perundungan siber kepada seluruh murid.",
      "Sertakan materi etika bermedia digital dalam kegiatan pembelajaran.",
    ],
  },
]

// Data tahun-tahun sebelumnya: skor indikator + skor tiap subindikator (urut sama dengan INDIKATOR).
export const TAHUN_AKTIF = 2026
export const SKOR_TAHUN_LAIN: Record<number, { skor: number; sub: number[] }[]> = {
  2025: [
    { skor: 7.6, sub: [8.0, 7.5, 7.3] },
    { skor: 5.2, sub: [4.5, 6.0, 5.1] },
    { skor: 4.1, sub: [4.8, 3.5, 4.0] },
    { skor: 6.5, sub: [6.8, 7.2, 5.5] },
  ],
  2024: [
    { skor: 7.0, sub: [7.5, 6.8, 6.7] },
    { skor: 4.6, sub: [3.9, 5.5, 4.4] },
    { skor: 3.8, sub: [4.2, 3.1, 4.1] },
    { skor: 5.4, sub: [5.5, 6.5, 4.2] },
  ],
}
export const TAHUN_OPSI = [TAHUN_AKTIF, ...Object.keys(SKOR_TAHUN_LAIN).map(Number).sort((a, b) => b - a)]

export function indikatorTahun(tahun: number): Indikator[] {
  const data = SKOR_TAHUN_LAIN[tahun]
  if (!data) return INDIKATOR
  return INDIKATOR.map((i, idx) => ({
    ...i,
    skor: data[idx].skor,
    subindikator: i.subindikator.map((sub, j) => ({ ...sub, skor: sub.satuan === "persen" ? Math.round(data[idx].sub[j] * 10) : data[idx].sub[j] })),
  }))
}

export type Tingkat = { label: string; text: string; marker: string; chip: string; dot: string }

export function tingkat(skor: number): Tingkat {
  if (skor >= 8) return { label: "Tinggi", text: "text-emerald-700", marker: "border-emerald-600", dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200" }
  if (skor >= 6) return { label: "Sedang", text: "text-yellow-700", marker: "border-yellow-500", dot: "bg-yellow-400", chip: "bg-yellow-50 text-yellow-800 ring-yellow-300" }
  return { label: "Rendah", text: "text-red-600", marker: "border-red-500", dot: "bg-red-500", chip: "bg-red-50 text-red-600 ring-red-200" }
}

export const fmt = (n: number) => n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function TingkatChip({ skor }: { skor: number }) {
  const t = tingkat(skor)
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", t.chip)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", t.dot)} />
      {t.label}
    </span>
  )
}

export function Selisih({ skor, sebelumnya, tahunSebelumnya }: { skor: number; sebelumnya?: number; tahunSebelumnya: number }) {
  if (sebelumnya === undefined) return null
  const d = Math.round((skor - sebelumnya) * 10) / 10
  const Icon = d > 0 ? ArrowUp : d < 0 ? ArrowDown : Minus
  const warna = d > 0 ? "text-emerald-700" : d < 0 ? "text-red-700" : "text-gray-500"
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", warna)}>
      <Icon className="w-3 h-3" />
      {d === 0 ? "Sama" : fmt(Math.abs(d))}
      <span className="text-gray-400">dari {tahunSebelumnya}</span>
    </span>
  )
}

export const rata2 = (list: Indikator[]) => Math.round((list.reduce((s, i) => s + i.skor, 0) / list.length) * 10) / 10


export function TahunSelect({ tahun, onChange, className }: { tahun: number; onChange: (t: number) => void; className?: string }) {
  return (
    <label className={cn("flex items-center gap-2 text-sm text-gray-600", className)}>
      Tahun
      <div className="relative">
        <select
          value={tahun}
          onChange={(e) => onChange(Number(e.target.value))}
          className="appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-9 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {TAHUN_OPSI.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>
    </label>
  )
}

/** Data lengkap satu tahun beserta pembanding tahun sebelumnya (jika ada). */
export function useDataTahun(tahun: number) {
  const data = indikatorTahun(tahun)
  const tahunSebelumnya = tahun - 1
  const dataSebelumnya = SKOR_TAHUN_LAIN[tahunSebelumnya] ? indikatorTahun(tahunSebelumnya) : null
  return {
    data,
    total: rata2(data),
    tahunSebelumnya,
    dataSebelumnya,
    totalSebelumnya: dataSebelumnya ? rata2(dataSebelumnya) : undefined,
  }
}

/** Teks nilai subindikator dan skor 0–10 yang dipakai untuk menentukan tingkat/warna. */
export function nilaiSubindikator(s: Subindikator) {
  return s.satuan === "persen"
    ? { teks: `${Math.round(s.skor)}%`, skor10: s.skor / 10 }
    : { teks: fmt(s.skor), skor10: s.skor }
}
