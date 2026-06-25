"use client"

import { useEffect, useState, useMemo } from "react"
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Plus,
  Search,
  Upload,
  X,
  XCircle,
  Clock,
  Users,
  Calendar,
  Image,
  Check,
} from "lucide-react"
import { readAuthSession } from "@/lib/auth-session"

type StatusPelanggaran = "baru" | "proses" | "selesai" | "ditutup"
type TingkatKeparahan = "biasa" | "urgen" | "sangat_urgen"
type Pelapor = "laporan_masyarakat" | "laporan_sekolah" | "laporan_kemendikdasmen" | "temuan_pengawas" | "media" | "lainnya"

interface IndividuItem {
  nama: string
  umur: string
}

interface KronologiEntry {
  tanggal: string
  jam: string
  lokasi: string
  keterangan: string
}

interface UnsurItem {
  peran: "pelaku" | "korban"
  kategori: string
  asalSekolah: string
  jumlah: string
  individu: IndividuItem[]
}

interface PelanggaranItem {
  id: string
  namaSekolah: string[]
  unsurTerlibat: UnsurItem[]
  tanggalTerjadi: string
  kronologi?: KronologiEntry[]
  kategori: string
  tingkatKeparahan: TingkatKeparahan
  pelapor: Pelapor
  pelaporLainnya?: string
  tindakLanjut: string
  pic: string
  dokumentasi: string
  rekomendasi: string
  motif?: string
  status: StatusPelanggaran
  createdAt: string
  updatedAt: string
  dibuatOleh: string
  diperbaruiOleh: string
}

const SEKOLAH_OPTIONS = [
  "SDN 1 Banda Aceh",
  "SDN 2 Banda Aceh",
  "SMPN 1 Banda Aceh",
  "SMAN 1 Banda Aceh",
  "SMKN 1 Banda Aceh",
  "SDN 1 Medan",
  "SMPN 2 Jakarta Pusat",
  "SMAN 3 Surabaya",
  "SDN 4 Bandung",
  "SMPN 5 Yogyakarta",
  "SMKN 2 Semarang",
  "SDN 1 Denpasar",
  "SMPN 3 Makassar",
  "SMAN 2 Palembang",
]

function getSekolahColors(name: string) {
  const lower = name.toLowerCase()
  if (lower.startsWith("sdn") || lower.startsWith("sd ")) return { bg: "bg-amber-500/10", text: "text-amber-700" }
  if (lower.startsWith("smpn") || lower.startsWith("smp ")) return { bg: "bg-blue-500/10", text: "text-blue-700" }
  if (lower.startsWith("sman") || lower.startsWith("smkn") || lower.startsWith("sma ") || lower.startsWith("smk ")) return { bg: "bg-emerald-500/10", text: "text-emerald-700" }
  return { bg: "bg-gray-500/10", text: "text-gray-700" }
}

const UNSUR_OPTIONS = ["Siswa Laki-laki", "Siswa Perempuan", "Guru", "Tenaga Kependidikan", "Kepala Sekolah", "Warga Sekolah", "Lainnya"]

const KATEGORI_PELANGGARAN = [
  "Perundungan (Bullying)",
  "Pelecehan Seksual",
  "Kekerasan Fisik",
  "Kekerasan Verbal",
  "Pencurian",
  "Vandalisme",
  "Penggunaan NAPZA",
  "Melanggar Aturan Sekolah",
  "Pelanggaran Hukum",
  "Lainnya",
]

const TINGKAT_KEPARAHAN: { value: TingkatKeparahan; label: string; color: string }[] = [
  { value: "biasa", label: "Biasa", color: "bg-yellow-100 text-yellow-700" },
  { value: "urgen", label: "Urgen", color: "bg-orange-100 text-orange-700" },
  { value: "sangat_urgen", label: "Sangat Urgen", color: "bg-red-100 text-red-700" },
]

const PELAPOR_OPTIONS: { value: Pelapor; label: string }[] = [
  { value: "laporan_masyarakat", label: "Laporan masyarakat" },
  { value: "laporan_sekolah", label: "Laporan sekolah" },
  { value: "temuan_pengawas", label: "Temuan pengawas/pokja" },
  { value: "media", label: "Media/berita" },
  { value: "lainnya", label: "Lainnya" },
]

function StatusBadge({ status }: { status: StatusPelanggaran }) {
  switch (status) {
    case "baru":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          <FileText className="w-3 h-3" /> Baru
        </span>
      )
    case "proses":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" /> Diproses
        </span>
      )
    case "selesai":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" /> Selesai
        </span>
      )
    case "ditutup":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          <XCircle className="w-3 h-3" /> Ditutup
        </span>
      )
  }
}

