"use client"

import { useEffect, useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft, AlertTriangle, Users, Calendar, FileText,
  CheckCircle, Clock, Plus, X, XCircle, ChevronDown, Trash2, MoreVertical, Copy, Check,
} from "lucide-react"
import { KAB_KOTA_BY_PROVINSI } from "@/data/kabKotaData"

type StatusPelanggaran = "baru" | "proses" | "selesai" | "ditutup"
type TingkatKeparahan = "urgen" | "sangat_urgen"
type Pelapor = "laporan_masyarakat" | "laporan_sekolah" | "laporan_kemendikdasmen" | "temuan_pengawas" | "media" | "lainnya"

interface IndividuItem {
  nama: string
  umur: string
  status: string
  statusLainnya?: string
  jenisKelamin: "Laki-laki" | "Perempuan" | ""
}

interface AsalGroup {
  asalSekolah: string
  asalLainnya?: string
  jumlah: string
  individu: IndividuItem[]
}

interface KronologiEntry {
  tanggal: string
  jam: string
  lokasi: string
  keterangan: string
}

interface UnsurItem {
  peran: "pelaku" | "korban" | "saksi" | "lainnya" | ""
  peranLainnya?: string
  kategori: string
  asalGroups: AsalGroup[]
}

interface PelanggaranItem {
  id: string
  nomorKasus?: string
  namaSekolah: string[]
  npsnSekolah?: string[]
  unsurTerlibat: UnsurItem[]
  tanggalTerjadi: string
  kronologi?: KronologiEntry[]
  kategori: string
  tingkatKeparahan: TingkatKeparahan
  pelapor: Pelapor
  pelaporLainnya?: string
  kontakPelapor?: string
  tindakLanjut: string
  pic: string
  tingkatKelompokKerja?: "" | "provinsi" | "kabkota"
  wilayah?: string
  kabupatenKota?: string
  dokumentasi: string
  rekomendasi: string
  motif?: string
  tanggalPelaporan?: string
  status: StatusPelanggaran
  createdAt: string
  updatedAt: string
  dibuatOleh: string
  diperbaruiOleh: string
}

function generateNomorKasus(existing: PelanggaranItem[]): string {
  const maxNomor = existing.reduce((max, item) => {
    const n = parseInt(item.nomorKasus ?? "", 10)
    return Number.isFinite(n) && n > max ? n : max
  }, 0)
  return String(maxNomor + 1).padStart(3, "0")
}

const SEKOLAH_OPTIONS = [
  { npsn: "10101001", nama: "SDN 1 Banda Aceh" },
  { npsn: "10101002", nama: "SDN 2 Banda Aceh" },
  { npsn: "10101003", nama: "SMPN 1 Banda Aceh" },
  { npsn: "10101004", nama: "SMAN 1 Banda Aceh" },
  { npsn: "10101005", nama: "SMKN 1 Banda Aceh" },
  { npsn: "10201001", nama: "SDN 1 Medan" },
  { npsn: "10301002", nama: "SMPN 2 Jakarta Pusat" },
  { npsn: "10401003", nama: "SMAN 3 Surabaya" },
  { npsn: "10501004", nama: "SDN 4 Bandung" },
  { npsn: "10601005", nama: "SMPN 5 Yogyakarta" },
  { npsn: "10701002", nama: "SMKN 2 Semarang" },
  { npsn: "10801001", nama: "SDN 1 Denpasar" },
  { npsn: "10901003", nama: "SMPN 3 Makassar" },
  { npsn: "11001002", nama: "SMAN 2 Palembang" },
]

const UNSUR_OPTIONS = [
  "Murid TKA", "Murid TKB",
  "Murid K1", "Murid K2", "Murid K3", "Murid K4", "Murid K5", "Murid K6",
  "Murid K7", "Murid K8", "Murid K9", "Murid K10", "Murid K11", "Murid K12", "Murid K13",
  "Pesdik Nonformal",
  "Guru", "Tenaga Kependidikan", "Kepala Sekolah", "Warga Sekolah",
]
  .sort((a, b) => a.localeCompare(b, "id", { numeric: true }))
  .concat("Lainnya")

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

const KATEGORI_PELANGGARAN = [
  "Perundungan", "Perundungan Siber", "Kekerasan Fisik",
  "Kekerasan Seksual", "Kekerasan Psikis", "Diskriminasi",
  "Intoleransi", "Pencurian", "Vandalisme", "Penyalahgunaan NAPZA",
  "Pelanggaran Aturan Sekolah", "Pelanggaran Hukum", "Lainnya",
]

const EDIT_FIELD_LABELS: Record<string, string> = {
  namaSekolah: "Nama Sekolah",
  tanggalTerjadi: "Tanggal Terjadi",
  kronologi: "Kronologi Kejadian",
  unsurTerlibat: "Unsur yang Terlibat",
  kategori: "Kategori Pelanggaran",
  tingkatKeparahan: "Tingkat Keparahan",
  pelapor: "Pelapor",
  pelaporLainnya: "Pelapor Lainnya",
  kontakPelapor: "Kontak Pelapor",
  pic: "Penanggung Jawab",
  tingkatKelompokKerja: "Kewenangan",
  wilayah: "Provinsi",
  kabupatenKota: "Kabupaten/Kota",
  tindakLanjut: "Tindak Lanjut",
  dokumentasi: "Dokumentasi",
  rekomendasi: "Rekomendasi",
  motif: "Motif Kejadian",
  tanggalPelaporan: "Tanggal Pelaporan",
  status: "Status",
}

function formatEditFieldValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "-"
  if (key === "tingkatKelompokKerja") {
    return value === "provinsi" ? "Kelompok Kerja Provinsi" : value === "kabkota" ? "Kelompok Kerja Kab/Kota" : "-"
  }
  if (key === "kronologi" && Array.isArray(value)) {
    if (value.length === 0) return "-"
    return value
      .map((e: any) => {
        const waktu = [e?.tanggal, e?.jam].filter(Boolean).join(" ")
        return `${waktu || "-"}${e?.lokasi ? ` @ ${e.lokasi}` : ""}: ${e?.keterangan || "-"}`
      })
      .join(" | ")
  }
  if (key === "unsurTerlibat" && Array.isArray(value)) {
    if (value.length === 0) return "-"
    return value
      .map((u: any) => {
        const asal = Array.isArray(u?.asalGroups)
          ? u.asalGroups
              .map((g: any) => {
                const individu = Array.isArray(g?.individu)
                  ? g.individu.map((p: any) => p?.nama).filter(Boolean).join(", ")
                  : ""
                return `${g?.asalSekolah || "-"}${g?.jumlah ? ` (${g.jumlah} orang)` : ""}${individu ? `: ${individu}` : ""}`
              })
              .join("; ")
          : ""
        return `${u?.peran || "-"}${u?.kategori ? ` - ${u.kategori}` : ""}${asal ? ` [${asal}]` : ""}`
      })
      .join(" | ")
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "-"
  }
  return String(value)
}

function diffPelanggaranFields(before: Record<string, unknown>, after: Record<string, unknown>) {
  return Object.keys(EDIT_FIELD_LABELS)
    .map((key) => {
      const from = formatEditFieldValue(key, before[key])
      const to = formatEditFieldValue(key, after[key])
      return from !== to ? { field: EDIT_FIELD_LABELS[key], from, to } : null
    })
    .filter((change): change is { field: string; from: string; to: string } => change !== null)
}

const TINGKAT_KEPARAHAN: { value: TingkatKeparahan; label: string; color: string }[] = [
  { value: "urgen", label: "Mendesak", color: "bg-orange-100 text-orange-700" },
  { value: "sangat_urgen", label: "Sangat Mendesak", color: "bg-red-100 text-red-700" },
]

const TINGKAT_URGENSI_SEGMENTS: { value: TingkatKeparahan; label: string; desc: string; selected: string; selectedDesc: string }[] = [
  { value: "urgen", label: "Mendesak", desc: "Perlu respons ≤ 3 hari", selected: "border-amber-600 bg-amber-50 text-amber-600", selectedDesc: "text-amber-600" },
  { value: "sangat_urgen", label: "Sangat Mendesak", desc: "Ada risiko keselamatan", selected: "border-red-600 bg-red-50 text-red-600", selectedDesc: "text-red-600" },
]

const KEWENANGAN_CHIPS: { value: "provinsi" | "kabkota"; label: string; selected: string }[] = [
  { value: "provinsi", label: "Kelompok Kerja Provinsi", selected: "border-blue-600 bg-blue-50 text-blue-600" },
  { value: "kabkota", label: "Kelompok Kerja Kab/Kota", selected: "border-blue-600 bg-blue-50 text-blue-600" },
]

