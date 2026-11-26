"use client"

import { useMemo, useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, ChevronDown, Download, FileSpreadsheet, Loader2, Search, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { readAuthSession } from "@/lib/auth-session"
import {
  BAGIAN_UNGGAH, formatWaktu, labelBagian, prosesCsv, TAHUN_PILIHAN, TEMPLATE_CSV, unduhCsv, useUnggahan,
  type BagianUnggah, type StatusUnggah, type Unggahan,
} from "@/lib/unggah-indeks-bsan"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FilterSelect } from "@/components/pusat/IndeksBsanPusatView"
import { TombolDetail } from "@/components/sekolah/indeks-bsan/shared"

const BADGE: Record<StatusUnggah, string> = {
  Berhasil: "bg-emerald-300 text-emerald-950",
  Gagal: "bg-rose-100 text-rose-950",
  Diproses: "bg-sky-200 text-sky-950",
}

const LENCANA = "inline-flex items-center gap-1 rounded-full whitespace-nowrap px-2.5 py-0.5 text-[13px] font-semibold"

function StatusBadge({ status }: { status: StatusUnggah }) {
  return (
    <span className={cn(LENCANA, BADGE[status])}>
      {status === "Diproses" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status}
    </span>
  )
}

const TOMBOL_UTAMA =
  "flex h-9 items-center gap-1.5 rounded-[4px] bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
const TOMBOL_PUTIH =
  "flex h-9 items-center gap-1.5 rounded-[4px] border border-[#808489] bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-[#F9F9F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
const TOMBOL_SEKUNDER =
  "inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#808489] bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-[#F9F9F9] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
const KOLOM_PILIH =
  "h-10 rounded-[4px] border border-[#808489] bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
const TOMBOL_BATAL = "rounded-[4px] border border-[#808489] px-4 py-2 text-sm font-medium text-gray-700 hover:bg-[#F9F9F9]"

function ukuran(byte: number) {
  return byte < 1024 ? `${byte} B` : `${(byte / 1024).toFixed(1)} KB`
}

const TAHUN_AWAL = Math.min(Math.max(new Date().getFullYear(), TAHUN_PILIHAN[0]), TAHUN_PILIHAN[TAHUN_PILIHAN.length - 1])

/**
 * Unggah Data Indeks BSAN (Admin Pusat): satu halaman riwayat semua file yang diunggah (tahun dan jenis data adalah
 * kolom yang bisa difilter), satu modal unggah berisi tahun, jenis, dan file.
 */
