"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, BookOpen, Calendar, ChevronLeft, ChevronRight, ChevronDown, MapPin, X } from "lucide-react"
import { PieChart, Pie, Cell, Label } from "recharts"
import { TOTAL_PROVINSI, TOTAL_KAB_KOTA, PROVINSI_DATA, KAB_KOTA_PER_PROVINSI } from "@/data/provinsiData"
import { MOCK_KEGIATAN } from "@/components/landing/KegiatanContent"
import { SEED, KATEGORI_CONFIG } from "@/components/dashboard/SumberRujukanView"
import type { KategoriDukungan } from "@/components/dashboard/SumberRujukanView"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

const ALL_VERIFIED = SEED.filter((i) => i.status === "terverifikasi")

const CHART_COLORS: Record<KategoriDukungan, string> = {
  "Fasilitas Kesehatan": "#ef4444",
  "Konseling":           "#8b5cf6",
  "Bantuan Hukum":       "#3b82f6",
  "Kepolisian":          "#0ea5e9",
  "Psikologi":           "#ec4899",
  "Pendidikan":          "#22c55e",
  "Sosial":              "#f97316",
  "Lainnya":             "#94a3b8",
}

const PROVINCE_OPTIONS = PROVINSI_DATA.filter((p) => !p.provinsi.includes(" - ")).map((p) => p.provinsi).sort()

function Divider() {
  return <div className="hidden lg:block w-px self-stretch bg-slate-200 shrink-0" />
}

