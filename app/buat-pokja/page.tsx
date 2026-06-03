"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Wand2, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight,
  User, Upload, X, AlertCircle, Phone, Building2, Download, Eye, FileText, Plus, Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  MemberField, Members, RoleKey, PIMPINAN_ROLES, BIDANG_ROLES,
  emptyMember, PokjaData, PokjaDraft, AnggotaItem, emptyAnggota,
} from "@/types/pokja"
import { getDrafts, saveDraftToStorage, createDraftId, clearDraft } from "@/lib/draft-storage"

function formatDateForDraftName(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0")
  const m = (date.getMonth() + 1).toString().padStart(2, "0")
  const y = date.getFullYear()
  return `${d}-${m}-${y}`
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const REGION = "Provinsi Aceh"


// ---------------------------------------------------------------------------
// Dummy data generator
// ---------------------------------------------------------------------------
function makeDummyMember(nama: string, email: string, jenisKelamin: "Laki-Laki" | "Perempuan", instansi: string): MemberField {
  return { nama, email, jenisKelamin, noWhatsapp: "0812" + Math.floor(10000000 + Math.random() * 89999999), instansi }
}

const DUMMY_MEMBERS: Members = {
  ketua:       makeDummyMember("Dr. Hendra Kusuma, M.Pd", "hendra.kusuma@dinas-aceh.go.id", "Laki-Laki", "Dinas Pendidikan Provinsi Aceh"),
  wakil:       makeDummyMember("Siti Rahmawati, S.Pd", "siti.rahmawati@dinas-aceh.go.id", "Perempuan", "Dinas Pendidikan Provinsi Aceh"),
  koordinator: makeDummyMember("Ahmad Fauzi, M.Si", "ahmad.fauzi@dinas-aceh.go.id", "Laki-Laki", "Dinas Pendidikan Provinsi Aceh"),
  pendidikan:  makeDummyMember("Nurhayati, S.Pd", "nurhayati@dinas-aceh.go.id", "Perempuan", "Dinas Pendidikan Provinsi Aceh"),
  pppa:        makeDummyMember("Rina Andriani, M.Kes", "rina.andriani@p3a-aceh.go.id", "Perempuan", "Dinas Pemberdayaan Perempuan Provinsi Aceh"),
  sosial:      makeDummyMember("Budi Santoso, S.Sos", "budi.santoso@dinsos-aceh.go.id", "Laki-Laki", "Dinas Sosial Provinsi Aceh"),
  kesehatan:   makeDummyMember("dr. Fitri Yanti", "fitri.yanti@dinkes-aceh.go.id", "Perempuan", "Dinas Kesehatan Provinsi Aceh"),
  kominfo:     makeDummyMember("Rizal Mahendra, S.Kom", "rizal.mahendra@kominfo-aceh.go.id", "Laki-Laki", "Dinas Kominfo Provinsi Aceh"),
  dukbangga:   makeDummyMember("Yuli Astuti, S.E", "yuli.astuti@dukcapil-aceh.go.id", "Perempuan", "Dinas Kependudukan Provinsi Aceh"),
}

const DUMMY_SK = {
  nomorSK: "421/2345/SK/2025",
  tanggalSK: "2025-01-15",
  periodeMulai: "2025-01-15",
  periodeSelesai: "2027-01-14",
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function InputField({
  label, required = false, type = "text", placeholder, value, onChange, hasError = false,
}: {
  label: string; required?: boolean; type?: string; placeholder?: string
  value: string; onChange: (v: string) => void; hasError?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-9 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
          hasError ? "border-red-400 bg-red-50" : "border-gray-300"
        )}
      />
    </div>
  )
}

