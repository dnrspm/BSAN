"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  ExternalLink,
  Flag,
  Globe,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
  XCircle,
  Clock,
  ArrowUpDown,
  Building2,
  RotateCcw,
} from "lucide-react"
import { RUJUKAN_LOG } from "@/lib/rujukan-logs"
import { readAuthSession } from "@/lib/auth-session"
import {
  KATEGORI_CONFIG,
  PENYEDIA_CONFIG,
  SEED,
  type KategoriDukungan,
  type KategoriPenyedia,
  type SumberRujukan,
  type StatusRujukan,
} from "@/components/dashboard/SumberRujukanView"

const PROVINSI_LIST = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau",
  "Jambi", "Bengkulu", "Sumatera Selatan", "Kepulauan Bangka Belitung", "Lampung",
  "DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur",
  "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
  "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat", "Sulawesi Selatan", "Sulawesi Tenggara",
  "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur",
  "Maluku", "Maluku Utara", "Papua Barat", "Papua",
]

const KOTA_SET = new Set([
  "Banda Aceh", "Sabang", "Langsa", "Lhokseumawe", "Subulussalam",
  "Medan", "Binjai", "Gunungsitoli", "Padangsidempuan", "Pematangsiantar", "Sibolga", "Tanjungbalai", "Tebing Tinggi",
  "Bukittinggi", "Padang", "Padangpanjang", "Pariaman", "Payakumbuh", "Sawahlunto", "Solok",
  "Dumai", "Pekanbaru",
  "Jambi", "Sungaipenuh",
  "Lubuklinggau", "Pagar Alam", "Palembang", "Prabumulih",
  "Bengkulu",
  "Bandar Lampung", "Metro",
  "Pangkalpinang",
  "Batam", "Tanjungpinang",
  "Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur",
  "Bandung", "Banjar", "Bekasi", "Bogor", "Cimahi", "Cirebon", "Depok", "Sukabumi", "Tasikmalaya",
  "Magelang", "Pekalongan", "Salatiga", "Semarang", "Surakarta", "Tegal",
  "Yogyakarta",
  "Batu", "Blitar", "Kediri", "Madiun", "Malang", "Mojokerto", "Pasuruan", "Probolinggo", "Surabaya",
  "Cilegon", "Serang", "Tangerang", "Tangerang Selatan",
  "Denpasar",
  "Bima", "Mataram",
  "Kupang",
  "Pontianak", "Singkawang",
  "Palangkaraya",
  "Balikpapan", "Bontang", "Samarinda",
  "Tarakan",
  "Bitung", "Kotamobagu", "Manado", "Tomohon",
  "Palu",
  "Makassar", "Palopo", "Parepare",
  "Bau-Bau", "Kendari",
  "Gorontalo",
  "Mamuju",
  "Ambon", "Tual",
  "Ternate", "Tidore Kepulauan",
  "Sorong",
  "Jayapura",
])

function getWilayahType(kabupatenKota: string): "Kota" | "Kabupaten" {
  return KOTA_SET.has(kabupatenKota) ? "Kota" : "Kabupaten"
}

type SortMode = "relevansi" | "terbaru" | "nama_az"

function resolveJenisMenunggu(item: Pick<SumberRujukan, "jenisMenunggu" | "logTerakhir" | "status" | "usulanDari">): "pengajuan" | "perbaikan" | "perbaikan_laporan" | "penonaktifan" | "pemulihan" | undefined {
  if (item.status !== "menunggu") return undefined
  if ((item.jenisMenunggu as string) === "dilaporan") return "perbaikan_laporan"
  if ((item.jenisMenunggu as string) === "perbaikan" && item.usulanDari !== "sekolah") return "perbaikan_laporan"
  if (item.jenisMenunggu) return item.jenisMenunggu
  if (item.logTerakhir && /dilaporkan/i.test(item.logTerakhir)) return "perbaikan_laporan"
  return "pengajuan"
}

function StatusBadge({ status, jenisMenunggu, jenisButuhPerbaikan }: { status: StatusRujukan; jenisMenunggu?: "pengajuan" | "perbaikan" | "perbaikan_laporan" | "penonaktifan" | "pemulihan"; jenisButuhPerbaikan?: "ditolak" | "perbaikan" }) {
  if (status === "terverifikasi") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3" /> Terverifikasi
      </span>
    )
  }
  if (status === "menunggu") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        <Clock className="w-3 h-3" /> Dalam Proses Verifikasi
      </span>
    )
  }
  if (status === "butuh_perbaikan") {
    if (jenisButuhPerbaikan === "perbaikan") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
          <XCircle className="w-3 h-3" /> Perlu Perbaikan
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <XCircle className="w-3 h-3" /> Ditolak
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
      <XCircle className="w-3 h-3" /> Nonaktif
    </span>
  )
}

