"use client"
import { Search, X, MapPin, AlertCircle, Filter, FileText } from "lucide-react"
import { useState, useMemo } from "react"
import type { PokjaItem, PokjaStatus, Members } from "@/types/pokja"
import { PIMPINAN_ROLES, BIDANG_ROLES } from "@/types/pokja"
import { Badge } from "@/components/ds/Badge"

interface BpmpPokjaViewProps {
  pokjaList: PokjaItem[]
  provinsi: string
  kabKotaList: string[]
}

const STATUS_CONFIG: Record<PokjaStatus, { label: string; variant: "neutral" | "warning" | "success" | "critical" }> = {
  "belum-dibentuk": { label: "Belum Dibentuk", variant: "neutral" },
  "masih-diverifikasi": { label: "Perlu Diperiksa", variant: "warning" },
  aktif: { label: "Aktif", variant: "success" },
  "butuh-perbaikan": { label: "Perlu Perbaikan", variant: "critical" },
  draf: { label: "Draf", variant: "neutral" },
}

const STATUS_FILTER_OPTIONS: { value: PokjaStatus | "semua"; label: string }[] = [
  { value: "semua", label: "Semua Status" },
  { value: "belum-dibentuk", label: "Belum Dibentuk" },
  { value: "masih-diverifikasi", label: "Perlu Diperiksa" },
  { value: "aktif", label: "Aktif" },
  { value: "butuh-perbaikan", label: "Perlu Perbaikan" },
]

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value || "-"}</span>
    </div>
  )
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

function isSkExpired(periodeSelesai: string): boolean {
  if (!periodeSelesai) return false
  const today = new Date()
  return new Date(periodeSelesai) < today
}

function inScope(p: PokjaItem, provinsi: string, kabKotaList: string[]): boolean {
  const region = p.data?.region ?? p.nama
  const clean = region.replace(/^Prov\.\s*/i, "").replace(/^Provinsi\s*/i, "").trim()
  // Kabupaten/kota (format "Provinsi - Kab/Kota") atau provinsi itu sendiri
  if (clean === provinsi) return true
  if (clean.includes(" - ")) {
    const [prov] = clean.split(" - ").map((s) => s.trim())
    if (prov !== provinsi) return false
    const kab = clean.split(" - ").pop()!.trim()
    return kabKotaList.includes(kab)
  }
  return false
}

