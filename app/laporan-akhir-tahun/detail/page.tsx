"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  FileText,
  ArrowLeft,
  ExternalLink,
  Calendar,
  TrendingUp,
  CheckCircle,
  School,
  Building2,
  AlertTriangle,
  Award,
  Search,
  MapPin,
  ChevronDown,
  X,
} from "lucide-react"
import { DIREKTORI_ENTITAS } from "@/data/direktoriInstansi"
import { SekolahIsian, DinasIsian, normalizeNamaInstansi, purgeLegacyLaporan2026 } from "@/lib/laporan-instansi"

interface LaporanItem {
  id: string
  tahun: string
  periodeAwal: string
  periodeAkhir: string
  jumlahKasus: number | null
  skorAkhir: number | null
  tanggalSubmit: string | null
  status: string
  googleFormUrl: string
  googleFormUrls?: Record<string, string>
  catatan: string
  dibuatOleh: string
  sekolahYangMengisi: number
  daftarSekolah: SekolahIsian[]
  daftarDinas?: DinasIsian[]
}

function formatDateDisplay(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
  }
  return dateStr
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T00:00:00")
  }
  const parts = dateStr.match(/(\d+)\s+(\w+)\s+(\d+)/)
  if (parts) {
    const [, day, monthName, year] = parts
    const months: Record<string, string> = {
      Januari: "01", Februari: "02", Maret: "03", April: "04", Mei: "05", Juni: "06",
      Juli: "07", Agustus: "08", September: "09", Oktober: "10", November: "11", Desember: "12"
    }
    const month = months[monthName] || "01"
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }
  return new Date(dateStr)
}

function getStatusFromPeriod(periodeAwal: string, periodeAkhir: string): "terjadwal" | "berlangsung" | "selesai" {
  const now = new Date()
  const start = parseDate(periodeAwal)
  const end = parseDate(periodeAkhir)
  if (!start || !end) return "terjadwal"

  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())

  if (nowDate < startDate) return "terjadwal"
  if (nowDate > endDate) return "selesai"
  return "berlangsung"
}

function StatusBadge({ status }: { status: "terjadwal" | "berlangsung" | "selesai" }) {
  switch (status) {
    case "terjadwal":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          <Calendar className="w-3 h-3" /> Terjadwal
        </span>
      )
    case "berlangsung":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <Calendar className="w-3 h-3" /> Berlangsung
        </span>
      )
    case "selesai":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
          <Calendar className="w-3 h-3" /> Selesai
        </span>
      )
  }
}

type FilterJenis = "semua" | "dinas" | "sekolah"
type FilterStatus = "semua" | "sudah" | "belum"

const PROVINSI_LIST = Array.from(new Set(DIREKTORI_ENTITAS.map((e) => e.provinsi))).sort()

const JENJANG_KEYS: Record<string, string> = {
  PAUD: "paud",
  SD: "sd",
  SMP: "smp",
  SMA: "sma",
  SMK: "smk",
  PKBM: "pkbm",
  SLB: "slb",
  "Sekolah Nasional Terintegrasi": "snt",
  "Dinas Pendidikan": "dinas",
}

function periodFormUrl(
  item: LaporanItem,
  entitas: { jenis: "sekolah" | "dinas"; jenjang: string }
): string {
  const key = JENJANG_KEYS[entitas.jenjang] ?? (entitas.jenis === "dinas" ? "dinas" : "sd")
  return item.googleFormUrls?.[key] ?? item.googleFormUrl ?? ""
}

