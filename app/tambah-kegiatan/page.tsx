"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Calendar, Plus, Trash2, Users,
  CheckCircle, PlayCircle, Clock, FileCheck,
  Landmark, Building2, GraduationCap, Heart, HelpCircle,
  MapPin, Link, Hash,
} from "lucide-react"
import {
  KAB_KOTA_ACEH, getKecamatanList, getKelurahanList,
} from "@/lib/wilayah-aceh"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type StatusKegiatan = "menunggu" | "berlangsung" | "selesai" | "terealisasi"

interface PesertaItem {
  kategori: string
  jumlah: string
}

interface PublikasiLink {
  url: string
  jenisMedia: string
}

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

interface KegiatanForm {
  namaKegiatan: string
  penyelenggara: string[]
  tanggalMulai: string
  tanggalSelesai: string
  deskripsiKegiatan: string
  pelaksanaan: ("luring" | "daring")[]
  provinsi: string
  kabupatenKota: string
  kecamatan: string
  kelurahan: string
  alamatJalan: string
  kodePos: string
  linkGoogleMap: string
  tautanMeeting: string
  peserta: PesertaItem[]
  publikasiLinks: PublikasiLink[]
  linkDokumentasi: string
  status: StatusKegiatan
  aksesInfo: "publik" | "terbatas"
}

// ---------------------------------------------------------------------------
// Seed data (must match KegiatanView SEED_DATA)
// ---------------------------------------------------------------------------
const SEED_DATA = [
  { id: "kg-1", namaKegiatan: "Workshop PKSA", penyelenggara: ["Sekolah"], tanggalMulai: "2025-04-15", tanggalSelesai: "2025-04-15", deskripsiKegiatan: "Workshop pengenalan isu kekerasan pada anak", pelaksanaan: ["luring"] as ("luring" | "daring")[], provinsi: "Aceh", kabupatenKota: "Banda Aceh", kecamatan: "Baiturrahman", kelurahan: "Peuniti", alamatJalan: "Aula Sekolah SDN 01", kodePos: "", linkGoogleMap: "", tautanMeeting: "", peserta: [{ kategori: "Guru", jumlah: "20" }, { kategori: "Siswa", jumlah: "30" }], linkDokumentasi: "", status: "selesai" as StatusKegiatan },
  { id: "kg-2", namaKegiatan: "Sosialisasi Hak Anak", penyelenggara: ["Pusat", "Sekolah"], tanggalMulai: "2025-06-20", tanggalSelesai: "2025-06-21", deskripsiKegiatan: "Sosialisasi hak anak kepada seluruh siswa dan wali kelas", pelaksanaan: ["luring", "daring"] as ("luring" | "daring")[], provinsi: "Aceh", kabupatenKota: "Banda Aceh", kecamatan: "Kuta Alam", kelurahan: "Peunayong", alamatJalan: "Ruang Serbaguna", kodePos: "", linkGoogleMap: "https://maps.google.com", tautanMeeting: "https://zoom.us/j/123", peserta: [{ kategori: "Siswa", jumlah: "80" }, { kategori: "Masyarakat", jumlah: "40" }], linkDokumentasi: "https://docs.example.com", status: "berlangsung" as StatusKegiatan },
  { id: "kg-3", namaKegiatan: "Rapat Koordinasi Kelompok Kerja", penyelenggara: ["Dinas Pendidikan", "Dinas Sosial"], tanggalMulai: "2025-07-10", tanggalSelesai: "2025-07-10", deskripsiKegiatan: "Rapat koordinasi bulanan antar anggota kelompok kerja", pelaksanaan: ["luring"] as ("luring" | "daring")[], provinsi: "Aceh", kabupatenKota: "Banda Aceh", kecamatan: "Kuta Raja", kelurahan: "Keudah", alamatJalan: "Kantor Dinas Pendidikan", kodePos: "23123", linkGoogleMap: "", tautanMeeting: "", peserta: [{ kategori: "Guru", jumlah: "30" }], linkDokumentasi: "", status: "menunggu" as StatusKegiatan },
]

const KATEGORI_OPTIONS = ["Guru", "Siswa", "Umum", "Lainnya"]

