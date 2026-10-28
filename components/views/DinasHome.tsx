"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronRight, AlertTriangle, CheckCircle2, Pencil } from "lucide-react"
import { PieChart, Pie, Cell } from "recharts"

export type { PokjaStatus, PokjaItem } from "@/types/pokja"
import type { PokjaItem } from "@/types/pokja"

const RUJUKAN_BREAKDOWN = [
  { label: "Puskesmas / Faskes",  count: 48 },
  { label: "Konselor Sekolah",    count: 37 },
  { label: "Kepolisian",          count: 29 },
  { label: "LBH / Bantuan Hukum", count: 18 },
  { label: "Lainnya",             count: 12 },
]

const RUJUKAN_COLORS = ["#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#64748b"]

type Props = {
  region?: string
  pokjaList?: PokjaItem[]
  targetPokja?: number
  onBuatPokja?: () => void
  onViewDataPokja?: () => void
  onViewSumberRujukan?: () => void
  sumberRujukanStatus?: { total: number; aktif: number; menungguVerifikasi: number; butuhPerbaikan: number }
  onViewActivities?: () => void
  kegiatanStatus?: { total: number; berlangsung: number; menunggu: number; selesai: number }
  isAdminPusat?: boolean
  onValidatePusat?: (pokja: PokjaItem) => void
  onPerbaikiPokja?: (pokja:PokjaItem) => void
  onContinueDraft?: () => void
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-[4px] border border-gray-100 shadow-sm overflow-hidden">{children}</div>
}

function PanelHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#F9F9F9]">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

function ViewBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-8 px-2.5 rounded-[4px] text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200 flex items-center gap-1.5"
    >
      {label} <ChevronRight className="w-3.5 h-3.5" />
    </button>
  )
}

function MiniCalendar() {
  const weekDays = ["M", "S", "S", "R", "K", "J", "S"]
  return (
    <div className="p-3 border border-gray-100 rounded-[4px]">
      <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Juni 2025</p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((d, i) => (
          <p key={`wd-${i}`} className="text-xs font-medium text-gray-400">{d}</p>
        ))}
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={`dt-${i}`} className={`text-xs p-1 rounded ${[14, 17, 21].includes(i + 1) ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-500"}`}>
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}

function VerifyDrawer({ item, onClose, onVerify }: {
  item?: { nama: string; jenis: string; kontak: string }
  onClose: () => void
  onVerify: (item: { nama: string; jenis: string; kontak: string }) => void
}) {
  if (!item) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="w-full bg-white rounded-t-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Detail Verifikasi</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-lg leading-none">{"×"}</button>
        </div>
        <div className="space-y-3 bg-[#F9F9F9] rounded-[4px] p-4">
          {[{ k: "Nama", v: item.nama }, { k: "Jenis", v: item.jenis }, { k: "Kontak", v: item.kontak }].map(({ k, v }) => (
            <div key={k}>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{k}</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{v}</p>
            </div>
          ))}
        </div>
        <button onClick={() => { onVerify(item); onClose() }} className="w-full py-2.5 rounded-[4px] bg-green-600 hover:bg-green-700 text-white font-medium text-sm">Verifikasi Data</button>
        <button onClick={onClose} className="w-full py-2.5 rounded-[4px] bg-[#F9F9F9] hover:bg-gray-200 text-gray-900 font-medium text-sm">Batal</button>
      </div>
    </div>
  )
}