export function UnggahIndeksBsanView() {
  const { daftar, tambah } = useUnggahan()
  const [unggahBuka, setUnggahBuka] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const detail = daftar.find((u) => u.id === detailId) ?? null

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">Unggah Data Indeks BSAN</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Unggah file CSV skor Indeks BSAN sekolah atau dinas, lalu lihat riwayat dan hasil pemrosesannya.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={TOMBOL_PUTIH}>
                  <Download className="h-4 w-4" /> Unduh Template
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {BAGIAN_UNGGAH.map((b) => (
                  <DropdownMenuItem key={b.id} onSelect={() => unduhCsv(TEMPLATE_CSV[b.id].nama, TEMPLATE_CSV[b.id].isi)}>
                    Template {b.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button type="button" onClick={() => setUnggahBuka(true)} className={TOMBOL_UTAMA}>
              <Upload className="h-4 w-4" /> Unggah Data
            </button>
          </div>
        </div>
      </div>

      <RiwayatUnggah daftar={daftar} onDetail={setDetailId} />

      <DialogUnggah
        buka={unggahBuka}
        onTutup={() => setUnggahBuka(false)}
        onUnggah={(tahun, bagian, file, isi) => {
          tambah({ tahun, bagian, namaFile: file.name, pengunggah: readAuthSession()?.username ?? "admin.pusat", isiAsli: isi })
          setUnggahBuka(false)
        }}
      />
      <DialogDetail unggahan={detail} onTutup={() => setDetailId(null)} />
    </div>
  )
}

function RiwayatUnggah({
  daftar, onDetail,
}: {
  daftar: Unggahan[]
  onDetail: (id: string) => void
}) {
  const [cari, setCari] = useState("")
  const [tahun, setTahun] = useState<number | "">("")
  const [bagian, setBagian] = useState<BagianUnggah | "">("")

  const tahunAda = useMemo(() => [...new Set(daftar.map((u) => u.tahun))].sort((a, b) => b - a), [daftar])

  const terfilter = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return daftar
      .filter((u) => (tahun === "" || u.tahun === tahun) && (bagian === "" || u.bagian === bagian))
      .filter((u) => !q || u.namaFile.toLowerCase().includes(q) || u.pengunggah.toLowerCase().includes(q))
      .sort((a, b) => b.tahun - a.tahun || b.waktu.localeCompare(a.waktu))
  }, [daftar, cari, tahun, bagian])

  const kelompok = useMemo(() => {
    const m = new Map<number, Unggahan[]>()
    for (const u of terfilter) m.set(u.tahun, [...(m.get(u.tahun) ?? []), u])
    return [...m.entries()]
  }, [terfilter])


  return (
    <>
      {/* Pencarian dan filter berada di luar kartu tabel, sama seperti halaman Indeks BSAN lainnya. */}
      <div className="flex flex-wrap items-center gap-2 [&>*]:w-full [&>*]:shrink-0 sm:[&>*]:w-[180px]">
        <div className="relative flex-1 min-w-[240px] sm:w-auto!">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={cari}
            onChange={(e) => {
              setCari(e.target.value)
            }}
            placeholder="Cari nama file atau pengunggah"
            className="bg-white w-full h-10 pl-9 pr-3 text-sm border border-[#808489] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        <FilterSelect
          aria-label="Filter tahun"
          value={tahun}
          onChange={(e) => {
            setTahun(e.target.value === "" ? "" : Number(e.target.value))
          }}
        >
          <option value="">Semua Tahun</option>
          {tahunAda.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </FilterSelect>
        <FilterSelect
          aria-label="Filter jenis data"
          value={bagian}
          onChange={(e) => {
            setBagian(e.target.value as BagianUnggah | "")
          }}
        >
          <option value="">Semua Jenis Data</option>
          {BAGIAN_UNGGAH.map((b) => (
            <option key={b.id} value={b.id}>{b.label}</option>
          ))}
        </FilterSelect>
      </div>

      {terfilter.length === 0 ? (
        <section className="rounded-[4px] border border-[#D9DBDD] bg-white">
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
            <FileSpreadsheet className="h-8 w-8" />
            <p className="text-sm">{daftar.length === 0 ? "Belum ada file yang diunggah." : "Tidak ada file ditemukan"}</p>
          </div>
        </section>
      ) : (
        <div className="space-y-4">
          {kelompok.map(([th, baris], i) => (
            <KelompokTahun key={th} tahun={th} baris={baris} onDetail={onDetail} awalBuka={i === 0} />
          ))}
        </div>
      )}
    </>
  )
}

function KelompokTahun({
  tahun, baris, onDetail, awalBuka,
}: {
  tahun: number
  baris: Unggahan[]
  onDetail: (id: string) => void
  awalBuka: boolean
}) {
  const [buka, setBuka] = useState(awalBuka)

  return (
    <section className="rounded-[4px] border border-[#D9DBDD] bg-white">
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        aria-expanded={buka}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
      >
        <span className="flex items-baseline gap-2">
          <h2 className="text-base font-bold text-gray-900">Tahun {tahun}</h2>
          <span className="text-sm text-gray-500">{baris.length} file</span>
        </span>
        <ChevronDown className={cn("h-5 w-5 text-gray-500 transition-transform", buka && "rotate-180")} />
      </button>

      {buka && (
        <div className="border-t border-[#D9DBDD]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed text-sm">
              <colgroup>
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[11%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#D9DBDD] bg-[#F1F1F1] text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="px-5 py-3">Waktu Unggah</th>
                  <th className="px-3 py-3">Jenis Data</th>
                  <th className="px-3 py-3">Nama File</th>
                  <th className="px-3 py-3">Pengunggah</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DBDD]">
                {baris.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-[#F9F9F9]">
                    <td className="px-5 py-3.5 tabular-nums text-gray-600">{formatWaktu(u.waktu)}</td>
                    <td className="truncate px-3 py-3.5 text-gray-600" title={labelBagian(u.bagian)}>{labelBagian(u.bagian)}</td>
                    <td className="truncate px-3 py-3.5 font-medium text-gray-900" title={u.namaFile}>{u.namaFile}</td>
                    <td className="truncate px-3 py-3.5 text-gray-600" title={u.pengunggah}>{u.pengunggah}</td>
                    <td className="px-3 py-3.5"><StatusBadge status={u.status} /></td>
                    <td className="px-3 py-3.5 text-right">
                      <TombolDetail nama={u.namaFile} onClick={() => onDetail(u.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

function DialogUnggah({
  buka, onTutup, onUnggah,
}: {
  buka: boolean
  onTutup: () => void
  onUnggah: (tahun: number, bagian: BagianUnggah, file: File, isi: string) => void
}) {
  const [tahun, setTahun] = useState(TAHUN_AWAL)
  const [bagian, setBagian] = useState<BagianUnggah>("sekolah")
  const [file, setFile] = useState<File | null>(null)
  const [galat, setGalat] = useState("")
  const [membaca, setMembaca] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const tutup = () => {
    setFile(null)
    setGalat("")
    onTutup()
  }

  const pilih = (f: File | undefined) => {
    setGalat("")
    if (!f) return setFile(null)
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setFile(null)
      return setGalat("Format file harus .csv.")
    }
    if (f.size > 10 * 1024 * 1024) {
      setFile(null)
      return setGalat("Ukuran file maksimal 10 MB.")
    }
    setFile(f)
  }

  const kirim = async () => {
    if (!file) return
    setMembaca(true)
    try {
      const isi = await file.text()
      setFile(null)
      onUnggah(tahun, bagian, file, isi)
    } catch {
      setGalat("File tidak dapat dibaca. Coba pilih ulang file.")
    } finally {
      setMembaca(false)
    }
  }

  return (
    <Dialog open={buka} onOpenChange={(o) => !o && tutup()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Unggah Data Indeks BSAN</DialogTitle>
          <DialogDescription>Pilih tahun dan jenis data, lalu unggah file CSV skornya.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <label className="block text-gray-600">
            Tahun data
            <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className={cn(KOLOM_PILIH, "mt-1.5 w-full")}>
              {TAHUN_PILIHAN.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-gray-600">Jenis data</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {BAGIAN_UNGGAH.map((b) => (
                <label
                  key={b.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-[4px] border px-3 py-2.5 font-medium transition-colors focus-within:ring-2 focus-within:ring-blue-500",
                    bagian === b.id ? "border-blue-600 bg-blue-50 text-blue-800" : "border-[#808489] text-gray-700 hover:bg-[#F9F9F9]"
                  )}
                >
                  <input type="radio" name="jenis-data" value={b.id} checked={bagian === b.id} onChange={() => setBagian(b.id)} className="accent-blue-600" />
                  {b.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => pilih(e.target.files?.[0])} aria-label="Pilih file CSV" />
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-[4px] border border-dashed border-[#808489] px-4 py-8 text-center transition hover:bg-[#F9F9F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Upload className="h-6 w-6 text-gray-400" />
              {file ? (
                <>
                  <span className="font-medium text-gray-900">{file.name}</span>
                  <span className="text-xs text-gray-500">{ukuran(file.size)} · klik untuk mengganti file</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-gray-900">Pilih file CSV</span>
                  <span className="text-xs text-gray-500">Maksimal 10 MB</span>
                </>
              )}
            </button>
            {galat && <p className="mt-2 text-xs font-medium text-red-600">{galat}</p>}
          </div>

          <div className="flex items-start justify-between gap-3 text-xs text-gray-500">
            <p>
              Kolom wajib: <span className="font-semibold text-gray-700">{TEMPLATE_CSV[bagian].kolomWajib[0]}</span> dan <span className="font-semibold text-gray-700">skor</span> (angka 0–10).
            </p>
            <button type="button" onClick={() => unduhCsv(TEMPLATE_CSV[bagian].nama, TEMPLATE_CSV[bagian].isi)} className="shrink-0 font-medium text-blue-600 hover:underline">
              Unduh template
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={tutup} className={TOMBOL_BATAL}>Batal</button>
          <button type="button" onClick={kirim} disabled={!file || membaca} className={TOMBOL_UTAMA}>
            {membaca && <Loader2 className="h-4 w-4 animate-spin" />} Unggah
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Baris({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold text-gray-900">{children}</div>
    </div>
  )
}

function KartuFile({ judul, keterangan, onUnduh, nonaktif }: { judul: string; keterangan: string; onUnduh: () => void; nonaktif?: boolean }) {
  return (
    <div className="rounded-[4px] bg-[#F9F9F9] p-4">
      <FileSpreadsheet className="h-4 w-4 text-gray-500" aria-hidden="true" />
      <p className="mt-2 text-sm font-semibold text-gray-900">{judul}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">{keterangan}</p>
      <button type="button" onClick={onUnduh} disabled={nonaktif} className={cn(TOMBOL_SEKUNDER, "mt-3")}>
        <Download className="h-3.5 w-3.5" /> Unduh File
      </button>
    </div>
  )
}

function DialogDetail({ unggahan: u, onTutup }: { unggahan: Unggahan | null; onTutup: () => void }) {
  return (
    <Dialog open={!!u} onOpenChange={(o) => !o && onTutup()}>
      <DialogContent className="sm:max-w-xl">
        {u && (
          <>
            <DialogHeader>
              <DialogTitle>Detail Unggahan Data</DialogTitle>
              <DialogDescription className="sr-only">Rincian file yang diunggah dan hasil pemrosesannya.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Baris label="Waktu Unggah"><span className="tabular-nums">{formatWaktu(u.waktu)}</span></Baris>
              <Baris label="Status"><StatusBadge status={u.status} /></Baris>
              <Baris label="Nama File">{u.namaFile}</Baris>
              <Baris label="Pengunggah">{u.pengunggah}</Baris>
              <Baris label="Tahun Data">{u.tahun}</Baris>
              <Baris label="Jenis Data">{labelBagian(u.bagian)}</Baris>
            </div>

            <div className="border-t border-[#D9DBDD] pt-4">
              <p className="mb-2 text-sm font-semibold text-gray-900">Hasil Pemrosesan</p>
              {u.status === "Diproses" ? (
                <div className="flex items-center gap-2 rounded-[4px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  <Loader2 className="h-4 w-4 animate-spin" /> File sedang diproses oleh sistem.
                </div>
              ) : u.status === "Gagal" ? (
                <div className="flex gap-2 rounded-[4px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Pemrosesan gagal</p>
                    <p className="mt-0.5 text-xs">{u.pesan}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 rounded-[4px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Pemrosesan berhasil</p>
                    <p className="mt-0.5 text-xs">{u.pesan}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <KartuFile
                judul="File Sebelum Diproses"
                keterangan="File asli yang diunggah oleh pengunggah."
                onUnduh={() => unduhCsv(u.namaFile, u.isiAsli)}
              />
              <KartuFile
                judul="File Setelah Diproses"
                keterangan="File balikan sistem yang memuat status dan keterangan tiap baris."
                onUnduh={() => unduhCsv(`hasil_${u.namaFile}`, u.isiHasil ?? prosesCsv(u.isiAsli, u.bagian).isiHasil)}
                nonaktif={u.status === "Diproses"}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
