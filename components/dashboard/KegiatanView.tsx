"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Eye, CheckCircle, Clock, PlayCircle, Search } from "lucide-react"
import { RealisasiModal } from "./RealisasiModal"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type StatusKegiatan = "menunggu" | "berlangsung" | "selesai" | "terealisasi"

export interface Kegiatan {
  id: string
  namaKegiatan: string
  penyelenggara: string[]
  tanggalMulai: string
  tanggalSelesai: string
  deskripsiKegiatan: string
  lokasi?: string
  linkGoogleMap?: string
  tautanMeeting?: string
  linkDokumentasi?: string
  peserta?: { kategori: string; jumlah: string }[]
  status: StatusKegiatan
  createdAt?: string
  realize?: {
    jumlahPeserta: number
    tanggalRealisasi: string
    catatan: string
    dokumentasi: string
    createdAt: string
  } | null
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const SEED_DATA: Kegiatan[] = [
  { id: "kg-1", namaKegiatan: "Workshop PKSA", penyelenggara: ["Sekolah"], tanggalMulai: "2025-04-15", tanggalSelesai: "2025-04-15", deskripsiKegiatan: "Workshop pengenalan isu kekerasan pada anak", lokasi: "Aula Sekolah", peserta: [{ kategori: "Guru", jumlah: "20" }, { kategori: "Siswa", jumlah: "30" }], linkDokumentasi: "", status: "selesai" },
  { id: "kg-2", namaKegiatan: "Sosialisasi Hak Anak", penyelenggara: ["Pusat", "Sekolah"], tanggalMulai: "2025-06-20", tanggalSelesai: "2025-06-21", deskripsiKegiatan: "Sosialisasi hak anak kepada seluruh siswa dan wali kelas", lokasi: "Ruang Serbaguna", linkGoogleMap: "https://maps.google.com", tautanMeeting: "https://zoom.us/j/123", peserta: [{ kategori: "Siswa", jumlah: "80" }, { kategori: "Masyarakat", jumlah: "40" }], linkDokumentasi: "https://docs.example.com", status: "berlangsung" },
  { id: "kg-3", namaKegiatan: "Rapat Koordinasi Kelompok Kerja", penyelenggara: ["Dinas Pendidikan", "Dinas Sosial"], tanggalMulai: "2025-07-10", tanggalSelesai: "2025-07-10", deskripsiKegiatan: "Rapat koordinasi bulanan antar anggota kelompok kerja", lokasi: "Kantor Dinas Pendidikan", peserta: [{ kategori: "Guru", jumlah: "30" }], linkDokumentasi: "", status: "menunggu" },
]

function getPenyelenggaraColors(_type: string) {
  return { bg: "bg-[#efefef]", text: "text-[#2f3031]" }
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: StatusKegiatan }) {
  if (status === "terealisasi") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full whitespace-nowrap text-[13px] font-semibold bg-emerald-300 text-emerald-950">
      Terealisasi
    </span>
  )
  if (status === "selesai") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full whitespace-nowrap text-[13px] font-semibold bg-emerald-300 text-emerald-950">
      Selesai
    </span>
  )
  if (status === "berlangsung") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full whitespace-nowrap text-[13px] font-semibold bg-sky-200 text-sky-950">
      Berlangsung
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full whitespace-nowrap text-[13px] font-semibold bg-amber-200 text-amber-950">
      Terjadwal
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------
export function KegiatanView() {
  const [list, setList] = useState<Kegiatan[]>([])
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"semua" | StatusKegiatan>("semua")

  const filtered = useMemo(() => {
    return list.filter((item) => {
      const q = search.toLowerCase().trim()
      const matchSearch = !q ||
        item.namaKegiatan.toLowerCase().includes(q) ||
        item.penyelenggara.some((p) => p.toLowerCase().includes(q)) ||
        (item.lokasi && item.lokasi.toLowerCase().includes(q))
      const matchStatus = filterStatus === "semua" || item.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [list, search, filterStatus])

  useEffect(() => {
    const loadData = () => {
      try {
        const stored: Kegiatan[] = JSON.parse(sessionStorage.getItem("kegiatanList") ?? "[]")
        const storedMap = new Map(stored.map((i) => [i.id, i]))
        const seedMerged = SEED_DATA.map((s) => storedMap.has(s.id) ? { ...s, ...storedMap.get(s.id) } : s)
        const newItems = stored.filter((i) => !SEED_DATA.find((s) => s.id === i.id))
        setList([...seedMerged, ...newItems])
      } catch {
        setList([...SEED_DATA])
      }
    }

    setMounted(true)
    loadData()

    // storage fires in other tabs; kegiatanUpdated fires in the same tab
    const onStorage = (e: StorageEvent) => { if (e.key === "kegiatanList") loadData() }
    window.addEventListener("storage", onStorage)
    window.addEventListener("kegiatanUpdated", loadData)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("kegiatanUpdated", loadData)
    }
  }, [])

  if (!mounted) return null

  return (
    <div className="space-y-5">
      {/* Heading */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Kegiatan</h2>
          <p className="text-xs text-gray-500 mt-0.5">Daftar kegiatan yang diselenggarakan oleh Kelompok Kerja</p>
        </div>
        <a
          href="/tambah-kegiatan"
          className="flex items-center gap-1.5 h-9 px-4 rounded-[4px] text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Kegiatan
        </a>
      </div>

      <div className="bg-white rounded-[4px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">Daftar Kegiatan</h2>
            <p className="text-sm text-gray-500 tabular-nums">{filtered.length.toLocaleString("id-ID")} kegiatan</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama kegiatan, penyelenggara, atau lokasi"
                className="w-full h-10 pl-9 pr-3 text-sm border border-gray-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "semua" | StatusKegiatan)}
              aria-label="Filter status"
              className="h-10 w-full px-3 text-sm border border-gray-300 rounded-[4px] bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="semua">Semua Status</option>
              <option value="menunggu">Terjadwal</option>
              <option value="berlangsung">Berlangsung</option>
              <option value="selesai">Selesai</option>
              <option value="terealisasi">Terealisasi</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F1F1F1] border-b border-gray-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Nama Kegiatan</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Penyelenggara</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Waktu</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Peserta</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    {list.length === 0 ? "Belum ada kegiatan" : "Tidak ada kegiatan yang cocok dengan pencarian"}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F9F9F9] transition-colors">
                    <td className="px-4 py-3.5 font-medium text-gray-800">{item.namaKegiatan}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {item.penyelenggara.map((p) => {
                          const colors = getPenyelenggaraColors(p)
                          return (
                            <span key={p} className={`inline-flex items-center px-2.5 py-0.5 rounded-full whitespace-nowrap text-[13px] font-semibold ${colors.bg} ${colors.text}`}>
                              {p}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                      {(() => {
                        const fmt = (d: string) => new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })
                        return item.tanggalMulai === item.tanggalSelesai ? fmt(item.tanggalMulai) : `${fmt(item.tanggalMulai)} - ${fmt(item.tanggalSelesai)}`
                      })()}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">
                      {item.peserta && item.peserta.length > 0
                        ? item.peserta.map((p) => (
                            <span key={p.kategori} className="inline-block mr-1 last:mr-0 text-[13px] font-semibold bg-[#efefef] text-[#2f3031] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                              {p.kategori}: {p.jumlah}
                            </span>
                          ))
                        : "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <a
                        href={`/tambah-kegiatan?view=${item.id}`}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-[#F9F9F9] transition-colors whitespace-nowrap"
                      >
                        Cek Detail
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
