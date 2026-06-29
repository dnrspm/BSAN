"use client"
import { useState, useRef } from "react"
import {
  X,
  User,
  FileText,
  Upload,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Phone,
  Download,
  ChevronRight,
  ChevronLeft,
  Building2,
  Hash,
  Calendar,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ds/Button"
import { Plus } from "lucide-react"
import {
  MemberField,
  Members,
  RoleKey,
  PIMPINAN_ROLES,
  BIDANG_ROLES,
  emptyMember,
  PokjaData,
} from "@/types/pokja"

export interface FormPokjaProps {
  region: string
  onClose: () => void
  onSubmit: (data: PokjaData) => void
}

// ---------------------------------------------------------------------------
// Step config
// ---------------------------------------------------------------------------
const STEPS = [
  { number: 1, label: "Informasi Dasar" },
  { number: 2, label: "Susunan Pengurus" },
  { number: 3, label: "Dokumen SK" },
  { number: 4, label: "Tinjau Data" },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function MemberSection({
  label,
  value,
  onChange,
  bidangValue,
  bidangDisabled,
}: {
  label: string
  value: MemberField
  onChange: (field: keyof MemberField, val: string) => void
  bidangValue?: string
  bidangDisabled?: boolean
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <User className="w-3.5 h-3.5 text-blue-700" />
        </div>
        <span className="text-sm font-semibold text-gray-800">{label}</span>
      </div>
      <div className="p-4 space-y-4">
        {/* Row 1: Nama & Jenis Kelamin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Nama"
            required
            placeholder="Nama lengkap"
            value={value.nama}
            onChange={(v) => onChange("nama", v)}
          />
          {/* Jenis Kelamin */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">
              Jenis Kelamin <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={value.jenisKelamin}
                onChange={(e) => onChange("jenisKelamin", e.target.value)}
                className="w-full h-9 pl-3 pr-8 text-sm border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-700"
              >
                <option value="" disabled>Pilih jenis kelamin</option>
                <option value="Laki-Laki">Laki-Laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 2: Email & No WA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Email"
            required
            type="email"
            placeholder="nama@dinas.go.id"
            value={value.email}
            onChange={(v) => onChange("email", v)}
          />
          {/* No WA */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">
              Nomor HP <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="tel"
                inputMode="numeric"
                value={value.noWhatsapp}
                onChange={(e) => onChange("noWhatsapp", e.target.value.replace(/\D/g, ""))}
                placeholder="08xxxxxxxxxx"
                className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Instansi & Jabatan pada Instansi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Instansi"
            required
            placeholder="Nama instansi / lembaga"
            value={value.instansi}
            onChange={(v) => onChange("instansi", v)}
          />
          <InputField
            label="Jabatan pada Instansi"
            placeholder="Contoh: Kepala Bidang / Staff"
            value={value.jabatan}
            onChange={(v) => onChange("jabatan", v)}
          />
        </div>

        {/* Row 4: Bidang (if specified and disabled) */}
        {bidangValue !== undefined && (
          <InputField
            label="Bidang"
            required
            value={bidangValue}
            readOnly={bidangDisabled}
            onChange={() => {}}
          />
        )}
      </div>
    </div>
  )
}

function InputField({
  label,
  required,
  type = "text",
  placeholder,
  value,
  onChange,
  className,
  readOnly,
  icon,
}: {
  label: string
  required?: boolean
  type?: string
  placeholder?: string
  value: string
  onChange?: (v: string) => void
  className?: string
  readOnly?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label className="text-xs font-semibold text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-3.5 h-3.5">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-9 ${icon ? "pl-9" : "pl-3"} pr-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition
            ${readOnly ? "bg-gray-100 border-gray-200 text-gray-600 cursor-default" : "bg-white border-gray-300 text-gray-800"}`}
        />
      </div>
    </div>
  )
}

function FileUploadField({
  value,
  onChange,
  error,
}: {
  value: File | null
  onChange: (f: File | null) => void
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      alert("Hanya file PDF yang diperbolehkan.")
      return
    }
    if (f.size > 2 * 1024 * 1024) {
      alert("Ukuran file maksimal 2MB.")
      return
    }
    onChange(f)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">
        Unggah Dokumen SK <span className="text-red-500">*</span>
        <span className="ml-1 font-normal text-gray-400">(PDF, maks. 2MB)</span>
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer transition
          ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"}`}
      >
        <Upload className={`w-6 h-6 ${error ? "text-red-400" : "text-gray-400"}`} />
        {value ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-800 break-all">{value.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null) }}
              className="ml-1 text-gray-400 hover:text-red-500 transition"
              aria-label="Hapus file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 font-medium">Klik atau seret file PDF ke sini</p>
            <p className="text-xs text-gray-400">Format PDF, maksimal 2MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ""
        }}
      />
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 whitespace-nowrap overflow-hidden text-overflow-ellipsis">{value || "-"}</span>
    </div>
  )
}

function ReviewMemberCard({ label, member }: { label: string; member: MemberField }) {
  const isEmpty = !member.nama && !member.email && !member.noWhatsapp
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
        <User className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        {isEmpty && (
          <span className="ml-auto text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Belum diisi</span>
        )}
      </div>
      {!isEmpty && (
        <div className="px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
          <ReviewRow label="Nama" value={member.nama} />
          <ReviewRow label="Jenis Kelamin" value={member.jenisKelamin} />
          <ReviewRow label="Instansi" value={member.instansi} />
          <ReviewRow label="Jabatan pada Instansi" value={member.jabatan || "-"} />
          <ReviewRow label="Email" value={member.email} />
          <ReviewRow label="Nomor HP" value={member.noWhatsapp} />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Excel import helper (mock download)
// ---------------------------------------------------------------------------
function downloadTemplate() {
  const csv = [
    ["Nama", "Email", "Jenis Kelamin", "Nomor HP", "Instansi", "Jabatan pada Instansi"],
    ["", "", "Laki-Laki/Perempuan", "", "", ""],
    ["", "", "Laki-Laki/Perempuan", "", "", ""],
    ["", "", "Laki-Laki/Perempuan", "", "", ""],
    ["", "", "Laki-Laki/Perempuan", "", "", ""],
    ["", "", "Laki-Laki/Perempuan", "", "", ""],
    ["", "", "Laki-Laki/Perempuan", "", "", ""],
    ["", "", "Laki-Laki/Perempuan", "", "", ""],
    ["", "", "Laki-Laki/Perempuan", "", "", ""],
    ["", "", "Laki-Laki/Perempuan", "", "", ""],
  ]
    .map((r) => r.join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "template_pengurus_kelompok_kerja.csv"
  a.click()
  URL.revokeObjectURL(url)
}

function parseExcelCSV(text: string, setMembers: React.Dispatch<React.SetStateAction<Members>>) {
  const rows = text.trim().split("\n").slice(1) // skip header
  const keyMap: Record<number, RoleKey> = {
    0: "ketua",
    1: "wakil",
    2: "koordinator",
    3: "pendidikan",
    4: "pppa",
    5: "sosial",
    6: "kesehatan",
    7: "kominfo",
    8: "dukbangga",
  }

  const updates: Partial<Members> = {}
  rows.forEach((row, idx) => {
    if (idx >= 9) return
    const key = keyMap[idx]
    if (!key) return
    const cols = row.split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
    updates[key] = {
      nama: cols[0] ?? "",
      email: cols[1] ?? "",
      jenisKelamin: (cols[2] === "Laki-Laki" || cols[2] === "Perempuan" ? cols[2] : "") as MemberField["jenisKelamin"],
      noWhatsapp: (cols[3] ?? "").replace(/\D/g, ""),
      instansi: cols[4] ?? "",
      jabatan: cols[5] ?? "",
    }
  })

  setMembers((prev) => ({ ...prev, ...updates }))
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function FormPokja({ region, onClose, onSubmit }: FormPokjaProps) {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)

  // Step 1 state
  const [kanalPengaduan, setKanalPengaduan] = useState("")

  // Step 2 state
  const [members, setMembers] = useState<Members>({
    ketua: emptyMember(),
    wakil: emptyMember(),
    koordinator: emptyMember(),
    pendidikan: emptyMember(),
    pppa: emptyMember(),
    sosial: emptyMember(),
    kesehatan: emptyMember(),
    kominfo: emptyMember(),
    dukbangga: emptyMember(),
  })
  const [additionalCount, setAdditionalCount] = useState(0)
  const addAdditionalMember = () => setAdditionalCount(prev => prev + 1)
  const excelInputRef = useRef<HTMLInputElement>(null)

  // Step 3 state
  const [skFile, setSkFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState("")
  const [skDetail, setSkDetail] = useState({
    nomorSK: "",
    tanggalSK: "",
    periodeMulai: "",
    periodeSelesai: "",
  })

  const updateMember = (role: RoleKey, field: keyof MemberField, val: string) => {
    setMembers((prev) => ({ ...prev, [role]: { ...prev[role], [field]: val } }))
  }

  // Navigation
  const canGoNext = () => {
    if (step === 1) return kanalPengaduan.trim().length > 0
    if (step === 3) return skFile !== null && skDetail.nomorSK && skDetail.tanggalSK && skDetail.periodeMulai && skDetail.periodeSelesai
    return true
  }

  const handleNext = () => {
    if (step === 3 && !skFile) {
      setFileError("Dokumen SK wajib diunggah.")
      return
    }
    setFileError("")
    setStep((s) => Math.min(s + 1, 4))
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = () => {
    setSubmitted(true)
    const payload: PokjaData = {
      region,
      nomorKanal: kanalPengaduan,
      members,
      sk: {
        file: skFile,
        nomorSK: skDetail.nomorSK,
        tanggalSK: skDetail.tanggalSK,
        periodeMultai: skDetail.periodeMulai,
        periodeSelesai: skDetail.periodeSelesai,
      },
      consent: false,
    }
    setTimeout(() => onSubmit(payload), 1400)
  }

  // Success screen
  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Kelompok Kerja Berhasil Dikirim!</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Kelompok Kerja wilayah <strong>{region}</strong> sedang menunggu verifikasi dari tim kami.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Form Pembentukan Kelompok Kerja"
        className="relative z-10 flex flex-col w-full max-w-2xl h-screen bg-gray-50 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Pembentukan Kelompok Kerja</h2>
            <p className="text-xs text-gray-500 mt-0.5">Wilayah {region}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            aria-label="Tutup form"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => {
              const isActive = s.number === step
              const isDone = s.number < step
              return (
                <div key={s.number} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0
                        ${isDone ? "bg-blue-600 text-white" : isActive ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-gray-200 text-gray-500"}`}
                    >
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.number}
                    </div>
                    <span
                      className={`text-[10px] font-medium text-center leading-tight hidden sm:block ${isActive ? "text-blue-700" : isDone ? "text-blue-500" : "text-gray-400"}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-4 mx-1 rounded-full transition-all ${isDone ? "bg-blue-600" : "bg-gray-200"}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* STEP 1: Informasi Dasar */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Informasi Dasar</h3>
                <p className="text-xs text-gray-500 mt-0.5">Isi informasi umum Kelompok Kerja yang akan dibentuk.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                <InputField
label="Wilayah / Nama Kelompok Kerja"
                  value={region}
                  readOnly
                  icon={<Building2 className="w-3.5 h-3.5" />}
                  onChange={() => {}}
                />
                <p className="text-xs text-gray-400 -mt-2">Wilayah ditentukan secara otomatis dan tidak dapat diubah.</p>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">
                      Nomor Kanal Pengaduan &amp; Aspirasi <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={kanalPengaduan}
                        onChange={(e) => setKanalPengaduan(e.target.value.replace(/\D/g, ""))}
                        placeholder="Contoh: 08123456789"
                        className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-2">
                    <p className="text-xs font-medium text-blue-900">
                      ℹ️ Nomor ini akan menjadi <strong>call center utama</strong> untuk Pokja Anda
                    </p>
                    <ul className="text-xs text-blue-800 space-y-1 ml-3">
                      <li>• Pastikan nomor valid dan aktif 24/7</li>
                      <li>• Gunakan nomor WhatsApp yang terdaftar atas institusi</li>
                      <li>• Nomor ini akan dipublikasikan untuk pengaduan masyarakat</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Susunan Pengurus */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Susunan Pengurus</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Isi data setiap pengurus Pokja. Anda juga dapat menggunakan template Excel untuk mengisi data sekaligus.
                </p>
              </div>

              {/* Excel actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition border border-blue-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Contoh Excel
                </button>
                <button
                  type="button"
                  onClick={() => excelInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg transition border border-gray-300"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Unggah Data Excel
                </button>
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    const reader = new FileReader()
                    reader.onload = (ev) => {
                      const text = ev.target?.result as string
                      parseExcelCSV(text, setMembers)
                    }
                    reader.readAsText(f)
                    e.target.value = ""
                  }}
                />
              </div>

              {/* Pimpinan */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pimpinan Pokja</p>
                {PIMPINAN_ROLES.map((r) => (
                  <MemberSection
                    key={r.key}
                    label={r.label}
                    value={members[r.key]}
                    onChange={(field, val) => updateMember(r.key, field, val)}
                  />
                ))}
              </div>

              {/* Anggota per Bidang */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Anggota per Bidang</p>
                
                {/* 6 Anggota Wajib Bidang */}
                {console.log("[v0] Rendering Step 2 - 6 Anggota Wajib Bidang")}
                <MemberSection
                  key="pendidikan"
                  label="Anggota Wajib (Bidang Pendidikan)"
                  value={members.pendidikan}
                  onChange={(field, val) => updateMember("pendidikan", field, val)}
                  bidangValue="Pendidikan"
                  bidangDisabled={true}
                />
                <MemberSection
                  key="pppa"
                  label="Anggota Wajib (Bidang PPPA)"
                  value={members.pppa}
                  onChange={(field, val) => updateMember("pppa", field, val)}
                  bidangValue="PPPA"
                  bidangDisabled={true}
                />
                <MemberSection
                  key="sosial"
                  label="Anggota Wajib (Bidang Sosial)"
                  value={members.sosial}
                  onChange={(field, val) => updateMember("sosial", field, val)}
                  bidangValue="Sosial"
                  bidangDisabled={true}
                />
                <MemberSection
                  key="kesehatan"
                  label="Anggota Wajib (Bidang Kesehatan)"
                  value={members.kesehatan}
                  onChange={(field, val) => updateMember("kesehatan", field, val)}
                  bidangValue="Kesehatan"
                  bidangDisabled={true}
                />
                <MemberSection
                  key="dukbangga"
                  label="Anggota Wajib (Bidang Dukbangga)"
                  value={members.dukbangga}
                  onChange={(field, val) => updateMember("dukbangga", field, val)}
                  bidangValue="Dukbangga"
                  bidangDisabled={true}
                />
                <MemberSection
                  key="kominfo"
                  label="Anggota Wajib (Bidang Kominfo)"
                  value={members.kominfo}
                  onChange={(field, val) => updateMember("kominfo", field, val)}
                  bidangValue="Kominfo"
                  bidangDisabled={true}
                />

                {/* Anggota Lainnya (_opsional) */}
                {additionalCount > 0 && (
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest pt-2">Anggota Lainnya (Opsional)</p>
                )}
                {Array.from({ length: additionalCount }).map((_, idx) => {
                  const roleKey = `additional_${idx}` as RoleKey
                  return (
                    <MemberSection
                      key={roleKey}
                      label={`Anggota Lainnya ${idx + 1}`}
                      value={members[roleKey] || emptyMember()}
                      onChange={(field, val) => {
                        setMembers(prev => ({ ...prev, [roleKey]: { ...prev[roleKey] || emptyMember(), [field]: val } }))
                      }}
                    />
                  )
                })}
                {additionalCount < 3 && (
                  <button
                    type="button"
                    onClick={addAdditionalMember}
                    className="flex items-center justify-center gap-2 w-full py-2.5 mt-2 rounded-lg border-2 border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Anggota
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Dokumen SK */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Dokumen SK</h3>
                <p className="text-xs text-gray-500 mt-0.5">Unggah Surat Keputusan (SK) dan isi detail dokumennya.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
                <FileUploadField
                  value={skFile}
                  onChange={(f) => { setSkFile(f); if (f) setFileError("") }}
                  error={fileError}
                />
                <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">
                      Nomor SK <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={skDetail.nomorSK}
                        onChange={(e) => setSkDetail((p) => ({ ...p, nomorSK: e.target.value }))}
                        placeholder="Contoh: 123/SK/2024"
                        className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">
                      Tanggal SK <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        value={skDetail.tanggalSK}
                        onChange={(e) => setSkDetail((p) => ({ ...p, tanggalSK: e.target.value }))}
                        className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-700"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">
                      Tanggal Mulai <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        value={skDetail.periodeMulai}
                        onChange={(e) => setSkDetail((p) => ({ ...p, periodeMulai: e.target.value }))}
                        className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-700"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">
                      Tanggal Selesai <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        value={skDetail.periodeSelesai}
                        onChange={(e) => setSkDetail((p) => ({ ...p, periodeSelesai: e.target.value }))}
                        className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Tinjau Data</h3>
                <p className="text-xs text-gray-500 mt-0.5">Periksa kembali seluruh data sebelum mengirimkan.</p>
              </div>

              {/* Informasi Dasar */}
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Informasi Dasar</span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="ml-auto text-xs text-blue-600 hover:underline font-medium"
                  >
                    Ubah
                  </button>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-4">
                  <ReviewRow label="Wilayah / Nama Pokja" value={region} />
                  <ReviewRow label="Kanal Pengaduan & Aspirasi" value={kanalPengaduan} />
                </div>
              </div>

              {/* Susunan Pengurus */}
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Susunan Pengurus</span>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="ml-auto text-xs text-blue-600 hover:underline font-medium"
                  >
                    Ubah
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pimpinan</p>
                  {PIMPINAN_ROLES.map((r) => (
                    <ReviewMemberCard key={r.key} label={r.label} member={members[r.key]} />
                  ))}
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3 mb-1">Anggota per Bidang</p>
                  {BIDANG_ROLES.map((r) => (
                    <ReviewMemberCard key={r.key} label={r.label} member={members[r.key]} />
                  ))}
                </div>
              </div>

              {/* Dokumen SK */}
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Dokumen SK</span>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="ml-auto text-xs text-blue-600 hover:underline font-medium"
                  >
                    Ubah
                  </button>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-0.5 col-span-2">
                    <span className="text-xs text-gray-500">File SK</span>
                    <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                      {skFile ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          {skFile.name}
                        </>
                      ) : (
                        <span className="text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Belum diunggah
                        </span>
                      )}
                    </span>
                  </div>
                  <ReviewRow label="Nomor SK" value={skDetail.nomorSK} />
                  <ReviewRow label="Tanggal SK" value={skDetail.tanggalSK} />
                  <ReviewRow label="Tanggal Mulai" value={skDetail.periodeMulai} />
                  <ReviewRow label="Tanggal Selesai" value={skDetail.periodeSelesai} />
                </div>
              </div>

              <div className="h-2" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Footer Nav */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
          <div className="text-xs text-gray-400">
            Langkah <span className="font-semibold text-gray-700">{step}</span> dari {STEPS.length}
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext()}
                className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition
                  ${canGoNext()
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                Lanjut
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Eye className="w-4 h-4" />
                Submit
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
