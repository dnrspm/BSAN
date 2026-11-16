"use client"

import { Fragment, useMemo, useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, ChevronRight, Download, Eye, FileSpreadsheet, FileText, Loader2, Plus, Search, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { readAuthSession } from "@/lib/auth-session"
import {
  BAGIAN_UNGGAH, formatWaktu, labelBagian, prosesCsv, TAHUN_PILIHAN, TEMPLATE_CSV, unduhCsv, useTahunUnggah, useUnggahan,
  type BagianUnggah, type StatusUnggah, type Unggahan,
} from "@/lib/unggah-indeks-bsan"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TablePagination } from "@/components/ui/table-pagination"

const BADGE: Record<StatusUnggah, string> = {
  Berhasil: "bg-emerald-300 text-emerald-950",
  Gagal: "bg-rose-100 text-rose-950",
  Diproses: "bg-sky-200 text-sky-950",
}

function StatusBadge({ status }: { status: StatusUnggah }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full whitespace-nowrap px-2.5 py-0.5 text-[13px] font-semibold", BADGE[status])}>
      {status === "Diproses" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status}
    </span>
  )
}

const TOMBOL_UTAMA =
  "flex h-9 items-center gap-1.5 rounded-[4px] bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
const TOMBOL_SEKUNDER =
  "inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#808489] bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-[#F9F9F9] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"

function ukuran(byte: number) {
  return byte < 1024 ? `${byte} B` : `${(byte / 1024).toFixed(1)} KB`
}

