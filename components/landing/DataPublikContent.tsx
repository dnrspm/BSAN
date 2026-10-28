"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  MapPin,
  Search,
  Download,
  X,
  Phone,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PROVINSI_DATA,
  type ProvinsiRow,
} from "@/data/provinsiData"
import { MOCK_PENGAJUAN, generateDummyPokja } from "@/data/mockPokja"
import { cn } from "@/lib/utils"
import { TablePagination } from "@/components/ui/table-pagination"


const ALL_BIDANG = ["Bidang Pendidikan", "Bidang Sosial", "Bidang Kesehatan", "Bidang PPPA", "Bidang Kominfo", "Bidang Dukbangga"]

function getBidangList(row: ProvinsiRow): string[] {
  if (row.pokjaId) {
    const pokja = MOCK_PENGAJUAN.find((p) => p.id === row.pokjaId)
    if (pokja) return pokja.members.map((m) => m.jabatan).filter((j) => j.startsWith("Bidang"))
  }
  if (row.bidangTersedia != null) return ALL_BIDANG.slice(0, row.bidangTersedia)
  return []
}

function statusBadge(status: ProvinsiRow["statusPokja"]) {
  const map: Record<ProvinsiRow["statusPokja"], { label: string; className: string }> = {
    "Aktif":           { label: "Aktif",           className: "bg-emerald-300 text-emerald-950 hover:bg-emerald-300" },
    "Perlu Diperiksa": { label: "Perlu Diperiksa", className: "bg-amber-200 text-amber-950 hover:bg-amber-200" },
    "Perlu Perbaikan": { label: "Perlu Perbaikan", className: "bg-rose-100 text-rose-950 hover:bg-rose-100" },
    "Belum Dibentuk":  { label: "Belum Dibentuk",  className: "bg-[#efefef] text-[#2f3031] hover:bg-[#efefef]" },
    "Belum Terbentuk": { label: "Belum Terbentuk", className: "bg-[#efefef] text-[#2f3031] hover:bg-[#efefef]" },
  }
  const { label, className } = map[status] ?? map["Belum Terbentuk"]
  return <Badge className={`border-transparent rounded-full px-2.5 py-0.5 text-[13px] font-semibold whitespace-nowrap ${className}`}>{label}</Badge>
}


function DetailModal({ row, onClose }: { row: ProvinsiRow; onClose: () => void }) {
  const pokja = row.pokjaId
    ? MOCK_PENGAJUAN.find((p) => p.id === row.pokjaId) ?? generateDummyPokja(row.no, row.provinsi, row.kontak)
    : generateDummyPokja(row.no, row.provinsi, row.kontak)
  const wilayah = row.provinsi.includes(" - ")
    ? `Kota ${row.provinsi.split(" - ")[1]}, ${row.provinsi.split(" - ")[0]}`
    : `Provinsi ${row.provinsi}`

  const waNumber = row.kontak
    ? `62${row.kontak.replace(/^0/, "")}`
    : pokja?.kanalPengaduan
    ? `62${pokja.kanalPengaduan.replace(/^0/, "")}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Kelompok Kerja</p>
            <h3 className="text-base font-bold text-slate-900">{wilayah}</h3>
          </div>
          <div className="flex items-center gap-3">
            {statusBadge(row.statusPokja)}
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-[4px] shrink-0">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">

          {/* SK Detail */}
          {pokja && (
            <div className="px-6 py-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Detail SK</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Nomor SK</p>
                  <p className="text-sm font-semibold text-slate-900">{pokja.nomorSK}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Tanggal Berlaku</p>
                  <p className="text-sm font-semibold text-slate-900">{pokja.periodeMulai}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Tanggal Berakhir</p>
                  <p className="text-sm font-semibold text-slate-900">{pokja.periodeSelesai}</p>
                </div>
              </div>
              <a
                href={`/sk/${pokja.skFileName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#808489] text-sm text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview SK — {pokja.skFileName}
              </a>
            </div>
          )}

          {/* Pengurus Kelompok Kerja */}
          {pokja && pokja.members.length > 0 && (
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pengurus Kelompok Kerja</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{row.bidangTersedia ?? pokja.members.filter(m => m.jabatan.startsWith("Bidang")).length} Bidang</span>
                  <span className="text-slate-300">·</span>
                  <span>{pokja.members.length} Pengurus</span>
                </div>
              </div>
              <div className="border border-[#D9DBDD] rounded-[4px] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#F1F1F1]">
                    <tr>
                      <th className="text-left text-xs text-slate-500 px-4 py-2.5 font-medium">Peran di Kelompok Kerja</th>
                      <th className="text-left text-xs text-slate-500 px-4 py-2.5 font-medium">Asal Instansi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pokja.members.map((m, i) => (
                      <tr key={i} className="border-t border-[#D9DBDD]">
                        <td className="px-4 py-2.5 text-slate-900 text-xs font-medium">
                          {m.jabatan.startsWith("Bidang") ? `Anggota ${m.jabatan}` : m.jabatan}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 text-xs">{m.instansi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 space-y-3">
          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Hubungi Layanan Pengaduan ({`0${waNumber.slice(2)}`})
            </a>
          )}
          
        </div>
      </div>
    </div>
  )
}