const JENIS_MEDIA_OPTIONS = ["Instagram", "Facebook", "YouTube", "Twitter / X", "TikTok", "Website", "LinkedIn", "Lainnya"]

const PENYELENGGARA_OPTIONS = [
  "Sekolah",
  "Pusat",
  "Dinas Pendidikan",
  "Dinas PPPA",
  "Dinas Sosial",
  "Dinas Kesehatan",
  "Dinas Kominfo",
  "Dinas Dukbangga",
  "Organisasi Masyarakat",
  "Lainnya",
]

const emptyForm = (): KegiatanForm => ({
  namaKegiatan: "",
  penyelenggara: [],
  tanggalMulai: "",
  tanggalSelesai: "",
  deskripsiKegiatan: "",
  pelaksanaan: [],
  provinsi: "",
  kabupatenKota: "",
  kecamatan: "",
  kelurahan: "",
  alamatJalan: "",
  kodePos: "",
  linkGoogleMap: "",
  tautanMeeting: "",
  peserta: [{ kategori: "", jumlah: "" }],
  publikasiLinks: [{ url: "", jenisMedia: "" }],
  linkDokumentasi: "",
  status: "menunggu",
  aksesInfo: "publik",
})

function getPenyelenggaraIcon(type: string) {
  const lower = type.toLowerCase()
  if (lower === "pusat") return Landmark
  if (lower.startsWith("dinas")) return Building2
  if (lower === "sekolah") return GraduationCap
  if (lower === "organisasi masyarakat") return Heart
  return HelpCircle
}

function getPenyelenggaraColors(type: string) {
  const lower = type.toLowerCase()
  if (lower === "pusat") return { bg: "bg-blue-500/10", text: "text-blue-700" }
  if (lower.startsWith("dinas")) return { bg: "bg-emerald-500/10", text: "text-emerald-700" }
  if (lower === "sekolah") return { bg: "bg-amber-500/10", text: "text-amber-700" }
  if (lower === "organisasi masyarakat") return { bg: "bg-purple-500/10", text: "text-purple-700" }
  return { bg: "bg-gray-500/10", text: "text-gray-700" }
}

