"use client"

import { useEffect, useState, useMemo } from "react"
import {
  FileText,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  Info,
  Calendar,
  ArrowLeft,
} from "lucide-react"
import { useRouter } from "next/navigation"

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
  periodeAwal: string
  periodeAkhir: string
  jumlahKasus: number | null
  skorAkhir: number | null
  tanggalSubmit: string | null
  status: StatusLaporan
  createdAt: string
  updatedAt: string
  dibuatOleh: string
  googleFormUrl: string
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
]

const DEFAULT_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform"

function getStatusFromPeriod(periodeAkhir: string): StatusLaporan {
  const now = new Date()
  let end: Date

  if (/^\d{4}-\d{2}-\d{2}$/.test(periodeAkhir)) {
    end = new Date(periodeAkhir + "T00:00:00")
  } else {
    const parts = periodeAkhir.match(/(\d+)\s+(\w+)\s+(\d+)/)
    if (parts) {
      const [, day, monthName, year] = parts
      const months: Record<string, string> = {
        Januari: "01", Februari: "02", Maret: "03", April: "04", Mei: "05", Juni: "06",
        Juli: "07", Agustus: "08", September: "09", Oktober: "10", November: "11", Desember: "12"
      }
      const month = months[monthName] || "01"
      end = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    } else {
      end = new Date(periodeAkhir)
    }
  }

  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())

  if (nowDate < endDate) return "terjadwal"
  if (nowDate > endDate) return "selesai"
  return "berlangsung"
}

