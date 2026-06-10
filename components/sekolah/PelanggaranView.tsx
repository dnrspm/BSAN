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
  GraduationCap,
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
} from "lucide-react"
import { readAuthSession } from "@/lib/auth-session"

type StatusPelanggaran = "baru" | "proses" | "selesai"

interface UnsurItem {
  kategori: string
  jumlah: string
}

interface PelanggaranItem {
  id: string
  namaSekolah: string[]
  unsurTerlibat: UnsurItem[]
  tanggalTerjadi: string
  kategori: string
  dokumentasi: string
  rekomendasi: string
  status: StatusPelanggaran
  createdAt: string
  updatedAt: string
  dibuatOleh: string
}

const SEKOLAH_OPTIONS = [
  "SDN 1 Banda Aceh",
  "SDN 2 Banda Aceh",
  "SMPN 1 Banda Aceh",
  "SMAN 1 Banda Aceh",
  "SMKN 1 Banda Aceh",
  "SDN 1 Medan",
  "SMPN 2 Jakarta Pusat",
  "SMAN 3 Surabaya",
  "SDN 4 Bandung",
  "SMPN 5 Yogyakarta",
  "SMKN 2 Semarang",
  "SDN 1 Denpasar",
  "SMPN 3 Makassar",
  "SMAN 2 Palembang",
]

function getSekolahColors(name: string) {
  const lower = name.toLowerCase()
  if (lower.startsWith("sdn") || lower.startsWith("sd ")) return { bg: "bg-amber-500/10", text: "text-amber-700" }
  if (lower.startsWith("smpn") || lower.startsWith("smp ")) return { bg: "bg-blue-500/10", text: "text-blue-700" }
  if (lower.startsWith("sman") || lower.startsWith("smkn") || lower.startsWith("sma ") || lower.startsWith("smk ")) return { bg: "bg-emerald-500/10", text: "text-emerald-700" }
  return { bg: "bg-gray-500/10", text: "text-gray-700" }
}

const UNSUR_OPTIONS = ["Siswa Laki-laki", "Siswa Perempuan", "Guru", "Staff", "Lainnya"]

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
    case "baru":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          <FileText className="w-3 h-3" /> Baru
        </span>
      )
    case "proses":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" /> Proses
        </span>
      )
    case "selesai":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" /> Selesai
        </span>
      )
  }
}

