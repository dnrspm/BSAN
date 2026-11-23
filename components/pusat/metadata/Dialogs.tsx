"use client"

import { useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Lock, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  JENIS, daftarKode, formatWaktu, labelJenis, lengkap,
  type FileData, type Jenis, type Metadata,
} from "@/lib/metadata-bsan"
import { KOLOM, LencanaStatus, TOMBOL_MERAH, TOMBOL_PUTIH, TOMBOL_TAUTAN, TOMBOL_UTAMA } from "@/components/pusat/metadata/gaya"

const ukuran = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`)

function Kerangka({ judul, deskripsi, lebar = "sm:max-w-lg", children, onTutup }: { judul: string; deskripsi?: string; lebar?: string; children: React.ReactNode; onTutup: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onTutup()}>
      <DialogContent className={cn("max-h-[94vh] overflow-y-auto", lebar)}>
        <DialogHeader>
          <DialogTitle>{judul}</DialogTitle>
          <DialogDescription className={deskripsi ? undefined : "sr-only"}>{deskripsi ?? judul}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

const Aksi = ({ children }: { children: React.ReactNode }) => <div className="flex items-center justify-end gap-2">{children}</div>

/* ===== Tahun baru ===== */
export function DialogTahunBaru({ tahunAda, onTutup, onBuat }: { tahunAda: number[]; onTutup: () => void; onBuat: (tahun: number, salinDari: number | null) => void }) {
  const urut = [...tahunAda].sort((a, b) => b - a)
  const berikut = (urut[0] ?? new Date().getFullYear()) + 1
  const [tahun, setTahun] = useState(berikut)
  const [sumber, setSumber] = useState<string>(urut[0] ? String(urut[0]) : "kosong")
  return (
    <Kerangka judul="Tahun Baru" deskripsi="Tambah tahun baru dan pilih isi awal metadatanya." onTutup={onTutup}>
      <div className="space-y-4 text-sm">
        <label className="block text-gray-600">
          Tahun
          <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className={cn(KOLOM, "mt-1.5")}>
            {[berikut, berikut + 1, berikut + 2].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label className="block text-gray-600">
          Isi metadata
          <select value={sumber} onChange={(e) => setSumber(e.target.value)} className={cn(KOLOM, "mt-1.5")}>
            {urut.map((y) => <option key={y} value={y}>Salin dari {y}</option>)}
            <option value="kosong">Kosong</option>
          </select>
        </label>
      </div>
      <Aksi>
        <button type="button" onClick={onTutup} className={TOMBOL_PUTIH}>Batal</button>
        <button type="button" onClick={() => onBuat(tahun, sumber === "kosong" ? null : Number(sumber))} className={TOMBOL_UTAMA}>Buat</button>
      </Aksi>
    </Kerangka>
  )
}

/* ===== Buat metadata ===== */
export type SumberBuat = "other" | "prev" | "kosong"
export function DialogBuatMetadata({ tahun, jenis, adaLain, adaTahunLalu, onTutup, onBuat }: { tahun: number; jenis: Jenis; adaLain: boolean; adaTahunLalu: boolean; onTutup: () => void; onBuat: (s: SumberBuat) => void }) {
  const lain = jenis === "sekolah" ? "dinas" : "sekolah"
  const opsi: [SumberBuat, string][] = [
    ...(adaLain ? ([["other", `Salin dari ${labelJenis(lain)} ${tahun}`]] as [SumberBuat, string][]) : []),
    ...(adaTahunLalu ? ([["prev", `Salin dari ${labelJenis(jenis)} ${tahun - 1}`]] as [SumberBuat, string][]) : []),
    ["kosong", "Kosong"],
  ]
  const [s, setS] = useState<SumberBuat>(opsi[0][0])
  return (
    <Kerangka judul={`Buat Metadata ${labelJenis(jenis)} ${tahun}`} deskripsi="Pilih isi awal metadata." onTutup={onTutup}>
      <label className="block text-sm text-gray-600">
        Isi metadata
        <select value={s} onChange={(e) => setS(e.target.value as SumberBuat)} className={cn(KOLOM, "mt-1.5")}>
          {opsi.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <Aksi>
        <button type="button" onClick={onTutup} className={TOMBOL_PUTIH}>Batal</button>
        <button type="button" onClick={() => onBuat(s)} className={TOMBOL_UTAMA}>Buat</button>
      </Aksi>
    </Kerangka>
  )
}

/* ===== Unggah ===== */
export function DialogUnggah({
  tahun, meta, onTutup, onUnggah, onTemplate,
}: {
  tahun: number
  meta: Record<Jenis, Metadata | null>
  onTutup: () => void
  onUnggah: (jenis: Jenis, file: File) => Promise<void>
  onTemplate: (jenis: Jenis) => void
}) {
  const [jenis, setJenis] = useState<Jenis>(lengkap(meta.sekolah) ? "sekolah" : "dinas")
  const [file, setFile] = useState<File | null>(null)
  const [galat, setGalat] = useState("")
  const [proses, setProses] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const pilih = (f: File | undefined) => {
    setGalat("")
    if (!f) return setFile(null)
    if (!f.name.toLowerCase().endsWith(".xlsx")) { setFile(null); return setGalat("Format file harus .xlsx. Gunakan template yang diunduh dari halaman ini.") }
    if (f.size > 10 * 1024 * 1024) { setFile(null); return setGalat("Ukuran file maksimal 10 MB.") }
    setFile(f)
  }
  const kirim = async () => {
    if (!file) return
    setProses(true)
    try {
      await onUnggah(jenis, file)
    } catch {
      setGalat("File tidak dapat dibaca. Coba pilih ulang file.")
      setProses(false)
    }
  }

  return (
    <Kerangka judul="Unggah Data Indeks BSAN" deskripsi="Pilih jenis data, lalu unggah template yang sudah diisi." onTutup={onTutup}>
      <div className="space-y-4 text-sm">
        <div className="rounded-[4px] bg-[#F9F9F9] px-3 py-2.5 text-[13px] text-gray-500">Tahun data <b className="font-semibold text-gray-900">{tahun}</b></div>

        <fieldset>
          <legend className="text-gray-600">Jenis data</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {JENIS.map((j) => {
              const siap = lengkap(meta[j.id])
              return (
                <label
                  key={j.id}
                  title={siap ? undefined : `Lengkapi metadata ${j.label} dulu`}
                  className={cn(
                    "flex items-center gap-2 rounded-[4px] border px-3 py-2.5 font-medium transition-colors focus-within:ring-2 focus-within:ring-blue-500",
                    jenis === j.id ? "border-blue-600 bg-blue-50 text-blue-800" : "border-[#808489] text-gray-700",
                    siap ? "cursor-pointer hover:bg-[#F9F9F9]" : "cursor-not-allowed opacity-50"
                  )}
                >
                  <input type="radio" name="jenis-data" value={j.id} checked={jenis === j.id} disabled={!siap} onChange={() => setJenis(j.id)} className="accent-blue-600" />
                  {j.label}
                  {!siap && <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
                </label>
              )
            })}
          </div>
        </fieldset>

        <div>
          <input ref={input} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" aria-label="Pilih file template" onChange={(e) => pilih(e.target.files?.[0])} />
          <button
            type="button" onClick={() => input.current?.click()}
            className="flex w-full flex-col items-center gap-1.5 rounded-[4px] border border-dashed border-[#808489] bg-white px-4 py-7 text-center transition hover:bg-[#F9F9F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {file ? <FileSpreadsheet className="h-6 w-6 text-emerald-600" /> : <Upload className="h-6 w-6 text-gray-400" />}
            {file ? (
              <>
                <span className="font-medium text-gray-900">{file.name}</span>
                <span className="text-xs text-gray-500">{ukuran(file.size)} · klik untuk mengganti file</span>
              </>
            ) : (
              <>
                <span className="font-medium text-gray-900">Pilih file template yang sudah diisi</span>
                <span className="text-xs text-gray-500">.xlsx · maksimal 10 MB</span>
              </>
            )}
          </button>
          {galat && <p className="mt-2 text-xs font-medium text-red-600" role="alert">{galat}</p>}
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={() => onTemplate(jenis)} className={TOMBOL_TAUTAN}><Download className="h-3.5 w-3.5" /> Unduh template</button>
        </div>
      </div>
      <Aksi>
        <button type="button" onClick={onTutup} className={TOMBOL_PUTIH}>Batal</button>
        <button type="button" onClick={kirim} disabled={!file || proses} className={TOMBOL_UTAMA}>
          {proses && <Loader2 className="h-4 w-4 animate-spin" />} Unggah
        </button>
      </Aksi>
    </Kerangka>
  )
}

/* ===== Pratinjau template ===== */
export function DialogTemplate({ tahun, jenis, meta, onTutup, onUnduh }: { tahun: number; jenis: Jenis; meta: Metadata; onTutup: () => void; onUnduh: () => Promise<void> }) {
  const [proses, setProses] = useState(false)
  const sch = jenis === "sekolah"
  const kodes = daftarKode(meta)
  const kepala = sch ? ["npsn", "nama_sekolah", "kode_metadata", "judul", "nilai", "kategori", "rekomendasi"] : ["level", "kode_wilayah", "nama_daerah", "kode_metadata", "judul", "nilai", "kategori", "rekomendasi"]
  const otomatis = new Set(["judul", "kategori"])
  const potong = (s: string) => (s.length > 26 ? `${s.slice(0, 26)}…` : s)
  const baris = sch
    ? [["10100000", "TK Negeri 1 Banda Aceh", kodes[0].item.kode, "Indeks BSAN", "5,1", "Rendah", ""], ["10100000", "TK Negeri 1 Banda Aceh", kodes[1]?.item.kode ?? "", potong(kodes[1]?.item.judul ?? ""), "3,1", "Rendah", ""]]
    : [["Provinsi", "11", "Aceh", kodes[0].item.kode, "Indeks BSAN", "7,9", "Sedang", ""], ["Kab/Kota", "11.71", "Banda Aceh", kodes[1]?.item.kode ?? "", potong(kodes[1]?.item.judul ?? ""), "9,0", "Tinggi", ""]]
  const unduh = async () => {
    setProses(true)
    try { await onUnduh() } finally { setProses(false) }
  }
  const cek = [
    `Kode metadata: pilih dari dropdown (${kodes.length} kode)`,
    "Nilai dicek sesuai rentang tiap kode",
    "Judul dan kategori terisi otomatis",
    sch ? "NPSN 8 digit" : "Level: dropdown Provinsi / Kab/Kota",
  ]
  return (
    <Kerangka judul={`Template Data ${labelJenis(jenis)} ${tahun}`} deskripsi={`Isi satu baris per ${sch ? "sekolah" : "daerah"} per kode. Kolom abu-abu terisi otomatis.`} lebar="sm:max-w-[760px]" onTutup={onTutup}>
      <div className="overflow-x-auto rounded-[4px] border border-[#c8ccd1] text-xs">
        <table className="w-full border-collapse" aria-label="Contoh isi template">
          <thead>
            <tr>{kepala.map((h) => <th key={h} scope="col" className="whitespace-nowrap border border-[#e1e4e8] bg-[#1F4E78] px-2 py-1.5 text-left font-bold text-white">{h}</th>)}</tr>
          </thead>
          <tbody>
            {baris.map((r, i) => (
              <tr key={i}>{r.map((c, j) => <td key={j} className={cn("whitespace-nowrap border border-[#e1e4e8] px-2 py-1.5", otomatis.has(kepala[j]) && "bg-[#F2F2F2] italic text-gray-500")}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
        <div className="flex border-t border-[#c8ccd1] bg-gray-100 text-[11.5px] text-gray-600">
          <span className="border-b-2 border-green-600 bg-white px-3 py-1.5 font-bold text-green-800">Data {labelJenis(jenis)}</span>
          <span className="border-r border-[#d9dbdd] px-3 py-1.5">Daftar Kode</span>
          <span className="px-3 py-1.5">Kategori</span>
        </div>
      </div>
      <ul className="grid gap-x-4 gap-y-1.5 text-[13px] text-gray-700 sm:grid-cols-2">
        {cek.map((t) => (
          <li key={t} className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />{t}</li>
        ))}
      </ul>
      <Aksi>
        <button type="button" onClick={onTutup} className={TOMBOL_PUTIH}>Batal</button>
        <button type="button" onClick={unduh} disabled={proses} className={TOMBOL_UTAMA}>
          {proses ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Unduh Template (.xlsx)
        </button>
      </Aksi>
    </Kerangka>
  )
}

/* ===== Hapus file ===== */
export function DialogHapusFile({ file, tahun, adaFileLama, onTutup, onHapus }: { file: FileData; tahun: number; adaFileLama: boolean; onTutup: () => void; onHapus: () => void }) {
  const [paham, setPaham] = useState(false)
  const gagal = file.status === "Gagal"
  const satuan = file.jenis === "sekolah" ? "Sekolah" : "Daerah"
  return (
    <Kerangka judul="Hapus file?" deskripsi={file.nama} onTutup={onTutup}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[4px] bg-[#F9F9F9] px-3 py-2.5 text-[13px] text-gray-500">
        <b className="break-all font-semibold text-gray-900">{file.nama}</b>
        <span>{labelJenis(file.jenis)} {tahun}</span>
        <LencanaStatus status={file.status} />
      </div>
      {gagal ? (
        <p className="text-sm text-gray-600">File ini gagal diproses, jadi tidak ada data yang ikut terhapus.</p>
      ) : (
        <>
          <div className="flex gap-2.5 rounded-[4px] border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              <b>{file.n} data {file.jenis}</b> dari file ini dihapus.{" "}
              {adaFileLama
                ? `${satuan} yang juga ada di file sebelumnya kembali ke nilai lama; sisanya hilang dari dashboard.`
                : "Data tersebut hilang dari dashboard Satdik, Dinas, UPT, dan pusat."}{" "}
              Tindakan ini tidak bisa dibatalkan.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={paham} onChange={(e) => setPaham(e.target.checked)} className="accent-blue-600" /> Saya mengerti data tersebut akan hilang
          </label>
        </>
      )}
      <Aksi>
        <button type="button" onClick={onTutup} className={TOMBOL_PUTIH}>Batal</button>
        <button type="button" onClick={onHapus} disabled={!gagal && !paham} className={TOMBOL_MERAH}>Hapus File</button>
      </Aksi>
    </Kerangka>
  )
}

/* ===== Detail file ===== */
const Baris = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <div className="mt-1 break-words text-sm font-semibold text-gray-900">{children}</div>
  </div>
)

export function DialogDetailFile({ file, tahun, onTutup }: { file: FileData; tahun: number; onTutup: () => void }) {
  return (
    <Kerangka judul="Detail Unggahan Data" deskripsi="Rincian file yang diunggah dan hasil pemrosesannya." lebar="sm:max-w-xl" onTutup={onTutup}>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Baris label="Waktu Unggah"><span className="tabular-nums">{formatWaktu(file.waktu)}</span></Baris>
        <Baris label="Status"><LencanaStatus status={file.status} /></Baris>
        <Baris label="Nama File">{file.nama}</Baris>
        <Baris label="Pengunggah">{file.pengunggah}</Baris>
        <Baris label="Tahun Data">{tahun}</Baris>
        <Baris label="Jenis Data">{labelJenis(file.jenis)}</Baris>
      </div>
      <div className="border-t border-[#D9DBDD] pt-4">
        <p className="mb-2 text-sm font-semibold text-gray-900">Hasil Pemrosesan</p>
        {file.status === "Diproses" ? (
          <div className="flex items-center gap-2 rounded-[4px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"><Loader2 className="h-4 w-4 animate-spin" /> File sedang diproses oleh sistem.</div>
        ) : (
          <div className={cn("flex gap-2 rounded-[4px] border px-4 py-3 text-sm", file.status === "Gagal" ? "border-red-200 bg-red-50 text-red-900" : "border-emerald-200 bg-emerald-50 text-emerald-900")}>
            {file.status === "Gagal" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <div>
              <p className="font-semibold">{file.status === "Gagal" ? "Pemrosesan gagal" : "Pemrosesan berhasil"}</p>
              <p className="mt-0.5 text-xs">{file.pesan}</p>
            </div>
          </div>
        )}
        {file.galat.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-semibold text-gray-700">Baris yang perlu diperbaiki{file.galat.length >= 50 ? " (50 pertama)" : ""}</p>
            <ul className="max-h-40 list-disc overflow-y-auto rounded-[4px] bg-[#F9F9F9] py-2 pl-7 pr-3 text-xs text-gray-700">
              {file.galat.map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          </div>
        )}
      </div>
    </Kerangka>
  )
}