function DetailModal({ item, onClose, onUpdateStatus, readOnly }: { item: PelanggaranItem; onClose: () => void; onUpdateStatus: (id: string, status: StatusPelanggaran, keterangan?: string, dokumentasi?: string) => void; readOnly?: boolean }) {
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<StatusPelanggaran>(item.status)
  const [keteranganStatus, setKeteranganStatus] = useState("")
  const [dokumentasiStatus, setDokumentasiStatus] = useState("")

  function SectionDivider({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
      <div className="flex items-center gap-2 pb-1 border-t border-gray-100 first:border-t-0">
        <span className="text-gray-500">{icon}</span>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</span>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 leading-tight">Detail Pelanggaran</h2>
              <StatusBadge status={item.status} />
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <SectionDivider icon={<AlertTriangle className="w-4 h-4" />} title="Informasi Pelanggaran" />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">Nama Sekolah</span>
            </div>
            <div className="ml-6 flex flex-wrap gap-1.5">
              {item.namaSekolah.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                  <GraduationCap className="w-3 h-3 text-gray-400" />
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500">Kategori Pelanggaran</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 ml-6">{item.kategori}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500">Tingkat Urgensi</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 ml-6">
                {TINGKAT_KEPARAHAN.find((t) => t.value === item.tingkatKeparahan)?.label ?? item.tingkatKeparahan}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">Tanggal Kejadian</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 ml-6">
              {new Date(item.tanggalTerjadi).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {item.kronologi && Array.isArray(item.kronologi) ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-4 h-4 flex items-center justify-center text-gray-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                <span className="text-xs font-medium text-gray-500">Kronologi Kejadian</span>
              </div>
              <div className="ml-6 space-y-1.5">
                {item.kronologi.map((k, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="font-semibold text-gray-700 whitespace-nowrap min-w-[105px]">
                      {k.tanggal ? new Date(k.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : ""}
                    </span>
                    {k.jam && (
                      <span className="text-gray-500 whitespace-nowrap">{k.jam}</span>
                    )}
                    {k.lokasi && (
                      <span className="text-gray-500">@{k.lokasi}</span>
                    )}
                    <span className="text-gray-600">—</span>
                    <span className="text-gray-800">{k.keterangan}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : item.kronologi && typeof item.kronologi === "string" ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-4 h-4 flex items-center justify-center text-gray-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                <span className="text-xs font-medium text-gray-500">Kronologi Kejadian</span>
              </div>
              <p className="text-sm text-gray-900 ml-6 whitespace-pre-wrap">{item.kronologi}</p>
            </div>
          ) : null}

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">Unsur Terlibat</span>
            </div>
            <div className="ml-6 space-y-1.5">
              {(Array.isArray(item.unsurTerlibat) ? item.unsurTerlibat : []).map((u, i) => (
                <div key={i} className="border border-gray-200 rounded-lg px-3 py-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      u.peran === "pelaku" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {u.peran === "pelaku" ? "Pelaku" : "Korban"}
                    </span>
                    <span className="text-xs font-medium text-gray-500">{u.kategori || "-"}</span>
                    {u.asalSekolah && <span className="text-xs text-gray-500">· {u.asalSekolah}</span>}
                  </div>
                  {Array.isArray(u.individu) && u.individu.length > 0 && u.individu.map((ind, idx) => (
                    <div key={idx} className="flex items-center gap-3 pl-4 text-sm">
                      <span className="text-gray-400 text-xs">#{idx + 1}</span>
                      <span className="font-semibold text-gray-900">{ind.nama || "-"}</span>
                      {ind.umur && <span className="text-gray-500 text-xs">{ind.umur} thn</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {item.motif && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-4 h-4 flex items-center justify-center text-gray-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </span>
                <span className="text-xs font-medium text-gray-500">Motif Kejadian</span>
              </div>
              <p className="text-sm text-gray-900 ml-6 leading-relaxed">{item.motif}</p>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">Detail Kasus</span>
            </div>
            <p className="text-sm text-gray-900 ml-6 leading-relaxed">{item.rekomendasi}</p>
          </div>

          <SectionDivider icon={<Users className="w-4 h-4" />} title="Sumber Laporan & PIC" />

          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">Pelapor / Sumber Laporan</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 ml-6">
              {PELAPOR_OPTIONS.find((p) => p.value === item.pelapor)?.label ?? item.pelapor}
              {item.pelapor === "lainnya" && item.pelaporLainnya && <span> — {item.pelaporLainnya}</span>}
            </p>
          </div>

          {item.pic && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500">Penanggung Jawab (PIC)</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 ml-6">{item.pic}</p>
            </div>
          )}

          <SectionDivider icon={<CheckCircle className="w-4 h-4" />} title="Riwayat Status Pelanggaran" />

          <div className="flex flex-col gap-2">
            {Array.isArray((item as any).logStatus) && (item as any).logStatus.map((entry: { status: StatusPelanggaran; keterangan: string; dokumentasi?: string; dibuatOleh?: string; aksi?: string; waktu: string }, i: number) => {
                const dibuatOleh = entry.dibuatOleh || entry.keterangan.match(/oleh (.+)$/)?.[1] || ""
                const labelAksi = entry.aksi === "perbaharui_status" ? "Diperbaharui" : entry.aksi === "edit" ? "Diedit" : "Dibuat"
                const keterangan = entry.keterangan.replace(/ — oleh .+$/, "").replace(/^Laporan awal (dibuat )?/, "").trim()
                return (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={entry.status} />
                      <span className="text-xs text-gray-500">{labelAksi} oleh {dibuatOleh}</span>
                    </div>
                    {keterangan && <p className="text-xs text-gray-700"><span className="font-medium">Keterangan:</span> {keterangan}</p>}
                    {(entry as any).dokumentasi ? <p className="text-xs text-gray-700"><span className="font-medium">Dokumentasi:</span> {(entry as any).dokumentasi.startsWith("http") ? <a href={(entry as any).dokumentasi} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{(entry as any).dokumentasi}</a> : (entry as any).dokumentasi}</p> : null}
                    <p className="text-xs text-gray-400">
                      {new Date(entry.waktu).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                )
              })}
          </div>
        </div>

        {!readOnly && (
          <div className="border-t border-gray-200 p-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedStatus(item.status)
                setKeteranganStatus("")
                setDokumentasiStatus("")
                setShowStatusModal(true)
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              <Check className="w-4 h-4" /> Update Status
            </button>
          </div>
        )}
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowStatusModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Update Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {([
                { value: "baru" as StatusPelanggaran, label: "Baru", desc: "Laporan baru masuk, belum ditindaklanjuti", color: "bg-blue-500" },
                { value: "proses" as StatusPelanggaran, label: "Diproses", desc: "Kasus sedang dalam proses penanganan", color: "bg-amber-500" },
                { value: "selesai" as StatusPelanggaran, label: "Selesai", desc: "Kasus sudah ditangani dan selesai", color: "bg-green-500" },
                { value: "ditutup" as StatusPelanggaran, label: "Ditutup", desc: "Dihentikan tanpa penyelesaian (tidak terbukti, duplikat, luar kewenangan)", color: "bg-gray-500" },
              ] as { value: StatusPelanggaran; label: string; desc: string; color: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedStatus(opt.value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    selectedStatus === opt.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${opt.color} flex items-center justify-center text-white`}>
                      {opt.value === "baru" && <FileText className="w-4 h-4" />}
                      {opt.value === "proses" && <Clock className="w-4 h-4" />}
                      {opt.value === "selesai" && <CheckCircle className="w-4 h-4" />}
                      {opt.value === "ditutup" && <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-700">Keterangan <span className="text-gray-400">(opsional)</span></label>
                <textarea
                  value={keteranganStatus}
                  onChange={(e) => setKeteranganStatus(e.target.value)}
                  placeholder="Tambahkan keterangan..."
                  rows={2}
                  className="w-full p-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Link Dokumentasi <span className="text-gray-400">(opsional)</span></label>
                <input
                  type="text"
                  value={dokumentasiStatus}
                  onChange={(e) => setDokumentasiStatus(e.target.value)}
                  placeholder="Link atau keterangan dokumentasi..."
                  className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowStatusModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition">Batal</button>
              <button onClick={() => { setShowStatusModal(false); onUpdateStatus(item.id, selectedStatus, keteranganStatus, dokumentasiStatus) }} disabled={selectedStatus === item.status} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function FormModal({ onClose, onSubmit, initialData }: { onClose: () => void; onSubmit: (data: Omit<PelanggaranItem, "id" | "createdAt" | "updatedAt" | "dibuatOleh" | "diperbaruiOleh">) => void; initialData?: PelanggaranItem }) {
  const [namaSekolah, setNamaSekolah] = useState<string[]>(initialData?.namaSekolah ?? [])
  const [sekolahInput, setSekolahInput] = useState("")
  const [showSekolahDropdown, setShowSekolahDropdown] = useState(false)
  const [unsurTerlibat, setUnsurTerlibat] = useState<UnsurItem[]>(
    Array.isArray(initialData?.unsurTerlibat) && initialData!.unsurTerlibat.length > 0
      ? initialData!.unsurTerlibat
      : [{ peran: "pelaku", kategori: "", asalSekolah: "", jumlah: "", individu: [{ nama: "", umur: "" }] }]
  )
  const [kronologi, setKronologi] = useState<KronologiEntry[]>(
    Array.isArray(initialData?.kronologi)
      ? initialData!.kronologi.map((e: any) => ({ tanggal: e.tanggal ?? "", jam: e.jam ?? "", lokasi: e.lokasi ?? "", keterangan: e.keterangan ?? "" }))
      : initialData?.kronologi
        ? [{ tanggal: initialData.tanggalTerjadi?.split("T")[0] ?? "", jam: "", lokasi: "", keterangan: initialData.kronologi as string }]
        : [{ tanggal: "", jam: "", lokasi: "", keterangan: "" }]
  )
  const [kategori, setKategori] = useState(initialData?.kategori ?? "")
  const [tingkatKeparahan, setTingkatKeparahan] = useState<TingkatKeparahan>(initialData?.tingkatKeparahan ?? "biasa")
  const [pelapor, setPelapor] = useState<Pelapor>(initialData?.pelapor ?? "laporan_sekolah")
  const [pelaporLainnya, setPelaporLainnya] = useState(initialData?.pelaporLainnya ?? "")
  const [pic, setPic] = useState(initialData?.pic ?? "")
  const [picInput, setPicInput] = useState("")
  const [showPicDropdown, setShowPicDropdown] = useState(false)
  const [tindakLanjut, setTindakLanjut] = useState(initialData?.tindakLanjut ?? "")
  const [dokumentasi, setDokumentasi] = useState(initialData?.dokumentasi ?? "")
  const [motif, setMotif] = useState(initialData?.motif ?? "")
  const [rekomendasi, setRekomendasi] = useState(initialData?.rekomendasi ?? "")
  const [status, setStatus] = useState<StatusPelanggaran>(initialData?.status ?? "baru")

  const allPicOptions = useMemo(() => {
    const names = new Set<string>()
    try {
      const stored = localStorage.getItem("pokjaList")
      if (stored) {
        const parsed = JSON.parse(stored) as any[]
        parsed.forEach((pokja: any) => {
          if (pokja.data?.members) {
            Object.values(pokja.data.members).forEach((m: any) => {
              if (m && m.nama && m.nama.trim()) names.add(m.nama.trim())
            })
          }
        })
      }
    } catch { /* ignore */ }
    return Array.from(names).sort()
  }, [])

  const allSchoolSuggestions = useMemo(() => {
    const names = new Set<string>()
    SEKOLAH_OPTIONS.forEach((s) => names.add(s))
    try {
      const stored = localStorage.getItem("pelanggaranList")
      if (stored) {
        const parsed: PelanggaranItem[] = JSON.parse(stored)
        parsed.forEach((item) => {
          const list = Array.isArray(item.namaSekolah) ? item.namaSekolah : [item.namaSekolah]
          list.forEach((s) => { if (s.trim()) names.add(s.trim()) })
        })
      }
    } catch { /* ignore */ }
    return Array.from(names).sort()
  }, [])

  const filteredSekolahOptions = sekolahInput
    ? allSchoolSuggestions.filter((s) => s.toLowerCase().includes(sekolahInput.toLowerCase()) && !namaSekolah.includes(s))
    : allSchoolSuggestions.filter((s) => !namaSekolah.includes(s))

  const addSekolah = (name: string) => {
    const trimmed = name.trim()
    if (trimmed && !namaSekolah.includes(trimmed)) {
      setNamaSekolah((prev) => [...prev, trimmed])
    }
    setSekolahInput("")
    setShowSekolahDropdown(false)
  }

  const removeSekolah = (index: number) => {
    setNamaSekolah((prev) => prev.filter((_, i) => i !== index))
  }

  const filteredPicOptions = picInput
    ? allPicOptions.filter((name) => name.toLowerCase().includes(picInput.toLowerCase()))
    : allPicOptions

  const selectPic = (name: string) => {
    setPic(name)
    setPicInput("")
    setShowPicDropdown(false)
  }

  const clearPic = () => {
    setPic("")
    setPicInput("")
  }

  const canSubmit = namaSekolah.length > 0 && unsurTerlibat.some((u) => u.kategori && u.peran && u.individu.some((ind) => ind.nama)) && kronologi.some((e) => e.tanggal) && kategori && rekomendasi.trim() && tingkatKeparahan && pelapor

  const handleSubmit = () => {
    if (!canSubmit) return
    const firstTanggal = kronologi.find((e) => e.tanggal)?.tanggal ?? ""
    onSubmit({
      namaSekolah,
      unsurTerlibat: unsurTerlibat.filter((u) => u.kategori && u.peran && u.individu.some((ind) => ind.nama)),
      tanggalTerjadi: firstTanggal,
      kronologi: kronologi,
      kategori,
      tingkatKeparahan,
      pelapor,
      motif: motif.trim() || undefined,
      pelaporLainnya: pelapor === "lainnya" ? pelaporLainnya.trim() : "",
      tindakLanjut: tindakLanjut.trim(),
      pic: pic.trim(),
      dokumentasi: dokumentasi.trim(),
      rekomendasi: rekomendasi.trim(),
      status,
    })
  }

  function SectionDivider({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
      <div className="flex items-center gap-2 pb-1 border-t border-gray-100 first:border-t-0">
        <span className="text-gray-500">{icon}</span>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{initialData ? "Edit" : "Buat"} Pelanggaran</h3>
              <p className="text-xs text-gray-500">Lengkapi formulir pelaporan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <SectionDivider icon={<AlertTriangle className="w-4 h-4" />} title="Informasi Pelanggaran" />

          <div>
            <label className="text-xs font-semibold text-gray-700">Nama Sekolah <span className="text-red-500">*</span></label>
            <div className="relative mt-1">
              <input
                type="text"
                value={sekolahInput}
                onChange={(e) => { setSekolahInput(e.target.value); setShowSekolahDropdown(true) }}
                onFocus={() => setShowSekolahDropdown(true)}
                onClick={() => setShowSekolahDropdown(true)}
                onBlur={() => setTimeout(() => setShowSekolahDropdown(false), 200)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSekolah(sekolahInput) } }}
                placeholder="Tambah nama sekolah"
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              {showSekolahDropdown && filteredSekolahOptions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredSekolahOptions.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addSekolah(o)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                    >
                      {o}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {namaSekolah.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-3">
                {namaSekolah.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 px-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 flex-1">{s}</span>
                    <button type="button" onClick={() => removeSekolah(i)} className="p-0.5 hover:bg-gray-200 rounded-full">
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Kategori Pelanggaran <span className="text-red-500">*</span></label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="" disabled>Pilih kategori</option>
                {KATEGORI_PELANGGARAN.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Tingkat Urgensi <span className="text-red-500">*</span></label>
              <select
                value={tingkatKeparahan}
                onChange={(e) => setTingkatKeparahan(e.target.value as TingkatKeparahan)}
                className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {TINGKAT_KEPARAHAN.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Kronologi Kejadian <span className="text-red-500">*</span></label>
            <div className="flex flex-col gap-2 mt-1">
              {kronologi.map((entry, i) => (
                <div key={i}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      {i === 0 && <label className="block text-xs text-gray-500 mb-1">Tanggal</label>}
                      <input
                        type="date"
                        value={entry.tanggal ?? ""}
                        onChange={(e) => {
                          const next = [...kronologi]
                          next[i] = { ...next[i], tanggal: e.target.value }
                          setKronologi(next)
                        }}
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div className="w-[100px] shrink-0">
                      {i === 0 && <label className="block text-xs text-gray-500 mb-1">Jam</label>}
                      <input
                        type="time"
                        value={entry.jam ?? ""}
                        onChange={(e) => {
                          const next = [...kronologi]
                          next[i] = { ...next[i], jam: e.target.value }
                          setKronologi(next)
                        }}
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div className="flex-[1.5]">
                      {i === 0 && <label className="block text-xs text-gray-500 mb-1">Lokasi</label>}
                      <input
                        type="text"
                        value={entry.lokasi ?? ""}
                        onChange={(e) => {
                          const next = [...kronologi]
                          next[i] = { ...next[i], lokasi: e.target.value }
                          setKronologi(next)
                        }}
                        placeholder="Lokasi..."
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div className="flex-[2]">
                      {i === 0 && <label className="block text-xs text-gray-500 mb-1">Keterangan</label>}
                      <input
                        type="text"
                        value={entry.keterangan ?? ""}
                        onChange={(e) => {
                          const next = [...kronologi]
                          next[i] = { ...next[i], keterangan: e.target.value }
                          setKronologi(next)
                        }}
                        placeholder="Deskripsikan kejadian pada tanggal ini..."
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    {kronologi.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setKronologi(kronologi.filter((_, idx) => idx !== i))}
                        className="p-1 mt-5 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setKronologi([...kronologi, { tanggal: "", jam: "", lokasi: "", keterangan: "" }])}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg px-3 py-2 transition w-full justify-center"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Kronologi
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Unsur yang Terlibat <span className="text-red-500">*</span></label>
            <div className="flex flex-col gap-2 mt-1">
              {unsurTerlibat.map((u, i) => {
                const predefined = UNSUR_OPTIONS.filter((o) => o !== "Lainnya")
                const isCustom = u.kategori && !predefined.includes(u.kategori)
                const displayKategori = isCustom ? "Lainnya" : u.kategori
                const lainCount = unsurTerlibat.filter((_, idx) => idx !== i && (_.kategori === "Lainnya" || (!predefined.includes(_.kategori) && _.kategori))).length
                const lainDisabled = lainCount >= 3
                const jml = parseInt(u.jumlah) || 0
                const syncIndividu = (next: UnsurItem[]) => {
                  const entry = next[i]
                  if (!entry) return
                  const newJml = parseInt(entry.jumlah) || 0
                  if (!entry.individu) entry.individu = []
                  const current = entry.individu.length
                  if (newJml > current) {
                    const add = Array.from({ length: newJml - current }, () => ({ nama: "", umur: "" }))
                    entry.individu = [...entry.individu, ...add]
                  } else if (newJml < current) {
                    entry.individu = entry.individu.slice(0, newJml)
                  }
                  if (newJml === 0) entry.individu = [{ nama: "", umur: "" }]
                  setUnsurTerlibat(next)
                }
                return (
                <div key={i} className="border border-gray-200 rounded-lg px-3 py-2.5">
                  <div className="grid grid-cols-[auto_1fr_1fr_72px_auto] gap-2 items-center">
                    <select
                      value={u.peran}
                      onChange={(e) => {
                        const next = [...unsurTerlibat]
                        next[i] = { ...next[i], peran: e.target.value as "pelaku" | "korban" }
                        setUnsurTerlibat(next)
                      }}
                      className="h-8 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="pelaku">Terduga Pelaku</option>
                      <option value="korban">Terduga Korban</option>
                    </select>
                    <select
                      value={displayKategori}
                      onChange={(e) => {
                        const next = [...unsurTerlibat]
                        next[i] = { ...next[i], kategori: e.target.value }
                        setUnsurTerlibat(next)
                      }}
                      className="w-full h-8 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white truncate"
                    >
                      <option value="" disabled>Jenis</option>
                      {UNSUR_OPTIONS.map((o) => (
                        <option key={o} value={o} disabled={o === "Lainnya" && lainDisabled}>{o} {o === "Lainnya" && lainDisabled ? "(maks 3)" : ""}</option>
                      ))}
                    </select>
                    <input
                      value={displayKategori === "Lainnya" ? (u.kategori !== "Lainnya" ? u.kategori : "") : u.asalSekolah}
                      onChange={(e) => {
                        const next = [...unsurTerlibat]
                        if (displayKategori === "Lainnya") {
                          next[i] = { ...next[i], kategori: e.target.value }
                        } else {
                          next[i] = { ...next[i], asalSekolah: e.target.value }
                        }
                        setUnsurTerlibat(next)
                      }}
                      placeholder={displayKategori === "Lainnya" ? "Tulis..." : "Asal sekolah"}
                      className="w-full h-8 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <input
                      type="number"
                      min="0"
                      value={u.jumlah}
                      onChange={(e) => {
                        const next = [...unsurTerlibat]
                        next[i] = { ...next[i], jumlah: e.target.value }
                        syncIndividu(next)
                      }}
                      placeholder="Jml"
                      className="w-full h-8 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    {i > 0 ? (
                      <button
                        type="button"
                        onClick={() => setUnsurTerlibat((prev) => prev.filter((_, idx) => idx !== i))}
                        className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="w-5" />
                    )}
                    </div>
                    {jml > 0 && (
                      <div className="flex flex-col gap-2 mt-2">
                        {u.individu.map((ind, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-sm text-gray-400 w-5 shrink-0 text-right">#{idx + 1}</span>
                          <input
                            value={ind.nama}
                            onChange={(e) => {
                              const next = [...unsurTerlibat]
                              next[i].individu[idx] = { ...next[i].individu[idx], nama: e.target.value }
                              setUnsurTerlibat(next)
                            }}
                            placeholder="Nama"
                            className="flex-1 min-w-0 h-7 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <input
                            type="number"
                            min="1"
                            value={ind.umur}
                            onChange={(e) => {
                              const next = [...unsurTerlibat]
                              next[i].individu[idx] = { ...next[i].individu[idx], umur: e.target.value }
                              setUnsurTerlibat(next)
                            }}
                            placeholder="Umur"
                            className="w-[72px] shrink-0 h-7 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <div className="w-[22px] shrink-0" />
                        </div>
                        ))}
                      </div>
                    )}
                </div>
              )})}
              <button
                type="button"
                onClick={() => setUnsurTerlibat((prev) => [...prev, { peran: "pelaku", kategori: "", asalSekolah: "", jumlah: "", individu: [{ nama: "", umur: "" }] }])}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg px-3 py-2 transition w-full justify-center"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Kelompok Unsur
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Motif Kejadian</label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Tuliskan motif kejadian..."
              rows={3}
              className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-y min-h-[60px]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Detail Kasus <span className="text-red-500">*</span></label>
            <textarea
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Tuliskan detail kasus..."
              rows={4}
              className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
            />
          </div>

          <SectionDivider icon={<FileText className="w-4 h-4" />} title="Sumber Laporan & PIC" />

          <div>
            <label className="text-xs font-semibold text-gray-700">Pelapor / Sumber Laporan <span className="text-red-500">*</span></label>
            <select
              value={pelapor}
              onChange={(e) => setPelapor(e.target.value as Pelapor)}
              className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {PELAPOR_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            {pelapor === "lainnya" && (
              <input
                type="text"
                value={pelaporLainnya}
                onChange={(e) => setPelaporLainnya(e.target.value)}
                placeholder="Tuliskan sumber laporan..."
                className="w-full h-9 px-3 mt-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Penanggung Jawab (PIC) <span className="text-gray-400">(opsional)</span></label>
            {!pic ? (
              <div className="relative mt-1">
                <input
                  type="text"
                  value={picInput}
                  onChange={(e) => { setPicInput(e.target.value); setShowPicDropdown(true) }}
                  onFocus={() => setShowPicDropdown(true)}
                  onClick={() => setShowPicDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPicDropdown(false), 200)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (filteredPicOptions.length > 0) selectPic(filteredPicOptions[0]) } }}
                  placeholder="Cari nama anggota pokja..."
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                {showPicDropdown && filteredPicOptions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredPicOptions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectPic(name)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 py-1.5 px-2 mt-1 bg-gray-50 rounded-lg">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 flex-1">{pic}</span>
                <button type="button" onClick={clearPic} className="p-0.5 hover:bg-gray-200 rounded-full">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            )}
          </div>

          {!initialData && (
          <>
          <SectionDivider icon={<CheckCircle className="w-4 h-4" />} title="Status Pelanggaran" />

          <div>
            <label className="text-xs font-semibold text-gray-700">Status Pelanggaran</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusPelanggaran)}
              className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="baru">Baru</option>
              <option value="proses">Diproses</option>
              <option value="selesai">Selesai</option>
              <option value="ditutup">Ditutup</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Tindak Lanjut / Catatan Penanganan <span className="text-gray-400">(opsional)</span></label>
            <textarea
              value={tindakLanjut}
              onChange={(e) => setTindakLanjut(e.target.value)}
              placeholder="Catat apa yang sudah atau akan dilakukan..."
              rows={3}
              className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Link Dokumentasi <span className="text-gray-400">(opsional)</span></label>
            <input
              type="text"
              value={dokumentasi}
              onChange={(e) => setDokumentasi(e.target.value)}
              placeholder="Link atau keterangan dokumentasi..."
              className="w-full h-9 px-3 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initialData ? "Simpan" : "Buat Pelanggaran"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function PelanggaranView({ readOnly, editId }: { readOnly?: boolean; editId?: string }) {
  const [list, setList] = useState<PelanggaranItem[]>([])
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<StatusPelanggaran | "semua">("semua")
  const [filterKategori, setFilterKategori] = useState<string>("semua")
  const [selected, setSelected] = useState<PelanggaranItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<PelanggaranItem | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    const stored = localStorage.getItem("pelanggaranList")
    if (stored) {
      try {
        const parsed: PelanggaranItem[] = JSON.parse(stored)
        const normalized = parsed.map((item) => {
          const unsur = Array.isArray(item.unsurTerlibat) ? item.unsurTerlibat : []
          return {
            ...item,
            namaSekolah: Array.isArray(item.namaSekolah) ? item.namaSekolah : [item.namaSekolah as any],
            unsurTerlibat: unsur,
            dokumentasi: Array.isArray(item.dokumentasi) ? item.dokumentasi[0] ?? "" : item.dokumentasi,
            tingkatKeparahan: (item as any).tingkatKeparahan ?? "biasa",
            pelapor: (item as any).pelapor ?? "laporan_sekolah",
            pelaporLainnya: (item as any).pelaporLainnya ?? "",
            tindakLanjut: (item as any).tindakLanjut ?? "",
            pic: (item as any).pic ?? "",
            diperbaruiOleh: (item as any).diperbaruiOleh ?? "",
          }
        })
        setList(normalized)
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (!editId || list.length === 0) return
    const found = list.find((i) => i.id === editId)
    if (found) {
      window.location.href = `/tambah-pelanggaran?edit=${editId}`
    }
  }, [editId, list])

  const kategoriOptions = useMemo(() => {
    const cats = new Set<string>()
    list.forEach((item) => { if (item.kategori) cats.add(item.kategori) })
    return Array.from(cats).sort()
  }, [list])

  const filtered = useMemo(() => {
    return list
      .filter((item) => {
        const sekolahList = Array.isArray(item.namaSekolah) ? item.namaSekolah : [item.namaSekolah]
        const matchSearch =
          search.trim() === "" ||
          sekolahList.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
          item.kategori.toLowerCase().includes(search.toLowerCase())
        const matchStatus = filterStatus === "semua" || item.status === filterStatus
        const matchKategori = filterKategori === "semua" || item.kategori === filterKategori
        return matchSearch && matchStatus && matchKategori
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [list, search, filterStatus, filterKategori])

  const totalRows = filtered.length
  const totalPages = Math.ceil(totalRows / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows)
  const paginatedData = filtered.slice(startIndex, endIndex)

  const stats = useMemo(() => {
    return {
      total: list.length,
      baru: list.filter((i) => i.status === "baru").length,
      proses: list.filter((i) => i.status === "proses").length,
      selesai: list.filter((i) => i.status === "selesai").length,
      ditutup: list.filter((i) => i.status === "ditutup").length,
    }
  }, [list])

  const saveList = (newList: PelanggaranItem[]) => {
    setList(newList)
    localStorage.setItem("pelanggaranList", JSON.stringify(newList))
  }

  const getSessionName = () => {
    const session = readAuthSession()
    return session?.role === "dinas"
      ? `Admin Dinas ${session.namaDinas ?? ""}`
      : session?.namaSekolah
        ? `Admin Sekolah ${session.namaSekolah}`
        : "Admin Sekolah"
  }

  const handleCreate = (data: Omit<PelanggaranItem, "id" | "createdAt" | "updatedAt" | "dibuatOleh" | "diperbaruiOleh">) => {
    const now = new Date().toISOString()
    const dibuatOleh = getSessionName()
    const newItem: PelanggaranItem & { logStatus?: { status: StatusPelanggaran; keterangan: string; waktu: string }[] } = {
      ...data,
      id: `pg-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      dibuatOleh,
      diperbaruiOleh: dibuatOleh,
      logStatus: [{ status: data.status, keterangan: `Laporan awal dibuat oleh ${dibuatOleh}`, waktu: now }],
    }
    saveList([newItem as PelanggaranItem, ...list])
    setShowForm(false)
  }

  const handleUpdate = (data: Omit<PelanggaranItem, "id" | "createdAt" | "updatedAt" | "dibuatOleh" | "diperbaruiOleh">) => {
    if (!editingItem) return
    const updaterName = getSessionName()
    const now = new Date().toISOString()
    const logStatus = [
      ...(Array.isArray((editingItem as any).logStatus) ? (editingItem as any).logStatus : []),
      { status: editingItem.status, keterangan: "", dokumentasi: "", dibuatOleh: updaterName, aksi: "edit", waktu: now },
    ]
    const updated: PelanggaranItem = {
      ...editingItem,
      ...data,
      updatedAt: now,
      diperbaruiOleh: updaterName,
      logStatus,
    }
    saveList(list.map((item) => (item.id === editingItem.id ? updated : item)))
    setShowForm(false)
    setEditingItem(undefined)
  }

  const handleUpdateStatus = (id: string, status: StatusPelanggaran, keterangan?: string, dokumentasi?: string) => {
    const updaterName = getSessionName()
    const now = new Date().toISOString()
    const updated = list.map((item) => {
      if (item.id !== id) return item
      const logStatus = [
        ...(Array.isArray((item as any).logStatus) ? (item as any).logStatus : []),
        { status, keterangan: keterangan?.trim() || "", dokumentasi: dokumentasi || "", dibuatOleh: updaterName, aksi: "perbaharui_status", waktu: now },
      ]
      const newDokumentasi = dokumentasi !== undefined ? dokumentasi : item.dokumentasi
      return { ...item, status, dokumentasi: newDokumentasi, updatedAt: now, diperbaruiOleh: updaterName, logStatus }
    })
    saveList(updated)
    setSelected(null)
  }

  const downloadCsv = () => {
    const rows = [
      ["Nama Sekolah", "Unsur Terlibat", "Tanggal", "Kategori", "Tingkat Urgensi", "Pelapor", "PIC", "Status", "Detail Kasus", "Tindak Lanjut", "Dibuat"].join(","),
      ...filtered.map((item) =>
        [
          `"${(Array.isArray(item.namaSekolah) ? item.namaSekolah : [item.namaSekolah]).join("; ")}"`,
          `"${(Array.isArray(item.unsurTerlibat) ? item.unsurTerlibat : []).map((u) => `${u.kategori} (${u.peran}) ${u.asalSekolah} - ${(u.individu || []).map((ind) => `${ind.nama}${ind.umur ? `(${ind.umur})` : ""}`).join(", ")}`).join("; ")}"`,
          `"${item.tanggalTerjadi}"`,
          `"${item.kategori}"`,
          `"${TINGKAT_KEPARAHAN.find((t) => t.value === item.tingkatKeparahan)?.label ?? item.tingkatKeparahan}"`,
          `"${PELAPOR_OPTIONS.find((p) => p.value === item.pelapor)?.label ?? item.pelapor}"`,
          `"${item.pic}"`,
          `"${item.status}"`,
          `"${item.rekomendasi}"`,
          `"${item.tindakLanjut}"`,
          `"${item.dibuatOleh}"`,
        ].join(",")
      ),
    ]
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pelanggaran-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterStatus, filterKategori])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Pelanggaran</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Pencatatan dan tracking kasus pelanggaran di sekolah</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={downloadCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> Ekspor CSV
          </button>
          {!readOnly && (
            <a
              href="/tambah-pelanggaran?create"
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" /> Buat Pelanggaran
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200" />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats.baru}</p>
            <p className="text-xs text-gray-500">Baru</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats.proses}</p>
            <p className="text-xs text-gray-500">Diproses</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats.selesai}</p>
            <p className="text-xs text-gray-500">Selesai</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats.ditutup}</p>
            <p className="text-xs text-gray-500">Ditutup</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 items-end flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari sekolah"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
        <select
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="semua">Semua Kategori</option>
          {KATEGORI_PELANGGARAN.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as StatusPelanggaran | "semua")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="semua">Semua Status</option>
          <option value="baru">Baru</option>
          <option value="proses">Diproses</option>
          <option value="selesai">Selesai</option>
          <option value="ditutup">Ditutup</option>
        </select>
      </div>

      {totalRows === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="font-semibold text-gray-700 text-sm">Belum ada data pelanggaran</p>
          {!readOnly && <p className="text-gray-500 text-xs mt-1">Klik "Buat Pelanggaran" untuk menambahkan data.</p>}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama Sekolah</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unsur Terlibat</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 text-sm text-gray-800">
                        {item.namaSekolah.join(", ")}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-800">
                        {(Array.isArray(item.unsurTerlibat) ? item.unsurTerlibat : []).map((u, i) => (
                          <div key={i} className="mb-1 last:mb-0">
                            <span className="text-xs text-gray-500">{u.kategori}</span>
                            <span className={`ml-1 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                              u.peran === "pelaku" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                            }`}>
                              {u.peran === "pelaku" ? "P" : "K"}
                            </span>
                            <div className="text-xs text-gray-700 pl-1">
                              {(u.individu || []).map((ind, idx) => (
                                <span key={idx}>{ind.nama}{idx < u.individu.length - 1 ? ", " : ""}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-800">
                        {new Date(item.tanggalTerjadi).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-800">
                        {item.kategori}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <a
                          href={`/tambah-pelanggaran?view=${item.id}`}
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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

      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={handleUpdateStatus}
          readOnly={readOnly}
        />
      )}

      {showForm && (
        <FormModal
          onClose={() => {
            setShowForm(false)
            setEditingItem(undefined)
          }}
          onSubmit={editingItem ? handleUpdate : handleCreate}
          initialData={editingItem}
        />
      )}
    </div>
  )
}
