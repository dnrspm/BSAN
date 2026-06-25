"use client"

import { useEffect, useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft, AlertTriangle, Users, Calendar, FileText,
  CheckCircle, Clock, Plus, X, XCircle,
} from "lucide-react"

type StatusPelanggaran = "baru" | "proses" | "selesai" | "ditutup"
type TingkatKeparahan = "biasa" | "urgen" | "sangat_urgen"
type Pelapor = "laporan_masyarakat" | "laporan_sekolah" | "laporan_kemendikdasmen" | "temuan_pengawas" | "media" | "lainnya"

interface IndividuItem {
  nama: string
  umur: string
}

interface KronologiEntry {
  tanggal: string
  jam: string
  lokasi: string
  keterangan: string
}

interface UnsurItem {
  peran: "pelaku" | "korban"
  kategori: string
  asalSekolah: string
  jumlah: string
  individu: IndividuItem[]
}

interface PelanggaranItem {
  id: string
  namaSekolah: string[]
  unsurTerlibat: UnsurItem[]
  tanggalTerjadi: string
  kronologi?: KronologiEntry[]
  kategori: string
  tingkatKeparahan: TingkatKeparahan
  pelapor: Pelapor
  pelaporLainnya?: string
  tindakLanjut: string
  pic: string
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

const UNSUR_OPTIONS = ["Siswa Laki-laki", "Siswa Perempuan", "Guru", "Tenaga Kependidikan", "Kepala Sekolah", "Warga Sekolah", "Lainnya"]

const KATEGORI_PELANGGARAN = [
  "Perundungan (Bullying)", "Pelecehan Seksual", "Kekerasan Fisik",
  "Kekerasan Verbal", "Pencurian", "Vandalisme", "Penggunaan NAPZA",
  "Melanggar Aturan Sekolah", "Pelanggaran Hukum", "Lainnya",
]

const TINGKAT_KEPARAHAN: { value: TingkatKeparahan; label: string; color: string }[] = [
  { value: "biasa", label: "Biasa", color: "bg-yellow-100 text-yellow-700" },
  { value: "urgen", label: "Urgen", color: "bg-orange-100 text-orange-700" },
  { value: "sangat_urgen", label: "Sangat Urgen", color: "bg-red-100 text-red-700" },
]

const PELAPOR_OPTIONS: { value: Pelapor; label: string }[] = [
  { value: "laporan_masyarakat", label: "Laporan masyarakat" },
  { value: "laporan_sekolah", label: "Laporan sekolah" },
  { value: "laporan_kemendikdasmen", label: "Laporan Kemendikdasmen" },
  { value: "temuan_pengawas", label: "Temuan pengawas/pokja" },
  { value: "media", label: "Media/berita" },
  { value: "lainnya", label: "Lainnya" },
]

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-gray-700">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
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
    unsurTerlibat: [{ peran: "pelaku", kategori: "", asalSekolah: "", jumlah: "", individu: [{ nama: "", umur: "" }] }] as UnsurItem[],
    tanggalTerjadi: "",
    kronologi: [{ tanggal: "", jam: "", lokasi: "", keterangan: "" }],
    kategori: "",
    tingkatKeparahan: "biasa" as TingkatKeparahan,
    pelapor: "laporan_sekolah" as Pelapor,
    pelaporLainnya: "",
    pic: "",
    tindakLanjut: "",
    dokumentasi: "",
    rekomendasi: "",
    motif: "",
    tanggalPelaporan: "",
    status: "baru" as StatusPelanggaran,
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
  const [asalSekolahQuery, setAsalSekolahQuery] = useState<Record<number, string>>({})
  const [openAsalSekolahIdx, setOpenAsalSekolahIdx] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const selectPic = (name: string) => {
    setForm((prev) => ({ ...prev, pic: name }))
    setPicInput("")
    setShowPicDropdown(false)
  }

