"use client"
import { Search, MapPin, Clock, CheckCircle2, XCircle, AlertCircle, Filter, Building } from "lucide-react"
import { useState, useMemo } from "react"
import type { PokjaItem, PokjaStatus } from "@/types/pokja"

interface DaftarPengajuanViewProps {
  pokjaList: PokjaItem[]
  onSelect: (item: PokjaItem) => void
}

const STATUS_CONFIG: Record<PokjaStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  "belum-dibentuk": { label: "Belum Dibentuk", color: "text-gray-700", bg: "bg-gray-50 border-gray-200", icon: Building },
  "masih-diverifikasi": { label: "Perlu Diperiksa", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  aktif: { label: "Aktif", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  "butuh-perbaikan": { label: "Perlu Perbaikan", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle },
}

const STATUS_FILTER_OPTIONS: { value: PokjaStatus | "semua"; label: string }[] = [
  { value: "semua", label: "Semua Status" },
  { value: "belum-dibentuk", label: "Belum Dibentuk" },
  { value: "masih-diverifikasi", label: "Perlu Diperiksa" },
  { value: "aktif", label: "Aktif" },
  { value: "butuh-perbaikan", label: "Perlu Perbaikan" },
]


function isSkExpired(periodeSelesai: string): boolean {
  if (!periodeSelesai) return false
  const today = new Date()
  const expiry = new Date(periodeSelesai)
  return expiry < today
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

export function DaftarPengajuanView({ pokjaList, onSelect }: DaftarPengajuanViewProps) {
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<PokjaStatus | "semua">("semua")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (value: PokjaStatus | "semua") => {
    setFilterStatus(value)
    setCurrentPage(1)
  }

  const processedPokja = useMemo(() => {
    return pokjaList.map(p => {
      const periodeSelesai = p.data?.sk?.periodeSelesai || ""
      const expired = isSkExpired(periodeSelesai)
      const effectiveStatus: PokjaStatus = expired && (p.status === "aktif" || p.status === "butuh-perbaikan") ? "butuh-perbaikan" : p.status
      return { ...p, effectiveStatus, expired, periodeSelesai, tanggalDiverifikasi: p.tanggalDiverifikasi }
    })
  }, [pokjaList])

  const filtered = processedPokja
    .filter((p) => {
      const matchSearch = p.nama.toLowerCase().includes(search.toLowerCase()) ||
                          p.data?.region?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = (filterStatus === "semua" || p.effectiveStatus === filterStatus) && p.effectiveStatus !== "draf"
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      const nameA = (a.data?.region ?? a.nama).replace(/^Prov\.\s*/i, "")
      const nameB = (b.data?.region ?? b.nama).replace(/^Prov\.\s*/i, "")
      return nameA.localeCompare(nameB, "id")
    })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kelompok Kerja</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola data Kelompok Kerja di seluruh Indonesia</p>
        </div>
      </div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari wilayah"
            className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => handleFilterChange(e.target.value as PokjaStatus | "semua")}
            className="h-9 pl-9 pr-8 text-sm border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition text-gray-700"
          >
            {STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
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
              {paginatedData.map((p) => {
                const cfg = STATUS_CONFIG[p.effectiveStatus]
                const Icon = cfg.icon
                const showSkEndDate = p.effectiveStatus === "aktif" || (p.effectiveStatus === "butuh-perbaikan" && p.expired)
                const showTanggalDiverifikasi = p.effectiveStatus === "aktif" || p.effectiveStatus === "masih-diverifikasi" || (p.effectiveStatus === "butuh-perbaikan" && p.expired)
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">
                            {(p.data?.region ?? p.nama).replace(/^Prov\.\s*/i, "")}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">Provinsi</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-gray-500 hidden sm:table-cell">
                      {showTanggalDiverifikasi && p.tanggalDiverifikasi ? formatDate(p.tanggalDiverifikasi) : "-"}
                    </td>
                    <td className="px-3 py-3.5 text-gray-500 hidden md:table-cell">
                      {showSkEndDate && p.periodeSelesai ? (
                        <span className={p.expired ? "text-red-600 font-medium" : ""}>
                          {formatDate(p.periodeSelesai)}
                          {p.expired && <AlertCircle className="w-3 h-3 inline ml-1 text-red-500" />}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <button
                        onClick={() => onSelect(p)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} dari {filtered.length} Kelompok Kerja
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {totalPages <= 1 && (
        <p className="text-xs text-gray-400 text-right">Menampilkan {filtered.length} dari {pokjaList.length} Kelompok Kerja</p>
      )}
    </div>
  )
}
