"use client"

import { useEffect, useState, useMemo } from "react"
import {
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
} from "lucide-react"
import { readAuthSession } from "@/lib/auth-session"
import { SekolahIsian, DinasIsian, purgeLegacyLaporan2026 } from "@/lib/laporan-instansi"

type StatusLaporan = "terjadwal" | "berlangsung" | "selesai"

interface LaporanItem {
  id: string
  tahun: string
  judul?: string
  deskripsi?: string
  periodeAwal: string
  periodeAkhir: string
  jumlahKegiatan: number | null
  jumlahKasus: number | null
  skorAkhir: number | null
  tanggalSubmit: string | null
  status: StatusLaporan
  createdAt: string
  updatedAt: string
  dibuatOleh: string
  googleFormUrls?: Record<string, string>
  googleFormUrl?: string
  isOpened: boolean
  catatan: string
  sekolahYangMengisi?: number
  daftarSekolah?: SekolahIsian[]
  daftarDinas?: DinasIsian[]
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

function getStatusFromPeriod(periodeAwal: string, periodeAkhir: string): StatusLaporan {
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

function StatusBadge({ status }: { status: StatusLaporan }) {
  switch (status) {
    case "terjadwal":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          <Calendar className="w-3 h-3" /> Belum Dimulai
        </span>
      )
    case "berlangsung":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <Clock className="w-3 h-3" /> Sedang Berlangsung
        </span>
      )
    case "selesai":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
          <CheckCircle className="w-3 h-3" /> Selesai
        </span>
      )
  }
}

function formatDateDisplay(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
  }
  return dateStr
}

// Hanya mengembalikan link yang memang ditujukan untuk instansi ini (kosong = tidak ditujukan).
function resolveForm(
  item: LaporanItem,
  isDinas: boolean,
  namaSekolah?: string
): { url: string; jenjang: string } {
  const urls = item.googleFormUrls
  if (!urls) return { url: item.googleFormUrl ?? "", jenjang: "" }
  if (isDinas) return { url: urls.dinas?.trim() ?? "", jenjang: "Dinas" }

  const name = (namaSekolah ?? "").toUpperCase()
  const matchers: Array<[RegExp, string, string]> = [
    [/PAUD|TK/, "paud", "PAUD"],
    [/SMK/, "smk", "SMK"],
    [/SMA|SMAN/, "sma", "SMA"],
    [/SMP|SMPN/, "smp", "SMP"],
    [/SLB/, "slb", "SLB"],
    [/PKBM/, "nonformal", "Non Formal"],
    [/TERINTEGRASI|SNT/, "snt", "SNT"],
    [/SD|SDN/, "sd", "SD"],
  ]
  const match = matchers.find(([re]) => re.test(name))
  return match
    ? { url: urls[match[1]]?.trim() ?? "", jenjang: match[2] }
    : { url: "", jenjang: "" }
}

function startOfToday(): Date {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

function diffDays(target: string, from: Date): number | null {
  const d = parseDate(target)
  if (!d) return null
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.round((t.getTime() - from.getTime()) / 86400000)
}

type FilterKey = "semua" | StatusLaporan

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "semua", label: "Semua" },
  { key: "berlangsung", label: "Berlangsung" },
  { key: "terjadwal", label: "Akan Datang" },
  { key: "selesai", label: "Selesai" },
]

