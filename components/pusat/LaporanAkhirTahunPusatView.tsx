"use client"

import { useEffect, useState, useMemo } from "react"
import {
  FileText,
  CheckCircle,
  Clock,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
  ExternalLink,
  Calendar,
  ArrowLeft,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { DIREKTORI_ENTITAS } from "@/data/direktoriInstansi"
import { normalizeNamaInstansi, purgeLegacyLaporan2026 } from "@/lib/laporan-instansi"

type StatusLaporan = "terjadwal" | "berlangsung" | "selesai"

interface SekolahIsian {
  id: string
  namaSekolah: string
  jumlahKasus: number
  skor: number
  googleFormResponseUrl: string
  tanggalSubmit: string
}

interface LaporanItem {
  id: string
  tahun: string
  judul?: string
  deskripsi?: string
  periodeAwal: string
  periodeAkhir: string
  jumlahKegiatan: number | null
  jumlahKasus: number | null
  skorAkhir: number | null
  tanggalSubmit: string | null
  status: StatusLaporan
  createdAt: string
  updatedAt: string
  dibuatOleh: string
  googleFormUrls: GoogleFormUrls
  googleFormUrl?: string
  catatan: string
  sekolahYangMengisi: number
  daftarSekolah: SekolahIsian[]
  isOpened: boolean
}

const DUMMY_SEKOLAH_2025: SekolahIsian[] = [
  { id: "sek-1", namaSekolah: "SMA Negeri 1 Banda Aceh", jumlahKasus: 3, skor: 85, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-20" },
  { id: "sek-2", namaSekolah: "SMA Negeri 2 Banda Aceh", jumlahKasus: 2, skor: 78, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-18" },
  { id: "sek-3", namaSekolah: "SMA Negeri 3 Lhokseumawe", jumlahKasus: 5, skor: 72, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-22" },
  { id: "sek-4", namaSekolah: "SMA Negeri 1 Sabang", jumlahKasus: 1, skor: 90, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-15" },
  { id: "sek-5", namaSekolah: "SMA Negeri 2 Langsa", jumlahKasus: 4, skor: 68, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-25" },
  { id: "sek-6", namaSekolah: "SMA Negeri 1 Aceh Besar", jumlahKasus: 6, skor: 75, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-21" },
  { id: "sek-7", namaSekolah: "SMA Negeri 1 Pidie", jumlahKasus: 2, skor: 82, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-19" },
  { id: "sek-8", namaSekolah: "SMA Negeri 1 Bireuen", jumlahKasus: 4, skor: 79, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-23" },
  { id: "sek-9", namaSekolah: "SMA Negeri 1 Aceh Utara", jumlahKasus: 2, skor: 88, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-17" },
  { id: "sek-10", namaSekolah: "SMA Negeri 2 Aceh Utara", jumlahKasus: 5, skor: 71, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-24" },
  { id: "sek-11", namaSekolah: "SMA Negeri 1 Simeulue", jumlahKasus: 1, skor: 92, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-16" },
  { id: "sek-12", namaSekolah: "SMA Negeri 1 Aceh Jaya", jumlahKasus: 3, skor: 76, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-20" },
  { id: "sek-13", namaSekolah: "SMA Negeri 1 Nagan Raya", jumlahKasus: 2, skor: 84, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-21" },
  { id: "sek-14", namaSekolah: "SMA Negeri 1 Aceh Barat", jumlahKasus: 6, skor: 69, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-22" },
  { id: "sek-15", namaSekolah: "SMA Negeri 1 Pidie Jaya", jumlahKasus: 3, skor: 81, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-18" },
  { id: "sek-16", namaSekolah: "SMA Negeri 1 Bener Meriah", jumlahKasus: 2, skor: 86, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-19" },
  { id: "sek-17", namaSekolah: "SMA Negeri 1 Aceh Tengah", jumlahKasus: 4, skor: 77, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-23" },
  { id: "sek-18", namaSekolah: "SMA Negeri 1 Gayo Lues", jumlahKasus: 1, skor: 94, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-14" },
  { id: "sek-19", namaSekolah: "SMA Negeri 1 Aceh Tenggara", jumlahKasus: 2, skor: 83, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-17" },
  { id: "sek-20", namaSekolah: "SMA Negeri 1 Langsa", jumlahKasus: 5, skor: 74, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-24" },
  { id: "sek-21", namaSekolah: "SDN 1 Banda Aceh", jumlahKasus: 2, skor: 88, googleFormResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform", tanggalSubmit: "2025-06-20" },
]

const DEFAULT_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform"

const JENJANG_FIELDS = [
  { key: "paud", label: "PAUD", short: "PAUD" },
  { key: "sd", label: "SD", short: "SD" },
  { key: "smp", label: "SMP", short: "SMP" },
  { key: "sma", label: "SMA", short: "SMA" },
  { key: "smk", label: "SMK", short: "SMK" },
  { key: "pkbm", label: "PKBM", short: "PKBM" },
  { key: "slb", label: "SLB", short: "SLB" },
  { key: "snt", label: "Sekolah Nasional Terintegrasi", short: "Sekolah Nasional Terintegrasi" },
  { key: "dinas", label: "Link untuk Dinas Pendidikan", short: "Dinas Pendidikan" },
] as const

type JenjangKey = (typeof JENJANG_FIELDS)[number]["key"]
type GoogleFormUrls = Record<JenjangKey, string>

function emptyFormUrls(defaultUrl = ""): GoogleFormUrls {
  return JENJANG_FIELDS.reduce(
    (acc, field) => ({ ...acc, [field.key]: defaultUrl }),
    {} as GoogleFormUrls
  )
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T00:00:00")
  }
  const parts = dateStr.match(/(\d+)\s+(\w+)\s+(\d+)/)
  if (parts) {
    const [, day, monthName, year] = parts
    const months: Record<string, string> = {
      Januari: "01", Februari: "02", Maret: "03", April: "04", Mei: "05", Juni: "06",
      Juli: "07", Agustus: "08", September: "09", Oktober: "10", November: "11", Desember: "12"
    }
    const month = months[monthName] || "01"
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }
  return new Date(dateStr)
}

function getStatusFromPeriod(periodeAwal: string, periodeAkhir: string): StatusLaporan {
  const now = new Date()
  const start = parseDate(periodeAwal)
  const end = parseDate(periodeAkhir)
  if (!start || !end) return "terjadwal"

  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())

  if (nowDate < startDate) return "terjadwal"
  if (nowDate > endDate) return "selesai"
  return "berlangsung"
}

function StatusBadge({ status }: { status: StatusLaporan }) {
  switch (status) {
    case "terjadwal":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          <Calendar className="w-3 h-3" /> Belum Dimulai
        </span>
      )
    case "berlangsung":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <Clock className="w-3 h-3" /> Sedang Berlangsung
        </span>
      )
    case "selesai":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
          <CheckCircle className="w-3 h-3" /> Selesai
        </span>
      )
  }
}

function formatDateDisplay(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
  }
  return dateStr
}

function FormModal({
  onClose,
  onSubmit,
  initialData,
}: {
  onClose: () => void
  onSubmit: (data: Omit<LaporanItem, "id" | "createdAt" | "updatedAt" | "dibuatOleh">) => void
  initialData?: LaporanItem
}) {
  const [judul, setJudul] = useState(initialData?.judul ?? "")
  const [deskripsi, setDeskripsi] = useState(initialData?.deskripsi ?? "")
  const [periodeAwal, setPeriodeAwal] = useState(initialData?.periodeAwal ?? "2024-07-01")
  const [periodeAkhir, setPeriodeAkhir] = useState(initialData?.periodeAkhir ?? "2025-06-30")
  const [googleFormUrls, setGoogleFormUrls] = useState<GoogleFormUrls>(
    initialData?.googleFormUrls ?? emptyFormUrls()
  )

  const canSubmit = Boolean(judul.trim() && periodeAwal && periodeAkhir)

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      tahun: periodeAkhir.slice(0, 4) || new Date().getFullYear().toString(),
      judul: judul.trim(),
      deskripsi: deskripsi.trim(),
      periodeAwal,
      periodeAkhir,
      jumlahKegiatan: null,
      jumlahKasus: null,
      skorAkhir: null,
      tanggalSubmit: null,
      status: "terjadwal",
      googleFormUrls: JENJANG_FIELDS.reduce(
        (acc, field) => ({ ...acc, [field.key]: (googleFormUrls[field.key] ?? "").trim() }),
        {} as GoogleFormUrls
      ),
      catatan: initialData?.catatan ?? "",
      sekolahYangMengisi: 0,
      daftarSekolah: [],
      isOpened: true,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {initialData ? "Edit Formulir Evaluasi" : "Buat Formulir Evaluasi"}
              </h3>
              <p className="text-xs text-gray-500">Tentukan judul, deskripsi, dan jadwal pengisian formulir evaluasi.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700">Judul <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Formulir Evaluasi Tahun 2025"
              className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Deskripsi</label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Deskripsi periode (opsional)"
              rows={3}
              className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700">Tanggal Mulai Pengisian <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={periodeAwal}
                onChange={(e) => setPeriodeAwal(e.target.value)}
                className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Tanggal Akhir Pengisian <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={periodeAkhir}
                onChange={(e) => setPeriodeAkhir(e.target.value)}
                className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">
              Link Google Form per Jenjang <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 mb-3">
              Isi dengan link Google Form untuk jenjang yang diperlukan saja. Dapat diisi menyusul jika diperlukan.
            </p>
            <div className="space-y-3">
              {JENJANG_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-gray-600">{field.label}</label>
                  <input
                    type="url"
                    value={googleFormUrls[field.key]}
                    onChange={(e) =>
                      setGoogleFormUrls((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder="https://docs.google.com/forms/d/..."
                    className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initialData ? "Simpan" : "Buat Formulir"}
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ item, onClose, onEdit, onDelete, onViewSekolah }: { item: LaporanItem; onClose: () => void; onEdit: (item: LaporanItem) => void; onDelete: (id: string) => void; onViewSekolah: (item: LaporanItem) => void }) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 leading-tight">Detail Formulir Evaluasi</h2>
              <p className="text-xs text-gray-500">{item.judul || `Tahun ${item.tahun}`}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      <StatusBadge status={getStatusFromPeriod(item.periodeAwal, item.periodeAkhir)} />

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Judul</p>
                <p className="text-sm font-semibold text-gray-900">{item.judul || item.tahun}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sekolah yang Mengisi</p>
                <p className="text-sm font-semibold text-gray-900">{item.sekolahYangMengisi}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500">Jadwal Pengisian Formulir</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDateDisplay(item.periodeAwal)} - {formatDateDisplay(item.periodeAkhir)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">Google Form per Jenjang</p>
              <div className="space-y-2">
                {JENJANG_FIELDS.map((field) => {
                  const url = item.googleFormUrls?.[field.key]
                  return (
                    <div key={field.key} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-600 min-w-0 truncate">{field.short}</span>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1 flex-shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Buka
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 flex-shrink-0">-</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500">Dibuat oleh</p>
              <p className="text-sm font-medium text-gray-900">{item.dibuatOleh}</p>
            </div>
          </div>

          {item.sekolahYangMengisi > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{item.jumlahKasus ?? "-"}</p>
                <p className="text-xs text-blue-600 mt-1">Total Kegiatan</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{item.jumlahKasus ?? "-"}</p>
                <p className="text-xs text-red-600 mt-1">Total Kasus</p>
              </div>
            </div>
          )}

          {(item.deskripsi || item.catatan) && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-xs text-yellow-700 font-semibold mb-1">Deskripsi</p>
              <p className="text-sm text-yellow-900">{item.deskripsi || item.catatan}</p>
            </div>
          )}

          <div className="text-xs text-gray-400">
            Dibuat pada {new Date(item.createdAt).toLocaleDateString("id-ID")}
          </div>
        </div>

        <div className="border-t border-gray-200 p-5 space-y-2">
          <button
            type="button"
            onClick={() => onViewSekolah(item)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            <ExternalLink className="w-4 h-4" /> Buka Daftar Sekolah
          </button>
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition"
          >
            <Trash2 className="w-4 h-4" /> Hapus
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
          >
            Tutup
          </button>
        </div>

        {showConfirmDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowConfirmDelete(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Hapus Formulir Evaluasi?</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Apakah Anda yakin ingin menghapus formulir evaluasi "{item.judul || item.tahun}"? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmDelete(false)
                      onDelete(item.id)
                    }}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function FormLinksModal({ item, onClose }: { item: LaporanItem; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
            <div>
              <h3 className="text-base font-bold text-gray-900">Link Google Form</h3>
              <p className="text-xs text-gray-500">{item.judul || `Tahun ${item.tahun}`}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {JENJANG_FIELDS.filter((field) => item.googleFormUrls?.[field.key]?.trim()).map((field) => {
              const url = item.googleFormUrls?.[field.key]
              return (
                <div key={field.key} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 last:border-0">
                  <span className="text-sm text-gray-700">{field.short}</span>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1 flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Buka
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 flex-shrink-0">Belum diisi</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

export function LaporanAkhirTahunPusatView({
  wilayahProvinsi,
}: { wilayahProvinsi?: string } = {}) {
  const router = useRouter()
  const isReadOnly = wilayahProvinsi !== undefined
  const [list, setList] = useState<LaporanItem[]>([])
  const [selected, setSelected] = useState<LaporanItem | null>(null)
  const [linksItem, setLinksItem] = useState<LaporanItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<LaporanItem | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<LaporanItem | null>(null)

  const normalizeList = (parsed: LaporanItem[]): LaporanItem[] =>
    parsed.map((item) => ({
      ...item,
      judul: item.judul ?? (item.id === "laporan-2025" ? "Formulir Evaluasi BSAN Tahun 2025" : undefined),
      deskripsi: item.deskripsi ?? (item.id === "laporan-2025" ? "Formulir evaluasi tahunan pelaksanaan program Bersama Sekolah Aman Nusantara (BSAN) periode Juli 2024 - Juni 2025. Sekolah dan dinas diharapkan mengisi formulir sesuai jenjang masing-masing sebelum batas akhir pengisian." : undefined),
      googleFormUrls:
        item.googleFormUrls ?? emptyFormUrls(item.googleFormUrl ?? DEFAULT_FORM_URL),
    }))

  useEffect(() => {
    purgeLegacyLaporan2026()
    const stored = localStorage.getItem("laporanAkhirTahunList")
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LaporanItem[]
        if (!Array.isArray(parsed) || parsed.length === 0) {
          createDummyData()
        } else {
          const normalized = normalizeList(parsed)
          const has2025 = normalized.some((item) => item.id === "laporan-2025")
          if (!has2025) {
            createDummyData(normalized)
          } else {
            setList(normalized)
            localStorage.setItem("laporanAkhirTahunList", JSON.stringify(normalized))
          }
        }
      } catch {
        createDummyData()
      }
    } else {
      createDummyData()
    }
  }, [])

  const createDummyData = (existingList?: LaporanItem[]) => {
    const dummy2025: LaporanItem = {
      id: "laporan-2025",
      tahun: "2025",
      judul: "Formulir Evaluasi BSAN Tahun 2025",
      deskripsi:
        "Formulir evaluasi tahunan pelaksanaan program Bersama Sekolah Aman Nusantara (BSAN) periode Juli 2024 - Juni 2025. Sekolah dan dinas diharapkan mengisi formulir sesuai jenjang masing-masing sebelum batas akhir pengisian.",
      periodeAwal: "2024-07-01",
      periodeAkhir: "2025-06-30",
      jumlahKegiatan: 84,
      jumlahKasus: 56,
      skorAkhir: 81,
      tanggalSubmit: "2025-06-30",
      status: "selesai",
      createdAt: "2024-07-01T00:00:00.000Z",
      updatedAt: "2025-06-30T00:00:00.000Z",
      dibuatOleh: "Admin Pusat",
      googleFormUrls: emptyFormUrls(DEFAULT_FORM_URL),
      catatan: "Periode pelaporan tahun 2025 telah selesai.",
      sekolahYangMengisi: 21,
      daftarSekolah: DUMMY_SEKOLAH_2025,
      isOpened: true,
    }
    const newList = existingList
      ? [...existingList.filter((item) => item.tahun !== "2025" && item.id !== "laporan-2025"), dummy2025]
      : [dummy2025]
    setList(newList)
    localStorage.setItem("laporanAkhirTahunList", JSON.stringify(newList))
  }

  const sortedList = useMemo(() => {
    return [...list].sort((a, b) => b.tahun.localeCompare(a.tahun))
  }, [list])

  const provinsiSekolah = useMemo(() => {
    const map = new Map<string, string>()
    DIREKTORI_ENTITAS.filter((e) => e.jenis === "sekolah").forEach((e) => {
      map.set(normalizeNamaInstansi(e.nama), e.provinsi)
    })
    return map
  }, [])

  const detailUrl = (id: string) =>
    wilayahProvinsi !== undefined
      ? `/laporan-akhir-tahun/detail?id=${id}&provinsi=${encodeURIComponent(wilayahProvinsi)}`
      : `/laporan-akhir-tahun/detail?id=${id}` // detail dihapus

  const saveList = (newList: LaporanItem[]) => {
    setList(newList)
    localStorage.setItem("laporanAkhirTahunList", JSON.stringify(newList))
  }

  const handleCreate = (data: Omit<LaporanItem, "id" | "createdAt" | "updatedAt" | "dibuatOleh">) => {
    const now = new Date().toISOString()
    const newItem: LaporanItem = {
      ...data,
      id: `laporan-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      dibuatOleh: "Admin Pusat",
    }
    saveList([newItem, ...list])
    setShowForm(false)
  }

  const handleUpdate = (data: Omit<LaporanItem, "id" | "createdAt" | "updatedAt" | "dibuatOleh">) => {
    if (!editingItem) return
    const updated: LaporanItem = {
      ...editingItem,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    saveList(list.map((item) => (item.id === editingItem.id ? updated : item)))
    setShowForm(false)
    setEditingItem(undefined)
  }

  const handleDelete = (id: string) => {
    const updated = list.filter((item) => item.id !== id)
    saveList(updated)
    setSelected(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Formulir Evaluasi</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {isReadOnly
              ? `Pantau pengumpulan formulir di wilayah kewenangan Anda (${wilayahProvinsi})`
              : "Kelola formulir evaluasi dan pantau pengumpulan isian sekolah"}
          </p>
        </div>
        {!isReadOnly && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setEditingItem(undefined)
                setShowForm(true)
              }}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" /> Buat Formulir
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200" />

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
            <p className="font-semibold text-gray-700 text-sm">Belum ada formulir evaluasi</p>
          <p className="text-gray-500 text-xs mt-1">
            {isReadOnly
              ? "Belum ada formulir evaluasi yang dibuat Admin Pusat."
              : 'Klik "Buat Formulir" untuk membuat formulir evaluasi baru.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Judul</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Deskripsi</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jadwal Pengisian Formulir</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Formulir</th>
                  {!isReadOnly && (
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-gray-900">{item.judul || `Tahun ${item.tahun}`}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600 max-w-xs">
                      <span className="line-clamp-2">{item.deskripsi || "-"}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-800">
                      {formatDateDisplay(item.periodeAwal)} - {formatDateDisplay(item.periodeAkhir)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={getStatusFromPeriod(item.periodeAwal, item.periodeAkhir)} />
                    </td>
                    <td className="px-4 py-3.5">
                      {(() => {
                        const tujuan = JENJANG_FIELDS.filter((f) => item.googleFormUrls?.[f.key]?.trim())
                        const belum = JENJANG_FIELDS.filter((f) => !item.googleFormUrls?.[f.key]?.trim())
                        const abbr = (f: (typeof JENJANG_FIELDS)[number]) =>
                          f.key === "snt" ? "SNT" : f.key === "dinas" ? "Dinas" : f.short
                        if (tujuan.length === 0) {
                          return <span className="text-xs text-gray-400">Belum terisi di semua jenjang</span>
                        }
                        return (
                          <div className="max-w-[260px] space-y-1">
                            <button
                              onClick={() => setLinksItem(item)}
                              className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Buka ({tujuan.length}/{belum.length})
                            </button>
                            <p className="text-xs text-gray-600">
                              {belum.length === 0
                                ? "Diisi di semua jenjang"
                                : `Diisi: ${tujuan.map(abbr).join(", ")}`}
                            </p>
                          </div>
                        )
                      })()}
                    </td>
                    {!isReadOnly && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setEditingItem(item)
                              setShowForm(true)
                            }}
                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="text-red-600 hover:underline text-sm flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onEdit={(item) => {
            setEditingItem(item)
            setShowForm(true)
          }}
          onDelete={handleDelete}
          onViewSekolah={(item) => router.push(detailUrl(item.id))}
        />
      )}

      {showForm && (
        <FormModal
          onClose={() => {
            setShowForm(false)
            setEditingItem(undefined)
          }}
          onSubmit={editingItem ? handleUpdate : handleCreate}
          initialData={editingItem}
        />
      )}

      {linksItem && (
        <FormLinksModal item={linksItem} onClose={() => setLinksItem(null)} />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Hapus Formulir Evaluasi?</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Apakah Anda yakin ingin menghapus formulir evaluasi <span className="font-medium text-gray-900">{deleteTarget.judul || deleteTarget.tahun}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDelete(deleteTarget.id)
                  setDeleteTarget(null)
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