function MemberSection({ label, value, onChange, isCollapsed, onToggleCollapse, showErrors = false }: {
  label: string; value: MemberField
  onChange: (field: keyof MemberField, val: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  showErrors?: boolean
}) {
  const hasErr = showErrors && !(value.nama && value.email && value.noWhatsapp && value.jenisKelamin && value.instansi)
  return (
    <div className={cn("rounded-xl border bg-white overflow-hidden", hasErr ? "border-red-300" : "border-gray-200")}>
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gapx-4 mt-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-blue-700" />
          </div>
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          {hasErr && isCollapsed && (
            <span className="text-xs font-medium text-red-500">Ada field yang belum diisi</span>
          )}
        </div>
        {onToggleCollapse && (
          <div className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition">
            {isCollapsed ? <ChevronDown className="w-4 h-4 rotate-180" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        )}
      </div>
      {!isCollapsed && (
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InputField label="Nama" required placeholder="Nama lengkap" value={value.nama} onChange={(v) => onChange("nama", v)} hasError={showErrors && !value.nama} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Jenis Kelamin <span className="text-red-500">*</span></label>
          <div className="relative">
            <select
              value={value.jenisKelamin}
              onChange={(e) => onChange("jenisKelamin", e.target.value)}
              className={cn(
                "w-full h-9 pl-3 pr-8 text-sm border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-700",
                showErrors && !value.jenisKelamin ? "border-red-400 bg-red-50" : "border-gray-300"
              )}
            >
              <option value="" disabled>Pilih jenis kelamin</option>
              <option value="Laki-Laki">Laki-Laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <InputField label="Instansi" required placeholder="Nama instansi" value={value.instansi} onChange={(v) => onChange("instansi", v)} hasError={showErrors && !value.instansi} />
        <InputField label="Jabatan pada Instansi" placeholder="Contoh: Kepala Bidang, Staff, dll" value={value.jabatan ?? ""} onChange={(v) => onChange("jabatan", v)} />
        <InputField label="Email" required type="email" placeholder="nama@dinas.go.id" value={value.email} onChange={(v) => onChange("email", v)} hasError={showErrors && !value.email} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Nomor HP <span className="text-red-500">*</span></label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="tel" inputMode="numeric" value={value.noWhatsapp}
              onChange={(e) => onChange("noWhatsapp", e.target.value.replace(/\D/g, ""))}
              placeholder="08xxxxxxxxxx"
              className={cn(
                "w-full h-9 pl-9 pr-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
                showErrors && !value.noWhatsapp ? "border-red-400 bg-red-50" : "border-gray-300"
              )}
            />
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

// MemberSection with disabled bidang field for mandatory members
function MandatoryMemberSection({ label, value, onChange, bidangValue, isCollapsed, onToggleCollapse, showErrors = false }: {
  label: string; value: MemberField
  onChange: (field: keyof MemberField, val: string) => void
  bidangValue: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  showErrors?: boolean
}) {
  const hasErr = showErrors && !(value.nama && value.email && value.noWhatsapp && value.jenisKelamin && value.instansi)
  return (
    <div className={cn("rounded-xl border bg-white overflow-hidden", hasErr ? "border-red-300" : "border-gray-200")}>
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gapx-4 mt-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-blue-700" />
          </div>
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          {hasErr && isCollapsed && (
            <span className="text-xs font-medium text-red-500">Ada field yang belum diisi</span>
          )}
        </div>
        {onToggleCollapse && (
          <div className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition">
            {isCollapsed ? <ChevronDown className="w-4 h-4 rotate-180" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        )}
      </div>
      {!isCollapsed && (
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InputField label="Nama" required placeholder="Nama lengkap" value={value.nama} onChange={(v) => onChange("nama", v)} hasError={showErrors && !value.nama} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Jenis Kelamin <span className="text-red-500">*</span></label>
          <div className="relative">
            <select
              value={value.jenisKelamin}
              onChange={(e) => onChange("jenisKelamin", e.target.value)}
              className={cn(
                "w-full h-9 pl-3 pr-8 text-sm border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-700",
                showErrors && !value.jenisKelamin ? "border-red-400 bg-red-50" : "border-gray-300"
              )}
            >
              <option value="" disabled>Pilih jenis kelamin</option>
              <option value="Laki-Laki">Laki-Laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <InputField label="Instansi" required placeholder="Nama instansi" value={value.instansi} onChange={(v) => onChange("instansi", v)} hasError={showErrors && !value.instansi} />
        <InputField label="Jabatan pada Instansi" placeholder="Contoh: Kepala Bidang, Staff, dll" value={value.jabatan ?? ""} onChange={(v) => onChange("jabatan", v)} />
        <InputField label="Email" required type="email" placeholder="nama@dinas.go.id" value={value.email} onChange={(v) => onChange("email", v)} hasError={showErrors && !value.email} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Nomor HP <span className="text-red-500">*</span></label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="tel" inputMode="numeric" value={value.noWhatsapp}
              onChange={(e) => onChange("noWhatsapp", e.target.value.replace(/\D/g, ""))}
              placeholder="08xxxxxxxxxx"
              className={cn(
                "w-full h-9 pl-9 pr-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
                showErrors && !value.noWhatsapp ? "border-red-400 bg-red-50" : "border-gray-300"
              )}
            />
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

function ReviewTableRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="pr-3 text-gray-400 whitespace-nowrap align-top text-sm">{label}</td>
      <td className="px-2 text-gray-400 align-top">:</td>
      <td className="font-medium text-gray-800 text-sm">{value || "-"}</td>
    </tr>
  )
}

function EmailCell({ email }: { email: string }) {
  if (!email || email === "-") return <span>{email || "-"}</span>
  const atIdx = email.indexOf("@")
  if (atIdx === -1) return <span className="break-words">{email}</span>
  return (
    <span className="break-words">
      {email.slice(0, atIdx)}<br />{email.slice(atIdx)}
    </span>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gapx-4 mt-2 mb-4.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">
        {label.toLowerCase() === "email" ? <EmailCell email={value || "-"} /> : (value || "-")}
      </span>
    </div>
  )
}

function ReviewMemberCard({ label, member }: { label: string; member: MemberField }) {
  const isEmpty = !member.nama && !member.email && !member.noWhatsapp
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center gapx-4 mt-2 mb-4">
        <User className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        {isEmpty && (
          <span className="ml-auto text-xs text-amber-600 bg-amber-50 px-2 mt-2 mb-4.5 rounded-full">Belum diisi</span>
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

function isMemberComplete(m: MemberField): boolean {
  return !!(m.nama && m.email && m.jenisKelamin && m.noWhatsapp && m.instansi)
}

function isAnggotaComplete(a: AnggotaItem): boolean {
  return !!(a.nama && a.email && a.jenisKelamin && a.noWhatsapp && a.instansi)
}

function getMemberStatus(m: MemberField): string {
  const hasName = !!m.nama
  if (!hasName) return "Belum diisi"
  return isMemberComplete(m) ? "Lengkap" : "Tidak Lengkap"
}

function getAnggotaStatus(a: AnggotaItem): string {
  const hasName = !!a.nama
  if (!hasName) return "Belum diisi"
  return isAnggotaComplete(a) ? "Lengkap" : "Tidak Lengkap"
}

function ReviewTable({ members, anggotaList, onEdit, onDelete, onResetMember }: { members: Members; anggotaList: AnggotaItem[]; onEdit: (segment: string) => void; onDelete?: (idx: number) => void; onResetMember?: (kategori: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => setIsScrolled(el.scrollLeft > 0)
    el.addEventListener("scroll", handleScroll, { passive: true })
    return () => el.removeEventListener("scroll", handleScroll)
  }, [])

  const allData: { no: number; kategori: string; nama: string; jenisKelamin: string; instansi: string; email: string; noHp: string; status: string; isCategory: boolean; deleteIdx?: number; roleKey?: string; jabatan: string; sectionKey?: string }[] = []
  
  let no = 1
  
  allData.push({ no: 0, kategori: "PIMPINAN", nama: "", jenisKelamin: "", instansi: "", email: "", noHp: "", status: "", isCategory: true, jabatan: "", sectionKey: "pimpinan" })
  PIMPINAN_ROLES.forEach((r) => {
    const m = members[r.key]
    allData.push({
      no: no++,
      kategori: r.label,
      nama: m.nama || "-",
      jenisKelamin: m.jenisKelamin || "-",
      instansi: m.instansi || "-",
      email: m.email || "-",
      noHp: m.noWhatsapp || "-",
      status: getMemberStatus(m),
      isCategory: false,
      roleKey: r.key,
      jabatan: m.jabatan || "-",
      sectionKey: "pimpinan"
    })
  })

  const bidangWithExtra: { key: string; label: string }[] = BIDANG_ROLES.map(r => ({ key: r.key, label: r.label }))
  bidangWithExtra.forEach((b) => {
    allData.push({ no: 0, kategori: b.label.toUpperCase(), nama: "", jenisKelamin: "", instansi: "", email: "", noHp: "", status: "", isCategory: true, jabatan: "", sectionKey: b.key })
    const m = members[b.key as keyof Members]
    allData.push({
      no: no++,
      kategori: "Anggota",
      nama: m.nama || "-",
      jenisKelamin: m.jenisKelamin || "-",
      instansi: m.instansi || "-",
      email: m.email || "-",
      noHp: m.noWhatsapp || "-",
      status: getMemberStatus(m),
      isCategory: false,
      roleKey: b.key,
      jabatan: m.jabatan || "-",
      sectionKey: b.key
    })
    
    anggotaList.forEach((a, origIdx) => {
      if (a.bidang === b.label) {
        allData.push({
          no: no++,
          kategori: "Anggota",
          nama: a.nama,
          jenisKelamin: a.jenisKelamin || "-",
          instansi: a.instansi || "-",
          email: a.email || "-",
          noHp: a.noWhatsapp || "-",
          status: getAnggotaStatus(a),
          isCategory: false,
          deleteIdx: origIdx,
          jabatan: a.jabatan || "-",
          sectionKey: `anggotaIndex:${origIdx}`
        })
      }
    })
  })

  const lainnya = anggotaList.filter(a => a.bidang === "Lainnya (Tokoh Masyarakat, Akademisi, Kepolisian, dan sebagainya..)" || a.bidang === "Lainnya" || !BIDANG_ROLES.some(b => b.label === a.bidang))
  if ( lainnya.length > 0) {
    allData.push({ no: 0, kategori: "LAINNYA", nama: "", jenisKelamin: "", instansi: "", email: "", noHp: "", status: "", isCategory: true, jabatan: "", sectionKey: "lainnya" })
    lainnya.forEach((a) => {
      const origIdx = anggotaList.indexOf(a)
      allData.push({
        no: no++,
        kategori: "Anggota",
        nama: a.nama,
        jenisKelamin: a.jenisKelamin || "-",
        instansi: a.instansi || "-",
        email: a.email || "-",
        noHp: a.noWhatsapp || "-",
        status: getAnggotaStatus(a),
        isCategory: false,
        deleteIdx: origIdx,
        jabatan: a.jabatan || "-",
        sectionKey: `anggotaIndex:${origIdx}`
      })
    })
  }

  // Gradient overlay di dalam sticky cell — extend ke kanan melewati batas sel
  // Harus berupa React element (bukan ::after CSS) agar z-index sticky cell berlaku
  const Cue = () => (
    <div
      aria-hidden
      className="absolute inset-y-0 left-full w-10 pointer-events-none bg-gradient-to-r from-gray-900/10 to-transparent transition-opacity duration-200"
      style={{ opacity: isScrolled ? 1 : 0 }}
    />
  )

  return (
    <div ref={scrollRef} className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-10 px-2 py-3 text-center font-semibold text-gray-500 whitespace-nowrap bg-gray-50 sticky left-0 z-20 border-b border-gray-200">No</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap bg-gray-50 border-b border-gray-200 sticky z-20" style={{ left: "2.5rem" }}>
              Nama *
              <Cue />
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap bg-gray-50 border-b border-gray-200">Jabatan Kelompok Kerja *</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200">Jenis Kelamin *</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200">Instansi *</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200">Jabatan Instansi *</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200">Email *</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200">No. HP *</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {allData.map((row, idx) => {
            const isCategoryRow = row.isCategory
            if (isCategoryRow) {
              return (
                <tr key={idx} className="bg-gray-50">
                  <td colSpan={2} className="px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50 sticky left-0 z-20 border-b border-gray-100 min-w-[280px]">
                    {row.kategori}
                    <Cue />
                  </td>
                  <td colSpan={8} className="px-4 py-2 bg-gray-50 border-b border-gray-100"></td>
                </tr>
              )
            }
            return (
              <tr key={idx} className={cn("hover:bg-blue-50/30", (row.status === "Belum diisi" || row.status === "Tidak Lengkap") && "bg-red-50")}>
                <td
                  colSpan={2}
                  className={cn(
                    "whitespace-nowrap sticky left-0 z-20 border-b border-gray-100",
                    (row.status === "Belum diisi" || row.status === "Tidak Lengkap") ? "bg-red-50" : "bg-white"
                  )}
                >
                  <div className="flex items-center py-3">
                    <span className={cn("w-10 px-2 text-center text-xs flex-shrink-0", (row.status === "Belum diisi" || row.status === "Tidak Lengkap") ? "text-red-400" : "text-gray-400")}>
                      {row.no}
                    </span>
                    <span className={cn("pl-4 pr-10 font-medium", (row.status === "Belum diisi" || row.status === "Tidak Lengkap") ? "text-red-700" : "text-gray-900")}>
                      {row.nama}
                    </span>
                  </div>
                  <Cue />
                </td>
                <td className={cn("px-4 py-3 whitespace-nowrap border-b border-gray-100", (row.status === "Belum diisi" || row.status === "Tidak Lengkap") ? "text-red-600 bg-red-50" : "text-gray-500 bg-white")}>{row.kategori}</td>
                <td className={cn("px-4 py-3 whitespace-nowrap border-b border-gray-100", (row.status === "Belum diisi" || row.status === "Tidak Lengkap") ? "text-red-600 bg-red-50" : "text-gray-500 bg-white")}>{row.jenisKelamin}</td>
                <td className={cn("px-4 py-3 whitespace-nowrap border-b border-gray-100", (row.status === "Belum diisi" || row.status === "Tidak Lengkap") ? "text-red-600 bg-red-50" : "text-gray-500 bg-white")}>{row.instansi}</td>
                <td className={cn("px-4 py-3 whitespace-nowrap border-b border-gray-100", (row.status === "Belum diisi" || row.status === "Tidak Lengkap") ? "text-red-600 bg-red-50" : "text-gray-500 bg-white")}>{row.jabatan}</td>
                <td className={cn("px-4 py-3 whitespace-nowrap border-b border-gray-100", (row.status === "Belum diisi" || row.status === "Tidak Lengkap") ? "text-red-600 bg-red-50" : "text-gray-500 bg-white")}><EmailCell email={row.email} /></td>
                <td className={cn("px-4 py-3 whitespace-nowrap border-b border-gray-100", (row.status === "Belum diisi" || row.status === "Tidak Lengkap") ? "text-red-600 bg-red-50" : "text-gray-500 bg-white")}>{row.noHp}</td>
                <td className={cn("px-4 py-3 whitespace-nowrap border-b border-gray-100", (row.status === "Belum diisi" || row.status === "Tidak Lengkap") ? "bg-red-50" : "bg-white")}>
                  {row.status && (
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      row.status === "Lengkap" ? "bg-green-50 text-green-700" :
                      row.status === "Tidak Lengkap" ? "bg-red-100 text-red-600" :
                      "bg-amber-50 text-amber-600"
                    )}>
                      {row.status}
                    </span>
                  )}
                </td>
                <td className={cn("px-4 py-3 whitespace-nowrap border-b border-gray-100", (row.status === "Belum diisi" || row.status === "Tidak Lengkap") ? "bg-red-50" : "bg-white")}>
                  <div className="flex items-center gapx-4 mt-2 mb-4">
                    {!row.isCategory && (
                      <button 
                        onClick={() => {
                          if (row.deleteIdx !== undefined) {
                            onEdit(`anggotaIndex:${row.deleteIdx}`)
                          } else if (row.roleKey) {
                            onEdit(row.roleKey)
                          }
                        }} 
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Ubah
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={() => {
                          if (row.deleteIdx !== undefined) {
                            onDelete(row.deleteIdx)
                          } else if (!row.isCategory && row.nama && row.nama !== "-" && row.roleKey) {
                            onResetMember(row.roleKey)
                          }
                        }} 
                        className="text-xs text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ReviewAccordion({ members, anggotaList }: { members: Members; anggotaList: AnggotaItem[] }) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set())
  const toggle = (key: string) => setOpenKeys((prev) => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  const MemberRow = ({ rowKey, label, m, purple = false, variant = "default" }: { rowKey: string; label: string; m: MemberField; purple?: boolean; variant?: "default" | "kecil" | "compact" }) => {
    const isOpen = openKeys.has(rowKey)
    return (
      <div>
<button type="button" className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left" onClick={() => toggle(rowKey)}>
          <div className="flex items-center gap-3">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0", purple ? "bg-purple-100" : "bg-blue-100")}>
              <User className={cn("w-3 h-3", purple ? "text-purple-700" : "text-blue-700")} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">{label}</p>
              <p className="text-sm font-medium text-gray-800">{m.nama || <span className="text-gray-400 italic">Belum diisi</span>}</p>
            </div>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-gray-400 flex-shrink-0 transition", isOpen && "rotate-180")} />
        </button>
        {isOpen && (
          <div className="pl-[52px] pr-4 bg-white -mt-1">
            {variant === "compact" ? (
              <div className="px-4 mt-2 mb-4 border-l-2 border-blue-300">
                <table className="text-sm">
                  <tbody>
                    <tr>
                      <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Jenis Kelamin</td>
                      <td className="px-2 text-gray-400 align-top">:</td>
                      <td className="font-medium text-gray-800">{m.jenisKelamin || "-"}</td>
                    </tr>
                    <tr>
                      <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Instansi</td>
                      <td className="px-2 text-gray-400 align-top">:</td>
                      <td className="font-medium text-gray-800">{m.instansi || "-"}</td>
                    </tr>
                    <tr>
                      <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Jabatan pada Instansi</td>
                      <td className="px-2 text-gray-400 align-top">:</td>
                      <td className="font-medium text-gray-800">{m.jabatan || "-"}</td>
                    </tr>
                    <tr>
                      <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Email</td>
                      <td className="px-2 text-gray-400 align-top">:</td>
                      <td className="font-medium text-gray-800 whitespace-nowrap">{m.email || "-"}</td>
                    </tr>
                    <tr>
                      <td className="pr-3 text-gray-400 whitespace-nowrap align-top">No. HP</td>
                      <td className="px-2 text-gray-400 align-top">:</td>
                      <td className="font-medium text-gray-800">{m.noWhatsapp || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : variant === "kecil" ? (
              <div className="px-4 mt-2 mb-4 border-l-2 border-blue-300">
                <table className="text-sm">
                  <tbody>
                    <tr>
                      <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Jenis Kelamin</td>
                      <td className="px-2 text-gray-400 align-top">:</td>
                      <td className="font-medium text-gray-800">{m.jenisKelamin || "-"}</td>
                    </tr>
                    <tr>
                      <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Instansi</td>
                      <td className="px-2 text-gray-400 align-top">:</td>
                      <td className="font-medium text-gray-800">{m.instansi || "-"}</td>
                    </tr>
                    <tr>
                      <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Jabatan pada Instansi</td>
                      <td className="px-2 text-gray-400 align-top">:</td>
                      <td className="font-medium text-gray-800">{m.jabatan || "-"}</td>
                    </tr>
                    <tr>
                      <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Email</td>
                      <td className="px-2 text-gray-400 align-top">:</td>
                      <td className="font-medium text-gray-800 whitespace-nowrap">{m.email || "-"}</td>
                    </tr>
                    <tr>
                      <td className="pr-3 text-gray-400 whitespace-nowrap align-top">No. HP</td>
                      <td className="px-2 text-gray-400 align-top">:</td>
                      <td className="font-medium text-gray-800">{m.noWhatsapp || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 mt-2 mb-4 border-l-2 border-blue-300">
                <table className="text-sm">
                  <tbody>
                    <tr>
                      <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Jenis Kelamin</td>
                      <td className="px-2 text-gray-400 align-top">:</td>
                      <td className="font-medium text-gray-800">{m.jenisKelamin || "-"}</td>
                    </tr>
                    <tr>
                      <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Instansi</td>
                      <td className="px-2 text-gray-400 align-top">:</td>
                      <td className="font-medium text-gray-800">{m.instansi || "-"}</td>
                    </tr>
                    <tr>
                      <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Jabatan pada Instansi</td>
                      <td className="px-2 text-gray-400 align-top">:</td>
                      <td className="font-medium text-gray-800">{m.jabatan || "-"}</td>
                    </tr>
                    <tr>
                      <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Email</td>
                      <td className="px-2 text-gray-400 align-top">:</td>
                      <td className="font-medium text-gray-800 whitespace-nowrap">{m.email || "-"}</td>
                    </tr>
                    <tr>
                      <td className="pr-3 text-gray-400 whitespace-nowrap align-top">No. HP</td>
                      <td className="px-2 text-gray-400 align-top">:</td>
                      <td className="font-medium text-gray-800">{m.noWhatsapp || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

const AnggotaRow = ({ a, rowKey, label }: { a: AnggotaItem; rowKey: string; label: string }) => {
    const isOpen = openKeys.has(rowKey)
    return (
      <div>
<button type="button" className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left" onClick={() => toggle(rowKey)}>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-purple-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">{label}</p>
              <p className="text-sm font-medium text-gray-800">{a.nama || <span className="text-gray-400 italic">Belum diisi</span>}</p>
            </div>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-gray-400 flex-shrink-0 transition", isOpen && "rotate-180")} />
        </button>
        {isOpen && (
          <div className="pl-[52px] pr-4 bg-white -mt-1">
            <div className="px-4 mt-2 mb-4 border-l-2 border-purple-300">
              <table className="text-sm">
                <tbody>
                  <tr>
                    <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Jenis Kelamin</td>
                    <td className="px-2 text-gray-400 align-top">:</td>
                    <td className="font-medium text-gray-800">{a.jenisKelamin || "-"}</td>
                  </tr>
                  <tr>
                    <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Instansi</td>
                    <td className="px-2 text-gray-400 align-top">:</td>
                    <td className="font-medium text-gray-800">{a.instansi || "-"}</td>
                  </tr>
                  <tr>
                    <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Jabatan pada Instansi</td>
                    <td className="px-2 text-gray-400 align-top">:</td>
                    <td className="font-medium text-gray-800">{a.jabatan || "-"}</td>
                  </tr>
                  <tr>
                    <td className="pr-3 text-gray-400 whitespace-nowrap align-top">Email</td>
                    <td className="px-2 text-gray-400 align-top">:</td>
                    <td className="font-medium text-gray-800 whitespace-nowrap">{a.email || "-"}</td>
                  </tr>
                  <tr>
                    <td className="pr-3 text-gray-400 whitespace-nowrap align-top">No. HP</td>
                    <td className="px-2 text-gray-400 align-top">:</td>
                    <td className="font-medium text-gray-800">{a.noWhatsapp || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
    </div>
  )

  const SubHeader = ({ title }: { title: string }) => (
    <div className="px-4 py-1.5 bg-gray-50 border-t border-b border-gray-100">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">{title}</p>
    </div>
  )

  const lainnyaAnggota = anggotaList.filter(a => !BIDANG_ROLES.some(r => r.label === a.bidang))
  let counter = 0

  return (
    <div className="flex flex-col gap-4 mt-2 mb-4">
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <SectionHeader title="Pimpinan" />
        <div className="divide-y divide-gray-200">
          {PIMPINAN_ROLES.map((r, i) => <MemberRow key={r.key} rowKey={r.key} label={r.label} m={members[r.key]} variant={i === 0 ? "default" : i === 1 ? "kecil" : "compact"} />)}
        </div>
      </div>

      {BIDANG_ROLES.map(r => {
        const extras = anggotaList.filter(a => a.bidang === r.label)
        return (
          <div key={r.key} className="rounded-xl border border-gray-200 overflow-hidden">
            <SectionHeader title={r.label} />
            <div className="divide-y divide-gray-200">
              <MemberRow rowKey={r.key} label="Koordinator Bidang" m={members[r.key]} />
              {extras.map((a, bidangIdx) => {
                counter++
                return <AnggotaRow key={anggotaList.indexOf(a)} a={a} rowKey={`anggota-${anggotaList.indexOf(a)}`} label={`Anggota Bidang ${bidangIdx + 1}`} />
              })}
            </div>
          </div>
        )
      })}

      {lainnyaAnggota.length > 0 && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <SectionHeader title="Lainnya" />
          <div className="divide-y divide-gray-200">
            {lainnyaAnggota.map(a => {
              counter++
              return <AnggotaRow key={anggotaList.indexOf(a)} a={a} rowKey={`anggota-${anggotaList.indexOf(a)}`} label={`Anggota Lainnya ${counter} · ${a.bidang || "-"}`} />
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function FileUploadField({ value, onChange, error }: { value: File | null; onChange: (f: File | null) => void; error?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") { alert("Hanya file PDF yang diizinkan."); return }
    if (f.size > 2 * 1024 * 1024) { alert("Ukuran file melebihi 2MB."); return }
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
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        className={cn(
          "flex flex-col items-center justify-center gapx-4 mt-2 mb-4 border-2 border-dashed rounded-xl p-8 cursor-pointer transition",
          error ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
        )}
      >
        <Upload className={cn("w-6 h-6", error ? "text-red-400" : "text-gray-400")} />
        {value ? (
          <div className="flex items-center gapx-4 mt-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-800 break-all">{value.name}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null) }} className="ml-1 text-gray-400 hover:text-red-500 transition" aria-label="Hapus file">
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
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }}
      />
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Excel helper
// ---------------------------------------------------------------------------
function downloadTemplate() {
  const csv = [
    ["Jabatan pada Instansi", "Nama", "Email", "Jenis Kelamin", "Nomor HP", "Instansi"],
    ...([...PIMPINAN_ROLES, ...BIDANG_ROLES].map((r) => [r.label, "", "", "Laki-Laki/Perempuan", "", ""])),
  ].map((r) => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = "template_pengurus_kelompok_kerja.csv"; a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function BuatPokjaPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [flowSteps, setFlowSteps] = useState<3 | 4>(3)
  const STEPS = flowSteps === 3
    ? [
        { number: 1, label: "Informasi & Dokumen SK" },
        { number: 2, label: "Susunan Pengurus" },
        { number: 3, label: "Tinjau Data" },
      ]
    : [
        { number: 1, label: "Informasi Dasar" },
        { number: 2, label: "Susunan Pengurus" },
        { number: 3, label: "Dokumen SK" },
        { number: 4, label: "Tinjau Data" },
      ]
  const [submitted, setSubmitted] = useState(false)
  const [isPerbaikanMode, setIsPerbaikanMode] = useState(false)
  const [deskripsiPerbaikan, setDeskripsiPerbaikan] = useState("")

  // Step 1
  const [kanalPengaduan, setKanalPengaduan] = useState("")

  // Step 2 – pimpinan
  const [members, setMembers] = useState<Members>(() => ({
    ketua: emptyMember(), wakil: emptyMember(), koordinator: emptyMember(),
    pendidikan: emptyMember(), pppa: emptyMember(), sosial: emptyMember(),
    kesehatan: emptyMember(), kominfo: emptyMember(), dukbangga: emptyMember(),
  }))

  // Step 2 – anggota tambahan (opsional)
  const [anggotaList, setAnggotaList] = useState<AnggotaItem[]>([])
  const [collapsedAnggota, setCollapsedAnggota] = useState<Set<number>>(new Set())

  const updateAnggota = (index: number, field: keyof AnggotaItem, val: string) => {
    setAnggotaList((prev) => prev.map((a, i) => i === index ? { ...a, [field]: val } : a))
  }
  const addAnggota = () => setAnggotaList((prev) => [...prev, emptyAnggota()])
  const removeAnggota = (index: number) => {
    setAnggotaList((prev) => prev.filter((_, i) => i !== index))
    setCollapsedAnggota((prev) => { const s = new Set(prev); s.delete(index); return s })
  }
  const toggleCollapse = (index: number) => {
    setCollapsedAnggota((prev) => {
      const s = new Set(prev)
      if (s.has(index)) s.delete(index)
      else s.add(index)
      return s
    })
  }

  // Collapse state for pimpinan and anggota wajib
  const [collapsedPimpinan, setCollapsedPimpinan] = useState<Set<string>>(new Set())
  const [collapsedBidang, setCollapsedBidang] = useState<Set<string>>(new Set())

  const toggleCollapsePimpinan = (key: string) => {
    setCollapsedPimpinan((prev) => {
      const s = new Set(prev)
      if (s.has(key)) s.delete(key)
      else s.add(key)
      return s
    })
  }

  const toggleCollapseBidang = (key: string) => {
    setCollapsedBidang((prev) => {
      const s = new Set(prev)
      if (s.has(key)) s.delete(key)
      else s.add(key)
      return s
    })
  }

  // Collapse all in step 2
  const [collapseAllStep2, setCollapseAllStep2] = useState(false)

  const toggleCollapseAllStep2 = () => {
    const newState = !collapseAllStep2
    setCollapseAllStep2(newState)
    if (newState) {
      setCollapsedPimpinan(new Set(PIMPINAN_ROLES.map(r => r.key)))
      setCollapsedBidang(new Set(["pendidikan", "pppa", "sosial", "kesehatan", "dukbangga", "kominfo"]))
      setCollapsedAnggota(new Set(anggotaList.map((_, i) => i)))
    } else {
      setCollapsedPimpinan(new Set())
      setCollapsedBidang(new Set())
      setCollapsedAnggota(new Set())
    }
  }

  const [step2Errors, setStep2Errors] = useState(false)
  const isRoleComplete = (m: MemberField) => !!(m.nama && m.email && m.noWhatsapp && m.jenisKelamin && m.instansi)

  // Fungsi untuk navigasi ke Step 2 dengan target segmen tertentu
  const goToStep2WithSegment = (segment: string) => {
    // Tutup semua dulu
    setCollapsedPimpinan(new Set(PIMPINAN_ROLES.map(r => r.key)))
    setCollapsedBidang(new Set(["pendidikan", "pppa", "sosial", "kesehatan", "dukbangga", "kominfo"]))
    setCollapsedAnggota(new Set(anggotaList.map((_, i) => i)))

    // Expand segmen target saja
    // PIMPINAN roles (ketua, wakil, koordinator) - expand pimpinan section
    if (PIMPINAN_ROLES.some(r => r.key === segment)) {
      const newCollapsedPimpinan = new Set(PIMPINAN_ROLES.map(r => r.key))
      newCollapsedPimpinan.delete(segment)
      setCollapsedPimpinan(newCollapsedPimpinan)
    } else if (["pendidikan", "pppa", "sosial", "kesehatan", "dukbangga", "kominfo"].includes(segment)) {
      const newCollapsedBidang = new Set(["pendidikan", "pppa", "sosial", "kesehatan", "dukbangga", "kominfo"])
      newCollapsedBidang.delete(segment)
      setCollapsedBidang(newCollapsedBidang)
    } else if (segment.startsWith("anggotaIndex:")) {
      const idx = parseInt(segment.replace("anggotaIndex:", ""), 10)
      const newCollapsedAnggota = new Set(anggotaList.map((_, i) => i))
      newCollapsedAnggota.delete(idx)
      setCollapsedAnggota(newCollapsedAnggota)
    }

    setStep(2)
  }

  // Step 3
  const [skFile, setSkFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState("")
  const [skDetail, setSkDetail] = useState({ nomorSK: "", tanggalSK: "", periodeMulai: "", periodeSelesai: "" })

  // ---------------------------------------------------------------------------
  // Draft state
  // ---------------------------------------------------------------------------
  const [draftId, setDraftId] = useState<string | null>(null)
  const [isDraftMode, setIsDraftMode] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [showSavedToast, setShowSavedToast] = useState(false)

  // ---------------------------------------------------------------------------
  // Mount: baca perbaikanPokjaData dari sessionStorage untuk mode perbaikan & load draft
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const loadDraftId = params.get("draftId")

    // Load draft mode - hanya satu draft
    if (loadDraftId === "draft_ongoing" || loadDraftId) {
      const draft = getDrafts()
      if (draft) {
        setDraftId(draft.id)
        setIsDraftMode(true)
        setKanalPengaduan(draft.kanalPengaduan)
        setMembers(draft.members)
        setAnggotaList(draft.anggotaList || [])
        setSkDetail({
          nomorSK: draft.sk.nomorSK,
          tanggalSK: draft.sk.tanggalSK,
          periodeMulai: draft.sk.periodeMulai,
          periodeSelesai: draft.sk.periodeSelesai,
        })
        if (draft.sk.fileName) {
          setSkFile(null)
        }
        return
      }
    }

    // Perbaikan mode
    try {
      const raw = sessionStorage.getItem("perbaikanPokjaData")
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        nomorKanal: string
        members: Members
        sk: { nomorSK: string; tanggalSK: string; periodeMulai: string; periodeSelesai: string }
      }
      setIsPerbaikanMode(true)
      setKanalPengaduan(parsed.nomorKanal ?? "")
      if (parsed.members) setMembers(parsed.members)
      if (parsed.sk) {
        setSkDetail({
          nomorSK: parsed.sk.nomorSK ?? "",
          tanggalSK: parsed.sk.tanggalSK ?? "",
          periodeMulai: parsed.sk.periodeMulai ?? "",
          periodeSelesai: parsed.sk.periodeSelesai ?? "",
        })
      }
      // Hapus setelah dibaca agar tidak terbawa ke sesi lain
      sessionStorage.removeItem("perbaikanPokjaData")
    } catch {}
  }, [])

  // ---------------------------------------------------------------------------
  // Auto-fill dummy data
  // ---------------------------------------------------------------------------
  const fillDummyData = () => {
    setKanalPengaduan("081234567890")
    setMembers(DUMMY_MEMBERS)
    setAnggotaList([])
    setSkDetail(DUMMY_SK)
    // Create a mock File for the SK upload
    const blob = new Blob(["(dummy PDF content)"], { type: "application/pdf" })
    const dummyFile = new File([blob], "SK_Kelompok_Kerja_Aceh_2025.pdf", { type: "application/pdf" })
    setSkFile(dummyFile)
    setFileError("")
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  const updateMember = (role: RoleKey, field: keyof MemberField, val: string) => {
    setMembers((prev) => ({ ...prev, [role]: { ...prev[role], [field]: val } }))
  }

  const canGoNext = () => {
    if (flowSteps === 3) {
      if (step === 1) return kanalPengaduan.trim().length > 0 && skFile !== null && !!skDetail.nomorSK && !!skDetail.tanggalSK && !!skDetail.periodeMulai && !!skDetail.periodeSelesai
      return true
    }
    if (step === 1) return kanalPengaduan.trim().length > 0
    if (step === 3) return skFile !== null && !!skDetail.nomorSK && !!skDetail.tanggalSK && !!skDetail.periodeMulai && !!skDetail.periodeSelesai
    return true
  }

  const handleNext = () => {
    if (flowSteps === 3) {
      if (step === 1 && !skFile) { setFileError("Dokumen SK wajib diunggah."); return }
    } else {
      if (step === 3 && !skFile) { setFileError("Dokumen SK wajib diunggah."); return }
    }

    if (step === 2) {
      const bidangKeys = ["pendidikan", "pppa", "sosial", "kesehatan", "dukbangga", "kominfo"] as const
      const isAnggotaComplete = (a: AnggotaItem) => !!(a.bidang && a.nama && a.jenisKelamin && a.email && a.noWhatsapp && a.instansi)
      const incompletePimpinan = PIMPINAN_ROLES.filter(r => !isRoleComplete(members[r.key])).map(r => r.key)
      const incompleteBidang = bidangKeys.filter(k => !isRoleComplete(members[k]))
      const incompleteAnggotaIdx = anggotaList.map((a, i) => i).filter(i => !isAnggotaComplete(anggotaList[i]))
      if (incompletePimpinan.length > 0 || incompleteBidang.length > 0 || incompleteAnggotaIdx.length > 0) {
        setStep2Errors(true)
        if (incompletePimpinan.length > 0)
          setCollapsedPimpinan(prev => { const s = new Set(prev); incompletePimpinan.forEach(k => s.delete(k)); return s })
        if (incompleteBidang.length > 0)
          setCollapsedBidang(prev => { const s = new Set(prev); incompleteBidang.forEach(k => s.delete(k)); return s })
        if (incompleteAnggotaIdx.length > 0)
          setCollapsedAnggota(prev => { const s = new Set(prev); incompleteAnggotaIdx.forEach(i => s.delete(i)); return s })
        return
      }
      setStep2Errors(false)
    }

    setFileError("")
    setStep((s) => Math.min(s + 1, flowSteps))
  }
  const handleBack = () => { setStep2Errors(false); setStep((s) => Math.max(s - 1, 1)) }

  const handleSubmit = () => {
    const payload: PokjaData = {
      region: REGION,
      nomorKanal: kanalPengaduan,
      members,
      sk: { file: skFile, nomorSK: skDetail.nomorSK, tanggalSK: skDetail.tanggalSK, periodeMultai: skDetail.periodeMulai, periodeSelesai: skDetail.periodeSelesai },
    }
    try {
      const role = (() => {
        try { return JSON.parse(sessionStorage.getItem("auth") || "{}").role } catch { return null }
      })()
      const pokjaStatus = isPerbaikanMode ? undefined : (role === "pusat" ? "aktif" : "masih-diverifikasi")
      const serialisable = {
        ...payload,
        sk: { ...payload.sk, file: payload.sk.file?.name ?? null },
        ...(isPerbaikanMode && { deskripsiPerbaikan: deskripsiPerbaikan.trim() }),
      }
      clearDraft()  // Clear draft BEFORE redirect
      const storageKey = isPerbaikanMode ? "perbaikanSubmitData" : "newPokjaData"
      sessionStorage.setItem(storageKey, JSON.stringify({ ...serialisable, ...(pokjaStatus ? { pokjaStatus } : {}) }))
    } catch {}
    setSubmitted(true)
  }

  // ---------------------------------------------------------------------------
  // Draft functions - hanya satu draft
  // ---------------------------------------------------------------------------
  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    const now = new Date().toISOString()
    const newDraftId = draftId || createDraftId()
    const existingDraft = getDrafts()

    const draft: PokjaDraft = {
      id: newDraftId,
      region: REGION,
      createdAt: existingDraft?.createdAt || now,
      updatedAt: now,
      kanalPengaduan,
      members,
      anggotaList: anggotaList,
      sk: {
        fileName: skFile?.name || "",
        nomorSK: skDetail.nomorSK,
        tanggalSK: skDetail.tanggalSK,
        periodeMulai: skDetail.periodeMulai,
        periodeSelesai: skDetail.periodeSelesai,
      },
    }

    saveDraftToStorage(draft)

    setDraftId(newDraftId)
    setIsDraftMode(true)
    setIsSavingDraft(false)
    setShowSavedToast(true)
    setTimeout(() => setShowSavedToast(false), 3000)
  }

  const handleDeleteDraft = () => {
    clearDraft()
    setDraftId(null)
    setIsDraftMode(false)
    setKanalPengaduan("")
    setMembers({
      ketua: emptyMember(), wakil: emptyMember(), koordinator: emptyMember(),
      pendidikan: emptyMember(), pppa: emptyMember(), sosial: emptyMember(),
      kesehatan: emptyMember(), kominfo: emptyMember(), dukbangga: emptyMember(),
    })
    setAnggotaList([])
    setSkDetail({ nomorSK: "", tanggalSK: "", periodeMulai: "", periodeSelesai: "" })
    setSkFile(null)
    router.push("/dashboard?menu=Kelompok Kerja")
  }

  // Navigate after success screen
  useEffect(() => {
    if (!submitted) return
    const t = setTimeout(() => {
      const role = (() => {
        try {
          return JSON.parse(sessionStorage.getItem("auth") || "{}").role
        } catch { return null }
      })()
      if (isPerbaikanMode) {
        window.location.href = "/dashboard?pokjaPerbaikan=1"
      } else if (role === "pusat") {
        window.location.href = "/dashboard?pokjaCreated=1"
      } else {
        window.location.href = "/dashboard?pokjaSubmitted=1"
      }
    }, 1800)
    return () => clearTimeout(t)
  }, [submitted, isPerbaikanMode])

  // ---------------------------------------------------------------------------
  // Success screen
  // ---------------------------------------------------------------------------
  if (submitted) {
    const role = (() => {
      try {
        return JSON.parse(sessionStorage.getItem("auth") || "{}").role
      } catch { return null }
    })()
    const isPusat = role === "pusat"

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-3 shadow-xl max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {isPerbaikanMode
              ? "Perbaikan Berhasil Dikirim!"
              : isPusat
                ? "Kelompok Kerja Berhasil Dibuat!"
                : "Kelompok Kerja Berhasil Dikirim!"}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {isPerbaikanMode
              ? `Perbaikan data Kelompok Kerja wilayah ${REGION} telah dikirim dan kembali menunggu verifikasi Admin Pusat.`
              : isPusat
                ? `Kelompok Kerja untuk wilayah ${REGION} telah dibuat dan aktif.`
                : `Kelompok Kerja wilayah ${REGION} sedang menunggu verifikasi dari Admin Pusat.`
            }
          </p>
          <p className="text-xs text-gray-400">Mengalihkan ke dashboard...</p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Form page
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky topx-4 mt-2 mb-4 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gapx-4 mt-2 mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <span className="text-gray-300">/</span>
            <h1 className="text-sm font-semibold text-gray-900">
              {isPerbaikanMode ? "Perbaikan Kelompok Kerja" : "Pembentukan Kelompok Kerja"} {REGION}
            </h1>
          </div>

          {/* Save Draft button - always visible in header */}
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="flex items-center gapx-4 mt-2 mb-4 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
          >
            {isSavingDraft ? "Menyimpan..." : "Simpan Draf"}
          </button>
        </div>
      </header>

      {/* Floating buttons - bottom right (demo only) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-1">
        <button
          onClick={fillDummyData}
          className="px-4 mt-2 mb-4 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition shadow-sm"
          title="Isi Otomatis (Demo)"
        >
          <Wand2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setFlowSteps(flowSteps === 3 ? 4 : 3)}
          className={cn("px-4 mt-2 mb-4 border rounded-lg transition shadow-sm", flowSteps === 4 ? "bg-blue-600 text-white border-blue-600" : "text-gray-500 bg-white border-gray-200 hover:bg-gray-100")}
          title={flowSteps === 3 ? "3 Langkah (klik untuk 4)" : "4 Langkah (klik untuk 3)"}
        >
          {flowSteps === 3 ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Toast notification for draft saved */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gapx-4 mt-2 mb-4 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg animate-pulse">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">Draf berhasil disimpan!</span>
        </div>
      )}

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Step indicator */}
        <div className="flex items-center gapx-4 mt-2 mb-4">
          {STEPS.map((s, i) => {
            const isActive = s.number === step
            const isDone = s.number < step
            return (
              <div key={s.number} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                    isDone ? "bg-blue-600 text-white" : isActive ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-gray-200 text-gray-500"
                  )}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.number}
                  </div>
                  <span className={cn("text-xs font-medium whitespace-nowrap hidden sm:block", isActive ? "text-blue-700" : isDone ? "text-blue-500" : "text-gray-400")}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mx-2 mb-4", isDone ? "bg-blue-500" : "bg-gray-200")} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Step header */}
          <div 
            className={cn("px-6 py-5 border-b border-gray-100 bg-gray-50", step === 2 && "flex items-center justify-between cursor-pointer hover:bg-gray-100 transition")}
            onClick={step === 2 ? toggleCollapseAllStep2 : undefined}
          >
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Langkah {step} dari {STEPS.length}</p>
              <h2 className="text-lg font-bold text-gray-900 mt-0.5">{STEPS[step - 1]?.label ?? "Tinjau Data"}</h2>
            </div>
            {step === 2 && (
              <ChevronDown className={cn("w-4 h-4 text-gray-400 transition", collapseAllStep2 && "rotate-180")} />
            )}
          </div>

          <div className="px-6 py-6">
            {/* ---- Step 1: Informasi Dasar (4-step) ---- */}
            {flowSteps === 4 && step === 1 && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Wilayah</label>
                  <div className="flex items-center gapx-4 mt-2 mb-4 h-9 px-3 border border-gray-200 rounded-lg bg-gray-50">
                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-500">{REGION}</span>
                  </div>
                  <p className="text-xs text-gray-400">Wilayah tidak dapat diubah</p>
                </div>
                <div className="flex flex-col gapx-4 mt-2 mb-4">
                  <InputField
                    label="Nomor Kanal Pengaduan dan Aspirasi"
                    required
                    placeholder="Contoh: 081234567890"
                    value={kanalPengaduan}
                    onChange={setKanalPengaduan}
                  />
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 flex flex-col gap-1">
                    <p className="text-xs font-semibold text-amber-900">Nomor di atas akan menjadi kontak utama Kelompok Kerja</p>
                    <ul className="text-xs text-amber-800 space-y-0.5 list-disc list-inside">
                      <li>Nomor akan dipublikasikan sebagai saluran pengaduan</li>
                      <li>Gunakan nomor resmi atas nama institusi dan bukan nomor pribadi</li>
                      <li>Pastikan nomor aktif dan dapat dihubungi masyarakat</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ---- Step 1: Informasi Dasar + Dokumen SK (3-step) ---- */}
            {flowSteps === 3 && step === 1 && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Wilayah</label>
                  <div className="flex items-center gapx-4 mt-2 mb-4 h-9 px-3 border border-gray-200 rounded-lg bg-gray-50">
                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-500">{REGION}</span>
                  </div>
                  <p className="text-xs text-gray-400">Wilayah tidak dapat diubah</p>
                </div>

                <hr className="border-gray-100" />

                <div className="flex flex-col gap-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Dokumen SK</p>
                  <FileUploadField value={skFile} onChange={setSkFile} error={fileError} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-600">Nomor SK <span className="text-red-500">*</span></label>
                      <input type="text" value={skDetail.nomorSK} onChange={(e) => setSkDetail((p) => ({ ...p, nomorSK: e.target.value }))}
                        placeholder="Contoh: 421/001/SK/2025"
                        className="h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-600">Tanggal SK <span className="text-red-500">*</span></label>
                      <input type="date" value={skDetail.tanggalSK} onChange={(e) => setSkDetail((p) => ({ ...p, tanggalSK: e.target.value }))}
                        className="h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-600">Tanggal Mulai <span className="text-red-500">*</span></label>
                      <input type="date" value={skDetail.periodeMulai} onChange={(e) => setSkDetail((p) => ({ ...p, periodeMulai: e.target.value }))}
                        className="h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-600">Tanggal Selesai <span className="text-red-500">*</span></label>
                      <input type="date" value={skDetail.periodeSelesai} onChange={(e) => setSkDetail((p) => ({ ...p, periodeSelesai: e.target.value }))}
                        className="h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div className="flex flex-col gapx-4 mt-2 mb-4">
                  <InputField
                    label="Nomor Kanal Pengaduan dan Aspirasi"
                    required
                    placeholder="Contoh: 081234567890"
                    value={kanalPengaduan}
                    onChange={setKanalPengaduan}
                  />
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 flex flex-col gap-1">
                    <p className="text-xs font-semibold text-amber-900">Nomor di atas akan menjadi kontak utama Kelompok Kerja</p>
                    <ul className="text-xs text-amber-800 space-y-0.5 list-disc list-inside">
                      <li>Nomor akan dipublikasikan sebagai saluran pengaduan</li>
                      <li>Gunakan nomor resmi atas nama institusi dan bukan nomor pribadi</li>
                      <li>Pastikan nomor aktif dan dapat dihubungi masyarakat</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ---- Step 2: Susunan Pengurus ---- */}
            {step === 2 && (
              <div className="flex flex-col gap-6">

                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pimpinan</p>
                  {PIMPINAN_ROLES.map((r) => (
                    <MemberSection
                      key={r.key}
                      label={r.label}
                      value={members[r.key]}
                      onChange={(f, v) => updateMember(r.key, f, v)}
                      isCollapsed={collapsedPimpinan.has(r.key)}
                      onToggleCollapse={() => toggleCollapsePimpinan(r.key)}
                      showErrors={step2Errors}
                    />
                  ))}
                </div>
                {/* Anggota per Bidang - 6 Wajib */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Anggota per Bidang</p>
                  
                  {/* Anggota Wajib 1: Pendidikan */}
                  <MandatoryMemberSection 
                    label="Anggota Wajib (Bidang Pendidikan)" 
                    value={members.pendidikan} 
                    onChange={(f, v) => updateMember("pendidikan", f, v)}
                    bidangValue="Bidang Pendidikan"
                    isCollapsed={collapsedBidang.has("pendidikan")}
                    onToggleCollapse={() => toggleCollapseBidang("pendidikan")}
                    showErrors={step2Errors}
                  />

                  {/* Anggota Wajib 2: PPPA */}
                  <MandatoryMemberSection
                    label="Anggota Wajib (Bidang PPPA)"
                    value={members.pppa}
                    onChange={(f, v) => updateMember("pppa", f, v)}
                    bidangValue="Bidang PPPA"
                    isCollapsed={collapsedBidang.has("pppa")}
                    onToggleCollapse={() => toggleCollapseBidang("pppa")}
                    showErrors={step2Errors}
                  />

                  {/* Anggota Wajib 3: Sosial */}
                  <MandatoryMemberSection
                    label="Anggota Wajib (Bidang Sosial)"
                    value={members.sosial}
                    onChange={(f, v) => updateMember("sosial", f, v)}
                    bidangValue="Bidang Sosial"
                    isCollapsed={collapsedBidang.has("sosial")}
                    onToggleCollapse={() => toggleCollapseBidang("sosial")}
                    showErrors={step2Errors}
                  />

                  {/* Anggota Wajib 4: Kesehatan */}
                  <MandatoryMemberSection
                    label="Anggota Wajib (Bidang Kesehatan)"
                    value={members.kesehatan}
                    onChange={(f, v) => updateMember("kesehatan", f, v)}
                    bidangValue="Bidang Kesehatan"
                    isCollapsed={collapsedBidang.has("kesehatan")}
                    onToggleCollapse={() => toggleCollapseBidang("kesehatan")}
                    showErrors={step2Errors}
                  />

                  {/* Anggota Wajib 5: Dukbangga */}
                  <MandatoryMemberSection
                    label="Anggota Wajib (Bidang Dukbangga)"
                    value={members.dukbangga}
                    onChange={(f, v) => updateMember("dukbangga", f, v)}
                    bidangValue="Bidang Dukbangga"
                    isCollapsed={collapsedBidang.has("dukbangga")}
                    onToggleCollapse={() => toggleCollapseBidang("dukbangga")}
                    showErrors={step2Errors}
                  />

                  {/* Anggota Wajib 6: Kominfo */}
                  <MandatoryMemberSection
                    label="Anggota Wajib (Bidang Kominfo)"
                    value={members.kominfo}
                    onChange={(f, v) => updateMember("kominfo", f, v)}
                    bidangValue="Bidang Kominfo"
                    isCollapsed={collapsedBidang.has("kominfo")}
                    onToggleCollapse={() => toggleCollapseBidang("kominfo")}
                    showErrors={step2Errors}
                  />
                </div>

                {/* Anggota Lainnya (Dinamis) */}
                <div className="flex flex-col gap-3">
                  {anggotaList.length > 0 && (
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Anggota Lainnya (Opsional)</p>
                  )}
                  
                  {anggotaList.map((anggota, index) => {
                    const isBidangSelected = !!anggota.bidang
                    const isCollapsed = collapsedAnggota.has(index)
                    const anggotaHasErr = step2Errors && !(anggota.bidang && anggota.nama && anggota.jenisKelamin && anggota.email && anggota.noWhatsapp && anggota.instansi)
                    return (
                    <div key={index} className={cn("rounded-xl border bg-white overflow-hidden", anggotaHasErr ? "border-red-300" : "border-gray-200")}>
                      <div
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition"
                        onClick={() => toggleCollapse(index)}
                      >
                        <div className="flex items-center gapx-4 mt-2 mb-4 flex-1">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-blue-700" />
                          </div>
                          <span className="text-sm font-semibold text-gray-800">Anggota Lainnya {index + 1}</span>
                          {anggotaHasErr && isCollapsed && (
                            <span className="text-xs font-medium text-red-500">Ada field yang belum diisi</span>
                          )}
                          <div className="flex flex-col gap-1 flex-1 max-w-xs" onClick={(e) => e.stopPropagation()}>
                            <div className="relative">
                              <select
                                value={anggota.bidang}
                                onChange={(e) => updateAnggota(index, "bidang", e.target.value)}
                                className={cn(
                                  "w-full h-8 pl-3 pr-8 text-xs border rounded-lg appearance-none transition text-gray-700 bg-white",
                                  step2Errors && !anggota.bidang ? "border-red-400 bg-red-50" : "border-gray-300"
                                )}
                              >
                                <option value="">Pilih bidang</option>
                                <option value="Bidang Pendidikan">Bidang Pendidikan</option>
                                <option value="Bidang PPPA">Bidang PPPA</option>
                                <option value="Bidang Sosial">Bidang Sosial</option>
                                <option value="Bidang Kesehatan">Bidang Kesehatan</option>
                                <option value="Bidang Dukbangga">Bidang Dukbangga</option>
                                <option value="Bidang Kominfo">Bidang Kominfo</option>
                                <option value="Lainnya (Tokoh Masyarakat, Akademisi, Kepolisian, dan sebagainya..)">Lainnya</option>
                              </select>
                              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gapx-4 mt-2 mb-4">
                          <div
                            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition"
                          >
                            {isCollapsed ? <ChevronDown className="w-4 h-4 rotate-180" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeAnggota(index) }}
                            className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {!isCollapsed && (
                        <>
                          {!isBidangSelected && (
                            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
                              Silakan pilih bidang terlebih dahulu untuk mengaktifkan form anggota
                            </div>
                          )}
                          <div className={cn("p-4 grid grid-cols-1 sm:grid-cols-2 gap-3", !isBidangSelected && "opacity-40 pointer-events-none")}>
                          <InputField
                            label="Nama"
                            required
                            placeholder="Nama lengkap"
                            value={anggota.nama}
                            onChange={(v) => updateAnggota(index, "nama", v)}
                            hasError={step2Errors && !anggota.nama}
                          />
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600">
                              Jenis Kelamin <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <select
                                value={anggota.jenisKelamin}
                                onChange={(e) => updateAnggota(index, "jenisKelamin", e.target.value)}
                                className={cn(
                                  "w-full h-9 pl-3 pr-8 text-sm border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
                                  step2Errors && !anggota.jenisKelamin ? "border-red-400 bg-red-50 text-gray-400" : anggota.jenisKelamin ? "border-gray-300 text-gray-700" : "border-gray-300 text-gray-400"
                                )}
                              >
                                <option value="" disabled>Pilih jenis kelamin</option>
                                <option value="Laki-Laki">Laki-Laki</option>
                                <option value="Perempuan">Perempuan</option>
                              </select>
                              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          <InputField
                            label="Instansi"
                            required
                            placeholder="Nama instansi / lembaga"
                            value={anggota.instansi || ""}
                            onChange={(v) => updateAnggota(index, "instansi", v)}
                            hasError={step2Errors && !anggota.instansi}
                          />
                          <InputField
                            label="Jabatan pada Instansi"
                            placeholder="Contoh: Kepala Bidang, Staff, dll"
                            value={anggota.jabatan || ""}
                            onChange={(v) => updateAnggota(index, "jabatan", v)}
                          />
                          <InputField
                            label="Email"
                            required
                            type="email"
                            placeholder="nama@instansi.go.id"
                            value={anggota.email}
                            onChange={(v) => updateAnggota(index, "email", v)}
                            hasError={step2Errors && !anggota.email}
                          />
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600">
                              Nomor HP <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                              <input
                                type="tel"
                                inputMode="numeric"
                                value={anggota.noWhatsapp}
                                onChange={(e) => updateAnggota(index, "noWhatsapp", e.target.value.replace(/\D/g, ""))}
                                placeholder="08xxxxxxxxxx"
                                className={cn(
                                  "w-full h-9 pl-9 pr-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
                                  step2Errors && !anggota.noWhatsapp ? "border-red-400 bg-red-50" : "border-gray-300"
                                )}
                              />
                            </div>
                          </div>
                        </div>
                        </>
                      )}
                    </div>
                    )})}
                  
                  <button
                    onClick={addAnggota}
                    type="button"
                    className="flex items-center justify-center gapx-4 mt-2 mb-4 w-full py-2.5 mt-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition"
                  >
                    <Plus className="w-4 h-4" /> Tambah Anggota
                  </button>
                </div>
              </div>
            )}

            {/* ---- Step 3: Dokumen SK (4-step only) ---- */}
            {flowSteps === 4 && step === 3 && (
              <div className="flex flex-col gap-5">
                <FileUploadField value={skFile} onChange={setSkFile} error={fileError} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">Nomor SK <span className="text-red-500">*</span></label>
                    <input type="text" value={skDetail.nomorSK} onChange={(e) => setSkDetail((p) => ({ ...p, nomorSK: e.target.value }))}
                      placeholder="Contoh: 421/001/SK/2025"
                      className="h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">Tanggal SK <span className="text-red-500">*</span></label>
                    <input type="date" value={skDetail.tanggalSK} onChange={(e) => setSkDetail((p) => ({ ...p, tanggalSK: e.target.value }))}
                      className="h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">Tanggal Mulai <span className="text-red-500">*</span></label>
                    <input type="date" value={skDetail.periodeMulai} onChange={(e) => setSkDetail((p) => ({ ...p, periodeMulai: e.target.value }))}
                      className="h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">Tanggal Selesai <span className="text-red-500">*</span></label>
                    <input type="date" value={skDetail.periodeSelesai} onChange={(e) => setSkDetail((p) => ({ ...p, periodeSelesai: e.target.value }))}
                      className="h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                  </div>
                </div>
              </div>
)}

            {/* ---- Review (step 3 in 3-step mode, step 4 in 4-step mode) ---- */}
            {((flowSteps === 3 && step === 3) || (flowSteps === 4 && step === 4)) && (
              <div className="flex flex-col gap-6">
                {/* Info Dasar */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {flowSteps === 3 ? "Informasi & Dokumen SK" : "Informasi Dasar"}
                    </p>
                    <button onClick={() => setStep(1)} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Eye className="w-3 h-3" /> Ubah</button>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <table className="w-full">
                      <tbody>
                        <ReviewTableRow label="Wilayah" value={REGION} />
                        <ReviewTableRow label="Nomor Kanal Pengaduan" value={kanalPengaduan} />
                        {flowSteps === 3 && (
                          <>
                            <ReviewTableRow label="File SK" value={skFile?.name ?? "-"} />
                            <ReviewTableRow label="Nomor SK" value={skDetail.nomorSK} />
                            <ReviewTableRow label="Tanggal SK" value={skDetail.tanggalSK} />
                            <ReviewTableRow label="Periode" value={skDetail.periodeMulai && skDetail.periodeSelesai ? `${skDetail.periodeMulai} s/d ${skDetail.periodeSelesai}` : "-"} />
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pengurus */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Susunan Pengurus</p>
                    <button onClick={() => setStep(2)} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Eye className="w-3 h-3" /> Ubah</button>
                  </div>
                  {flowSteps === 3 ? (
                    <ReviewAccordion members={members} anggotaList={anggotaList} />
                  ) : (
                    <ReviewTable
                      members={members}
                      anggotaList={anggotaList}
                      onEdit={(segment) => goToStep2WithSegment(segment)}
                      onDelete={(idx) => setAnggotaList(prev => prev.filter((_, i) => i !== idx))}
                      onResetMember={(roleKey) => setMembers(prev => ({ ...prev, [roleKey]: emptyMember() }))}
                    />
                  )}
                </div>

                {/* SK — only shown separately in 4-step mode */}
                {flowSteps === 4 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Dokumen SK</p>
                      <button onClick={() => setStep(3)} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Eye className="w-3 h-3" /> Ubah</button>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <table className="w-full">
                        <tbody>
                          <ReviewTableRow label="File SK" value={skFile?.name ?? "-"} />
                          <ReviewTableRow label="Nomor SK" value={skDetail.nomorSK} />
                          <ReviewTableRow label="Tanggal SK" value={skDetail.tanggalSK} />
                          <ReviewTableRow label="Periode" value={skDetail.periodeMulai && skDetail.periodeSelesai ? `${skDetail.periodeMulai} s/d ${skDetail.periodeSelesai}` : "-"} />
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Deskripsi pengubahan — hanya mode perbaikan/edit */}
                {isPerbaikanMode && (
                  <div>
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Catatan Pengubahan</p>
                      <p className="text-xs text-gray-400 mt-0.5">Jelaskan pengubahan apa saja yang Anda lakukan pada data POKJA ini.</p>
                    </div>
                    <textarea
                      value={deskripsiPerbaikan}
                      onChange={(e) => setDeskripsiPerbaikan(e.target.value)}
                      placeholder="Contoh: Memperbarui nomor SK, mengganti anggota koordinator, dan memperpanjang periode berlaku..."
                      rows={4}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                )}
              </div>
            )}
              </div>
            </div>
              <div className="flex items-center justify-between pb-8">
          {step > 1 ? (
            <button onClick={handleBack} className="flex items-center gapx-4 mt-2 mb-4 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>
          ) : <div />}

          {step < flowSteps ? (
            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              className={cn(
                "flex items-center gapx-4 mt-2 mb-4 px-5 py-2 text-sm font-semibold rounded-lg transition",
                canGoNext()
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              Selanjutnya <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gapx-4 mt-2 mb-4">
              <button
                onClick={handleSubmit}
                className="flex items-center gapx-4 mt-2 mb-4 px-6 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isPerbaikanMode ? "Kirim Perbaikan" : "Ajukan"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
