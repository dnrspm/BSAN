"use client"

import React, { useState, useMemo } from "react"
import { Search, Eye, CheckCircle, Clock, PlayCircle, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { PROVINSI_DATA } from "@/data/provinsiData"

const PAGE_SIZE = 10

const PROVINCE_OPTIONS = PROVINSI_DATA.filter((p) => !p.provinsi.includes(" - ")).map((p) => p.provinsi).sort()

interface Peserta {
  kategori: string
  jumlah: string
}

interface Kegiatan {
  id: string
  namaKegiatan: string
  penyelenggara: string[]
  pelaksanaan: ("luring" | "daring")[]
  wilayah: string
  tanggalMulai: string
  tanggalSelesai: string
  status: "Berlangsung" | "Selesai" | "Terjadwal" | "Terealisasi"
  peserta: Peserta[]
  deskripsiKegiatan: string
  tautanMeeting: string
}

export const MOCK_KEGIATAN: Kegiatan[] = [
  { id: "kg-1", namaKegiatan: "Pelatihan Fasilitator BSAN Tingkat Nasional", penyelenggara: ["Kemendikdasmen"], pelaksanaan: ["luring"], wilayah: "Jakarta", tanggalMulai: "2025-03-10", tanggalSelesai: "2025-03-12", status: "Selesai", peserta: [{ kategori: "Guru", jumlah: "80" }, { kategori: "Kepala Sekolah", jumlah: "40" }], deskripsiKegiatan: "Pelatihan bagi fasilitator BSAN dari seluruh Indonesia untuk meningkatkan kapasitas dalam implementasi program.", tautanMeeting: "" },
  { id: "kg-2", namaKegiatan: "Workshop Pembentukan Pokja BSAN Provinsi Jawa Barat", penyelenggara: ["Dinas Pendidikan Jawa Barat"], pelaksanaan: ["luring"], wilayah: "Bandung", tanggalMulai: "2025-04-05", tanggalSelesai: "2025-04-05", status: "Selesai", peserta: [{ kategori: "Guru", jumlah: "25" }, { kategori: "Pengawas", jumlah: "20" }], deskripsiKegiatan: "Workshop khusus untuk membantu pembentukan Kelompok Kerja BSAN di wilayah Jawa Barat.", tautanMeeting: "" },
  { id: "kg-3", namaKegiatan: "Sosialisasi Program BSAN di Aceh", penyelenggara: ["Dinas Pendidikan Aceh"], pelaksanaan: ["luring"], wilayah: "Banda Aceh", tanggalMulai: "2025-04-18", tanggalSelesai: "2025-04-18", status: "Selesai", peserta: [{ kategori: "Guru", jumlah: "60" }, { kategori: "Masyarakat", jumlah: "20" }], deskripsiKegiatan: "Kegiatan sosialisasi program BSAN kepada seluruh pemangku kepentingan di Provinsi Aceh.", tautanMeeting: "" },
  { id: "kg-4", namaKegiatan: "Webinar Nasional: Budaya Sekolah Aman", penyelenggara: ["Kemendikdasmen"], pelaksanaan: ["daring"], wilayah: "Online", tanggalMulai: "2025-05-12", tanggalSelesai: "2025-05-12", status: "Selesai", peserta: [{ kategori: "Guru", jumlah: "350" }, { kategori: "Siswa", jumlah: "150" }], deskripsiKegiatan: "Webinar nasional yang membahas strategi implementasi budaya sekolah aman dan nyaman.", tautanMeeting: "https://zoom.us/j/webinar-nasional" },
  { id: "kg-5", namaKegiatan: "Bimtek Monitoring dan Evaluasi BSAN", penyelenggara: ["Pusat Penguatan Karakter"], pelaksanaan: ["luring"], wilayah: "Surabaya", tanggalMulai: "2025-05-20", tanggalSelesai: "2025-05-22", status: "Selesai", peserta: [{ kategori: "Tim Monev", jumlah: "60" }], deskripsiKegiatan: "Bimbingan teknis untuk petugas yang menangani monitoring dan evaluasi program BSAN.", tautanMeeting: "" },
  { id: "kg-6", namaKegiatan: "Forum Koordinasi Pokja BSAN Sumatera", penyelenggara: ["Kemendikdasmen", "Dinas Pendidikan Sumut"], pelaksanaan: ["luring", "daring"], wilayah: "Medan", tanggalMulai: "2025-06-03", tanggalSelesai: "2025-06-04", status: "Berlangsung", peserta: [{ kategori: "Pokja", jumlah: "90" }], deskripsiKegiatan: "Forum koordinasi antar Kelompok Kerja BSAN di wilayah Sumatera.", tautanMeeting: "https://zoom.us/j/pokja-sumatera" },
  { id: "kg-7", namaKegiatan: "Pelatihan Guru: Pencegahan Kekerasan di Sekolah", penyelenggara: ["Dinas Pendidikan DKI Jakarta"], pelaksanaan: ["luring"], wilayah: "Jakarta", tanggalMulai: "2025-06-10", tanggalSelesai: "2025-06-12", status: "Berlangsung", peserta: [{ kategori: "Guru", jumlah: "150" }, { kategori: "Konselor", jumlah: "50" }], deskripsiKegiatan: "Pelatihan untuk guru-guru di DKI Jakarta tentang pencegahan dan penanganan kekerasan di lingkungan sekolah.", tautanMeeting: "" },
  { id: "kg-8", namaKegiatan: "Rapat Koordinasi Pokja BSAN Nasional", penyelenggara: ["Kemendikdasmen"], pelaksanaan: ["daring"], wilayah: "Jakarta", tanggalMulai: "2025-06-25", tanggalSelesai: "2025-06-26", status: "Terjadwal", peserta: [{ kategori: "Pokja", jumlah: "150" }], deskripsiKegiatan: "Rapat koordinasi seluruh Pokja BSAN tingkat nasional untuk evaluasi semester pertama.", tautanMeeting: "https://zoom.us/j/pokja-nasional" },
  { id: "kg-9", namaKegiatan: "Workshop BSAN untuk Kepala Sekolah", penyelenggara: ["Dinas Pendidikan Jawa Tengah"], pelaksanaan: ["luring"], wilayah: "Semarang", tanggalMulai: "2025-07-08", tanggalSelesai: "2025-07-09", status: "Terjadwal", peserta: [{ kategori: "Kepala Sekolah", jumlah: "75" }], deskripsiKegiatan: "Workshop khusus kepala sekolah tentang implementasi kebijakan BSAN di tingkat satuan pendidikan.", tautanMeeting: "" },
  { id: "kg-10", namaKegiatan: "Seminar Nasional: Perlindungan Peserta Didik", penyelenggara: ["Kemendikdasmen"], pelaksanaan: ["luring", "daring"], wilayah: "Yogyakarta", tanggalMulai: "2025-07-15", tanggalSelesai: "2025-07-16", status: "Terjadwal", peserta: [{ kategori: "Guru", jumlah: "200" }, { kategori: "Siswa", jumlah: "100" }], deskripsiKegiatan: "Seminar nasional yang membahas isu perlindungan peserta didik dari berbagai perspektif.", tautanMeeting: "https://zoom.us/j/seminar-nasional" },
  { id: "kg-11", namaKegiatan: "Pelatihan Pokja BSAN Kalimantan", penyelenggara: ["Dinas Pendidikan Kaltim"], pelaksanaan: ["luring"], wilayah: "Samarinda", tanggalMulai: "2025-07-22", tanggalSelesai: "2025-07-24", status: "Terjadwal", peserta: [{ kategori: "Pokja", jumlah: "55" }], deskripsiKegiatan: "Pelatihan pembentukan dan penguatan Pokja BSAN di wilayah Kalimantan.", tautanMeeting: "" },
  { id: "kg-12", namaKegiatan: "Forum BSAN Kawasan Timur Indonesia", penyelenggara: ["Kemendikdasmen"], pelaksanaan: ["luring", "daring"], wilayah: "Makassar", tanggalMulai: "2025-08-05", tanggalSelesai: "2025-08-07", status: "Terjadwal", peserta: [{ kategori: "Guru", jumlah: "80" }, { kategori: "Kepala Sekolah", jumlah: "30" }], deskripsiKegiatan: "Forum khusus untuk daerah-daerah di kawasan timur Indonesia dalam mengakselerasi program BSAN.", tautanMeeting: "https://zoom.us/j/forum-timur" },
  { id: "kg-13", namaKegiatan: "Rapat Pokja BSAN Tingkat Nasional", penyelenggara: ["Kemendikdasmen"], pelaksanaan: ["luring"], wilayah: "Jakarta", tanggalMulai: "2026-05-06", tanggalSelesai: "2026-05-06", status: "Berlangsung", peserta: [{ kategori: "Pokja", jumlah: "80" }], deskripsiKegiatan: "Rapat koordinasi pokja BSAN tingkat nasional.", tautanMeeting: "" },
  { id: "kg-14", namaKegiatan: "Sosialisasi Kebijakan BSAN untuk Dinas Pendidikan", penyelenggara: ["Pusat Penguatan Karakter"], pelaksanaan: ["daring"], wilayah: "Online", tanggalMulai: "2026-05-06", tanggalSelesai: "2026-05-06", status: "Berlangsung", peserta: [{ kategori: "Dinas Pendidikan", jumlah: "250" }], deskripsiKegiatan: "Sosialisasi kebijakan BSAN terbaru kepada seluruh dinas pendidikan provinsi.", tautanMeeting: "https://zoom.us/j/sosialisasi-bsan" },
  { id: "kg-15", namaKegiatan: "Pelatihan Guru Anti Bullying", penyelenggara: ["Dinas Pendidikan Jawa Barat"], pelaksanaan: ["luring"], wilayah: "Bandung", tanggalMulai: "2026-05-06", tanggalSelesai: "2026-05-08", status: "Berlangsung", peserta: [{ kategori: "Guru", jumlah: "120" }, { kategori: "Staf BK", jumlah: "30" }], deskripsiKegiatan: "Pelatihan untuk guru-guru mengenai pencegahan dan penanganan bullying di sekolah.", tautanMeeting: "" },
  { id: "kg-16", namaKegiatan: "Workshop Pemetaan Zona Aman Sekolah", penyelenggara: ["Kemendikdasmen"], pelaksanaan: ["luring"], wilayah: "Jakarta", tanggalMulai: "2026-05-06", tanggalSelesai: "2026-05-06", status: "Terjadwal", peserta: [{ kategori: "Guru", jumlah: "40" }, { kategori: "Komite Sekolah", jumlah: "20" }], deskripsiKegiatan: "Workshop pemetaan zona aman di setiap sekolah untuk keselamatan peserta didik.", tautanMeeting: "" },
  { id: "kg-17", namaKegiatan: "Forum Koordinasi Orang Tua - Sekolah", penyelenggara: ["Dinas Pendidikan Banten"], pelaksanaan: ["luring"], wilayah: "Serang", tanggalMulai: "2026-05-06", tanggalSelesai: "2026-05-06", status: "Terjadwal", peserta: [{ kategori: "Orang Tua", jumlah: "70" }, { kategori: "Guru", jumlah: "30" }], deskripsiKegiatan: "Forum koordinasi antara orang tua dan sekolah untuk mendukung program BSAN.", tautanMeeting: "" },
  { id: "kg-18", namaKegiatan: "Pelatihan Pengembangan Kurikulum BSAN", penyelenggara: ["Kemendikdasmen", "Dinas Pendidikan Jawa Barat"], pelaksanaan: ["luring", "daring"], wilayah: "Bandung", tanggalMulai: "2026-05-07", tanggalSelesai: "2026-05-09", status: "Berlangsung", peserta: [{ kategori: "Guru", jumlah: "90" }, { kategori: "Kurikulum", jumlah: "30" }], deskripsiKegiatan: "Pelatihan pengembangan kurikulum terintegrasi BSAN untuk guru-guru di wilayah Jawa Barat.", tautanMeeting: "https://zoom.us/j/kurikulum-bsan" },
  { id: "kg-19", namaKegiatan: "Sosialisasi Pencegahan Perundungan di Sekolah", penyelenggara: ["Dinas Pendidikan Jawa Timur"], pelaksanaan: ["luring"], wilayah: "Surabaya", tanggalMulai: "2026-05-07", tanggalSelesai: "2026-05-07", status: "Berlangsung", peserta: [{ kategori: "Guru", jumlah: "120" }, { kategori: "Siswa", jumlah: "60" }], deskripsiKegiatan: "Sosialisasi dan pelatihan pencegahan perundungan di lingkungan sekolah.", tautanMeeting: "" },
]

const STATUS_OPTIONS = ["Semua", "Berlangsung", "Selesai", "Terjadwal", "Terealisasi"] as const

function StatusBadge({ status }: { status: Kegiatan["status"] }) {
  if (status === "Terealisasi") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
      <CheckCircle className="w-3 h-3" /> Terealisasi
    </span>
  )
  if (status === "Selesai") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      <CheckCircle className="w-3 h-3" /> Selesai
    </span>
  )
  if (status === "Berlangsung") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
      <PlayCircle className="w-3 h-3" /> Berlangsung
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" /> Terjadwal
    </span>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { month: "short", day: "numeric" })
}

