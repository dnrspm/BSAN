"use client"

import { useEffect, useState, useMemo } from "react"
import {
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  AlertTriangle,
} from "lucide-react"
import { readAuthSession } from "@/lib/auth-session"
import { LAPORAN_STORAGE_KEY, SekolahIsian, DinasIsian, syncSubmission, normalizeNamaInstansi } from "@/lib/laporan-instansi"

type StatusLaporan = "terjadwal" | "berlangsung" | "selesai"

interface LaporanItem {
  id: string
  tahun: string
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
          <Calendar className="w-3 h-3" /> Terjadwal
        </span>
      )
    case "berlangsung":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <Clock className="w-3 h-3" /> Berlangsung
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

function resolveFormUrl(item: LaporanItem, isDinas: boolean, namaSekolah?: string): string {
  const urls = item.googleFormUrls
  if (isDinas) return urls?.dinas ?? item.googleFormUrl ?? ""

  const name = (namaSekolah ?? "").toUpperCase()
  const matchers: Array<[RegExp, string]> = [
    [/PAUD|TK/, "paud"],
    [/SMK/, "smk"],
    [/SMA|SMAN/, "sma"],
    [/SMP|SMPN/, "smp"],
    [/SLB/, "slb"],
    [/PKBM/, "pkbm"],
    [/TERINTEGRASI|SNT/, "snt"],
    [/SD|SDN/, "sd"],
  ]
  for (const [re, key] of matchers) {
    if (re.test(name) && urls?.[key]) return urls[key]
  }
  return item.googleFormUrl ?? urls?.sd ?? (urls ? Object.values(urls)[0] : "") ?? ""
}

export function LaporanAkhirTahunView({ role }: { role?: "sekolah" | "dinas" }) {
  const session = readAuthSession()
  const activeRole = role ?? (session?.role === "dinas" ? "dinas" : "sekolah")
  const isDinas = activeRole === "dinas"
  const identity = isDinas
    ? (session?.namaDinas ?? "Admin Dinas")
    : (session?.namaSekolah ?? "Admin Sekolah")
  const filledStorageKey = `formFilled-${isDinas ? "dinas" : "sekolah"}-${identity}`
  const [list, setList] = useState<LaporanItem[]>([])
  const [filledMap, setFilledMap] = useState<Record<string, boolean>>({})
  const [confirmItem, setConfirmItem] = useState<LaporanItem | null>(null)

  useEffect(() => {
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

    const storedFilled = localStorage.getItem(filledStorageKey)
    if (storedFilled) {
      try {
        setFilledMap(JSON.parse(storedFilled))
      } catch {
        setFilledMap({})
      }
    }
  }, [filledStorageKey])

  const sortedList = useMemo(() => {
    return [...list].sort((a, b) => b.tahun.localeCompare(a.tahun))
  }, [list])

  const openForm = (url: string) => {
    if (!url) return
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const toggleFilled = (tahun: string) => {
    const next = !filledMap[tahun]
    setFilledMap((prev) => {
      const map = { ...prev, [tahun]: next }
      localStorage.setItem(filledStorageKey, JSON.stringify(map))
      return map
    })

    try {
      const raw = localStorage.getItem(LAPORAN_STORAGE_KEY)
      if (!raw) return
      const stored = JSON.parse(raw) as LaporanItem[]
      const updated = stored.map((it) => {
        if (it.tahun !== tahun) return it
        const result = syncSubmission(
          tahun,
          identity,
          isDinas ? "dinas" : "sekolah",
          next,
          it.daftarSekolah ?? [],
          it.daftarDinas ?? []
        )
        return { ...it, ...result, sekolahYangMengisi: result.daftarSekolah.length }
      })
      localStorage.setItem(LAPORAN_STORAGE_KEY, JSON.stringify(updated))
      setList(updated)
    } catch {
      /* abaikan */
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Laporan Akhir Tahun</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {isDinas
              ? "Pengisian laporan kegiatan dan pencapaian dinas sesuai periode yang tersedia"
              : "Pengisian laporan kegiatan dan pencapaian sekolah sesuai periode yang tersedia"}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200" />

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700 text-sm">Belum ada laporan akhir tahun</p>
          <p className="text-gray-500 text-xs mt-1">
            Laporan akan muncul setelah Admin Pusat membuatnya.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedList.map((item) => {
            const dynamicStatus = getStatusFromPeriod(item.periodeAwal, item.periodeAkhir)
            const formUrl = resolveFormUrl(item, isDinas, session?.namaSekolah)
            const isPast = dynamicStatus === "selesai"
            const isFilled = isPast || !!filledMap[item.tahun]

            const identityKey = normalizeNamaInstansi(identity)
            const myEntry = isDinas
              ? (item.daftarDinas ?? []).find(
                  (d) => normalizeNamaInstansi(d.namaDinas) === identityKey
                )
              : (item.daftarSekolah ?? []).find(
                  (s) => normalizeNamaInstansi(s.namaSekolah) === identityKey
                )
            const mySkor = typeof myEntry?.skor === "number" ? myEntry.skor : null
            const report = mySkor ?? (isPast ? item.skorAkhir : null)

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition ${
                  dynamicStatus === "terjadwal" ? "border-blue-300" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      dynamicStatus === "terjadwal" ? "bg-blue-100" : "bg-gray-100"
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        dynamicStatus === "terjadwal" ? "text-blue-600" : "text-gray-600"
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={dynamicStatus} />
                        {dynamicStatus !== "terjadwal" && (
                          isFilled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              <CheckCircle className="w-3 h-3" /> Sudah diisi
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmItem(item)}
                              title="Tandai formulir sudah diisi"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition"
                            >
                              <Clock className="w-3 h-3" /> Belum diisi
                            </button>
                          )
                        )}
                      </div>
                      <p className="text-base font-bold text-gray-900 mt-1">Laporan Tahun {item.tahun}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Periode Pengisian: {formatDateDisplay(item.periodeAwal)} - {formatDateDisplay(item.periodeAkhir)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="bg-gray-100 rounded-lg px-3 py-3 text-center">
                        <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                          Indeks BSAN: {report ?? "Dalam Proses Penilaian"}
                        </p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-gray-200 mx-1" />
                    {dynamicStatus === "terjadwal" ? (
                      <span className="text-xs text-gray-400 italic">Belum dimulai</span>
                    ) : isFilled ? (
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => openForm(formUrl)}
                          disabled={!formUrl}
                          className="flex items-center justify-center gap-1.5 w-[128px] px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Lihat Formulir
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => openForm(formUrl)}
                          disabled={!formUrl}
                          className="flex items-center justify-center gap-1.5 w-[128px] px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Isi Formulir
                        </button>
                        <button
                          onClick={() => setConfirmItem(item)}
                          title="Tandai formulir sudah diisi"
                          className="text-xs text-gray-500 hover:text-gray-700 underline transition whitespace-nowrap"
                        >
                          Tandai sudah diisi
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setConfirmItem(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Konfirmasi Isian Formulir</h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    Isian formulir sudah benar dan dapat dipertanggungjawabkan. Admin pusat akan
                    segera meninjau isian formulir Anda. Apabila ingin membatalkan isian, Anda harus
                    menghubungi Admin pusat.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmItem(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleFilled(confirmItem.tahun)
                  setConfirmItem(null)
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                Ya, Tandai Sudah Diisi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
