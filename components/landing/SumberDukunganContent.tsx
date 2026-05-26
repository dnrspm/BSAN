"use client"

import React, { useState, useMemo } from "react"
import { Search, Globe, ChevronLeft, ChevronRight, X, ChevronDown, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  KATEGORI_CONFIG,
  PENYEDIA_CONFIG,
  SEED,
  type SumberRujukan,
  type KategoriDukungan,
  type KategoriPenyedia,
} from "@/components/dashboard/SumberRujukanView"

const PAGE_SIZE = 20

const VERIFIED_DATA: SumberRujukan[] = SEED.filter((i) => i.status === "terverifikasi")

const KATEGORI_KEYS: KategoriDukungan[] = [
  "Fasilitas Kesehatan", "Konseling", "Bantuan Hukum", "Kepolisian",
  "Psikologi", "Pendidikan", "Sosial", "Lainnya",
]

const PENYEDIA_OPTIONS: KategoriPenyedia[] = [
  "Pemerintah Pusat", "Pemerintah Daerah", "Swasta", "OMS", "Lainnya",
]

const PROVINSI_LIST = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau",
  "Jambi", "Bengkulu", "Sumatera Selatan", "Kepulauan Bangka Belitung", "Lampung",
  "DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur",
  "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
  "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat", "Sulawesi Selatan", "Sulawesi Tenggara",
  "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur",
  "Maluku", "Maluku Utara", "Papua Barat", "Papua",
]

type FilterWilayah = { province: string; kabupaten: string } | null

type SumberDukunganContentProps = {
  hideHeroPrefix?: boolean
}

const NASIONAL_WILAYAH = "Nasional"