/** Jejak halaman; item tanpa `onClick` adalah halaman aktif. */
function Jejak({ item }: { item: { label: string; onClick?: () => void }[] }) {
  return (
    <Breadcrumb className="mb-5">
      <BreadcrumbList>
        {item.map((b, n) => (
          <Fragment key={b.label}>
            {n > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {b.onClick ? (
                <BreadcrumbLink asChild>
                  <button type="button" onClick={b.onClick} className="hover:underline">{b.label}</button>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{b.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/**
 * Unggah Data Indeks BSAN (Admin Pusat): pilih tahun, lihat riwayat file yang diunggah beserta pengunggah dan statusnya,
 * unggah file CSV baru, dan unduh file asli maupun file balikan sistem.
 */
export function UnggahIndeksBsanView({ onKembali }: { onKembali: () => void }) {
  const { daftar, tambah } = useUnggahan()
  const { tahun: tahunList, tambah: tambahTahun } = useTahunUnggah()
  const [tahun, setTahun] = useState<number | null>(null)
  const [bagian, setBagian] = useState<BagianUnggah>("sekolah")
  const [unggahBuka, setUnggahBuka] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const detail = daftar.find((u) => u.id === detailId) ?? null

  return (
    <div className="space-y-6">
      {tahun === null ? (
        <DaftarTahun daftar={daftar} tahunList={tahunList} onTambahTahun={tambahTahun} onKembali={onKembali} onPilih={setTahun} />
      ) : (
        <DetailTahun
          tahun={tahun}
          bagian={bagian}
          onBagian={setBagian}
          daftar={daftar.filter((u) => u.tahun === tahun && u.bagian === bagian)}
          onKembali={onKembali}
          onKeDaftar={() => setTahun(null)}
          onUnggah={() => setUnggahBuka(true)}
          onDetail={setDetailId}
        />
      )}

      {tahun !== null && (
        <DialogUnggah
          tahun={tahun}
          bagian={bagian}
          buka={unggahBuka}
          onTutup={() => setUnggahBuka(false)}
          onUnggah={(file, isi) => {
            tambah({ tahun, bagian, namaFile: file.name, pengunggah: readAuthSession()?.username ?? "admin.pusat", isiAsli: isi })
            setUnggahBuka(false)
          }}
        />
      )}
      <DialogDetail unggahan={detail} onTutup={() => setDetailId(null)} />
    </div>
  )
}

function DaftarTahun({
  daftar, tahunList, onTambahTahun, onKembali, onPilih,
}: {
  daftar: Unggahan[]
  tahunList: number[]
  onTambahTahun: (t: number) => void
  onKembali: () => void
  onPilih: (t: number) => void
}) {
  const [tambahBuka, setTambahBuka] = useState(false)
  const tersedia = TAHUN_PILIHAN.filter((t) => !tahunList.includes(t))
  const [pilihan, setPilihan] = useState<number | "">("")

  return (
    <>
      <div>
        <Jejak item={[{ label: "Indeks BSAN", onClick: onKembali }, { label: "Unggah Data" }]} />
        <h1 className="text-xl font-bold text-gray-900">Unggah Data Indeks BSAN</h1>
        <p className="mt-0.5 text-sm text-gray-500">Pilih tahun untuk melihat riwayat file yang diunggah atau mengunggah data baru.</p>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Tahun <span className="font-normal text-gray-400">({tahunList.length})</span>
          </h2>
          <button
            type="button"
            onClick={() => {
              setPilihan(tersedia[0] ?? "")
              setTambahBuka(true)
            }}
            disabled={tersedia.length === 0}
            className={TOMBOL_UTAMA}
          >
            <Plus className="h-4 w-4" /> Tambah Tahun
          </button>
        </div>
        <ul className="space-y-3">
          {tahunList.map((t) => {
            const file = daftar.filter((u) => u.tahun === t)
            const adaData = file.some((u) => u.status === "Berhasil")
            const terakhir = file.map((u) => u.waktu).sort().at(-1)
            return (
              <li key={t} className="flex items-center gap-4 rounded-[4px] border border-[#D9DBDD] bg-white p-5">
                <FileText className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">Data Indeks BSAN Tahun {t}</h3>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[13px] font-semibold", adaData ? "bg-emerald-300 text-emerald-950" : "bg-[#efefef] text-[#2f3031]")}>
                      {adaData ? "Sudah ada data" : "Belum ada data"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {file.length === 0
                      ? "Belum ada file yang diunggah."
                      : `${BAGIAN_UNGGAH.map((b) => `${b.label}: ${file.filter((u) => u.bagian === b.id).length} file`).join(" · ")} · terakhir ${formatWaktu(terakhir!)}`}
                  </p>
                </div>
                <button type="button" onClick={() => onPilih(t)} className={TOMBOL_SEKUNDER}>
                  Detail <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <Dialog open={tambahBuka} onOpenChange={setTambahBuka}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Tahun</DialogTitle>
            <DialogDescription>Pilih tahun data Indeks BSAN yang akan dibuka untuk unggah file.</DialogDescription>
          </DialogHeader>
          <label className="block text-sm text-gray-600">
            Tahun
            <select
              value={pilihan}
              onChange={(e) => setPilihan(Number(e.target.value))}
              className="mt-1.5 h-10 w-full rounded-[4px] border border-[#808489] bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tersedia.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setTambahBuka(false)} className="rounded-[4px] border border-[#808489] px-4 py-2 text-sm font-medium text-gray-700 hover:bg-[#F9F9F9]">
              Batal
            </button>
            <button
              type="button"
              disabled={pilihan === ""}
              onClick={() => {
                if (pilihan !== "") onTambahTahun(pilihan)
                setTambahBuka(false)
              }}
              className={TOMBOL_UTAMA}
            >
              Tambah
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DetailTahun({
  tahun, bagian, onBagian, daftar, onKembali, onKeDaftar, onUnggah, onDetail,
}: {
  tahun: number
  bagian: BagianUnggah
  onBagian: (b: BagianUnggah) => void
  daftar: Unggahan[]
  onKembali: () => void
  onKeDaftar: () => void
  onUnggah: () => void
  onDetail: (id: string) => void
}) {
  const [cari, setCari] = useState("")
  const [halaman, setHalaman] = useState(1)
  const [perHalaman, setPerHalaman] = useState(10)

  const terfilter = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return daftar
      .filter((u) => !q || u.namaFile.toLowerCase().includes(q) || u.pengunggah.toLowerCase().includes(q))
      .sort((a, b) => b.waktu.localeCompare(a.waktu))
  }, [daftar, cari])

  const totalHalaman = Math.max(1, Math.ceil(terfilter.length / perHalaman))
  const halamanAktif = Math.min(halaman, totalHalaman)
  const mulai = (halamanAktif - 1) * perHalaman

  return (
    <>
      <div>
        <Jejak item={[{ label: "Indeks BSAN", onClick: onKembali }, { label: "Unggah Data", onClick: onKeDaftar }, { label: `Tahun ${tahun}` }]} />
        <h1 className="text-xl font-bold text-gray-900">Data Indeks BSAN Tahun {tahun}</h1>
        <p className="mt-0.5 text-sm text-gray-500">Riwayat file yang diunggah untuk tahun {tahun}, lengkap dengan pengunggah dan hasil pemrosesannya.</p>
      </div>

      <div role="tablist" className="flex gap-6 border-b border-gray-200">
        {BAGIAN_UNGGAH.map((b) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={bagian === b.id}
            onClick={() => {
              onBagian(b.id)
              setHalaman(1)
              setCari("")
            }}
            className={cn(
              "-mb-px border-b-2 pb-3 text-sm font-medium transition-colors",
              bagian === b.id ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            {b.label}
          </button>
        ))}
      </div>

      <section className="rounded-[4px] border border-[#D9DBDD] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9DBDD] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Data {labelBagian(bagian)}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{BAGIAN_UNGGAH.find((b) => b.id === bagian)?.deskripsi}</p>
          </div>
          <button type="button" onClick={onUnggah} className={TOMBOL_UTAMA}>
            <Upload className="h-4 w-4" /> Unggah File {labelBagian(bagian)}
          </button>
        </div>

        <div className="border-b border-[#D9DBDD] px-5 py-3">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={cari}
              onChange={(e) => {
                setCari(e.target.value)
                setHalaman(1)
              }}
              placeholder="Cari nama file atau pengunggah"
              className="h-10 w-full rounded-[4px] border border-[#808489] bg-white pl-9 pr-3 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {terfilter.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
            <FileSpreadsheet className="h-8 w-8" />
            <p className="text-sm">{daftar.length === 0 ? `Belum ada file data ${labelBagian(bagian).toLowerCase()} yang diunggah untuk tahun ${tahun}.` : "Tidak ada file ditemukan"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed text-sm">
              <colgroup>
                <col className="w-[16%]" />
                <col />
                <col className="w-[22%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#D9DBDD] bg-[#F1F1F1] text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="px-5 py-3">Waktu Unggah</th>
                  <th className="px-3 py-3">Nama File</th>
                  <th className="px-3 py-3">Pengunggah</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DBDD]">
                {terfilter.slice(mulai, mulai + perHalaman).map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-[#F9F9F9]">
                    <td className="px-5 py-3.5 tabular-nums text-gray-600">{formatWaktu(u.waktu)}</td>
                    <td className="truncate px-3 py-3.5 font-medium text-gray-900" title={u.namaFile}>{u.namaFile}</td>
                    <td className="truncate px-3 py-3.5 text-gray-600" title={u.pengunggah}>{u.pengunggah}</td>
                    <td className="px-3 py-3.5"><StatusBadge status={u.status} /></td>
                    <td className="px-3 py-3.5 text-right">
                      <button type="button" onClick={() => onDetail(u.id)} className={TOMBOL_SEKUNDER}>
                        <Eye className="h-3.5 w-3.5" /> Detail
                      </button>
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
      </section>
    </>
  )
}

function DialogUnggah({
  tahun, bagian, buka, onTutup, onUnggah,
}: {
  tahun: number
  bagian: BagianUnggah
  buka: boolean
  onTutup: () => void
  onUnggah: (file: File, isi: string) => void
}) {
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
      onUnggah(file, isi)
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
          <DialogTitle>Unggah Data {labelBagian(bagian)}</DialogTitle>
          <DialogDescription>File CSV ini akan dipakai sebagai skor Indeks BSAN {labelBagian(bagian).toLowerCase()} untuk tahun yang dipilih.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <dl className="grid grid-cols-2 gap-4 rounded-[4px] bg-[#F9F9F9] px-4 py-3">
            <div>
              <dt className="text-xs text-gray-500">Tahun data</dt>
              <dd className="mt-0.5 font-semibold text-gray-900">{tahun}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Jenis data</dt>
              <dd className="mt-0.5 font-semibold text-gray-900">{labelBagian(bagian)}</dd>
            </div>
          </dl>

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
          <button type="button" onClick={tutup} className="rounded-[4px] border border-[#808489] px-4 py-2 text-sm font-medium text-gray-700 hover:bg-[#F9F9F9]">
            Batal
          </button>
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
