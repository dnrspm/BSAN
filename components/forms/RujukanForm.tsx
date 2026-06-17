"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ArrowLeft, MapPin, Phone, Globe, Lock, Users,
  ChevronDown, Building2, RotateCcw, Plus, Trash2, Flag, Pencil, CheckCircle, XCircle, MessageCircle, Info, AlertCircle,
} from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { SEED, type SumberRujukan } from "@/components/dashboard/SumberRujukanView"
import { RUJUKAN_LOG, dinasLog, getStatusAfterRestore } from "@/lib/rujukan-logs"
import { getDinasNamaForLogs, readAuthSession } from "@/lib/auth-session"
import { KAB_KOTA_ACEH, getKecamatanList, getKelurahanList } from "@/lib/wilayah-aceh"

function getRujukanFormExitHref(): string {
  const auth = readAuthSession()
  if (auth?.role === "sekolah") return "/dashboard"
  if (auth?.role === "pusat") return "/dashboard"
  return "/dashboard?menu=sumber-rujukan"
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type KategoriDukungan =
  | "Fasilitas Kesehatan"
  | "Konseling"
  | "Bantuan Hukum"
  | "Kepolisian"
  | "Psikologi"
  | "Pendidikan"
  | "Sosial"
  | "Lainnya"

type KategoriPenyedia = "Pemerintah Pusat" | "Pemerintah Daerah" | "Swasta" | "OMS" | "Lainnya"
type AksesInfo = "publik" | "terbatas"
type StatusRujukan = "terverifikasi" | "menunggu" | "menunggu_review" | "nonaktif" | "butuh_perbaikan"

interface KontakEntry {
  nomor: string
  tipe: "call_center" | "nomor_pribadi"
}

interface FormState {
  kategoriBentukDukungan: KategoriDukungan | ""
  namaInstansi: string
  provinsi: string
  kabupatenKota: string
  kecamatan: string
  kelurahan: string
  namaJalan: string
  nomorJalan: string
  kodePos: string
  tautanGoogleMaps: string
  kontak: KontakEntry[]
  website: string
  kategoriPenyedia: KategoriPenyedia | ""
  aksesInfo: AksesInfo
  status: StatusRujukan
  isNasional: boolean
  jenisMenunggu?: "pengajuan" | "perbaikan" | "perbaikan_laporan" | "penonaktifan" | "pemulihan"
  jenisButuhPerbaikan?: "ditolak" | "perbaikan"
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const KATEGORI_DUKUNGAN: KategoriDukungan[] = [
  "Fasilitas Kesehatan", "Konseling", "Bantuan Hukum",
  "Kepolisian", "Psikologi", "Pendidikan", "Sosial", "Lainnya",
]
const KATEGORI_PENYEDIA: KategoriPenyedia[] = [
  "Pemerintah Pusat", "Pemerintah Daerah", "Swasta", "OMS", "Lainnya",
]
const PROVINSI_OPTIONS = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau",
  "Jambi", "Sumatera Selatan", "Kepulauan Bangka Belitung", "Bengkulu",
  "Lampung", "DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah",
  "DI Yogyakarta", "Jawa Timur", "Bali", "Nusa Tenggara Barat",
  "Nusa Tenggara Timur", "Kalimantan Barat", "Kalimantan Tengah",
  "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
  "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat",
  "Sulawesi Selatan", "Sulawesi Tenggara", "Maluku", "Maluku Utara",
  "Papua Barat", "Papua",
]
const SEED_IDS = SEED.map((s) => s.id)

function hasCoordinates(url: string): boolean {
  try {
    new URL(url)
    return /@-?\d+\.?\d*,-?\d+\.?\d*/.test(url) ||
      /[?&]q=-?\d+\.?\d*,-?\d+\.?\d*/.test(url) ||
      /[?&]ll=-?\d+\.?\d*,-?\d+\.?\d*/.test(url)
  } catch {
    return false
  }
}

function extractCoordinates(url: string): { lat: string; lng: string } | null {
  try {
    new URL(url)
    const m = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (m) return { lat: m[1], lng: m[2] }
    const q = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (q) return { lat: q[1], lng: q[2] }
    const ll = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (ll) return { lat: ll[1], lng: ll[2] }
  } catch {}
  return null
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-gray-700">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function TextInput({ value, onChange, placeholder, type = "text", disabled }: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default"
    />
  )
}