export function BpmpPokjaView({ pokjaList, provinsi, kabKotaList }: BpmpPokjaViewProps) {
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<PokjaStatus | "semua">("semua")
  const [detailPokja, setDetailPokja] = useState<PokjaItem | null>(null)

  const scoped = useMemo(() => {
    return pokjaList.filter((p) => inScope(p, provinsi, kabKotaList)).filter((p) => p.status !== "draf")
  }, [pokjaList, provinsi, kabKotaList])

  const processed = useMemo(() => {
    const existingRegions = new Set(
      scoped.map((p) => (p.data?.region ?? p.nama).trim().toLowerCase())
    )

    const placeholders: PokjaItem[] = kabKotaList
      .filter((kab) => !existingRegions.has(kab.trim().toLowerCase()))
      .map((kab) => ({
        id: `placeholder-${kab}`,
        nama: kab,
        status: "belum-dibentuk" as PokjaStatus,
        validasiLog: [],
        data: {
          region: kab,
          nomorKanal: "",
          members: {} as Members,
          sk: { file: null, nomorSK: "", tanggalSK: "", periodeMultai: "", periodeSelesai: "" },
          consent: false,
        },
      }))

    return [...scoped, ...placeholders].map((p) => {
      const expired = isSkExpired(p.data?.sk?.periodeSelesai || "")
      const effectiveStatus: PokjaStatus = expired && (p.status === "aktif" || p.status === "butuh-perbaikan") ? "butuh-perbaikan" : p.status
      return { ...p, effectiveStatus }
    })
  }, [scoped, kabKotaList])

  const filtered = useMemo(() => {
    return processed
      .filter((p) => {
        const q = search.toLowerCase()
        const region = (p.data?.region ?? p.nama).toLowerCase()
        const matchSearch = region.includes(q)
        const matchStatus = filterStatus === "semua" || p.effectiveStatus === filterStatus
        return matchSearch && matchStatus
      })
      .sort((a, b) => {
        const aIsProvinsi = (a.data?.region ?? a.nama).replace(/^Prov\.\s*/i, "").replace(/^Provinsi\s*/i, "").trim() === provinsi
        const bIsProvinsi = (b.data?.region ?? b.nama).replace(/^Prov\.\s*/i, "").replace(/^Provinsi\s*/i, "").trim() === provinsi
        if (aIsProvinsi && !bIsProvinsi) return -1
        if (!aIsProvinsi && bIsProvinsi) return 1
        const nameA = (a.data?.region ?? a.nama).replace(/^Prov\.\s*/i, "")
        const nameB = (b.data?.region ?? b.nama).replace(/^Prov\.\s*/i, "")
        return nameA.localeCompare(nameB, "id")
      })
  }, [processed, search, filterStatus, provinsi])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Kelompok Kerja</h2>
        <p className="text-sm text-gray-500 mt-0.5">Daftar Kelompok Kerja di {provinsi}</p>
      </div>

      {detailPokja && (() => {
        const statusCfg = STATUS_CONFIG[detailPokja.status]
        const members = detailPokja.data?.members as Members | undefined
        return (
          <>
            <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setDetailPokja(null)} />
            <div className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl bg-white shadow-2xl flex flex-col">
              <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-gray-900">{detailPokja.nama}</h2>
                    <Badge variant={statusCfg.variant} size="sm">{statusCfg.label}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{detailPokja.data?.region}</p>
                </div>
                <button onClick={() => setDetailPokja(null)} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {(detailPokja.status === "butuh-perbaikan" || detailPokja.status === "aktif") && detailPokja.alasanPenolakan && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Alasan Perlu Perbaikan</p>
                    </div>
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-medium text-red-800">{detailPokja.alasanPenolakan}</p>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Informasi Dasar</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 grid grid-cols-2 gap-4">
                    <ReviewRow label="Wilayah" value={detailPokja.nama} />
                    <ReviewRow label="Nomor Kanal Pengaduan" value={detailPokja.data?.nomorKanal || "-"} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Dokumen SK</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 grid grid-cols-2 gap-4">
                    <ReviewRow label="Nomor SK" value={detailPokja.data?.sk?.nomorSK || "-"} />
                    <ReviewRow label="Tanggal SK" value={detailPokja.data?.sk?.tanggalSK ? formatDate(detailPokja.data.sk.tanggalSK) : "-"} />
                    <ReviewRow label="Periode" value={
                      detailPokja.data?.sk?.periodeMultai && detailPokja.data?.sk?.periodeSelesai
                        ? `${detailPokja.data.sk.periodeMultai} s/d ${detailPokja.data.sk.periodeSelesai}`
                        : "-"
                    } />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Susunan Pengurus</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Jabatan pada Instansi</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Nama</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Email</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Nomor HP</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Instansi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {PIMPINAN_ROLES.map((r) => {
                          const m = members?.[r.key]
                          const isEmpty = !m?.nama
                          return (
                            <tr key={r.key} className={isEmpty ? "bg-gray-50" : ""}>
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
                            <tr key={r.key} className={isEmpty ? "bg-gray-50" : ""}>
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

                {detailPokja.validasiLog && detailPokja.validasiLog.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <p className="text-sm font-bold text-gray-800">Riwayat Aktivitas</p>
                      <span className="text-sm font-normal text-gray-400">({detailPokja.validasiLog.length} log)</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {[...detailPokja.validasiLog].reverse().map((log, idx) => {
                        const aksiConfig: Record<string, { label: string; color: string; dot: string }> = {
                          pengajuan:  { label: "Pengajuan",          color: "text-blue-700 bg-blue-50 border-blue-200",       dot: "bg-blue-500" },
                          terima:     { label: "Diterima",           color: "text-green-700 bg-green-50 border-green-200",    dot: "bg-green-500" },
                          aktivasi:   { label: "Diaktivasi",         color: "text-green-700 bg-green-50 border-green-200",    dot: "bg-green-500" },
                          tolak:      { label: "Ditolak",            color: "text-red-700 bg-red-50 border-red-200",          dot: "bg-red-500" },
                          perbaiki:   { label: "Perbaikan Diajukan", color: "text-amber-700 bg-amber-50 border-amber-200",    dot: "bg-amber-500" },
                          edit:       { label: "Data Diperbarui",    color: "text-indigo-700 bg-indigo-50 border-indigo-200", dot: "bg-indigo-500" },
                          sk_expired: { label: "SK Kedaluwarsa",     color: "text-orange-700 bg-orange-50 border-orange-200", dot: "bg-orange-500" },
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
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )
      })()}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari wilayah"
            className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as PokjaStatus | "semua")}
            className="h-9 pl-9 pr-8 text-sm border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition text-gray-700"
          >
            {STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <Search className="w-8 h-8" />
            <p className="text-sm">Tidak ada Kelompok Kerja ditemukan</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Wilayah</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Tanggal Diverifikasi</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Tanggal SK Selesai</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => {
                const cfg = STATUS_CONFIG[p.effectiveStatus]
                const region = p.data?.region ?? p.nama
                const isProvinsi = region.replace(/^Prov\.\s*/i, "").replace(/^Provinsi\s*/i, "").trim() === provinsi
                const periodeSelesai = p.data?.sk?.periodeSelesai || ""
                const expired = isSkExpired(periodeSelesai)
                const showSkEndDate = p.effectiveStatus === "aktif" || (p.effectiveStatus === "butuh-perbaikan" && expired)
                const showTanggalDiverifikasi = p.effectiveStatus === "aktif" || p.effectiveStatus === "masih-diverifikasi" || (p.effectiveStatus === "butuh-perbaikan" && expired)
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{region}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{isProvinsi ? "Provinsi" : "Kabupaten/Kota"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-gray-500 hidden sm:table-cell">
                      {showTanggalDiverifikasi && p.tanggalDiverifikasi ? formatDate(p.tanggalDiverifikasi) : "-"}
                    </td>
                    <td className="px-3 py-3.5 text-gray-500 hidden md:table-cell">
                      {showSkEndDate && periodeSelesai ? (
                        <span className={expired ? "text-red-600 font-medium" : ""}>
                          {formatDate(periodeSelesai)}
                          {expired && <AlertCircle className="w-3 h-3 inline ml-1 text-red-500" />}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-3 py-3.5">
                      <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <button
                        onClick={() => setDetailPokja(p)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        {p.effectiveStatus === "masih-diverifikasi" ? "Periksa" : "Cek Detail"}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 text-right">Menampilkan {filtered.length} Kelompok Kerja</p>
    </div>
  )
}
