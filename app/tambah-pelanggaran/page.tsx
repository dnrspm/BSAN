"use client"

import { useEffect, useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft, AlertTriangle, Users, Calendar, FileText,
  CheckCircle, Clock, Plus, X, XCircle,
} from "lucide-react"

type StatusPelanggaran = "baru" | "proses" | "selesai" | "ditutup"
type TingkatKeparahan = "ringan" | "sedang" | "berat"
type Pelapor = "laporan_masyarakat" | "laporan_sekolah" | "temuan_pengawas" | "media" | "lainnya"

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
  tingkatKeparahan: TingkatKeparahan
  pelapor: Pelapor
  pelaporLainnya?: string
  tindakLanjut: string
  pic: string
  dokumentasi: string
  rekomendasi: string
  status: StatusPelanggaran
  createdAt: string
  updatedAt: string
  dibuatOleh: string
}

const SEKOLAH_OPTIONS = [
  "SDN 1 Banda Aceh", "SDN 2 Banda Aceh", "SMPN 1 Banda Aceh",
  "SMAN 1 Banda Aceh", "SMKN 1 Banda Aceh", "SDN 1 Medan",
  "SMPN 2 Jakarta Pusat", "SMAN 3 Surabaya", "SDN 4 Bandung",
  "SMPN 5 Yogyakarta", "SMKN 2 Semarang", "SDN 1 Denpasar",
  "SMPN 3 Makassar", "SMAN 2 Palembang",
]

const UNSUR_OPTIONS = ["Siswa Laki-laki", "Siswa Perempuan", "Guru", "Staff", "Lainnya"]

const KATEGORI_PELANGGARAN = [
  "Perundungan (Bullying)", "Pelecehan Seksual", "Kekerasan Fisik",
  "Kekerasan Verbal", "Pencurian", "Vandalisme", "Penggunaan NAPZA",
  "Melanggar Aturan Sekolah", "Lainnya",
]

const TINGKAT_KEPARAHAN: { value: TingkatKeparahan; label: string; color: string }[] = [
  { value: "ringan", label: "Ringan", color: "bg-yellow-100 text-yellow-700" },
  { value: "sedang", label: "Sedang", color: "bg-orange-100 text-orange-700" },
  { value: "berat", label: "Berat", color: "bg-red-100 text-red-700" },
]