function FormCard({
  item,
  isDinas,
  namaSekolah,
}: {
  item: LaporanItem
  isDinas: boolean
  namaSekolah?: string
}) {
  const status = getStatusFromPeriod(item.periodeAwal, item.periodeAkhir)
  const { url } = resolveForm(item, isDinas, namaSekolah)
  const today = startOfToday()
  const aktif = status === "berlangsung"

  let countdown: { text: string; tone: string } | null = null
  if (status === "berlangsung") {
    const sisa = diffDays(item.periodeAkhir, today)
    if (sisa !== null) {
      countdown = {
        text: sisa <= 0 ? "Berakhir hari ini" : `Sisa ${sisa} hari`,
        tone: sisa <= 7 ? "text-orange-600 font-semibold" : "text-green-700 font-semibold",
      }
    }
  } else if (status === "terjadwal") {
    const mulai = diffDays(item.periodeAwal, today)
    if (mulai !== null) {
      countdown = {
        text: mulai <= 1 ? "Dibuka besok" : `Dibuka dalam ${mulai} hari`,
        tone: "text-blue-700 font-semibold",
      }
    }
  }

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition ${
        aktif ? "p-5" : "p-4"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <p className={`${aktif ? "text-lg" : "text-base"} font-bold text-gray-900 leading-snug`}>
                {item.judul || `Laporan Tahun ${item.tahun}`}
              </p>
              <StatusBadge status={status} />
            </div>
            {item.deskripsi && (
              <p className="text-sm text-gray-600 mt-1 leading-relaxed line-clamp-3">{item.deskripsi}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                {formatDateDisplay(item.periodeAwal)} - {formatDateDisplay(item.periodeAkhir)}
              </span>
              {countdown && (
                <span className={`flex items-center gap-1.5 ${countdown.tone}`}>
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  {countdown.text}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 sm:self-center">
          {aktif ? (
            <button
              onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
              className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              <ExternalLink className="w-4 h-4" />
              Buka Formulir
            </button>
          ) : (
            <button
              disabled
              className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed"
            >
              {status === "terjadwal"
                ? `Dibuka ${formatDateDisplay(item.periodeAwal)}`
                : "Pengisian telah ditutup"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function LaporanAkhirTahunView({ role }: { role?: "sekolah" | "dinas" }) {
  const session = readAuthSession()
  const activeRole = role ?? (session?.role === "dinas" ? "dinas" : "sekolah")
  const isDinas = activeRole === "dinas"
  const [list, setList] = useState<LaporanItem[]>([])

  useEffect(() => {
    purgeLegacyLaporan2026()
    const stored = localStorage.getItem("laporanAkhirTahunList")
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LaporanItem[]
        const withIsOpened = parsed.map((item) => ({
          ...item,
          isOpened: item.isOpened ?? true,
        }))
        setList(withIsOpened)
      } catch {
        setList([])
      }
    } else {
      setList([])
    }
  }, [])

  const [filter, setFilter] = useState<FilterKey>("semua")

  const items = useMemo(() => {
    return list
      .filter((item) => resolveForm(item, isDinas, session?.namaSekolah).url !== "")
      .map((item) => ({ item, status: getStatusFromPeriod(item.periodeAwal, item.periodeAkhir) }))
      .sort((a, b) => b.item.periodeAwal.localeCompare(a.item.periodeAwal))
  }, [list, isDinas, session?.namaSekolah])

  const sections: Array<{ key: StatusLaporan; title: string }> = [
    { key: "berlangsung", title: "Sedang Berlangsung" },
    { key: "terjadwal", title: "Akan Datang" },
    { key: "selesai", title: "Riwayat" },
  ]
  const visibleSections = sections
    .filter((sec) => filter === "semua" || filter === sec.key)
    .map((sec) => ({ ...sec, rows: items.filter((r) => r.status === sec.key) }))
    .filter((sec) => sec.rows.length > 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Formulir Evaluasi</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {isDinas
              ? "Pengisian laporan kegiatan dan pencapaian dinas sesuai periode yang tersedia"
              : "Pengisian laporan kegiatan dan pencapaian sekolah sesuai periode yang tersedia"}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200" />

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700 text-sm">Belum ada formulir evaluasi</p>
          <p className="text-gray-500 text-xs mt-1">
            Formulir akan muncul setelah Admin Pusat membuat formulir yang ditujukan untuk Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.length > 3 && (
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    filter === f.key
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
          {visibleSections.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6">Tidak ada formulir pada filter ini.</p>
          )}
          {visibleSections.map((sec) => (
            <section key={sec.key} className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700">
                {sec.title} <span className="text-gray-400 font-medium">({sec.rows.length})</span>
              </h3>
              {sec.rows.map(({ item }) => (
                <FormCard key={item.id} item={item} isDinas={isDinas} namaSekolah={session?.namaSekolah} />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