function ProvinceTable() {
  const acehRef = useRef<HTMLDivElement>(null)
  useEffect(() => { setTimeout(() => acehRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300) }, [])

  const provinces = [
    { prov: "Provinsi Jateng", pct: 55 }, { prov: "Provinsi Jatim", pct: 53 },
    { prov: "Provinsi Jabar", pct: 51 }, { prov: "DKI Jakarta", pct: 48 },
    { prov: "Provinsi Bali", pct: 45 }, { prov: "Provinsi Sumut", pct: 47 },
    { prov: "Provinsi Sulsel", pct: 43 }, { prov: "Provinsi Sumsel", pct: 43 },
    { prov: "Provinsi Riau", pct: 42 }, { prov: "Provinsi DI Yogyakarta", pct: 40 },
    { prov: "Provinsi Kaltim", pct: 36 }, { prov: "Provinsi Kalbar", pct: 33 },
    { prov: "Provinsi NTB", pct: 33 }, { prov: "Provinsi Sulut", pct: 33 },
    { prov: "Provinsi Lampung", pct: 30 }, { prov: "Provinsi Kalsel", pct: 30 },
    { prov: "Provinsi Kepri", pct: 29 }, { prov: "Provinsi Jambi", pct: 25 },
    { prov: "Provinsi Kalteng", pct: 25 }, { prov: "Provinsi Sulteng", pct: 25 },
    { prov: "Provinsi Bengkulu", pct: 25 }, { prov: "Provinsi NTT", pct: 20 },
    { prov: "Provinsi Gorontalo", pct: 20 }, { prov: "Provinsi Maluku", pct: 20 },
    { prov: "Provinsi Maluku Utara", pct: 20 }, { prov: "Provinsi Babel", pct: 17 },
    { prov: "Provinsi Sultra", pct: 17 }, { prov: "Provinsi Papua Barat", pct: 17 },
    { prov: "Provinsi Papua", pct: 13 }, { prov: "Provinsi Aceh", pct: 0 },
  ]

  return (
    <div className="flex-1 overflow-y-auto max-h-60 divide-y divide-gray-100">
      {provinces.map((row, i) => (
        <div
          key={row.prov}
          ref={row.prov === "Provinsi Aceh" ? acehRef : null}
          className={`flex items-center gap-2 px-3 py-2.5 ${row.prov === "Provinsi Aceh" ? "bg-blue-50" : ""}`}
        >
          <span className="text-xs font-semibold text-gray-400 w-5 flex-shrink-0">{i + 1}</span>
          <p className={`flex-1 text-xs font-medium truncate ${row.prov === "Provinsi Aceh" ? "text-blue-700" : "text-gray-800"}`}>{row.prov}</p>
          <p className={`text-xs font-bold ${row.prov === "Provinsi Aceh" ? "text-blue-600" : "text-gray-600"}`}>{row.pct}%</p>
        </div>
      ))}
    </div>
  )
}

