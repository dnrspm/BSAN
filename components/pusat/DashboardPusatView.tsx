"use client"
import { useState } from "react"
import { ClipboardList, CheckCircle2, XCircle, Clock, MapPin, Users, Plus, ChevronRight, AlertTriangle, Building2, MapPinned, TrendingUp } from "lucide-react"
import { PieChart, Pie, Cell } from "recharts"
import type { PokjaItem } from "@/types/pokja"
import { KAB_TO_INCLUDE } from "@/data/provinsiData"

interface DashboardPusatViewProps {
  pokjaList: PokjaItem[]
  onValidatePusat?: (pokja: PokjaItem) => void
  onViewSumberRujukan?: () => void
  onViewActivities?: () => void
  onGoToPokja?: (pokja: PokjaItem) => void
}

const RUJUKAN_BREAKDOWN = [
  { label: "Puskesmas / Faskes",  count: 48 },
  { label: "Konselor Sekolah",    count: 37 },
  { label: "Kepolisian",          count: 29 },
  { label: "LBH / Bantuan Hukum", count: 18 },
  { label: "Lainnya",             count: 12 },
]
const RUJUKAN_COLORS = ["#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#64748b"]

// Data provinsi dengan jumlah kab/kota dan pokja yang terbentuk
const PROVINCE_DATA = [
  { nama: "Provinsi Aceh", totalKabKota: 23, pokjaKabKota: 0 },
  { nama: "Provinsi Bali", totalKabKota: 9, pokjaKabKota: 0 },
  { nama: "Provinsi Banten", totalKabKota: 8, pokjaKabKota: 0 },
  { nama: "Provinsi Bengkulu", totalKabKota: 10, pokjaKabKota: 0 },
  { nama: "Provinsi D.I. Yogyakarta", totalKabKota: 5, pokjaKabKota: 0 },
  { nama: "Provinsi D.K.I. Jakarta", totalKabKota: 1, pokjaKabKota: 0 },
  { nama: "Provinsi Gorontalo", totalKabKota: 6, pokjaKabKota: 0 },
  { nama: "Provinsi Jambi", totalKabKota: 11, pokjaKabKota: 0 },
  { nama: "Provinsi Jawa Barat", totalKabKota: 27, pokjaKabKota: 0 },
  { nama: "Provinsi Jawa Tengah", totalKabKota: 35, pokjaKabKota: 0 },
  { nama: "Provinsi Jawa Timur", totalKabKota: 38, pokjaKabKota: 2 },
  { nama: "Provinsi Kalimantan Barat", totalKabKota: 14, pokjaKabKota: 0 },
  { nama: "Provinsi Kalimantan Selatan", totalKabKota: 13, pokjaKabKota: 0 },
  { nama: "Provinsi Kalimantan Tengah", totalKabKota: 14, pokjaKabKota: 0 },
  { nama: "Provinsi Kalimantan Timur", totalKabKota: 10, pokjaKabKota: 0 },
  { nama: "Provinsi Kalimantan Utara", totalKabKota: 5, pokjaKabKota: 0 },
  { nama: "Provinsi Kepulauan Bangka Belitung", totalKabKota: 7, pokjaKabKota: 0 },
  { nama: "Provinsi Kepulauan Riau", totalKabKota: 7, pokjaKabKota: 0 },
  { nama: "Provinsi Lampung", totalKabKota: 15, pokjaKabKota: 0 },
  { nama: "Provinsi Maluku", totalKabKota: 11, pokjaKabKota: 0 },
  { nama: "Provinsi Maluku Utara", totalKabKota: 10, pokjaKabKota: 0 },
  { nama: "Provinsi Nusa Tenggara Barat", totalKabKota: 10, pokjaKabKota: 0 },
  { nama: "Provinsi Nusa Tenggara Timur", totalKabKota: 22, pokjaKabKota: 0 },
  { nama: "Provinsi Papua", totalKabKota: 29, pokjaKabKota: 0 },
  { nama: "Provinsi Papua Barat", totalKabKota: 13, pokjaKabKota: 0 },
  { nama: "Provinsi Papua Barat Daya", totalKabKota: 5, pokjaKabKota: 0 },
  { nama: "Provinsi Papua Pegunungan", totalKabKota: 8, pokjaKabKota: 0 },
  { nama: "Provinsi Papua Selatan", totalKabKota: 4, pokjaKabKota: 0 },
  { nama: "Provinsi Papua Tengah", totalKabKota: 8, pokjaKabKota: 0 },
  { nama: "Provinsi Riau", totalKabKota: 12, pokjaKabKota: 0 },
  { nama: "Provinsi Sulawesi Barat", totalKabKota: 6, pokjaKabKota: 0 },
  { nama: "Provinsi Sulawesi Selatan", totalKabKota: 24, pokjaKabKota: 0 },
  { nama: "Provinsi Sulawesi Tengah", totalKabKota: 13, pokjaKabKota: 0 },
  { nama: "Provinsi Sulawesi Tenggara", totalKabKota: 17, pokjaKabKota: 0 },
  { nama: "Provinsi Sulawesi Utara", totalKabKota: 15, pokjaKabKota: 0 },
  { nama: "Provinsi Sumatra Barat", totalKabKota: 19, pokjaKabKota: 0 },
  { nama: "Provinsi Sumatra Selatan", totalKabKota: 17, pokjaKabKota: 0 },
  { nama: "Provinsi Sumatra Utara", totalKabKota: 33, pokjaKabKota: 0 },
]

