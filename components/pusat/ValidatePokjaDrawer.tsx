"use client"
import { useState } from "react"
import {
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  Building2,
  FileText,
  Eye,
} from "lucide-react"
import type { PokjaItem } from "@/types/pokja"
import { PIMPINAN_ROLES, BIDANG_ROLES, Members, MemberField } from "@/types/pokja"
import { Badge } from "@/components/ds/Badge"

interface ValidatePokjaDrawerProps {
  pokja: PokjaItem
  onClose: () => void
  onSave: (updated: PokjaItem) => void
}

const STATUS_CONFIG = {
  "belum-dibentuk": { label: "Belum Dibentuk", variant: "neutral" as const },
  "masih-diverifikasi": { label: "Perlu Diperiksa", variant: "warning" as const },
  aktif: { label: "Aktif", variant: "success" as const },
  "butuh-perbaikan": { label: "Perlu Perbaikan", variant: "error" as const },
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value || "-"}</span>
    </div>
  )
}

function ReviewMemberCard({ label, member }: { label: string; member: MemberField }) {
  const isEmpty = !member.nama && !member.email && !member.noWhatsapp
  return (
    <div className="rounded-[4px] border border-[#D9DBDD] overflow-hidden">
      <div className="px-3 py-2 bg-[#F9F9F9] border-b border-gray-200 flex items-center gap-2">
        <User className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        {isEmpty && (
          <span className="ml-auto text-[13px] font-semibold text-amber-950 bg-amber-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">Belum diisi</span>
        )}
      </div>
      {!isEmpty && (
        <div className="px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
          <ReviewRow label="Nama" value={member.nama} />
          <ReviewRow label="Email" value={member.email} />
          <ReviewRow label="Jenis Kelamin" value={member.jenisKelamin} />
          <ReviewRow label="Nomor HP" value={member.noWhatsapp} />
          <ReviewRow label="Instansi" value={member.instansi} />
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
}

export function ValidatePokjaDrawer({ pokja, onClose, onSave }: ValidatePokjaDrawerProps) {
  const isReadOnly = pokja.status !== "masih-diverifikasi"
  
  const members = pokja.data?.members as Members
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectAlasan, setRejectAlasan] = useState("")

  const statusCfg = STATUS_CONFIG[pokja.status]

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-30" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200 bg-[#F9F9F9]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-gray-900">{pokja.nama}</h2>
              <Badge variant={statusCfg.variant} size="sm">{statusCfg.label}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {pokja.data?.region}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[4px] hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Info Validasi - Taruh di paling atas */}
          {(pokja.status === "butuh-perbaikan" || pokja.status === "aktif") && pokja.alasanPenolakan && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Alasan Perlu Perbaikan</p>
              </div>
              <div className="rounded-[4px] border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">{pokja.alasanPenolakan}</p>
              </div>
            </div>
          )}

          {/* Info Dasar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Informasi Dasar</p>
            </div>
            <div className="rounded-[4px] border border-[#D9DBDD] p-4 grid grid-cols-2 gap-4">
              <ReviewRow label="Wilayah" value={pokja.nama} />
              <ReviewRow label="Nomor Kanal Pengaduan" value={pokja.data?.nomorKanal || "-"} />
            </div>
          </div>

          {/* Dokumen SK */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Dokumen SK</p>
            </div>
            <div className="rounded-[4px] border border-[#D9DBDD] p-4 grid grid-cols-2 gap-4">
              <ReviewRow label="Nomor SK" value={pokja.data?.sk?.nomorSK || "-"} />
              <ReviewRow label="Tanggal SK" value={pokja.data?.sk?.tanggalSK ? formatDate(pokja.data.sk.tanggalSK) : "-"} />
              <ReviewRow label="Periode" value={
                pokja.data?.sk?.periodeMultai && pokja.data?.sk?.periodeSelesai 
                  ? `${pokja.data.sk.periodeMultai} s/d ${pokja.data.sk.periodeSelesai}` 
                  : "-"
              } />
            </div>
          </div>

          {/* Susunan Pengurus */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Susunan Pengurus</p>
            </div>
            <div className="rounded-[4px] border border-[#D9DBDD] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#F1F1F1] border-b border-[#D9DBDD]">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Jabatan pada Instansi</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Nama</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Email</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Nomor HP</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Instansi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DBDD]">
                  {PIMPINAN_ROLES.map((r) => {
                    const m = members?.[r.key]
                    const isEmpty = !m?.nama
                    return (
                      <tr key={r.key} className={isEmpty ? "bg-[#F9F9F9]" : ""}>
                        <td className="px-4 py-2 text-gray-700 font-medium">{r.label}</td>
                        <td className="px-4 py-2 text-gray-800">{m?.nama || "-"}</td>
                        <td className="px-4 py-2 text-gray-600">{m?.email || "-"}</td>
                        <td className="px-4 py-2 text-gray-600">{m?.noWhatsapp || "-"}</td>
                        <td className="px-4 py-2 text-gray-600">{m?.instansi || "-"}</td>
                      </tr>
                    )
                  })}
                  {BIDANG_ROLES.map((r) => {
                    const m = members?.[r.key]
                    const isEmpty = !m?.nama
                    return (
                      <tr key={r.key} className={isEmpty ? "bg-[#F9F9F9]" : ""}>
                        <td className="px-4 py-2 text-gray-700 font-medium">{r.label}</td>
                        <td className="px-4 py-2 text-gray-800">{m?.nama || "-"}</td>
                        <td className="px-4 py-2 text-gray-600">{m?.email || "-"}</td>
                        <td className="px-4 py-2 text-gray-600">{m?.noWhatsapp || "-"}</td>
                        <td className="px-4 py-2 text-gray-600">{m?.instansi || "-"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Riwayat Aktivitas */}
          <div className="bg-white rounded-[4px] border border-[#D9DBDD] overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-[#F9F9F9] flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <p className="text-sm font-bold text-gray-800">Riwayat Aktivitas</p>
              {pokja.validasiLog && pokja.validasiLog.length > 0 && (
                <span className="text-sm font-normal text-gray-400">({pokja.validasiLog.length} log)</span>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {!pokja.validasiLog || pokja.validasiLog.length === 0
                ? <p className="px-5 py-4 text-sm text-gray-400">Belum ada riwayat aktivitas.</p>
                : [...pokja.validasiLog].reverse().map((log, idx) => {
                    const aksiConfig: Record<string, { label: string; color: string; dot: string }> = {
                      pengajuan:  { label: "Pengajuan",          color: "text-blue-700 bg-blue-50 border-blue-200",       dot: "bg-blue-500"   },
                      terima:     { label: "Diterima",           color: "text-green-700 bg-green-50 border-green-200",    dot: "bg-green-500"  },
                      aktivasi:   { label: "Diaktivasi",         color: "text-green-700 bg-green-50 border-green-200",    dot: "bg-green-500"  },
                      tolak:      { label: "Ditolak",            color: "text-red-700 bg-red-50 border-red-200",          dot: "bg-red-500"    },
                      perbaiki:   { label: "Perbaikan Diajukan", color: "text-amber-700 bg-amber-50 border-amber-200",    dot: "bg-amber-500"   },
                      edit:       { label: "Data Diperbarui",    color: "text-indigo-700 bg-indigo-50 border-indigo-200", dot: "bg-indigo-500"  },
                      sk_expired: { label: "SK Kedaluwarsa",     color: "text-orange-700 bg-orange-50 border-orange-200", dot: "bg-orange-500"  },
                    }
                    const aktorLabel: Record<string, string> = {
                      user:        "Admin Dinas",
                      admin_pusat: "Admin Pusat",
                      sistem:      "Sistem",
                    }
                    const cfg = aksiConfig[log.aksi] ?? { label: log.aksi, color: "text-gray-700 bg-[#F9F9F9] border-gray-200", dot: "bg-gray-400" }
                    return (
                      <div key={idx} className="px-5 py-4 flex items-start gap-4">
                        <div className="pt-1">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              oleh <span className="font-medium text-gray-700">{aktorLabel[log.aktor] ?? log.aktor}</span>
                            </span>
                            <span className="text-xs text-gray-400 ml-auto">{log.tanggal}</span>
                          </div>
                          {log.alasan && (
                            <p className="text-sm text-gray-600 bg-[#F9F9F9] rounded px-3 py-2 mt-1 border border-gray-100">
                              {log.alasan}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
              }
            </div>
          </div>

          {showRejectForm && (
            <div className="rounded-[4px] border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Alasan Penolakan</span>
              </div>
              <textarea
                value={rejectAlasan}
                onChange={(e) => setRejectAlasan(e.target.value)}
                placeholder="Masukkan alasan penolakan..."
                className="bg-white w-full px-3 py-2 text-sm border border-red-200 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
            </div>
          )}
        </div>

        {!isReadOnly && (
          <div className="px-6 py-4 border-t border-gray-200 bg-[#F9F9F9]">
            {!showRejectForm ? (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    const newLog = { tanggal: today, aksi: "terima" as const, aktor: "admin_pusat" as const }
                    const newPokja = { 
                      ...pokja, 
                      status: "aktif" as const,
                      tanggalDiverifikasi: today,
                      validasiLog: [...(pokja.validasiLog || []), newLog]
                    }
                    onSave(newPokja)
                  }}
                  className="flex-1 py-2.5 rounded-[4px] text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 inline mr-1.5" />
                  Terima Pengajuan
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="flex-1 py-2.5 rounded-[4px] text-sm font-medium border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                >
                  <XCircle className="w-4 h-4 inline mr-1.5" />
                  Tolak Pengajuan
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectForm(false)
                    setRejectAlasan("")
                  }}
                  className="flex-1 py-2.5 rounded-[4px] text-sm font-medium border border-[#808489] text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    const newLog = { tanggal: today, aksi: "tolak" as const, aktor: "admin_pusat" as const, alasan: rejectAlasan.trim() }
                    const newPokja = { 
                      ...pokja, 
                      status: "butuh-perbaikan" as const,
                      alasanPenolakan: rejectAlasan.trim(),
                      tanggalDiverifikasi: today,
                      validasiLog: [...(pokja.validasiLog || []), newLog]
                    }
                    onSave(newPokja)
                  }}
                  disabled={!rejectAlasan.trim()}
                  className="flex-1 py-2.5 rounded-[4px] text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simpan Penolakan
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
