"use client"
import { ClipboardList, CheckCircle2, XCircle, Clock, MapPin, Users, Plus, ChevronRight, AlertTriangle, Building2, MapPinned, TrendingUp } from "lucide-react"
import { PieChart, Pie, Cell } from "recharts"
import type { PokjaItem } from "@/types/pokja"


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
  // Hitung pokja per provinsi dari pokjaList secara dinamis
  const enrichedProvinces = PROVINCE_DATA.map((prov) => {
    const matching = pokjaList.filter((p) =>
      p.nama.trim().toLowerCase() === prov.nama.trim().toLowerCase()
    )
    return {
      ...prov,
      pokjaKabKota: matching.filter(p => ["aktif", "masih-diverifikasi", "butuh-perbaikan"].includes(p.status)).length,
    }
  })

  const menunggu = pokjaList.filter((p) => p.status === "masih-diverifikasi").length

  const totalProvinsi = PROVINCE_DATA.length
  const totalKabKota = PROVINCE_DATA.reduce((sum, p) => sum + p.totalKabKota, 0)
  const totalPokjaKabKota = enrichedProvinces.reduce((sum, p) => sum + p.pokjaKabKota, 0)
  const persentaseNasional = totalKabKota > 0 ? ((totalPokjaKabKota / totalKabKota) * 100).toFixed(1) : "0.0"
  const provinsiTerbentuk = enrichedProvinces.filter(p => p.pokjaKabKota > 0).length

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
