"use client"

import { useMemo, useState } from "react"
import { ArrowUp, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { KAB_KOTA_BY_PROVINSI } from "@/data/kabKotaData"
import { SELURUH_INDONESIA, WilayahFilter, type WilayahPilihan } from "@/components/filters/WilayahFilter"
import { JENJANG_FIELDS } from "@/components/pusat/LaporanAkhirTahunPusatView"
import { TAHUN_AKTIF, TahunSelect, TingkatChip, fmt, tingkat } from "@/components/sekolah/indeks-bsan/shared"

type Jenjang = string
type Status = "sudah" | "belum"
type Kategori = "Tinggi" | "Sedang" | "Rendah"

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
const PER_HALAMAN = 10

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

const persen = (sudah: number, total: number) => (total ? `${Math.round((sudah / total) * 100)}%` : "-")

const rata2 = (nilai: number[]) => (nilai.length ? Math.round((nilai.reduce((a, b) => a + b, 0) / nilai.length) * 10) / 10 : null)

function kategoriDari(skor: number): Kategori {
  return tingkat(skor).label as Kategori
}

/** Select dengan panah buatan sendiri, agar panah tidak menempel di tepi kanan. */
function FilterSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="w-full h-10 appearance-none pl-3 pr-9 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
  const [kategori, setKategori] = useState<Kategori | "semua">("semua")
  const [status, setStatus] = useState<Status | "semua">("semua")
  const [urut, setUrut] = useState<"asc" | "desc" | null>(null)
  const [halaman, setHalaman] = useState(1)

  const data = useMemo(() => buatData(tahun, wilayahProvinsi, wilayahKabKota, hanyaSekolah), [tahun, wilayahProvinsi, wilayahKabKota, hanyaSekolah])

  const ringkasan = useMemo(() => {
    const sudah = data.filter((s) => s.skor !== null)
    return {
      rerata: rata2(sudah.map((s) => s.skor as number)),
      sudah: sudah.length,
      perJenjang: jenjangList.map((j) => {
        const sekolah = data.filter((s) => s.jenjang === j)
        const ikut = sekolah.filter((s) => s.skor !== null)
        const r = rata2(ikut.map((s) => s.skor as number))
        return { jenjang: j, rerata: r, sudah: ikut.length, belum: sekolah.length - ikut.length }
      }),
    }
  }, [data, jenjangList])

  const terfilter = useMemo(() => {
    const q = cari.trim().toLowerCase()
    const hasil = data.filter((s) => {
      if (q && !s.nama.toLowerCase().includes(q) && !s.npsn.includes(q)) return false
      if (jenjang !== "semua" && s.jenjang !== jenjang) return false
      if (wilayah.provinsi && s.provinsi !== wilayah.provinsi) return false
      if (wilayah.kabKota && s.kabKota !== wilayah.kabKota) return false
      if (status !== "semua" && (status === "sudah") !== (s.skor !== null)) return false
      if (kategori !== "semua" && (s.skor === null || kategoriDari(s.skor) !== kategori)) return false
      return true
    })
    if (!urut) return hasil
    // Instansi yang belum mengikuti selalu di bagian bawah.
    return [...hasil].sort((a, b) => {
      if (a.skor === null) return b.skor === null ? 0 : 1
      if (b.skor === null) return -1
      return urut === "asc" ? a.skor - b.skor : b.skor - a.skor
    })
  }, [data, cari, jenjang, wilayah, kategori, status, urut])

  const totalHalaman = Math.max(1, Math.ceil(terfilter.length / PER_HALAMAN))
  const halamanAktif = Math.min(halaman, totalHalaman)
  const mulai = (halamanAktif - 1) * PER_HALAMAN
  const baris = terfilter.slice(mulai, mulai + PER_HALAMAN)

  const ubah = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setHalaman(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{judul}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {kabKotaTetap
              ? `Skor Indeks BSAN ${hanyaSekolah ? "satuan pendidikan" : "satuan pendidikan dan dinas"} di ${wilayahKabKota}, ${wilayahProvinsi}.`
              : terbatas
                ? `Skor Indeks BSAN satuan pendidikan dan dinas di wilayah kewenangan Anda (${wilayahProvinsi}).`
                : "Skor Indeks BSAN seluruh satuan pendidikan dan dinas."}
          </p>
        </div>
        <TahunSelect tahun={tahun} onChange={ubah(setTahun)} />
      </div>

      <section className="rounded-xl border border-gray-300 bg-white overflow-x-auto">
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
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              <th className="sticky left-0 z-20 bg-gray-100 border-b border-r border-gray-300 px-4 py-3" />
              <th className="sticky left-48 z-20 bg-gray-200 border-b border-r border-gray-300 px-3 py-3 text-center">Semua</th>
              {ringkasan.perJenjang.map((j, n, arr) => (
                <th
                  key={j.jenjang}
                  className={cn("bg-gray-100 border-b border-gray-300 px-2 py-3 text-center leading-tight", n < arr.length - 1 && "border-r")}
                >
                  {j.jenjang}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-white border-b border-r border-gray-300 px-4 py-4 text-left font-bold text-gray-900">
                Rerata Indeks BSAN
              </th>
              <td className="sticky left-48 z-10 bg-gray-50 border-b border-r border-gray-300 px-3 py-4 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <span className={cn("text-3xl font-bold tabular-nums leading-none", ringkasan.rerata !== null ? "text-gray-900" : "text-gray-400")}>
                    {ringkasan.rerata !== null ? fmt(ringkasan.rerata) : "-"}
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
                  {j.rerata !== null ? fmt(j.rerata) : "-"}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-white border-r border-gray-300 px-4 py-4 text-left font-bold text-gray-900">
                Sudah mengikuti evaluasi BSAN
              </th>
              <td className="sticky left-48 z-10 bg-gray-50 border-r border-gray-300 px-3 py-4 text-center tabular-nums">
                <p className="text-3xl font-bold leading-none text-gray-900">{persen(ringkasan.sudah, data.length)}</p>
                <p className="mt-1.5 text-xs text-gray-500 whitespace-nowrap">
                  {ringkasan.sudah.toLocaleString("id-ID")} / {data.length.toLocaleString("id-ID")}
                </p>
              </td>
              {ringkasan.perJenjang.map((j, n, arr) => (
                <td key={j.jenjang} className={cn("px-3 py-4 text-center tabular-nums border-gray-300", n < arr.length - 1 && "border-r")}>
                  <p className="text-base font-semibold text-gray-900">{persen(j.sudah, j.sudah + j.belum)}</p>
                  <p className="mt-1 text-xs text-gray-500 whitespace-nowrap">
                    {j.sudah} / {j.sudah + j.belum}
                  </p>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 pt-5 pb-4 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">Daftar Skor {hanyaSekolah ? "Sekolah" : "Instansi"}</h2>
            <p className="text-sm text-gray-500 tabular-nums">
              {terfilter.length.toLocaleString("id-ID")}
              {terfilter.length !== data.length ? ` dari ${data.length.toLocaleString("id-ID")}` : ""} {sebutan}
            </p>
          </div>

          <div className={cn("grid gap-2 sm:grid-cols-2", kabKotaTetap ? "lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]" : "lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]")}>
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={cari}
                onChange={(e) => ubah(setCari)(e.target.value)}
                placeholder={`Cari nama ${sebutan} atau NPSN`}
                className="w-full h-10 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <FilterSelect value={jenjang} onChange={(e) => ubah(setJenjang)(e.target.value as Jenjang | "semua")} aria-label="Filter jenjang">
              <option value="semua">Semua Jenjang</option>
              {jenjangList.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </FilterSelect>
            {!kabKotaTetap && <WilayahFilter nilai={wilayah} onChange={ubah(setWilayah)} provinsiTetap={wilayahProvinsi} />}
            <FilterSelect value={kategori} onChange={(e) => ubah(setKategori)(e.target.value as Kategori | "semua")} aria-label="Filter kategori">
              <option value="semua">Semua Kategori</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Sedang">Sedang</option>
              <option value="Rendah">Rendah</option>
            </FilterSelect>
            <FilterSelect value={status} onChange={(e) => ubah(setStatus)(e.target.value as Status | "semua")} aria-label="Filter evaluasi BSAN">
              <option value="semua">Semua Evaluasi</option>
              <option value="sudah">Sudah</option>
              <option value="belum">Belum</option>
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
                <col className="w-[27%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
              </colgroup>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="pl-5 pr-2 py-3 text-center">No</th>
                  <th className="px-3 py-3">Nama {hanyaSekolah ? "Sekolah" : "Instansi"}</th>
                  <th className="px-3 py-3">NPSN</th>
                  <th className="px-3 py-3">Jenjang</th>
                  <th className="px-3 py-3">Kabupaten/Kota</th>
                  <th className="px-3 py-3">Evaluasi BSAN</th>
                  <th className="px-3 py-3">Kategori</th>
                  <th className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setUrut(urut === null ? "desc" : urut === "desc" ? "asc" : null)}
                      className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-700"
                    >
                      Indeks
                      <ArrowUp className={cn("w-3.5 h-3.5 transition-transform", urut ? "text-gray-600" : "text-gray-300", urut === "desc" && "rotate-180")} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {baris.map((s, n) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="pl-5 pr-2 py-3.5 text-center text-gray-400 tabular-nums">{mulai + n + 1}</td>
                    <td className="px-3 py-3.5 font-medium text-gray-900 truncate" title={s.nama}>{s.nama}</td>
                    <td className="px-3 py-3.5 text-gray-600 tabular-nums">{s.npsn}</td>
                    <td className="px-3 py-3.5">
                      <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 whitespace-nowrap">{s.jenjang}</span>
                    </td>
                    <td className="px-3 py-3.5 text-gray-600 truncate">{s.kabKota}</td>
                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center gap-2 text-gray-700 whitespace-nowrap">
                        <span className={cn("w-1.5 h-1.5 rounded-full", s.skor !== null ? "bg-blue-500" : "bg-gray-300")} />
                        {s.skor !== null ? "Sudah" : "Belum"}
                      </span>
                    </td>
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

        {terfilter.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 tabular-nums">
              Menampilkan {mulai + 1}-{Math.min(mulai + PER_HALAMAN, terfilter.length)} dari {terfilter.length.toLocaleString("id-ID")} {sebutan}
            </p>
            {totalHalaman > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHalaman(halamanAktif - 1)}
                  disabled={halamanAktif === 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <span className="text-xs text-gray-600 tabular-nums">
                  Halaman {halamanAktif} dari {totalHalaman}
                </span>
                <button
                  onClick={() => setHalaman(halamanAktif + 1)}
                  disabled={halamanAktif === totalHalaman}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