  const clearPic = () => {
    setForm((prev) => ({ ...prev, pic: "" }))
    setPicInput("")
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
          unsurTerlibat: Array.isArray(found.unsurTerlibat) ? found.unsurTerlibat : [],
          dokumentasi: Array.isArray(found.dokumentasi) ? found.dokumentasi[0] ?? "" : found.dokumentasi,
          tingkatKeparahan: (found as any).tingkatKeparahan ?? "biasa",
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
            unsurTerlibat: normalized.unsurTerlibat.length > 0 ? normalized.unsurTerlibat : [{ peran: "pelaku", kategori: "", asalSekolah: "", jumlah: "", individu: [{ nama: "", umur: "" }] }],
            tanggalTerjadi: normalized.tanggalTerjadi?.split("T")[0] ?? "",
            kronologi: Array.isArray((normalized as any).kronologi) ? (normalized as any).kronologi.map((e: any) => ({ tanggal: e.tanggal ?? "", jam: e.jam ?? "", lokasi: e.lokasi ?? "", keterangan: e.keterangan ?? "" })) : (normalized as any).kronologi ? [{ tanggal: normalized.tanggalTerjadi?.split("T")[0] ?? "", jam: "", lokasi: "", keterangan: (normalized as any).kronologi }] : [{ tanggal: "", jam: "", lokasi: "", keterangan: "" }],
            kategori: normalized.kategori,
            tingkatKeparahan: normalized.tingkatKeparahan,
            pelapor: normalized.pelapor,
            pelaporLainnya: normalized.pelaporLainnya ?? "",
            pic: normalized.pic ?? "",
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

  const addSekolah = (name: string) => {
    const trimmed = name.trim()
    if (trimmed && !form.namaSekolah.includes(trimmed)) {
      setForm((prev) => ({ ...prev, namaSekolah: [...prev.namaSekolah, trimmed] }))
    }
    setSekolahInput("")
    setShowSekolahDropdown(false)
  }

  const removeSekolah = (index: number) => {
    setForm((prev) => ({ ...prev, namaSekolah: prev.namaSekolah.filter((_, i) => i !== index) }))
  }

  const canSubmit =
    form.namaSekolah.length > 0 &&
    form.unsurTerlibat.some((u) => u.kategori && u.peran && u.individu.some((ind) => ind.nama)) &&
    form.kronologi.some((e) => e.tanggal) &&
    form.kategori &&
    form.tingkatKeparahan &&
    form.pelapor

  const handleSubmit = () => {
    if (!canSubmit) return
    const firstTanggal = form.kronologi.find((e) => e.tanggal)?.tanggal ?? ""
    const session = (() => {
      try { return JSON.parse(localStorage.getItem("auth") ?? "{}") } catch { return {} }
    })() as { role?: string; namaSekolah?: string; namaDinas?: string }
    const now = new Date().toISOString()
    const dibuatOleh = session?.role === "dinas"
      ? `Admin Dinas ${session.namaDinas ?? ""}`
      : session?.namaSekolah
        ? `Admin Sekolah ${session.namaSekolah}`
        : "Admin Sekolah"

    try {
      const stored = JSON.parse(localStorage.getItem("pelanggaranList") ?? "[]") as PelanggaranItem[]

      if (editId) {
        const updated = stored.map((i) =>
          i.id === editId
            ? {
                ...i,
                ...form,
                tanggalTerjadi: firstTanggal,
                pelaporLainnya: form.pelapor === "lainnya" ? form.pelaporLainnya : "",
                unsurTerlibat: form.unsurTerlibat.filter((u) => u.kategori && u.peran && u.individu.some((ind) => ind.nama)),
                updatedAt: now,
                diperbaruiOleh: dibuatOleh,
                logStatus: [
                  ...(Array.isArray((i as any).logStatus) ? (i as any).logStatus : []),
                  { status: form.status, keterangan: "", dokumentasi: "", dibuatOleh, aksi: "edit", waktu: now },
                ],
              }
            : i
        )
        localStorage.setItem("pelanggaranList", JSON.stringify(updated))
      } else {
        const newItem = {
          ...form,
          tanggalTerjadi: firstTanggal,
          id: `pg-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
          dibuatOleh,
          diperbaruiOleh: dibuatOleh,
          pelaporLainnya: form.pelapor === "lainnya" ? form.pelaporLainnya : "",
          unsurTerlibat: form.unsurTerlibat.filter((u) => u.kategori && u.peran && u.individu.some((ind) => ind.nama)),
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
          <SectionCard icon={<AlertTriangle className="w-4 h-4" />} title="Informasi Pelanggaran">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Nama Sekolah</FieldLabel>
                <div className="flex flex-col gap-1.5 mt-1">
                  {item.namaSekolah.length > 0 ? item.namaSekolah.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 px-2 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{s}</span>
                    </div>
                  )) : <span className="text-sm text-gray-400">-</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Kategori Pelanggaran</FieldLabel>
                  <TextInput value={item.kategori} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Tingkat Urgensi</FieldLabel>
                  <TextInput value={TINGKAT_KEPARAHAN.find((t) => t.value === item.tingkatKeparahan)?.label ?? item.tingkatKeparahan} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel>Tanggal Kejadian</FieldLabel>
                <TextInput value={new Date(item.tanggalTerjadi).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(item as any).motif && (
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Motif Kejadian</FieldLabel>
                    <TextInput value={(item as any).motif} />
                  </div>
                )}
                {(item as any).tanggalPelaporan && (
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Tanggal Pelaporan</FieldLabel>
                    <TextInput value={new Date((item as any).tanggalPelaporan).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} />
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<Clock className="w-4 h-4" />} title="Detail Kasus">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Unsur yang Terlibat</FieldLabel>
                <div className="flex flex-col gap-2 mt-1">
                  {item.unsurTerlibat.length > 0 ? item.unsurTerlibat.map((u, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg px-3 py-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          u.peran === "pelaku" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {u.peran === "pelaku" ? "Pelaku" : "Korban"}
                        </span>
                        <span className="text-xs font-medium text-gray-500">{u.kategori || "-"}</span>
                        {u.asalSekolah && <span className="text-xs text-gray-500">· {u.asalSekolah}</span>}
                      </div>
                      {Array.isArray(u.individu) && u.individu.length > 0 && u.individu.map((ind, idx) => (
                        <div key={idx} className="flex items-center gap-3 pl-4 text-sm">
                          <span className="text-gray-400 text-xs">#{idx + 1}</span>
                          <span className="font-semibold text-gray-900">{ind.nama || "-"}</span>
                          {ind.umur && <span className="text-gray-500 text-xs">{ind.umur} thn</span>}
                        </div>
                      ))}
                    </div>
                  )) : <span className="text-sm text-gray-400">-</span>}
                </div>
              </div>

              <hr className="border-gray-300 -mx-5" />

              <div className="flex flex-col gap-1.5">
                <FieldLabel>Kronologi Kejadian</FieldLabel>
                {Array.isArray((item as any).kronologi) && (item as any).kronologi.length > 0 ? (
                  <div className="flex flex-col gap-2 mt-1">
                    {(item as any).kronologi.map((entry: { tanggal?: string; jam?: string; lokasi?: string; keterangan?: string }, i: number) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                          {i < (item as any).kronologi.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                        </div>
                        <div className="pb-3">
                          {(entry.tanggal || entry.jam) && (
                            <p className="text-xs text-gray-400 mb-0.5">
                              {entry.tanggal && new Date(entry.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              {entry.jam && ` · ${entry.jam}`}
                              {entry.lokasi && ` · ${entry.lokasi}`}
                            </p>
                          )}
                          <p className="text-gray-700">{entry.keterangan || "-"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <span className="text-sm text-gray-400 mt-1">-</span>}
              </div>

              <hr className="border-gray-300 -mx-5" />

              <div className="flex flex-col gap-1.5">
                <FieldLabel>Keterangan Tambahan</FieldLabel>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{item.rekomendasi || "-"}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<Users className="w-4 h-4" />} title="Sumber Laporan & PIC">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Pelapor / Sumber Laporan</FieldLabel>
                <TextInput value={PELAPOR_OPTIONS.find((p) => p.value === item.pelapor)?.label ?? item.pelapor} />
                {item.pelapor === "lainnya" && item.pelaporLainnya && (
                  <TextInput value={item.pelaporLainnya} />
                )}
              </div>
              {item.pic && (
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Penanggung Jawab (PIC)</FieldLabel>
                  <TextInput value={item.pic} />
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard icon={<CheckCircle className="w-4 h-4" />} title="Riwayat Status Pelanggaran">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3">
                  {Array.isArray((item as any).logStatus) && (item as any).logStatus.map((entry: { status: StatusPelanggaran; keterangan: string; dokumentasi?: string; dibuatOleh?: string; aksi?: string; waktu: string }, i: number) => {
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
                        {(entry as any).dokumentasi ? <p className="text-xs text-gray-700"><span className="font-medium">Dokumentasi:</span> {(entry as any).dokumentasi.startsWith("http") ? <a href={(entry as any).dokumentasi} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{(entry as any).dokumentasi}</a> : (entry as any).dokumentasi}</p> : null}
                        <p className="text-xs text-gray-400">
                          {new Date(entry.waktu).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    )
                  })}
                </div>
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

        {role === "dinas" && (
          <div className="max-w-2xl mx-auto px-4 pb-8 flex gap-3">
            <a href={`/dashboard?menu=pelanggaran&edit=${item.id}`} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition text-center">Edit</a>
            <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg border border-red-300 text-red-600 font-medium text-sm hover:bg-red-50 transition">Hapus</button>
            <button onClick={() => { setNewStatus(item.status); setKeteranganStatus(""); setDokumentasiStatus(""); setShowStatusModal(true) }} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition">Perbaharui Status</button>
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
  const pageTitle = createMode ? "Buat Pelanggaran" : editId ? "Edit Pelanggaran" : ""

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
            <p className="text-xs text-gray-500">Lengkapi formulir pelaporan</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <SectionCard icon={<AlertTriangle className="w-4 h-4" />} title="Informasi Pelanggaran">
          <div className="grid grid-cols-1 gap-4">
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
                  placeholder="Tambah nama sekolah"
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

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel required>Kategori Pelanggaran</FieldLabel>
                <select
                  value={form.kategori}
                  onChange={(e) => setForm((prev) => ({ ...prev, kategori: e.target.value }))}
                  className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="" disabled>Pilih kategori</option>
                  {KATEGORI_PELANGGARAN.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel required>Tingkat Urgensi</FieldLabel>
                <select
                  value={form.tingkatKeparahan}
                  onChange={(e) => setForm((prev) => ({ ...prev, tingkatKeparahan: e.target.value as TingkatKeparahan }))}
                  className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {TINGKAT_KEPARAHAN.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Motif Kejadian</FieldLabel>
                <input
                  type="text"
                  value={form.motif}
                  onChange={(e) => setForm((prev) => ({ ...prev, motif: e.target.value }))}
                  placeholder="Tuliskan motif kejadian..."
                  className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
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
          </div>
        </SectionCard>

        <SectionCard icon={<Clock className="w-4 h-4" />} title="Detail Kasus">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Unsur yang Terlibat</FieldLabel>
            </div>
            <div className="flex flex-col gap-4">
                {form.unsurTerlibat.map((u, i) => {
                  const predefined = UNSUR_OPTIONS.filter((o) => o !== "Lainnya")
                  const isCustom = u.kategori && !predefined.includes(u.kategori)
                  const displayKategori = isCustom ? "Lainnya" : u.kategori
                  const lainCount = form.unsurTerlibat.filter((_, idx) => idx !== i && (_.kategori === "Lainnya" || (!predefined.includes(_.kategori) && _.kategori))).length
                  const lainDisabled = lainCount >= 3
                  const jml = parseInt(u.jumlah) || 0
                  const syncIndividu = (next: UnsurItem[]) => {
                    const entry = next[i]
                    if (!entry) return
                    const newJml = parseInt(entry.jumlah) || 0
                    if (!entry.individu) entry.individu = []
                    const current = entry.individu.length
                    if (newJml > current) {
                      const add = Array.from({ length: newJml - current }, () => ({ nama: "", umur: "" }))
                      entry.individu = [...entry.individu, ...add]
                    } else if (newJml < current) {
                      entry.individu = entry.individu.slice(0, newJml)
                    }
                    if (newJml === 0) entry.individu = [{ nama: "", umur: "" }]
                    setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                  }
                  return (
                  <div key={i}>
                    <div className="grid grid-cols-[auto_1fr_1fr_72px_auto] gap-2 items-end">
                      <div>
                        {i === 0 && <label className="block text-xs text-gray-500 mb-1">Peran</label>}
                        <select
                          value={u.peran}
                          onChange={(e) => {
                            const next = [...form.unsurTerlibat]
                            next[i] = { ...next[i], peran: e.target.value as "pelaku" | "korban" }
                            setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                          }}
                          className="h-8 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="pelaku">Terduga Pelaku</option>
                          <option value="korban">Terduga Korban</option>
                        </select>
                      </div>
                      <div>
                        {i === 0 && <label className="block text-xs text-gray-500 mb-1">Jenis</label>}
                        <select
                          value={displayKategori}
                          onChange={(e) => {
                            const next = [...form.unsurTerlibat]
                            next[i] = { ...next[i], kategori: e.target.value }
                            setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                          }}
                          className="w-full h-8 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white truncate"
                        >
                          <option value="" disabled>Jenis</option>
                          {UNSUR_OPTIONS.map((o) => (
                            <option key={o} value={o} disabled={o === "Lainnya" && lainDisabled}>{o} {o === "Lainnya" && lainDisabled ? "(maks 3)" : ""}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        {i === 0 && <label className="block text-xs text-gray-500 mb-1">Asal Sekolah</label>}
                        {displayKategori === "Lainnya" ? (
                          <input
                            value={u.kategori !== "Lainnya" ? u.kategori : ""}
                            onChange={(e) => {
                              const next = [...form.unsurTerlibat]
                              next[i] = { ...next[i], kategori: e.target.value }
                              setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                            }}
                            placeholder="Tulis..."
                            className="w-full h-8 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        ) : form.namaSekolah.length > 0 ? (
                          <select
                            value={u.asalSekolah}
                            onChange={(e) => {
                              const next = [...form.unsurTerlibat]
                              next[i] = { ...next[i], asalSekolah: e.target.value }
                              setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                            }}
                            className="w-full h-8 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Pilih sekolah</option>
                            {form.namaSekolah.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={u.asalSekolah}
                            onChange={(e) => {
                              const next = [...form.unsurTerlibat]
                              next[i] = { ...next[i], asalSekolah: e.target.value }
                              setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                            }}
                            placeholder="Asal sekolah"
                            className="w-full h-8 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        )}
                      </div>
                      <div>
                        {i === 0 && <label className="block text-xs text-gray-500 mb-1">Jml</label>}
                        <input
                          type="number"
                          min="0"
                          value={u.jumlah}
                          onChange={(e) => {
                            const next = [...form.unsurTerlibat]
                            next[i] = { ...next[i], jumlah: e.target.value }
                            syncIndividu(next)
                          }}
                          placeholder="Jml"
                          className="w-full h-8 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        {i > 0 ? (
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, unsurTerlibat: prev.unsurTerlibat.filter((_, idx) => idx !== i) }))}
                            className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="w-5" />
                        )}
                      </div>
                    </div>
                    {jml > 0 && (
                      <div className="flex flex-col bg-gray-50 rounded-lg mt-4 mb-2 p-2 overflow-hidden">
                        {u.individu.map((ind, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-2 py-1.5">
                          <span className="text-sm text-gray-400 w-5 shrink-0 text-right">#{idx + 1}</span>
                          <input
                            value={ind.nama}
                            onChange={(e) => {
                              const next = [...form.unsurTerlibat]
                              next[i].individu[idx] = { ...next[i].individu[idx], nama: e.target.value }
                              setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                            }}
                            placeholder="Nama"
                            className="flex-1 min-w-0 h-8 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <input
                            type="number"
                            min="1"
                            value={ind.umur}
                            onChange={(e) => {
                              const next = [...form.unsurTerlibat]
                              next[i].individu[idx] = { ...next[i].individu[idx], umur: e.target.value }
                              setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                            }}
                            placeholder="Umur"
                            className="w-[88px] shrink-0 h-8 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        ))}
                      </div>
                    )}
                    {i < form.unsurTerlibat.length - 1 && <hr className="border-gray-100 mt-4" />}
                  </div>
                )})}
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, unsurTerlibat: [...prev.unsurTerlibat, { peran: "pelaku", kategori: "", asalSekolah: "", jumlah: "", individu: [{ nama: "", umur: "" }] }] }))}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg px-3 py-2 transition w-full justify-center"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Kelompok Unsur
                </button>
            </div>

            <hr className="border-gray-300 -mx-5 my-2" />

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Kronologi Kejadian</FieldLabel>
            </div>
            <div className="flex flex-col gap-2">
            {form.kronologi.map((entry, i) => (
              <div key={i}>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    {i === 0 && <label className="block text-xs text-gray-500 mb-1">Tanggal</label>}
                    <input
                      type="date"
                      value={entry.tanggal ?? ""}
                      onChange={(e) => {
                        const next = [...form.kronologi]
                        next[i] = { ...next[i], tanggal: e.target.value }
                        setForm((prev) => ({ ...prev, kronologi: next }))
                      }}
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div className="w-[100px] shrink-0">
                    {i === 0 && <label className="block text-xs text-gray-500 mb-1">Jam</label>}
                    <input
                      type="time"
                      value={entry.jam ?? ""}
                      onChange={(e) => {
                        const next = [...form.kronologi]
                        next[i] = { ...next[i], jam: e.target.value }
                        setForm((prev) => ({ ...prev, kronologi: next }))
                      }}
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div className="flex-[1.5]">
                    {i === 0 && <label className="block text-xs text-gray-500 mb-1">Lokasi</label>}
                    <input
                      type="text"
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
                  <div className="flex-[2]">
                    {i === 0 && <label className="block text-xs text-gray-500 mb-1">Keterangan</label>}
                    <input
                      type="text"
                      value={entry.keterangan ?? ""}
                      onChange={(e) => {
                        const next = [...form.kronologi]
                        next[i] = { ...next[i], keterangan: e.target.value }
                        setForm((prev) => ({ ...prev, kronologi: next }))
                      }}
                      placeholder="Deskripsikan kejadian pada tanggal ini..."
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  {form.kronologi.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, kronologi: prev.kronologi.filter((_, idx) => idx !== i) }))}
                      className="p-1 self-center hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, kronologi: [...prev.kronologi, { tanggal: "", jam: "", lokasi: "", keterangan: "" }] }))}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg px-3 py-2 transition w-full justify-center"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Kronologi
            </button>
            </div>

            <hr className="border-gray-300 -mx-5 my-2" />

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Keterangan Tambahan</FieldLabel>
              <textarea
                value={form.rekomendasi}
                onChange={(e) => setForm((prev) => ({ ...prev, rekomendasi: e.target.value }))}
                placeholder="Tuliskan keterangan tambahan..."
                rows={4}
                className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<FileText className="w-4 h-4" />} title="Sumber Laporan & PIC">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Pelapor / Sumber Laporan</FieldLabel>
              <select
                value={form.pelapor}
                onChange={(e) => setForm((prev) => ({ ...prev, pelapor: e.target.value as Pelapor }))}
                className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {PELAPOR_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              {form.pelapor === "lainnya" && (
                <input
                  type="text"
                  value={form.pelaporLainnya}
                  onChange={(e) => setForm((prev) => ({ ...prev, pelaporLainnya: e.target.value }))}
                  placeholder="Tuliskan sumber laporan..."
                  className="w-full h-9 px-3 mt-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Penanggung Jawab (PIC) <span className="text-gray-400">(opsional)</span></FieldLabel>
              {!form.pic ? (
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={picInput}
                    onChange={(e) => { setPicInput(e.target.value); setShowPicDropdown(true) }}
                    onFocus={() => setShowPicDropdown(true)}
                    onClick={() => setShowPicDropdown(true)}
                    onBlur={() => setTimeout(() => setShowPicDropdown(false), 200)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (filteredPicOptions.length > 0) selectPic(filteredPicOptions[0]) } }}
                    placeholder="Cari nama anggota pokja..."
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  {showPicDropdown && filteredPicOptions.length > 0 && (
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
                    </div>
                  )}
                </div>
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
          </div>
        </SectionCard>

        {!editId && (
        <SectionCard icon={<CheckCircle className="w-4 h-4" />} title="Status Pelanggaran">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Status Pelanggaran</FieldLabel>
              {editId ? (
                <div className="mt-1"><StatusBadge status={form.status} /></div>
              ) : (
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as StatusPelanggaran }))}
                  className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="baru">Baru</option>
                  <option value="proses">Diproses</option>
                  <option value="selesai">Selesai</option>
                  <option value="ditutup">Ditutup</option>
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Tindak Lanjut / Catatan Penanganan <span className="text-gray-400">(opsional)</span></FieldLabel>
              <textarea
                value={form.tindakLanjut}
                onChange={(e) => setForm((prev) => ({ ...prev, tindakLanjut: e.target.value }))}
                placeholder="Catat apa yang sudah atau akan dilakukan..."
                rows={3}
                className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Link Dokumentasi <span className="text-gray-400">(opsional)</span></FieldLabel>
              <input
                type="text"
                value={form.dokumentasi}
                onChange={(e) => setForm((prev) => ({ ...prev, dokumentasi: e.target.value }))}
                placeholder="Link atau keterangan dokumentasi..."
                className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        </SectionCard>
        )}
      </div>

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
          className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {editId ? "Simpan Perubahan" : "Buat Pelanggaran"}
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