function meetingLabel(url: string) {
  const u = url.toLowerCase()
  if (u.includes("zoom.us")) return "Zoom"
  if (u.includes("meet.google")) return "Google Meet"
  if (u.includes("teams.microsoft")) return "Microsoft Teams"
  if (u.includes("webex")) return "Webex"
  return "Meeting Link"
}

type KegiatanContentProps = { hideHeroPrefix?: boolean }
export function KegiatanContent({ hideHeroPrefix = false }: KegiatanContentProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("Semua")
  const [detailKegiatan, setDetailKegiatan] = useState<Kegiatan | null>(null)
  const [selectedProvince, setSelectedProvince] = useState("")
  const [selectedKota, setSelectedKota] = useState("")
  const [showWilayahModal, setShowWilayahModal] = useState(false)
  const [modalBrowseProvince, setModalBrowseProvince] = useState<string | null>(null)
  const [modalPendingProvince, setModalPendingProvince] = useState("")
  const [modalPendingKota, setModalPendingKota] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return MOCK_KEGIATAN.filter((r) => {
      if (statusFilter !== "Semua" && r.status !== statusFilter) return false
      if (q && !r.namaKegiatan.toLowerCase().includes(q) &&
          !r.penyelenggara.some(p => p.toLowerCase().includes(q)) &&
          !r.wilayah.toLowerCase().includes(q)) return false
      if (selectedKota) return r.wilayah.toLowerCase().includes(selectedKota.toLowerCase())
      if (selectedProvince) return r.wilayah.toLowerCase().includes(selectedProvince.toLowerCase())
      return true
    })
  }, [search, statusFilter, selectedProvince, selectedKota])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="pt-16">
        <div className="bg-[#C8F1F7]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-end">
              <div className="pb-16 pt-16">
                {!hideHeroPrefix && <h1 className="text-sm md:text-base font-bold text-slate-800">Program &amp; Aktivitas</h1>}
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-1">Kegiatan BSAN</h1>
                <p className="mt-3 text-slate-700 text-base max-w-xl">
                  Daftar kegiatan pelatihan, workshop, sosialisasi, dan forum koordinasi program Budaya Sekolah Aman dan Nyaman di seluruh Indonesia.
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
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-slate-900">Data Kegiatan BSAN</h2>
                <button
                  onClick={() => { setModalPendingProvince(selectedProvince); setModalPendingKota(selectedProvince ? selectedKota : null); setModalBrowseProvince(selectedProvince || null); setShowWilayahModal(true) }}
                  className="h-9 px-3 text-sm border border-slate-400 rounded-lg bg-white text-slate-800 font-medium hover:bg-slate-50 hover:border-slate-500 transition-colors flex items-center gap-2"
                >
                  <span className="max-w-[200px] truncate">
                    {selectedKota ? `${selectedKota}, ${selectedProvince}` : selectedProvince || "Seluruh Indonesia"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
                <p className="text-slate-400 text-xs mt-0.5">{filtered.length} kegiatan</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                  className="h-9 px-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white text-slate-700 shrink-0"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === "Semua" ? "Semua Status" : s}</option>)}
                </select>
                <div className="relative flex-1 sm:flex-none sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari kegiatan..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                  <TableHead className="text-slate-500 text-xs pl-5">Nama Kegiatan</TableHead>
                  <TableHead className="w-28 text-slate-500 text-xs">Tanggal</TableHead>
                  <TableHead className="w-52 text-slate-500 text-xs">Lokasi</TableHead>
                  <TableHead className="w-36 text-slate-500 text-xs">Peserta</TableHead>
                  <TableHead className="w-32 text-slate-500 text-xs">Status</TableHead>
                  <TableHead className="w-24 text-slate-500 text-xs text-right pr-5">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => setDetailKegiatan(row)}
                  >
                    <TableCell className="pl-5">
                      <div className="font-medium text-slate-900">{row.namaKegiatan}</div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm whitespace-nowrap">
                      {row.tanggalMulai === row.tanggalSelesai
                        ? formatDateShort(row.tanggalMulai)
                        : `${formatDateShort(row.tanggalMulai)} – ${formatDateShort(row.tanggalSelesai)}`}
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {row.pelaksanaan.includes("luring") && row.pelaksanaan.includes("daring") ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Hybrid</span>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-700">{row.wilayah}</span>
                            <span className="text-slate-300">|</span>
                            {row.tautanMeeting ? (
                              <a
                                href={row.tautanMeeting}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {meetingLabel(row.tautanMeeting)}
                              </a>
                            ) : (
                              <span className="text-slate-400">Online</span>
                            )}
                          </div>
                        </div>
                      ) : row.pelaksanaan.includes("luring") ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Luring</span>
                          <span className="text-sm text-slate-700">{row.wilayah}</span>
                        </div>
                      ) : row.pelaksanaan.includes("daring") ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Daring</span>
                          {row.tautanMeeting ? (
                            <a
                              href={row.tautanMeeting}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {meetingLabel(row.tautanMeeting)}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">Online</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {row.peserta.length > 0
                        ? row.peserta.map((p) => (
                            <span key={p.kategori} className="inline-block mr-1 last:mr-0 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded whitespace-nowrap">
                              {p.kategori}
                            </span>
                          ))
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-right pr-5">
                      <span
                        onClick={(e) => { e.stopPropagation(); setDetailKegiatan(row) }}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition border border-blue-200 whitespace-nowrap cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detail
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages >= 1 && (
              <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <p className="text-slate-400 text-xs">
                  Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 px-3 text-xs border-slate-200">Sebelumnya</Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2).map(p => (
                    <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => setPage(p)}
                      className={cn("h-8 w-8 p-0 text-xs", p === page ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : "border-slate-200")}>
                      {p}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-8 px-3 text-xs border-slate-200">Berikutnya</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {detailKegiatan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetailKegiatan(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

            <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 rounded-t-2xl">
              <h3 className="text-base font-bold text-gray-900">Detail Kegiatan</h3>
              <button onClick={() => setDetailKegiatan(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">Nama Kegiatan</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{detailKegiatan.namaKegiatan}</p>
                <div className="flex items-center flex-wrap gap-2 mt-2.5">
                  <StatusBadge status={detailKegiatan.status} />
                  {detailKegiatan.penyelenggara.length > 0 && detailKegiatan.penyelenggara.map((p) => (
                    <span key={p} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">{p}</span>
                  ))}
                </div>
              </div>

              {detailKegiatan.deskripsiKegiatan && (
                <>
                  <div className="border-t border-gray-100" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">Deskripsi</p>
                    <p className="text-sm text-slate-700 mt-1 leading-relaxed">{detailKegiatan.deskripsiKegiatan}</p>
                  </div>
                </>
              )}

              <div className="border-t border-gray-100" />

              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest mb-3">Waktu &amp; Tempat</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tanggal</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {formatDate(detailKegiatan.tanggalMulai)}{detailKegiatan.tanggalMulai !== detailKegiatan.tanggalSelesai ? ` – ${formatDate(detailKegiatan.tanggalSelesai)}` : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Pelaksanaan</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {detailKegiatan.pelaksanaan.includes("luring") && (
                        <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full">Luring</span>
                      )}
                      {detailKegiatan.pelaksanaan.includes("daring") && (
                        <span className="text-xs font-medium bg-cyan-100 text-cyan-700 px-2.5 py-0.5 rounded-full">Daring</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Lokasi</p>
                    <p className="text-sm text-slate-700 mt-1">{detailKegiatan.wilayah}</p>
                  </div>
                  {detailKegiatan.pelaksanaan.includes("daring") && (
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tautan Meeting</p>
                      {detailKegiatan.tautanMeeting ? (
                        <a href={detailKegiatan.tautanMeeting} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline mt-1 inline-block">
                          {meetingLabel(detailKegiatan.tautanMeeting)}
                        </a>
                      ) : (
                        <p className="text-sm text-slate-400 mt-1">-</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest mb-3">Peserta</p>
                {detailKegiatan.peserta.length > 0 ? (
                  <div className="space-y-2">
                    {detailKegiatan.peserta.map((p) => (
                      <div key={p.kategori} className="flex items-center justify-between">
                        <span className="text-sm text-slate-700">{p.kategori}</span>
                        <span className="text-sm font-semibold text-slate-900">{p.jumlah} orang</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">-</p>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {showWilayahModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowWilayahModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Filter Wilayah</h3>
              <button onClick={() => setShowWilayahModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex h-full max-h-[420px]">
                <div className="w-1/2 border-r border-gray-100 overflow-y-auto">
                  <div className="p-2 space-y-0.5">
                    <button onClick={() => { setModalPendingProvince(""); setModalPendingKota(null); setModalBrowseProvince(null) }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!modalBrowseProvince && modalPendingProvince === "" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"}`}>Seluruh Indonesia</button>
                    <div className="border-t border-gray-100 my-1" />
                    {PROVINCE_OPTIONS.map((province) => {
                      const isBrowsed = modalBrowseProvince === province
                      return (
                        <button key={province} onClick={() => { setModalBrowseProvince(province); setModalPendingProvince(province); setModalPendingKota(null) }} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${isBrowsed ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-700"}`}>
                          <span className="truncate">{province}</span>
                          {isBrowsed && <svg className="w-3.5 h-3.5 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="w-1/2 overflow-y-auto bg-gray-50/40">
                  <div className="p-2 space-y-0.5">
                    {modalBrowseProvince ? (() => {
                      const kotaList = PROVINSI_DATA.filter(p => p.provinsi.startsWith(modalBrowseProvince + " - ")).map(p => p.provinsi.split(" - ")[1])
                      return (
                        <>
                          <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{modalBrowseProvince}</p>
                          <button onClick={() => setModalPendingKota("")} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${modalPendingKota === "" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100 text-gray-700"}`}>Semua Kabupaten/Kota</button>
                          {kotaList.length > 0 && <div className="border-t border-gray-100 my-1" />}
                          {kotaList.map((kota) => (
                            <button key={kota} onClick={() => setModalPendingKota(kota)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${modalPendingKota === kota ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100 text-gray-700"}`}>{kota}</button>
                          ))}
                        </>
                      )
                    })() : <p className="text-sm text-gray-400 p-4">Pilih provinsi di kiri untuk melihat kab/kota</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowWilayahModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition">Batal</button>
              <button onClick={() => { setSelectedProvince(modalPendingProvince); setSelectedKota(modalPendingKota ?? ""); setShowWilayahModal(false) }} disabled={modalBrowseProvince !== null && modalPendingKota === null} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed">Terapkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
