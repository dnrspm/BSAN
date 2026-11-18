"use client"

import { useMemo, useState } from "react"
import { ArrowUp, Download, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { SELURUH_INDONESIA, WilayahFilter, type WilayahPilihan } from "@/components/filters/WilayahFilter"
import { buatData, FilterSelect, skorProvinsi } from "@/components/pusat/IndeksBsanPusatView"
import type { DetailInstansi } from "@/components/sekolah/IndeksBsanView"
import { TablePagination } from "@/components/ui/table-pagination"
import { LastUpdate, TAHUN_AKTIF, TahunSelect, TingkatChip, TombolDetail, fmt, tingkat } from "@/components/sekolah/indeks-bsan/shared"

type KolomUrut = "nama" | "tingkat" | "provinsi" | "kategori" | "skor"
type Kategori = "Tinggi" | "Sedang" | "Rendah"
type Tingkat = "Provinsi" | "Kab/Kota"

interface BarisDaerah {
  /** Kunci unik: provinsi saja, atau provinsi|kab/kota. */
  kunci: string
  nama: string
  tingkat: Tingkat
  provinsi: string
  kabKota?: string
  /** Skor Indeks BSAN dinas pendidikan daerah itu; null bila belum mengikuti evaluasi. */
  skor: number | null
}

const rerata = (n: number[]) => (n.length ? Math.round((n.reduce((a, b) => a + b, 0) / n.length) * 10) / 10 : null)
const persen = (sudah: number, total: number) => (total ? `${Math.round((sudah / total) * 100)}%` : "0%")

/** Daftar daerah: tiap provinsi (bila `sertakanProvinsi`) diikuti kab/kota di bawahnya; skor = skor dinas daerah itu. */
function buatDaerah(tahun: number, provinsi: string | undefined, sertakanProvinsi: boolean): BarisDaerah[] {
  const kabKota: BarisDaerah[] = buatData(tahun, provinsi)
    .filter((s) => s.jenjang === "Dinas")
    .map((s) => ({ kunci: `${s.provinsi}|${s.kabKota}`, nama: s.kabKota, tingkat: "Kab/Kota", provinsi: s.provinsi, kabKota: s.kabKota, skor: s.skor }))
  const daftarProvinsi = provinsi ? [provinsi] : [...new Set(kabKota.map((b) => b.provinsi))]
  const hasil = daftarProvinsi.flatMap((p): BarisDaerah[] => [
    ...(sertakanProvinsi ? [{ kunci: p, nama: p, tingkat: "Provinsi" as const, provinsi: p, skor: skorProvinsi(tahun, p) }] : []),
    ...kabKota.filter((b) => b.provinsi === p).sort((a, b) => a.nama.localeCompare(b.nama, "id")),
  ])
  return provinsi ? hasil : hasil.sort((a, b) => a.provinsi.localeCompare(b.provinsi, "id"))
}

interface IndeksBsanDaerahViewProps {
  /** Batasi pada satu provinsi (Dinas Provinsi, BPMP); kosong = seluruh Indonesia. */
  provinsi?: string
  /** Sertakan baris provinsi, bukan hanya kab/kota. */
  sertakanProvinsi?: boolean
  judul?: string
  /** Bila diisi, baris dapat diklik untuk membuka detail skor daerah tersebut. */
  onLihatDetail?: (detail: DetailInstansi) => void
}

/**
 * Daftar skor Indeks BSAN dinas per daerah (provinsi dan/atau kab/kota). Skor sekolah tidak ditampilkan di sini;
 * lihat daftar sekolah.
 */
export function IndeksBsanDaerahView({ provinsi, sertakanProvinsi = false, judul = "Indeks BSAN Daerah", onLihatDetail }: IndeksBsanDaerahViewProps) {
  const [tahun, setTahun] = useState(TAHUN_AKTIF)
  const [cari, setCari] = useState("")
  const [tingkatDaerah, setTingkatDaerah] = useState<Tingkat | "semua">("semua")
  const [wilayah, setWilayah] = useState<WilayahPilihan>(provinsi ? { provinsi, kabKota: null } : SELURUH_INDONESIA)
  const [kategori, setKategori] = useState<Kategori | "belum" | "semua">("semua")
  const [urut, setUrut] = useState<{ kolom: KolomUrut; arah: "asc" | "desc" } | null>(null)
  const [halaman, setHalaman] = useState(1)
  const [perHalaman, setPerHalaman] = useState(10)

  const baris = useMemo(() => buatDaerah(tahun, provinsi, sertakanProvinsi), [tahun, provinsi, sertakanProvinsi])
  const adaDuaTingkat = sertakanProvinsi

  // Filter wilayah berlaku untuk ringkasan maupun daftar (satu provinsi memuat baris provinsi dan kab/kota-nya).
  const barisWilayah = useMemo(
    () => baris.filter((b) => (!wilayah.provinsi || b.provinsi === wilayah.provinsi)),
    [baris, wilayah]
  )

  const ringkasan = useMemo(() => {
    const skor = barisWilayah.flatMap((b) => (b.skor !== null ? [b.skor] : []))
    return { rerata: rerata(skor), sudah: skor.length, total: barisWilayah.length }
  }, [barisWilayah])

  const terfilter = useMemo(() => {
    const q = cari.trim().toLowerCase()
    const hasil = barisWilayah.filter((b) => {
      if (q && !b.nama.toLowerCase().includes(q)) return false
      if (tingkatDaerah !== "semua" && b.tingkat !== tingkatDaerah) return false
      if (kategori === "belum" && b.skor !== null) return false
      if (kategori !== "semua" && kategori !== "belum" && (b.skor === null || tingkat(b.skor).label !== kategori)) return false
      return true
    })
    if (!urut) return hasil
    const kali = urut.arah === "asc" ? 1 : -1
    return [...hasil].sort((a, b) => {
      if (urut.kolom === "nama" || urut.kolom === "tingkat" || urut.kolom === "provinsi") return a[urut.kolom].localeCompare(b[urut.kolom], "id") * kali
      // Yang belum mengikuti selalu di bagian bawah.
      if (a.skor === null) return b.skor === null ? 0 : 1
      if (b.skor === null) return -1
      return (a.skor - b.skor) * kali
    })
  }, [barisWilayah, cari, tingkatDaerah, kategori, urut])

  /** CSV bertitik koma (sep=;) agar langsung terbuka rapi di Excel; isinya mengikuti tahun terpilih. */
  const eksporExcel = () => {
    const sel = (v: string) => `"${v.replace(/"/g, '""')}"`
    const rows = [
      ["Tahun", "Daerah", "Tingkat", "Provinsi", "Skor Indeks BSAN Dinas", "Kategori", "Status Evaluasi"],
      ...barisWilayah.map((b) => [
        String(tahun), b.nama, b.tingkat, b.provinsi,
        b.skor !== null ? fmt(b.skor) : "-", b.skor !== null ? tingkat(b.skor).label : "-", b.skor !== null ? "Sudah" : "Belum",
      ]),
    ]
    const isi = ["sep=;", ...rows.map((r) => r.map(sel).join(";"))].join("\r\n")
    const url = URL.createObjectURL(new Blob(["﻿" + isi], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `indeks-bsan-daerah-${tahun}-${(provinsi ?? "indonesia").toLowerCase().replace(/\s+/g, "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const ubah = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setHalaman(1)
  }

  const bukaDetail = (b: BarisDaerah) => {
    window.scrollTo({ top: 0 })
    onLihatDetail?.({
      nama: b.tingkat === "Provinsi" ? `Dinas Pendidikan Provinsi ${b.nama}` : `Dinas Pendidikan ${b.nama}`,
      kabKota: b.kabKota,
      provinsi: b.provinsi,
      skorTahun: (t) => buatDaerah(t, provinsi, sertakanProvinsi).find((x) => x.kunci === b.kunci)?.skor ?? null,
    })
  }

  /** Urutan tiap kolom: klik pertama menurun, kedua menaik, ketiga kembali ke urutan awal. */
  const kepala = (kolom: KolomUrut, label: string, tengah?: boolean) => {
    const aktif = urut?.kolom === kolom
    return (
      <th className={cn("px-3 py-3", tengah && "text-center")} aria-sort={aktif ? (urut.arah === "asc" ? "ascending" : "descending") : "none"}>
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
  const tampilProvinsi = !provinsi

  const deskripsi = provinsi
    ? sertakanProvinsi
      ? `Skor Indeks BSAN dinas pendidikan ${provinsi} dan seluruh kabupaten/kota di dalamnya.`
      : `Skor Indeks BSAN dinas pendidikan tiap kabupaten/kota di ${provinsi}.`
    : "Skor Indeks BSAN dinas pendidikan seluruh provinsi dan kabupaten/kota."

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{judul}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {deskripsi} <LastUpdate />
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <TahunSelect tahun={tahun} onChange={ubah(setTahun)} />
          <button
            type="button"
            onClick={eksporExcel}
            className="flex h-9 items-center gap-1.5 rounded-[4px] bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Download className="h-4 w-4" /> Ekspor Excel
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200" />
      <div>
        {/* Baris tabel sudah per kab/kota, jadi filter berhenti di provinsi; provinsi yang terkunci (BPMP, Dinas Provinsi) tak perlu filter. */}
        {provinsi ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-lg">Wilayah:</span>
            <span className="font-bold text-gray-900 text-lg">{provinsi}</span>
          </div>
        ) : (
          <WilayahFilter nilai={wilayah} onChange={ubah(setWilayah)} hanyaProvinsi ringkas />
        )}
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[4px] border border-[#D9DBDD] bg-white p-5">
          <p className="text-sm font-bold text-gray-900">Rerata Indeks BSAN Dinas</p>
          <div className="mt-3 flex items-center gap-3">
            <span className={cn("text-3xl font-bold tabular-nums leading-none", ringkasan.rerata !== null ? "text-gray-900" : "text-gray-400")}>
              {fmt(ringkasan.rerata ?? 0)}
            </span>
            {ringkasan.rerata !== null && <TingkatChip skor={ringkasan.rerata} solid />}
          </div>
        </div>
        <div className="rounded-[4px] border border-[#D9DBDD] bg-white p-5">
          <p className="text-sm font-bold text-gray-900">Sudah mengikuti evaluasi BSAN</p>
          <div className="mt-3 flex items-baseline gap-3 tabular-nums">
            <span className="text-3xl font-bold leading-none text-gray-900">{persen(ringkasan.sudah, ringkasan.total)}</span>
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {ringkasan.sudah.toLocaleString("id-ID")} / {ringkasan.total.toLocaleString("id-ID")} daerah
            </span>
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-2 [&>*]:w-full [&>*]:shrink-0 sm:[&>*]:w-[180px]">
        <div className="relative flex-1 min-w-[240px] sm:w-auto!">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={cari}
            onChange={(e) => ubah(setCari)(e.target.value)}
            placeholder="Cari nama daerah"
            className="bg-white w-full h-10 pl-9 pr-3 text-sm border border-[#808489] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        {adaDuaTingkat && (
          <FilterSelect value={tingkatDaerah} onChange={(e) => ubah(setTingkatDaerah)(e.target.value as Tingkat | "semua")} aria-label="Filter tingkat">
            <option value="semua">Semua Tingkat</option>
            <option value="Provinsi">Provinsi</option>
            <option value="Kab/Kota">Kab/Kota</option>
          </FilterSelect>
        )}
        <FilterSelect value={kategori} onChange={(e) => ubah(setKategori)(e.target.value as Kategori | "belum" | "semua")} aria-label="Filter kategori">
          <option value="semua">Semua Kategori</option>
          <option value="Tinggi">Tinggi</option>
          <option value="Sedang">Sedang</option>
          <option value="Rendah">Rendah</option>
          <option value="belum">Belum Tersedia</option>
        </FilterSelect>
      </div>

      <div className="rounded-[4px] border border-[#D9DBDD] bg-white overflow-hidden">
        {terfilter.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <Search className="w-8 h-8" />
            <p className="text-sm">Tidak ada data ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px] table-fixed">
              <colgroup>
                <col className="w-14" />
                <col className="w-[26%]" />
                {adaDuaTingkat && <col className="w-[13%]" />}
                {tampilProvinsi && <col className="w-[20%]" />}
                <col />
                <col className="w-[12%]" />
                {onLihatDetail && <col className="w-[11%]" />}
              </colgroup>
              <thead>
                <tr className="bg-[#F1F1F1] border-b border-[#D9DBDD] text-left text-xs font-semibold text-gray-500">
                  <th className="pl-5 pr-2 py-3 text-center">No</th>
                  {kepala("nama", "Daerah")}
                  {adaDuaTingkat && kepala("tingkat", "Tingkat")}
                  {tampilProvinsi && kepala("provinsi", "Provinsi")}
                  {kepala("kategori", "Kategori")}
                  {kepala("skor", "Indeks", true)}
                  {onLihatDetail && <th className="px-3 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DBDD]">
                {terfilter.slice(mulai, mulai + perHalaman).map((b, n) => (
                  <tr
                    key={b.kunci}
                    onClick={onLihatDetail ? () => bukaDetail(b) : undefined}
                    className={cn("hover:bg-[#F9F9F9] transition-colors", onLihatDetail && "cursor-pointer")}
                  >
                    <td className="pl-5 pr-2 py-3.5 text-center text-gray-400 tabular-nums">{mulai + n + 1}</td>
                    <td className={cn("px-3 py-3.5 text-gray-900 truncate", b.tingkat === "Provinsi" ? "font-semibold" : "font-medium")} title={b.nama}>
                      {onLihatDetail ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            bukaDetail(b)
                          }}
                          className="max-w-full truncate text-left hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          {b.nama}
                        </button>
                      ) : (
                        b.nama
                      )}
                    </td>
                    {adaDuaTingkat && (
                      <td className="px-3 py-3.5">
                        <span className="inline-flex rounded-full bg-[#efefef] px-2.5 py-0.5 text-[13px] font-semibold text-[#2f3031] whitespace-nowrap">{b.tingkat}</span>
                      </td>
                    )}
                    {tampilProvinsi && <td className="px-3 py-3.5 text-gray-600 truncate">{b.provinsi}</td>}
                    <td className="px-3 py-3.5">{b.skor !== null ? <TingkatChip skor={b.skor} solid /> : <span className="text-gray-300">-</span>}</td>
                    <td className={cn("px-3 py-3.5 text-center font-semibold tabular-nums", b.skor !== null ? "text-gray-900" : "text-gray-300")}>
                      {b.skor !== null ? fmt(b.skor) : "-"}
                    </td>
                    {onLihatDetail && (
                      <td className="px-3 py-3.5 text-right">
                        <TombolDetail nama={b.nama} onClick={() => bukaDetail(b)} />
                      </td>
                    )}
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