function StatusBadge({ status }: { status: StatusLaporan }) {
  switch (status) {
    case "terjadwal":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          <Calendar className="w-3 h-3" /> Terjadwal
        </span>
      )
    case "berlangsung":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <Clock className="w-3 h-3" /> Berlangsung
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
  const [tahun, setTahun] = useState(initialData?.tahun ?? new Date().getFullYear().toString())
  const [periodeAwal, setPeriodeAwal] = useState(initialData?.periodeAwal ?? "2024-07-01")
  const [periodeAkhir, setPeriodeAkhir] = useState(initialData?.periodeAkhir ?? "2025-06-30")
  const [googleFormUrl, setGoogleFormUrl] = useState(initialData?.googleFormUrl ?? DEFAULT_FORM_URL)
  const [catatan, setCatatan] = useState(initialData?.catatan ?? "")

  const canSubmit = tahun && periodeAwal && periodeAkhir && googleFormUrl.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      tahun,
      periodeAwal,
      periodeAkhir,
      jumlahKasus: null,
      skorAkhir: null,
      tanggalSubmit: null,
      status: "terjadwal",
      googleFormUrl: googleFormUrl.trim(),
      catatan,
      sekolahYangMengisi: 0,
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
                {initialData ? "Edit Periode" : "Buat Periode Pengisian Baru"}
              </h3>
              <p className="text-xs text-gray-500">Tetapkan periode pengumpulan laporan akhir tahun</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700">Tahun <span className="text-red-500">*</span></label>
            <select
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y.toString()}>{y}</option>
              ))}
            </select>
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
              Google Form URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={googleFormUrl}
              onChange={(e) => setGoogleFormUrl(e.target.value)}
              placeholder="https://docs.google.com/forms/d/..."
              className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Buat Google Form untuk pengumpulan data, lalu masukkan URL form di sini.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Catatan</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan untuk admin sekolah (opsional)"
              rows={3}
              className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
            />
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Periode yang dibuat akan tersedia untuk diisi oleh Admin Sekolah.
                Pastikan URL Google Form sudah benar sebelum disimpan.
              </p>
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
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initialData ? "Simpan" : "Buat Periode"}
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
              <h2 className="text-sm font-bold text-gray-900 leading-tight">Detail Periode</h2>
              <p className="text-xs text-gray-500">Tahun {item.tahun}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <StatusBadge status={getStatusFromPeriod(item.periodeAkhir)} />

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Tahun</p>
                <p className="text-sm font-semibold text-gray-900">{item.tahun}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sekolah yang Mengisi</p>
                <p className="text-sm font-semibold text-gray-900">{item.sekolahYangMengisi}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500">Jadwal Pengisian Laporan</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDateDisplay(item.periodeAwal)} - {formatDateDisplay(item.periodeAkhir)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Google Form</p>
              <a
                href={item.googleFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buka Form
              </a>
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

          {item.catatan && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-xs text-yellow-700 font-semibold mb-1">Catatan</p>
              <p className="text-sm text-yellow-900">{item.catatan}</p>
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
            <ExternalLink className="w-4 h-4" /> Lihat Daftar Sekolah
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
                <h3 className="text-base font-bold text-gray-900 mb-2">Hapus Periode?</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Apakah Anda yakin ingin menghapus periode laporan "{item.tahun}"? Tindakan ini tidak dapat dibatalkan.
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

export function LaporanAkhirTahunPusatView() {
  const router = useRouter()
  const [list, setList] = useState<LaporanItem[]>([])
  const [selected, setSelected] = useState<LaporanItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<LaporanItem | undefined>(undefined)

  useEffect(() => {
    const stored = localStorage.getItem("laporanAkhirTahunList")
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LaporanItem[]
        if (!Array.isArray(parsed) || parsed.length === 0) {
          createDummyData()
        } else {
          const has2025 = parsed.some((item) => item.id === "laporan-2025")
          if (!has2025) {
            createDummyData(parsed)
          } else {
            setList(parsed)
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
      periodeAwal: "2024-07-01",
      periodeAkhir: "2025-06-30",
      jumlahKasus: 56,
      skorAkhir: 81,
      tanggalSubmit: "2025-06-30",
      status: "selesai",
      createdAt: "2024-07-01T00:00:00.000Z",
      updatedAt: "2025-06-30T00:00:00.000Z",
      dibuatOleh: "Admin Pusat",
      googleFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform",
      catatan: "Periode pelaporan tahun 2025 telah selesai.",
      sekolahYangMengisi: 20,
      daftarSekolah: DUMMY_SEKOLAH_2025,
      isOpened: true,
    }
    const dummy2026: LaporanItem = {
      id: "laporan-2026",
      tahun: "2026",
      periodeAwal: "2025-07-01",
      periodeAkhir: "2026-06-30",
      jumlahKasus: null,
      skorAkhir: null,
      tanggalSubmit: null,
      status: "berlangsung",
      createdAt: "2025-07-01T00:00:00.000Z",
      updatedAt: "2025-07-01T00:00:00.000Z",
      dibuatOleh: "Admin Pusat",
      googleFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform",
      catatan: "Periode pelaporan tahun 2026 sedang berlangsung.",
      sekolahYangMengisi: 0,
      daftarSekolah: [],
      isOpened: true,
    }
    const newList = existingList 
      ? [...existingList.filter(item => item.tahun !== "2025" && item.tahun !== "2026"), dummy2025, dummy2026]
      : [dummy2025, dummy2026]
    setList(newList)
    localStorage.setItem("laporanAkhirTahunList", JSON.stringify(newList))
  }

  const sortedList = useMemo(() => {
    return [...list].sort((a, b) => b.tahun.localeCompare(a.tahun))
  }, [list])

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
            <h2 className="text-xl font-bold text-gray-900">Laporan Akhir Tahun</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Kelola periode pengisian dan pantau pengumpulan dari sekolah
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              setEditingItem(undefined)
              setShowForm(true)
            }}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
          >
            <Plus className="w-4 h-4" /> Buat Periode
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200" />

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700 text-sm">Belum ada periode laporan</p>
          <p className="text-gray-500 text-xs mt-1">Klik "Buat Periode" untuk membuat periode laporan baru.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Periode</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jadwal Pengisian Laporan</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Sekolah Mengisi</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Formulir</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-gray-900">{item.tahun}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-800">
                      {formatDateDisplay(item.periodeAwal)} - {formatDateDisplay(item.periodeAkhir)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={getStatusFromPeriod(item.periodeAkhir)} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[40px] px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.sekolahYangMengisi > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {item.sekolahYangMengisi}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <a
                        href={item.googleFormUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Lihat
                      </a>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setEditingItem(item)
                            setShowForm(true)
                          }}
                          className="text-emerald-600 hover:underline text-sm flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => router.push(`/laporan-akhir-tahun/detail?id=${item.id}`)}
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Cek Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Petunjuk</p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1 ml-4 list-disc">
              <li>Klik "Buat Periode" untuk menambahkan periode pengisian baru yang harus diisi oleh sekolah.</li>
              <li>Status otomatis berubah berdasarkan tanggal periode: Terjadwal → Berlangsung → Selesai.</li>
              <li>Admin Sekolah bisa mengisi laporan hanya saat periode sedang Berlangsung.</li>
            </ul>
          </div>
        </div>
      </div>

      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onEdit={(item) => {
            setEditingItem(item)
            setShowForm(true)
          }}
          onDelete={handleDelete}
          onViewSekolah={(item) => router.push(`/laporan-akhir-tahun/detail?id=${item.id}`)}
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
    </div>
  )
}
