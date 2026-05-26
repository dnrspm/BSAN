"use client"

import { useEffect, useState, useMemo } from "react"
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Eye,
  FileText,
  Plus,
  Search,
  Upload,
  X,
  XCircle,
  Clock,
  Users,
  Calendar,
  Image,
  Check,
  XCircle as XCircleIcon,
  ArrowRightLeft,
} from "lucide-react"
import { readAuthSession } from "@/lib/auth-session"

type StatusPelanggaran = "selesai" | "dihentikan" | "dilimpahkan"

interface PelanggaranItem {
  id: string
  namaSekolah: string
  unsurTerlibat: { laki: number; perempuan: number }
  tanggalTerjadi: string
  kategori: string
  dokumentasi: string[]
  rekomendasi: string
  status: StatusPelanggaran
  createdAt: string
  updatedAt: string
  dibuatOleh: string
}

const KATEGORI_PELANGGARAN = [
  "Perundungan (Bullying)",
  "Pelecehan Seksual",
  "Kekerasan Fisik",
  "Kekerasan Verbal",
  "Pencurian",
  "Vandalisme",
  "Penggunaan NAPZA",
  "Melanggar Aturan Sekolah",
  "Lainnya",
]

function StatusBadge({ status }: { status: StatusPelanggaran }) {
  switch (status) {
    case "selesai":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" /> Selesai
        </span>
      )
    case "dihentikan":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
          <XCircleIcon className="w-3 h-3" /> Dihentikan
        </span>
      )
    case "dilimpahkan":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          <ArrowRightLeft className="w-3 h-3" /> Dilimpahkan
        </span>
      )
  }
}