export default function LaporanDetailPage() {
  const router = useRouter()
  const [item, setItem] = useState<LaporanItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState<FilterJenis>("semua")
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("semua")
  const [search, setSearch] = useState("")
  const [wilayahFilter, setWilayahFilter] = useState("all")
  const [showWilayahModal, setShowWilayahModal] = useState(false)
  const [modalPending, setModalPending] = useState("all")
  const [page, setPage] = useState(1)
  const [scopedProvinsi, setScopedProvinsi] = useState<string | null>(null)
  const [filledNames, setFilledNames] = useState<{ sekolah: Set<string>; dinas: Set<string> }>({
    sekolah: new Set(),
    dinas: new Set(),
  })
  const [indexTarget, setIndexTarget] = useState<{
    nama: string
    jenis: "sekolah" | "dinas"
  } | null>(null)
  const [indexValue, setIndexValue] = useState("")

  useEffect(() => {
    setPage(1)
  }, [filter, statusFilter, search, wilayahFilter])

  useEffect(() => {
    setMounted(true)
    purgeLegacyLaporan2026()
    const params = new URLSearchParams(window.location.search)
    const id = params.get("id")
    const provinsiParam = params.get("provinsi")
    setScopedProvinsi(provinsiParam || null)

    if (!id) {
      router.push("/dashboard")
      return
    }

    const stored = localStorage.getItem("laporanAkhirTahunList")
    if (stored) {
      const list = JSON.parse(stored) as LaporanItem[]
      const found = list.find((l) => l.id === id)
      if (found) {
        const sekolah = new Set<string>()
        const dinas = new Set<string>()
        const prefixSekolah = "formFilled-sekolah-"
        const prefixDinas = "formFilled-dinas-"
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (!key) continue
          let target: Set<string> | null = null
          let prefix = ""
          if (key.startsWith(prefixSekolah)) {
            target = sekolah
            prefix = prefixSekolah
          } else if (key.startsWith(prefixDinas)) {
            target = dinas
            prefix = prefixDinas
          }
          if (!target) continue
          try {
            const flags = JSON.parse(localStorage.getItem(key) || "{}") as Record<string, boolean>
            if (flags[found.tahun] === true) {
              target.add(normalizeNamaInstansi(key.slice(prefix.length)))
            }
          } catch {
            /* abaikan */
          }
        }
        setFilledNames({ sekolah, dinas })

        // Lengkapi entri pengisian yang belum punya data submit (mis. ditandai
        // pada versi sebelumnya) agar tanggal submit & link formulir tampil.
        if (provinsiParam) {
          setItem(found)
          setLoading(false)
          return
        }
        const tanggal = new Date().toISOString().slice(0, 10)
        const daftarSekolah = [...(found.daftarSekolah ?? [])]
        const daftarDinas = [...(found.daftarDinas ?? [])]
        const punyaSekolah = new Set(daftarSekolah.map((s) => normalizeNamaInstansi(s.namaSekolah)))
        const punyaDinas = new Set(daftarDinas.map((d) => normalizeNamaInstansi(d.namaDinas)))
        let berubah = false
        DIREKTORI_ENTITAS.forEach((entitas) => {
          const key = normalizeNamaInstansi(entitas.nama)
          if (entitas.jenis === "dinas") {
            if (dinas.has(key) && !punyaDinas.has(key)) {
              daftarDinas.push({
                id: `dinas-${entitas.id}`,
                namaDinas: entitas.nama,
                skor: null,
                googleFormResponseUrl: "",
                tanggalSubmit: tanggal,
              })
              berubah = true
            }
          } else if (sekolah.has(key) && !punyaSekolah.has(key)) {
            daftarSekolah.push({
              id: `sek-${entitas.id}`,
              namaSekolah: entitas.nama,
              jumlahKasus: 0,
              skor: null,
              googleFormResponseUrl: "",
              tanggalSubmit: tanggal,
            })
            berubah = true
          }
        })

        if (berubah) {
          const updatedItem: LaporanItem = {
            ...found,
            daftarSekolah,
            daftarDinas,
            sekolahYangMengisi: daftarSekolah.length,
          }
          const fullList = list.map((l) => (l.id === found.id ? updatedItem : l))
          localStorage.setItem("laporanAkhirTahunList", JSON.stringify(fullList))
          setItem(updatedItem)
        } else {
          setItem(found)
        }
      } else {
        router.push("/dashboard")
      }
    } else {
      router.push("/dashboard")
    }
    setLoading(false)
  }, [router])

  const rows = useMemo(() => {
    if (!item) return []
    const sekolahByName = new Map<string, SekolahIsian>()
    ;(item.daftarSekolah ?? []).forEach((s) => {
      sekolahByName.set(normalizeNamaInstansi(s.namaSekolah), s)
    })
    const dinasByName = new Map<string, DinasIsian>()
    ;(item.daftarDinas ?? []).forEach((d) => {
      dinasByName.set(normalizeNamaInstansi(d.namaDinas), d)
    })
    return DIREKTORI_ENTITAS.map((entitas) => {
      const key = normalizeNamaInstansi(entitas.nama)
      const submission =
        entitas.jenis === "dinas" ? dinasByName.get(key) : sekolahByName.get(key)
      const flagged =
        entitas.jenis === "dinas" ? filledNames.dinas.has(key) : filledNames.sekolah.has(key)
      return { entitas, submission, filled: !!submission || flagged }
    })
  }, [item, filledNames])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return null
  }

  const dynamicStatus = getStatusFromPeriod(item.periodeAwal, item.periodeAkhir)

  const isReadOnly = !!scopedProvinsi
  const baseRows = scopedProvinsi
    ? rows.filter((r) => r.entitas.provinsi === scopedProvinsi)
    : rows

  const totalInstansi = baseRows.length
  const totalFilled = baseRows.filter((r) => r.filled).length
  const persen = totalInstansi > 0 ? Math.round((totalFilled / totalInstansi) * 100) : 0

  const skorList = baseRows
    .map((r) => r.submission?.skor)
    .filter((s): s is number => typeof s === "number")
  const rataRata =
    skorList.length > 0
      ? Math.round(skorList.reduce((a, b) => a + b, 0) / skorList.length)
      : isReadOnly
        ? null
        : item.skorAkhir

  const filteredRows = baseRows.filter((r) => {
    if (filter !== "semua" && r.entitas.jenis !== filter) return false
    if (statusFilter === "sudah" && !r.filled) return false
    if (statusFilter === "belum" && r.filled) return false
    if (wilayahFilter !== "all" && r.entitas.provinsi !== wilayahFilter) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      if (
        !r.entitas.nama.toLowerCase().includes(q) &&
        !r.entitas.provinsi.toLowerCase().includes(q)
      )
        return false
    }
    return true
  })

  const wilayahLabel = scopedProvinsi
    ? `Provinsi ${scopedProvinsi}`
    : wilayahFilter === "all"
      ? "Seluruh Indonesia"
      : `Provinsi ${wilayahFilter}`

  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedRows = filteredRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const saveIndeks = () => {
    if (!indexTarget) return
    const nilai = Number(indexValue)
    if (indexValue === "" || isNaN(nilai) || nilai < 0 || nilai > 100) return
    const key = normalizeNamaInstansi(indexTarget.nama)
    const tanggal = new Date().toISOString().slice(0, 10)

    let daftarSekolah = [...(item.daftarSekolah ?? [])]
    let daftarDinas = [...(item.daftarDinas ?? [])]

    if (indexTarget.jenis === "dinas") {
      const i = daftarDinas.findIndex((d) => normalizeNamaInstansi(d.namaDinas) === key)
      if (i >= 0) daftarDinas[i] = { ...daftarDinas[i], skor: nilai }
      else
        daftarDinas.push({
          id: `dinas-${Date.now()}`,
          namaDinas: indexTarget.nama,
          skor: nilai,
          googleFormResponseUrl: "",
          tanggalSubmit: tanggal,
        })
    } else {
      const i = daftarSekolah.findIndex((s) => normalizeNamaInstansi(s.namaSekolah) === key)
      if (i >= 0) daftarSekolah[i] = { ...daftarSekolah[i], skor: nilai }
      else
        daftarSekolah.push({
          id: `sek-${Date.now()}`,
          namaSekolah: indexTarget.nama,
          jumlahKasus: 0,
          skor: nilai,
          googleFormResponseUrl: "",
          tanggalSubmit: tanggal,
        })
    }

    const updatedItem: LaporanItem = {
      ...item,
      daftarSekolah,
      daftarDinas,
      sekolahYangMengisi: daftarSekolah.length,
    }
    try {
      const raw = localStorage.getItem("laporanAkhirTahunList")
      if (raw) {
        const list = JSON.parse(raw) as LaporanItem[]
        localStorage.setItem(
          "laporanAkhirTahunList",
          JSON.stringify(list.map((l) => (l.id === item.id ? updatedItem : l)))
        )
      }
    } catch {
      /* abaikan */
    }
    setItem(updatedItem)
    setIndexTarget(null)
    setIndexValue("")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">
                Laporan Tahun {item.tahun}
              </h1>
              <StatusBadge status={dynamicStatus} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatDateDisplay(item.periodeAwal)} - {formatDateDisplay(item.periodeAkhir)}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <School className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-600">Instansi Sudah Mengisi</span>
            </div>
            <p className="text-3xl font-bold text-blue-700">{persen}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {totalFilled} dari {totalInstansi} instansi
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-600">Rata-rata Skor BSAN</span>
            </div>
            <p className="text-3xl font-bold text-emerald-700">
              {rataRata !== null ? `${rataRata}/100` : "-"}
            </p>
          </div>
        </div>

        {totalFilled === 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Belum ada laporan yang masuk</p>
                <p className="text-xs text-amber-700 mt-1">
                  {dynamicStatus === "terjadwal"
                    ? "Periode pengisian belum dimulai."
                    : "Daftar di bawah menampilkan seluruh dinas dan sekolah beserta statusnya."}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-gray-900">Daftar Dinas &amp; Sekolah</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
              {isReadOnly ? (
                <span className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium flex items-center gap-2 shrink-0">
                  <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="max-w-[180px] truncate">{wilayahLabel}</span>
                </span>
              ) : (
                <button
                  onClick={() => {
                    setModalPending(wilayahFilter)
                    setShowWilayahModal(true)
                  }}
                  className="h-9 px-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 font-medium hover:bg-gray-50 hover:border-gray-400 transition flex items-center gap-2 shrink-0"
                >
                  <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="max-w-[180px] truncate">{wilayahLabel}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              )}
              {!isReadOnly && wilayahFilter !== "all" && (
                <button
                  onClick={() => setWilayahFilter("all")}
                  className="h-9 px-3 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition shrink-0"
                >
                  Reset
                </button>
              )}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterJenis)}
                className="h-9 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-700 shrink-0"
              >
                <option value="semua">Semua Jenis</option>
                <option value="dinas">Dinas</option>
                <option value="sekolah">Sekolah</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                className="h-9 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-700 shrink-0"
              >
                <option value="semua">Semua Status</option>
                <option value="sudah">Sudah mengisi</option>
                <option value="belum">Belum mengisi</option>
              </select>
              <div className="relative flex-1 lg:flex-none lg:w-56 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari instansi / wilayah"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama Instansi</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Jenis</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Tanggal Submit</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Indeks BSAN</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Formulir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                      Tidak ada instansi yang cocok dengan filter.
                    </td>
                  </tr>
                )}
                {pagedRows.map(({ entitas, submission, filled }) => (
                  <tr key={entitas.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{entitas.nama}</p>
                      <p className="text-xs text-gray-500">{entitas.provinsi}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entitas.jenis === "dinas" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          <Building2 className="w-3 h-3" /> Dinas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          <School className="w-3 h-3" /> Sekolah
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {filled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" /> Sudah mengisi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                          Belum mengisi
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 text-xs">
                      {submission ? formatDateDisplay(submission.tanggalSubmit) : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {submission && typeof submission.skor === "number" ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          submission.skor >= 80 ? "bg-green-100 text-green-700" :
                          submission.skor >= 60 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {submission.skor}
                        </span>
                      ) : filled ? (
                        isReadOnly ? (
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            Dalam Proses Penilaian
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setIndexTarget({ nama: entitas.nama, jenis: entitas.jenis })
                              setIndexValue("")
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition whitespace-nowrap"
                          >
                            Isi Indeks BSAN
                          </button>
                        )
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {submission?.googleFormResponseUrl ? (
                        <a
                          href={submission.googleFormResponseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Buka
                        </a>
                      ) : filled ? (
                        periodFormUrl(item, entitas) ? (
                          <a
                            href={periodFormUrl(item, entitas)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-blue-600 hover:bg-blue-50"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Lihat Formulir
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRows.length > 0 && (
            <div className="px-5 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Menampilkan {(currentPage - 1) * PAGE_SIZE + 1} -{" "}
                {Math.min(currentPage * PAGE_SIZE, filteredRows.length)} dari {filteredRows.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="h-8 px-3 text-xs font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Sebelumnya
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1]
                    return (
                      <span key={p} className="flex items-center gap-1.5">
                        {prev && p - prev > 1 && (
                          <span className="text-xs text-gray-400 px-1">...</span>
                        )}
                        <button
                          onClick={() => setPage(p)}
                          className={`h-8 w-8 text-xs font-medium rounded-lg border transition ${
                            p === currentPage
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    )
                  })}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  className="h-8 px-3 text-xs font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {indexTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-gray-900">Isi Indeks BSAN</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">{indexTarget.nama}</p>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nilai Indeks (0 - 100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={indexValue}
              onChange={(e) => setIndexValue(e.target.value)}
              placeholder="Contoh: 85"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            {indexValue !== "" &&
              (Number(indexValue) < 0 || Number(indexValue) > 100) && (
                <p className="text-xs text-red-600 mt-1.5">Nilai harus antara 0 sampai 100.</p>
              )}
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setIndexTarget(null)
                  setIndexValue("")
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                Batal
              </button>
              <button
                onClick={saveIndeks}
                disabled={
                  indexValue === "" ||
                  Number(indexValue) < 0 ||
                  Number(indexValue) > 100
                }
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showWilayahModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowWilayahModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Filter Wilayah</h3>
              <button
                onClick={() => setShowWilayahModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
                aria-label="Tutup"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              <button
                onClick={() => setModalPending("all")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  modalPending === "all"
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                Seluruh Indonesia
              </button>
              <div className="border-t border-gray-100 my-1" />
              {PROVINSI_LIST.map((prov) => (
                <button
                  key={prov}
                  onClick={() => setModalPending(prov)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    modalPending === prov
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowWilayahModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setWilayahFilter(modalPending)
                  setShowWilayahModal(false)
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
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