const PELAPOR_OPTIONS: { value: Pelapor; label: string }[] = [
  { value: "laporan_masyarakat", label: "Laporan masyarakat" },
  { value: "laporan_sekolah", label: "Laporan sekolah" },
  { value: "laporan_kemendikdasmen", label: "Laporan Kemendikdasmen" },
  { value: "temuan_pengawas", label: "Temuan pengawas/pokja" },
  { value: "media", label: "Media/berita" },
  { value: "lainnya", label: "Lainnya" },
]

const SELECT_BASE = "w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none pr-8"
const SELECT_SM = "h-9 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none pr-6"

function Select({ value, onChange, className, children, id, disabled }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; className?: string; children: React.ReactNode; id?: string; disabled?: boolean }) {
  return (
    <div className="relative w-full">
      <select id={id} value={value} onChange={onChange} disabled={disabled} className={`w-full ${className ?? ""} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
        {children}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
  )
}

function openSelectPicker(id: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(id) as HTMLSelectElement | null
    if (!el) return
    el.focus()
    try { (el as any).showPicker?.() } catch {}
  })
}

function normalizeUnsurTerlibat(raw: unknown): UnsurItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((u: any): UnsurItem => {
    if (Array.isArray(u.asalGroups)) {
      return {
        peran: u.peran ?? "",
        peranLainnya: u.peranLainnya,
        kategori: u.kategori ?? "",
        asalGroups: u.asalGroups.map((ag: any) => ({
          asalSekolah: ag.asalSekolah ?? "",
          asalLainnya: ag.asalLainnya,
          jumlah: ag.jumlah ?? "",
          individu: Array.isArray(ag.individu) && ag.individu.length > 0
            ? ag.individu.map((ind: any) => ({
                nama: ind.nama ?? "",
                umur: ind.umur ?? "",
                status: ind.status ?? "",
                jenisKelamin: ind.jenisKelamin ?? "",
              }))
            : [{ nama: "", umur: "", status: "", jenisKelamin: "" }],
        })),
      }
    }
    // Legacy flat shape: { asalSekolah, jumlah, individu: [{ nama, umur, asalSekolah? }] }
    const legacyIndividu = Array.isArray(u.individu) && u.individu.length > 0 ? u.individu : [{ nama: "", umur: "" }]
    return {
      peran: u.peran ?? "",
      peranLainnya: u.peranLainnya,
      kategori: u.kategori ?? "",
      asalGroups: [{
        asalSekolah: u.asalSekolah ?? "",
        asalLainnya: u.asalLainnya,
        jumlah: u.jumlah ?? "",
        individu: legacyIndividu.map((ind: any) => ({
          nama: ind.nama ?? "",
          umur: ind.umur ?? "",
          status: ind.status ?? "",
          jenisKelamin: ind.jenisKelamin ?? "",
        })),
      }],
    }
  })
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-gray-700">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function isLikelyUrl(value: string): boolean {
  if (/^https?:\/\//i.test(value)) return true
  return !/\s/.test(value) && /\.[a-z]{2,}/i.test(value)
}

function toDocHref(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

function DocumentasiValue({ value }: { value: string }) {
  return isLikelyUrl(value) ? (
    <a href={toDocHref(value)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
      {value}
    </a>
  ) : (
    <span>{value}</span>
  )
}

function TextInput({ value }: { value: string }) {
  return (
    <input
      type="text"
      value={value}
      disabled
      className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-default"
    />
  )
}

function SectionCard({ icon, title, right, children }: { icon: React.ReactNode; title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-4 bg-gray-50 border-b border-gray-200 rounded-t-xl">
        <span className="text-gray-900 flex-shrink-0">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-900 flex-1">{title}</h3>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function NomorKasusBadge({ nomorKasus }: { nomorKasus: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(nomorKasus)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {}
      }}
      title="Salin nomor kasus"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
    >
      <span>No. Kasus: {nomorKasus}</span>
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
    </button>
  )
}

function StatusBadge({ status }: { status: StatusPelanggaran }) {
  switch (status) {
    case "baru":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          <FileText className="w-3 h-3" /> Belum Diproses
        </span>
      )
    case "proses":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" /> Diproses
        </span>
      )
    case "selesai":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" /> Selesai
        </span>
      )
    case "ditutup":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          <XCircle className="w-3 h-3" /> Ditutup
        </span>
      )
  }
}

function emptyForm() {
  return {
    namaSekolah: [] as string[],
    npsnSekolah: [] as string[],
    unsurTerlibat: [{ peran: "", kategori: "", asalGroups: [{ asalSekolah: "", jumlah: "", individu: [{ nama: "", umur: "", status: "", jenisKelamin: "" }] }] }] as UnsurItem[],
    tanggalTerjadi: "",
    kronologi: [{ tanggal: "", jam: "", lokasi: "", keterangan: "" }],
    kategori: "",
    tingkatKeparahan: "" as TingkatKeparahan | "",
    pelapor: "" as Pelapor | "",
    pelaporLainnya: "",
    kontakPelapor: "",
    pic: "",
    tingkatKelompokKerja: "" as "" | "provinsi" | "kabkota",
    wilayah: "",
    kabupatenKota: "",
    tindakLanjut: "",
    dokumentasi: "",
    rekomendasi: "",
    motif: "",
    tanggalPelaporan: "",
    status: "" as StatusPelanggaran | "",
  }
}

type FormData = ReturnType<typeof emptyForm>

function TambahPelanggaranInner() {
  const searchParams = useSearchParams()
  const createMode = searchParams.has("create")
  const editId = searchParams.get("edit")
  const viewId = searchParams.get("view")

  const isFormMode = createMode || !!editId
  const isView = !!viewId

  const [role, setRole] = useState("")

  // View mode state
  const [item, setItem] = useState<(PelanggaranItem & { logStatus?: { status: StatusPelanggaran; keterangan: string; waktu: string }[] }) | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState<StatusPelanggaran>("baru")
  const [keteranganStatus, setKeteranganStatus] = useState("")
  const [dokumentasiStatus, setDokumentasiStatus] = useState("")

  // Form mode state
  const [form, setForm] = useState<FormData>(emptyForm)
  const [sekolahInput, setSekolahInput] = useState("")
  const [showSekolahDropdown, setShowSekolahDropdown] = useState(false)
  const [picInput, setPicInput] = useState("")
  const [showPicDropdown, setShowPicDropdown] = useState(false)
  const [picManualMode, setPicManualMode] = useState(false)
  const [asalSekolahQuery, setAsalSekolahQuery] = useState<Record<number, string>>({})
  const [openAsalSekolahIdx, setOpenAsalSekolahIdx] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [openPeranMenu, setOpenPeranMenu] = useState<number | null>(null)
  const [kategoriMemo, setKategoriMemo] = useState("")

  const selectPic = (name: string) => {
    setForm((prev) => ({ ...prev, pic: name }))
    setPicInput("")
    setShowPicDropdown(false)
  }

  const clearPic = () => {
    setForm((prev) => ({ ...prev, pic: "" }))
    setPicInput("")
    setPicManualMode(false)
  }

  useEffect(() => {
    try {
      const authRaw = localStorage.getItem("auth")
      if (authRaw) setRole(JSON.parse(authRaw).role)
    } catch {}
  }, [])

  // Load data for view/edit
  useEffect(() => {
    const loadId = viewId || editId
    if (!loadId) return
    try {
      const stored = JSON.parse(localStorage.getItem("pelanggaranList") ?? "[]") as PelanggaranItem[]
      const found = stored.find((d) => d.id === loadId)
      if (found) {
        const normalized = {
          ...found,
          namaSekolah: Array.isArray(found.namaSekolah) ? found.namaSekolah : [found.namaSekolah as any],
          unsurTerlibat: normalizeUnsurTerlibat(found.unsurTerlibat),
          dokumentasi: Array.isArray(found.dokumentasi) ? found.dokumentasi[0] ?? "" : found.dokumentasi,
          tingkatKeparahan: (found as any).tingkatKeparahan ?? "urgen",
          pelapor: (found as any).pelapor ?? "laporan_sekolah",
          pelaporLainnya: (found as any).pelaporLainnya ?? "",
          tindakLanjut: (found as any).tindakLanjut ?? "",
          pic: (found as any).pic ?? "",
          logStatus: Array.isArray((found as any).logStatus) ? (found as any).logStatus : [],
        }
        setItem(normalized)
        if (editId) {
          setForm({
            namaSekolah: normalized.namaSekolah,
            npsnSekolah: (normalized as any).npsnSekolah ?? normalized.namaSekolah.map(() => ""),
            unsurTerlibat: normalized.unsurTerlibat.length > 0 ? normalized.unsurTerlibat : [{ peran: "", kategori: "", asalGroups: [{ asalSekolah: "", jumlah: "", individu: [{ nama: "", umur: "", status: "", jenisKelamin: "" }] }] }],
            tanggalTerjadi: normalized.tanggalTerjadi?.split("T")[0] ?? "",
            kronologi: Array.isArray((normalized as any).kronologi) ? (normalized as any).kronologi.map((e: any) => ({ tanggal: e.tanggal ?? "", jam: e.jam ?? "", lokasi: e.lokasi ?? "", keterangan: e.keterangan ?? "" })) : (normalized as any).kronologi ? [{ tanggal: normalized.tanggalTerjadi?.split("T")[0] ?? "", jam: "", lokasi: "", keterangan: (normalized as any).kronologi }] : [{ tanggal: "", jam: "", lokasi: "", keterangan: "" }],
            kategori: normalized.kategori,
            tingkatKeparahan: normalized.tingkatKeparahan,
            pelapor: normalized.pelapor,
            pelaporLainnya: normalized.pelaporLainnya ?? "",
            kontakPelapor: (normalized as any).kontakPelapor ?? "",
            pic: normalized.pic ?? "",
            tingkatKelompokKerja: (normalized as any).tingkatKelompokKerja
              ?? ((normalized as any).kabupatenKota ? "kabkota" : (normalized as any).wilayah ? "provinsi" : ""),
            wilayah: (normalized as any).wilayah ?? "",
            kabupatenKota: (normalized as any).kabupatenKota ?? "",
            tindakLanjut: normalized.tindakLanjut ?? "",
            dokumentasi: normalized.dokumentasi,
            rekomendasi: normalized.rekomendasi,
            motif: (normalized as any).motif ?? "",
            tanggalPelaporan: (normalized as any).tanggalPelaporan ?? "",
            status: normalized.status,
          })
        }
      }
    } catch {}
  }, [viewId, editId])

  // School suggestions
  const allSchoolSuggestions = useMemo(() => {
    const map = new Map<string, string>()
    SEKOLAH_OPTIONS.forEach((s) => map.set(s.nama, s.npsn))
    try {
      const stored = localStorage.getItem("pelanggaranList")
      if (stored) {
        JSON.parse(stored).forEach((item: PelanggaranItem) => {
          const list = Array.isArray(item.namaSekolah) ? item.namaSekolah : [item.namaSekolah]
          list.forEach((s) => { if (s.trim() && !map.has(s.trim())) map.set(s.trim(), "") })
        })
      }
    } catch {}
    return Array.from(map.entries()).map(([nama, npsn]) => ({ nama, npsn })).sort((a, b) => a.nama.localeCompare(b.nama))
  }, [])

  const allPicOptions = useMemo(() => {
    const names = new Set<string>()
    try {
      const stored = localStorage.getItem("pokjaList")
      if (stored) {
        const parsed = JSON.parse(stored) as any[]
        parsed.forEach((pokja: any) => {
          if (pokja.data?.members) {
            Object.values(pokja.data.members).forEach((m: any) => {
              if (m && m.nama && m.nama.trim()) names.add(m.nama.trim())
            })
          }
        })
      }
    } catch { /* ignore */ }
    return Array.from(names).sort()
  }, [])

  const filteredPicOptions = picInput
    ? allPicOptions.filter((name) => name.toLowerCase().includes(picInput.toLowerCase()))
    : allPicOptions

  const filteredSekolahOptions = sekolahInput
    ? allSchoolSuggestions.filter((s) => (s.nama.toLowerCase().includes(sekolahInput.toLowerCase()) || s.npsn.includes(sekolahInput)) && !form.namaSekolah.includes(s.nama))
    : allSchoolSuggestions.filter((s) => !form.namaSekolah.includes(s.nama))

  const addSekolah = (name: string, npsn?: string) => {
    const trimmed = name.trim()
    if (trimmed && !form.namaSekolah.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        namaSekolah: [...prev.namaSekolah, trimmed],
        npsnSekolah: [...(prev.npsnSekolah || []), npsn?.trim() || ""],
      }))
    }
    setSekolahInput("")
    setShowSekolahDropdown(false)
  }

  const removeSekolah = (index: number) => {
    setForm((prev) => ({
      ...prev,
      namaSekolah: prev.namaSekolah.filter((_, i) => i !== index),
      npsnSekolah: (prev.npsnSekolah || []).filter((_, i) => i !== index),
    }))
  }

  const isAdminWilayah = role === "pusat" || role === "dinas"

  const missingFields = (() => {
    const missing: string[] = []
    if (!form.namaSekolah.some((s) => s.trim())) missing.push("Nama Sekolah")
    if (!form.unsurTerlibat.some((u) => u.peran && u.asalGroups.some((ag) => parseInt(ag.jumlah) > 0 && ag.individu.some((ind) => ind.nama))))
      missing.push("Unsur Terlibat (peran, jumlah, dan nama individu)")
    if (!form.kronologi.some((e) => e.tanggal)) missing.push("Tanggal pada Kronologi")
    if (!form.kategori || form.kategori === "Lainnya") missing.push("Kategori Pelanggaran")
    if (!form.tingkatKeparahan) missing.push("Tingkat Urgensi")
    if (!form.pelapor) missing.push("Pelapor")
    if (role === "pusat") {
      if (!form.tingkatKelompokKerja) missing.push("Kewenangan Kelompok Kerja")
      if (!form.wilayah) missing.push("Provinsi")
      if (!!form.tingkatKelompokKerja && form.tingkatKelompokKerja !== "provinsi" && !form.kabupatenKota?.trim()) missing.push("Kabupaten/Kota")
    }
    if (isAdminWilayah && !form.pic) missing.push("Penanggung Jawab")
    return missing
  })()

  const canSubmit = missingFields.length === 0

  const cleanUnsurTerlibat = (list: UnsurItem[]): UnsurItem[] =>
    list
      .filter((u) => u.peran)
      .map((u) => ({ ...u, asalGroups: u.asalGroups.filter((ag) => ag.individu.some((ind) => ind.nama)) }))
      .filter((u) => u.asalGroups.length > 0)

  const handleSubmit = () => {
    if (!canSubmit) return
    const cleanedSekolah = form.namaSekolah
      .map((s, i) => ({ nama: s.trim(), npsn: form.npsnSekolah?.[i]?.trim() || "" }))
      .filter((x) => x.nama)
    const firstTanggal = form.kronologi.find((e) => e.tanggal)?.tanggal ?? ""
    const session = (() => {
      try { return JSON.parse(localStorage.getItem("auth") ?? "{}") } catch { return {} }
    })() as { role?: string; namaSekolah?: string; namaDinas?: string }
    const now = new Date().toISOString()
    const dibuatOleh = session?.role === "dinas"
      ? `Admin Dinas ${session.namaDinas ?? ""}`
      : session?.role === "pusat"
        ? "Admin Pusat"
        : session?.namaSekolah
          ? `Admin Sekolah ${session.namaSekolah}`
          : "Admin Sekolah"

    try {
      const stored = JSON.parse(localStorage.getItem("pelanggaranList") ?? "[]") as PelanggaranItem[]

      if (editId) {
        const updated = stored.map((i) => {
          if (i.id !== editId) return i
          const nextValues = {
            ...i,
            ...form,
            namaSekolah: cleanedSekolah.map((x) => x.nama),
            npsnSekolah: cleanedSekolah.map((x) => x.npsn),
            tanggalTerjadi: firstTanggal,
            pelaporLainnya: form.pelapor === "lainnya" ? form.pelaporLainnya : "",
            unsurTerlibat: cleanUnsurTerlibat(form.unsurTerlibat),
          }
          const perubahan = diffPelanggaranFields(i as any, nextValues as any)
          return {
            ...nextValues,
            updatedAt: now,
            diperbaruiOleh: dibuatOleh,
            logStatus: [
              ...(Array.isArray((i as any).logStatus) ? (i as any).logStatus : []),
              { status: form.status, keterangan: "", dokumentasi: "", dibuatOleh, aksi: "edit", waktu: now, perubahan },
            ],
          }
        })
        localStorage.setItem("pelanggaranList", JSON.stringify(updated))
      } else {
        const newItem = {
          ...form,
          namaSekolah: cleanedSekolah.map((x) => x.nama),
          npsnSekolah: cleanedSekolah.map((x) => x.npsn),
          tanggalTerjadi: firstTanggal,
          id: `pg-${Date.now()}`,
          nomorKasus: generateNomorKasus(stored),
          createdAt: now,
          updatedAt: now,
          dibuatOleh,
          diperbaruiOleh: dibuatOleh,
          pelaporLainnya: form.pelapor === "lainnya" ? form.pelaporLainnya : "",
          unsurTerlibat: cleanUnsurTerlibat(form.unsurTerlibat),
          logStatus: [{ status: form.status, keterangan: form.tindakLanjut.trim(), dokumentasi: form.dokumentasi || "", dibuatOleh, aksi: "buat", waktu: now }],
        }
        localStorage.setItem("pelanggaranList", JSON.stringify([newItem, ...stored]))
      }
    } catch {}
    setSubmitted(true)
  }

  useEffect(() => {
    if (!submitted) return
    const t = setTimeout(() => {
      window.location.href = "/dashboard?menu=pelanggaran"
    }, 1500)
    return () => clearTimeout(t)
  }, [submitted])

  // View mode: delete
  const handleDelete = () => {
    if (!viewId || !item) return
    try {
      const stored = JSON.parse(localStorage.getItem("pelanggaranList") ?? "[]") as PelanggaranItem[]
      localStorage.setItem("pelanggaranList", JSON.stringify(stored.filter((i) => i.id !== viewId)))
    } catch {}
    window.location.href = "/dashboard?menu=pelanggaran"
  }

  // View mode: update status
  const handleUpdateStatus = () => {
    if (!viewId || !item) return
    const session = (() => {
      try { return JSON.parse(localStorage.getItem("auth") ?? "{}") } catch { return {} }
    })() as { role?: string; namaSekolah?: string; namaDinas?: string }
    const updaterName = session?.role === "dinas"
      ? `Admin Dinas ${session.namaDinas ?? ""}`
      : session?.role === "pusat"
        ? "Admin Pusat"
        : session?.namaSekolah
          ? `Admin Sekolah ${session.namaSekolah}`
          : "Admin Sekolah"
    try {
      const stored = JSON.parse(localStorage.getItem("pelanggaranList") ?? "[]") as PelanggaranItem[]
      const updated = stored.map((i) =>
        i.id === viewId
          ? {
              ...i,
              status: newStatus,
              dokumentasi: dokumentasiStatus || i.dokumentasi,
              updatedAt: new Date().toISOString(),
              diperbaruiOleh: updaterName,
              logStatus: [
                ...(Array.isArray((i as any).logStatus) ? (i as any).logStatus : []),
                { status: newStatus, keterangan: keteranganStatus.trim(), dokumentasi: dokumentasiStatus || "", dibuatOleh: updaterName, aksi: "perbaharui_status", waktu: new Date().toISOString() },
              ],
            }
          : i
      )
      localStorage.setItem("pelanggaranList", JSON.stringify(updated))
      const savedLog = Array.isArray((updated.find((i) => i.id === viewId) as any)?.logStatus)
        ? (updated.find((i) => i.id === viewId) as any).logStatus
        : []
      setItem({ ...item, status: newStatus, dokumentasi: dokumentasiStatus || item.dokumentasi, updatedAt: new Date().toISOString(), diperbaruiOleh: updaterName, logStatus: savedLog })
    } catch {}
    setShowStatusModal(false)
    setKeteranganStatus("")
    setDokumentasiStatus("")
  }

  // Success screen for form submit
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">{editId ? "Berhasil Diperbarui" : "Berhasil Ditambahkan"}</h2>
          <p className="text-sm text-gray-500 mt-1">{editId ? "Pelanggaran berhasil diperbarui." : "Pelanggaran baru berhasil ditambahkan."}</p>
        </div>
      </div>
    )
  }

  // View mode
  if (isView && item) {
    const peranLabel = (peran: string, peranLainnya?: string) => {
      if (peran === "pelaku") return "Terduga Pelaku"
      if (peran === "korban") return "Terduga Korban"
      if (peran === "saksi") return "Saksi"
      if (peran === "lainnya") return peranLainnya || "Lainnya"
      return peran || "-"
    }
    const peranColor = (peran: string) => {
      if (peran === "pelaku") return "bg-amber-100 text-amber-700"
      if (peran === "korban") return "bg-red-100 text-red-700"
      if (peran === "saksi") return "bg-blue-100 text-blue-700"
      return "bg-gray-100 text-gray-700"
    }
    const peranLineColor = (peran: string) => {
      if (peran === "pelaku") return "border-amber-400"
      if (peran === "korban") return "border-red-400"
      if (peran === "saksi") return "border-blue-400"
      return "border-gray-400"
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => { window.location.href = "/dashboard?menu=pelanggaran" }}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900">Detail Pelanggaran</h1>
              <div className="mt-1">
                <StatusBadge status={item.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <SectionCard icon={<AlertTriangle className="w-4 h-4" />} title="Informasi Pelanggaran" right={(item as any).nomorKasus ? <NomorKasusBadge nomorKasus={(item as any).nomorKasus} /> : null}>
            <div className="grid grid-cols-1 gap-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sekolah Terlibat</p>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Nama Sekolah</FieldLabel>
                <div className="flex flex-col gap-2 mt-1">
                  {item.namaSekolah.length > 0 ? item.namaSekolah.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="flex-1 border border-gray-200 rounded-lg p-3">
                        <div className="grid grid-cols-[1fr_140px] gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Sekolah</label>
                            <TextInput value={s} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">NPSN</label>
                            <TextInput value={(item as any).npsnSekolah?.[i] || "-"} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : <span className="text-sm text-gray-400">-</span>}
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Klasifikasi Pelanggaran</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Kategori Pelanggaran</FieldLabel>
                  <TextInput value={item.kategori} />
                </div>
                <div className="flex flex-col gap-1.5">
                <FieldLabel required>Tanggal Pelaporan</FieldLabel>
                  <TextInput value={(item as any).tanggalPelaporan ? new Date((item as any).tanggalPelaporan).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel>Tingkat Urgensi</FieldLabel>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {TINGKAT_URGENSI_SEGMENTS.map((t) => {
                    const isSelected = item.tingkatKeparahan === t.value
                    return (
                      <div
                        key={t.value}
                        className={`px-2 py-2.5 rounded-lg border text-center text-[13px] font-semibold transition-colors ${
                          isSelected ? t.selected : "border-gray-200 bg-gray-50 text-gray-400"
                        }`}
                      >
                        {t.label}
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </SectionCard>

          <SectionCard icon={<Clock className="w-4 h-4" />} title="Detail Kasus">
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Unsur yang Terlibat</p>
              <div className="flex flex-col gap-4">
                {item.unsurTerlibat.length > 0 ? item.unsurTerlibat.map((u, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${peranColor(u.peran)}`}>
                        {peranLabel(u.peran, u.peranLainnya)}
                      </span>
                    </div>
                    {u.peran !== "" && (
                      <div className="relative pl-3">
                        <div className={`absolute left-0 top-0 bottom-0 border-l-2 ${peranLineColor(u.peran)}`} />
                        <div className="flex flex-col gap-2">
                          {Array.isArray(u.asalGroups) && u.asalGroups.map((ag, gi) => (
                            <div key={gi} className="flex items-start gap-2">
                              <div className="flex-1 border border-gray-200 rounded-lg p-3 bg-white">
                                <div className="grid grid-cols-[1fr_90px] gap-2 items-start">
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Asal Sekolah</label>
                                    <TextInput value={ag.asalSekolah === "lainnya" ? (ag.asalLainnya || "-") : (ag.asalSekolah || "-")} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Jumlah Orang</label>
                                    <TextInput value={ag.jumlah || "-"} />
                                  </div>
                                </div>
                                {Array.isArray(ag.individu) && ag.individu.some((ind) => ind.nama) && (
                                  <div className="bg-gray-50 rounded-lg mt-3 mb-2 divide-y divide-gray-200">
                                    {ag.individu.map((ind, idx) => (
                                      <div key={idx} className="p-2.5">
                                        <div className="flex items-start gap-2">
                                          <span className={`text-sm text-gray-400 w-5 shrink-0 text-right ${idx === 0 ? "mt-7" : "mt-2"}`}>#{idx + 1}</span>
                                          <div className="flex-1 grid grid-cols-[1.4fr_1fr_1fr_80px] gap-2">
                                            <div>
                                              {idx === 0 && <label className="block text-xs text-gray-700 mb-1">Nama/Inisial</label>}
                                              <TextInput value={ind.nama || "-"} />
                                            </div>
                                            <div>
                                              {idx === 0 && <label className="block text-xs text-gray-700 mb-1">Status</label>}
                                              <TextInput value={ind.status || "-"} />
                                            </div>
                                            <div>
                                              {idx === 0 && <label className="block text-xs text-gray-700 mb-1">Jenis Kelamin</label>}
                                              <TextInput value={ind.jenisKelamin || "-"} />
                                            </div>
                                            <div>
                                              {idx === 0 && <label className="block text-xs text-gray-700 mb-1">Umur</label>}
                                              <TextInput value={ind.umur ? `${ind.umur} thn` : "-"} />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )) : <span className="text-sm text-gray-400">-</span>}
              </div>

              <hr className="border-gray-300 -mx-5 my-2" />

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kronologi Kejadian</p>
              {Array.isArray((item as any).kronologi) && (item as any).kronologi.length > 0 ? (
                <div className="flex flex-col gap-4 mt-1">
                  {(item as any).kronologi.map((entry: { tanggal?: string; jam?: string; lokasi?: string; keterangan?: string }, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="flex-1 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal</label>
                            <TextInput value={entry.tanggal ? new Date(entry.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"} />
                          </div>
                          <div className="w-[100px] shrink-0">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Jam</label>
                            <TextInput value={entry.jam || "-"} />
                          </div>
                          <div className="flex-[1.5]">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Lokasi</label>
                            <TextInput value={entry.lokasi || "-"} />
                          </div>
                        </div>
                        <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Keterangan</label>
                          <div className="text-sm text-gray-600 whitespace-pre-wrap min-h-[20px]">{entry.keterangan || "-"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <span className="text-sm text-gray-400">-</span>}

              <hr className="border-gray-300 -mx-5 my-2" />

              <div className="flex flex-col gap-1.5">
              <FieldLabel required>Motif Kejadian</FieldLabel>
                <div className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-default min-h-[80px] whitespace-pre-wrap">
                  {(item as any).motif || "-"}
                </div>
              </div>

              {item.dokumentasi && (
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Tautan Dokumentasi</FieldLabel>
                  <div className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-lg bg-gray-50 min-h-[36px] break-all text-gray-600">
                    <DocumentasiValue value={item.dokumentasi} />
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard icon={<Users className="w-4 h-4" />} title="Sumber Laporan & Penanggung Jawab">
            <div className="grid grid-cols-1 gap-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sumber Laporan</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Pelapor / Sumber Laporan</FieldLabel>
                  <TextInput value={PELAPOR_OPTIONS.find((p) => p.value === item.pelapor)?.label ?? item.pelapor} />
                  {item.pelapor === "lainnya" && item.pelaporLainnya && (
                    <TextInput value={item.pelaporLainnya} />
                  )}
                </div>
                {(item as any).kontakPelapor && (
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Kontak Pelapor</FieldLabel>
                    <TextInput value={(item as any).kontakPelapor} />
                  </div>
                )}
              </div>

              {role === "pusat" && ((item as any).wilayah || (item as any).kabupatenKota) && (
                <>
                  <hr className="border-gray-300 -mx-5 my-2" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kelompok Kerja Penanggung Jawab</p>
                  {(item as any).tingkatKelompokKerja && (
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Kewenangan</FieldLabel>
                      <TextInput value={(item as any).tingkatKelompokKerja === "provinsi" ? "Kelompok Kerja Provinsi" : "Kelompok Kerja Kab/Kota"} />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {(item as any).wilayah && (
                      <div className="flex flex-col gap-1.5">
                        <FieldLabel>Provinsi</FieldLabel>
                        <TextInput value={(item as any).wilayah} />
                      </div>
                    )}
                    {(item as any).kabupatenKota && (
                      <div className="flex flex-col gap-1.5">
                        <FieldLabel>Kabupaten/Kota</FieldLabel>
                        <TextInput value={(item as any).kabupatenKota} />
                      </div>
                    )}
                  </div>
                </>
              )}

              {item.pic && (
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>{role === "pusat" ? "Nama Penanggung Jawab" : "Penanggung Jawab"}</FieldLabel>
                  <div className="flex items-center gap-2 py-1.5 px-2 mt-1 bg-gray-50 rounded-lg">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 flex-1">{item.pic}</span>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard icon={<CheckCircle className="w-4 h-4" />} title="Riwayat Status Pelanggaran">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-3">
                {Array.isArray((item as any).logStatus) && (item as any).logStatus.length > 0 ? (item as any).logStatus.slice().reverse().map((entry: { status: StatusPelanggaran; keterangan: string; dokumentasi?: string; dibuatOleh?: string; aksi?: string; waktu: string }, i: number) => {
                  const dibuatOleh = entry.dibuatOleh || entry.keterangan.match(/oleh (.+)$/)?.[1] || ""
                  const labelAksi = entry.aksi === "perbaharui_status" ? "Diperbaharui" : entry.aksi === "edit" ? "Diedit" : "Dibuat"
                  const keterangan = entry.keterangan.replace(/ — oleh .+$/, "").replace(/^Laporan awal (dibuat )?/, "").trim()
                  return (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={entry.status} />
                        <span className="text-xs text-gray-500">{labelAksi} oleh {dibuatOleh}</span>
                      </div>
                      {keterangan && <p className="text-xs text-gray-700"><span className="font-medium">Keterangan:</span> {keterangan}</p>}
                      {(entry as any).dokumentasi ? <p className="text-xs text-gray-700"><span className="font-medium">Dokumentasi:</span> <DocumentasiValue value={(entry as any).dokumentasi} /></p> : null}
                      {Array.isArray((entry as any).perubahan) && (entry as any).perubahan.length > 0 && (
                        <div className="text-xs text-gray-700">
                          <span className="font-medium">Perubahan:</span>
                          <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="text-left font-medium text-gray-500 px-2 py-1 w-1/4">Field</th>
                                  <th className="text-left font-medium text-gray-500 px-2 py-1 w-[37.5%]">Sebelum</th>
                                  <th className="text-left font-medium text-gray-500 px-2 py-1 w-[37.5%]">Sesudah</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(entry as any).perubahan.map((p: { field: string; from: string; to: string }, pi: number) => (
                                  <tr key={pi} className="border-t border-gray-200 align-top">
                                    <td className="px-2 py-1 font-medium text-gray-700">{p.field}</td>
                                    <td className="px-2 py-1 text-gray-600">{p.from}</td>
                                    <td className="px-2 py-1 text-gray-900">{p.to}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(entry.waktu).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  )
                }) : <span className="text-sm text-gray-400">Belum ada riwayat status.</span>}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Status change modal */}
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowStatusModal(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">Ubah Status Pelanggaran</h3>
              <div className="space-y-2">
                {(["baru", "proses", "selesai", "ditutup"] as StatusPelanggaran[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setNewStatus(opt)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition ${
                      newStatus === opt
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {opt === "baru" && <FileText className="w-4 h-4" />}
                      {opt === "proses" && <Clock className="w-4 h-4" />}
                      {opt === "selesai" && <CheckCircle className="w-4 h-4" />}
                      {opt === "ditutup" && <XCircle className="w-4 h-4" />}
                      <span className="capitalize">{opt}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Keterangan <span className="text-red-500">*</span></label>
                  <textarea
                    value={keteranganStatus}
                    onChange={(e) => setKeteranganStatus(e.target.value)}
                    placeholder="Tambahkan keterangan..."
                    rows={2}
                    className="w-full p-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Link Dokumentasi <span className="text-gray-400">(opsional)</span></label>
                  <input
                    type="text"
                    value={dokumentasiStatus}
                    onChange={(e) => setDokumentasiStatus(e.target.value)}
                    placeholder="Link atau keterangan dokumentasi..."
                    className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowStatusModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition">Batal</button>
                <button onClick={handleUpdateStatus} disabled={!keteranganStatus.trim()} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">Simpan</button>
              </div>
            </div>
          </div>
        )}

        {(role === "dinas" || role === "pusat") && (
          <div className="max-w-2xl mx-auto px-4 pb-8 flex gap-3">
            <a href={`/tambah-pelanggaran?edit=${item.id}`} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition text-center">Edit</a>
            <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg border border-red-300 text-red-600 font-medium text-sm hover:bg-red-50 transition">Hapus</button>
            <button onClick={() => { setNewStatus(item.status); setKeteranganStatus(""); setDokumentasiStatus(""); setShowStatusModal(true) }} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition">Perbarui Status</button>
          </div>
        )}
      </div>
    )
  }

  // Loading state
  if (isView && !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-sm text-gray-500">Data tidak ditemukan.</p>
      </div>
    )
  }

  // Create / Edit mode
  const pageTitle = createMode ? "Buat Laporan" : editId ? "Edit Laporan" : ""

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => { window.location.href = "/dashboard?menu=pelanggaran" }}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-xs text-gray-500">Isi dan lengkapi detail laporan pelanggaran yang terjadi di sekolah</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <SectionCard icon={<AlertTriangle className="w-4 h-4" />} title="Informasi Pelanggaran" right={(item as any)?.nomorKasus ? <NomorKasusBadge nomorKasus={(item as any).nomorKasus} /> : null}>
          <div className="grid grid-cols-1 gap-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sekolah Terlibat</p>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Nama Sekolah</FieldLabel>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={sekolahInput}
                  onChange={(e) => { setSekolahInput(e.target.value); setShowSekolahDropdown(true) }}
                  onFocus={() => setShowSekolahDropdown(true)}
                  onClick={() => setShowSekolahDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSekolahDropdown(false), 200)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSekolah(sekolahInput) } }}
                  placeholder="Ketik nama sekolah yang ingin dilaporkan"
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                {showSekolahDropdown && filteredSekolahOptions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSekolahOptions.map((o) => (
                      <button
                        key={o.nama}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addSekolah(o.nama)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex flex-col"
                      >
                        <span className="text-gray-800">{o.nama}{o.npsn && <span className="text-xs text-gray-400 ml-2">NPSN {o.npsn}</span>}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {form.namaSekolah.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-3">
                  {form.namaSekolah.map((s, i) => (
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

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Klasifikasi Pelanggaran</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel required>Kategori Pelanggaran</FieldLabel>
                {(() => {
                  const predefinedKategori = KATEGORI_PELANGGARAN.filter((k) => k !== "Lainnya")
                  const isKategoriCustom = form.kategori !== "" && !predefinedKategori.includes(form.kategori)
                  const displayKategori = isKategoriCustom ? "Lainnya" : form.kategori
                  return (
                    <div className="relative mt-1 border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-400">
                      {isKategoriCustom ? (
                        <>
                          <input
                            type="text"
                            autoFocus
                            value={form.kategori !== "Lainnya" ? form.kategori : ""}
                            onChange={(e) => {
                              setForm((prev) => ({ ...prev, kategori: e.target.value }))
                              setKategoriMemo(e.target.value)
                            }}
                            placeholder="Tulis kategori lainnya..."
                            className="w-full h-9 px-3 text-sm bg-white focus:outline-none pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, kategori: "" }))
                              openSelectPicker("kategori-select")
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <Select
                          id="kategori-select"
                          value={form.kategori}
                          onChange={(e) => {
                            const val = e.target.value
                            setForm((prev) => ({ ...prev, kategori: val === "Lainnya" && kategoriMemo ? kategoriMemo : val }))
                          }}
                          className={`w-full h-9 px-3 text-sm bg-white appearance-none focus:outline-none pr-8 ${!form.kategori ? "text-gray-400" : ""}`}
                        >
                          <option value="" disabled>Pilih kategori</option>
                          {KATEGORI_PELANGGARAN.map((k) => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </Select>
                      )}
                    </div>
                  )
                })()}
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Tanggal Pelaporan</FieldLabel>
                <input
                  type="date"
                  value={form.tanggalPelaporan ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, tanggalPelaporan: e.target.value }))}
                  className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Tingkat Urgensi</FieldLabel>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {TINGKAT_URGENSI_SEGMENTS.map((t) => {
                  const isSelected = form.tingkatKeparahan === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, tingkatKeparahan: t.value }))}
                      className={`px-2 py-2.5 rounded-lg border text-center text-[13px] font-semibold transition-colors ${
                        isSelected ? t.selected : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<Clock className="w-4 h-4" />} title="Detail Kasus">
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Unsur yang Terlibat</p>
            <div className="flex flex-col gap-4">
                {(() => {
                  const customAsalTotal = form.unsurTerlibat.reduce(
                    (acc, g) => acc + g.asalGroups.filter((ag) => ag.asalSekolah !== "" && !form.namaSekolah.includes(ag.asalSekolah)).length,
                    0
                  )
                  const predefined = UNSUR_OPTIONS.filter((o) => o !== "Lainnya")
                  return form.unsurTerlibat.map((u, i) => {
                  const peranLainCount = form.unsurTerlibat.filter((_, idx) => idx !== i && _.peran === "lainnya").length
                  const peranLainDisabled = peranLainCount >= 3
                  const usedPeranSet = new Set(form.unsurTerlibat.filter((_, idx) => idx !== i && _.peran && _.peran !== "lainnya").map((_) => _.peran))
                  const PERAN_CHIPS: { value: "pelaku" | "korban" | "saksi" | "lainnya"; label: string; selected: string; line: string }[] = [
                    { value: "pelaku", label: "Terduga Pelaku", selected: "border-amber-600 bg-amber-50 text-amber-600", line: "border-amber-400" },
                    { value: "korban", label: "Terduga Korban", selected: "border-red-600 bg-red-50 text-red-600", line: "border-red-400" },
                    { value: "saksi", label: "Saksi", selected: "border-blue-600 bg-blue-50 text-blue-600", line: "border-blue-400" },
                    { value: "lainnya", label: "Lainnya", selected: "border-gray-600 bg-gray-100 text-gray-700", line: "border-gray-400" },
                  ]
                  const peranLineColor = PERAN_CHIPS.find((opt) => opt.value === u.peran)?.line ?? "border-gray-300"
                  const canDeleteGroup = form.unsurTerlibat.length > 1
                  const syncIndividu = (next: UnsurItem[], gi: number) => {
                    const group = next[i]
                    if (!group) return
                    const ag = group.asalGroups[gi]
                    if (!ag) return
                    const newJml = parseInt(ag.jumlah) || 0
                    if (!ag.individu) ag.individu = []
                    const current = ag.individu.length
                    if (newJml > current) {
                      const add: IndividuItem[] = Array.from({ length: newJml - current }, () => ({ nama: "", umur: "", status: "", jenisKelamin: "" }))
                      ag.individu = [...ag.individu, ...add]
                    } else if (newJml < current) {
                      ag.individu = ag.individu.slice(0, newJml)
                    }
                    if (newJml === 0) ag.individu = [{ nama: "", umur: "", status: "", jenisKelamin: "" }]
                    setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                  }
                  const peranField = (
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Peran <span className="text-red-500">*</span></label>
                      <div className="flex flex-nowrap gap-1.5 overflow-x-auto">
                        {PERAN_CHIPS.map((opt) => {
                          const isSelected = u.peran === opt.value
                          const isDisabled = opt.value === "lainnya" ? (peranLainDisabled && !isSelected) : (usedPeranSet.has(opt.value) && !isSelected)
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                const next = [...form.unsurTerlibat]
                                next[i] = { ...next[i], peran: opt.value, peranLainnya: opt.value === "lainnya" ? next[i].peranLainnya ?? "" : undefined }
                                setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                isSelected ? opt.selected : isDisabled ? "border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed" : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                              }`}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                      {u.peran === "lainnya" && (
                        <input
                          value={u.peranLainnya ?? ""}
                          onChange={(e) => {
                            const next = [...form.unsurTerlibat]
                            next[i] = { ...next[i], peranLainnya: e.target.value }
                            setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                          }}
                          placeholder="Tulis peran..."
                          className="w-full h-9 px-2 mt-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      )}
                    </div>
                  )
                  return (
                  <div key={i} className="flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        {peranField}
                      </div>
                      {canDeleteGroup ? (
                        <div className="relative mt-6 shrink-0">
                          <button
                            type="button"
                            onClick={() => setOpenPeranMenu((prev) => (prev === i ? null : i))}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          {openPeranMenu === i && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenPeranMenu(null)} />
                              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-32">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenPeranMenu(null)
                                    setForm((prev) => ({ ...prev, unsurTerlibat: prev.unsurTerlibat.filter((_, idx) => idx !== i) }))
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="mt-6 w-[26px] h-[26px] shrink-0" />
                      )}
                    </div>
                    {u.peran !== "" && (
                    <div className="relative pl-3">
                      <div className={`absolute left-0 top-0 bottom-0 border-l-2 ${peranLineColor}`} />
                      <div className="flex flex-col gap-2">
                      {u.asalGroups.map((ag, gi) => {
                        const isAsalCustom = ag.asalSekolah !== "" && !form.namaSekolah.includes(ag.asalSekolah)
                        const displayAsal = isAsalCustom ? "lainnya" : ag.asalSekolah
                        const asalLainDisabled = (customAsalTotal - (isAsalCustom ? 1 : 0)) >= 3
                        const jmlAg = parseInt(ag.jumlah) || 0
                        return (
                          <div key={gi} className="flex items-start gap-2">
                          <div className="flex-1 border border-gray-200 rounded-lg p-3 bg-white">
                            <div className="grid grid-cols-[1fr_90px] gap-2 items-start">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Asal Sekolah</label>
                                <div className="relative border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-400">
                                  {displayAsal === "lainnya" ? (
                                    <>
                                      <input
                                        autoFocus
                                        value={ag.asalLainnya ?? ""}
                                        onChange={(e) => {
                                          const next = [...form.unsurTerlibat]
                                          next[i].asalGroups[gi] = { ...next[i].asalGroups[gi], asalSekolah: "lainnya", asalLainnya: e.target.value }
                                          setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                                        }}
                                        placeholder="Tulis asal sekolah..."
                                        className={`${SELECT_SM} w-full border-0 rounded-none focus:ring-0 focus:outline-none pr-8`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = [...form.unsurTerlibat]
                                          next[i].asalGroups[gi] = { ...next[i].asalGroups[gi], asalSekolah: "" }
                                          setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                                          openSelectPicker(`asal-select-${i}-${gi}`)
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <Select
                                      id={`asal-select-${i}-${gi}`}
                                      value={ag.asalSekolah}
                                      onChange={(e) => {
                                        const next = [...form.unsurTerlibat]
                                        next[i].asalGroups[gi] = { ...next[i].asalGroups[gi], asalSekolah: e.target.value, asalLainnya: e.target.value === "lainnya" ? next[i].asalGroups[gi].asalLainnya ?? "" : undefined }
                                        setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                                      }}
                                      className={`${SELECT_SM} w-full border-0 rounded-none focus:ring-0 focus:outline-none ${!ag.asalSekolah ? "text-gray-400" : ""}`}
                                    >
                                      <option value="" disabled>Pilih asal sekolah</option>
                                      {form.namaSekolah.filter((s) => s.trim()).map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                      <option value="lainnya" disabled={asalLainDisabled}>Lainnya{asalLainDisabled ? " (maks 3)" : ""}</option>
                                    </Select>
                                  )}
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Jumlah Orang</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={ag.jumlah}
                                  onChange={(e) => {
                                    const next = [...form.unsurTerlibat]
                                    next[i].asalGroups[gi] = { ...next[i].asalGroups[gi], jumlah: e.target.value }
                                    syncIndividu(next, gi)
                                  }}
                                  placeholder="Jml"
                                  className="w-full h-9 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                              </div>
                            </div>
                            {jmlAg > 0 && (
                              <div className="bg-gray-50 rounded-lg mt-4 mb-2 divide-y divide-gray-200">
                                {ag.individu.map((ind, idx) => {
                                  const isStatusCustom = ind.status !== "" && !predefined.includes(ind.status)
                                  const displayStatus = isStatusCustom ? "Lainnya" : ind.status
                                  return (
                                  <div key={idx} className="p-2.5">
                                    <div className="flex items-start gap-2">
                                      <span className={`text-sm text-gray-400 w-5 shrink-0 text-right ${idx === 0 ? "mt-7" : "mt-2"}`}>#{idx + 1}</span>
                                      <div className="flex-1 grid grid-cols-[1.4fr_1fr_1fr_80px] gap-2">
                                        <div>
                                          {idx === 0 && <label className="block text-xs text-gray-700 mb-1">Nama/Inisial</label>}
                                          <input
                                            value={ind.nama}
                                            onChange={(e) => {
                                              const next = [...form.unsurTerlibat]
                                              next[i].asalGroups[gi].individu[idx] = { ...next[i].asalGroups[gi].individu[idx], nama: e.target.value }
                                              setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                                            }}
                                            placeholder="Nama/Inisial"
                                            className="w-full h-9 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                          />
                                        </div>
                                        <div>
                                          {idx === 0 && <label className="block text-xs text-gray-700 mb-1">Status</label>}
                                          <div className="relative border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-400">
                                            {isStatusCustom ? (
                                              <>
                                                <input
                                                  autoFocus
                                                  value={ind.statusLainnya ?? ""}
                                                  onChange={(e) => {
                                                    const next = [...form.unsurTerlibat]
                                                    next[i].asalGroups[gi].individu[idx] = { ...next[i].asalGroups[gi].individu[idx], status: "Lainnya", statusLainnya: e.target.value }
                                                    setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                                                  }}
                                                  placeholder="Tulis status..."
                                                  className={`${SELECT_SM} w-full border-0 rounded-none focus:ring-0 focus:outline-none pr-8`}
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const next = [...form.unsurTerlibat]
                                                    next[i].asalGroups[gi].individu[idx] = { ...next[i].asalGroups[gi].individu[idx], status: "" }
                                                    setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                                                    openSelectPicker(`status-select-${i}-${gi}-${idx}`)
                                                  }}
                                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                >
                                                  <ChevronDown className="w-4 h-4" />
                                                </button>
                                              </>
                                            ) : (
                                              <Select
                                                id={`status-select-${i}-${gi}-${idx}`}
                                                value={ind.status}
                                                onChange={(e) => {
                                                  const val = e.target.value
                                                  const next = [...form.unsurTerlibat]
                                                  const cur = next[i].asalGroups[gi].individu[idx]
                                                  next[i].asalGroups[gi].individu[idx] = { ...cur, status: val === "Lainnya" && cur.statusLainnya ? cur.statusLainnya : val }
                                                  setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                                                }}
                                                className={`${SELECT_SM} border-0 rounded-none truncate focus:ring-0 focus:outline-none ${!ind.status ? "text-gray-400" : ""}`}
                                              >
                                                <option value="" disabled>Pilih status</option>
                                                {UNSUR_OPTIONS.map((o) => (
                                                  <option key={o} value={o}>{o}</option>
                                                ))}
                                              </Select>
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          {idx === 0 && <label className="block text-xs text-gray-700 mb-1">Jenis Kelamin</label>}
                                          <Select
                                            value={ind.jenisKelamin}
                                            onChange={(e) => {
                                              const next = [...form.unsurTerlibat]
                                              next[i].asalGroups[gi].individu[idx] = { ...next[i].asalGroups[gi].individu[idx], jenisKelamin: e.target.value as IndividuItem["jenisKelamin"] }
                                              setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                                            }}
                                            className={`${SELECT_SM} ${!ind.jenisKelamin ? "text-gray-400" : ""}`}
                                          >
                                            <option value="" disabled>Pilih</option>
                                            <option value="Laki-laki">Laki-laki</option>
                                            <option value="Perempuan">Perempuan</option>
                                          </Select>
                                        </div>
                                        <div>
                                          {idx === 0 && <label className="block text-xs text-gray-700 mb-1">Umur</label>}
                                          <input
                                            type="number"
                                            min="1"
                                            value={ind.umur}
                                            onChange={(e) => {
                                              const next = [...form.unsurTerlibat]
                                              next[i].asalGroups[gi].individu[idx] = { ...next[i].asalGroups[gi].individu[idx], umur: e.target.value }
                                              setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                                            }}
                                            placeholder="Umur"
                                            className="w-full h-9 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                          {u.asalGroups.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...form.unsurTerlibat]
                                next[i] = { ...next[i], asalGroups: next[i].asalGroups.filter((_, idx) => idx !== gi) }
                                setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                              }}
                              className="mt-6 p-1 shrink-0 rounded transition text-red-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          </div>
                        )
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...form.unsurTerlibat]
                          next[i] = { ...next[i], asalGroups: [...next[i].asalGroups, { asalSekolah: "", jumlah: "", individu: [{ nama: "", umur: "", status: "", jenisKelamin: "" }] }] }
                          setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg px-2.5 py-1.5 transition w-full justify-center"
                      >
                        <Plus className="w-3 h-3" /> Tambah Asal Sekolah
                      </button>
                      </div>
                    </div>
                    )}
                  </div>
                )})
                })()}
                {form.unsurTerlibat.every((u) => u.peran !== "") && (
                  <>
                    <hr className="border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, unsurTerlibat: [...prev.unsurTerlibat, { peran: "", kategori: "", asalGroups: [{ asalSekolah: "", jumlah: "", individu: [{ nama: "", umur: "", status: "", jenisKelamin: "" }] }] }] }))}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg px-3 py-2 transition w-full justify-center"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Kelompok Unsur
                    </button>
                  </>
                )}
            </div>

            <hr className="border-gray-300 -mx-5 my-2" />

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kronologi Kejadian</p>
            <div className="flex flex-col gap-4">
            {form.kronologi.map((entry, i) => {
              const tanggalField = (
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={entry.tanggal ?? ""}
                    onChange={(e) => {
                      const next = [...form.kronologi]
                      next[i] = { ...next[i], tanggal: e.target.value }
                      setForm((prev) => ({ ...prev, kronologi: next }))
                    }}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              )
              const jamField = (
                <div className="w-[100px] shrink-0">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Jam <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    required
                    value={entry.jam ?? ""}
                    onChange={(e) => {
                      const next = [...form.kronologi]
                      next[i] = { ...next[i], jam: e.target.value }
                      setForm((prev) => ({ ...prev, kronologi: next }))
                    }}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              )
              const lokasiField = (
                <div className="flex-[1.5]">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Lokasi <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={entry.lokasi ?? ""}
                    onChange={(e) => {
                      const next = [...form.kronologi]
                      next[i] = { ...next[i], lokasi: e.target.value }
                      setForm((prev) => ({ ...prev, kronologi: next }))
                    }}
                    placeholder="Lokasi..."
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              )
              return (
              <div key={i} className="flex items-start gap-2">
              <div className="flex-1 border border-gray-200 rounded-lg p-3">
                <div className="flex items-end gap-2">
                  {tanggalField}
                  {jamField}
                  {lokasiField}
                </div>
                <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Keterangan <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    value={entry.keterangan ?? ""}
                    onChange={(e) => {
                      const next = [...form.kronologi]
                      next[i] = { ...next[i], keterangan: e.target.value }
                      setForm((prev) => ({ ...prev, kronologi: next }))
                    }}
                    placeholder="Deskripsikan kejadian pada waktu yang sudah dipilih, termasuk dampak yang terjadi pada terduga korban dan terduga pelaku."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-y"
                  />
                </div>
              </div>
              {form.kronologi.length > 1 && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, kronologi: prev.kronologi.filter((_, idx) => idx !== i) }))}
                  className="mt-1 p-1 shrink-0 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              </div>
              )
            })}
            <button
              type="button"
              disabled={form.kronologi.length >= 20}
              onClick={() => setForm((prev) => ({ ...prev, kronologi: [...prev.kronologi, { tanggal: "", jam: "", lokasi: "", keterangan: "" }] }))}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg px-3 py-2 transition w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600 disabled:hover:border-gray-300"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Kronologi {form.kronologi.length >= 20 && <span className="text-gray-400">(maks 20)</span>}
            </button>
            </div>

            <hr className="border-gray-300 -mx-5 my-2" />

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Motif Kejadian</FieldLabel>
              <textarea
                value={form.motif}
                onChange={(e) => setForm((prev) => ({ ...prev, motif: e.target.value }))}
                placeholder="Jika sudah diketahui, tulis motif atau alasan pelanggaran (contoh: perselisihan, candaan, diskriminasi, senioritas, balas dendam, dll.). Jika belum, mohon tulis “Belum diketahui”."
                rows={4}
                className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-y"
              />
            </div>
          </div>
        </SectionCard>

          <SectionCard icon={<FileText className="w-4 h-4" />} title="Sumber Laporan & Penanggung Jawab">
          <div className="grid grid-cols-1 gap-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sumber Laporan</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel required>Pelapor / Sumber Laporan</FieldLabel>
                <div className="relative mt-1 border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-400">
                  {form.pelapor === "lainnya" ? (
                    <>
                      <input
                        type="text"
                        autoFocus
                        value={form.pelaporLainnya}
                        onChange={(e) => setForm((prev) => ({ ...prev, pelaporLainnya: e.target.value }))}
                        placeholder="Tuliskan sumber laporan..."
                        className="w-full h-9 px-3 text-sm bg-white focus:outline-none pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, pelapor: "" }))
                          openSelectPicker("pelapor-select")
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <Select
                      id="pelapor-select"
                      value={form.pelapor}
                      onChange={(e) => setForm((prev) => ({ ...prev, pelapor: e.target.value as Pelapor }))}
                      className={`w-full h-9 px-3 text-sm bg-white appearance-none focus:outline-none pr-8 ${!form.pelapor ? "text-gray-400" : ""}`}
                    >
                      <option value="" disabled>Pilih pelapor</option>
                      {PELAPOR_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </Select>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Kontak Pelapor <span className="text-gray-400">(opsional)</span></FieldLabel>
                <input
                  type="text"
                  value={form.kontakPelapor}
                  onChange={(e) => setForm((prev) => ({ ...prev, kontakPelapor: e.target.value }))}
                  placeholder="Nama / no. HP untuk konfirmasi"
                  className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {role === "pusat" && <hr className="border-gray-300 -mx-5 my-2" />}

            {role === "pusat" && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kelompok Kerja Penanggung Jawab</p>
            )}

            {role === "pusat" && (
              <div className="flex flex-col gap-1.5">
                <FieldLabel required>Kewenangan</FieldLabel>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {KEWENANGAN_CHIPS.map((opt) => {
                    const isSelected = form.tingkatKelompokKerja === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            tingkatKelompokKerja: opt.value,
                            ...(opt.value === "provinsi" ? { kabupatenKota: "" } : {}),
                          }))
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          isSelected ? opt.selected : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {role === "pusat" && !!form.tingkatKelompokKerja && (
              <div className={`grid gap-3 ${form.tingkatKelompokKerja === "kabkota" ? "grid-cols-2" : "grid-cols-1"}`}>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel required>Provinsi</FieldLabel>
                  <Select
                    value={form.wilayah ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, wilayah: e.target.value, kabupatenKota: "" }))}
                    className={`${SELECT_BASE} ${!form.wilayah ? "text-gray-400" : ""}`}
                  >
                    <option value="" disabled>Pilih provinsi</option>
                    {PROVINSI_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Select>
                </div>
                {form.tingkatKelompokKerja === "kabkota" && (
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required>Kabupaten/Kota</FieldLabel>
                    <Select
                      value={form.kabupatenKota ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, kabupatenKota: e.target.value }))}
                      className={`${SELECT_BASE} ${!form.kabupatenKota ? "text-gray-400" : ""}`}
                      disabled={!form.wilayah}
                    >
                      <option value="" disabled>Pilih kabupaten/kota</option>
                      {(KAB_KOTA_BY_PROVINSI[form.wilayah ?? ""] ?? []).map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            )}

            {(role !== "pusat" || !!form.tingkatKelompokKerja) && (
            <div className="flex flex-col gap-1.5">
              <FieldLabel required={isAdminWilayah}>{role === "pusat" ? "Nama Penanggung Jawab" : "Penanggung Jawab"}{!isAdminWilayah && <span className="text-gray-400"> (opsional)</span>}</FieldLabel>
              {!form.pic ? (
                picManualMode ? (
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => { setPicManualMode(false); setPicInput("") }}
                      className="shrink-0 p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={picInput}
                      onChange={(e) => setPicInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (picInput.trim()) selectPic(picInput.trim()) } }}
                      placeholder="Ketik nama penanggung jawab"
                      autoFocus
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => { if (picInput.trim()) selectPic(picInput.trim()) }}
                      disabled={!picInput.trim()}
                      className="shrink-0 h-9 px-3 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Konfirmasi
                    </button>
                  </div>
                ) : (
                  <div className="relative mt-1">
                    <input
                      type="text"
                      value={picInput}
                      onChange={(e) => { setPicInput(e.target.value); setShowPicDropdown(true) }}
                      onFocus={() => setShowPicDropdown(true)}
                      onClick={() => setShowPicDropdown(true)}
                      onBlur={() => setTimeout(() => setShowPicDropdown(false), 200)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (picInput.trim()) selectPic(picInput.trim()) } }}
                      placeholder="Masukkan nama anggota Kelompok Kerja"
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    {showPicDropdown && (picInput.trim() || filteredPicOptions.length > 0) && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredPicOptions.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectPic(name)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                          >
                            {name}
                          </button>
                        ))}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setPicManualMode(true); setShowPicDropdown(false) }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-500 italic border-t border-gray-100"
                        >
                          Lainnya..
                        </button>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2 py-1.5 px-2 mt-1 bg-gray-50 rounded-lg">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 flex-1">{form.pic}</span>
                  <button type="button" onClick={clearPic} className="p-0.5 hover:bg-gray-200 rounded-full">
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
        </SectionCard>

        {!editId && (
        <SectionCard icon={<CheckCircle className="w-4 h-4" />} title="Status Pelanggaran">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Status Pelanggaran</FieldLabel>
              {editId ? (
                <div className="mt-1"><StatusBadge status={form.status as StatusPelanggaran || "baru"} /></div>
              ) : (
                <Select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as StatusPelanggaran }))}
                  className={`${SELECT_BASE} ${!form.status ? "text-gray-400" : ""}`}
                >
                  <option value="" disabled>Pilih status</option>
                  <option value="baru">Belum Diproses</option>
                  <option value="proses">Diproses</option>
                  <option value="selesai">Selesai</option>
                  <option value="ditutup">Ditutup</option>
                </Select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Tindak Lanjut / Catatan Penanganan <span className="text-gray-400">(opsional)</span></FieldLabel>
              <textarea
                value={form.tindakLanjut}
                onChange={(e) => setForm((prev) => ({ ...prev, tindakLanjut: e.target.value }))}
                placeholder="Jelaskan tindakan penanganan awal yang sudah dilakukan. Contoh: korban telah diamankan, orang tua telah dihubungi, kepala sekolah telah diinformasikan, atau telah dilakukan mediasi."
                rows={3}
                className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-y"
              />
            </div>

            <div className="flex flex-col gap-1.5">
        <FieldLabel>Tautan Dokumentasi <span className="text-gray-400">(opsional)</span></FieldLabel>
              <p className="text-xs text-gray-400">Gunakan cloud storage seperti Google Drive, OneDrive, dll. dengan akses terbatas (dapat dibuka jika melakukan pengajuan akses) untuk mengunggah foto, video, dokumen, tangkapan layar, atau audio. Salin dan masukkan tautannya di kolom ini</p>
            <input
              type="url"
              value={form.dokumentasi ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, dokumentasi: e.target.value }))}
              placeholder="https://drive.google.com/..."
                className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        </SectionCard>
        )}
      </div>

      {!canSubmit && (
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-amber-800">Lengkapi dulu bagian berikut:</p>
            <ul className="mt-1 list-disc pl-4 text-xs text-amber-700 space-y-0.5">
              {missingFields.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 pb-8 flex gap-3">
        <a
          href="/dashboard?menu=pelanggaran"
          className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition text-center"
        >
          Batal
        </a>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition ${canSubmit ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
        >
          {editId ? "Simpan Perubahan" : "Kirim Laporan"}
        </button>
      </div>
    </div>
  )
}

export default function TambahPelanggaranPage() {
  return (
    <Suspense>
      <TambahPelanggaranInner />
    </Suspense>
  )
}