export default function LandingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState("")
  const [selectedKota, setSelectedKota] = useState("")
  const [showWilayahModal, setShowWilayahModal] = useState(false)
  const [modalBrowseProvince, setModalBrowseProvince] = useState<string | null>(null)
  const [modalPendingProvince, setModalPendingProvince] = useState("")
  const [modalPendingKota, setModalPendingKota] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [activityPage, setActivityPage] = useState(0)
  const [activityStatusFilter, setActivityStatusFilter] = useState<string>("Berlangsung")
  const [showProvinsiList, setShowProvinsiList] = useState(false)
  const [expandAllProvinsi, setExpandAllProvinsi] = useState(false)
  const [showKabKotaList, setShowKabKotaList] = useState(false)
  const [expandAllKabKota, setExpandAllKabKota] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSelectedDate(new Date())
  }, [])

  useEffect(() => {
    if (selectedProvince === "__hanya_provinsi__") {
      setShowProvinsiList(true)
    }
  }, [selectedProvince])

  useEffect(() => {
    const auth = localStorage.getItem("auth")
    if (auth) {
      try {
        const parsed = JSON.parse(auth)
        if (parsed.role === "pusat" || parsed.role === "dinas" || parsed.role === "sekolah") {
          router.replace("/dashboard")
          return
        }
      } catch {}
    }
  }, [router])

  const filteredPokja = useMemo(() => {
    if (selectedProvince === "__hanya_provinsi__") return PROVINSI_DATA.filter((p) => !p.provinsi.includes(" - "))
    if (selectedKota) return PROVINSI_DATA.filter((p) => p.provinsi === `${selectedProvince} - ${selectedKota}`)
    if (selectedProvince) return PROVINSI_DATA.filter((p) => p.provinsi === selectedProvince || p.provinsi.startsWith(selectedProvince + " - "))
    return PROVINSI_DATA
  }, [selectedProvince, selectedKota])

  const pokjaAktif = filteredPokja.filter((p) => p.statusPokja === "Aktif" && !p.provinsi.includes(" - ")).length
  const totalKabKotaFiltered = filteredPokja.reduce((s, p) => s + p.pokjaKabKota, 0)
  const kabKotaDenominator = selectedProvince ? (KAB_KOTA_PER_PROVINSI[selectedProvince] ?? TOTAL_KAB_KOTA) : TOTAL_KAB_KOTA

  const filteredSumber = useMemo(() => {
    return ALL_VERIFIED.filter((i) => {
      if (selectedProvince === "__hanya_provinsi__") return true
      if (selectedKota) return i.provinsi === selectedProvince && i.kabupatenKota === selectedKota
      if (selectedProvince) return i.provinsi === selectedProvince
      return true
    })
  }, [selectedProvince, selectedKota])

  const sumberChartData = useMemo(() =>
    (Object.keys(KATEGORI_CONFIG) as KategoriDukungan[]).map((key) => ({
      name: KATEGORI_CONFIG[key].label,
      value: filteredSumber.filter((i) => i.kategoriBentukDukungan === key).length,
      fill: CHART_COLORS[key],
    })).filter((d) => d.value > 0)
  , [filteredSumber])

  const filteredActivities = useMemo(() => {
    if (selectedProvince === "__hanya_provinsi__") return MOCK_KEGIATAN
    if (selectedKota) return MOCK_KEGIATAN.filter((k) => k.wilayah.toLowerCase().includes(selectedKota.toLowerCase()))
    return MOCK_KEGIATAN
  }, [selectedProvince, selectedKota])

  const monthActivities = useMemo(() => {
    setActivityPage(0)
    if (!selectedDate) return []
    return filteredActivities.filter(k => {
      const actDate = new Date(k.tanggalMulai)
      const sameMonthYear = actDate.getMonth() === selectedDate.getMonth() && actDate.getFullYear() === selectedDate.getFullYear()
      const matchStatus = activityStatusFilter === "Semua" || k.status === activityStatusFilter
      return sameMonthYear && matchStatus
    })
  }, [filteredActivities, selectedDate, activityStatusFilter])

  const ACTIVITY_PAGE_SIZE = 3
  const totalActivityPages = Math.max(1, Math.ceil(monthActivities.length / ACTIVITY_PAGE_SIZE))
  const pagedActivities = monthActivities.slice(activityPage * ACTIVITY_PAGE_SIZE, (activityPage + 1) * ACTIVITY_PAGE_SIZE)

  const isFiltered = selectedProvince !== ""

  return (
    <main>
      <LandingNavbar />
      <div className="min-h-screen bg-slate-50">
        <div className="pt-16">
          <div className="bg-[#C8F1F7]">
            <div className="max-w-6xl mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-8 items-end">
                <div className="pb-16 pt-16">
                  <p className="text-sm md:text-base font-bold text-slate-800">Selamat Datang di</p>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-1">Portal Budaya Sekolah Aman dan Nyaman (BSAN)</h1>
                  <p className="mt-3 text-slate-700 text-base max-w-xl">Lihat informasi pembentukan kelompok kerja BSAN beserta beragam informasi dan Sumber Dukungan di Daerah Anda.</p>
                </div>
                <div className="hidden md:block self-end">
                  <img src="/herobsan.png" alt="Ilustrasi BSAN" className="w-full h-auto rounded-2xl" />
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 shrink-0">Ringkasan Portal BSAN</h2>
                <button
                  onClick={() => { setModalPendingProvince(selectedProvince); setModalPendingKota(selectedProvince ? selectedKota : null); setModalBrowseProvince(selectedProvince || null); setShowWilayahModal(true) }}
                  className="h-9 px-3 text-sm border border-slate-400 rounded-lg bg-white text-slate-800 font-medium hover:bg-slate-50 hover:border-slate-500 transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="max-w-[200px] truncate">
                    {selectedProvince === "__hanya_provinsi__" ? "Hanya Tingkat Provinsi" : selectedKota ? `${selectedKota}, ${selectedProvince}` : selectedProvince || "Seluruh Indonesia"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
                {isFiltered && (
                  <button onClick={() => { setSelectedProvince(""); setSelectedKota("") }} className="h-9 px-3 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">Reset</button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-400">
                  Update terakhir: {mounted ? `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} | ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Kelompok Kerja */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="bg-slate-50 lg:w-56 p-6 shrink-0">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center mb-3"><Users className="w-5 h-5 text-white" /></div>
                      <h3 className="font-bold text-slate-900">Kelompok Kerja</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">Pembentukan Pokja BSAN di seluruh Indonesia</p>
                    </div>
                  </div>
                  <div className="flex-1 px-6 py-7 min-h-[200px] flex gap-6 relative items-center">
                    {filteredPokja.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center">
                        <p className="text-sm font-medium text-slate-500">Belum ada data Kelompok Kerja</p>
                        <p className="text-xs text-slate-400">untuk wilayah yang dipilih</p>
                      </div>
) : selectedProvince && selectedProvince !== "__hanya_provinsi__" ? selectedKota ? (
                      <div className="flex flex-1 gap-6 min-w-0 items-center">
                        <div className="shrink-0 flex flex-col justify-center h-[168px]">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status Kelompok Kerja</p>
                          {(() => {
                            const row = filteredPokja[0]
                            const isAktif = row?.statusPokja === "Aktif"
                            return (
                              <span className={cn("inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold w-fit", isAktif ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200")}>
                                {isAktif ? "Aktif" : "Belum Terbentuk"}
                              </span>
                            )
                          })()}
                        </div>
                        <div className="flex-1" />
                        <Divider />
                        <Button onClick={() => router.push(`/kelompok-kerja?provinsi=${encodeURIComponent(selectedProvince)}&kota=${encodeURIComponent(selectedKota)}`)} size="sm" className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 gap-1">Lihat Detail <ArrowRight className="w-3.5 h-3.5" /></Button>
                      </div>
                    ) : (
                      <div className="flex flex-1 gap-6 min-w-0">
                          <div className="shrink-0 flex flex-col justify-center h-[168px] w-36">
                            {(() => {
                              const kabKotaDenominator = KAB_KOTA_PER_PROVINSI[selectedProvince] || 0
                              const provinceRow = filteredPokja.find(p => p.provinsi === selectedProvince)
                              const provinceActive = provinceRow?.statusPokja === "Aktif" ? 1 : 0
                              const activeList = filteredPokja.filter(p => p.statusPokja === "Aktif" && p.provinsi.includes(" - "))
                              const totalKabKotaTerbentuk = activeList.length
                              const percentage = kabKotaDenominator > 0 ? Math.round((totalKabKotaTerbentuk / kabKotaDenominator) * 100) : 0
                              return (
                                <>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kelompok Kerja Terbentuk</p>
                                  <p className="text-3xl font-extrabold text-slate-700 tabular-nums leading-none">{percentage}%</p>
                                  <p className="text-xs text-slate-400 mt-1">{provinceActive} dari 1 Provinsi dan {totalKabKotaTerbentuk} dari {kabKotaDenominator} kab/kota</p>
                                </>
                              )
                            })()}
                          </div>
                          <Divider />
<div className="flex-1 min-w-0 py-2">
                          {(() => {
                            const kabKotaDenominator = KAB_KOTA_PER_PROVINSI[selectedProvince] || 0
                            const provinceRow = filteredPokja.find(p => p.provinsi === selectedProvince)
                            const provinceActive = provinceRow?.statusPokja === "Aktif" ? [selectedProvince] : []
                            const activeList = filteredPokja.filter(p => p.statusPokja === "Aktif" && p.provinsi.includes(" - ")).map(p => p.provinsi.split(" - ")[1])
                            const allActiveList = [...provinceActive, ...activeList]
                            const totalKabKotaTerbentuk = activeList.length
                            const percentage = kabKotaDenominator > 0 ? Math.round((totalKabKotaTerbentuk / kabKotaDenominator) * 100) : 0
                            const provinceBelum = provinceRow && provinceRow.statusPokja !== "Aktif" ? [selectedProvince] : []
                            const kabBelumList = PROVINSI_DATA.filter(p => p.provinsi.startsWith(selectedProvince + " - ") && p.statusPokja !== "Aktif").map(p => p.provinsi.split(" - ")[1])
                            const belumList = [...provinceBelum, ...kabBelumList]
                            const displayActive = expandAllKabKota ? allActiveList : allActiveList.slice(0, 3)
                            const displayBelum = expandAllKabKota ? belumList : belumList.slice(0, 3)
                            const hasMore = allActiveList.length > 3 || belumList.length > 3
                            return (
                              <div className={cn("flex flex-col border border-slate-200 rounded-lg overflow-hidden", expandAllKabKota ? "justify-start" : "justify-center", "h-full")}>
                                <div className="flex bg-slate-50 border-b border-slate-200">
                                  <div className="flex-1 px-3 py-2"><p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Terbentuk ({allActiveList.length})</p></div>
                                  <div className="w-px bg-slate-200 shrink-0" />
                                  <div className="flex-1 px-3 py-2 border-l border-slate-200"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Belum Terbentuk ({belumList.length})</p></div>
                                </div>
                                <div className="flex">
                                  <div className="flex-1 flex flex-col gap-1 px-3 py-2">
                                    {displayActive.map((nama, idx) => (
                                      <div key={nama} className="flex items-center gap-1.5 min-w-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                        <span className="text-sm text-slate-700">{nama}</span>
                                        {idx === 0 && (
                                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-semibold shrink-0">Prov</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="w-px bg-slate-100 shrink-0" />
                                  <div className="flex-1 flex flex-col gap-1 px-3 py-2 border-l border-slate-100">
                                    {displayBelum.map((nama, idx) => (
                                      <div key={nama} className="flex items-center gap-1.5 min-w-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                        <span className="text-sm text-slate-700">{nama}</span>
                                        {idx === 0 && allActiveList.length === 0 && (
                                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-semibold shrink-0">Prov</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {hasMore && (
                                  <div className="border-t border-slate-200 px-3 py-2 text-center">
                                    <button onClick={() => setExpandAllKabKota(v => !v)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">{expandAllKabKota ? "Sembunyikan" : "Tampilkan seluruhnya"}</button>
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    ) : selectedProvince === "__hanya_provinsi__" ? (
                      <div className="flex flex-1 gap-6 min-w-0">
                        <div className="w-36 shrink-0 flex flex-col justify-center h-[168px]">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Provinsi Terbentuk</p>
                          <p className="text-3xl font-extrabold text-slate-700 tabular-nums leading-none">{Math.round(pokjaAktif / TOTAL_PROVINSI * 100)}%</p>
                          <p className="text-sm text-slate-400 mt-1">{pokjaAktif} dari {TOTAL_PROVINSI} Provinsi</p>
                        </div>
                        <Divider />
                        <div className="flex-1 min-w-0 py-2">
                          {(() => {
                            const aktifList = filteredPokja.filter(p => p.statusPokja === "Aktif")
                            const belumList = filteredPokja.filter(p => p.statusPokja === "Belum Dibentuk")
                            const hasMore = aktifList.length > 3 || belumList.length > 3
                            const displayAktif = expandAllProvinsi ? aktifList : aktifList.slice(0, 3)
                            const displayBelum = expandAllProvinsi ? belumList : belumList.slice(0, 3)
                            return (
                              <div className={cn("flex flex-col border border-slate-200 rounded-lg overflow-hidden", expandAllProvinsi ? "justify-start" : "justify-center", "h-full")}>
                                <div className="flex bg-slate-50 border-b border-slate-200">
                                  <div className="flex-1 px-3 py-2">
                                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Terbentuk ({pokjaAktif})</p>
                                  </div>
                                  <div className="w-px bg-slate-200 shrink-0" />
                                  <div className="flex-1 px-3 py-2 border-l border-slate-200">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Belum Terbentuk ({TOTAL_PROVINSI - pokjaAktif})</p>
                                  </div>
                                </div>
                                <div className="flex">
                                  <div className="flex-1 flex flex-col gap-1 px-3 py-2">
                                    {displayAktif.map(p => (
                                      <div key={p.provinsi} className="flex items-center gap-1.5 min-w-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                        <span className="text-sm text-slate-700">{p.provinsi}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="w-px bg-slate-100 shrink-0" />
                                  <div className="flex-1 flex flex-col gap-1 px-3 py-2 border-l border-slate-100">
                                    {displayBelum.map(p => (
                                      <div key={p.provinsi} className="flex items-center gap-1.5 min-w-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                        <span className="text-sm text-slate-700">{p.provinsi}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {hasMore && (
                                  <div className="border-t border-slate-200 px-3 py-2 text-center">
                                    <button
                                      onClick={() => setExpandAllProvinsi(v => !v)}
                                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                      {expandAllProvinsi ? "Sembunyikan" : "Tampilkan seluruhnya"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-1 gap-6">
                        <div className="shrink-0">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Provinsi Terbentuk</p>
                          <p className="text-3xl font-extrabold text-slate-700 tabular-nums leading-none">{selectedProvince && selectedProvince !== "__hanya_provinsi__" ? 100 : Math.round(pokjaAktif / TOTAL_PROVINSI * 100)}%</p>
                          <p className="text-sm text-slate-400 mt-1">{selectedProvince && selectedProvince !== "__hanya_provinsi__" ? 1 : pokjaAktif} dari {selectedProvince && selectedProvince !== "__hanya_provinsi__" ? 1 : TOTAL_PROVINSI} Provinsi</p>
                        </div>
                        <Divider />
                        <div className="shrink-0">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kab/Kota Terbentuk</p>
                          <p className="text-3xl font-extrabold text-slate-700 tabular-nums leading-none">{Math.round(totalKabKotaFiltered / kabKotaDenominator * 100)}%</p>
                          <p className="text-sm text-slate-400 mt-1">{totalKabKotaFiltered} dari {kabKotaDenominator} Kab/Kota</p>
                        </div>
                        <Divider />
                        <div className="shrink-0">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{isFiltered ? "Capaian Provinsi" : "Capaian Nasional"}</p>
                          <p className="text-3xl font-extrabold text-slate-700 tabular-nums">{Math.round(((selectedProvince && selectedProvince !== "__hanya_provinsi__" ? 1 : pokjaAktif) + totalKabKotaFiltered) / (selectedProvince && selectedProvince !== "__hanya_provinsi__" ? 1 + kabKotaDenominator : 38 + 514) * 100)}%</p>
                          {!isFiltered && <p className="text-sm text-slate-400 mt-1">{pokjaAktif + totalKabKotaFiltered} dari 552 Provinsi dan Kab/Kota</p>}
                        </div>
                      </div>
                    )}
                      {selectedProvince === "__hanya_provinsi__" && !selectedKota && (
                        <>
                          <Divider />
                          <Button onClick={() => router.push("/kelompok-kerja?hanya_provinsi=true")} size="sm" className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 gap-1 shrink-0">Lihat Detail <ArrowRight className="w-3.5 h-3.5" /></Button>
                        </>
                      )}
                      {!selectedProvince && !selectedKota && (
                        <>
                          <Divider />
                          <Button onClick={() => router.push("/kelompok-kerja")} size="sm" className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 gap-1 shrink-0">Lihat Detail <ArrowRight className="w-3.5 h-3.5" /></Button>
                        </>
                      )}
                      {selectedProvince && selectedProvince !== "__hanya_provinsi__" && !selectedKota && (
                        <>
                          <Divider />
                          <Button onClick={() => router.push(`/kelompok-kerja?provinsi=${encodeURIComponent(selectedProvince)}`)} size="sm" className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 gap-1 shrink-0">Lihat Detail <ArrowRight className="w-3.5 h-3.5" /></Button>
                        </>
                      )}
                    </div>
                </div>
              </div>

              {/* Sumber Dukungan */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="bg-slate-50 lg:w-56 p-6 shrink-0">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center mb-3"><BookOpen className="w-5 h-5 text-white" /></div>
                      <h3 className="font-bold text-slate-900">Sumber Dukungan</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">Layanan terverifikasi untuk implementasi BSAN</p>
                    </div>
                  </div>
                  <div className="flex-1 px-6 py-7 flex items-center gap-6">
                    {filteredSumber.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center">
                        <p className="text-sm font-medium text-slate-500">Belum ada Sumber Dukungan</p>
                        <p className="text-xs text-slate-400">untuk wilayah yang dipilih</p>
                      </div>
                    ) : (
                      <div className="flex flex-1 items-center gap-6">
                        <div className="shrink-0">
                          {mounted ? (
                            <PieChart width={144} height={144}>
                              <Pie data={sumberChartData} cx={72} cy={72} innerRadius={44} outerRadius={66} dataKey="value" stroke="white" strokeWidth={2}>
                                {sumberChartData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                                <Label content={({ viewBox }) => { const { cx, cy } = viewBox as { cx: number; cy: number }; return <text textAnchor="middle" dominantBaseline="middle"><tspan x={cx} y={cy} fontSize={22} fontWeight={800} fill="#475569">{filteredSumber.length}</tspan></text> }} />
                              </Pie>
                            </PieChart>
                          ) : (
                            <svg width={144} height={144}><circle cx={72} cy={72} r={66} fill="#f1f5f9" /><circle cx={72} cy={72} r={44} fill="white" /><text x={72} y={72} textAnchor="middle" dominantBaseline="middle" fontSize={22} fontWeight="800" fill="#475569">{filteredSumber.length}</text></svg>
                          )}
                        </div>
                        <div className="flex-1 border border-slate-100 rounded-lg overflow-hidden divide-y divide-slate-100">
                          {Array.from({ length: Math.ceil(sumberChartData.length / 2) }, (_, rowIdx) => (
                            <div key={rowIdx} className="grid grid-cols-2 divide-x divide-slate-100">
                              {sumberChartData.slice(rowIdx * 2, rowIdx * 2 + 2).map((entry) => {
                                const pct = filteredSumber.length > 0 ? Math.round(entry.value / filteredSumber.length * 100) : 0
                                return (
                                  <div key={entry.name} className="flex items-center gap-1.5 text-sm px-3 py-2.5 overflow-hidden">
                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: entry.fill }} />
                                    <span className="font-bold text-slate-600 tabular-nums shrink-0">{entry.value}</span>
                                    <span className="text-slate-700 text-xs truncate min-w-0">{entry.name}</span>
                                    <span className="text-xs font-semibold text-emerald-600 shrink-0">({pct}%)</span>
                                  </div>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <Divider />
                    <Button onClick={() => router.push("/sumber-dukungan")} size="sm" className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 gap-1 shrink-0">Lihat Detail <ArrowRight className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </div>

              {/* Kegiatan */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="bg-slate-50 lg:w-56 p-6 shrink-0">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center mb-3"><Calendar className="w-5 h-5 text-white" /></div>
                      <h3 className="font-bold text-slate-900">Kegiatan</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">Pelatihan, workshop &amp; forum koordinasi BSAN</p>
                    </div>
                  </div>
                  <div className="flex-1 px-6 py-7 min-h-[200px] flex items-start gap-6">
                    {!mounted ? null : filteredActivities.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center py-4">
                        <p className="text-sm font-medium text-slate-500">Belum ada Kegiatan</p>
                        <p className="text-xs text-slate-400">untuk wilayah yang dipilih</p>
                      </div>
                    ) : (
                      <div className="flex-1 grid grid-cols-[164px_1fr] gap-5 items-stretch">
                        {/* Stat Table 1x3 */}
                        <div className="w-[164px] shrink-0 flex flex-col gap-2 self-stretch">
                          <div className="flex items-center justify-between h-8">
                            <button onClick={() => shiftMonth(-1)} className="p-0.5 rounded hover:bg-slate-100 text-slate-400 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              {selectedDate ? selectedDate.toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : ""}
                            </span>
                            <button onClick={() => shiftMonth(1)} className="p-0.5 rounded hover:bg-slate-100 text-slate-400 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
                          </div>
                          <div className="border border-slate-200 rounded-lg overflow-hidden">
                            {(() => {
                              const rows = [
                                { label: "Berlangsung", count: filteredActivities.filter(k => { if (!selectedDate) return false; const d = new Date(k.tanggalMulai); return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear() && k.status === "Berlangsung" }).length, status: "Berlangsung", color: "bg-blue-500" },
                                { label: "Terjadwal", count: filteredActivities.filter(k => { if (!selectedDate) return false; const d = new Date(k.tanggalMulai); return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear() && k.status === "Terjadwal" }).length, status: "Terjadwal", color: "bg-amber-500" },
                                { label: "Selesai", count: filteredActivities.filter(k => { if (!selectedDate) return false; const d = new Date(k.tanggalMulai); return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear() && k.status === "Selesai" }).length, status: "Selesai", color: "bg-emerald-500" },
                              ]
                              return (
                                <table className="w-full text-sm">
                                  <tbody>
                                    {rows.map((row, idx) => (
                                      <tr
                                        key={row.label}
                                        onClick={() => setActivityStatusFilter(row.status)}
                                        className={cn("cursor-pointer transition-colors", idx < rows.length - 1 ? "border-b border-slate-200" : "", activityStatusFilter === row.status ? "bg-blue-50" : "hover:bg-slate-50")}
                                      >
                                        <td className="flex items-center justify-between gap-2 px-3 py-2">
                                          <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${row.color} shrink-0`} />
                                            <span className={cn("text-slate-600 truncate", activityStatusFilter === row.status && "font-semibold text-blue-700")}>{row.label}</span>
                                          </div>
                                          <span className="font-bold text-slate-700 tabular-nums">{row.count}</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )
                            })()}
                          </div>
                        </div>
                        {/* Divider vertikal */}
                        <div className="flex flex-col gap-2 self-stretch">
                          <div className="flex items-center justify-between h-8 shrink-0">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kegiatan</p>
                            {totalActivityPages > 1 && (
                              <div className="flex items-center gap-0.5">
                                <button onClick={() => setActivityPage(p => Math.max(0, p - 1))} disabled={activityPage === 0} className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
                                <span className="text-[10px] text-slate-400 tabular-nums">{activityPage + 1}/{totalActivityPages}</span>
                                <button onClick={() => setActivityPage(p => Math.min(totalActivityPages - 1, p + 1))} disabled={activityPage >= totalActivityPages - 1} className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
                              </div>
                            )}
                          </div>
                          <div className="border border-slate-100 rounded-lg overflow-hidden">
                            {pagedActivities.length > 0 ? pagedActivities.map(k => (
                              <div key={k.id} className="grid grid-cols-[1fr_auto] border-b border-slate-100 last:border-b-0">
                                <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-1 px-3 py-2">{k.namaKegiatan}</p>
                                <p className="text-xs text-slate-400 whitespace-nowrap px-3 py-2">{k.wilayah} · {new Date(k.tanggalMulai).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</p>
                              </div>
                            )) : (
                              <p className="text-xs text-slate-400 px-3 py-2.5">Tidak ada kegiatan</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <Divider />
                    <Button onClick={() => router.push("/kegiatan")} size="sm" className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 gap-1 shrink-0 self-center">Lihat Detail <ArrowRight className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LandingFooter />

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
                    <button onClick={() => { setModalPendingProvince("__hanya_provinsi__"); setModalPendingKota(null); setModalBrowseProvince(null) }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${modalPendingProvince === "__hanya_provinsi__" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"}`}>Hanya Tingkat Provinsi</button>
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
              <button onClick={() => { setSelectedProvince(modalPendingProvince); setSelectedKota(modalPendingProvince === "__hanya_provinsi__" ? "" : (modalPendingKota ?? "")); setShowWilayahModal(false) }} disabled={modalBrowseProvince !== null && modalPendingKota === null} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed">Terapkan</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )

  function shiftMonth(delta: number) {
    setSelectedDate(d => {
      if (!d) return d
      const next = new Date(d)
      next.setMonth(d.getMonth() + delta)
      return next
    })
  }
}
