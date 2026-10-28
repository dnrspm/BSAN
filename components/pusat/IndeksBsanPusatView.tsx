"use client"

import { useMemo, useState } from "react"
import { ArrowUp, ChevronDown, Download, Info, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { KAB_KOTA_BY_PROVINSI } from "@/data/kabKotaData"
import { SELURUH_INDONESIA, WilayahFilter, type WilayahPilihan } from "@/components/filters/WilayahFilter"
import { JENJANG_FIELDS } from "@/components/pusat/LaporanAkhirTahunPusatView"
import { TablePagination } from "@/components/ui/table-pagination"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TAHUN_AKTIF, TahunSelect, TingkatChip, fmt, tingkat } from "@/components/sekolah/indeks-bsan/shared"

type Jenjang = string
type Kategori = "Tinggi" | "Sedang" | "Rendah"
type KolomUrut = "nama" | "npsn" | "jenjang" | "kabKota" | "kategori" | "skor"

interface SekolahIndeks {
  id: number
  nama: string
  npsn: string
  jenjang: Jenjang
  provinsi: string
  kabKota: string
  /** Skor 0–10 pada tahun terpilih; null bila sekolah belum mengikuti evaluasi. */
  skor: number | null
}

// Jenjang mengikuti formulir evaluasi BSAN; "Dinas" ikut karena dinas juga memiliki skor BSAN.
const JENJANG_LIST: Jenjang[] = JENJANG_FIELDS.map((f) => f.label)
const JENJANG_SEKOLAH = JENJANG_FIELDS.filter((f) => f.key !== "dinas").map((f) => f.label)
const AWALAN_NAMA: Record<string, string> = { PAUD: "TK Negeri", SNT: "Sekolah Terintegrasi", "Non Formal": "PKBM" }
// Pasangan provinsi dan kabupaten/kota untuk data contoh.
const WILAYAH_CONTOH: { provinsi: string; kabKota: string }[] = [
  { provinsi: "Aceh", kabKota: "Banda Aceh" },
  { provinsi: "Aceh", kabKota: "Bireuen" },
  { provinsi: "Sumatera Utara", kabKota: "Medan" },
  { provinsi: "Jawa Barat", kabKota: "Bandung" },
  { provinsi: "Jawa Barat", kabKota: "Bogor" },
  { provinsi: "Jawa Timur", kabKota: "Surabaya" },
  { provinsi: "Jawa Timur", kabKota: "Malang" },
  { provinsi: "DI Yogyakarta", kabKota: "Sleman" },
  { provinsi: "Bali", kabKota: "Denpasar" },
  { provinsi: "Sulawesi Selatan", kabKota: "Makassar" },
  { provinsi: "Kalimantan Barat", kabKota: "Pontianak" },
  { provinsi: "Nusa Tenggara Timur", kabKota: "Kupang" },
]
const TOTAL_SEKOLAH = 560
// Jumlah sekolah yang sudah mengikuti evaluasi per tahun (data contoh).
const SUDAH_MENGIKUTI: Record<number, number> = { 2026: 235, 2025: 180, 2024: 120 }

// Data contoh deterministik: skor sekolah berasal dari Admin Pusat (0–10, satu desimal).
// `provinsiTerbatas` (BPMP) membatasi data ke satu provinsi; `kabKotaTerbatas` (Dinas) ke satu kab/kota.
// `hanyaSekolah` menyingkirkan baris dinas dari daftar.
function buatData(tahun: number, provinsiTerbatas?: string, kabKotaTerbatas?: string, hanyaSekolah = false): SekolahIndeks[] {
  const daftarWilayah =
    provinsiTerbatas === undefined
      ? WILAYAH_CONTOH
      : kabKotaTerbatas
        ? [{ provinsi: provinsiTerbatas, kabKota: kabKotaTerbatas }]
        : (KAB_KOTA_BY_PROVINSI[provinsiTerbatas] ?? []).map((kabKota) => ({ provinsi: provinsiTerbatas, kabKota }))
  if (daftarWilayah.length === 0) return []

  const total = provinsiTerbatas === undefined ? TOTAL_SEKOLAH : kabKotaTerbatas ? 80 : daftarWilayah.length * 12
  const batas = Math.round(((SUDAH_MENGIKUTI[tahun] ?? 0) / TOTAL_SEKOLAH) * total)
  const geser = 0.4 * (TAHUN_AKTIF - tahun)
  const jumlahDinas = hanyaSekolah ? 0 : daftarWilayah.length
  return Array.from({ length: total }, (_, i) => {
    // Satu dinas per kabupaten/kota ditaruh di akhir daftar; sisanya satuan pendidikan.
    const indeksDinas = i - (total - jumlahDinas)
    const dinas = indeksDinas >= 0
    const jenjang = dinas ? "Dinas" : JENJANG_SEKOLAH[(i * 5 + Math.floor(i / 3)) % JENJANG_SEKOLAH.length]
    const { provinsi, kabKota } = dinas ? daftarWilayah[indeksDinas] : daftarWilayah[(i * 7 + Math.floor(i / 5)) % daftarWilayah.length]
    const mengikuti = (i * 7919) % total < batas
    const dasar = 4 + ((i * 37 + 11) % 59) / 10
    return {
      id: i + 1,
      nama: dinas ? `Dinas Pendidikan ${kabKota}` : `${AWALAN_NAMA[jenjang] ?? `${jenjang} Negeri`} ${(i % 12) + 1} ${kabKota}`,
      npsn: dinas ? "-" : String(10100000 + i * 71),
      jenjang,
      provinsi,
      kabKota,
      skor: mengikuti ? Math.max(0, Math.round((dasar - geser) * 10) / 10) : null,
    }
  })
}