function ReadOnlyDetailPanel({ item, onClose, onEdit, onReport, onUsulNonaktif, onPulihkan, onDelete, canEdit }: { item: SumberRujukan; onClose: () => void; onEdit?: (id: string) => void; onReport?: (item: SumberRujukan) => void; onUsulNonaktif?: (item: SumberRujukan) => void; onPulihkan?: (item: SumberRujukan) => void; onDelete?: (id: string) => void; canEdit?: boolean }) {
  const kategoriCfg = KATEGORI_CONFIG[item.kategoriBentukDukungan]
  const penyediaCfg = item.kategoriPenyedia ? PENYEDIA_CONFIG[item.kategoriPenyedia] : null
  const alamat = [item.namaJalan, item.nomorJalan, item.kelurahan, item.kecamatan, item.kabupatenKota, item.provinsi, item.kodePos]
    .filter(Boolean)
    .join(", ")

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-full ${kategoriCfg.bg} ${kategoriCfg.color} flex items-center justify-center flex-shrink-0`}>
              {kategoriCfg.icon}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 leading-tight truncate">{item.namaInstansi}</h2>
              <StatusBadge status={item.status} jenisMenunggu={resolveJenisMenunggu(item)} jenisButuhPerbaikan={item.jenisButuhPerbaikan} />
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Catatan banner */}
          {item.catatanPerbaikan && (
            <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageCircle className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0" />
                <p className="text-xs font-semibold text-yellow-700">
                  Catatan dari {item.logTerakhir?.match(/\boleh\s+(.+)$/i)?.[1] ?? "Admin"}
                </p>
              </div>
              <p className="text-sm text-yellow-900">{item.catatanPerbaikan}</p>
            </div>
          )}

          {/* Kategori */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${kategoriCfg.bg} ${kategoriCfg.color} flex items-center justify-center flex-shrink-0`}>
              {kategoriCfg.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500">Kategori Dukungan</p>
              <p className="text-sm font-semibold text-gray-900">{item.kategoriBentukDukungan}</p>
            </div>
          </div>

          {/* Penyedia */}
          {penyediaCfg && (
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${penyediaCfg.bg} ${penyediaCfg.color} flex items-center justify-center flex-shrink-0`}>
                {penyediaCfg.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500">Penyedia Layanan</p>
                <p className="text-sm font-semibold text-gray-900">{item.kategoriPenyedia}</p>
              </div>
            </div>
          )}

          {/* Alamat */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Alamat</p>
            <p className="text-sm text-gray-900">{alamat || "-"}</p>
          </div>

          {/* Call Center */}
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Call Center</p>
              <p className="text-sm font-semibold text-gray-900">{item.nomorCallCenter || "-"}</p>
            </div>
          </div>

          {/* WhatsApp */}
          {item.nomorWhatsapp && (
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">WhatsApp</p>
                <p className="text-sm font-semibold text-gray-900">{item.nomorWhatsapp}</p>
              </div>
            </div>
          )}

          {/* Website */}
          {item.website && (
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Website</p>
                <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">
                  {item.website}
                </a>
              </div>
            </div>
          )}

          {/* Google Maps */}
          {item.tautanGoogleMaps && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Lokasi</p>
                <a href={item.tautanGoogleMaps} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Lihat di Maps
                </a>
              </div>
            </div>
          )}

          {/* Sosial Media */}
          {item.sosialMedia && (
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Sosial Media</p>
                <p className="text-sm font-semibold text-gray-900">{item.sosialMedia}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 p-5 flex flex-wrap gap-2">
          {item.status === "nonaktif" && (
            canEdit && item.usulanDari === "sekolah" && onPulihkan ? (
              <button
                onClick={() => onPulihkan(item)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 transition"
              >
                <RotateCcw className="w-4 h-4" /> Pulihkan
              </button>
            ) : (
              <p className="text-sm text-gray-500 italic">Anda tidak dapat melakukan aksi pada item yang dinonaktifkan.</p>
            )
          )}
          {item.status === "butuh_perbaikan" && (
            <>
              {canEdit && onEdit && (
                <button
                  onClick={() => onEdit(item.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
                >
                  <Pencil className="w-4 h-4" /> Perbaiki Sumber Dukungan
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(item.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              )}
            </>
          )}
          {item.status !== "nonaktif" && item.status !== "butuh_perbaikan" && (
            <>
              {canEdit && onEdit && (
                <button
                  onClick={() => onEdit(item.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
              )}
              {canEdit && item.usulanDari === "sekolah" && item.status !== "menunggu" && onUsulNonaktif && (
                <button
                  onClick={() => onUsulNonaktif(item)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition"
                >
                  <XCircle className="w-4 h-4" /> Usulkan Penonaktifan
                </button>
              )}
              {!canEdit && onReport && (
                <button
                  onClick={() => onReport(item)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition"
                >
                  <Flag className="w-4 h-4" /> Laporkan Sumber Dukungan
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

interface SekolahSumberRujukanViewProps {
  wilayah: string
}

function getKabupatenFromWilayah(wilayah: string): string {
  if (wilayah.includes(" - ")) {
    return wilayah.split(" - ")[1].trim()
  }
  return ""
}

type MyViewFilter = "semua" | "usulan_saya" | "dilaporkan"

export function SekolahSumberRujukanView({ wilayah }: SekolahSumberRujukanViewProps) {
  const router = useRouter()
  const myKabupaten = getKabupatenFromWilayah(wilayah)
  const myNamaSekolah = readAuthSession()?.namaSekolah ?? ""
  const [list, setList] = useState<SumberRujukan[]>(SEED)
  const [search, setSearch] = useState("")
  const [myView, setMyView] = useState<MyViewFilter>("semua")
  const [filterWilayah, setFilterWilayah] = useState<{ province: string; kabupaten: string } | null>(null)
  const [filterKategori, setFilterKategori] = useState<KategoriDukungan | "semua">("semua")
  const [filterPenyedia, setFilterPenyedia] = useState<KategoriPenyedia | "semua">("semua")
  const [sortMode, setSortMode] = useState<SortMode>("terbaru")
  const [selected, setSelected] = useState<SumberRujukan | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [showWilayahModal, setShowWilayahModal] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportItem, setReportItem] = useState<SumberRujukan | null>(null)
  const [reportAlasan, setReportAlasan] = useState("")
  const [reportJenis, setReportJenis] = useState<"perbaikan" | "penonaktifan" | null>(null)
  const [showUsulNonaktifModal, setShowUsulNonaktifModal] = useState(false)
  const [usulNonaktifItem, setUsulNonaktifItem] = useState<SumberRujukan | null>(null)
  const [usulNonaktifAlasan, setUsulNonaktifAlasan] = useState("")
  const [showPulihkanModal, setShowPulihkanModal] = useState(false)
  const [pulihkanItem, setPulihkanItem] = useState<SumberRujukan | null>(null)
  const [pulihkanAlasan, setPulihkanAlasan] = useState("")

  // Form state
  const [formNama, setFormNama] = useState("")
  const [formKategori, setFormKategori] = useState<KategoriDukungan>("Konseling")
  const [formPenyedia, setFormPenyedia] = useState<KategoriPenyedia>("Pemerintah Daerah")
  const [formProvinsi, setFormProvinsi] = useState("")
  const [formKabupaten, setFormKabupaten] = useState("")
  const [formKecamatan, setFormKecamatan] = useState("")
  const [formKelurahan, setFormKelurahan] = useState("")
  const [formNamaJalan, setFormNamaJalan] = useState("")
  const [formNomorJalan, setFormNomorJalan] = useState("")
  const [formKodePos, setFormKodePos] = useState("")
  const [formGoogleMaps, setFormGoogleMaps] = useState("")
  const [formKontak, setFormKontak] = useState<{ nomor: string; tipe: "call_center" | "nomor_pribadi" }[]>([
    { nomor: "", tipe: "call_center" }
  ])
  const [formwebsite, setFormwebsite] = useState("")
  const [formAksesInfo, setFormAksesInfo] = useState<"publik" | "terbatas">("publik")
  const [sending, setSending] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Auto-fill wilayah from prop
  useEffect(() => {
    const w = wilayah.trim()
    let prov = ""
    let kab = ""
    if (w.includes(" - ")) {
      const parts = w.split(" - ")
      prov = parts[0].trim()
      kab = parts[1].trim()
    } else {
      prov = w
    }
    setFormProvinsi(prov)
    setFormKabupaten(kab)
    // Set default filter to show only school's wilayah (auto-enabled)
    setFilterWilayah({ province: prov, kabupaten: kab })
    setShowWilayahModal(false)
    setShowStats(true)
  }, [])

  const addKontak = () => setFormKontak((prev) => [...prev, { nomor: "", tipe: "call_center" }])
  const removeKontak = (idx: number) => setFormKontak((prev) => prev.filter((_, i) => i !== idx))
  const updateKontak = (idx: number, field: "nomor" | "tipe", val: string) => {
    setFormKontak((prev) => prev.map((k, i) => i === idx ? { ...k, [field]: field === "nomor" ? val.replace(/\D/g, "") : val } : k))
  }

  // Parse wilayah prop
  const myWilayah = wilayah.trim().toLowerCase()

  const loadData = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("rujukanList") ?? "[]") as Array<Partial<SumberRujukan> & { id: string }>
      const storedMap = new Map(stored.map((i) => [i.id, i]))
      const seedMerged = SEED.map((s) => (storedMap.has(s.id) ? { ...s, ...storedMap.get(s.id) } : s))
      const newItems = stored.filter((i) => !SEED.find((s) => s.id === i.id)) as SumberRujukan[]
      setList([...seedMerged, ...newItems])
    } catch {
      setList([...SEED])
    }
  }

  useEffect(() => {
    loadData()
    const onStorage = (e: StorageEvent) => {
      if (e.key === "rujukanList") loadData()
    }
    const onFocus = () => loadData()
    window.addEventListener("storage", onStorage)
    window.addEventListener("rujukanUpdated", loadData)
    window.addEventListener("focus", onFocus)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("rujukanUpdated", loadData)
      window.removeEventListener("focus", onFocus)
    }
  }, [])

  // Load reported IDs from reportList
  const myReportIds = useMemo(() => {
    try {
      const raw = localStorage.getItem("reportList")
      if (!raw) return new Set<string>()
      const reports = JSON.parse(raw) as Array<{ sumberId: string }>
      return new Set(reports.map((r) => r.sumberId))
    } catch {
      return new Set<string>()
    }
  }, [list])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, myView, filterWilayah, filterKategori, filterPenyedia, sortMode])

  const filtered = list
    .filter((item) => {
      // Tab filter
      if (myView === "usulan_saya") {
        if (item.usulanDari !== "sekolah") return false
      } else if (myView === "dilaporkan") {
        if (!myReportIds.has(item.id)) return false
      } else {
        // Tab "semua": hanya status terverifikasi
        if (item.status !== "terverifikasi") return false
      }
      const matchSearch =
        search.trim() === "" ||
        item.namaInstansi.toLowerCase().includes(search.toLowerCase()) ||
        item.kabupatenKota.toLowerCase().includes(search.toLowerCase()) ||
        item.provinsi.toLowerCase().includes(search.toLowerCase())
      const matchWilayah = !filterWilayah ||
        (filterWilayah.province === item.provinsi && (!filterWilayah.kabupaten || item.kabupatenKota === filterWilayah.kabupaten))
      const matchKategori = filterKategori === "semua" || item.kategoriBentukDukungan === filterKategori
      const matchPenyedia = filterPenyedia === "semua" || item.kategoriPenyedia === filterPenyedia
      return matchSearch && matchWilayah && matchKategori && matchPenyedia
    })
    .sort((a, b) => {
      if (sortMode === "nama_az") return a.namaInstansi.localeCompare(b.namaInstansi)
      if (sortMode === "terbaru") return (b.createdAt ?? b.id).localeCompare(a.createdAt ?? a.id)
      return 0
    })

  const totalRows = filtered.length
  const totalPages = Math.ceil(totalRows / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows)
  const paginatedData = filtered.slice(startIndex, endIndex)

  // Stats calculations
  const stats = useMemo(() => {
    const total = filtered.length
    const terverifikasi = filtered.filter((i) => i.status === "terverifikasi").length
    const menunggu = filtered.filter((i) => i.status === "menunggu").length
    const butuhPerbaikan = filtered.filter((i) => i.status === "butuh_perbaikan").length
    const byKategori = Object.keys(KATEGORI_CONFIG).map((k) => ({
      label: k,
      count: filtered.filter((i) => i.kategoriBentukDukungan === k).length,
    }))
    return { total, terverifikasi, menunggu, butuhPerbaikan, byKategori }
  }, [filtered])

  const downloadCsv = () => {
    const rows = [
      ["Nama Instansi", "Kategori Dukungan", "Penyedia", "Kab/Kota", "Provinsi", "Call Center", "Status"].join(","),
      ...filtered.map((item) =>
        [
          `"${item.namaInstansi.replace(/"/g, '""')}"`,
          `"${item.kategoriBentukDukungan}"`,
          `"${item.kategoriPenyedia || ""}"`,
          `"${item.kabupatenKota}"`,
          `"${item.provinsi}"`,
          `"${item.nomorCallCenter}"`,
          `"${item.status}"`,
        ].join(",")
      ),
    ]
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sumber-dukungan-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validKontak = formKontak.filter((k) => k.nomor.trim())
    if (!formNama.trim() || !formProvinsi || !formKabupaten || validKontak.length === 0) return
    setSending(true)
    const callCenterNomor = validKontak.find((k) => k.tipe === "call_center")?.nomor ?? validKontak[0]?.nomor ?? ""
    const newRujukan: SumberRujukan = {
      id: `usul-${Date.now()}`,
      namaInstansi: formNama.trim(),
      kategoriBentukDukungan: formKategori,
      kategoriPenyedia: formPenyedia,
      provinsi: formProvinsi,
      kabupatenKota: formKabupaten,
      kecamatan: formKecamatan.trim() || undefined,
      kelurahan: formKelurahan.trim() || undefined,
      namaJalan: formNamaJalan.trim() || undefined,
      nomorJalan: formNomorJalan.trim() || undefined,
      kodePos: formKodePos.trim() || undefined,
      tautanGoogleMaps: formGoogleMaps.trim() || undefined,
      kontak: validKontak,
      nomorCallCenter: callCenterNomor,
      website: formwebsite.trim() || undefined,
      aksesInfo: formAksesInfo,
      status: "menunggu",
      jenisMenunggu: "pengajuan",
      dibuatOleh: "Admin Sekolah",
      logTerakhir: RUJUKAN_LOG.dibuatSekolah(""),
      usulanDari: "sekolah",
      createdAt: new Date().toISOString(),
    }
    try {
      const raw = localStorage.getItem("rujukanList")
      const stored: Array<Partial<SumberRujukan> & { id: string }> = raw ? JSON.parse(raw) : []
      stored.unshift(newRujukan)
      localStorage.setItem("rujukanList", JSON.stringify(stored))
      window.dispatchEvent(new CustomEvent("rujukanUpdated"))
    } catch { /* ignore */ }
    setSending(false)
    setSubmitted(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setSubmitted(false)
    // Note: Province/Kabupaten are auto-filled from wilayah prop, don't reset them
    setFormNama("")
    setFormKategori("Konseling")
    setFormPenyedia("Pemerintah Daerah")
    setFormProvinsi("")
    setFormKabupaten("")
    setFormKecamatan("")
    setFormKelurahan("")
    setFormNamaJalan("")
    setFormNomorJalan("")
    setFormKodePos("")
    setFormGoogleMaps("")
    setFormKontak([{ nomor: "", tipe: "call_center" }])
    setFormwebsite("")
    setFormAksesInfo("publik")
  }

  const handleEdit = (id: string) => router.push(`/sumber-rujukan/form?edit=${id}`)

  const handleDelete = (id: string) => {
    const stored = JSON.parse(localStorage.getItem("rujukanList") ?? "[]") as Array<Record<string, unknown>>
    const filtered = stored.filter((item: Record<string, unknown>) => item.id !== id)
    localStorage.setItem("rujukanList", JSON.stringify(filtered))
    window.dispatchEvent(new CustomEvent("rujukanUpdated"))
    setList((prev) => prev.filter((item) => item.id !== id))
    setSelected(null)
  }

  const openReportModal = (item: SumberRujukan) => {
    setReportItem(item)
    setReportAlasan("")
    setReportJenis(null)
    setShowReportModal(true)
  }

  const handleSubmitReport = () => {
    if (!reportItem || !reportAlasan.trim() || !reportJenis) return
    const raw = localStorage.getItem("reportList")
    const reports: Array<{ id: string; sumberId: string; jenis: string; alasan: string; dibuatOleh: string; createdAt: string }> = raw ? JSON.parse(raw) : []
    reports.unshift({
      id: `report-${Date.now()}`,
      sumberId: reportItem.id,
      jenis: reportJenis,
      alasan: reportAlasan.trim(),
      dibuatOleh: "Admin Sekolah",
      createdAt: new Date().toISOString(),
    })
    localStorage.setItem("reportList", JSON.stringify(reports))

    const stored = JSON.parse(localStorage.getItem("rujukanList") ?? "[]") as Array<Record<string, unknown>>
    const existingIndex = stored.findIndex((item: Record<string, unknown>) => item.id === reportItem.id)
    const alasan = reportAlasan.trim()

    const reportPatch: Partial<SumberRujukan> = {
      status: "menunggu" as StatusRujukan,
      jenisMenunggu: reportJenis === "perbaikan" ? "perbaikan_laporan" : (reportJenis ?? "perbaikan_laporan"),
      logTerakhir: reportJenis === "penonaktifan"
        ? "Usulan penonaktifan oleh Admin Sekolah"
        : "Laporan perbaikan oleh Admin Sekolah",
      catatanPerbaikan: `Laporan: ${alasan}`,
    }

    if (existingIndex >= 0) {
      stored[existingIndex] = { ...stored[existingIndex], ...reportPatch }
    } else {
      const seedItem = SEED.find((s) => s.id === reportItem.id)
      if (seedItem) {
        stored.push({ ...seedItem, ...reportPatch })
      }
    }

    localStorage.setItem("rujukanList", JSON.stringify(stored))
    window.dispatchEvent(new CustomEvent("rujukanUpdated"))

    setList((prev) => prev.map((item) =>
      item.id === reportItem.id ? { ...item, ...reportPatch } : item
    ))

    setShowReportModal(false)
    setReportItem(null)
  }

  const openUsulNonaktifModal = (item: SumberRujukan) => {
    setUsulNonaktifItem(item)
    setUsulNonaktifAlasan("")
    setShowUsulNonaktifModal(true)
  }

  const handleSubmitUsulNonaktif = () => {
    if (!usulNonaktifItem || !usulNonaktifAlasan.trim()) return
    const stored = JSON.parse(localStorage.getItem("rujukanList") ?? "[]") as Array<Record<string, unknown>>
    const existingIndex = stored.findIndex((item: Record<string, unknown>) => item.id === usulNonaktifItem.id)
    const patch: Partial<SumberRujukan> = {
      status: "menunggu" as StatusRujukan,
      jenisMenunggu: "penonaktifan",
      logTerakhir: "Usulan penonaktifan oleh Admin Sekolah",
      catatanPerbaikan: usulNonaktifAlasan.trim(),
    }
    if (existingIndex >= 0) {
      stored[existingIndex] = { ...stored[existingIndex], ...patch }
    } else {
      const seedItem = SEED.find((s) => s.id === usulNonaktifItem.id)
      if (seedItem) stored.push({ ...seedItem, ...patch })
    }
    localStorage.setItem("rujukanList", JSON.stringify(stored))
    window.dispatchEvent(new CustomEvent("rujukanUpdated"))
    setList((prev) => prev.map((item) =>
      item.id === usulNonaktifItem.id ? { ...item, ...patch } : item
    ))
    setShowUsulNonaktifModal(false)
    setUsulNonaktifItem(null)
  }

  const openPulihkanModal = (item: SumberRujukan) => {
    setPulihkanItem(item)
    setPulihkanAlasan("")
    setShowPulihkanModal(true)
  }

  const handleSubmitPulihkan = () => {
    if (!pulihkanItem || !pulihkanAlasan.trim()) return
    const stored = JSON.parse(localStorage.getItem("rujukanList") ?? "[]") as Array<Record<string, unknown>>
    const existingIndex = stored.findIndex((item: Record<string, unknown>) => item.id === pulihkanItem.id)
    const patch: Partial<SumberRujukan> = {
      status: "menunggu" as StatusRujukan,
      jenisMenunggu: "pemulihan",
      logTerakhir: "Usulan pemulihan oleh Admin Sekolah",
      catatanPerbaikan: pulihkanAlasan.trim(),
    }
    if (existingIndex >= 0) {
      stored[existingIndex] = { ...stored[existingIndex], ...patch }
    } else {
      const seedItem = SEED.find((s) => s.id === pulihkanItem.id)
      if (seedItem) stored.push({ ...seedItem, ...patch })
    }
    localStorage.setItem("rujukanList", JSON.stringify(stored))
    window.dispatchEvent(new CustomEvent("rujukanUpdated"))
    setList((prev) => prev.map((item) =>
      item.id === pulihkanItem.id ? { ...item, ...patch } : item
    ))
    setShowPulihkanModal(false)
    setPulihkanItem(null)
  }

  const isMyWilayah = (item: SumberRujukan) => item.kabupatenKota === myKabupaten

  return (
    <div className="space-y-5">
      {/* Heading */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Sumber Dukungan</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Daftar kontak layanan untuk membangun lingkungan sekolah yang aman, nyaman, dan inklusif</p>
        </div>
        <button
          onClick={() => router.push(`/sumber-rujukan/form?provinsi=${encodeURIComponent(formProvinsi)}&kabupaten=${encodeURIComponent(formKabupaten)}`)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Usul Sumber Dukungan
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Wilayah Display with Stats Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-lg">Wilayah:</span>
          {filterWilayah ? (
            <span className="font-bold text-gray-900 text-lg">
              {filterWilayah.kabupaten
                ? `${getWilayahType(filterWilayah.kabupaten)} ${filterWilayah.kabupaten} - ${filterWilayah.province}`
                : filterWilayah.province}
            </span>
          ) : (
            <span className="font-bold text-gray-500 text-lg">Semua Wilayah</span>
          )}
          <button
            onClick={() => setShowWilayahModal(true)}
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium text-sm px-2 py-1 rounded-md transition"
          >
            Ganti
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Statistik:</span>
          <button
            onClick={() => setShowStats(!showStats)}
            className={`relative w-10 h-5 rounded-full transition-colors ${showStats ? "bg-blue-600" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${showStats ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {/* Stats cards by kategori */}
      {showStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.byKategori.filter(k => k.count > 0).map((k) => {
            const cfg = KATEGORI_CONFIG[k.label]
            return (
              <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${cfg.bg} ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                  {cfg.icon}
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{k.count}</p>
                  <p className="text-xs text-gray-500 leading-tight">{k.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* My View Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { value: "semua", label: "Semua" },
          { value: "usulan_saya", label: "Usulan Saya" },
          { value: "dilaporkan", label: "Pernah Dilaporkan" },
        ] as { value: MyViewFilter; label: string }[]).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setMyView(tab.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              myView === tab.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ketik nama instansi atau kota"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        />
      </div>

      {/* Sort + Filter + Ekspor CSV */}
      <div className="flex flex-row items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 bg-white">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="text-sm focus:outline-none bg-transparent text-gray-700"
          >
            <option value="terbaru">Terbaru</option>
            <option value="nama_az">Nama A–Z</option>
          </select>
        </div>
        <div className="w-px h-6 bg-gray-200" />
        <select
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value as KategoriDukungan | "semua")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="semua">Semua Kategori</option>
          {(Object.keys(KATEGORI_CONFIG) as KategoriDukungan[]).map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <select
          value={filterPenyedia}
          onChange={(e) => setFilterPenyedia(e.target.value as KategoriPenyedia | "semua")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="semua">Semua Penyedia</option>
          {(["Pemerintah Pusat", "Pemerintah Daerah", "Swasta", "OMS", "Lainnya"] as KategoriPenyedia[]).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <div className="w-px h-6 bg-gray-200" />
        <button
          type="button"
          onClick={downloadCsv}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" /> Ekspor CSV
        </button>
      </div>

      {/* Table */}
      {totalRows === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="font-semibold text-gray-700 text-sm">Tidak ada sumber dukungan</p>
          <p className="text-gray-500 text-xs mt-1">Coba ubah filter atau kata kunci pencarian.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama Instansi</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Wilayah</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.map((item) => {
                    const kategoriCfg = KATEGORI_CONFIG[item.kategoriBentukDukungan]
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-gray-900 whitespace-nowrap">{item.namaInstansi}</p>
                            {item.usulanDari === "sekolah" && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 whitespace-nowrap flex-shrink-0">
                                <Flag className="w-2.5 h-2.5" /> Usulan Saya
                              </span>
                            )}
                          </div>
                          {item.website && (
                            <a href={item.website} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:underline whitespace-nowrap mt-0.5">
                              <Globe className="w-3 h-3" /> Website
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-800">
                          {item.isNasional || item.provinsi === "Seluruh Indonesia" ? "Nasional" : `${getWilayahType(item.kabupatenKota)} ${item.kabupatenKota}`}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 whitespace-nowrap">
                            {kategoriCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={item.status} jenisMenunggu={resolveJenisMenunggu(item)} jenisButuhPerbaikan={item.jenisButuhPerbaikan} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <a
                            href={`/sumber-rujukan/form?view=${item.id}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Cek Detail
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Menampilkan {startIndex + 1}-{endIndex} dari {totalRows} data
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="px-3 py-1.5 text-xs font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* wilayah Filter Modal */}
      {showWilayahModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowWilayahModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Filter Wilayah</h3>
              <button onClick={() => setShowWilayahModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex h-full max-h-[400px]">
                <div className="w-1/2 border-r border-gray-100 overflow-y-auto">
                  <div className="p-2">
                    <button
                      onClick={() => { setFilterWilayah({ province: formProvinsi, kabupaten: formKabupaten }); setShowWilayahModal(false) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${filterWilayah?.province === formProvinsi && filterWilayah?.kabupaten === formKabupaten ? "bg-emerald-50 text-emerald-700" : "hover:bg-gray-50"}`}
                    >
                      Wilayah Saya
                    </button>
                    <button
                      onClick={() => { setFilterWilayah(null); setShowWilayahModal(false) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${!filterWilayah ? "bg-emerald-50 text-emerald-700" : "hover:bg-gray-50"}`}
                    >
                      Semua Provinsi
                    </button>
                    {PROVINSI_LIST.map((province) => {
                      const kabupatens = Array.from(new Set(list.filter((i) => i.provinsi === province).map((i) => i.kabupatenKota))).filter(Boolean).sort()
                      const isSelected = filterWilayah?.province === province
                      return (
                        <button
                          key={province}
                          onClick={() => setFilterWilayah({ province, kabupaten: "" })}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                            isSelected ? "bg-emerald-50 text-emerald-700 font-medium" : "hover:bg-gray-50"
                          }`}
                        >
                          <span className="truncate">{province}</span>
                          {kabupatens.length > 0 && <span className="text-xs text-gray-400">{kabupatens.length}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="w-1/2 overflow-y-auto bg-white">
                  <div className="p-2">
                    {filterWilayah ? (
                      (() => {
                        const kabupatens = Array.from(new Set(list.filter((i) => i.provinsi === filterWilayah.province).map((i) => i.kabupatenKota))).filter(Boolean).sort()
                        if (kabupatens.length === 0) {
                          return <p className="text-sm text-gray-400 p-3">Tidak ada kabupaten/kota</p>
                        }
                        return (
                          <>
                            <button
                              onClick={() => { setFilterWilayah({ province: filterWilayah.province, kabupaten: "" }); setShowWilayahModal(false) }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                                !filterWilayah.kabupaten ? "bg-emerald-50 text-emerald-700 font-medium" : "hover:bg-gray-100"
                              }`}
                            >
                              Semua Kabupaten/Kota
                            </button>
                            {kabupatens.map((kab) => (
                              <button
                                key={kab}
                                onClick={() => { setFilterWilayah({ province: filterWilayah.province, kabupaten: kab }); setShowWilayahModal(false) }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                                  filterWilayah?.kabupaten === kab ? "bg-emerald-50 text-emerald-700 font-medium" : "hover:bg-gray-100"
                                }`}
                              >
                                {kab}
                              </button>
                            ))}
                          </>
                        )
                      })()
                    ) : (
                      <p className="text-sm text-gray-400 p-3">Pilih province di kiri</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowWilayahModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={() => setShowWilayahModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <ReadOnlyDetailPanel
          item={selected}
          onClose={() => setSelected(null)}
          onEdit={handleEdit}
          onReport={openReportModal}
          onUsulNonaktif={openUsulNonaktifModal}
          onPulihkan={openPulihkanModal}
          onDelete={handleDelete}
          canEdit={isMyWilayah(selected)}
        />
      )}

      {/* Report Modal */}
      {showReportModal && reportItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowReportModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Flag className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Laporkan Sumber Dukungan</h3>
                <p className="text-xs text-gray-500">Laporan Anda akan dikirim ke admin untuk ditindaklanjuti.</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Instansi</p>
                <p className="text-sm text-gray-900">{reportItem.namaInstansi}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Jenis Laporan <span className="text-red-500">*</span></p>
                <div className="space-y-2">
                  {([
                    { value: "perbaikan", label: "Perbaikan data", desc: "Data yang tercantum tidak akurat atau perlu diperbarui" },
                    { value: "penonaktifan", label: "Usulan Penonaktifan", desc: "Layanan ini sudah tidak aktif atau tidak dapat dihubungi" },
                  ] as { value: "perbaikan" | "penonaktifan"; label: string; desc: string }[]).map((opt) => (
                    <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${reportJenis === opt.value ? "border-red-400 bg-red-50" : "border-gray-200 hover:bg-gray-50"}`}>
                      <input
                        type="radio"
                        name="reportJenis"
                        value={opt.value}
                        checked={reportJenis === opt.value}
                        onChange={() => setReportJenis(opt.value)}
                        className="mt-0.5 accent-red-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan <span className="text-red-500">*</span></label>
                <textarea
                  value={reportAlasan}
                  onChange={(e) => setReportAlasan(e.target.value)}
                  placeholder={reportJenis === "penonaktifan" ? "Jelaskan alasan penonaktifan..." : "Jelaskan data yang perlu diperbaiki..."}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  rows={3}
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={!reportAlasan.trim() || !reportJenis}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Kirim Laporan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usul Penonaktifan Modal */}
      {showUsulNonaktifModal && usulNonaktifItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowUsulNonaktifModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Usulkan Penonaktifan</h3>
                <p className="text-xs text-gray-500">Usulan akan dikirim ke admin untuk ditinjau.</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Instansi</p>
                <p className="text-sm text-gray-900">{usulNonaktifItem.namaInstansi}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Penonaktifan <span className="text-red-500">*</span></label>
                <textarea
                  value={usulNonaktifAlasan}
                  onChange={(e) => setUsulNonaktifAlasan(e.target.value)}
                  placeholder="Jelaskan alasan mengapa sumber dukungan ini perlu dinonaktifkan..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  rows={3}
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowUsulNonaktifModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitUsulNonaktif}
                disabled={!usulNonaktifAlasan.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Kirim Usulan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pulihkan Modal */}
      {showPulihkanModal && pulihkanItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPulihkanModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Usulkan Pemulihan</h3>
                <p className="text-xs text-gray-500">Usulan akan dikirim ke admin untuk ditinjau.</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Instansi</p>
                <p className="text-sm text-gray-900">{pulihkanItem.namaInstansi}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Pemulihan <span className="text-red-500">*</span></label>
                <textarea
                  value={pulihkanAlasan}
                  onChange={(e) => setPulihkanAlasan(e.target.value)}
                  placeholder="Jelaskan alasan mengapa sumber dukungan ini perlu dipulihkan..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  rows={3}
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowPulihkanModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitPulihkan}
                disabled={!pulihkanAlasan.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Kirim Usulan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usul Sumber Dukungan Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={handleCloseForm} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {submitted ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Usulan Berhasil Dikirim</h3>
                <p className="text-sm text-gray-600 mb-6">Usulan sumber dukungan Anda akan diverifikasi oleh admin.</p>
                <button
                  onClick={handleCloseForm}
                  className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <h3 className="text-base font-bold text-gray-900">Usul Sumber Dukungan</h3>
                  <button onClick={handleCloseForm} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Nama Instansi <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formNama}
                      onChange={(e) => setFormNama(e.target.value)}
                      placeholder="Nama instansi atau layanan"
                      required
                      className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Kategori Dukungan <span className="text-red-500">*</span></label>
                      <select
                        value={formKategori}
                        onChange={(e) => setFormKategori(e.target.value as KategoriDukungan)}
                        className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        {(Object.keys(KATEGORI_CONFIG) as KategoriDukungan[]).map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Penyedia Layanan <span className="text-red-500">*</span></label>
                      <select
                        value={formPenyedia}
                        onChange={(e) => setFormPenyedia(e.target.value as KategoriPenyedia)}
                        className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        {(["Pemerintah Pusat", "Pemerintah Daerah", "Swasta", "OMS", "Lainnya"] as KategoriPenyedia[]).map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Wilayah Anda</label>
                    <div className="mt-1 px-3 py-2 text-sm bg-gray-100 rounded-lg text-gray-600">
                      {formProvinsi}{formKabupaten ? ` - ${formKabupaten}` : ""}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Alamat Lengkap</label>
                    <input
                      type="text"
                      value={formNamaJalan}
                      onChange={(e) => setFormNamaJalan(e.target.value)}
                      placeholder="Nama jalan, nomor,(rt/rw), dll"
                      className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Kecamatan</label>
                      <input
                        type="text"
                        value={formKecamatan}
                        onChange={(e) => setFormKecamatan(e.target.value)}
                        placeholder="Nama kecamatan"
                        className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Kelurahan/Desa</label>
                      <input
                        type="text"
                        value={formKelurahan}
                        onChange={(e) => setFormKelurahan(e.target.value)}
                        placeholder="Nama kelurahan/desa"
                        className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Nama Jalan</label>
                      <input
                        type="text"
                        value={formNamaJalan}
                        onChange={(e) => setFormNamaJalan(e.target.value)}
                        placeholder="Nama jalan"
                        className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Nomor Jalan</label>
                      <input
                        type="text"
                        value={formNomorJalan}
                        onChange={(e) => setFormNomorJalan(e.target.value)}
                        placeholder="Nomor"
                        className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Kode Pos</label>
                      <input
                        type="text"
                        value={formKodePos}
                        onChange={(e) => setFormKodePos(e.target.value)}
                        placeholder="Kode pos"
                        className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 space-y-1">
                      <p className="text-xs text-blue-700">
                        <span className="font-semibold">Nomor Call Center</span> bisa lebih dari satu.
                      </p>
                      <p className="text-xs text-blue-600">
                        Jika tidak tersedia, gunakan nomor HP pribadi yang dapat menjadi rujukan dan dapat diakses publik.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="flex-1 text-xs font-semibold text-gray-700">Nomor Kontak <span className="text-red-500">*</span></span>
                    <span className="w-36 text-xs font-semibold text-gray-700">Tipe Kontak</span>
                    {formKontak.length > 1 && <span className="w-9" />}
                  </div>
                  <div className="space-y-2">
                    {formKontak.map((k, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="tel"
                          value={k.nomor}
                          onChange={(e) => updateKontak(i, "nomor", e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <select
                          value={k.tipe}
                          onChange={(e) => updateKontak(i, "tipe", e.target.value)}
                          className="w-36 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                          <option value="call_center">Call Center</option>
                          <option value="nomor_pribadi">Nomor Pribadi</option>
                        </select>
                        {formKontak.length > 1 && (
                          <button type="button" onClick={() => removeKontak(i)} className="p-2 text-gray-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addKontak} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
                    + Tambah kontak
                  </button>
                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={sending}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition"
                    >
                      {sending ? "Mengirim..." : "Kirim Usulan"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