// Matching menggunakan exact match pada p.nama (yang kini seragam "Provinsi X")
// sehingga tidak perlu map kompleks — cukup cocokkan p.nama === prov.nama


export function DashboardPusatView({ pokjaList, onValidatePusat, onViewSumberRujukan, onViewActivities, onGoToPokja }: DashboardPusatViewProps) {
  const [search, setSearch] = useState("")
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [expandedProvince, setExpandedProvince] = useState<string | null>(null)

  // Hitung pokja per provinsi dari pokjaList secara dinamis
  // p.nama dan prov.nama sekarang keduanya menggunakan format "Provinsi X" — exact match
  const enrichedProvinces = PROVINCE_DATA.map((prov) => {
    const matching = pokjaList.filter((p) =>
      p.nama.trim().toLowerCase() === prov.nama.trim().toLowerCase()
    )

    const aktifCount = matching.filter(p => p.status === "aktif").length
    const menungguCount = matching.filter(p => p.status === "masih-diverifikasi").length
    const perbaikanCount = matching.filter(p => p.status === "butuh-perbaikan").length

    // Status provinsi: ambil status paling relevan
    let statusProv: "aktif" | "menunggu" | "perbaikan" | "belum" = "belum"
    if (aktifCount > 0) statusProv = "aktif"
    else if (menungguCount > 0) statusProv = "menunggu"
    else if (perbaikanCount > 0) statusProv = "perbaikan"

    return {
      ...prov,
      pokjaKabKota: matching.filter(p => ["aktif", "masih-diverifikasi", "butuh-perbaikan"].includes(p.status)).length,
      statusProv,
      matching,
    }
  })

  // Variabel agregat dari pokjaList (digunakan di bagian bawah komponen)
  const aktif = pokjaList.filter((p) => p.status === "aktif").length
  const menunggu = pokjaList.filter((p) => p.status === "masih-diverifikasi").length
  const ditolak = pokjaList.filter((p) => p.status === "ditolak").length
  const total = pokjaList.length

  // Hitung total provinsi, kab/kota, dan pokja kab/kota yang terbentuk
  const totalProvinsi = PROVINCE_DATA.length
  const totalKabKota = PROVINCE_DATA.reduce((sum, p) => sum + p.totalKabKota, 0)
  const totalPokjaKabKota = enrichedProvinces.reduce((sum, p) => sum + p.pokjaKabKota, 0)
  const persentaseNasional = totalKabKota > 0 ? ((totalPokjaKabKota / totalKabKota) * 100).toFixed(1) : "0.0"

  // Hitung provinsi yang sudah terbentuk (punya minimal 1 pokja)
  const provinsiTerbentuk = enrichedProvinces.filter(p => p.pokjaKabKota > 0).length

  // Filter data berdasarkan search
  const filteredProvinces = enrichedProvinces.filter(p =>
    p.nama.toLowerCase().includes(search.toLowerCase())
  )

  // Stats untuk header cards
  const headerStats = [
    {
      label: "Provinsi Terbentuk",
      value: provinsiTerbentuk,
      total: `dari ${totalProvinsi} provinsi`,
      icon: Building2,
      color: "text-green-600",
      bg: "from-green-50 to-green-100/50",
      border: "border-green-200",
      iconBg: "bg-green-100",
    },
    {
      label: "Kab/Kota Terbentuk",
      value: totalPokjaKabKota,
      total: `dari ${totalKabKota} kab/kota`,
      icon: MapPinned,
      color: "text-blue-600",
      bg: "from-blue-50 to-blue-100/50",
      border: "border-blue-200",
      iconBg: "bg-blue-100",
    },
    {
      label: "Persentase Nasional",
      value: `${persentaseNasional}%`,
      total: "capaian seluruh Indonesia",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "from-purple-50 to-purple-100/50",
      border: "border-purple-200",
      iconBg: "bg-purple-100",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dasbor Admin Pusat</h1>
        <p className="text-sm text-gray-500 mt-1">Pantau status pembentukan Kelompok Kerja di seluruh Indonesia</p>
      </div>

      {/* Header Stats - 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {headerStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={`relative rounded-2xl border-2 ${stat.border} bg-gradient-to-br ${stat.bg} p-5 overflow-hidden`}
            >
              {/* Decorative icon background */}
              <div className="absolute top-3 right-3 opacity-10">
                <Icon className="w-20 h-20" />
              </div>
              
              <div className="relative z-10">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  {stat.label}
                </p>
                <p className={`text-4xl font-bold ${stat.color} leading-none mb-1`}>
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.total}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Daftar pokja menunggu verifikasi */}
      {menunggu > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-gray-800">Kelompok Kerja Perlu Diperiksa</h3>
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold">
                {menunggu}
              </span>
            </div>
          </div>
          <ul className="divide-y divide-amber-100">
            {pokjaList
              .filter((p) => p.status === "masih-diverifikasi")
              .slice(0, 5)
              .map((p) => (
                <li 
                  key={p.id} 
                  className="px-5 py-3 flex items-center gap-3 hover:bg-amber-100/50 cursor-pointer transition-colors"
                  onClick={() => onGoToPokja?.(p)}
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {(p.data?.region ?? p.nama).replace(/^Provinsi\s*/i, "")}
                    </p>
                  </div>
                  <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full whitespace-nowrap">
                    Perlu Diperiksa
                  </span>
                  <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Tabel Provinsi dengan Header */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Jumlah Kelompok Kerja Tiap Provinsi</h2>
          <p className="text-sm text-gray-500">
            per {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            [Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}]
          </p>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <label htmlFor="entries" className="text-sm text-gray-600">Tampilkan</label>
            <select 
              id="entries"
              value={entriesPerPage} 
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">data</span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="search" className="text-sm text-gray-600">Cari:</label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nama provinsi..."
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900">
                    No
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900">
                    Wilayah
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900">
                    Status Kelompok Kerja Provinsi
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <button className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900 mx-auto">
                    Jumlah Kota/Kab
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <button className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900 mx-auto">
                    Kelompok kerja kab/kota terbentuk
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <button className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900 mx-auto">
                    Persentase
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProvinces.slice(0, entriesPerPage).map((prov, idx) => {
                const persentase = prov.totalKabKota > 0 ? ((prov.pokjaKabKota / prov.totalKabKota) * 100).toFixed(0) : 0
                const lihatPokja = prov.pokjaKabKota > 0 ? "Ada" : "Belum Ada"

                const statusConfig = {
                  aktif:    { label: "Aktif",              cls: "bg-green-100 border border-green-300 text-green-700" },
                  menunggu: { label: "Perlu Diperiksa", cls: "bg-amber-100 border border-amber-300 text-amber-700" },
                  perbaikan:{ label: "Perlu Perbaikan",     cls: "bg-red-100 border border-red-300 text-red-700" },
                  belum:    { label: "Belum Dibentuk",      cls: "bg-gray-100 border border-gray-200 text-gray-500" },
                }
                const sc = statusConfig[prov.statusProv]

                const isExpanded = expandedProvince === prov.nama
                return (
                  <>
                  <tr key={prov.nama} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedProvince(isExpanded ? null : prov.nama)}>
                    <td className="px-4 py-3.5 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-medium text-gray-900">
                      {prov.nama.replace(/^Provinsi\s*/i, "")}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${sc.cls}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-gray-900 font-medium">
                      {prov.totalKabKota}
                    </td>
                    <td className="px-4 py-3.5 text-center text-gray-900 font-medium">
                      {prov.pokjaKabKota}
                    </td>
                    <td className="px-4 py-3.5 text-center text-gray-900 font-medium">
                      {persentase}%
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${prov.nama}-detail`}>
                      <td colSpan={6} className="px-6 py-5 bg-gray-50 border-b border-gray-200">
                        {(() => {
                          const provName = prov.nama.replace(/^Provinsi\s*/i, "")
                          const pokja = prov.matching[0]
                          const kabList = KAB_TO_INCLUDE[provName] ?? []
                          const unformedCount = prov.totalKabKota - prov.pokjaKabKota

                          const sc = statusConfig[prov.statusProv]

                          return (
                            <div className="space-y-4">
                              {/* Info Pokja */}
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-gray-900">Kelompok Kerja Provinsi {provName}</span>
                                <span className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${sc.cls}`}>{sc.label}</span>
                              </div>

                              {pokja ? (
                                <div className="rounded-xl bg-white border border-gray-200 p-4 grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-xs text-gray-500">Nomor Kanal</p>
                                    <p className="font-medium text-gray-900">{pokja.data.nomorKanal || "—"}</p>
                                  </div>
                                  {pokja.tanggalDiverifikasi && (
                                    <div>
                                      <p className="text-xs text-gray-500">Tanggal Diverifikasi</p>
                                      <p className="font-medium text-gray-900">{pokja.tanggalDiverifikasi}</p>
                                    </div>
                                  )}
                                  {pokja.alasanPenolakan && (
                                    <div className="col-span-2">
                                      <p className="text-xs text-gray-500">Catatan</p>
                                      <p className="font-medium text-gray-900">{pokja.alasanPenolakan}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="rounded-xl bg-white border border-dashed border-gray-300 p-4 text-center">
                                  <p className="text-sm text-gray-500">Belum ada Kelompok Kerja yang dibentuk untuk provinsi ini.</p>
                                </div>
                              )}

                              {/* Daftar Kab/Kota */}
                              <div>
                                <p className="text-sm font-bold text-gray-900 mb-2">
                                  Kelompok Kerja Kab/Kota ({prov.pokjaKabKota} terbentuk dari {prov.totalKabKota})
                                </p>
                                {kabList.length > 0 ? (
                                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                                    {kabList.map((kab) => (
                                      <div key={kab} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
                                        <p className="text-sm text-gray-900">{kab}</p>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Terbentuk</span>
                                      </div>
                                    ))}
                                    {unformedCount > 0 && (
                                      <div className="px-4 py-2.5 bg-gray-50 text-sm text-gray-500">+ {unformedCount} kab/kota lainnya belum membentuk Kelompok Kerja</div>
                                    )}
                                  </div>
                                ) : prov.pokjaKabKota > 0 ? (
                                  <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center text-sm text-green-700">{prov.pokjaKabKota} kab/kota telah membentuk Kelompok Kerja.</div>
                                ) : (
                                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center text-sm text-gray-500">Belum ada kab/kota yang membentuk Kelompok Kerja.</div>
                                )}
                              </div>
                            </div>
                          )
                        })()}
                      </td>
                    </tr>
                  )}
                  </>
                )
              })}
              {/* Total Row */}
              <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                <td colSpan={3} className="px-4 py-3.5 text-center text-gray-900 uppercase tracking-wide">
                  Total Nasional
                </td>
                <td className="px-4 py-3.5 text-center text-gray-900">
                  {totalKabKota}
                </td>
                <td className="px-4 py-3.5 text-center text-gray-900">
                  {totalPokjaKabKota}
                </td>
                <td className="px-4 py-3.5 text-center text-gray-900">
                  {persentaseNasional}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sumber Dukungan */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Sumber Dukungan</h3>
          {onViewSumberRujukan && (
            <button onClick={onViewSumberRujukan} className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Kelola <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative w-44 h-44 flex-shrink-0">
              <PieChart width={176} height={176}>
                  <Pie data={RUJUKAN_BREAKDOWN} cx="50%" cy="50%" innerRadius={54} outerRadius={80} dataKey="count" startAngle={90} endAngle={-270} stroke="none">
                    {RUJUKAN_BREAKDOWN.map((_, i) => <Cell key={`cell-${i}`} fill={RUJUKAN_COLORS[i]} />)}
                  </Pie>
                </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-gray-900">{RUJUKAN_BREAKDOWN.reduce((a,b)=>a+b.count,0)}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
              {RUJUKAN_BREAKDOWN.map((r, i) => (
                <div key={r.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: RUJUKAN_COLORS[i]}} />
                  <p className="text-xs text-gray-600">{r.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Nama</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Jenis</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Kontak</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {[{nama:"Klinik Sehat",jenis:"Kesehatan",kontak:"0812"},{nama:"Psikolog Dina",jenis:"Konseling",kontak:"0813"}].map((item,i)=>(
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-800 font-medium">{item.nama}</td>
                      <td className="px-3 py-2.5 text-gray-600">{item.jenis}</td>
                      <td className="px-3 py-2.5 text-gray-500">{item.kontak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Kegiatan */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Kegiatan</h3>
          {onViewActivities && (
            <button onClick={onViewActivities} className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Kelola <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="p-3 border border-gray-100 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Juni 2025</p>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["M","S","S","R","K","J","S"].map((d,i)=><p key={i} className="text-xs font-medium text-gray-400">{d}</p>)}
              {Array.from({length:30}).map((_,i)=><div key={i} className={`text-xs p-1 rounded ${[14,17,21].includes(i+1)?"bg-blue-100 text-blue-700 font-medium":"text-gray-500"}`}>{i+1}</div>)}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase">Kegiatan Mendatang</p>
            {[{tanggal:"14 Jun",judul:"Pelatihan"},{tanggal:"17 Jun",judul:"Verifikasi"},{tanggal:"21 Jun",judul:"Rapat"}].map((k,i)=>(
              <div key={i} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-xs font-medium text-gray-700">{k.judul}</p>
                <p className="text-xs text-gray-500">{k.tanggal}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