// ---------------------------------------------------------------------------
// Shared helper components (same as tambah-rujukan)
// ---------------------------------------------------------------------------
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-gray-700">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function TextInput({
  value, onChange, placeholder, type = "text", disabled,
}: {
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

function SelectInput({
  value, onChange, options, placeholder, disabled,
}: {
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
        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </div>
  )
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-4 bg-gray-50 border-b border-gray-200 rounded-t-xl">
        <span className="text-gray-900 flex-shrink-0">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: StatusKegiatan }) {
  if (status === "terealisasi") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
      <CheckCircle className="w-3 h-3" /> Terealisasi
    </span>
  )
  if (status === "selesai") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      <CheckCircle className="w-3 h-3" /> Selesai
    </span>
  )
  if (status === "berlangsung") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
      <PlayCircle className="w-3 h-3" /> Berlangsung
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" /> Terjadwal
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
function TambahKegiatanInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const viewId = searchParams.get("view")
  const activeId = editId ?? viewId
  const isEdit = !!editId
  const isView = !!viewId
  const isReadOnly = isView
  const [role, setRole] = useState<string>("")

  const [form, setForm] = useState<KegiatanForm>(emptyForm)
  const [submitted, setSubmitted] = useState(false)
  const [realizeData, setRealizeData] = useState<{
    jumlahPeserta: number
    tanggalRealisasi: string
    catatan: string
    dokumentasi: string
    createdAt: string
  } | null>(null)
  const [isRealizing, setIsRealizing] = useState(false)
  const [realizeCatatan, setRealizeCatatan] = useState("")

  const [tagInput, setTagInput] = useState("")
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const availableOptions = PENYELENGGARA_OPTIONS.filter((o) => !form.penyelenggara.includes(o))
  const filteredTagOptions = tagInput
    ? availableOptions.filter((o) => o.toLowerCase().includes(tagInput.toLowerCase()))
    : availableOptions

  useEffect(() => {
    try {
      const authRaw = localStorage.getItem("auth")
      if (authRaw) {
        const parsed = JSON.parse(authRaw) as { role: string }
        setRole(parsed.role)
      }
    } catch {}
  }, [])

  const isPast =
    !isReadOnly &&
    form.tanggalMulai &&
    form.tanggalSelesai &&
    new Date(form.tanggalSelesai).setHours(23, 59, 59, 999) < new Date().setHours(0, 0, 0, 0)

  useEffect(() => {
    if (!isReadOnly && form.tanggalMulai && form.tanggalSelesai) {
      const mulai = new Date(form.tanggalMulai)
      const selesai = new Date(form.tanggalSelesai)
      selesai.setHours(23, 59, 59, 999)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selesai < today) {
        setForm(prev => ({ ...prev, status: "terealisasi" }))
      } else if (mulai <= today && today <= selesai) {
        setForm(prev => ({ ...prev, status: "berlangsung" }))
      } else {
        setForm(prev => ({ ...prev, status: "menunggu" }))
      }
    }
  }, [form.tanggalMulai, form.tanggalSelesai, isReadOnly])

  useEffect(() => {
    if (!activeId) return
    let storedItems: Array<Record<string, unknown>> = []
    try {
      storedItems = JSON.parse(sessionStorage.getItem("kegiatanList") ?? "[]")
    } catch {}
    const fromStorage = storedItems.find((d) => d.id === activeId) as Record<string, unknown> | undefined
    const fromSeed = (SEED_DATA as Array<Record<string, unknown>>).find((d) => d.id === activeId)
    // Merge: seed base + sessionStorage overrides take priority
    const existing = fromSeed ? { ...fromSeed, ...(fromStorage ?? {}) } : fromStorage
    if (existing) {
      setForm({
        namaKegiatan: (existing.namaKegiatan as string) ?? "",
        penyelenggara: Array.isArray(existing.penyelenggara) ? existing.penyelenggara as string[] : typeof existing.penyelenggara === "string" && existing.penyelenggara ? [existing.penyelenggara as string] : [],
        tanggalMulai: (existing.tanggalMulai as string) ?? (existing.waktuKegiatan as string) ?? "",
        tanggalSelesai: (existing.tanggalSelesai as string) ?? "",
        deskripsiKegiatan: (existing.deskripsiKegiatan as string) ?? "",
        pelaksanaan: Array.isArray(existing.pelaksanaan) ? existing.pelaksanaan as ("luring" | "daring")[] : [],
        provinsi: (existing.provinsi as string) ?? "",
        kabupatenKota: (existing.kabupatenKota as string) ?? "",
        kecamatan: (existing.kecamatan as string) ?? "",
        kelurahan: (existing.kelurahan as string) ?? "",
        alamatJalan: (existing.alamatJalan as string) ?? (existing.lokasi as string) ?? "",
        kodePos: (existing.kodePos as string) ?? "",
        linkGoogleMap: (existing.linkGoogleMap as string) ?? "",
        tautanMeeting: (existing.tautanMeeting as string) ?? "",
        peserta: Array.isArray(existing.peserta) ? existing.peserta as PesertaItem[] : [],
        publikasiLinks: Array.isArray(existing.publikasiLinks) ? existing.publikasiLinks as PublikasiLink[] : [],
        linkDokumentasi: (existing.linkDokumentasi as string) ?? "",
        status: (existing.status as StatusKegiatan) ?? "menunggu",
        aksesInfo: (existing.aksesInfo as "publik" | "terbatas") ?? "publik",
      })
      if (existing.realize) {
        setRealizeData(existing.realize as typeof realizeData)
      }
    }
  }, [activeId])

  const set = <K extends keyof KegiatanForm>(k: K, v: KegiatanForm[K]) => {
    if (k === "provinsi") {
      setForm((prev) => ({ ...prev, provinsi: v as string, kabupatenKota: "", kecamatan: "", kelurahan: "" }))
    } else if (k === "kabupatenKota") {
      setForm((prev) => ({ ...prev, kabupatenKota: v as string, kecamatan: "", kelurahan: "" }))
    } else if (k === "kecamatan") {
      setForm((prev) => ({ ...prev, kecamatan: v as string, kelurahan: "" }))
    } else {
      setForm((prev) => ({ ...prev, [k]: v }))
    }
  }

  const canSubmit =
    form.namaKegiatan.trim() !== "" &&
    form.penyelenggara.length > 0 &&
    form.tanggalMulai.trim() !== "" &&
    form.tanggalSelesai.trim() !== "" &&
    form.deskripsiKegiatan.trim() !== "" &&
    (form.status !== "terealisasi" || form.linkDokumentasi.trim() !== "")

  const handleSubmit = () => {
    if (!canSubmit) return
    try {
      const allData = JSON.parse(sessionStorage.getItem("kegiatanList") ?? "[]") as Array<Record<string, unknown>>
      if (isEdit && editId) {
        const updated = allData.map((item) => {
          if (item.id !== editId) return item
          return { ...item, ...form, peserta: form.peserta }
        })
        if (!allData.find((item) => item.id === editId)) {
          updated.push({ id: editId, ...form, createdAt: new Date().toISOString() })
        }
        sessionStorage.setItem("kegiatanList", JSON.stringify(updated))
      } else {
        const newItem: Record<string, unknown> = {
          id: `kg-${Date.now()}`,
          namaKegiatan: form.namaKegiatan,
          penyelenggara: form.penyelenggara,
          tanggalMulai: form.tanggalMulai,
          tanggalSelesai: form.tanggalSelesai,
          deskripsiKegiatan: form.deskripsiKegiatan,
          pelaksanaan: form.pelaksanaan,
          provinsi: form.provinsi,
          kabupatenKota: form.kabupatenKota,
          kecamatan: form.kecamatan,
          kelurahan: form.kelurahan,
          alamatJalan: form.alamatJalan,
          kodePos: form.kodePos,
          linkGoogleMap: form.linkGoogleMap,
          tautanMeeting: form.tautanMeeting,
          peserta: form.peserta,
          publikasiLinks: form.publikasiLinks,
          linkDokumentasi: form.linkDokumentasi,
          status: form.status,
          aksesInfo: form.aksesInfo,
          createdAt: new Date().toISOString(),
        }
        sessionStorage.setItem("kegiatanList", JSON.stringify([...allData, newItem]))
      }
      window.dispatchEvent(new CustomEvent("kegiatanUpdated"))
    } catch {}
    setSubmitted(true)
  }

  useEffect(() => {
    if (!submitted) return
    const t = setTimeout(() => {
      if (role === "sekolah") {
        window.location.href = "/dashboard?menu=kegiatan"
      } else {
        router.back()
      }
    }, 1500)
    return () => clearTimeout(t)
  }, [submitted])

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Berhasil Diperbarui" : "Berhasil Ditambahkan"}</h2>
          <p className="text-sm text-gray-500 mt-1">{isEdit ? "Kegiatan berhasil diperbarui." : "Kegiatan baru berhasil ditambahkan."}</p>
        </div>
      </div>
    )
  }

  const isFormDisabled = isReadOnly && !isRealizing

  const handleRealize = () => {
    if (!isRealizing || !viewId) return
    try {
      const stored = JSON.parse(sessionStorage.getItem("kegiatanList") ?? "[]") as Array<Record<string, unknown>>
      const idx = stored.findIndex((i) => i.id === viewId)
      const updated = { ...(idx !== -1 ? stored[idx] : form), ...form, status: "terealisasi", realize: { catatan: realizeCatatan, linkDokumentasi: form.linkDokumentasi, createdAt: new Date().toISOString() } }
      if (idx !== -1) stored[idx] = updated
      else stored.push({ id: viewId, ...updated })
      sessionStorage.setItem("kegiatanList", JSON.stringify(stored))
      window.dispatchEvent(new CustomEvent("kegiatanUpdated"))
    } catch {}
    setSubmitted(true)
  }

  const pageTitle = isView ? "Detail Kegiatan" : isEdit ? "Edit Kegiatan" : "Tambah Kegiatan"
  const pageSubtitle = isView ? "Informasi lengkap kegiatan" : isEdit ? "Perbarui informasi kegiatan" : "Lengkapi semua informasi yang diperlukan"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => {
              if (role === "sekolah" || role === "dinas") {
                window.location.href = "/dashboard?menu=kegiatan"
              } else {
                router.back()
              }
            }}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900">{pageTitle}</h1>
            {isView ? (
              <div className="mt-1">
                <StatusBadge status={form.status} />
              </div>
            ) : (
              <p className="text-xs text-gray-500">{pageSubtitle}</p>
            )}
          </div>
          {isView && form.status === "selesai" && !isRealizing && (
            <button
              onClick={() => { setIsRealizing(true); setRealizeCatatan("") }}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition shrink-0"
            >
              <FileCheck className="w-4 h-4" /> Laporkan Realisasi
            </button>
          )}
        </div>
      </div>

      {/* Banner realisasi */}
      {isRealizing && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3.5 flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800">
              Silakan sesuaikan detail kegiatan dengan realisasi di lapangan. Nama kegiatan dan deskripsi tidak dapat diubah.
            </p>
          </div>
        </div>
      )}

      {/* Form body */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Info Kegiatan */}
        <SectionCard icon={<Calendar className="w-4 h-4" />} title="Informasi Kegiatan">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <FieldLabel required={!isReadOnly}>Nama Kegiatan</FieldLabel>
              <TextInput
                value={form.namaKegiatan}
                onChange={(v) => set("namaKegiatan", v)}
                placeholder="Contoh: Workshop PKSA"
                disabled={isReadOnly}
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <FieldLabel required={!isReadOnly}>Deskripsi</FieldLabel>
              <textarea
                value={form.deskripsiKegiatan}
                onChange={(e) => set("deskripsiKegiatan", e.target.value)}
                placeholder="Jelaskan tujuan dan hasil kegiatan..."
                rows={4}
                disabled={isReadOnly}
                className="p-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required={!isFormDisabled}>Tanggal Mulai</FieldLabel>
              <TextInput
                type="date"
                value={form.tanggalMulai}
                onChange={(v) => set("tanggalMulai", v)}
                disabled={isFormDisabled}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required={!isFormDisabled}>Tanggal Selesai</FieldLabel>
              <TextInput
                type="date"
                value={form.tanggalSelesai}
                onChange={(v) => set("tanggalSelesai", v)}
                disabled={isFormDisabled}
              />
            </div>
          </div>
        </SectionCard>

        {/* Penyelenggara */}
        <SectionCard icon={<Building2 className="w-4 h-4" />} title="Penyelenggara">
          {isFormDisabled ? (
            <div className="flex flex-col gap-1.5">
              {form.penyelenggara.length > 0 ? form.penyelenggara.map((p) => {
                const Icon = getPenyelenggaraIcon(p)
                const colors = getPenyelenggaraColors(p)
                return (
                  <div key={p} className="flex items-center gap-2 py-1.5 px-2 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{p}</span>
                  </div>
                )
              }) : <span className="text-sm text-gray-400">-</span>}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onFocus={() => setShowTagDropdown(true)}
                  onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                  onClick={() => setShowTagDropdown(true)}
                  placeholder="Tambah Penyelenggara"
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {showTagDropdown && filteredTagOptions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredTagOptions.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); set("penyelenggara", [...form.penyelenggara, o]); setTagInput(""); setShowTagDropdown(false) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-gray-700"
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {form.penyelenggara.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {form.penyelenggara.map((p) => {
                    const Icon = getPenyelenggaraIcon(p)
                    const colors = getPenyelenggaraColors(p)
                    return (
                      <div key={p} className="flex items-center gap-2 py-1.5 px-2 bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${colors.text}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 flex-1">{p}</span>
                        <button type="button" onClick={() => set("penyelenggara", form.penyelenggara.filter((x) => x !== p))} className="p-0.5 hover:bg-gray-200 rounded-full">
                          <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Peserta */}
        <SectionCard icon={<Users className="w-4 h-4" />} title="Peserta">
          {isFormDisabled ? (
            <div className="flex flex-col gap-2">
              {form.peserta.length > 0 ? form.peserta.map((p, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 min-w-[100px]">{p.kategori}</span>
                  <span className="text-sm text-gray-500">: {p.jumlah} orang</span>
                </div>
              )) : <span className="text-sm text-gray-400">-</span>}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {form.peserta.map((p, i) => {
                const predefined = ["Guru", "Siswa", "Umum"]
                const isCustom = p.kategori && !predefined.includes(p.kategori)
                const displayValue = isCustom ? "Lainnya" : p.kategori
                const takenByOthers = form.peserta
                  .filter((_, idx) => idx !== i)
                  .map((r) => r.kategori)
                  .filter((k) => predefined.includes(k))
                const availableOptions = ["Lainnya", ...predefined.filter((opt) => !takenByOthers.includes(opt))]
                return (
                <div key={i}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1">
                        <SelectInput
                          value={displayValue}
                          onChange={(v) => {
                            const next = [...form.peserta]
                            next[i] = { ...next[i], kategori: v }
                            set("peserta", next)
                          }}
                          options={availableOptions}
                          placeholder="Pilih Kategori"
                        />
                      </div>
                      {displayValue === "Lainnya" && (
                        <input
                          value={p.kategori !== "Lainnya" ? p.kategori : ""}
                          onChange={(e) => {
                            const next = [...form.peserta]
                            next[i] = { ...next[i], kategori: e.target.value }
                            set("peserta", next)
                          }}
                          placeholder="Tulis kategori..."
                          className="flex-1 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={p.jumlah}
                      onChange={(e) => {
                        const next = [...form.peserta]
                        next[i] = { ...next[i], jumlah: e.target.value }
                        set("peserta", next)
                      }}
                      placeholder="Jumlah"
                      className="w-24 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">orang</span>
                    <button
                      type="button"
                      onClick={() => set("peserta", form.peserta.filter((_, idx) => idx !== i))}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )})}
              <button
                type="button"
                onClick={() => set("peserta", [...form.peserta, { kategori: "", jumlah: "" }])}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg px-3 py-2 transition w-full justify-center"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Kategori
              </button>
            </div>
          )}
        </SectionCard>

        {/* Link Publikasi Acara */}
        <SectionCard icon={<Link className="w-4 h-4" />} title="Link Publikasi Acara">
          {isFormDisabled ? (
            <div className="flex flex-col gap-2">
              {Array.isArray(form.publikasiLinks) && form.publikasiLinks.length > 0 ? form.publikasiLinks.map((p, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium text-gray-700 min-w-[90px]">{p.jenisMedia || "-"}</span>
                  <span className="text-xs text-blue-600 truncate">{p.url || "-"}</span>
                </div>
              )) : <span className="text-sm text-gray-400">-</span>}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {Array.isArray(form.publikasiLinks) && form.publikasiLinks.map((p, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2">
                    <div className="w-28 shrink-0">
                      <SelectInput
                        value={p.jenisMedia}
                        onChange={(v) => {
                          const next = [...form.publikasiLinks]
                          next[i] = { ...next[i], jenisMedia: v }
                          set("publikasiLinks", next)
                        }}
                        options={JENIS_MEDIA_OPTIONS}
                        placeholder="Media"
                      />
                    </div>
                    <input
                      value={p.url}
                      onChange={(e) => {
                        const next = [...form.publikasiLinks]
                        next[i] = { ...next[i], url: e.target.value }
                        set("publikasiLinks", next)
                      }}
                      placeholder="https://..."
                      className="flex-1 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => set("publikasiLinks", form.publikasiLinks.filter((_, idx) => idx !== i))}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set("publikasiLinks", [...form.publikasiLinks, { url: "", jenisMedia: "" }])}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg px-3 py-2 transition w-full justify-center"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Link Publikasi
              </button>
            </div>
          )}
        </SectionCard>

        {/* Lokasi */}
        <SectionCard icon={<MapPin className="w-4 h-4" />} title="Lokasi">
          <div className="flex flex-col gap-4">
            {/* Pelaksanaan */}
            <div className="flex flex-col gap-2">
              <FieldLabel required={!isFormDisabled}>Pelaksanaan Kegiatan</FieldLabel>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.pelaksanaan.includes("luring")}
                    onChange={() => {
                      const nowLuring = !form.pelaksanaan.includes("luring")
                      const next = nowLuring
                        ? [...form.pelaksanaan, "luring"]
                        : form.pelaksanaan.filter((x) => x !== "luring")
                      setForm((prev) => ({
                        ...prev,
                        pelaksanaan: next,
                        ...(!nowLuring ? { provinsi: "", kabupatenKota: "", kecamatan: "", kelurahan: "", alamatJalan: "", kodePos: "", linkGoogleMap: "" } : {}),
                      }))
                    }}
                    disabled={isFormDisabled}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Luring
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.pelaksanaan.includes("daring")}
                    onChange={() => {
                      const nowDaring = !form.pelaksanaan.includes("daring")
                      const next = nowDaring
                        ? [...form.pelaksanaan, "daring"]
                        : form.pelaksanaan.filter((x) => x !== "daring")
                      setForm((prev) => ({
                        ...prev,
                        pelaksanaan: next,
                        ...(!nowDaring ? { tautanMeeting: "" } : {}),
                      }))
                    }}
                    disabled={isFormDisabled}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Daring
                </label>
              </div>
            </div>

            {form.pelaksanaan.includes("luring") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel required={!isFormDisabled}>Provinsi</FieldLabel>
                  <SelectInput
                    value={form.provinsi}
                    onChange={(v) => set("provinsi", v)}
                    options={PROVINSI_OPTIONS}
                    placeholder="Pilih Provinsi"
                    disabled={isFormDisabled}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel required={!isFormDisabled}>Kabupaten / Kota</FieldLabel>
                  <SelectInput
                    value={form.kabupatenKota}
                    onChange={(v) => set("kabupatenKota", v)}
                    options={KAB_KOTA_ACEH}
                    placeholder={form.provinsi ? "Pilih Kabupaten / Kota" : "Pilih Provinsi dulu"}
                    disabled={isFormDisabled || !form.provinsi}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Kecamatan</FieldLabel>
                  <SelectInput
                    value={form.kecamatan}
                    onChange={(v) => set("kecamatan", v)}
                    options={getKecamatanList(form.kabupatenKota)}
                    placeholder={form.kabupatenKota ? "Pilih Kecamatan" : "Pilih Kabupaten / Kota dulu"}
                    disabled={isFormDisabled || !form.kabupatenKota}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Kelurahan / Desa</FieldLabel>
                  <SelectInput
                    value={form.kelurahan}
                    onChange={(v) => set("kelurahan", v)}
                    options={getKelurahanList(form.kabupatenKota, form.kecamatan)}
                    placeholder={form.kecamatan ? "Pilih Kelurahan / Desa" : "Pilih Kecamatan dulu"}
                    disabled={isFormDisabled || !form.kecamatan}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Nama Jalan / Gedung</FieldLabel>
                  <TextInput
                    value={form.alamatJalan}
                    onChange={(v) => set("alamatJalan", v)}
                    placeholder="Contoh: Aula Sekolah SDN 01"
                    disabled={isFormDisabled}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Kode Pos</FieldLabel>
                  <TextInput
                    value={form.kodePos}
                    onChange={(v) => set("kodePos", v)}
                    placeholder="Contoh: 23123"
                    disabled={isFormDisabled}
                  />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <FieldLabel>Link Google Map</FieldLabel>
                  <TextInput
                    value={form.linkGoogleMap}
                    onChange={(v) => set("linkGoogleMap", v)}
                    placeholder="https://maps.google.com/..."
                    disabled={isFormDisabled}
                  />
                </div>
              </div>
            )}

            {form.pelaksanaan.includes("daring") && (
              <div className="flex flex-col gap-1.5">
                <FieldLabel required={!isFormDisabled}>Tautan Meeting Online</FieldLabel>
                <TextInput
                  value={form.tautanMeeting}
                  onChange={(v) => set("tautanMeeting", v)}
                  placeholder="https://zoom.us/j/..."
                  disabled={isFormDisabled}
                />
              </div>
            )}
          </div>
        </SectionCard>

        {/* Link Dokumentasi */}
        {(isPast || form.linkDokumentasi || isRealizing) && (
          <SectionCard icon={<Link className="w-4 h-4" />} title="Link Dokumentasi">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required={isPast && !isFormDisabled}>Link Dokumentasi Kegiatan</FieldLabel>
              <TextInput
                value={form.linkDokumentasi}
                onChange={(v) => set("linkDokumentasi", v)}
                placeholder="https://..."
                disabled={isFormDisabled}
              />
            </div>
          </SectionCard>
        )}

        {/* Akses Informasi */}
        {!isRealizing && (
          <SectionCard icon={<Users className="w-4 h-4" />} title="Akses Informasi">
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Tentukan siapa yang dapat melihat informasi kegiatan ini.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  { value: "publik" as const, label: "Publik", desc: "Dapat dilihat oleh semua orang tanpa perlu login", icon: <Users className="w-4 h-4" />, color: "border-green-400 bg-green-50", iconBg: "bg-green-100 text-green-700" },
                  { value: "terbatas" as const, label: "Terbatas (Login)", desc: "Hanya dapat dilihat oleh pengguna yang sudah login", icon: <Users className="w-4 h-4" />, color: "border-amber-400 bg-amber-50", iconBg: "bg-amber-100 text-amber-700" },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { if (!isFormDisabled) set("aksesInfo", opt.value) }}
                    disabled={isFormDisabled}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition disabled:cursor-default ${
                      form.aksesInfo === opt.value
                        ? opt.color
                        : "border-gray-200 bg-white hover:border-gray-300 disabled:hover:border-gray-200"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${opt.iconBg}`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* Catatan — hanya saat realisasi */}
        {isRealizing && (
          <SectionCard icon={<FileCheck className="w-4 h-4" />} title="Catatan Realisasi">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Catatan Tambahan</FieldLabel>
              <textarea
                value={realizeCatatan}
                onChange={(e) => setRealizeCatatan(e.target.value)}
                placeholder="Tambahkan catatan jika ada hal yang perlu disampaikan..."
                rows={3}
                className="p-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
              />
            </div>
          </SectionCard>
        )}

        {/* Footer actions */}
        {isRealizing && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsRealizing(false)}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleRealize}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition"
            >
              Simpan Laporan Realisasi
            </button>
          </div>
        )}

        {!isReadOnly && !isRealizing && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                if (role === "sekolah") {
                  window.location.href = "/dashboard?menu=kegiatan"
                } else {
                  router.back()
                }
              }}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isEdit ? "Simpan Perubahan" : "Simpan Kegiatan"}
            </button>
          </div>
        )}

        {isReadOnly && !isRealizing && form.status !== "selesai" && form.status !== "berlangsung" && form.status !== "terealisasi" && (
          <div className="flex gap-3 pt-2 pb-4">
            <a
              href={`/tambah-kegiatan?edit=${viewId}`}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition text-center"
            >
              Edit
            </a>
            <button
              onClick={() => {
                try {
                  const stored = JSON.parse(sessionStorage.getItem("kegiatanList") ?? "[]") as Array<Record<string, unknown>>
                  const filtered = stored.filter((i) => i.id !== viewId)
                  const isSeed = ["kg-1", "kg-2", "kg-3"].includes(viewId ?? "")
                  if (isSeed) {
                    const override = stored.find((i) => i.id === viewId) ?? { id: viewId }
                    sessionStorage.setItem("kegiatanList", JSON.stringify([...filtered, { ...override, status: "dihapus" }]))
                  } else {
                    sessionStorage.setItem("kegiatanList", JSON.stringify(filtered))
                  }
                  window.dispatchEvent(new CustomEvent("kegiatanUpdated"))
                } catch {}
                if (role === "sekolah") {
                  window.location.href = "/dashboard?menu=kegiatan"
                } else {
                  router.back()
                }
              }}
              className="flex-1 py-2.5 rounded-lg border border-red-300 text-red-600 font-medium text-sm hover:bg-red-50 transition"
            >
              Hapus
            </button>
          </div>
        )}

      </div>

    </div>
  )
}

export default function TambahKegiatanPage() {
  return (
    <Suspense>
      <TambahKegiatanInner />
    </Suspense>
  )
}