const persen = (sudah: number, total: number) => (total ? `${Math.round((sudah / total) * 100)}%` : "0%")

const rata2 = (nilai: number[]) => (nilai.length ? Math.round((nilai.reduce((a, b) => a + b, 0) / nilai.length) * 10) / 10 : null)

const KATEGORI_SKOR = [
  { label: "Tinggi", rentang: "skor 8,0–10", arti: "lingkungan satuan pendidikan sudah aman, nyaman, dan inklusif; pertahankan dan bagikan praktik baiknya." },
  { label: "Sedang", rentang: "skor 6,0–7,9", arti: "sebagian indikator sudah baik, namun masih ada yang perlu diperbaiki." },
  { label: "Rendah", rentang: "skor di bawah 6,0", arti: "perlu perhatian dan pendampingan segera pada indikator yang masih lemah." },
]

/** Pembagi contoh yang stabil per wilayah dan jenjang (hanya untuk demo). */
function totalDemo(kunci: string, jenjang: string) {
  let h = 0
  for (const c of kunci) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return jenjang === "Dinas" ? 1 : 8 + (h % 33)
}

function kategoriDari(skor: number): Kategori {
  return tingkat(skor).label as Kategori
}

/** Select dengan panah buatan sendiri, agar panah tidak menempel di tepi kanan. */
function FilterSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="w-full h-10 appearance-none pl-3 pr-9 text-sm border border-gray-300 rounded-[4px] bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    </div>
  )
}

interface IndeksBsanPusatViewProps {
  /** BPMP: batasi data dan pilihan wilayah pada kab/kota di provinsi ini. */
  wilayahProvinsi?: string
  /** Dinas: batasi data pada satu kab/kota (dipakai bersama `wilayahProvinsi`). */
  wilayahKabKota?: string
  /** Hanya tampilkan satuan pendidikan, tanpa baris dinas. */
  hanyaSekolah?: boolean
  judul?: string
}

/**
 * Tampilan Indeks BSAN seluruh instansi. Untuk Admin Pusat tanpa pembatasan; untuk BPMP dan Dinas
 * data dan pilihan wilayah dibatasi pada wilayah kewenangannya.
 */