export function DashboardView({
  region = "Provinsi Aceh",
  pokjaList = [],
  targetPokja = 10,
  onBuatPokja,
  onViewSumberRujukan,
  sumberRujukanStatus = { total: 5, aktif: 3, menungguVerifikasi: 2, butuhPerbaikan: 0 },
  onViewActivities,
  isAdminPusat,
  onValidatePusat,
  onPerbaikiPokja,
  onContinueDraft,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ nama: string; jenis: string; kontak: string } | null>(null)
  const [hoveredRujukan, setHoveredRujukan] = useState<{ label: string; count: number } | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Filter: hanya Region ini & tidak tampil placeholder
  const filteredList = pokjaList.filter((p) => 
    p.data.region === region && p.status !== "belum-dibentuk"
  )
  
  // Jika ada draf, tampilkan hanya draf (yang terbaru). Jika tidak ada, tampilkan yang sudah disubmit
  const draftPokja = filteredList.find(p => p.status === "draf")
  const activePokjaList = draftPokja 
    ? [draftPokja] 
    : filteredList.filter(p => p.status !== "draf").slice(0, 1)
  
  const total    = activePokjaList.length
  const aktif    = draftPokja ? 0 : (activePokjaList[0]?.status === "aktif" ? 1 : 0)
  const menunggu = draftPokja ? 0 : (activePokjaList[0]?.status === "masih-diverifikasi" ? 1 : 0)
  const butuhPerbaikan = draftPokja ? 0 : (activePokjaList[0]?.status === "butuh-perbaikan" ? 1 : 0)
  const pending  = sumberRujukanStatus.menungguVerifikasi

  const pendingData = [
    { nama: "Klinik Sehat Bersama", jenis: "Kesehatan", kontak: "0812-xxx-xxx" },
    { nama: "Psikolog Dina", jenis: "Konseling", kontak: "0813-xxx-xxx" },
  ]

  if (!mounted) return null

  return (
    <main className="space-y-4">
      <div className="px-1">
        <h1 className="text-2xl font-bold text-gray-900">Dasbor BSAN {region}</h1>
      </div>

      <Panel>
        <PanelHeader title="Kelompok Kerja">
          {/* Tampilkan tombol Buat Kelompok Kerja jika: Admin Pusat (bisa banyak) atau Dinas belum punya */}
          {total === 0 && <ViewBtn label="Buat Kelompok Kerja" onClick={onBuatPokja} />}
        </PanelHeader>
        
        {/* Jika belum ada pokja, tampilkan empty state */}
        {total === 0 ? (
          <div className="px-5 py-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Belum Ada Kelompok Kerja</h3>
            <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-4">
              Silakan mulai membuat dan mengajukan pembentukan Kelompok Kerja di wilayah Anda.
            </p>
          </div>
        ) : (
          /* Jika sudah ada pokja, tampilkan informasi detail pokja */
          <div className="px-5 py-4">
            {activePokjaList.map((pokja) => {
              const statusConfig = {
                "draf": {
                  bg: "bg-[#F9F9F9]",
                  border: "border-gray-200",
                  text: "text-gray-700",
                  badge: "bg-[#efefef] text-[#2f3031]",
                  label: "Draf",
                },
                "aktif": {
                  bg: "bg-green-50",
                  border: "border-green-200",
                  text: "text-green-700",
                  badge: "bg-emerald-300 text-emerald-950",
                  label: "Aktif",
                },
                "masih-diverifikasi": {
                  bg: "bg-amber-50",
                  border: "border-amber-200",
                  text: "text-amber-700",
                  badge: "bg-amber-200 text-amber-950",
                  label: "Sedang Diajukan",
                },
                "butuh-perbaikan": {
                  bg: "bg-red-50",
                  border: "border-red-200",
                  text: "text-red-700",
                  badge: "bg-rose-100 text-rose-950",
                  label: "Perlu Perbaikan",
                },
                "belum-dibentuk": {
                  bg: "bg-[#F9F9F9]",
                  border: "border-gray-200",
                  text: "text-gray-700",
                  badge: "bg-[#efefef] text-[#2f3031]",
                  label: "Belum Dibentuk",
                }
              }

              const config = statusConfig[pokja.status as keyof typeof statusConfig] || statusConfig["belum-dibentuk"]
              const ketua = pokja.data?.members?.ketua
              const sk = pokja.data?.sk
              const kanal = pokja.data?.nomorKanal
              const memberCount = pokja.data?.members 
                ? Object.values(pokja.data.members).filter(m => m && m.nama?.trim()).length 
                : 0

              return (
                <div key={pokja.id} className={`rounded-[4px] border-2 ${config.border} ${config.bg} p-5 space-y-4`}>
                  {/* Header dengan nama dan status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{pokja.nama}</h3>
                      <p className="text-sm text-gray-600">{region}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full whitespace-nowrap text-[13px] font-semibold ${config.badge}`}>{config.label}</span>
                    </div>
                  </div>

                  {/* Detail Grid - selalu tampil semua placeholders */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ketua Kelompok Kerja */}
                    <div className="bg-white/60 rounded-[4px] p-3 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ketua Kelompok Kerja</p>
                      {ketua?.nama ? (
                        <>
                          <p className="text-sm font-bold text-gray-900">{ketua.nama}</p>
                          {ketua.instansi && <p className="text-xs text-gray-600 mt-0.5">{ketua.instansi}</p>}
                        </>
                      ) : (
                        <p className="text-sm font-bold text-gray-400">Data belum diinput</p>
                      )}
                    </div>

                    {/* Jumlah Anggota */}
                    <div className="bg-white/60 rounded-[4px] p-3 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Jumlah Angggota</p>
                      <p className="text-sm font-bold text-gray-900">{memberCount > 0 ? `${memberCount} Orang` : "0"}</p>
                    </div>

                    {/* Nomor SK */}
                    <div className="bg-white/60 rounded-[4px] p-3 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nomor SK</p>
                      {sk?.nomorSK ? (
                        <>
                          <p className="text-sm font-bold text-gray-900">{sk.nomorSK}</p>
                          {sk.periodeSelesai && <p className="text-xs text-gray-600 mt-0.5">Berlaku s.d. {sk.periodeSelesai}</p>}
                        </>
                      ) : (
                        <p className="text-sm font-bold text-gray-400">Data belum diinput</p>
                      )}
                    </div>

                    {/* Kanal Pengaduan */}
                    <div className="bg-white/60 rounded-[4px] p-3 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Kanal Pengaduan</p>
                      {kanal ? (
                        <a 
                          href={`https://wa.me/62${kanal.replace(/^0/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-green-600 hover:text-green-700 flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                          {kanal}
                        </a>
                      ) : (
                        <p className="text-sm font-bold text-gray-400">0</p>
                      )}
                    </div>
                  </div>

                  {/* Button Lanjutkan untuk status draf */}
                  {pokja.status === "draf" && onContinueDraft && (
                    <button
                      type="button"
                      onClick={onContinueDraft}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-[4px] bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Lanjutkan Pengisian
                    </button>
                  )}

                  {/* Info tambahan untuk status tertentu */}
                  {pokja.status === "masih-diverifikasi" && (
                    <div className="flex items-start gap-2 p-3 bg-amber-100/50 rounded-[4px] border border-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        Pengajuan Kelompok Kerja sedang dalam proses pemeriksaan oleh Pusat.
                      </p>
                    </div>
                  )}

                  {pokja.status === "butuh-perbaikan" && (() => {
                    const logTolak = [...(pokja.validasiLog ?? [])].reverse().find(l => l.aksi === "tolak")
                    return (
                      <div className="rounded-[4px] border border-red-200 bg-red-50 p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800">Pengajuan Ditolak oleh Admin Pusat</p>
                            {logTolak?.alasan && (
                              <p className="text-xs text-red-700 mt-1 bg-red-100 rounded px-2 py-1.5 border border-red-200">
                                <span className="font-medium">Alasan: </span>{logTolak.alasan}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onPerbaikiPokja?.(pokja)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-[4px] bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                        >
                          Perbaiki Kelompok Kerja
                        </button>
                      </div>
                    )
                  })()}

                  {pokja.status === "aktif" && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-3 bg-green-100/50 rounded-[4px] border border-green-300">
                        <CheckCircle2 className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-green-800">
                          <strong>Kelompok Kerja Aktif:</strong> Kelompok Kerja Anda telah diverifikasi dan aktif. Anda dapat mengelola kegiatan dan Sumber Dukungan.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onPerbaikiPokja?.(pokja)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-[4px] border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-[#F9F9F9] transition-colors"
                      >
                        Ubah Kelompok Kerja
                      </button>
                    </div>
                  )}


                </div>
              )
            })}
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Sumber Dukungan">
          <ViewBtn label="Kelola" onClick={onViewSumberRujukan} />
        </PanelHeader>
        <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative w-44 h-44 flex-shrink-0">
              <PieChart width={176} height={176}>
                  <Pie
                    data={RUJUKAN_BREAKDOWN}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={80}
                    dataKey="count"
                    startAngle={90}
                    endAngle={-270}
                    onMouseEnter={(_, index) => setHoveredRujukan(RUJUKAN_BREAKDOWN[index])}
                    onMouseLeave={() => setHoveredRujukan(null)}
                    stroke="none"
                  >
                    {RUJUKAN_BREAKDOWN.map((entry, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={RUJUKAN_COLORS[i]}
                        opacity={hoveredRujukan && hoveredRujukan.label !== entry.label ? 0.4 : 1}
                        style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {hoveredRujukan ? (
                  <div className="text-center px-2">
                    <p className="text-lg font-bold text-gray-900 leading-tight">{hoveredRujukan.count}</p>
                    <p className="text-sm text-gray-600 leading-tight mt-0.5 max-w-[80px] text-center">{hoveredRujukan.label}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{sumberRujukanStatus.total}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Total</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
              {RUJUKAN_BREAKDOWN.map((r, i) => (
                <div key={r.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: RUJUKAN_COLORS[i] }} />
                  <p className="text-xs text-gray-600">{r.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[4px] border border-gray-100 overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 sticky top-0 bg-[#F1F1F1]">
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Nama</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Jenis</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Kontak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pending > 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-2.5">
                        <div className="rounded-[4px] bg-amber-50 border border-amber-200 p-2.5 flex items-start gap-2.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-amber-800">{pending} Sedang Diajukan</p>
                            <p className="text-xs text-amber-700 mt-0.5">Cek untuk verifikasi data.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {pendingData.map((item, i) => (
                    <tr key={i} className="hover:bg-[#F9F9F9] transition-colors cursor-pointer" onClick={() => setSelectedItem(item)}>
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
      </Panel>

      <Panel>
        <PanelHeader title="Kegiatan">
          <ViewBtn label="Kelola" onClick={onViewActivities} />
        </PanelHeader>
        <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <MiniCalendar />
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Kegiatan Mendatang</p>
            {[
              { tanggal: "14 Jun", judul: "Pelatihan Kelompok Kerja Baru" },
              { tanggal: "17 Jun", judul: "Verifikasi Sumber Dukungan" },
              { tanggal: "21 Jun", judul: "Rapat Koordinasi Bulanan" },
            ].map((k, i) => (
              <div key={i} className="p-2.5 rounded-[4px] bg-[#F9F9F9] border border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer">
                <p className="text-xs font-medium text-gray-700">{k.judul}</p>
                <p className="text-xs text-gray-500 mt-0.5">{k.tanggal}</p>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Riwayat Aktivitas" />
        <div className="px-5 py-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F1F1F1]">
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Waktu</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Pengguna</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { waktu: "12:45", user: "Admin Dinas", aksi: "Verifikasi Sumber Dukungan" },
                { waktu: "11:30", user: "Admin Sekolah", aksi: "Unggah Dokumen Kelompok Kerja" },
                { waktu: "10:15", user: "Admin Dinas", aksi: "Memverifikasi Sumber Dukungan" },
              ].map((log, i) => (
                <tr key={i} className="hover:bg-[#F9F9F9]">
                  <td className="px-3 py-2.5 text-gray-700">{log.waktu}</td>
                  <td className="px-3 py-2.5 text-gray-700">{log.user}</td>
                  <td className="px-3 py-2.5 text-gray-600">{log.aksi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <VerifyDrawer
        item={selectedItem ?? undefined}
        onClose={() => setSelectedItem(null)}
        onVerify={() => {}}
      />
    </main>
  )
}
