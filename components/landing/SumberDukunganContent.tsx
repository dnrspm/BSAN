"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Search, Globe, ChevronLeft, ChevronRight, X, ChevronDown, MapPin, Phone, ExternalLink, Copy } from "lucide-react"
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
              Update terakhir: {mounted ? `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} | ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : ""}
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

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-2 gap-y-4 gap-x-3 pb-3">
                <div>
                  <p className="text-sm text-slate-500">Kategori Dukungan</p>
                  <p className="text-base text-slate-800 mt-1">{KATEGORI_CONFIG[selectedItem.kategoriBentukDukungan]?.label}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Wilayah</p>
                  <p className="text-base text-slate-800 mt-1">
                    {(selectedItem.provinsi === NASIONAL_WILAYAH || selectedItem.provinsi === "Seluruh Indonesia") && (selectedItem.kabupatenKota === NASIONAL_WILAYAH || selectedItem.kabupatenKota === "Seluruh Indonesia") ? "Nasional" : (selectedItem.kabupatenKota ? `Kota ${selectedItem.kabupatenKota}` : "-")}
                  </p>
                </div>
                {selectedItem.kategoriPenyedia && (
                  <div>
                    <p className="text-sm text-slate-500">Penyedia</p>
                    <p className="text-base text-slate-800 mt-1">{selectedItem.kategoriPenyedia}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-500">Provinsi</p>
                  <p className="text-base text-slate-800 mt-1">
                    {(selectedItem.provinsi === NASIONAL_WILAYAH || selectedItem.provinsi === "Seluruh Indonesia") && (selectedItem.kabupatenKota === NASIONAL_WILAYAH || selectedItem.kabupatenKota === "Seluruh Indonesia") ? "Nasional" : (selectedItem.provinsi || "-")}
                  </p>
                </div>
              </div>

              {(selectedItem.namaJalan || selectedItem.nomorJalan) && (
                <div className="pb-4">
                  {selectedItem.tautanGoogleMaps ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-500">Alamat</p>
                        <p className="text-base text-slate-800 mt-1">
                          {[
                            selectedItem.namaJalan,
                            selectedItem.nomorJalan,
                            selectedItem.kelurahan,
                            selectedItem.kecamatan,
                            selectedItem.alamatKota ?? (selectedItem.kabupatenKota !== "Seluruh Indonesia" ? selectedItem.kabupatenKota : null),
                            selectedItem.alamatProvinsi ?? (selectedItem.provinsi !== "Seluruh Indonesia" ? selectedItem.provinsi : null),
                          ].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <a
                        href={selectedItem.tautanGoogleMaps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Lihat Peta
                      </a>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-500">Alamat</p>
                      <p className="text-base text-slate-800 mt-1 mb-4">
                        {[
                          selectedItem.namaJalan,
                          selectedItem.nomorJalan,
                          selectedItem.kelurahan,
                          selectedItem.kecamatan,
                          selectedItem.alamatKota ?? (selectedItem.kabupatenKota !== "Seluruh Indonesia" ? selectedItem.kabupatenKota : null),
                          selectedItem.alamatProvinsi ?? (selectedItem.provinsi !== "Seluruh Indonesia" ? selectedItem.provinsi : null),
                        ].filter(Boolean).join(", ")}
                      </p>
                      <div className="rounded-lg border border-slate-200 overflow-hidden h-48">
                        <iframe
                          src={`https://maps.google.com/maps?q=${encodeURIComponent([
                            selectedItem.namaJalan,
                            selectedItem.nomorJalan,
                            selectedItem.alamatKota ?? (selectedItem.kabupatenKota !== "Seluruh Indonesia" ? selectedItem.kabupatenKota : null),
                            selectedItem.alamatProvinsi ?? (selectedItem.provinsi !== "Seluruh Indonesia" ? selectedItem.provinsi : null),
                          ].filter(Boolean).join(", "))}&t=&z=15&output=embed`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Peta Lokasi"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="space-y-4">
                  {(() => {
                    const cc = !!selectedItem.nomorCallCenter
                    const cc2 = !!selectedItem.nomorCallCenter2
                    const cc3 = !!selectedItem.nomorCallCenter3
                    const pj = !!selectedItem.nomorPribadi
                    const total = [cc, cc2, cc3, pj].filter(Boolean).length
                    const split = total >= 4

                    const renderCard = (label: string, nomor: string, isMain?: boolean, fullWidth?: boolean) => (
                      <div className={`p-4 ${fullWidth ? "sm:col-span-full border-b border-slate-200" : ""}`}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500">{label}</p>
                          <button onClick={() => navigator.clipboard.writeText(nomor)} className="text-slate-400 hover:text-slate-600">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <a
                          href={`https://wa.me/62${nomor.replace(/^0/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`mt-3 w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-semibold transition-colors ${isMain ? "bg-green-600 hover:bg-green-700 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                        >
                          <Phone className="w-4 h-4" />
                          {nomor}
                        </a>
                      </div>
                    )

                    return (
                        <div className={`grid grid-cols-1 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 rounded-lg ${total > 1 ? "border border-slate-200" : ""} ${split ? "sm:grid-cols-3" : "sm:grid-cols-[repeat(auto-fit,minmax(0,1fr))]"}`}>
                          {split && selectedItem.nomorCallCenter && renderCard("Call Center", selectedItem.nomorCallCenter, true, true)}
                          {(!split && selectedItem.nomorCallCenter) && renderCard("Call Center", selectedItem.nomorCallCenter, true)}
                          {selectedItem.nomorCallCenter2 && renderCard("Call Center 2", selectedItem.nomorCallCenter2)}
                          {selectedItem.nomorCallCenter3 && renderCard("Call Center 3", selectedItem.nomorCallCenter3)}
                          {selectedItem.nomorPribadi && renderCard("Penanggung Jawab", selectedItem.nomorPribadi)}
                        </div>
                    )
                  })()}
                  {selectedItem.website && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-500">Website</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-base text-blue-600 truncate">{selectedItem.website}</span>
                          <a
                            href={selectedItem.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
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