function SelectInput({ value, onChange, options, placeholder, disabled }: {
  value: string
  onChange?: (v: string) => void
  options: string[]
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full h-9 pl-3 pr-8 text-sm border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-700 disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default"
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {!disabled && (
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      )}
    </div>
  )
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 bg-gray-50 border-b border-gray-200">
        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function StatusBadge({ status, jenisMenunggu, jenisButuhPerbaikan, isSekolah }: { status: StatusRujukan; jenisMenunggu?: "pengajuan" | "perbaikan" | "perbaikan_laporan" | "penonaktifan" | "pemulihan"; jenisButuhPerbaikan?: "ditolak" | "perbaikan"; isSekolah?: boolean }) {
  if (status === "terverifikasi") {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Terverifikasi</span>
  }
  if (status === "nonaktif") {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Nonaktif</span>
  }
  
  if (status === "butuh_perbaikan") {
    if (jenisButuhPerbaikan === "perbaikan") {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Perlu Perbaikan</span>
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Ditolak</span>
  }
  if (status === "menunggu") {
    // Sekolah sees "Dalam Proses Verifikasi", others see "Perlu Verifikasi"
    const label = isSekolah ? "Dalam Proses Verifikasi" : "Perlu Verifikasi"
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{label}</span>
  }
  // Default fallback for menunggu_review or other waiting states
  const defaultLabel = isSekolah ? "Dalam Proses Verifikasi" : "Perlu Verifikasi"
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{defaultLabel}</span>
}

const emptyForm = (): FormState => ({
  kategoriBentukDukungan: "",
  namaInstansi: "",
  provinsi: "Aceh",
  kabupatenKota: "",
  kecamatan: "",
  kelurahan: "",
  namaJalan: "",
  nomorJalan: "",
  kodePos: "",
  tautanGoogleMaps: "",
  kontak: [{ nomor: "", tipe: "call_center" }],
  website: "",
  kategoriPenyedia: "",
  aksesInfo: "publik",
  status: "menunggu",
  isNasional: false,
})

// ---------------------------------------------------------------------------
// Helper: persist status change to localStorage and update tabel
// ---------------------------------------------------------------------------
function persistStatusChange(id: string, status: StatusRujukan, logTerakhir: string, extra?: Record<string, unknown>) {
  try {
    const stored: Array<Record<string, unknown>> = JSON.parse(localStorage.getItem("rujukanList") ?? "[]")
    const existing = stored.find((i) => i.id === id)
    if (existing) {
      localStorage.setItem(
        "rujukanList",
        JSON.stringify(stored.map((i) => (i.id === id ? { ...i, status, logTerakhir, ...extra } : i)))
      )
    } else {
      const seed = SEED.find((d) => d.id === id)
      localStorage.setItem(
        "rujukanList",
        JSON.stringify([...stored, seed ? { ...seed, status, logTerakhir, ...extra } : { id, status, logTerakhir, ...extra }])
      )
    }
    window.dispatchEvent(new CustomEvent("rujukanUpdated"))
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Inner component (uses useSearchParams — must be inside Suspense)
// ---------------------------------------------------------------------------
function RujukanFormInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const viewId = searchParams.get("view")
  const activeId = editId ?? viewId
  const isEdit = !!editId
  const isView = !!viewId
  const isReadOnly = isView
  const isPusat = readAuthSession()?.role === "pusat"
  const isSekolah = readAuthSession()?.role === "sekolah"
  const isDinas = readAuthSession()?.role === "dinas"

  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitted, setSubmitted] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportAlasan, setReportAlasan] = useState("")
  const [reportJenis, setReportJenis] = useState<"perbaikan" | "penonaktifan" | null>(null)
  const [mounted, setMounted] = useState(false)
  const [viewUsulanDari, setViewUsulanDari] = useState<SumberRujukan["usulanDari"]>(undefined)
  const [duplicateError, setDuplicateError] = useState<string | null>(null)
  const [viewCatatanPerbaikan, setViewCatatanPerbaikan] = useState("")
  const [viewLogTerakhir, setViewLogTerakhir] = useState("")
  const [wasResubmit, setWasResubmit] = useState(false)
  const [showPerbaikanModal, setShowPerbaikanModal] = useState(false)
  const [perbaikanCatatan, setPerbaikanCatatan] = useState("")
  const [tolakModalMode, setTolakModalMode] = useState<"tolak" | "tolak_penonaktifan" | "tolak_laporan" | "tolak_pemulihan">("tolak")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteAlasan, setDeleteAlasan] = useState("")
  const [showPulihkanModal, setShowPulihkanModal] = useState(false)
  const [pulihkanAlasan, setPulihkanAlasan] = useState("")
  const [showNonaktifModal, setShowNonaktifModal] = useState(false)
  const [nonaktifAlasan, setNonaktifAlasan] = useState("")
  const [showHapusModal, setShowHapusModal] = useState(false)
  const [showAjukanModal, setShowAjukanModal] = useState(false)
  const [ajukanAlasan, setAjukanAlasan] = useState("")
  const [showMapModal, setShowMapModal] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({ show: false, title: "", description: "", onConfirm: () => {} })

  const defaultWilayah = useRef({ provinsi: "Aceh", kabupatenKota: "" })

  useEffect(() => {
    setMounted(true)
  }, [])

  const provParam = searchParams.get("provinsi")
  const kabParam = searchParams.get("kabupaten")

  // Auto-fill wilayah for sekolah
  useEffect(() => {
    if (editId || viewId) return
    const auth = readAuthSession()
    if (auth?.role === "pusat") return

    // URL params (passed explicitly from SekolahSumberRujukanView) take priority
    if (provParam || kabParam) {
      defaultWilayah.current = {
        provinsi: provParam ?? defaultWilayah.current.provinsi,
        kabupatenKota: kabParam ?? defaultWilayah.current.kabupatenKota,
      }
      setForm((prev) => ({
        ...prev,
        ...(provParam && { provinsi: provParam }),
        ...(kabParam && { kabupatenKota: kabParam }),
      }))
      return
    }

    // Fallback: auth.wilayah "Provinsi - Kabupaten"
    const wilayah = auth.wilayah ?? ""
    if (wilayah.includes(" - ")) {
      const [prov, kab] = wilayah.split(" - ").map((s) => s.trim())
      defaultWilayah.current = {
        provinsi: prov,
        kabupatenKota: kab,
      }
      setForm((prev) => ({
        ...prev,
        ...(prov && { provinsi: prov }),
        ...(kab && { kabupatenKota: kab }),
      }))
    }
  }, [editId, viewId, provParam, kabParam])

  // Load data — localStorage overrides take priority over SEED
  useEffect(() => {
    if (!activeId) return
    let storedItems: Array<Record<string, unknown>> = []
    try {
      storedItems = JSON.parse(localStorage.getItem("rujukanList") ?? "[]")
    } catch {}
    const fromStorage = storedItems.find((d) => d.id === activeId) as Record<string, unknown> | undefined
    const fromSeed = SEED.find((d) => d.id === activeId) as Record<string, unknown> | undefined
    const existing = fromSeed ? { ...fromSeed, ...(fromStorage ?? {}) } : fromStorage
    if (existing) {
      setForm({
        kategoriBentukDukungan: (existing.kategoriBentukDukungan as KategoriDukungan) ?? "",
        namaInstansi: (existing.namaInstansi as string) ?? "",
        provinsi: (existing.provinsi as string) ?? "Aceh",
        kabupatenKota: (existing.kabupatenKota as string) ?? "",
        kecamatan: (existing.kecamatan as string) ?? "",
        kelurahan: (existing.kelurahan as string) ?? "",
        namaJalan: (existing.namaJalan as string) ?? "",
        nomorJalan: (existing.nomorJalan as string) ?? "",
        kodePos: (existing.kodePos as string) ?? "",
        tautanGoogleMaps: (existing.tautanGoogleMaps as string) ?? "",
        kontak: (() => {
          // Support legacy fields nomorCallCenter / nomorPribadi as well as new kontak[]
          const stored = existing.kontak as KontakEntry[] | undefined
          if (Array.isArray(stored) && stored.length > 0) return stored
          const entries: KontakEntry[] = []
          const cc = existing.nomorCallCenter as string | undefined
          const np = existing.nomorPribadi as string | undefined
          if (cc) entries.push({ nomor: cc, tipe: "call_center" })
          if (np) entries.push({ nomor: np, tipe: "nomor_pribadi" })
          return entries.length > 0 ? entries : [{ nomor: "", tipe: "call_center" as const }]
        })(),
        website: (existing.website as string) ?? "",
        kategoriPenyedia: (existing.kategoriPenyedia as KategoriPenyedia) ?? "",
        aksesInfo: (existing.aksesInfo as AksesInfo) ?? "publik",
        status: (existing.status as StatusRujukan) ?? "menunggu",
        jenisMenunggu: (() => {
          const stored = existing.jenisMenunggu as string | undefined
          if (stored === "dilaporan") return "perbaikan_laporan"
          if (stored === "perbaikan" && existing.usulanDari !== "sekolah") return "perbaikan_laporan"
          if (stored === "perbaikan" || stored === "perbaikan_laporan" || stored === "penonaktifan" || stored === "pemulihan") return stored as "perbaikan" | "perbaikan_laporan" | "penonaktifan" | "pemulihan"
          if (existing.status === "menunggu" && typeof existing.logTerakhir === "string" && /dilaporkan/i.test(existing.logTerakhir)) return "perbaikan_laporan"
          if (existing.status === "menunggu") return "pengajuan"
          return undefined
        })(),
        jenisButuhPerbaikan: (existing.jenisButuhPerbaikan as "ditolak" | "perbaikan" | undefined) ?? undefined,
        isNasional: (existing.isNasional as boolean) ?? (existing.provinsi === "Nasional" && existing.kabupatenKota === "Nasional") ?? false,
      })
      setViewUsulanDari((existing.usulanDari as SumberRujukan["usulanDari"]) ?? undefined)
      setViewCatatanPerbaikan((existing.catatanPerbaikan as string) ?? "")
      setViewLogTerakhir((existing.logTerakhir as string) ?? "")
    }
  }, [activeId])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    if (k === "namaInstansi" || k === "kabupatenKota" || k === "kategoriBentukDukungan" || k === "kategoriPenyedia") setDuplicateError(null)
    if (k === "isNasional") {
      setForm((prev) => ({
        ...prev,
        isNasional: v as boolean,
        provinsi: v ? "" : defaultWilayah.current.provinsi,
        kabupatenKota: v ? "" : defaultWilayah.current.kabupatenKota,
        kecamatan: "",
        kelurahan: "",
      }))
      return
    }
    if (k === "provinsi") {
      setForm((prev) => ({
        ...prev,
        [k]: v,
        kecamatan: "",
        kelurahan: "",
      }))
      return
    }
    if (k === "kabupatenKota") {
      setForm((prev) => ({
        ...prev,
        [k]: v,
        kecamatan: "",
        kelurahan: "",
      }))
      return
    }
    if (k === "kecamatan") {
      setForm((prev) => ({ ...prev, [k]: v, kelurahan: "" }))
      return
    }
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  // Verify — updates localStorage so tabel reflects the change
  const handleVerify = () => {
    if (!viewId) return
    const isPusat = readAuthSession()?.role === "pusat"
    const d = getDinasNamaForLogs()
    persistStatusChange(
      viewId,
      "terverifikasi",
      isPusat ? RUJUKAN_LOG.diverifikasiPusat : dinasLog.diverifikasi(d)
    )
    const newLog = isPusat ? RUJUKAN_LOG.diverifikasiPusat : dinasLog.diverifikasi(d)
    setViewLogTerakhir(newLog)
    setForm((prev) => ({ ...prev, status: "terverifikasi" }))
  }

  const handleTerimaPenonaktifan = () => {
    if (!viewId) return
    const isPusat = readAuthSession()?.role === "pusat"
    const d = getDinasNamaForLogs()
    const newLog = isPusat ? RUJUKAN_LOG.dinonaktifkanPusat : dinasLog.dinonaktifkan(d)
    persistStatusChange(viewId, "nonaktif", newLog, { jenisMenunggu: undefined })
    setViewLogTerakhir(newLog)
    setForm((prev) => ({ ...prev, status: "nonaktif", jenisMenunggu: undefined }))
  }

  const handleTerimaPerbaikanNonSekolah = () => {
    if (!viewId) return
    const d = getDinasNamaForLogs()
    const newLog = `Laporan perbaikan diterima oleh Admin ${d}`
    persistStatusChange(viewId, "butuh_perbaikan", newLog, { jenisMenunggu: undefined, jenisButuhPerbaikan: "ditolak" })
    setViewLogTerakhir(newLog)
    setForm((prev) => ({ ...prev, status: "butuh_perbaikan", jenisMenunggu: undefined, jenisButuhPerbaikan: "ditolak" }))
    router.push(getRujukanFormExitHref())
  }

  const handleSekolahHapus = () => {
    if (!viewId) return
    const stored = JSON.parse(localStorage.getItem("rujukanList") ?? "[]") as Array<Record<string, unknown>>
    const filtered = stored.filter((item: Record<string, unknown>) => item.id !== viewId)
    localStorage.setItem("rujukanList", JSON.stringify(filtered))
    window.dispatchEvent(new CustomEvent("rujukanUpdated"))
    router.push("/sumber-rujukan")
  }

  // Delete — marks as "nonaktif" in localStorage then navigates back
  const handleDelete = () => {
    if (!viewId) return
    
    const isPusat = readAuthSession()?.role === "pusat"
    const d = getDinasNamaForLogs()
    const alasan = deleteAlasan.trim()
    const extra = alasan ? { catatanPerbaikan: alasan } : {}
    const newLog = isPusat ? RUJUKAN_LOG.dinonaktifkanPusat : dinasLog.dinonaktifkan(d)
    persistStatusChange(viewId, "nonaktif", newLog, extra)
    setViewLogTerakhir(newLog)
    setForm((prev) => ({ ...prev, status: "nonaktif", ...extra }))
    setShowDeleteModal(false)
    setDeleteAlasan("")
  }

  const handleRestore = () => {
    if (!viewId) return
    let usulanDari: SumberRujukan["usulanDari"] = "dinas"
    try {
      const stored = JSON.parse(localStorage.getItem("rujukanList") ?? "[]") as Array<Record<string, unknown>>
      const row = stored.find((x) => x.id === viewId)
      const seed = SEED.find((s) => s.id === viewId)
      const merged = { ...seed, ...row } as Partial<SumberRujukan>
      if (merged.usulanDari) usulanDari = merged.usulanDari
    } catch { /* keep default */ }
    const nextStatus = getStatusAfterRestore(usulanDari)
    const isPusat = readAuthSession()?.role === "pusat"
    const d = getDinasNamaForLogs()
    const newLog = isPusat ? RUJUKAN_LOG.dipulihkanPusat : dinasLog.dipulihkan(d)
    persistStatusChange(viewId, nextStatus, newLog)
    setViewLogTerakhir(newLog)
    setForm((prev) => ({ ...prev, status: nextStatus }))
  }

  const handleSubmitReport = () => {
    if (!viewId || !reportAlasan.trim() || !reportJenis) return
    const raw = localStorage.getItem("reportList")
    const reports: Array<{ id: string; sumberId: string; jenis: string; alasan: string; dibuatOleh: string; createdAt: string }> = raw ? JSON.parse(raw) : []
    reports.unshift({
      id: `report-${Date.now()}`,
      sumberId: viewId,
      jenis: reportJenis,
      alasan: reportAlasan.trim(),
      dibuatOleh: readAuthSession()?.role === "sekolah" ? `Admin Sekolah ${readAuthSession()?.namaSekolah ?? ""}`.trim() : readAuthSession()?.role === "dinas" ? `Admin ${getDinasNamaForLogs()}` : "Admin",
      createdAt: new Date().toISOString(),
    })
    localStorage.setItem("reportList", JSON.stringify(reports))

    const auth = readAuthSession()
    const stored = JSON.parse(localStorage.getItem("rujukanList") ?? "[]") as Array<Record<string, unknown>>
    const existingIndex = stored.findIndex((item: Record<string, unknown>) => item.id === viewId)
    const logMsg = reportJenis === "penonaktifan"
      ? `Usulan penonaktifan oleh Admin Sekolah ${auth?.namaSekolah ?? ""}`.trim()
      : `Laporan perbaikan oleh Admin Sekolah ${auth?.namaSekolah ?? ""}`.trim()
    const alasan = reportAlasan.trim()

    const jenisForStorage = reportJenis === "perbaikan" ? "perbaikan_laporan" : (reportJenis ?? "perbaikan_laporan")
    if (existingIndex >= 0) {
      stored[existingIndex] = {
        ...stored[existingIndex],
        status: "menunggu",
        jenisMenunggu: jenisForStorage,
        logTerakhir: logMsg,
        catatanPerbaikan: `Laporan: ${alasan}`
      }
    } else {
      const seedItem = SEED.find((s) => s.id === viewId)
      if (seedItem) {
        stored.push({
          ...seedItem,
          status: "menunggu",
          jenisMenunggu: jenisForStorage,
          logTerakhir: logMsg,
          catatanPerbaikan: `Laporan: ${alasan}`,
        })
      }
    }

    localStorage.setItem("rujukanList", JSON.stringify(stored))
    window.dispatchEvent(new CustomEvent("rujukanUpdated"))

    setViewLogTerakhir(logMsg)
    setViewCatatanPerbaikan(`Laporan: ${alasan}`)
    setShowReportModal(false)
    setReportAlasan("")
    setReportJenis(null)
    setForm((prev) => ({ ...prev, status: "menunggu", jenisMenunggu: jenisForStorage, catatanPerbaikan: `Laporan: ${alasan}` }))
  }

  const handleSekolahNonaktif = () => {
    if (!viewId || !nonaktifAlasan.trim()) return
    const auth = readAuthSession()
    const log = `Usulan penonaktifan oleh Admin Sekolah ${auth?.namaSekolah ?? ""}`.trim()
    persistStatusChange(viewId, "menunggu", log, { jenisMenunggu: "penonaktifan", catatanPerbaikan: nonaktifAlasan.trim() })
    setViewLogTerakhir(log)
    setViewCatatanPerbaikan(nonaktifAlasan.trim())
    setForm((prev) => ({ ...prev, status: "menunggu", jenisMenunggu: "penonaktifan" }))
    setShowNonaktifModal(false)
    setNonaktifAlasan("")
  }

  const handleSubmitPulihkan = () => {
    if (!viewId || !pulihkanAlasan.trim()) return
    const patch = { status: "menunggu", jenisMenunggu: "pemulihan", logTerakhir: "Usulan pemulihan oleh Admin Sekolah", catatanPerbaikan: pulihkanAlasan.trim() }
    const stored = JSON.parse(localStorage.getItem("rujukanList") ?? "[]") as Array<Record<string, unknown>>
    const idx = stored.findIndex((x) => x.id === viewId)
    if (idx >= 0) stored[idx] = { ...stored[idx], ...patch }
    else { const s = SEED.find((s) => s.id === viewId); if (s) stored.push({ ...s, ...patch }) }
    localStorage.setItem("rujukanList", JSON.stringify(stored))
    window.dispatchEvent(new CustomEvent("rujukanUpdated"))
    setViewLogTerakhir(patch.logTerakhir)
    setViewCatatanPerbaikan(patch.catatanPerbaikan)
    setForm((prev) => ({ ...prev, status: "menunggu", jenisMenunggu: "pemulihan" }))
    setShowPulihkanModal(false)
    setPulihkanAlasan("")
  }

  const handleSubmitPerbaikan = () => {
    if (!viewId || !perbaikanCatatan.trim()) return
    const isPusat = readAuthSession()?.role === "pusat"
    const d = getDinasNamaForLogs()
    let log: string
    if (tolakModalMode === "tolak_penonaktifan" || tolakModalMode === "tolak_laporan") {
      log = tolakModalMode === "tolak_penonaktifan"
        ? `Usulan penonaktifan ditolak oleh Admin ${isPusat ? "Pusat" : d}`
        : `Laporan perbaikan ditolak oleh Admin ${isPusat ? "Pusat" : d}`
      persistStatusChange(viewId, "terverifikasi", log, { catatanPerbaikan: perbaikanCatatan.trim(), jenisMenunggu: undefined })
      setForm((prev) => ({ ...prev, status: "terverifikasi", jenisMenunggu: undefined }))
    } else if (tolakModalMode === "tolak_pemulihan") {
      log = `Usulan pemulihan ditolak oleh Admin ${isPusat ? "Pusat" : d}`
      persistStatusChange(viewId, "nonaktif", log, { catatanPerbaikan: perbaikanCatatan.trim(), jenisMenunggu: undefined })
      setForm((prev) => ({ ...prev, status: "nonaktif", jenisMenunggu: undefined }))
    } else {
      log = `Ditolak oleh Admin ${isPusat ? "Pusat" : d}`
      persistStatusChange(viewId, "butuh_perbaikan", log, { catatanPerbaikan: perbaikanCatatan.trim(), jenisMenunggu: undefined, jenisButuhPerbaikan: "ditolak" })
      setForm((prev) => ({ ...prev, status: "butuh_perbaikan", jenisMenunggu: undefined, jenisButuhPerbaikan: "ditolak" }))
    }
    setViewCatatanPerbaikan(perbaikanCatatan.trim())
    setViewLogTerakhir(log)
    setShowPerbaikanModal(false)
    setPerbaikanCatatan("")
    router.push(getRujukanFormExitHref())
  }

  const canSubmit =
    form.kategoriBentukDukungan !== "" &&
    form.namaInstansi.trim() !== "" &&
    form.kabupatenKota.trim() !== "" &&
    form.kontak.some((k) => k.nomor.trim() !== "") &&
    form.kategoriPenyedia !== ""

  const handleSubmit = () => {
    if (!canSubmit) return
    const auth = readAuthSession()
    if (!auth) return
    const isSekolah = auth.role === "sekolah"
    const isPusat = auth.role === "pusat"
    const isResubmit = isSekolah && form.status === "butuh_perbaikan"
    const isEditTerverifikasi = isSekolah && form.status === "terverifikasi"
    const needsReverify = isResubmit || isEditTerverifikasi
    const reverifyJenis = "pengajuan" as const
    const d = getDinasNamaForLogs()
    const logEdit = isPusat ? RUJUKAN_LOG.diperbaharuiPusat : dinasLog.diperbaharui(d)
    try {
      const stored = JSON.parse(localStorage.getItem("rujukanList") ?? "[]") as Array<Record<string, unknown>>

      // Duplicate check for new entries only
      if (!isEdit) {
        const namaNorm = form.namaInstansi.trim().toLowerCase()
        const kabNorm = form.kabupatenKota.trim().toLowerCase()
        const kategoriNorm = form.kategoriBentukDukungan.toLowerCase()
        const penyediaNorm = form.kategoriPenyedia.toLowerCase()
        const allItems = [
          ...SEED.map((s) => {
            const override = stored.find((x) => x.id === s.id)
            return override ? { ...s, ...override } : s
          }),
          ...stored.filter((x) => !SEED.find((s) => s.id === x.id)),
        ] as Array<{ namaInstansi?: string; kabupatenKota?: string; kategoriBentukDukungan?: string; kategoriPenyedia?: string; status?: string }>
        const duplicate = allItems.find(
          (x) =>
            x.status !== "nonaktif" &&
            x.namaInstansi?.trim().toLowerCase() === namaNorm &&
            x.kabupatenKota?.trim().toLowerCase() === kabNorm &&
            x.kategoriBentukDukungan?.toLowerCase() === kategoriNorm &&
            x.kategoriPenyedia?.toLowerCase() === penyediaNorm
        )
        if (duplicate) {
          setDuplicateError(`"${form.namaInstansi}" dengan kategori dan penyedia yang sama sudah terdaftar di ${form.kabupatenKota}.`)
          return
        }
      }
      setDuplicateError(null)

      if (isEdit && editId) {
        const idx = stored.findIndex((item) => item.id === editId)
        if (idx >= 0) {
          const reverifyAlasan = ajukanAlasan.trim() || undefined
          stored[idx] = {
            ...stored[idx],
            ...form,
            logTerakhir: isResubmit ? RUJUKAN_LOG.dibuatSekolah(auth.namaSekolah ?? "") : logEdit,
            ...(needsReverify ? { status: "menunggu", jenisMenunggu: reverifyJenis, catatanPerbaikan: reverifyAlasan } : {}),
            ...(isPusat ? { status: "terverifikasi", jenisMenunggu: undefined } : {}),
          }
          localStorage.setItem("rujukanList", JSON.stringify(stored))
        } else if (SEED_IDS.includes(editId)) {
          const seed = SEED.find((d) => d.id === editId)
          const reverifyAlasan = ajukanAlasan.trim() || undefined
          localStorage.setItem(
            "rujukanList",
            JSON.stringify([...stored, { ...seed, ...form, id: editId, logTerakhir: isResubmit ? RUJUKAN_LOG.dibuatSekolah(auth.namaSekolah ?? "") : logEdit, ...(needsReverify ? { status: "menunggu", jenisMenunggu: reverifyJenis, catatanPerbaikan: reverifyAlasan } : {}), ...(isPusat ? { status: "terverifikasi", jenisMenunggu: undefined } : {}) }])
          )
        } else {
          const reverifyAlasan = ajukanAlasan.trim() || undefined
          localStorage.setItem("rujukanList", JSON.stringify([...stored, { id: editId, ...form, logTerakhir: isResubmit ? RUJUKAN_LOG.dibuatSekolah(auth.namaSekolah ?? "") : logEdit, ...(needsReverify ? { status: "menunggu", jenisMenunggu: reverifyJenis, catatanPerbaikan: reverifyAlasan } : {}), ...(isPusat ? { status: "terverifikasi", jenisMenunggu: undefined } : {}) }]))
        }
      } else {
        const newItem: SumberRujukan = {
          id: isSekolah ? `usul-${Date.now()}` : `sr-${Date.now()}`,
          namaInstansi: form.namaInstansi,
          kategoriBentukDukungan: form.kategoriBentukDukungan as SumberRujukan["kategoriBentukDukungan"],
          kategoriPenyedia: form.kategoriPenyedia as SumberRujukan["kategoriPenyedia"],
          provinsi: form.provinsi,
          kabupatenKota: form.kabupatenKota,
          kecamatan: form.kecamatan,
          kelurahan: form.kelurahan,
          namaJalan: form.namaJalan,
          nomorJalan: form.nomorJalan,
          kodePos: form.kodePos,
          tautanGoogleMaps: form.tautanGoogleMaps,
          nomorCallCenter: form.kontak.find((k) => k.tipe === "call_center")?.nomor ?? form.kontak[0]?.nomor ?? "",
          nomorPribadi: form.kontak.filter((k) => k.tipe === "nomor_pribadi").map((k) => k.nomor).join(", ") || undefined,
          kontak: form.kontak,
          website: form.website,
          aksesInfo: form.aksesInfo,
          status: isSekolah ? "menunggu" : "terverifikasi",
          jenisMenunggu: isSekolah ? "pengajuan" : undefined,
          dibuatOleh: isSekolah ? `Admin Sekolah ${auth.namaSekolah ?? ""}`.trim() : isPusat ? "Admin Pusat" : `Admin ${d}`,
          namaSekolah: isSekolah ? (auth.namaSekolah ?? "") : undefined,
          logTerakhir: isSekolah ? RUJUKAN_LOG.dibuatSekolah(auth.namaSekolah ?? "") : isPusat ? RUJUKAN_LOG.dibuatTerverifikasiPusat : dinasLog.dibuatTerverifikasi(d),
          usulanDari: isSekolah ? "sekolah" : isPusat ? "pusat" : "dinas",
          createdAt: new Date().toISOString(),
          isNasional: form.isNasional,
        }
        localStorage.setItem("rujukanList", JSON.stringify([...stored, newItem]))
      }
      window.dispatchEvent(new CustomEvent("rujukanUpdated"))
    } catch { /* ignore */ }
    if (isResubmit) setWasResubmit(true)
    setSubmitted(true)
  }

  useEffect(() => {
    if (!submitted) return
    const t = setTimeout(() => router.push(getRujukanFormExitHref()), 1500)
    return () => clearTimeout(t)
  }, [submitted, router])

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? (wasResubmit ? "Usulan Berhasil Dikirim Ulang" : "Berhasil Mengajukan Pengubahan") : isSekolah ? "Usulan Berhasil Dikirim" : "Berhasil Ditambahkan"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit
              ? wasResubmit ? "Usulan Anda telah dikirim ulang untuk diperiksa kembali." : "Pengubahan data perlu diverifikasi terlebih dahulu."
              : isSekolah
                ? "Usulan sumber dukungan Anda akan diverifikasi oleh admin."
                : "Sumber dukungan berhasil ditambahkan dan langsung terverifikasi."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(getRujukanFormExitHref())}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900">
              {isView ? "Detail Sumber Dukungan" : isEdit ? "Edit Sumber Dukungan" : "Tambah Sumber Dukungan"}
            </h1>
            {isView ? (
              <div className="mt-1">
                <StatusBadge status={form.status} jenisMenunggu={form.jenisMenunggu} jenisButuhPerbaikan={form.jenisButuhPerbaikan} isSekolah={isSekolah} />
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                {isEdit ? "Perbarui informasi Sumber Dukungan" : "Lengkapi semua informasi yang diperlukan"}
              </p>
            )}
          </div>
        </div>
      </div>