function DetailModal({ item, onClose, onUpdateStatus, readOnly }: { item: PelanggaranItem; onClose: () => void; onUpdateStatus: (id: string, status: StatusPelanggaran) => void; readOnly?: boolean }) {
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
              <GraduationCap className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Nama Sekolah</span>
            </div>
            <div className="ml-6 flex flex-wrap gap-1.5">
              {item.namaSekolah.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                  <GraduationCap className="w-3 h-3 text-gray-400" />
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">Unsur Terlibat</span>
            </div>
            <div className="ml-6 space-y-1">
              {(Array.isArray(item.unsurTerlibat) ? item.unsurTerlibat : []).map((u, i) => (
                <p key={i} className="text-sm font-semibold text-gray-900">
                  {u.kategori}: {u.jumlah} org
                </p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          {item.dokumentasi && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Image className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500">Dokumentasi</span>
              </div>
              <p className="text-sm text-gray-900 ml-6">{item.dokumentasi}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">Detail Kasus</span>
            </div>
            <p className="text-sm text-gray-900 ml-6 leading-relaxed">{item.rekomendasi}</p>
          </div>

          <div className="text-xs text-gray-400">
            Dibuat oleh: {item.dibuatOleh} pada {new Date(item.createdAt).toLocaleDateString("id-ID")}
          </div>
        </div>

        {!readOnly && (
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
        )}
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
                { value: "baru" as StatusPelanggaran, label: "Baru", desc: "Laporan baru masuk, belum ditindaklanjuti", color: "bg-blue-500" },
                { value: "proses" as StatusPelanggaran, label: "Proses", desc: "Kasus sedang dalam proses penanganan", color: "bg-amber-500" },
                { value: "selesai" as StatusPelanggaran, label: "Selesai", desc: "Kasus sudah ditangani dan selesai", color: "bg-green-500" },
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
                      {opt.value === "baru" && <FileText className="w-4 h-4" />}
                      {opt.value === "proses" && <Clock className="w-4 h-4" />}
                      {opt.value === "selesai" && <CheckCircle className="w-4 h-4" />}
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
  const [namaSekolah, setNamaSekolah] = useState<string[]>(initialData?.namaSekolah ?? [])
  const [sekolahInput, setSekolahInput] = useState("")
  const [showSekolahDropdown, setShowSekolahDropdown] = useState(false)
  const [unsurTerlibat, setUnsurTerlibat] = useState<UnsurItem[]>(
    Array.isArray(initialData?.unsurTerlibat)
      ? initialData!.unsurTerlibat
      : initialData?.unsurTerlibat
        ? [{ kategori: "Siswa Laki-laki", jumlah: String((initialData.unsurTerlibat as any).laki ?? 0) }, { kategori: "Siswa Perempuan", jumlah: String((initialData.unsurTerlibat as any).perempuan ?? 0) }]
        : [{ kategori: "", jumlah: "" }]
  )
  const [tanggal, setTanggal] = useState(initialData?.tanggalTerjadi?.split("T")[0] ?? "")
  const [kategori, setKategori] = useState(initialData?.kategori ?? "")
  const [dokumentasi, setDokumentasi] = useState(initialData?.dokumentasi ?? "")
  const [rekomendasi, setRekomendasi] = useState(initialData?.rekomendasi ?? "")
  const [status, setStatus] = useState<StatusPelanggaran>(initialData?.status ?? "baru")

  const allSchoolSuggestions = useMemo(() => {
    const names = new Set<string>()
    SEKOLAH_OPTIONS.forEach((s) => names.add(s))
    try {
      const stored = localStorage.getItem("pelanggaranList")
      if (stored) {
        const parsed: PelanggaranItem[] = JSON.parse(stored)
        parsed.forEach((item) => {
          const list = Array.isArray(item.namaSekolah) ? item.namaSekolah : [item.namaSekolah]
          list.forEach((s) => { if (s.trim()) names.add(s.trim()) })
        })
      }
    } catch { /* ignore */ }
    return Array.from(names).sort()
  }, [])

  const filteredSekolahOptions = sekolahInput
    ? allSchoolSuggestions.filter((s) => s.toLowerCase().includes(sekolahInput.toLowerCase()) && !namaSekolah.includes(s))
    : allSchoolSuggestions.filter((s) => !namaSekolah.includes(s))

  const addSekolah = (name: string) => {
    const trimmed = name.trim()
    if (trimmed && !namaSekolah.includes(trimmed)) {
      setNamaSekolah((prev) => [...prev, trimmed])
    }
    setSekolahInput("")
    setShowSekolahDropdown(false)
  }

  const removeSekolah = (index: number) => {
    setNamaSekolah((prev) => prev.filter((_, i) => i !== index))
  }

  const canSubmit = namaSekolah.length > 0 && unsurTerlibat.some((u) => u.kategori && u.jumlah) && tanggal && kategori && rekomendasi.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      namaSekolah,
      unsurTerlibat: unsurTerlibat.filter((u) => u.kategori && u.jumlah),
      tanggalTerjadi: tanggal,
      kategori,
      dokumentasi: dokumentasi.trim(),
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
            <div className="relative mt-1">
              <input
                type="text"
                value={sekolahInput}
                onChange={(e) => { setSekolahInput(e.target.value); setShowSekolahDropdown(true) }}
                onFocus={() => setShowSekolahDropdown(true)}
                onClick={() => setShowSekolahDropdown(true)}
                onBlur={() => setTimeout(() => setShowSekolahDropdown(false), 200)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSekolah(sekolahInput) } }}
                placeholder="Tambah nama sekolah"
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              {showSekolahDropdown && filteredSekolahOptions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredSekolahOptions.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addSekolah(o)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                    >
                      {o}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {namaSekolah.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-3">
                {namaSekolah.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 px-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 flex-1">{s}</span>
                    <button type="button" onClick={() => removeSekolah(i)} className="p-0.5 hover:bg-gray-200 rounded-full">
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            <label className="text-xs font-semibold text-gray-700">Detail Kasus <span className="text-red-500">*</span></label>
            <textarea
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Tuliskan detail kasus..."
              rows={4}
              className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Unsur yang Terlibat <span className="text-red-500">*</span></label>
            <div className="flex flex-col gap-3 mt-1">
              {unsurTerlibat.map((u, i) => {
                const predefined = UNSUR_OPTIONS.filter((o) => o !== "Lainnya")
                const isCustom = u.kategori && !predefined.includes(u.kategori)
                const displayValue = isCustom ? "Lainnya" : u.kategori
                const takenByOthers = unsurTerlibat
                  .filter((_, idx) => idx !== i)
                  .map((r) => r.kategori)
                  .filter((k) => predefined.includes(k))
                const availableOptions = ["Lainnya", ...predefined.filter((opt) => !takenByOthers.includes(opt))]
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      <select
                        value={displayValue}
                        onChange={(e) => {
                          const next = [...unsurTerlibat]
                          next[i] = { ...next[i], kategori: e.target.value }
                          setUnsurTerlibat(next)
                        }}
                        className="flex-1 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="" disabled>Pilih unsur</option>
                        {availableOptions.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                      {displayValue === "Lainnya" && (
                        <input
                          value={u.kategori !== "Lainnya" ? u.kategori : ""}
                          onChange={(e) => {
                            const next = [...unsurTerlibat]
                            next[i] = { ...next[i], kategori: e.target.value }
                            setUnsurTerlibat(next)
                          }}
                          placeholder="Tulis unsur..."
                          className="flex-1 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={u.jumlah}
                      onChange={(e) => {
                        const next = [...unsurTerlibat]
                        next[i] = { ...next[i], jumlah: e.target.value }
                        setUnsurTerlibat(next)
                      }}
                      placeholder="Jml"
                      className="w-20 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">org</span>
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => setUnsurTerlibat((prev) => prev.filter((_, idx) => idx !== i))}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}
              <button
                type="button"
                onClick={() => setUnsurTerlibat((prev) => [...prev, { kategori: "", jumlah: "" }])}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg px-3 py-2 transition w-full justify-center"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Unsur
              </button>
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
            <label className="text-xs font-semibold text-gray-700">Status Pelanggaran</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusPelanggaran)}
              className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="baru">Baru</option>
              <option value="proses">Proses</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Dokumentasi <span className="text-gray-400">(opsional)</span></label>
            <input
              type="text"
              value={dokumentasi}
              onChange={(e) => setDokumentasi(e.target.value)}
              placeholder="Link atau keterangan dokumentasi..."
              className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
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

export function PelanggaranView({ readOnly, editId }: { readOnly?: boolean; editId?: string }) {
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
      try {
        const parsed: PelanggaranItem[] = JSON.parse(stored)
        const normalized = parsed.map((item) => {
          const unsur = Array.isArray(item.unsurTerlibat)
            ? item.unsurTerlibat
            : [{ kategori: "Laki-laki", jumlah: String((item.unsurTerlibat as any)?.laki ?? 0) }, { kategori: "Perempuan", jumlah: String((item.unsurTerlibat as any)?.perempuan ?? 0) }].filter((u) => parseInt(u.jumlah) > 0)
          return {
            ...item,
            namaSekolah: Array.isArray(item.namaSekolah) ? item.namaSekolah : [item.namaSekolah],
            unsurTerlibat: unsur,
            dokumentasi: Array.isArray(item.dokumentasi) ? item.dokumentasi[0] ?? "" : item.dokumentasi,
          }
        })
        setList(normalized)
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (!editId || list.length === 0) return
    const found = list.find((i) => i.id === editId)
    if (found) {
      window.location.href = `/tambah-pelanggaran?edit=${editId}`
    }
  }, [editId, list])

  const filtered = useMemo(() => {
    return list
      .filter((item) => {
        const sekolahList = Array.isArray(item.namaSekolah) ? item.namaSekolah : [item.namaSekolah]
        const matchSearch =
          search.trim() === "" ||
          sekolahList.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
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
      baru: list.filter((i) => i.status === "baru").length,
      proses: list.filter((i) => i.status === "proses").length,
      selesai: list.filter((i) => i.status === "selesai").length,
    }
  }, [list])

  const saveList = (newList: PelanggaranItem[]) => {
    setList(newList)
    localStorage.setItem("pelanggaranList", JSON.stringify(newList))
  }

  const handleCreate = (data: Omit<PelanggaranItem, "id" | "createdAt" | "updatedAt" | "dibuatOleh">) => {
    const session = readAuthSession()
    const now = new Date().toISOString()
    const dibuatOleh = session?.role === "dinas"
      ? `Admin Dinas ${session.namaDinas ?? ""}`
      : session?.namaSekolah
        ? `Admin Sekolah ${session.namaSekolah}`
        : "Admin Sekolah"
    const newItem: PelanggaranItem & { logStatus?: { status: StatusPelanggaran; keterangan: string; waktu: string }[] } = {
      ...data,
      id: `pg-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      dibuatOleh,
      logStatus: [{ status: data.status, keterangan: "Laporan awal dibuat", waktu: now }],
    }
    saveList([newItem as PelanggaranItem, ...list])
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
      ["Nama Sekolah", "Unsur Terlibat", "Tanggal", "Kategori", "Status", "Detail Kasus", "Dibuat"].join(","),
      ...filtered.map((item) =>
        [
          `"${(Array.isArray(item.namaSekolah) ? item.namaSekolah : [item.namaSekolah]).join("; ")}"`,
          `"${(Array.isArray(item.unsurTerlibat) ? item.unsurTerlibat : []).map((u) => `${u.kategori}: ${u.jumlah}`).join("; ")}"`,
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
          {!readOnly && (
            <a
              href="/tambah-pelanggaran?create"
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" /> Buat Pelanggaran
            </a>
          )}
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
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats.baru}</p>
            <p className="text-xs text-gray-500">Baru</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats.proses}</p>
            <p className="text-xs text-gray-500">Proses</p>
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
          <option value="baru">Baru</option>
          <option value="proses">Proses</option>
          <option value="selesai">Selesai</option>
        </select>
      </div>

      {totalRows === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="font-semibold text-gray-700 text-sm">Belum ada data pelanggaran</p>
          {!readOnly && <p className="text-gray-500 text-xs mt-1">Klik "Buat Pelanggaran" untuk menambahkan data.</p>}
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
                      <td className="px-4 py-3.5 text-sm text-gray-800">
                        {item.namaSekolah.join(", ")}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-800">
                        {(Array.isArray(item.unsurTerlibat) ? item.unsurTerlibat : []).map((u, i) => (
                          <span key={i} className="mr-2">{u.kategori}: {u.jumlah}</span>
                        ))}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-800">
                        {new Date(item.tanggalTerjadi).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-800">
                        {item.kategori}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <a
                          href={`/tambah-pelanggaran?view=${item.id}`}
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </a>
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
          readOnly={readOnly}
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