export function IndeksBsanPusatView({ wilayahProvinsi, wilayahKabKota, hanyaSekolah = false, judul = "Indeks BSAN" }: IndeksBsanPusatViewProps = {}) {
  const terbatas = wilayahProvinsi !== undefined
  const kabKotaTetap = terbatas && !!wilayahKabKota
  const jenjangList = hanyaSekolah ? JENJANG_SEKOLAH : JENJANG_LIST
  const sebutan = hanyaSekolah ? "sekolah" : "instansi"
  const [tahun, setTahun] = useState(TAHUN_AKTIF)
  const [cari, setCari] = useState("")
  const [jenjang, setJenjang] = useState<Jenjang | "semua">("semua")
  const [wilayah, setWilayah] = useState<WilayahPilihan>(terbatas ? { provinsi: wilayahProvinsi, kabKota: wilayahKabKota ?? null } : SELURUH_INDONESIA)
  const [kategori, setKategori] = useState<Kategori | "belum" | "semua">("semua")
  const [urut, setUrut] = useState<{ kolom: KolomUrut; arah: "asc" | "desc" } | null>(null)
  const [halaman, setHalaman] = useState(1)
  const [perHalaman, setPerHalaman] = useState(10)

  const data = useMemo(() => buatData(tahun, wilayahProvinsi, wilayahKabKota, hanyaSekolah), [tahun, wilayahProvinsi, wilayahKabKota, hanyaSekolah])

  // Filter wilayah berlaku untuk tabel ringkasan maupun daftar skor.
  const dataWilayah = useMemo(
    () => data.filter((s) => (!wilayah.provinsi || s.provinsi === wilayah.provinsi) && (!wilayah.kabKota || s.kabKota === wilayah.kabKota)),
    [data, wilayah]
  )

  const ringkasan = useMemo(() => {
    const data = dataWilayah
    const sudah = data.filter((s) => s.skor !== null)
    const perJenjang = jenjangList.map((j) => {
      const sekolah = data.filter((s) => s.jenjang === j)
      const ikut = sekolah.filter((s) => s.skor !== null)
      const r = rata2(ikut.map((s) => s.skor as number))
      // Demo: jenjang tanpa data di wilayah ini tetap diberi pembagi agar tidak tampil 0 / 0.
      const total = sekolah.length || totalDemo(`${wilayah.provinsi}|${wilayah.kabKota}|${j}`, j)
      return { jenjang: j, rerata: r, sudah: ikut.length, total }
    })
    return {
      rerata: rata2(sudah.map((s) => s.skor as number)),
      sudah: sudah.length,
      total: perJenjang.reduce((a, j) => a + j.total, 0),
      perJenjang,
    }
  }, [dataWilayah, jenjangList, wilayah])

  const terfilter = useMemo(() => {
    const q = cari.trim().toLowerCase()
    const hasil = dataWilayah.filter((s) => {
      if (q && !s.nama.toLowerCase().includes(q) && !s.npsn.includes(q)) return false
      if (jenjang !== "semua" && s.jenjang !== jenjang) return false
      if (kategori === "belum" && s.skor !== null) return false
      if (kategori !== "semua" && kategori !== "belum" && (s.skor === null || kategoriDari(s.skor) !== kategori)) return false
      return true
    })
    if (!urut) return hasil
    const { kolom, arah } = urut
    const kali = arah === "asc" ? 1 : -1
    return [...hasil].sort((a, b) => {
      if (kolom === "skor" || kolom === "kategori") {
        // Instansi yang belum mengikuti selalu di bagian bawah.
        if (a.skor === null) return b.skor === null ? 0 : 1
        if (b.skor === null) return -1
        return (a.skor - b.skor) * kali
      }
      return a[kolom].localeCompare(b[kolom], "id", { numeric: true }) * kali
    })
  }, [dataWilayah, cari, jenjang, kategori, urut])

  /** CSV bertitik koma (sep=;) agar langsung terbuka rapi di Excel; isinya mengikuti tahun dan wilayah terpilih. */
  const eksporExcel = () => {
    const sel = (v: string) => `"${v.replace(/"/g, '""')}"`
    const baris = [
      ["Tahun", "Nama", "NPSN", "Jenjang", "Provinsi", "Kabupaten/Kota", "Skor Indeks BSAN", "Kategori", "Status Evaluasi"],
      ...dataWilayah.map((s) => [
        String(tahun), s.nama, s.npsn, s.jenjang, s.provinsi, s.kabKota,
        s.skor !== null ? fmt(s.skor) : "-", s.skor !== null ? kategoriDari(s.skor) : "-", s.skor !== null ? "Sudah" : "Belum",
      ]),
    ]
    const isi = ["sep=;", ...baris.map((b) => b.map(sel).join(";"))].join("\r\n")
    const url = URL.createObjectURL(new Blob(["\uFEFF" + isi], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `indeks-bsan-${tahun}-${(wilayah.kabKota ?? wilayah.provinsi ?? "indonesia").toLowerCase().replace(/\s+/g, "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  /** Urutan tiap kolom: klik pertama menurun, kedua menaik, ketiga kembali ke urutan awal. */
  const kepalaUrut = (kolom: KolomUrut, label: React.ReactNode, tengah?: boolean) => {
    const aktif = urut?.kolom === kolom
    return (
      <th key={kolom} className={cn("px-3 py-3", tengah && "text-center")} aria-sort={aktif ? (urut.arah === "asc" ? "ascending" : "descending") : "none"}>
        <button
          type="button"
          onClick={() => ubah(setUrut)(!aktif ? { kolom, arah: "desc" } : urut.arah === "desc" ? { kolom, arah: "asc" } : null)}
          className="inline-flex items-center gap-1 hover:text-gray-700"
        >
          {label}
          <ArrowUp className={cn("w-3.5 h-3.5 transition-transform", aktif ? "text-gray-600" : "text-gray-300", aktif && urut.arah === "desc" && "rotate-180")} />
        </button>
      </th>
    )
  }

  const totalHalaman = Math.max(1, Math.ceil(terfilter.length / perHalaman))
  const halamanAktif = Math.min(halaman, totalHalaman)
  const mulai = (halamanAktif - 1) * perHalaman
  const baris = terfilter.slice(mulai, mulai + perHalaman)

  const ubah = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setHalaman(1)
  }

  const pilihTahun = <TahunSelect tahun={tahun} onChange={ubah(setTahun)} />
  const tombolEkspor = (
    <button
      type="button"
      onClick={eksporExcel}
      className="flex h-9 items-center gap-1.5 rounded-[4px] bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <Download className="h-4 w-4" /> Ekspor Excel
    </button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{judul}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {kabKotaTetap
              ? `Skor Indeks BSAN ${hanyaSekolah ? "satuan pendidikan" : "satuan pendidikan dan dinas"} di ${wilayahKabKota}, ${wilayahProvinsi}.`
              : terbatas
                ? `Skor Indeks BSAN satuan pendidikan dan dinas di wilayah kewenangan Anda (${wilayahProvinsi}).`
                : "Skor Indeks BSAN seluruh satuan pendidikan dan dinas."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {kabKotaTetap && pilihTahun}
          {tombolEkspor}
        </div>
      </div>

      {!kabKotaTetap && (
        <>
          <div className="border-t border-gray-200" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <WilayahFilter nilai={wilayah} onChange={ubah(setWilayah)} provinsiTetap={wilayahProvinsi} ringkas />
            {pilihTahun}
          </div>
        </>
      )}

      <section className="rounded-[4px] border border-gray-300 bg-white overflow-x-auto">
        {/* Kolom label dan "Semua" terkunci saat digeser; kolom jenjang berukuran sama. */}
        <table className="w-full min-w-[960px] table-fixed text-sm border-separate border-spacing-0">
          <colgroup>
            <col className="w-48" />
            <col className="w-32" />
            {ringkasan.perJenjang.map((j) => (
              <col key={j.jenjang} />
            ))}
          </colgroup>
          <thead>
            <tr className="text-xs font-semibold text-gray-600">
              <th className="sticky left-0 z-20 bg-[#F1F1F1] border-b border-r border-gray-300 px-4 py-3" />
              <th className="sticky left-48 z-20 bg-[#F1F1F1] border-b border-r border-gray-300 px-3 py-3 text-center">Semua</th>
              {ringkasan.perJenjang.map((j, n, arr) => (
                <th
                  key={j.jenjang}
                  className={cn("bg-[#F1F1F1] border-b border-gray-300 px-2 py-3 text-center leading-tight", n < arr.length - 1 && "border-r")}
                >
                  {j.jenjang}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-white border-b border-r border-gray-300 px-4 py-4 text-left font-bold text-gray-900">
                <span className="inline-flex items-center gap-1.5">
                  Rerata Indeks BSAN
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Lihat penjelasan kategori skor Indeks BSAN" className="rounded-full text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs space-y-2 p-3 text-left leading-relaxed">
                      <p className="font-semibold">Kategori skor Indeks BSAN</p>
                      {KATEGORI_SKOR.map((k) => (
                        <p key={k.label}>
                          <span className="font-semibold">{k.label}</span> ({k.rentang}): {k.arti}
                        </p>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                </span>
              </th>
              <td className="sticky left-48 z-10 bg-[#F9F9F9] border-b border-r border-gray-300 px-3 py-4 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <span className={cn("text-3xl font-bold tabular-nums leading-none", ringkasan.rerata !== null ? "text-gray-900" : "text-gray-400")}>
                    {fmt(ringkasan.rerata ?? 0)}
                  </span>
                  {ringkasan.rerata !== null && <TingkatChip skor={ringkasan.rerata} solid />}
                </div>
              </td>
              {ringkasan.perJenjang.map((j, n, arr) => (
                <td
                  key={j.jenjang}
                  className={cn(
                    "border-b border-gray-300 px-3 py-4 text-center text-base font-semibold tabular-nums",
                    n < arr.length - 1 && "border-r",
                    j.rerata !== null ? "text-gray-900" : "text-gray-300"
                  )}
                >
                  {fmt(j.rerata ?? 0)}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-white border-r border-gray-300 px-4 py-4 text-left font-bold text-gray-900">
                Sudah mengikuti evaluasi BSAN
              </th>
              <td className="sticky left-48 z-10 bg-[#F9F9F9] border-r border-gray-300 px-3 py-4 text-center tabular-nums">
                <p className="text-3xl font-bold leading-none text-gray-900">{persen(ringkasan.sudah, ringkasan.total)}</p>
                <p className="mt-1.5 text-xs text-gray-500 whitespace-nowrap">
                  {ringkasan.sudah.toLocaleString("id-ID")} / {ringkasan.total.toLocaleString("id-ID")}
                </p>
              </td>
              {ringkasan.perJenjang.map((j, n, arr) => (
                <td key={j.jenjang} className={cn("px-3 py-4 text-center tabular-nums border-gray-300", n < arr.length - 1 && "border-r")}>
                  <p className="text-base font-semibold text-gray-900">{persen(j.sudah, j.total)}</p>
                  <p className="mt-1 text-xs text-gray-500 whitespace-nowrap">
                    {j.sudah} / {j.total}
                  </p>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <div className="rounded-[4px] border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 pt-5 pb-4 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">Daftar Skor {hanyaSekolah ? "Sekolah" : "Instansi"}</h2>
            <p className="text-sm text-gray-500 tabular-nums">
              {terfilter.length.toLocaleString("id-ID")}
              {terfilter.length !== dataWilayah.length ? ` dari ${dataWilayah.length.toLocaleString("id-ID")}` : ""} {sebutan}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))]">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={cari}
                onChange={(e) => ubah(setCari)(e.target.value)}
                placeholder={`Cari nama ${sebutan} atau NPSN`}
                className="w-full h-10 pl-9 pr-3 text-sm border border-gray-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <FilterSelect value={jenjang} onChange={(e) => ubah(setJenjang)(e.target.value as Jenjang | "semua")} aria-label="Filter jenjang">
              <option value="semua">Semua Jenjang</option>
              {jenjangList.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </FilterSelect>
            <FilterSelect value={kategori} onChange={(e) => ubah(setKategori)(e.target.value as Kategori | "belum" | "semua")} aria-label="Filter kategori">
              <option value="semua">Semua Kategori</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Sedang">Sedang</option>
              <option value="Rendah">Rendah</option>
              <option value="belum">Belum Tersedia</option>
            </FilterSelect>
          </div>
        </div>

        {terfilter.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400 border-t border-gray-200">
            <Search className="w-8 h-8" />
            <p className="text-sm">Tidak ada data ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-gray-200">
            <table className="w-full text-sm min-w-[920px] table-fixed">
              <colgroup>
                <col className="w-14" />
                <col className="w-[30%]" />
                <col className="w-[13%]" />
                <col className="w-[11%]" />
                <col className="w-[20%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
              </colgroup>
              <thead>
                <tr className="bg-[#F1F1F1] border-b border-gray-200 text-left text-xs font-semibold text-gray-500">
                  <th className="pl-5 pr-2 py-3 text-center">No</th>
                  {kepalaUrut("nama", <>Nama {hanyaSekolah ? "Sekolah" : "Instansi"}</>)}
                  {kepalaUrut("npsn", "NPSN")}
                  {kepalaUrut("jenjang", "Jenjang")}
                  {kepalaUrut("kabKota", "Kabupaten/Kota")}
                  {kepalaUrut("kategori", "Kategori")}
                  {kepalaUrut("skor", "Indeks", true)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {baris.map((s, n) => (
                  <tr key={s.id} className="hover:bg-[#F9F9F9] transition-colors">
                    <td className="pl-5 pr-2 py-3.5 text-center text-gray-400 tabular-nums">{mulai + n + 1}</td>
                    <td className="px-3 py-3.5 font-medium text-gray-900 truncate" title={s.nama}>{s.nama}</td>
                    <td className="px-3 py-3.5 text-gray-600 tabular-nums">{s.npsn}</td>
                    <td className="px-3 py-3.5">
                      <span className="inline-flex rounded-full bg-[#efefef] px-2.5 py-0.5 text-[13px] font-semibold text-[#2f3031] whitespace-nowrap">{s.jenjang}</span>
                    </td>
                    <td className="px-3 py-3.5 text-gray-600 truncate">{s.kabKota}</td>
                    <td className="px-3 py-3.5">{s.skor !== null ? <TingkatChip skor={s.skor} solid /> : <span className="text-gray-300">-</span>}</td>
                    <td className={cn("px-3 py-3.5 text-center font-semibold tabular-nums", s.skor !== null ? "text-gray-900" : "text-gray-300")}>
                      {s.skor !== null ? fmt(s.skor) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TablePagination
          total={terfilter.length}
          halaman={halamanAktif}
          perHalaman={perHalaman}
          onHalaman={setHalaman}
          onPerHalaman={(n) => {
            setPerHalaman(n)
            setHalaman(1)
          }}
        />
      </div>
    </div>
  )
}