export function SumberDukunganContent({ hideHeroPrefix = false }: SumberDukunganContentProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filterKategori, setFilterKategori] = useState<KategoriDukungan | "semua">("semua")
  const [filterPenyedia, setFilterPenyedia] = useState<KategoriPenyedia | "semua">("Pemerintah Pusat")
  const [filterWilayah, setFilterWilayah] = useState<FilterWilayah | null>(null)
  const [showAllData, setShowAllData] = useState(false)
  const [showWilayahModal, setShowWilayahModal] = useState(false)
  const [modalBrowseProvinsi, setModalBrowseProvinsi] = useState<string | null>(null)
  const [modalPendingFilter, setModalPendingFilter] = useState<FilterWilayah | "all">("all")
  const [modalPendingShowAll, setModalPendingShowAll] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SumberRujukan | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return VERIFIED_DATA.filter((item) => {
      const matchSearch =
        q === "" ||
        item.namaInstansi.toLowerCase().includes(q) ||
        item.kabupatenKota.toLowerCase().includes(q) ||
        item.provinsi.toLowerCase().includes(q)
      const matchKategori = filterKategori === "semua" || item.kategoriBentukDukungan === filterKategori
      const matchPenyedia = filterPenyedia === "semua" || item.kategoriPenyedia === filterPenyedia
      const matchWilayah = (() => {
        const isNasional = (item.provinsi === NASIONAL_WILAYAH || item.provinsi === "Seluruh Indonesia") && (item.kabupatenKota === NASIONAL_WILAYAH || item.kabupatenKota === "Seluruh Indonesia")
        if (showAllData) return true
        if (!filterWilayah) return isNasional
        if (filterWilayah.kabupaten) {
          return filterWilayah.province === item.provinsi && filterWilayah.kabupaten === item.kabupatenKota
        }
        return filterWilayah.province === item.provinsi
      })()
      return matchSearch && matchKategori && matchPenyedia && matchWilayah
    })
  }, [search, filterKategori, filterPenyedia, filterWilayah, showAllData])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const paged = filtered.slice(startIndex, startIndex + pageSize)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const openWilayahModal = () => {
    setModalPendingFilter(filterWilayah ?? "all")
    setModalBrowseProvinsi(filterWilayah?.province ?? null)
    setModalPendingShowAll(showAllData)
    setShowWilayahModal(true)
  }

  const applyWilayahFilter = () => {
    const isNasionalDefault = modalPendingFilter === null && !modalPendingShowAll
    setFilterWilayah(modalPendingFilter === "all" ? null : modalPendingFilter)
    setShowAllData(modalPendingShowAll)
    if (!isNasionalDefault) {
      setFilterPenyedia("semua")
    }
    setPage(1)
    setShowWilayahModal(false)
  }

  const wilayahLabel = filterWilayah
    ? filterWilayah.kabupaten
      ? filterWilayah.kabupaten
      : filterWilayah.province
    : showAllData ? "Seluruh Indonesia" : "Nasional"

  const kabupatenForModal = modalBrowseProvinsi
    ? Array.from(new Set(VERIFIED_DATA.filter((i) => i.provinsi === modalBrowseProvinsi).map((i) => i.kabupatenKota)))
        .filter(Boolean)
        .sort()
    : []

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="pt-16">
        {/* Hero */}
        <div className="bg-[#C8F1F7]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-end">
              <div className="pb-16 pt-16">
                {!hideHeroPrefix && <h1 className="text-sm md:text-base font-bold text-slate-800">Informasi &amp; Referensi</h1>}
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-1">Sumber Dukungan BSAN</h1>
                <p className="mt-3 text-slate-700 text-base max-w-xl">
                  Daftar kontak layanan untuk membangun lingkungan sekolah yang aman, nyaman, dan inklusif.
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
          {/* Table card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Filter bar */}
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900 shrink-0">Data Sumber Dukungan</h2>
                <button
                  onClick={openWilayahModal}
                  className="h-8 px-3 text-sm border border-slate-400 rounded-lg bg-white text-slate-800 font-medium hover:bg-slate-50 hover:border-slate-500 transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="max-w-[200px] truncate">{wilayahLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
                {(filterWilayah !== null || filterPenyedia !== "Pemerintah Pusat" || showAllData) ? (
                  <button
                    onClick={() => { setFilterWilayah(null); setShowAllData(false); setFilterPenyedia("Pemerintah Pusat"); setPage(1) }}
                    className="h-8 px-3 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors shrink-0"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <select
                  value={filterKategori}
                  onChange={(e) => { setFilterKategori(e.target.value as KategoriDukungan | "semua"); setPage(1) }}
                  className="h-9 px-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white text-slate-700 shrink-0"
                >
                  <option value="semua">Semua Kategori</option>
                  {KATEGORI_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <select
                  value={filterPenyedia}
                  onChange={(e) => { setFilterPenyedia(e.target.value as KategoriPenyedia | "semua"); setPage(1) }}
                  className="h-9 px-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white text-slate-700 shrink-0"
                >
                  <option value="semua">Semua Penyedia</option>
                  {PENYEDIA_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <div className="relative flex-1 sm:flex-none sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari instansi atau kota"
                    value={search}
                    onChange={handleSearchChange}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-gray-700 text-sm">Tidak ada sumber dukungan ditemukan</p>
                <p className="text-gray-500 text-xs mt-1">Coba ubah filter, wilayah, atau kata kunci pencarian.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama Instansi</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Wilayah</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori Dukungan</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paged.map((item, idx) => {
                        const kategoriCfg = KATEGORI_CONFIG[item.kategoriBentukDukungan]
                        const penyediaCfg = item.kategoriPenyedia ? PENYEDIA_CONFIG[item.kategoriPenyedia] : null
const isNasional = (item.provinsi === NASIONAL_WILAYAH || item.provinsi === "Seluruh Indonesia") && (item.kabupatenKota === NASIONAL_WILAYAH || item.kabupatenKota === "Seluruh Indonesia")
                        return (
                          <tr key={item.id} className={cn("hover:bg-gray-50 transition-colors border-b border-gray-200", isNasional && "bg-gray-50 border-l-4 border-l-yellow-500")}>
                            <td className="px-4 py-3.5">
                              <p className="font-semibold text-gray-900 whitespace-nowrap">{item.namaInstansi}</p>
                              {item.website && (
                                <a href={item.website} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5">
                                  <Globe className="w-3 h-3" /> Website
                                </a>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={isNasional ? "text-gray-900" : "text-slate-600"}>
                                {isNasional ? "Nasional" : (item.kabupatenKota ? `Kota ${item.kabupatenKota}` : "-")}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                <span className="whitespace-nowrap">{kategoriCfg.label}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <Button
                                variant={isNasional ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedItem(item)}
                                className={cn("h-7 text-xs", isNasional ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50")}
                              >
                                Cek Detail
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <p className="text-slate-400 text-sm">
                    Menampilkan {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filtered.length)} dari {filtered.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <select
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                      className="px-1 py-0.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-slate-400 text-sm">baris/halaman</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-3 text-xs border-slate-200"
                  >
                    Sebelumnya
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - safePage) <= 2)
                    .map((p) => (
                      <Button
                        key={p}
                        variant={p === safePage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(p)}
                        className={cn(
                          "h-8 w-8 p-0 text-xs",
                          p === safePage
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            : "border-slate-200"
                        )}
                      >
                        {p}
                      </Button>
                    ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-3 text-xs border-slate-200"
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedItem(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Sumber Dukungan</p>
                <h3 className="text-base font-bold text-slate-900">{selectedItem.namaInstansi}</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-6 py-5">
              <div className="grid grid-cols-2 gap-y-4 gap-x-3 pb-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Kategori Dukungan</p>
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    <span>{KATEGORI_CONFIG[selectedItem.kategoriBentukDukungan]?.label}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Wilayah</p>
                  <p className="text-sm font-medium text-slate-900">
                    {(selectedItem.provinsi === NASIONAL_WILAYAH || selectedItem.provinsi === "Seluruh Indonesia") && (selectedItem.kabupatenKota === NASIONAL_WILAYAH || selectedItem.kabupatenKota === "Seluruh Indonesia") ? "Nasional" : (selectedItem.kabupatenKota ? `Kota ${selectedItem.kabupatenKota}` : "-")}
                  </p>
                </div>
                {selectedItem.kategoriPenyedia && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Penyedia</p>
                    <p className="text-sm text-slate-900">{selectedItem.kategoriPenyedia}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 mb-1">Provinsi</p>
                  <p className="text-sm text-slate-900">
                    {(selectedItem.provinsi === NASIONAL_WILAYAH || selectedItem.provinsi === "Seluruh Indonesia") && (selectedItem.kabupatenKota === NASIONAL_WILAYAH || selectedItem.kabupatenKota === "Seluruh Indonesia") ? "Nasional" : (selectedItem.provinsi || "-")}
                  </p>
                </div>
              </div>

              {(selectedItem.namaJalan || selectedItem.nomorJalan) && (
                <div className="pt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Alamat</p>
                  <p className="text-sm text-slate-700 mb-4">
                    {[selectedItem.namaJalan, selectedItem.nomorJalan, selectedItem.kelurahan, selectedItem.kecamatan, selectedItem.kabupatenKota, selectedItem.provinsi].filter(Boolean).join(", ")}
                  </p>
                  <div className="rounded-lg border border-slate-200 overflow-hidden h-48">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent([selectedItem.namaJalan, selectedItem.kabupatenKota, selectedItem.provinsi].filter(Boolean).join(", "))}&t=&z=15&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Peta Lokasi"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 pb-1">
                <div className="space-y-3">
                  {selectedItem.nomorCallCenter && (
                    <a
                      href={`https://wa.me/62${selectedItem.nomorCallCenter.replace(/^0/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Hubungi Layanan Pengaduan ({selectedItem.nomorCallCenter})
                    </a>
                  )}
                  {selectedItem.nomorPribadi && !selectedItem.nomorCallCenter && (
                    <a
                      href={`https://wa.me/62${selectedItem.nomorPribadi.replace(/^0/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Hubungi Layanan Pengaduan ({selectedItem.nomorPribadi})
                    </a>
                  )}
                  {selectedItem.website && (
                    <a
                      href={selectedItem.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      Kunjugi Website
                    </a>
                  )}
                  {(!selectedItem.nomorCallCenter && !selectedItem.nomorPribadi && !selectedItem.website) && (
                    <p className="text-sm text-slate-400">Tidak ada kontak tersedia</p>
                  )}
                </div>
              </div>
            </div>

            
          </div>
        </div>
      )}

      {/* Wilayah Modal */}
      {showWilayahModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowWilayahModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Filter Wilayah</h3>
              <button onClick={() => setShowWilayahModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="flex h-full max-h-[420px]">
                {/* Kolom kiri: Provinsi */}
                <div className="w-1/2 border-r border-gray-100 overflow-y-auto">
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={() => { setModalPendingFilter(null); setModalBrowseProvinsi(null); setModalPendingShowAll(true) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!modalBrowseProvinsi && modalPendingFilter === null && modalPendingShowAll ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      Seluruh Indonesia
                    </button>
                    <button
                      onClick={() => { setModalPendingFilter(null); setModalBrowseProvinsi(null); setModalPendingShowAll(false) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!modalBrowseProvinsi && modalPendingFilter === null && !modalPendingShowAll ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      Nasional
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    {PROVINSI_LIST.map((province) => {
                      const isBrowsed = modalBrowseProvinsi === province
                      return (
                        <button
                          key={province}
                          onClick={() => setModalBrowseProvinsi(province)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                            isBrowsed ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <span className="truncate">{province}</span>
                          {isBrowsed && <svg className="w-3.5 h-3.5 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Kolom kanan: Kabupaten/Kota */}
                <div className="w-1/2 overflow-y-auto bg-gray-50/40">
                  <div className="p-2 space-y-0.5">
                    {modalBrowseProvinsi ? (
                      <>
                        <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{modalBrowseProvinsi}</p>
                        <button
                          onClick={() => setModalPendingFilter({ province: modalBrowseProvinsi, kabupaten: "" })}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            modalPendingFilter?.province === modalBrowseProvinsi && !modalPendingFilter.kabupaten
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          Semua Kabupaten/Kota
                        </button>
                        {kabupatenForModal.length > 0 && <div className="border-t border-gray-100 my-1" />}
                        {kabupatenForModal.map((kab) => (
                          <button
                            key={kab}
                            onClick={() => setModalPendingFilter({ province: modalBrowseProvinsi, kabupaten: kab })}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              modalPendingFilter?.kabupaten === kab
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "hover:bg-gray-100 text-gray-700"
                            }`}
                          >
                            {kab}
                          </button>
                        ))}
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 p-4">Pilih provinsi di kiri untuk melihat kab/kota</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowWilayahModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={applyWilayahFilter}
                disabled={modalBrowseProvinsi !== null && modalPendingFilter?.province !== modalBrowseProvinsi}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
