"use client"
import { Search, Building, CheckCircle2, XCircle, AlertCircle, Clock, FileText, MessageCircle, Users, Eye } from "lucide-react"
import { useState, useMemo } from "react"
import type { PokjaItem, PokjaStatus } from "@/types/pokja"

interface BpmpPokjaViewProps {
  pokjaList: PokjaItem[]
  provinsi: string
  kabKotaList: string[]
}

const STATUS_CONFIG: Record<PokjaStatus, { label: string; color: string; bg: string }> = {
  "belum-dibentuk": { label: "Belum Dibentuk", color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
  "masih-diverifikasi": { label: "Perlu Diperiksa", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  aktif: { label: "Aktif", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  "butuh-perbaikan": { label: "Perlu Perbaikan", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  draf: { label: "Draf", color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
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
    return scoped.map((p) => {
      const expired = isSkExpired(p.data?.sk?.periodeSelesai || "")
      const effectiveStatus: PokjaStatus = expired && (p.status === "aktif" || p.status === "butuh-perbaikan") ? "butuh-perbaikan" : p.status
      return { ...p, effectiveStatus }
    })
  }, [scoped])

  const filtered = useMemo(() => {
    return processed
      .filter((p) => {
        const q = search.toLowerCase()
        const ketua = p.data?.members?.ketua?.nama ?? ""
        const sk = p.data?.sk?.nomorSK ?? ""
        const matchSearch = p.nama.toLowerCase().includes(q) || ketua.toLowerCase().includes(q) || (p.data?.region ?? "").toLowerCase().includes(q) || sk.toLowerCase().includes(q)
        const matchStatus = filterStatus === "semua" || p.effectiveStatus === filterStatus
        return matchSearch && matchStatus
      })
      .sort((a, b) => (a.data?.region ?? a.nama).localeCompare(b.data?.region ?? b.nama, "id"))
  }, [processed, search, filterStatus])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Pendaftaran Pokja</h2>
        <p className="text-xs text-gray-500 mt-0.5">Daftar Kelompok Kerja di {provinsi} dan kabupaten/kota di bawahnya</p>
      </div>

      {detailPokja && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetailPokja(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{detailPokja.nama}</h3>
                <p className="text-sm text-gray-500">Wilayah: {detailPokja.data?.region}</p>
              </div>
              <button onClick={() => setDetailPokja(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 text-sm">
              <div className="flex justify-between px-4 py-3"><span className="text-gray-500">Ketua</span><span className="font-medium text-gray-900">{detailPokja.data?.members?.ketua?.nama || "-"}</span></div>
              <div className="flex justify-between px-4 py-3"><span className="text-gray-500">Nomor SK</span><span className="font-medium text-gray-900">{detailPokja.data?.sk?.nomorSK || "-"}</span></div>
              <div className="flex justify-between px-4 py-3"><span className="text-gray-500">Jumlah Anggota</span><span className="font-medium text-gray-900">{detailPokja.data?.members ? Object.values(detailPokja.data.members).filter((m) => m && m.nama?.trim()).length : 0} orang</span></div>
              <div className="flex justify-between px-4 py-3"><span className="text-gray-500">Kanal Pengaduan</span><span className="font-medium text-gray-900">{detailPokja.data?.nomorKanal || "-"}</span></div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setDetailPokja(null)} className="px-4 py-2 rounded-lg bg-slate-100 text-sm font-medium text-gray-700 hover:bg-slate-200">Tutup</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{filtered.length}</span> Kelompok Kerja
            </p>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as PokjaStatus | "semua")}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white"
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, ketua, SK"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["No", "Nama Kelompok Kerja", "Wilayah", "Jumlah Anggota", "Ketua Kelompok Kerja", "Nomor SK", "Status", "Aksi"].map((col) => (
                  <th key={col} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? filtered.map((pokja, idx) => {
                const cfg = STATUS_CONFIG[pokja.effectiveStatus]
                const safeData = pokja.data ?? null
                const ketua = safeData?.members?.ketua ?? null
                const sk = safeData?.sk ?? null
                const regionName = safeData?.region ?? null
                return (
                  <tr key={pokja.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 text-gray-400 text-xs w-10">{idx + 1}</td>
                    <td className="px-4 py-3.5"><p className="font-semibold text-gray-900 whitespace-nowrap">{pokja.nama}</p></td>
                    <td className="px-4 py-3.5">{regionName ? <span className="text-gray-700">{regionName}</span> : <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3.5">{safeData?.members ? <span className="text-gray-700">{Object.values(safeData.members).filter((m) => m && m.nama?.trim()).length} orang</span> : <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3.5">{ketua?.nama ? <div><p className="font-medium text-gray-900 whitespace-nowrap">{ketua.nama}</p>{ketua.instansi && <p className="text-xs text-gray-400 truncate max-w-[160px]">{ketua.instansi}</p>}</div> : <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3.5">{sk?.nomorSK ? <div className="flex items-start gap-1.5"><FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" /><div><p className="text-gray-800 whitespace-nowrap font-medium">{sk.nomorSK}</p>{sk.periodeSelesai && <p className="text-xs text-gray-400">s.d. {sk.periodeSelesai}</p>}</div></div> : <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        onClick={() => setDetailPokja(pokja)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Cek Detail
                      </button>
                    </td>
                  </tr>
                )
              }) : (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Tidak ada Kelompok Kerja di wilayah ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