const PELAPOR_OPTIONS: { value: Pelapor; label: string }[] = [
  { value: "laporan_masyarakat", label: "Laporan masyarakat" },
  { value: "laporan_sekolah", label: "Laporan sekolah" },
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
    unsurTerlibat: [{ kategori: "", jumlah: "" }] as UnsurItem[],
    tanggalTerjadi: "",
    kategori: "",
    tingkatKeparahan: "ringan" as TingkatKeparahan,
    pelapor: "laporan_sekolah" as Pelapor,
    pelaporLainnya: "",
    pic: "",
    tindakLanjut: "",
    dokumentasi: "",
    rekomendasi: "",
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

  // Form mode state
  const [form, setForm] = useState<FormData>(emptyForm)
  const [sekolahInput, setSekolahInput] = useState("")
  const [showSekolahDropdown, setShowSekolahDropdown] = useState(false)
  const [picInput, setPicInput] = useState("")
  const [showPicDropdown, setShowPicDropdown] = useState(false)
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
          tingkatKeparahan: (found as any).tingkatKeparahan ?? "ringan",
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
            unsurTerlibat: normalized.unsurTerlibat.length > 0 ? normalized.unsurTerlibat : [{ kategori: "", jumlah: "" }],
            tanggalTerjadi: normalized.tanggalTerjadi?.split("T")[0] ?? "",
            kategori: normalized.kategori,
            tingkatKeparahan: normalized.tingkatKeparahan,
            pelapor: normalized.pelapor,
            pelaporLainnya: normalized.pelaporLainnya ?? "",
            pic: normalized.pic ?? "",
            tindakLanjut: normalized.tindakLanjut ?? "",
            dokumentasi: normalized.dokumentasi,
            rekomendasi: normalized.rekomendasi,
            status: normalized.status,
          })
        }
      }
    } catch {}
  }, [viewId, editId])

  // School suggestions
  const allSchoolSuggestions = useMemo(() => {
    const names = new Set<string>()
    SEKOLAH_OPTIONS.forEach((s) => names.add(s))
    try {
      const stored = localStorage.getItem("pelanggaranList")
      if (stored) {
        JSON.parse(stored).forEach((item: PelanggaranItem) => {
          const list = Array.isArray(item.namaSekolah) ? item.namaSekolah : [item.namaSekolah]
          list.forEach((s) => { if (s.trim()) names.add(s.trim()) })
        })
      }
    } catch {}
    return Array.from(names).sort()
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
    ? allSchoolSuggestions.filter((s) => s.toLowerCase().includes(sekolahInput.toLowerCase()) && !form.namaSekolah.includes(s))
    : allSchoolSuggestions.filter((s) => !form.namaSekolah.includes(s))

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
    form.unsurTerlibat.some((u) => u.kategori && u.jumlah) &&
    form.tanggalTerjadi &&
    form.kategori &&
    form.tingkatKeparahan &&
    form.pelapor &&
    form.rekomendasi.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
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
                pelaporLainnya: form.pelapor === "lainnya" ? form.pelaporLainnya : "",
                unsurTerlibat: form.unsurTerlibat.filter((u) => u.kategori && u.jumlah),
                updatedAt: now,
              }
            : i
        )
        localStorage.setItem("pelanggaranList", JSON.stringify(updated))
      } else {
        const newItem = {
          ...form,
          id: `pg-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
          dibuatOleh,
          pelaporLainnya: form.pelapor === "lainnya" ? form.pelaporLainnya : "",
          unsurTerlibat: form.unsurTerlibat.filter((u) => u.kategori && u.jumlah),
          logStatus: [{ status: form.status, keterangan: "Laporan awal dibuat", waktu: now }],
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
    if (!viewId || !item || newStatus === item.status) return
    try {
      const stored = JSON.parse(localStorage.getItem("pelanggaranList") ?? "[]") as PelanggaranItem[]
      const updated = stored.map((i) =>
        i.id === viewId
          ? {
              ...i,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              logStatus: [
                ...(Array.isArray((i as any).logStatus) ? (i as any).logStatus : []),
                { status: newStatus, keterangan: keteranganStatus.trim(), waktu: new Date().toISOString() },
              ],
            }
          : i
      )
      localStorage.setItem("pelanggaranList", JSON.stringify(updated))
      const savedLog = Array.isArray((updated.find((i) => i.id === viewId) as any)?.logStatus)
        ? (updated.find((i) => i.id === viewId) as any).logStatus
        : []
      setItem({ ...item, status: newStatus, updatedAt: new Date().toISOString(), logStatus: savedLog })
    } catch {}
    setShowStatusModal(false)
    setKeteranganStatus("")
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
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Kategori Pelanggaran</FieldLabel>
                <TextInput value={item.kategori} />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Tingkat Keparahan</FieldLabel>
                <TextInput value={TINGKAT_KEPARAHAN.find((t) => t.value === item.tingkatKeparahan)?.label ?? item.tingkatKeparahan} />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Pelapor / Sumber Laporan</FieldLabel>
                <TextInput value={PELAPOR_OPTIONS.find((p) => p.value === item.pelapor)?.label ?? item.pelapor} />
              </div>
              {item.pic && (
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Penanggung Jawab (PIC)</FieldLabel>
                  <TextInput value={item.pic} />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Detail Kasus</FieldLabel>
                <textarea
                  value={item.rekomendasi}
                  disabled
                  rows={4}
                  className="w-full p-3 mt-1 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-default resize-none"
                />
              </div>
              {item.tindakLanjut && (
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Tindak Lanjut / Catatan Penanganan</FieldLabel>
                  <textarea
                    value={item.tindakLanjut}
                    disabled
                    rows={3}
                    className="w-full p-3 mt-1 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-default resize-none"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Unsur yang Terlibat</FieldLabel>
                <div className="flex flex-col gap-2 mt-1">
                  {item.unsurTerlibat.length > 0 ? item.unsurTerlibat.map((u, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{u.kategori}</span>
                      <span className="text-sm text-gray-500">: {u.jumlah} org</span>
                    </div>
                  )) : <span className="text-sm text-gray-400">-</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Kapan Terjadi</FieldLabel>
                <TextInput value={new Date(item.tanggalTerjadi).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} />
              </div>
            </div>
          </SectionCard>

          {item.dokumentasi && (
            <SectionCard icon={<FileText className="w-4 h-4" />} title="Dokumentasi">
              <TextInput value={item.dokumentasi} />
            </SectionCard>
          )}

          {Array.isArray((item as any).logStatus) && (item as any).logStatus.length > 0 && (
            <SectionCard icon={<Clock className="w-4 h-4" />} title="Riwayat Status">
              <div className="flex flex-col gap-3">
                {(item as any).logStatus.map((entry: { status: StatusPelanggaran; keterangan: string; waktu: string }, i: number) => (
                  <div key={i} className="flex items-start gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                    <StatusBadge status={entry.status} />
                    <div className="flex-1 min-w-0">
                      {entry.keterangan && <p className="text-xs text-gray-600">{entry.keterangan}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(entry.waktu).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
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
              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-700">Keterangan <span className="text-gray-400">(opsional)</span></label>
                <textarea
                  value={keteranganStatus}
                  onChange={(e) => setKeteranganStatus(e.target.value)}
                  placeholder="Tambahkan keterangan..."
                  rows={2}
                  className="w-full p-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowStatusModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition">Batal</button>
                <button onClick={handleUpdateStatus} disabled={newStatus === item.status} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">Simpan</button>
              </div>
            </div>
          </div>
        )}

        {role === "dinas" && (
          <div className="max-w-2xl mx-auto px-4 pb-8 flex gap-3">
            <a href={`/dashboard?menu=pelanggaran&edit=${item.id}`} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition text-center">Edit</a>
            <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg border border-red-300 text-red-600 font-medium text-sm hover:bg-red-50 transition">Hapus</button>
            <button onClick={() => { setNewStatus(item.status); setKeteranganStatus(""); setShowStatusModal(true) }} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition">Perbaharui Status</button>
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
                <FieldLabel required>Tingkat Keparahan</FieldLabel>
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

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Tanggal Kejadian</FieldLabel>
              <input
                type="date"
                value={form.tanggalTerjadi}
                onChange={(e) => setForm((prev) => ({ ...prev, tanggalTerjadi: e.target.value }))}
                className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Unsur yang Terlibat</FieldLabel>
              <div className="flex flex-col gap-3 mt-1">
                {form.unsurTerlibat.map((u, i) => {
                const predefined = UNSUR_OPTIONS.filter((o) => o !== "Lainnya")
                const isCustom = u.kategori && !predefined.includes(u.kategori)
                const displayValue = isCustom ? "Lainnya" : u.kategori
                const takenByOthers = form.unsurTerlibat
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
                          const next = [...form.unsurTerlibat]
                          next[i] = { ...next[i], kategori: e.target.value }
                          setForm((prev) => ({ ...prev, unsurTerlibat: next }))
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
                            const next = [...form.unsurTerlibat]
                            next[i] = { ...next[i], kategori: e.target.value }
                            setForm((prev) => ({ ...prev, unsurTerlibat: next }))
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
                        const next = [...form.unsurTerlibat]
                        next[i] = { ...next[i], jumlah: e.target.value }
                        setForm((prev) => ({ ...prev, unsurTerlibat: next }))
                      }}
                      placeholder="Jml"
                      className="w-20 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">org</span>
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, unsurTerlibat: prev.unsurTerlibat.filter((_, idx) => idx !== i) }))}
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
                onClick={() => setForm((prev) => ({ ...prev, unsurTerlibat: [...prev.unsurTerlibat, { kategori: "", jumlah: "" }] }))}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg px-3 py-2 transition w-full justify-center"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Unsur
              </button>
            </div>
          </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Detail Kasus</FieldLabel>
              <textarea
                value={form.rekomendasi}
                onChange={(e) => setForm((prev) => ({ ...prev, rekomendasi: e.target.value }))}
                placeholder="Tuliskan detail kasus..."
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

        <SectionCard icon={<CheckCircle className="w-4 h-4" />} title="Penanganan">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Status Pelanggaran</FieldLabel>
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
              <FieldLabel>Dokumentasi <span className="text-gray-400">(opsional)</span></FieldLabel>
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
