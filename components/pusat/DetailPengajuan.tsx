"use client"
import { useState } from "react"
import {
  X,
  FileText,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Building2,
  Calendar,
  Hash,
  Download,
} from "lucide-react"
import { PengajuanPokja, MemberData } from "@/data/mockPokja"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type MemberAction = "approved" | "declined" | "pending"

interface MemberState {
  action: MemberAction
  alasan: string
}

interface DetailPengajuanProps {
  item: PengajuanPokja
  onClose: () => void
  onSave: (updated: PengajuanPokja) => void
}

// ---------------------------------------------------------------------------
// Notification email simulation modal
// ---------------------------------------------------------------------------
function NotifModal({
  type,
  wilayah,
  approvedNames,
  declinedNames,
  alasanGlobal,
  onClose,
}: {
  type: "approved" | "declined" | "partial"
  wilayah: string
  approvedNames: string[]
  declinedNames: string[]
  alasanGlobal: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className={cn(
          "px-6 py-5 flex items-center gap-3",
          type === "approved" ? "bg-emerald-600" : type === "declined" ? "bg-red-600" : "bg-blue-600"
        )}>
          {type === "approved" ? (
            <CheckCircle2 className="w-7 h-7 text-white flex-shrink-0" />
          ) : type === "declined" ? (
            <XCircle className="w-7 h-7 text-white flex-shrink-0" />
          ) : (
            <AlertCircle className="w-7 h-7 text-white flex-shrink-0" />
          )}
          <div>
            <h3 className="text-base font-bold text-white leading-tight">
              {type === "approved" ? "Pengajuan Disetujui" : type === "declined" ? "Pengajuan Ditolak" : "Diterima Sebagian"}
            </h3>
            <p className="text-xs text-white/80 mt-0.5">{wilayah}</p>
          </div>
        </div>

        {/* Email preview */}
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-[4px] border border-gray-200 bg-[#F9F9F9] p-4 text-sm text-gray-700 space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Mail className="w-3.5 h-3.5" />
              <span>Notifikasi email telah dikirimkan ke:</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-600">Admin Dinas Pendidikan — {wilayah}</p>
              {approvedNames.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mt-2 mb-1">Anggota diterima ({approvedNames.length}):</p>
                  {approvedNames.map((n) => (
                    <p key={n} className="text-xs text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {n}
                    </p>
                  ))}
                </div>
              )}
              {declinedNames.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mt-2 mb-1">Anggota ditolak ({declinedNames.length}):</p>
                  {declinedNames.map((n) => (
                    <p key={n} className="text-xs text-red-600 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {n}
                    </p>
                  ))}
                </div>
              )}
              {alasanGlobal && (
                <div className="mt-3 p-3 rounded-[4px] bg-red-50 border border-red-100">
                  <p className="text-xs font-semibold text-red-700">Alasan Penolakan:</p>
                  <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{alasanGlobal}</p>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Notifikasi telah dikirimkan secara otomatis ke Admin Dinas Pendidikan dan seluruh anggota Kelompok Kerja terkait.
          </p>
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-[4px] text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Member row
// ---------------------------------------------------------------------------
function MemberRow({
  member,
  state,
  onChange,
  readOnly,
}: {
  member: MemberData
  state: MemberState
  onChange: (s: MemberState) => void
  readOnly: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  const actionBg: Record<MemberAction, string> = {
    approved: "bg-emerald-50 border-emerald-200",
    declined: "bg-red-50 border-red-200",
    pending: "bg-white border-gray-200",
  }

  return (
    <div className={cn("rounded-[4px] border overflow-hidden transition-all", actionBg[state.action])}>
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 border-gray-200 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{member.nama || "—"}</p>
          <p className="text-xs text-gray-500 truncate">{member.jabatan}</p>
        </div>

        {/* Status indicator */}
        {state.action === "approved" && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" /> Diterima
          </span>
        )}
        {state.action === "declined" && (
          <span className="flex items-center gap-1 text-xs font-medium text-red-700 flex-shrink-0">
            <XCircle className="w-3.5 h-3.5" /> Ditolak
          </span>
        )}

        {/* Action buttons */}
        {!readOnly && (
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <button
              onClick={() => onChange({ ...state, action: state.action === "approved" ? "pending" : "approved" })}
              className={cn(
                "h-7 px-2.5 rounded-[4px] text-xs font-medium transition-colors border",
                state.action === "approved"
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-white border-gray-300 text-gray-600 hover:border-emerald-500 hover:text-emerald-600"
              )}
            >
              Terima
            </button>
            <button
              onClick={() => onChange({ ...state, action: state.action === "declined" ? "pending" : "declined" })}
              className={cn(
                "h-7 px-2.5 rounded-[4px] text-xs font-medium transition-colors border",
                state.action === "declined"
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-white border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600"
              )}
            >
              Tolak
            </button>
          </div>
        )}

        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-1 p-1 rounded text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label={expanded ? "Sembunyikan detail" : "Lihat detail"}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <Mail className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-wide">Email</p>
              <p className="text-xs text-gray-700">{member.email || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-wide">Nomor HP</p>
              <p className="text-xs text-gray-700">{member.noWhatsapp || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Building2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-wide">Instansi</p>
              <p className="text-xs text-gray-700">{member.instansi || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-wide">Jenis Kelamin</p>
              <p className="text-xs text-gray-700">{member.jenisKelamin || "—"}</p>
            </div>
          </div>

          {/* Alasan penolakan for this member */}
          {state.action === "declined" && !readOnly && (
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={state.alasan}
                onChange={(e) => onChange({ ...state, alasan: e.target.value })}
                placeholder="Tuliskan alasan penolakan anggota ini..."
                className="w-full text-xs border border-red-300 rounded-[4px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
              />
            </div>
          )}
          {state.action === "declined" && readOnly && member.alasanPenolakan && (
            <div className="sm:col-span-2 p-2 bg-red-50 rounded-[4px]">
              <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">Alasan Penolakan</p>
              <p className="text-xs text-red-700 mt-0.5">{member.alasanPenolakan}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main drawer
// ---------------------------------------------------------------------------
export function DetailPengajuan({ item, onClose, onSave }: DetailPengajuanProps) {
  const isReadOnly = item.status !== "menunggu-validasi"

  // Initialise member states
  const [memberStates, setMemberStates] = useState<Record<string, MemberState>>(() => {
    const init: Record<string, MemberState> = {}
    item.members.forEach((m) => {
      init[m.jabatan] = {
        action: m.status === "approved" ? "approved" : m.status === "declined" ? "declined" : "pending",
        alasan: m.alasanPenolakan ?? "",
      }
    })
    return init
  })

  const [globalAlasan, setGlobalAlasan] = useState(item.alasanPenolakan ?? "")
  const [showNotif, setShowNotif] = useState(false)
  const [notifType, setNotifType] = useState<"approved" | "declined" | "partial">("approved")

  const setMemberState = (jabatan: string, s: MemberState) => {
    setMemberStates((prev) => ({ ...prev, [jabatan]: s }))
  }

  const approveAll = () => {
    const next: Record<string, MemberState> = {}
    item.members.forEach((m) => { next[m.jabatan] = { action: "approved", alasan: "" } })
    setMemberStates(next)
  }

  const declineAll = () => {
    const next: Record<string, MemberState> = {}
    item.members.forEach((m) => { next[m.jabatan] = { action: "declined", alasan: memberStates[m.jabatan]?.alasan ?? "" } })
    setMemberStates(next)
  }

  const allDeclined = item.members.every((m) => memberStates[m.jabatan]?.action === "declined")
  const allApproved = item.members.every((m) => memberStates[m.jabatan]?.action === "approved")
  const anyPending = item.members.some((m) => memberStates[m.jabatan]?.action === "pending")
  const anyDeclined = item.members.some((m) => memberStates[m.jabatan]?.action === "declined")

  const declinedMembers = item.members.filter((m) => memberStates[m.jabatan]?.action === "declined")
  const requiresGlobalAlasan = allDeclined

  const canSubmit = !anyPending && (!requiresGlobalAlasan || globalAlasan.trim().length > 0) &&
    declinedMembers.every((m) => memberStates[m.jabatan]?.alasan.trim().length > 0 || allDeclined)

  const handleSubmit = () => {
    // Determine final status
    let finalStatus: PengajuanPokja["status"]
    if (allApproved) finalStatus = "disetujui"
    else if (allDeclined) finalStatus = "ditolak"
    else finalStatus = "ditolak-sebagian"

    const updatedMembers: MemberData[] = item.members.map((m) => ({
      ...m,
      status: memberStates[m.jabatan]?.action ?? "pending",
      alasanPenolakan: memberStates[m.jabatan]?.alasan || undefined,
    }))

    const updated: PengajuanPokja = {
      ...item,
      status: finalStatus,
      members: updatedMembers,
      alasanPenolakan: allDeclined ? globalAlasan : undefined,
    }

    onSave(updated)

    const type = allApproved ? "approved" : allDeclined ? "declined" : "partial"
    setNotifType(type)
    setShowNotif(true)
  }

  const approvedNames = item.members.filter((m) => memberStates[m.jabatan]?.action === "approved").map((m) => m.nama)
  const declinedNames = declinedMembers.map((m) => m.nama)

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Detail Pengajuan Kelompok Kerja"
          className="relative z-10 flex flex-col w-full max-w-2xl h-screen bg-[#F9F9F9] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-gray-900">Detail Pengajuan Kelompok Kerja</h2>
              <p className="text-xs text-gray-500 mt-0.5">{item.wilayah}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-[4px] flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status banner */}
          {isReadOnly && (
            <div className={cn(
              "px-6 py-2.5 text-xs font-medium flex items-center gap-2 border-b",
              item.status === "disetujui" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
              item.status === "ditolak" ? "bg-red-50 text-red-700 border-red-100" :
              "bg-blue-50 text-blue-700 border-blue-100"
            )}>
              {item.status === "disetujui" ? <CheckCircle2 className="w-3.5 h-3.5" /> :
               item.status === "ditolak" ? <XCircle className="w-3.5 h-3.5" /> :
               <AlertCircle className="w-3.5 h-3.5" />}
              {item.status === "disetujui" ? "Pengajuan ini telah disetujui" :
               item.status === "ditolak" ? "Pengajuan ini telah ditolak" :
               "Pengajuan ini diterima sebagian"}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Informasi Dokumen */}
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Informasi Dokumen SK</h3>
              <div className="rounded-[4px] border border-gray-200 bg-white p-4 grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Hash className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Nomor SK</p>
                    <p className="text-sm font-medium text-gray-800">{item.nomorSK}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Tanggal SK</p>
                    <p className="text-sm font-medium text-gray-800">{item.tanggalSK}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Periode</p>
                    <p className="text-sm font-medium text-gray-800">{item.periodeMulai} — {item.periodeSelesai}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">File SK</p>
                    <button className="text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {item.skFileName}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Susunan Anggota */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Susunan Anggota</h3>
                {!isReadOnly && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={approveAll}
                      className="text-xs px-2.5 py-1 rounded-[4px] border border-emerald-300 bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition-colors"
                    >
                      Terima Semua
                    </button>
                    <button
                      onClick={declineAll}
                      className="text-xs px-2.5 py-1 rounded-[4px] border border-red-300 bg-red-50 text-red-700 font-medium hover:bg-red-100 transition-colors"
                    >
                      Tolak Semua
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {item.members.map((m) => (
                  <MemberRow
                    key={m.jabatan}
                    member={m}
                    state={memberStates[m.jabatan] ?? { action: "pending", alasan: "" }}
                    onChange={(s) => setMemberState(m.jabatan, s)}
                    readOnly={isReadOnly}
                  />
                ))}
              </div>
            </section>

            {/* Global alasan if all declined */}
            {!isReadOnly && anyDeclined && allDeclined && (
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Alasan Penolakan Keseluruhan <span className="text-red-500">*</span>
                </h3>
                <textarea
                  rows={3}
                  value={globalAlasan}
                  onChange={(e) => setGlobalAlasan(e.target.value)}
                  placeholder="Tuliskan alasan penolakan keseluruhan pengajuan Kelompok Kerja ini..."
                  className="w-full text-sm border border-red-300 rounded-[4px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none bg-white"
                />
              </section>
            )}

            {/* Read-only global alasan */}
            {isReadOnly && item.alasanPenolakan && (
              <section className="rounded-[4px] border border-red-200 bg-red-50 p-4">
                <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Alasan Penolakan</h3>
                <p className="text-sm text-red-700 leading-relaxed">{item.alasanPenolakan}</p>
              </section>
            )}
          </div>

          {/* Footer */}
          {!isReadOnly && (
            <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between gap-3">
              {anyPending && (
                <p className="text-xs text-amber-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  Semua anggota harus diberi keputusan
                </p>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={onClose}
                  className="h-9 px-4 rounded-[4px] text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={cn(
                    "h-9 px-5 rounded-[4px] text-sm font-semibold transition-colors",
                    canSubmit
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  Simpan Keputusan
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Notification modal */}
      {showNotif && (
        <NotifModal
          type={notifType}
          wilayah={item.wilayah}
          approvedNames={approvedNames}
          declinedNames={declinedNames}
          alasanGlobal={globalAlasan}
          onClose={() => {
            setShowNotif(false)
            onClose()
          }}
        />
      )}
    </>
  )
}