type DataPublikContentProps = {
  showBackButton?: boolean
  heroTitle?: string
  heroSubtitle?: string
  hideHeroPrefix?: boolean
}

export function DataPublikContent({ showBackButton = false, heroTitle, heroSubtitle, hideHeroPrefix = false }: DataPublikContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [showWilayahModal, setShowWilayahModal] = useState(false)
  const [selectedRow, setSelectedRow] = useState<ProvinsiRow | null>(null)
  const [statusFilter, setStatusFilter] = useState<ProvinsiRow["statusPokja"] | "Semua">("Aktif")
  // "all" | "provinsi_only" | exact r.provinsi value
  const [wilayahFilter, setWilayahFilter] = useState<string>("all")
  // modal-internal state
  const [modalPending, setModalPending] = useState<string>("all")
  const [modalBrowseProvince, setModalBrowseProvince] = useState<string | null>(null)

  useEffect(() => {
    const provinsi = searchParams.get("provinsi")
    const kota = searchParams.get("kota")
    const hanyaProvinsi = searchParams.get("hanya_provinsi")

    if (hanyaProvinsi === "true") {
      setWilayahFilter("provinsi_only")
    } else if (provinsi && kota) {
      setWilayahFilter(`${provinsi} - ${kota}`)
    } else if (provinsi) {
      setWilayahFilter(`semua_kab:${provinsi}`)
    }
  }, [searchParams])

  const PROVINSI_ONLY = useMemo(() => PROVINSI_DATA.filter(r => !r.provinsi.includes(" - ")), [])

  const provinceOnlyStats = useMemo(() => {
    const onlyProvinces = PROVINSI_ONLY
    const aktif = onlyProvinces.filter(p => p.statusPokja === "Aktif")
    const belum = onlyProvinces.filter(p => p.statusPokja === "Belum Dibentuk")
    const percentage = onlyProvinces.length > 0 
      ? Math.round((aktif.length / onlyProvinces.length) * 100) 
      : 0
    return {
      total: onlyProvinces.length,
      aktifCount: aktif.length,
      belumCount: belum.length,
      percentage,
      aktifList: aktif,
      belumList: belum,
    }
  }, [PROVINSI_ONLY])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return PROVINSI_DATA.filter((r) => {
      if (r.statusPokja === "Belum Terbentuk") return false
      if (!r.provinsi.toLowerCase().includes(q)) return false
      if (statusFilter !== "Semua" && r.statusPokja !== statusFilter) return false
      if (wilayahFilter === "all") return true
      if (wilayahFilter === "provinsi_only") return !r.provinsi.includes(" - ")
      if (wilayahFilter.startsWith("semua_kab:")) {
        const prov = wilayahFilter.slice("semua_kab:".length)
        return r.provinsi === prov || r.provinsi.startsWith(prov + " - ")
      }
      return r.provinsi === wilayahFilter
    })
  }, [search, statusFilter, wilayahFilter])

  const openWilayahModal = () => {
    setModalPending(wilayahFilter)
    if (wilayahFilter !== "all" && wilayahFilter !== "provinsi_only") {
      const provName = wilayahFilter.includes(" - ") ? wilayahFilter.split(" - ")[0] : wilayahFilter
      setModalBrowseProvince(provName)
    } else {
      setModalBrowseProvince(null)
    }
    setShowWilayahModal(true)
  }

  const applyWilayahFilter = () => {
    setWilayahFilter(modalPending)
    setPage(1)
    setShowWilayahModal(false)

    // Update URL with filter params
    const params = new URLSearchParams()
    if (modalPending === "provinsi_only") {
      params.set("hanya_provinsi", "true")
    } else if (modalPending.startsWith("semua_kab:")) {
      const prov = modalPending.slice("semua_kab:".length)
      params.set("provinsi", prov)
    } else if (modalPending.includes(" - ")) {
      const [prov, kota] = modalPending.split(" - ")
      params.set("provinsi", prov)
      params.set("kota", kota)
    }
    const queryString = params.toString()
    router.push(queryString ? `/kelompok-kerja?${queryString}` : "/kelompok-kerja")
  }

  const wilayahLabel = useMemo(() => {
    if (wilayahFilter === "all") return "Seluruh Indonesia"
    if (wilayahFilter === "provinsi_only") return "Hanya Tingkat Provinsi"
    if (wilayahFilter.startsWith("semua_kab:")) return `${wilayahFilter.slice("semua_kab:".length)} (semua kab/kota)`
    if (wilayahFilter.includes(" - ")) return `Kota/Kab ${wilayahFilter.split(" - ")[1]}`
    return `Provinsi ${wilayahFilter}`
  }, [wilayahFilter])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSearch = (v: string) => {
    setSearch(v)
    setPage(1)
    setStatusFilter("Semua")
  }

  const exportCSV = () => {
    const header = ["No", "Provinsi", "Status Kelompok Kerja", "Jml Kab/Kota", "Kelompok Kerja Kab/Kota", "Persentase"]
    const rows = PROVINSI_DATA.map((r) => [
      r.no,
      r.provinsi,
      r.statusPokja,
      r.jumlahKabKota,
      r.pokjaKabKota,
      `${r.persentase}%`,
    ])
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "data-kelompok-kerja-provinsi.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="pt-16">
        <div className="bg-[#C8F1F7]">
          <div className="max-w-6xl mx-auto px-4">
            {showBackButton && (
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors text-sm mb-6"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali ke Beranda
              </button>
            )}
            <div className="grid md:grid-cols-2 gap-8 items-end">
              <div className="pb-16 pt-16">
                {!hideHeroPrefix && <h1 className="text-sm md:text-base font-bold text-slate-800">Selamat Datang di</h1>}
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-1">{heroTitle ?? "Portal Budaya Sekolah Aman dan Nyaman (BSAN)"}</h1>
                <p className="mt-3 text-slate-700 text-base max-w-xl">
                  {heroSubtitle ?? "Lihat informasi pembentukan kelompok kerja BSAN beserta beragam informasi dan Sumber Dukungan di Daerah Anda."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-0 mb-16">
          <div className="flex items-center justify-end mt-8 mb-3">
            <p className="text-sm text-slate-400">
              Update terakhir: {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} | {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 [&>*]:w-full [&>*]:shrink-0 sm:[&>*]:w-[180px]">
            <div className="relative flex-1 min-w-[240px] sm:w-auto!">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Cari wilayah kelompok kerja"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-white w-full h-10 pl-9 pr-3 text-sm border border-[#808489] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 sm:w-[260px]!">
              <button
                onClick={openWilayahModal}
                className="h-10 min-w-0 flex-1 px-3 text-sm border border-[#808489] rounded-[4px] bg-white text-slate-700 hover:bg-[#F9F9F9] transition-colors flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="flex-1 truncate text-left">{wilayahLabel}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
              {wilayahFilter !== "all" && (
                <button
                  onClick={() => { setWilayahFilter("all"); setPage(1); router.push("/kelompok-kerja") }}
                  className="h-10 px-3 text-sm text-slate-500 hover:text-slate-800 border border-[#808489] rounded-[4px] bg-white hover:bg-[#F9F9F9] transition-colors shrink-0"
                >
                  Reset
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1) }}
              aria-label="Filter status"
              className="h-10 w-full px-3 text-sm border border-[#808489] rounded-[4px] bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Belum Dibentuk">Belum Dibentuk</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              className="h-10 gap-1.5 rounded-[4px] border-[#808489]"
            >
              <Download className="w-4 h-4" />
              Ekspor Excel
            </Button>
          </div>
          <div className="bg-white rounded-[4px] border border-[#D9DBDD] shadow-sm overflow-hidden">
            <Table className="text-sm table-fixed w-full">
              <TableHeader>
                <TableRow className="bg-[#F1F1F1] hover:bg-[#F1F1F1]">
                  <TableHead className="w-12 text-slate-500 text-xs font-semibold pl-5">No</TableHead>
                  <TableHead className="w-64 text-slate-500 text-xs font-semibold">Wilayah</TableHead>
                  <TableHead className="w-56 text-slate-500 text-xs font-semibold">Provinsi</TableHead>
                  <TableHead className="w-44 text-slate-500 text-xs font-semibold">Cakupan</TableHead>
                  <TableHead className="w-40 text-slate-500 text-xs font-semibold">Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((row, idx) => {
                  return (
                    <React.Fragment key={row.no}>
                      <TableRow className="group">
                        <TableCell className="text-slate-400 text-sm pl-5 font-medium">{(page - 1) * pageSize + idx + 1}</TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {row.provinsi.includes(" - ") ? `Kota ${row.provinsi.split(" - ")[1]}` : `Provinsi ${row.provinsi}`}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {row.provinsi.includes(" - ") ? row.provinsi.split(" - ")[0] : row.provinsi}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          <span className="text-sm text-slate-600">
                            {row.provinsi.includes(" - ") ? "Kota/Kabupaten" : "Provinsi"}
                          </span>
                        </TableCell>
                        <TableCell>{statusBadge(row.statusPokja)}</TableCell>
                        <TableCell>
                          {row.statusPokja === "Aktif" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRow(row)}
                              className="h-8 text-xs rounded-[4px] border-[#808489] bg-white text-gray-700 hover:bg-[#F9F9F9] hover:text-gray-700"
                            >
                              Cek Detail
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>

            <TablePagination
              total={filtered.length}
              halaman={page}
              perHalaman={pageSize}
              onHalaman={setPage}
              onPerHalaman={(n) => { setPageSize(n); setPage(1) }}
              opsiPerHalaman={[10, 20, 50]}
            />
          </div>
        </div>
      </div>

      {selectedRow && (
        <DetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}

      {/* Wilayah Modal */}
      {showWilayahModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowWilayahModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Filter Wilayah</h3>
              <button onClick={() => setShowWilayahModal(false)} className="p-1 hover:bg-gray-100 rounded-[4px]">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex h-full max-h-[420px]">
                {/* Left: provinces */}
                <div className="w-1/2 border-r border-gray-100 overflow-y-auto">
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={() => { setModalPending("all"); setModalBrowseProvince(null) }}
                      className={`w-full text-left px-3 py-2 rounded-[4px] text-sm font-medium transition-colors ${modalPending === "all" ? "bg-blue-50 text-blue-700" : "hover:bg-[#F9F9F9] text-gray-700"}`}
                    >
                      Seluruh Indonesia
                    </button>
                    <button
                      onClick={() => { setModalPending("provinsi_only"); setModalBrowseProvince(null) }}
                      className={`w-full text-left px-3 py-2 rounded-[4px] text-sm font-medium transition-colors ${modalPending === "provinsi_only" ? "bg-blue-50 text-blue-700" : "hover:bg-[#F9F9F9] text-gray-700"}`}
                    >
                      Hanya Tingkat Provinsi
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    {PROVINSI_ONLY.map((prov) => {
                      const isBrowsed = modalBrowseProvince === prov.provinsi
                      const isSelected = modalPending === prov.provinsi || (modalPending.includes(" - ") && modalPending.startsWith(prov.provinsi + " - "))
                      return (
                        <button
                          key={prov.provinsi}
                          onClick={() => { setModalBrowseProvince(prov.provinsi); setModalPending(prov.provinsi) }}
                          className={`w-full text-left px-3 py-2 rounded-[4px] text-sm flex items-center justify-between transition-colors ${
                            isBrowsed ? "bg-blue-50 text-blue-700 font-medium" : isSelected ? "bg-blue-50/50 text-blue-600" : "hover:bg-[#F9F9F9] text-gray-700"
                          }`}
                        >
                          <span className="truncate">{prov.provinsi}</span>
                          {isBrowsed && <svg className="w-3.5 h-3.5 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Right: kab/kota */}
                <div className="w-1/2 overflow-y-auto bg-[#F9F9F9]">
                  <div className="p-2 space-y-0.5">
                    {modalBrowseProvince ? (() => {
                      const kabRows = PROVINSI_DATA.filter(r => r.provinsi.startsWith(modalBrowseProvince + " - "))
                      const semuaKabValue = `semua_kab:${modalBrowseProvince}`
                      return (
                        <>
                          <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{modalBrowseProvince}</p>
                          <button
                            onClick={() => setModalPending(semuaKabValue)}
                            className={`w-full text-left px-3 py-2 rounded-[4px] text-sm font-medium transition-colors ${
                              modalPending === semuaKabValue ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100 text-gray-700"
                            }`}
                          >
                            Semua Kabupaten/Kota
                          </button>
                          {kabRows.length > 0 && <div className="border-t border-gray-100 my-1" />}
                          {kabRows.map((kab) => {
                            const kabName = kab.provinsi.split(" - ")[1]
                            const isSelected = modalPending === kab.provinsi
                            return (
                              <button
                                key={kab.provinsi}
                                onClick={() => setModalPending(kab.provinsi)}
                                className={`w-full text-left px-3 py-2 rounded-[4px] text-sm transition-colors ${
                                  isSelected ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100 text-gray-700"
                                }`}
                              >
                                {kabName}
                              </button>
                            )
                          })}
                        </>
                      )
                    })() : (
                      <p className="text-sm text-gray-400 p-4">Pilih provinsi di kiri untuk melihat kab/kota</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowWilayahModal(false)}
                className="px-4 py-2 rounded-[4px] text-sm font-medium text-gray-700 bg-[#F9F9F9] hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={applyWilayahFilter}
                disabled={modalBrowseProvince !== null && modalPending === modalBrowseProvince}
                className="px-4 py-2 rounded-[4px] text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