{/* Status Banner - selalu tampil di mode view */}
      {isView && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className={`rounded-lg px-4 py-3 border-2 ${(() => {
            if (form.status === "terverifikasi") return "bg-green-50 border-green-200"
            if (form.status === "menunggu") {
              if (form.jenisMenunggu === "perbaikan") return "bg-orange-50 border-orange-200"
              if (form.jenisMenunggu === "perbaikan_laporan") return "bg-yellow-50 border-yellow-200"
              if (form.jenisMenunggu === "pemulihan") return "bg-teal-50 border-teal-200"
              if (form.jenisMenunggu === "penonaktifan") return "bg-red-50 border-red-200"
              return "bg-amber-50 border-amber-200"
            }
            if (form.status === "menunggu_review") return "bg-orange-50 border-orange-200"
            if (form.status === "butuh_perbaikan") {
              if (form.jenisButuhPerbaikan === "perbaikan") return "bg-yellow-50 border-yellow-200"
              return "bg-red-50 border-red-200"
            }
            if (form.status === "nonaktif") return "bg-gray-50 border-gray-200"
            return "bg-amber-50 border-amber-200"
          })()}`}>
            <p className={`text-xs font-bold uppercase mb-2 ${(() => {
            if (form.status === "terverifikasi") return "text-green-700"
            if (form.status === "menunggu") {
              if (form.jenisMenunggu === "perbaikan") return "text-orange-700"
              if (form.jenisMenunggu === "perbaikan_laporan") return "text-yellow-700"
              if (form.jenisMenunggu === "pemulihan") return "text-teal-700"
              if (form.jenisMenunggu === "penonaktifan") return "text-red-700"
              return "text-amber-700"
            }
            if (form.status === "menunggu_review") return "text-orange-800"
            if (form.status === "butuh_perbaikan") {
              if (form.jenisButuhPerbaikan === "perbaikan") return "text-yellow-700"
              return "text-red-700"
            }
            if (form.status === "nonaktif") return "text-gray-600"
            return "text-amber-700"
          })()}`}>
              {form.status === "terverifikasi" && "Terverifikasi"}
              {form.status === "menunggu" && (form.jenisMenunggu === "perbaikan" ? "Perlu Diperiksa - Perbaikan" : form.jenisMenunggu === "perbaikan_laporan" ? "Perlu Diperiksa - Laporan Perbaikan" : form.jenisMenunggu === "pemulihan" ? "Perlu Diperiksa - Pemulihan" : form.jenisMenunggu === "penonaktifan" ? "Perlu Diperiksa - Penonaktifan" : "Perlu Diperiksa")}
              {form.status === "menunggu_review" && "Menunggu Review"}
              {form.status === "butuh_perbaikan" && (form.jenisButuhPerbaikan === "perbaikan" ? "Perlu Perbaikan" : "Ditolak")}
              {form.status === "nonaktif" && "Nonaktif"}
            </p>
            <p className={`text-sm font-medium mb-1 ${(() => {
            if (form.status === "terverifikasi") return "text-green-900"
            if (form.status === "menunggu") {
              if (form.jenisMenunggu === "perbaikan") return "text-orange-900"
              if (form.jenisMenunggu === "perbaikan_laporan") return "text-yellow-900"
              if (form.jenisMenunggu === "pemulihan") return "text-teal-900"
              if (form.jenisMenunggu === "penonaktifan") return "text-red-900"
              return "text-amber-900"
            }
            if (form.status === "menunggu_review") return "text-orange-900"
            if (form.status === "butuh_perbaikan") {
              if (form.jenisButuhPerbaikan === "perbaikan") return "text-yellow-900"
              return "text-red-900"
            }
            if (form.status === "nonaktif") return "text-gray-900"
            return "text-amber-900"
          })()}`}>{viewLogTerakhir || "(Tidak ada)"}</p>
            {viewCatatanPerbaikan && (
              <p className={`text-xs leading-relaxed ${(() => {
            if (form.status === "terverifikasi") return "text-green-700"
            if (form.status === "menunggu") {
              if (form.jenisMenunggu === "perbaikan") return "text-orange-700"
              if (form.jenisMenunggu === "perbaikan_laporan") return "text-yellow-700"
              if (form.jenisMenunggu === "pemulihan") return "text-teal-700"
              if (form.jenisMenunggu === "penonaktifan") return "text-red-700"
              return "text-amber-700"
            }
            if (form.status === "menunggu_review") return "text-orange-700"
            if (form.status === "butuh_perbaikan") {
              if (form.jenisButuhPerbaikan === "perbaikan") return "text-yellow-700"
              return "text-red-700"
            }
            if (form.status === "nonaktif") return "text-gray-600"
            return "text-amber-700"
          })()}`}>Catatan: {viewCatatanPerbaikan}</p>
            )}
          </div>
        </div>
      )}

      {/* Bulk upload info banner - only show for new creation, and only for non-pusat roles */}
      {isPusat === false && !isEdit && !isView && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">Informasi:</span> Untuk melakukan bulk upload data sumber dukungan, hubungi nomor kontak person Puspeka di{" "}
              <a href="https://wa.me/6282127282918" target="_blank" rel="noopener noreferrer" className="font-medium underline hover:text-blue-800">082127282918</a> (WhatsApp).
            </p>
          </div>
        </div>
      )}

      {/* Form body */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        <SectionCard icon={<Building2 className="w-4 h-4" />} title="Informasi Utama">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <FieldLabel required={!isReadOnly}>Nama Instansi / Layanan</FieldLabel>
              <TextInput value={form.namaInstansi} onChange={(v) => set("namaInstansi", v)} placeholder="Contoh: RSUD Zainoel Abidin" disabled={isReadOnly} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required={!isReadOnly}>Kategori Bentuk Dukungan</FieldLabel>
              <SelectInput value={form.kategoriBentukDukungan} onChange={(v) => set("kategoriBentukDukungan", v as KategoriDukungan)} options={KATEGORI_DUKUNGAN} placeholder="Pilih kategori" disabled={isReadOnly} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required={!isReadOnly}>Kategori Penyedia Layanan</FieldLabel>
              <SelectInput value={form.kategoriPenyedia} onChange={(v) => set("kategoriPenyedia", v as KategoriPenyedia)} options={KATEGORI_PENYEDIA} placeholder="Pilih kategori penyedia" disabled={isReadOnly} />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isNasional}
                  onChange={(e) => set("isNasional", e.target.checked)}
                  disabled={isReadOnly}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm font-medium text-gray-700">Tandai sebagai Nasional</span>
              </label>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<MapPin className="w-4 h-4" />} title="Alamat Lengkap">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required={!isReadOnly}>Provinsi</FieldLabel>
              <SelectInput value={form.provinsi} onChange={(v) => set("provinsi", v)} options={PROVINSI_OPTIONS} placeholder="Pilih Provinsi" disabled={isReadOnly || (mounted && (isSekolah || isDinas) && !form.isNasional)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required={!isReadOnly}>Kabupaten / Kota</FieldLabel>
              {mounted && !isReadOnly && (isDinas || form.isNasional) ? (
                <SelectInput
                  value={form.kabupatenKota}
                  onChange={(v) => set("kabupatenKota", v)}
                  options={KAB_KOTA_ACEH}
                  placeholder="Pilih Kabupaten / Kota"
                  disabled={!form.provinsi || form.provinsi === "Nasional"}
                />
              ) : (
                <TextInput value={form.kabupatenKota} onChange={(v) => set("kabupatenKota", v)} placeholder={form.kabupatenKota || "Kabupaten / Kota"} disabled={isReadOnly || (mounted && isSekolah)} />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Kecamatan</FieldLabel>
              {mounted && !isReadOnly && (isDinas || isSekolah || form.isNasional) ? (
                <SelectInput
                  value={form.kecamatan}
                  onChange={(v) => set("kecamatan", v)}
                  options={getKecamatanList(form.kabupatenKota)}
                  placeholder={form.kabupatenKota ? "Pilih Kecamatan" : "Pilih Kabupaten / Kota dulu"}
                  disabled={!form.kabupatenKota}
                />
              ) : (
                <TextInput value={form.kecamatan} onChange={(v) => set("kecamatan", v)} placeholder="Contoh: Baiturrahman" disabled={isReadOnly} />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Kelurahan</FieldLabel>
              {mounted && !isReadOnly && (isDinas || isSekolah || form.isNasional) ? (
                <SelectInput
                  value={form.kelurahan}
                  onChange={(v) => set("kelurahan", v)}
                  options={getKelurahanList(form.kabupatenKota, form.kecamatan)}
                  placeholder={form.kecamatan ? "Pilih Kelurahan / Desa" : "Pilih Kecamatan dulu"}
                  disabled={!form.kecamatan}
                />
              ) : (
                <TextInput value={form.kelurahan} onChange={(v) => set("kelurahan", v)} placeholder="Contoh: Peunayong" disabled={isReadOnly} />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Nama Jalan</FieldLabel>
              <TextInput value={form.namaJalan} onChange={(v) => set("namaJalan", v)} placeholder="Contoh: Jl. Tgk. Daud Beureueh" disabled={isReadOnly} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Nomor</FieldLabel>
              <TextInput value={form.nomorJalan} onChange={(v) => set("nomorJalan", v)} placeholder="Contoh: No. 108" disabled={isReadOnly} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Kode Pos</FieldLabel>
              <TextInput value={form.kodePos} onChange={(v) => set("kodePos", v.replace(/\D/g, ""))} placeholder="Contoh: 23242" disabled={isReadOnly} />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                <FieldLabel>Tautan Google Maps <span className="text-xs font-normal text-gray-400">(opsional)</span></FieldLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition cursor-help">
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="w-80">
                    <p className="mb-1.5">Gunakan tautan Google Maps yang mengandung koordinat (lintang &amp; bujur) agar peta dapat ditampilkan. Tautan ini dapat diambil dari <span className="font-semibold">address bar</span> browser Anda ketika membuka peta.</p>
                    <img src="/addressbar-map.svg" alt="Contoh address bar browser dengan tautan Google Maps yang mengandung koordinat" className="w-full rounded border border-white/20 mt-1" />
                  </TooltipContent>
                </Tooltip>
              </div>
              <TextInput value={form.tautanGoogleMaps} onChange={(v) => set("tautanGoogleMaps", v)} placeholder="https://maps.google.com/..." disabled={isReadOnly} />
              {form.tautanGoogleMaps && (
                <div className="flex gap-1.5 mt-0.5">
                  <div className="shrink-0 mt-0.5">
                    {hasCoordinates(form.tautanGoogleMaps)
                      ? <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    }
                  </div>
                  <p className="text-xs text-gray-700">
                    {hasCoordinates(form.tautanGoogleMaps)
                      ? <>Pratinjau lokasi tersedia, <button onClick={() => setShowMapModal(true)} className="text-blue-600 hover:underline cursor-pointer">Lihat map</button></>
                      : "Pratinjau lokasi tidak tersedia, gunakan tautan dari address bar"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<Phone className="w-4 h-4" />} title="Informasi Kontak">
          <div className="space-y-4">

            {/* Info banner */}
            {!isReadOnly && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 space-y-1">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Nomor Call Center</span> bisa lebih dari satu.
                </p>
                <p className="text-xs text-blue-600">
                  Jika tidak tersedia, gunakan nomor HP pribadi yang dapat menjadi rujukan dan dapat diakses publik.
                </p>
              </div>
            )}

            {/* Label row */}
            {!isReadOnly && (
              <div className="flex gap-2 items-center">
                <span className="flex-1 text-xs font-semibold text-gray-700">Nomor Kontak <span className="text-red-500">*</span></span>
                <span className="w-36 text-xs font-semibold text-gray-700">Tipe Kontak</span>
                {form.kontak.length > 1 && <span className="w-9" />}
              </div>
            )}

            {/* Kontak entries */}
            <div className="space-y-2">
              {isReadOnly ? (
                form.kontak.filter((k) => k.nomor.trim()).map((k, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${k.tipe === "call_center" ? "bg-blue-500" : "bg-green-500"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{k.nomor}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${k.tipe === "call_center" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                      {k.tipe === "call_center" ? "Call Center" : "Nomor Pribadi"}
                    </span>
                  </div>
                ))
              ) : (
                form.kontak.map((k, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    {/* Nomor input */}
                    <input
                      type="tel"
                      value={k.nomor}
                      onChange={(e) => {
                        const updated = form.kontak.map((c, idx) =>
                          idx === i ? { ...c, nomor: e.target.value.replace(/\D/g, "") } : c
                        )
                        set("kontak", updated)
                      }}
                      placeholder="08xxxxxxxxxx"
                      className="flex-1 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                    />
                    {/* Tipe select */}
                    <select
                      value={k.tipe}
                      onChange={(e) => {
                        const updated = form.kontak.map((c, idx) =>
                          idx === i ? { ...c, tipe: e.target.value as "call_center" | "nomor_pribadi" } : c
                        )
                        set("kontak", updated)
                      }}
                      className="w-36 h-9 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 cursor-pointer"
                    >
                      <option value="call_center">Call Center</option>
                      <option value="nomor_pribadi">Nomor Pribadi</option>
                    </select>
                    {/* Remove button */}
                    {form.kontak.length > 1 && (
                      <button
                        type="button"
                        onClick={() => set("kontak", form.kontak.filter((_, idx) => idx !== i))}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add more button */}
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => set("kontak", [...form.kontak, { nomor: "", tipe: "call_center" }])}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg px-3 py-2 transition w-full justify-center"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Kontak
              </button>
            )}

            {/* Website */}
            <div className="flex flex-col gap-1.5 pt-1 border-t border-gray-100">
              <FieldLabel>Website <span className="text-xs font-normal text-gray-400">(opsional)</span></FieldLabel>
              <div className="relative">
                {!isReadOnly && <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />}
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://www.instansi.go.id"
                  disabled={isReadOnly}
                  className={`w-full h-9 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default ${isReadOnly ? "pl-3" : "pl-9"}`}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<Lock className="w-4 h-4" />} title="Akses Informasi">
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Tentukan siapa yang dapat mengakses informasi Sumber Dukungan ini.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { value: "publik" as AksesInfo, label: "Publik", desc: "Dapat diakses oleh publik tanpa masuk ke portal", icon: <Users className="w-4 h-4" />, color: "border-green-400 bg-green-50", iconBg: "bg-green-100 text-green-700" },
                { value: "terbatas" as AksesInfo, label: "Terbatas", desc: "Hanya dapat diakses oleh pengguna yang masuk ke portal", icon: <Lock className="w-4 h-4" />, color: "border-amber-400 bg-amber-50", iconBg: "bg-amber-100 text-amber-700" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { if (!isReadOnly) set("aksesInfo", opt.value) }}
                  disabled={isReadOnly}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition disabled:cursor-default ${form.aksesInfo === opt.value ? opt.color : "border-gray-200 bg-white hover:border-gray-300 disabled:hover:border-gray-200"}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${opt.iconBg}`}>{opt.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Action buttons */}
        {isReadOnly ? (
          <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
            {/* Dinas/Pusat: nonaktif → Pulihkan */}
            {form.status === "nonaktif" && !isSekolah && (
              <button
                type="button"
                onClick={() => setConfirmModal({
                  show: true,
                  title: "Pulihkan Sumber Dukungan",
                  description: "Sumber dukungan akan dikembalikan ke status Terverifikasi dan akan tampil kembali di tabel publik.",
                  onConfirm: handleRestore
                })}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition inline-flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Pulihkan
              </button>
            )}
            {/* Sekolah: own entry + nonaktif → Pulihkan (usulkan pemulihan) */}
            {mounted && isSekolah && viewUsulanDari === "sekolah" && form.status === "nonaktif" && (
              <button
                type="button"
                onClick={() => setShowPulihkanModal(true)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition inline-flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Pulihkan
              </button>
            )}
            {/* Sekolah: own entry + butuh_perbaikan → edit & kirim ulang */}
            {mounted && isSekolah && viewUsulanDari === "sekolah" && form.status === "butuh_perbaikan" && (
              <>
                <button
                  type="button"
                  onClick={() => router.push(`/sumber-rujukan/form?edit=${viewId}`)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition inline-flex items-center justify-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Perbaiki Sumber Dukungan
                </button>
                <button
                  type="button"
                  onClick={() => setShowHapusModal(true)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition"
                >
                  Hapus
                </button>
              </>
            )}
{/* Sekolah: own entry + terverifikasi → edit + nonaktif */}
                {mounted && isSekolah && viewUsulanDari === "sekolah" && form.status === "terverifikasi" && (
                  <>
                    <button
                      type="button"
                      onClick={() => router.push(`/sumber-rujukan/form?edit=${viewId}`)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition inline-flex items-center justify-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNonaktifModal(true)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition"
                    >
                      Nonaktif
                    </button>
                  </>
                )}
                {/* Sekolah: not own entry + terverifikasi → laporkan kesalahan */}
                {mounted && isSekolah && viewUsulanDari !== "sekolah" && form.status === "terverifikasi" && (
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="flex-1 py-2.5 rounded-xl border border-red-300 text-sm font-semibold text-red-600 bg-white hover:bg-red-50 transition"
                  >
                    Laporkan Sumber Dukungan
                  </button>
                )}
                {/* Dinas/Pusat: menunggu penonaktifan → Terima Penonaktifan + Tolak */}
                {mounted && (form.status === "menunggu" || form.status === "menunggu_review") && !isSekolah && form.jenisMenunggu === "penonaktifan" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmModal({
                        show: true,
                        title: "Terima Penonaktifan",
                        description: "Sumber dukungan ini akan dinonaktifkan. Statusnya akan berubah menjadi Nonaktif dan tidak akan ditampilkan di tabel publik.",
                        onConfirm: handleTerimaPenonaktifan
                      })}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition inline-flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Terima Penonaktifan
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTolakModalMode("tolak_penonaktifan"); setShowPerbaikanModal(true) }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition inline-flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Tolak
                    </button>
                  </>
                )}
                {/* Dinas/Pusat: menunggu pemulihan → Terima Pemulihan + Tolak */}
                {mounted && (form.status === "menunggu" || form.status === "menunggu_review") && !isSekolah && form.jenisMenunggu === "pemulihan" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmModal({
                        show: true,
                        title: "Terima Pemulihan",
                        description: "Sumber dukungan ini akan dikembalikan ke status Terverifikasi dan akan tampil kembali di tabel publik.",
                        onConfirm: handleVerify
                      })}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition inline-flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Terima Pemulihan
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTolakModalMode("tolak_pemulihan"); setShowPerbaikanModal(true) }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition inline-flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Tolak
                    </button>
                  </>
                )}
                {/* Dinas/Pusat: menunggu laporan perbaikan (item orang lain) → Terima Laporan + Tolak */}
                {mounted && (form.status === "menunggu" || form.status === "menunggu_review") && !isSekolah && form.jenisMenunggu === "perbaikan_laporan" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmModal({
                        show: true,
                        title: "Terima Laporan",
                        description: "Laporan perbaikan data akan diterima. Status sumber dukungan berubah menjadi Ditolak dan admin sekolah perlu memperbaiki datanya.",
                        onConfirm: handleTerimaPerbaikanNonSekolah
                      })}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition inline-flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Terima Laporan
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTolakModalMode("tolak_laporan"); setShowPerbaikanModal(true) }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition inline-flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Tolak
                    </button>
                  </>
                )}
                {/* Dinas/Pusat: menunggu pengajuan atau perbaikan milik sekolah → Terima + Tolak */}
                {mounted && (form.status === "menunggu" || form.status === "menunggu_review") && !isSekolah && form.jenisMenunggu !== "penonaktifan" && form.jenisMenunggu !== "perbaikan_laporan" && form.jenisMenunggu !== "pemulihan" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmModal({
                        show: true,
                        title: "Terima Pengajuan",
                        description: "Sumber dukungan baru ini akan diverifikasi dan ditampilkan di tabel publik sebagai sumber dukungan terverifikasi.",
                        onConfirm: handleVerify
                      })}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition inline-flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Terima Pengajuan
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTolakModalMode("tolak"); setShowPerbaikanModal(true) }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition inline-flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Tolak
                    </button>
                  </>
                )}
                {/* Pusat: terverifikasi → Edit + Nonaktif */}
                {mounted && form.status === "terverifikasi" && isPusat && (
                  <>
                    <button
                      type="button"
                      onClick={() => router.push(`/sumber-rujukan/form?edit=${viewId}`)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition inline-flex items-center justify-center gap-2"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmModal({
                        show: true,
                        title: "Nonaktifkan Sumber Dukungan",
                        description: "Sumber dukungan ini akan dinonaktifkan dan tidak akan ditampilkan di tabel publik. Anda dapat memulihkannya nanti bila diperlukan.",
                        onConfirm: handleDelete
                      })}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition"
                    >
                      Nonaktif
                    </button>
                  </>
                )}
                {/* Dinas: terverifikasi → Nonaktif */}
                {mounted && form.status === "terverifikasi" && !isSekolah && !isPusat && (
                  <button
                    type="button"
                    onClick={() => setConfirmModal({
                      show: true,
                      title: "Nonaktifkan Sumber Dukungan",
                      description: "Sumber dukungan ini akan dinonaktifkan dan tidak akan ditampilkan di tabel publik. Anda dapat memulihkannya nanti bila diperlukan.",
                      onConfirm: handleDelete
                    })}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition"
                  >
                    Nonaktif
                  </button>
                )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-2 pb-8">
            {duplicateError && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                <p className="text-xs text-red-600">{duplicateError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push(getRujukanFormExitHref())}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (mounted && isSekolah && isEdit && (form.status === "terverifikasi" || form.status === "butuh_perbaikan")) {
                    setShowAjukanModal(true)
                  } else {
                    handleSubmit()
                  }
                }}
                disabled={!canSubmit}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isEdit && mounted && isSekolah && (form.status === "terverifikasi" || form.status === "butuh_perbaikan") ? "Ajukan Pengubahan" : isEdit ? "Simpan Pengubahan" : (mounted && isSekolah) ? "Kirim Usulan" : "Simpan Sumber Dukungan"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showAjukanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setShowAjukanModal(false); setAjukanAlasan("") }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                <Pencil className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Ajukan Pengubahan</h3>
                <p className="text-xs text-gray-500">Jelaskan alasan pengubahan data ini.</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Instansi</p>
                <p className="text-sm text-gray-900">{form.namaInstansi}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Pengubahan</label>
                <textarea
                  value={ajukanAlasan}
                  onChange={(e) => setAjukanAlasan(e.target.value)}
                  placeholder="Jelaskan alasan pengubahan data..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  rows={4}
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowAjukanModal(false); setAjukanAlasan("") }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={() => { setShowAjukanModal(false); handleSubmit() }}
                disabled={!ajukanAlasan.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ajukan Pengubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {showHapusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowHapusModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Hapus Sumber Dukungan</h3>
                <p className="text-xs text-gray-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700">Apakah Anda yakin ingin menghapus <span className="font-semibold">{form.namaInstansi}</span>? Data akan dihapus permanen.</p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowHapusModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSekolahHapus}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {showNonaktifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setShowNonaktifModal(false); setNonaktifAlasan("") }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Usulkan Penonaktifan</h3>
                <p className="text-xs text-gray-500">Jelaskan alasan penonaktifan data ini.</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Instansi</p>
                <p className="text-sm text-gray-900">{form.namaInstansi}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Penonaktifan</label>
                <textarea
                  value={nonaktifAlasan}
                  onChange={(e) => setNonaktifAlasan(e.target.value)}
                  placeholder="Jelaskan alasan penonaktifan..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  rows={4}
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowNonaktifModal(false); setNonaktifAlasan("") }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSekolahNonaktif}
                disabled={!nonaktifAlasan.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Kirim Usulan
              </button>
            </div>
          </div>
        </div>
      )}

      {showPulihkanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setShowPulihkanModal(false); setPulihkanAlasan("") }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-100">
                <RotateCcw className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Usulkan Pemulihan</h3>
                <p className="text-xs text-gray-500">Jelaskan alasan pemulihan data ini.</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Instansi</p>
                <p className="text-sm text-gray-900">{form.namaInstansi}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Pemulihan</label>
                <textarea
                  value={pulihkanAlasan}
                  onChange={(e) => setPulihkanAlasan(e.target.value)}
                  placeholder="Jelaskan alasan pemulihan..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  rows={4}
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowPulihkanModal(false); setPulihkanAlasan("") }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitPulihkan}
                disabled={!pulihkanAlasan.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Kirim Usulan
              </button>
            </div>
          </div>
        </div>
      )}

      {showPerbaikanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPerbaikanModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {tolakModalMode === "tolak_penonaktifan" ? "Tolak Penonaktifan" : tolakModalMode === "tolak_laporan" ? "Tolak Laporan" : tolakModalMode === "tolak_pemulihan" ? "Tolak Pemulihan" : "Tolak"}
                </h3>
                <p className="text-xs text-gray-500">Jelaskan alasan penolakan.</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-900">
                  {tolakModalMode === "tolak_penonaktifan" && "Penolakan akan dikirim ke admin sekolah. Status tetap Terverifikasi dan item akan tetap aktif di tabel publik."}
                  {tolakModalMode === "tolak_laporan" && "Penolakan akan dikirim ke admin sekolah. Status tetap Terverifikasi dan item akan tetap aktif di tabel publik."}
                  {tolakModalMode === "tolak_pemulihan" && "Penolakan akan dikirim ke admin sekolah. Status akan tetap Nonaktif dan tidak dapat dipulihkan."}
                  {tolakModalMode === "tolak" && "Penolakan akan dikirim ke admin sekolah. Status berubah menjadi Ditolak dan admin sekolah perlu memperbaiki data."}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Instansi</p>
                <p className="text-sm font-bold text-gray-900">{form.namaInstansi}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Penolakan</label>
                <textarea
                  value={perbaikanCatatan}
                  onChange={(e) => setPerbaikanCatatan(e.target.value)}
                  placeholder="Jelaskan alasan penolakan..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  rows={4}
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowPerbaikanModal(false); setPerbaikanCatatan("") }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitPerbaikan}
                disabled={!perbaikanCatatan.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {tolakModalMode === "tolak_penonaktifan" ? "Tolak Penonaktifan" : tolakModalMode === "tolak_laporan" ? "Tolak Laporan" : tolakModalMode === "tolak_pemulihan" ? "Tolak Pemulihan" : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowReportModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Flag className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Laporkan Sumber Dukungan</h3>
                <p className="text-xs text-gray-500">Laporan Anda akan dikirim ke admin untuk ditindaklanjuti.</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Instansi</p>
                <p className="text-sm text-gray-900">{form.namaInstansi}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Jenis Laporan <span className="text-red-500">*</span></p>
                <div className="space-y-2">
                  {([
                    { value: "perbaikan", label: "Perbaikan data", desc: "Data yang tercantum tidak akurat atau perlu diperbarui" },
                    { value: "penonaktifan", label: "Usulan Penonaktifan", desc: "Layanan ini sudah tidak aktif atau tidak dapat dihubungi" },
                  ] as { value: "perbaikan" | "penonaktifan"; label: string; desc: string }[]).map((opt) => (
                    <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${reportJenis === opt.value ? "border-red-400 bg-red-50" : "border-gray-200 hover:bg-gray-50"}`}>
                      <input
                        type="radio"
                        name="reportJenis"
                        value={opt.value}
                        checked={reportJenis === opt.value}
                        onChange={() => setReportJenis(opt.value)}
                        className="mt-0.5 accent-red-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan <span className="text-red-500">*</span></label>
                <textarea
                  value={reportAlasan}
                  onChange={(e) => setReportAlasan(e.target.value)}
                  placeholder={reportJenis === "penonaktifan" ? "Jelaskan alasan penonaktifan..." : "Jelaskan data yang perlu diperbaiki..."}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  rows={3}
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowReportModal(false); setReportJenis(null); setReportAlasan("") }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={!reportAlasan.trim() || !reportJenis}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Kirim Laporan
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Nonaktifkan Sumber Dukungan</h3>
                <p className="text-xs text-gray-500">Tuliskan alasan mengapa dinonaktifkan</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Instansi</p>
                <p className="text-sm text-gray-900">{form.namaInstansi}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Nonaktif</label>
                <textarea
                  value={deleteAlasan}
                  onChange={(e) => setDeleteAlasan(e.target.value)}
                  placeholder="Contoh: Data tidak valid atau sudah tidak beroperasi..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  rows={3}
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={!deleteAlasan.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Nonaktifkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Preview Modal */}
      {showMapModal && hasCoordinates(form.tautanGoogleMaps) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMapModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-700" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Pratinjau Lokasi</h3>
              </div>
              <button onClick={() => setShowMapModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[400px]">
              {(() => {
                const coords = extractCoordinates(form.tautanGoogleMaps)
                const src = coords
                  ? `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&output=embed`
                  : `https://maps.google.com/maps?q=${encodeURIComponent(form.tautanGoogleMaps)}&output=embed`
                return (
                  <iframe
                    src={src}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Peta Lokasi"
                  />
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmModal({ ...confirmModal, show: false })} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
              <p className="text-sm text-gray-600 mb-6">{confirmModal.description}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm()
                    setConfirmModal({ ...confirmModal, show: false })
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
                >
                  Ya, Lanjutkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RujukanFormFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <p className="text-sm text-gray-500">Memuat…</p>
    </div>
  )
}

export function RujukanForm() {
  return (
    <Suspense fallback={<RujukanFormFallback />}>
      <RujukanFormInner />
    </Suspense>
  )
}
