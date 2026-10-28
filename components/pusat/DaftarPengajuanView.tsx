"use client"
import { Search, MapPin, Clock, CheckCircle2, XCircle, AlertCircle, Filter, Building } from "lucide-react"
import { useState, useMemo } from "react"
import type { PokjaItem, PokjaStatus } from "@/types/pokja"
import { TablePagination } from "@/components/ui/table-pagination"

interface DaftarPengajuanViewProps {
  pokjaList: PokjaItem[]
  onSelect: (item: PokjaItem) => void
}

const STATUS_CONFIG: Record<PokjaStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  "belum-dibentuk": { label: "Belum Dibentuk", color: "text-[#2f3031]", bg: "bg-[#efefef]", icon: Building },
  "masih-diverifikasi": { label: "Perlu Diperiksa", color: "text-amber-950", bg: "bg-amber-200", icon: Clock },
  aktif: { label: "Aktif", color: "text-emerald-950", bg: "bg-emerald-300", icon: CheckCircle2 },
  "butuh-perbaikan": { label: "Perlu Perbaikan", color: "text-rose-950", bg: "bg-rose-100", icon: XCircle },
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
  const [itemsPerPage, setItemsPerPage] = useState(10)

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
      <div className="bg-white rounded-[4px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">Daftar Kelompok Kerja</h2>
            <p className="text-sm text-gray-500 tabular-nums">{filtered.length.toLocaleString("id-ID")} kelompok kerja</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari wilayah"
                className="w-full h-10 pl-9 pr-3 text-sm border border-gray-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange(e.target.value as PokjaStatus | "semua")}
              aria-label="Filter status"
              className="h-10 w-full px-3 text-sm border border-gray-300 rounded-[4px] bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400 border-t border-gray-200">
            <Search className="w-8 h-8" />
            <p className="text-sm">Tidak ada Kelompok Kerja ditemukan</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F1F1F1]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Wilayah</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Tanggal Diverifikasi</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Tanggal SK Selesai</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((p) => {
                const cfg = STATUS_CONFIG[p.effectiveStatus]
                const showSkEndDate = p.effectiveStatus === "aktif" || (p.effectiveStatus === "butuh-perbaikan" && p.expired)
                const showTanggalDiverifikasi = p.effectiveStatus === "aktif" || p.effectiveStatus === "masih-diverifikasi" || (p.effectiveStatus === "butuh-perbaikan" && p.expired)
                return (
                  <tr key={p.id} className="hover:bg-[#F9F9F9] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
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
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full whitespace-nowrap text-[13px] font-semibold ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <button
                        onClick={() => onSelect(p)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-[#F9F9F9] transition-colors whitespace-nowrap"
                      >
                        Cek Detail
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
            </div>
            <TablePagination
              total={filtered.length}
              halaman={currentPage}
              perHalaman={itemsPerPage}
              onHalaman={handlePageChange}
              onPerHalaman={(n) => { setItemsPerPage(n); setCurrentPage(1) }}
              satuan="Kelompok Kerja"
            />
          </>
        )}
      </div>
    </div>
  )
}
