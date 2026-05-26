"use client"
import { useState } from "react"
import {
  Phone,
  Search,
  Users,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ds/Button"
import { Badge } from "@/components/ds/Badge"
import type { PokjaItem, MemberField, RoleKey } from "@/types/pokja"
import { ALL_ROLES } from "@/types/pokja"

// Region untuk Dinas - hardcoded sesuai login
const REGION = "Provinsi Aceh"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_CONFIG = {
  "draf": { label: "Draf", variant: "neutral" as const, icon: Clock },
  "belum-dibentuk": { label: "Belum Dibentuk", variant: "neutral" as const, icon: Clock },
  "masih-diverifikasi": { label: "Perlu Diperiksa", variant: "warning" as const, icon: Clock },
  aktif: { label: "Aktif", variant: "success" as const, icon: CheckCircle2 },
  "butuh-perbaikan": { label: "Perlu Perbaikan", variant: "error" as const, icon: XCircle },
}

const ROLE_BADGE_MAP: Record<string, "informational" | "success" | "warning" | "neutral"> = {
  ketua: "informational",
  wakil: "success",
  koordinator: "warning",
  pendidikan: "neutral",
  pppa: "neutral",
  sosial: "neutral",
  kesehatan: "neutral",
  kominfo: "neutral",
  dukbangga: "neutral",
}

function toTableRows(members?: Record<RoleKey, MemberField>) {
  if (!members) return []
  return ALL_ROLES.map((r) => ({
    key: r.key as RoleKey,
    label: r.label,
    member: members[r.key as RoleKey] as MemberField,
  })).filter((row) => row.member && row.member.nama.trim() !== "")
}

const PAGE_SIZE = 8

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyStatePokja({ onBuatPokja }: { onBuatPokja: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-5">
        <Users className="w-9 h-9 text-blue-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">Belum Ada Kelompok Kerja</h3>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-6">
        Silakan mulai membuat dan mengajukan pembentukan Kelompok Kerja di wilayah Anda.
      </p>
      <Button color="blue" size="md" icon={PlusCircle} onClick={onBuatPokja}>
        Buat Kelompok Kerja
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail drawer for one Kelompok Kerja
// ---------------------------------------------------------------------------
function PokjaDetailDrawer({ pokja, onClose }: { pokja: PokjaItem; onClose: () => void }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const members = pokja.data?.members
  const rows = toTableRows(members)
  const filtered = rows.filter((r) =>
    [r.label, r.member.nama, r.member.email, r.member.instansi].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const statusCfg = STATUS_CONFIG[pokja.status]
  const sk = pokja.data?.sk
  const nomorKanal = pokja.data?.nomorKanal

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-gray-900">{pokja.nama}</h2>
              <Badge variant={statusCfg.variant} size="sm">{statusCfg.label}</Badge>
            </div>
            {sk?.nomorSK && (
              <p className="text-xs text-gray-500 mt-0.5">
                SK No. {sk.nomorSK}
                {sk.tanggalSK && ` — ${sk.tanggalSK}`}
                {sk.periodeSelesai && ` s.d. ${sk.periodeSelesai}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
            aria-label="Tutup"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Kanal Pengaduan */}
          {nomorKanal && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                      Nomor Kanal Pengaduan &amp; Aspirasi
                    </p>
                    <p className="text-base font-bold text-gray-900">{nomorKanal}</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/62${nomorKanal.replace(/^0/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors flex-shrink-0"
                >
                  <Phone className="w-3 h-3" />
                  Hubungi
                </a>
              </div>
            </div>
          )}

          {/* Members table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">
                Daftar Anggota
                <span className="ml-2 text-xs font-normal text-gray-400">({rows.length} anggota)</span>
              </h3>
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Cari nama, posisi"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center text-gray-400">
                <Users className="w-7 h-7 mb-2" />
                <p className="text-sm">Belum ada data anggota yang diisi.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Posisi / Peran", "Nama", "Email", "Jenis Kelamin", "Nomor HP", "Instansi"].map((col) => (
                          <th key={col} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginated.length > 0 ? paginated.map((row) => (
                        <tr key={row.key} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge variant={ROLE_BADGE_MAP[row.key] ?? "neutral"} size="sm">
                              {row.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{row.member.nama}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.member.email || "-"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-xs font-medium ${row.member.jenisKelamin === "Perempuan" ? "text-pink-600" : "text-blue-600"}`}>
                              {row.member.jenisKelamin || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-600">{row.member.noWhatsapp || "-"}</td>
                          <td className="px-4 py-3">
                            <p className="text-gray-600 max-w-[160px] truncate" title={row.member.instansi}>
                              {row.member.instansi || "-"}
                            </p>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                            Data tidak ditemukan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-500">
                      {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                        className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors">
                        <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-7 h-7 rounded text-xs font-medium transition-colors ${p === page ? "bg-blue-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                          {p}
                        </button>
                      ))}
                      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors">
                        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
interface DataPokjaViewProps {
  pokjaList: PokjaItem[]
  onBuatPokja: () => void
  onContinueDraft?: () => void
  isAdminPusat?: boolean
  onValidatePusat?: (pokja: PokjaItem) => void
  onPerbaikiPokja?: (pokja: PokjaItem) => void
}

export function DataPokjaView({ pokjaList, onBuatPokja, onContinueDraft, isAdminPusat, onValidatePusat, onPerbaikiPokja }: DataPokjaViewProps) {
  const [detailPokja, setDetailPokja] = useState<PokjaItem | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const filtered = pokjaList.filter((p) => {
    const ketua = p.data?.members?.ketua?.nama ?? ""
    const sk = p.data?.sk?.nomorSK ?? ""
    const q = search.toLowerCase()
    return (
      p.nama.toLowerCase().includes(q) ||
      ketua.toLowerCase().includes(q) ||
      sk.toLowerCase().includes(q)
    )
  })

  // Untuk admin Dinas: hanya lihat dari region mereka dan hanya 1 Kelompok Kerja
  const activePokjaList = !isAdminPusat
    ? pokjaList.filter(p => p.data.region === REGION && p.status !== "belum-dibentuk")
    : pokjaList

  // Untuk admin Dinas: selalu tampilkan detail view (hanya 1 Kelompok Kerja per region)
  const pokja = !isAdminPusat && activePokjaList.length > 0 ? activePokjaList[0] : null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Kelompok Kerja</h2>
        {/* Hanya tampilkan tombol buat Kelompok Kerja untuk admin pusat */}
        {isAdminPusat && (
          <Button color="blue" size="sm" icon={PlusCircle} onClick={onBuatPokja}>
            Buat Kelompok Kerja Baru
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {activePokjaList.length === 0 ? (
          <EmptyStatePokja onBuatPokja={onBuatPokja} />
        ) : pokja ? (
          /* Detail view untuk admin dinas yang punya 1 pokja */
          <div className="p-6 space-y-6 rounded-xl border border-gray-100 bg-white">
            {/* Header pokja */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-gray-100">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h3 className="text-2xl font-bold text-gray-900">{pokja.nama}</h3>
                  <Badge variant={STATUS_CONFIG[pokja.status].variant} size="md">
                    {STATUS_CONFIG[pokja.status].label}
                  </Badge>
                </div>
                {pokja.data?.region && (
                  <p className="text-sm text-gray-500">Wilayah: {pokja.data.region}</p>
                )}
              </div>
              {!isAdminPusat && pokja.status === "draf" && onContinueDraft && (
                <button
                  type="button"
                  onClick={onContinueDraft}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors flex-shrink-0"
                >
                  <Pencil className="w-4 h-4" />
                  Lanjutkan Pengisian
                </button>
              )}
              {!isAdminPusat && (pokja.status === "aktif" || pokja.status === "butuh-perbaikan") && (
                <button
                  type="button"
                  onClick={() => onPerbaikiPokja?.(pokja)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Kelompok Kerja
                </button>
              )}
            </div>

            {/* Banner penolakan — hanya tampil untuk admin dinas saat status butuh-perbaikan */}
            {!isAdminPusat && pokja.status === "butuh-perbaikan" && (() => {
              const logTolak = [...(pokja.validasiLog ?? [])].reverse().find(l => l.aksi === "tolak")
              return (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-800 mb-1">Pengajuan Ditolak oleh Admin Pusat</p>
                      {logTolak?.alasan && (
                        <p className="text-sm text-red-700 bg-red-100 rounded-lg px-3 py-2 border border-red-200">
                          <span className="font-medium">Alasan: </span>{logTolak.alasan}
                        </p>
                      )}
                      {!logTolak?.alasan && (
                        <p className="text-sm text-red-600">Silakan perbaiki data Kelompok Kerja Anda dan ajukan kembali.</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onPerbaikiPokja?.(pokja)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Perbaiki Kelompok Kerja
                    </button>
                  </div>
                </div>
              )
            })()}

            {/* Grid info utama — warna mengikuti status */}
            {(() => {
              const cardColor = {
                "draf":               { bg: "from-gray-50 to-gray-100/50",     border: "border-gray-200",   icon: "bg-gray-500",   label: "text-gray-600"   },
                "masih-diverifikasi": { bg: "from-amber-50 to-amber-100/50",   border: "border-amber-200",  icon: "bg-amber-500",  label: "text-amber-700"  },
                "aktif":              { bg: "from-green-50 to-green-100/50",   border: "border-green-200",  icon: "bg-green-600",  label: "text-green-700"  },
                "butuh-perbaikan":    { bg: "from-red-50 to-red-100/50",       border: "border-red-200",    icon: "bg-red-500",    label: "text-red-700"    },
                "belum-dibentuk":     { bg: "from-gray-50 to-gray-100/50",     border: "border-gray-200",   icon: "bg-gray-400",   label: "text-gray-600"   },
              }[pokja.status] ?? { bg: "from-gray-50 to-gray-100/50", border: "border-gray-200", icon: "bg-gray-400", label: "text-gray-600" }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ketua Kelompok Kerja */}
                  <div className={`bg-gradient-to-br ${cardColor.bg} rounded-xl p-4 border ${cardColor.border}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${cardColor.icon} flex items-center justify-center flex-shrink-0`}>
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${cardColor.label} uppercase tracking-wide mb-1`}>Ketua Kelompok Kerja</p>
                        {pokja.data?.members?.ketua?.nama ? (
                          <>
                            <p className="text-base font-bold text-gray-900 truncate">{pokja.data.members.ketua.nama}</p>
                            {pokja.data.members.ketua.instansi && (
                              <p className="text-xs text-gray-600 mt-0.5 truncate">{pokja.data.members.ketua.instansi}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm font-medium text-gray-400">Data belum diinput</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Total Anggota */}
                  <div className={`bg-gradient-to-br ${cardColor.bg} rounded-xl p-4 border ${cardColor.border}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${cardColor.icon} flex items-center justify-center flex-shrink-0`}>
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-semibold ${cardColor.label} uppercase tracking-wide mb-1`}>Total Anggota</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {pokja.data?.members ? Object.values(pokja.data.members).filter(m => m && m.nama?.trim()).length : 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Nomor SK */}
                  <div className={`bg-gradient-to-br ${cardColor.bg} rounded-xl p-4 border ${cardColor.border}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${cardColor.icon} flex items-center justify-center flex-shrink-0`}>
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${cardColor.label} uppercase tracking-wide mb-1`}>Nomor SK</p>
                        {pokja.data?.sk?.nomorSK ? (
                          <>
                            <p className="text-sm font-bold text-gray-900 truncate">{pokja.data.sk.nomorSK}</p>
                            {(pokja.data.sk.tanggalSK || pokja.data.sk.periodeSelesai) && (
                              <p className="text-xs text-gray-600 mt-0.5">
                                {pokja.data.sk.tanggalSK && `Tgl: ${pokja.data.sk.tanggalSK}`}
                                {pokja.data.sk.tanggalSK && pokja.data.sk.periodeSelesai && " — "}
                                {pokja.data.sk.periodeSelesai && `s.d. ${pokja.data.sk.periodeSelesai}`}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm font-medium text-gray-400">Data belum diinput</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Kanal Pengaduan */}
                  <div className={`bg-gradient-to-br ${cardColor.bg} rounded-xl p-4 border ${cardColor.border}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${cardColor.icon} flex items-center justify-center flex-shrink-0`}>
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${cardColor.label} uppercase tracking-wide mb-1`}>Kanal Pengaduan &amp; Aspirasi</p>
                        {pokja.data?.nomorKanal ? (
                          <p className="text-base font-bold text-gray-900">{pokja.data.nomorKanal}</p>
                        ) : (
                          <p className="text-sm font-medium text-gray-400">Data belum diinput</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Daftar Anggota */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-base font-bold text-gray-800">
                  Daftar Anggota Kelompok Kerja
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({pokja.data?.members ? toTableRows(pokja.data.members).length : 0} anggota)
                  </span>
                </h3>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    placeholder="Cari nama, posisi"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              {(() => {
                const rows = toTableRows(pokja.data?.members)
                const filteredRows = rows.filter((r) =>
                  [r.label, r.member.nama, r.member.email, r.member.instansi].some((v) =>
                    v.toLowerCase().includes(search.toLowerCase())
                  )
                )
                const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
                const paginatedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

                return rows.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center text-gray-400">
                    <Users className="w-8 h-8 mb-2" />
                    <p className="text-sm">Belum ada data anggota yang diisi.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            {["Posisi / Peran", "Nama", "Email", "Jenis Kelamin", "Nomor HP", "Instansi"].map((col) => (
                              <th key={col} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {paginatedRows.length > 0 ? paginatedRows.map((row) => (
                            <tr key={row.key} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <Badge variant={ROLE_BADGE_MAP[row.key] ?? "neutral"} size="sm">
                                  {row.label}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{row.member.nama}</td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.member.email || "-"}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`text-xs font-medium ${row.member.jenisKelamin === "Perempuan" ? "text-pink-600" : "text-blue-600"}`}>
                                  {row.member.jenisKelamin || "-"}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-600">{row.member.noWhatsapp || "-"}</td>
                              <td className="px-4 py-3">
                                <p className="text-gray-600 max-w-[200px] truncate" title={row.member.instansi}>
                                  {row.member.instansi || "-"}
                                </p>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                                Data tidak ditemukan.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                        <p className="text-xs text-gray-500">
                          {Math.min((page - 1) * PAGE_SIZE + 1, filteredRows.length)}–{Math.min(page * PAGE_SIZE, filteredRows.length)} dari {filteredRows.length}
                        </p>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                            className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors">
                            <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button key={p} onClick={() => setPage(p)}
                              className={`w-7 h-7 rounded text-xs font-medium transition-colors ${p === page ? "bg-blue-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                              {p}
                            </button>
                          ))}
                          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors">
                            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Riwayat Aktivitas */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <h3 className="text-base font-bold text-gray-800">Riwayat Aktivitas</h3>
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
                        const cfg = aksiConfig[log.aksi] ?? { label: log.aksi, color: "text-gray-700 bg-gray-50 border-gray-200", dot: "bg-gray-400" }
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
                                <p className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-2 mt-1 border border-gray-100">
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
          </div>
        ) : (
          <>
            {/* Search bar */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-700">{pokjaList.length}</span> Kelompok Kerja terdaftar
              </p>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama kelompok kerja, ketua, SK"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["No", "Nama Kelompok Kerja", "Wilayah", "Jumlah Anggota", "Ketua Kelompok Kerja", "Nomor SK", "Kontak Kelompok Kerja", "Status", "Aksi"].map((col) => (
                      <th key={col} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length > 0 ? filtered.map((pokja, idx) => {
                    const cfg = STATUS_CONFIG[pokja.status]
                    const safeData = pokja.data ?? null
                    const ketua = safeData?.members?.ketua ?? null
                    const sk = safeData?.sk ?? null
                    const kanal = safeData?.nomorKanal ?? null
                    const regionName = safeData?.region ?? null

                    return (
                      <tr key={pokja.id} className="hover:bg-gray-50 transition-colors">
                        {/* No */}
                        <td className="px-4 py-3.5 text-gray-400 text-xs w-10">{idx + 1}</td>

                        {/* Nama Kelompok Kerja */}
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-gray-900 whitespace-nowrap">{pokja.nama}</p>
                        </td>

                        {/* Wilayah */}
                        <td className="px-4 py-3.5">
                          {regionName ? (
                            <span className="text-gray-700">{regionName}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Jumlah Anggota */}
                        <td className="px-4 py-3.5">
                          {safeData?.members ? (
                            <span className="text-gray-700">{Object.values(safeData.members).filter(m => m && m.nama?.trim()).length} orang</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Ketua Kelompok Kerja */}
                        <td className="px-4 py-3.5">
                          {ketua?.nama ? (
                            <div>
                              <p className="font-medium text-gray-900 whitespace-nowrap">{ketua.nama}</p>
                              {ketua.instansi && (
                                <p className="text-xs text-gray-400 truncate max-w-[160px]">{ketua.instansi}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Nomor SK */}
                        <td className="px-4 py-3.5">
                          {sk?.nomorSK ? (
                            <div className="flex items-start gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-gray-800 whitespace-nowrap font-medium">{sk.nomorSK}</p>
                                {sk.periodeSelesai && (
                                  <p className="text-xs text-gray-400">s.d. {sk.periodeSelesai}</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Kontak Kelompok Kerja */}
                        <td className="px-4 py-3.5">
                          {kanal ? (
                            <a
                              href={`https://wa.me/62${kanal.replace(/^0/, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-green-700 font-medium hover:text-green-800 whitespace-nowrap"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              {kanal}
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isAdminPusat && pokja.status === "masih-diverifikasi" ? (
                            <button
                              onClick={() => onValidatePusat?.(pokja)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Periksa
                            </button>
                          ) : (
                            <button
                              onClick={() => setDetailPokja(pokja)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Cek Detail
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                        Data tidak ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Detail Drawer */}
      {detailPokja && (
        <PokjaDetailDrawer pokja={detailPokja} onClose={() => setDetailPokja(null)} />
      )}
    </div>
  )
}