function DetailModal({ item, onClose, onUpdateStatus }: { item: PelanggaranItem; onClose: () => void; onUpdateStatus: (id: string, status: StatusPelanggaran) => void }) {
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<StatusPelanggaran>(item.status)

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 leading-tight">Detail Pelanggaran</h2>
              <StatusBadge status={item.status} />
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Nama Sekolah</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 ml-6">{item.namaSekolah}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500">Unsur Terlibat</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                L: {item.unsurTerlibat.laki} | P: {item.unsurTerlibat.perempuan}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500">Tanggal Terjadi</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(item.tanggalTerjadi).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">Kategori Pelanggaran</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 ml-6">{item.kategori}</p>
          </div>

          {item.dokumentasi.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Image className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500">Dokumentasi</span>
              </div>
              <div className="flex gap-2 mt-2 ml-6 flex-wrap">
                {item.dokumentasi.map((doc, i) => (
                  <a key={i} href={doc} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded">
                    Dokumen {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">Rekomendasi</span>
            </div>
            <p className="text-sm text-gray-900 ml-6 leading-relaxed">{item.rekomendasi}</p>
          </div>

          <div className="text-xs text-gray-400">
            Dibuat oleh: {item.dibuatOleh} pada {new Date(item.createdAt).toLocaleDateString("id-ID")}
          </div>
        </div>

        <div className="border-t border-gray-200 p-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedStatus(item.status)
              setShowStatusModal(true)
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            <Check className="w-4 h-4" /> Update Status
          </button>
        </div>
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowStatusModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Update Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {([
                { value: "selesai" as StatusPelanggaran, label: "Selesai", desc: "Kasus sudah ditangani dan resolved", color: "bg-green-500" },
                { value: "dihentikan" as StatusPelanggaran, label: "Dihentikan", desc: "Kasus dihentikan / tidak dilanjutkan", color: "bg-gray-500" },
                { value: "dilimpahkan" as StatusPelanggaran, label: "Dilimpahkan", desc: "Kasus dilimpahkan ke pihak lain", color: "bg-blue-500" },
              ] as { value: StatusPelanggaran; label: string; desc: string; color: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSelectedStatus(opt.value)
                    setShowStatusModal(false)
                    onUpdateStatus(item.id, opt.value)
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    selectedStatus === opt.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${opt.color} flex items-center justify-center text-white`}>
                      {opt.value === "selesai" && <CheckCircle className="w-4 h-4" />}
                      {opt.value === "dihentikan" && <XCircleIcon className="w-4 h-4" />}
                      {opt.value === "dilimpahkan" && <ArrowRightLeft className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function FormModal({ onClose, onSubmit, initialData }: { onClose: () => void; onSubmit: (data: Omit<PelanggaranItem, "id" | "createdAt" | "updatedAt" | "dibuatOleh">) => void; initialData?: PelanggaranItem }) {
  const [namaSekolah, setNamaSekolah] = useState(initialData?.namaSekolah ?? "")
  const [laki, setLaki] = useState(initialData?.unsurTerlibat.laki ?? 0)
  const [perempuan, setPerempuan] = useState(initialData?.unsurTerlibat.perempuan ?? 0)
  const [tanggal, setTanggal] = useState(initialData?.tanggalTerjadi?.split("T")[0] ?? "")
  const [kategori, setKategori] = useState(initialData?.kategori ?? "")
  const [dokumentasi, setDokumentasi] = useState<string[]>(initialData?.dokumentasi ?? [])
  const [dokumentasiInput, setDokumentasiInput] = useState("")
  const [rekomendasi, setRekomendasi] = useState(initialData?.rekomendasi ?? "")
  const [status, setStatus] = useState<StatusPelanggaran>(initialData?.status ?? "selesai")

  const handleAddDokumentasi = () => {
    if (dokumentasiInput.trim()) {
      setDokumentasi((prev) => [...prev, dokumentasiInput.trim()])
      setDokumentasiInput("")
    }
  }

  const removeDokumentasi = (index: number) => {
    setDokumentasi((prev) => prev.filter((_, i) => i !== index))
  }

  const canSubmit = namaSekolah.trim() && laki + perempuan > 0 && tanggal && kategori && rekomendasi.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    const session = readAuthSession()
    onSubmit({
      namaSekolah: namaSekolah.trim(),
      unsurTerlibat: { laki, perempuan },
      tanggalTerjadi: tanggal,
      kategori,
      dokumentasi,
      rekomendasi: rekomendasi.trim(),
      status,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{initialData ? "Edit" : "Buat"} Pelanggaran</h3>
              <p className="text-xs text-gray-500">Lengkapi formulir pelaporan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700">Nama Sekolah <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={namaSekolah}
              onChange={(e) => setNamaSekolah(e.target.value)}
              placeholder="Nama sekolah"
              className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Unsur yang Terlibat <span className="text-red-500">*</span></label>
            <div className="flex gap-4 mt-1">
              <div className="flex-1">
                <label className="text-xs text-gray-500">Laki-laki (L)</label>
                <input
                  type="number"
                  min="0"
                  value={laki}
                  onChange={(e) => setLaki(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">Perempuan (P)</label>
                <input
                  type="number"
                  min="0"
                  value={perempuan}
                  onChange={(e) => setPerempuan(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Kapan Terjadi <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Kategori Pelanggaran <span className="text-red-500">*</span></label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="" disabled>Pilih kategori</option>
              {KATEGORI_PELANGGARAN.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Dokumentasi <span className="text-gray-400">(opsional)</span></label>
            <div className="flex gap-2 mt-1">
              <input
                type="url"
                value={dokumentasiInput}
                onChange={(e) => setDokumentasiInput(e.target.value)}
                placeholder="https://..."
                className="flex-1 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <button
                type="button"
                onClick={handleAddDokumentasi}
                className="h-9 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>
            {dokumentasi.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {dokumentasi.map((doc, i) => (
                  <div key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                    <a href={doc} target="_blank" rel="noopener noreferrer" className="hover:underline">{doc.slice(0, 30)}...</a>
                    <button type="button" onClick={() => removeDokumentasi(i)} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Rekomendasi <span className="text-red-500">*</span></label>
            <textarea
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Tuliskan rekomendasi penanganan..."
              rows={4}
              className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusPelanggaran)}
              className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="selesai">Selesai</option>
              <option value="dihentikan">Dihentikan</option>
              <option value="dilimpahkan">Dilimpahkan</option>
            </select>
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
            {initialData ? "Simpan" : "Buat Pelanggaran"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function PelanggaranView() {
  const [list, setList] = useState<PelanggaranItem[]>([])
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<StatusPelanggaran | "semua">("semua")
  const [selected, setSelected] = useState<PelanggaranItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<PelanggaranItem | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    const stored = localStorage.getItem("pelanggaranList")
    if (stored) {
      setList(JSON.parse(stored))
    }
  }, [])

  const filtered = useMemo(() => {
    return list
      .filter((item) => {
        const matchSearch =
          search.trim() === "" ||
          item.namaSekolah.toLowerCase().includes(search.toLowerCase()) ||
          item.kategori.toLowerCase().includes(search.toLowerCase())
        const matchStatus = filterStatus === "semua" || item.status === filterStatus
        return matchSearch && matchStatus
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [list, search, filterStatus])

  const totalRows = filtered.length
  const totalPages = Math.ceil(totalRows / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows)
  const paginatedData = filtered.slice(startIndex, endIndex)

  const stats = useMemo(() => {
    return {
      total: list.length,
      selesai: list.filter((i) => i.status === "selesai").length,
      dihentikan: list.filter((i) => i.status === "dihentikan").length,
      dilimpahkan: list.filter((i) => i.status === "dilimpahkan").length,
    }
  }, [list])

  const saveList = (newList: PelanggaranItem[]) => {
    setList(newList)
    localStorage.setItem("pelanggaranList", JSON.stringify(newList))
  }

  const handleCreate = (data: Omit<PelanggaranItem, "id" | "createdAt" | "updatedAt" | "dibuatOleh">) => {
    const session = readAuthSession()
    const now = new Date().toISOString()
    const newItem: PelanggaranItem = {
      ...data,
      id: `pg-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      dibuatOleh: session?.namaSekolah ? `Admin Sekolah ${session.namaSekolah}` : "Admin Sekolah",
    }
    saveList([newItem, ...list])
    setShowForm(false)
  }

  const handleUpdate = (data: Omit<PelanggaranItem, "id" | "createdAt" | "updatedAt" | "dibuatOleh">) => {
    if (!editingItem) return
    const updated: PelanggaranItem = {
      ...editingItem,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    saveList(list.map((item) => (item.id === editingItem.id ? updated : item)))
    setShowForm(false)
    setEditingItem(undefined)
  }

  const handleUpdateStatus = (id: string, status: StatusPelanggaran) => {
    const updated = list.map((item) =>
      item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item
    )
    saveList(updated)
    setSelected(null)
  }

  const downloadCsv = () => {
    const rows = [
      ["Nama Sekolah", "L", "P", "Tanggal", "Kategori", "Status", "Rekomendasi", "Dibuat"].join(","),
      ...filtered.map((item) =>
        [
          `"${item.namaSekolah}"`,
          item.unsurTerlibat.laki,
          item.unsurTerlibat.perempuan,
          `"${item.tanggalTerjadi}"`,
          `"${item.kategori}"`,
          `"${item.status}"`,
          `"${item.rekomendasi}"`,
          `"${item.dibuatOleh}"`,
        ].join(",")
      ),
    ]
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pelanggaran-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterStatus])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Pelanggaran</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Pencatatan dan tracking kasus pelanggaran di sekolah</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={downloadCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> Ekspor CSV
          </button>
          <button
            onClick={() => {
              setEditingItem(undefined)
              setShowForm(true)
            }}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition"
          >
            <Plus className="w-4 h-4" /> Buat Pelanggaran
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats.selesai}</p>
            <p className="text-xs text-gray-500">Selesai</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
            <XCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats.dihentikan}</p>
            <p className="text-xs text-gray-500">Dihentikan</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats.dilimpahkan}</p>
            <p className="text-xs text-gray-500">Dilimpahkan</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 items-end flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari sekolah atau kategori"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as StatusPelanggaran | "semua")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="semua">Semua Status</option>
          <option value="selesai">Selesai</option>
          <option value="dihentikan">Dihentikan</option>
          <option value="dilimpahkan">Dilimpahkan</option>
        </select>
      </div>

      {totalRows === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="font-semibold text-gray-700 text-sm">Belum ada data pelanggaran</p>
          <p className="text-gray-500 text-xs mt-1">Klik "Buat Pelanggaran" untuk menambahkan data.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama Sekolah</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unsur (L/P)</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-gray-900">{item.namaSekolah}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-800">
                        {item.unsurTerlibat.laki} / {item.unsurTerlibat.perempuan}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-800">
                        {new Date(item.tanggalTerjadi).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelected(item)}
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Menampilkan {startIndex + 1}-{endIndex} dari {totalRows} data
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="px-3 py-1.5 text-xs font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={handleUpdateStatus}
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
