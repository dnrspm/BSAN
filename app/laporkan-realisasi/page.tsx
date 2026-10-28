"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Calendar, MapPin, Users, Building2,
  CheckCircle, XCircle, Landmark, GraduationCap, Heart, HelpCircle, Link, X,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type StatusKegiatan = "menunggu" | "berlangsung" | "selesai" | "terealisasi"

interface PesertaItem {
  kategori: string
  jumlah: string
}

interface KegiatanData {
  id: string
  namaKegiatan: string
  penyelenggara: string[]
  tanggalMulai: string
  tanggalSelesai: string
  deskripsiKegiatan: string
  lokasi?: string
  linkGoogleMap?: string
  tautanMeeting?: string
  peserta?: PesertaItem[]
  linkDokumentasi?: string
  status: StatusKegiatan
}

// ---------------------------------------------------------------------------
// Seed data (must match KegiatanView)
// ---------------------------------------------------------------------------
const SEED_DATA: KegiatanData[] = [
  { id: "kg-1", namaKegiatan: "Workshop PKSA", penyelenggara: ["Sekolah"], tanggalMulai: "2025-04-15", tanggalSelesai: "2025-04-15", deskripsiKegiatan: "Workshop pengenalan isu kekerasan pada anak", lokasi: "Aula Sekolah", peserta: [{ kategori: "Guru", jumlah: "20" }, { kategori: "Siswa", jumlah: "30" }], linkDokumentasi: "", status: "selesai" },
  { id: "kg-2", namaKegiatan: "Sosialisasi Hak Anak", penyelenggara: ["Pusat", "Sekolah"], tanggalMulai: "2025-06-20", tanggalSelesai: "2025-06-21", deskripsiKegiatan: "Sosialisasi hak anak kepada seluruh siswa dan wali kelas", lokasi: "Ruang Serbaguna", linkGoogleMap: "https://maps.google.com", tautanMeeting: "https://zoom.us/j/123", peserta: [{ kategori: "Siswa", jumlah: "80" }, { kategori: "Masyarakat", jumlah: "40" }], linkDokumentasi: "https://docs.example.com", status: "berlangsung" },
  { id: "kg-3", namaKegiatan: "Rapat Koordinasi Kelompok Kerja", penyelenggara: ["Dinas Pendidikan", "Dinas Sosial"], tanggalMulai: "2025-07-10", tanggalSelesai: "2025-07-10", deskripsiKegiatan: "Rapat koordinasi bulanan antar anggota kelompok kerja", lokasi: "Kantor Dinas Pendidikan", peserta: [{ kategori: "Guru", jumlah: "30" }], linkDokumentasi: "", status: "menunggu" },
]

const PENYELENGGARA_OPTIONS = [
  "Sekolah", "Pusat", "Dinas Pendidikan", "Dinas PPPA", "Dinas Sosial",
  "Dinas Kesehatan", "Dinas Kominfo", "Dinas Dukbangga", "Organisasi Masyarakat", "Lainnya",
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getPenyelenggaraIcon(type: string) {
  const lower = type.toLowerCase()
  if (lower === "pusat") return Landmark
  if (lower.startsWith("dinas")) return Building2
  if (lower === "sekolah") return GraduationCap
  if (lower === "organisasi masyarakat") return Heart
  return HelpCircle
}

function getPenyelenggaraColors(type: string) {
  const lower = type.toLowerCase()
  if (lower === "pusat") return { bg: "bg-blue-500/10", text: "text-blue-700" }
  if (lower.startsWith("dinas")) return { bg: "bg-emerald-500/10", text: "text-emerald-700" }
  if (lower === "sekolah") return { bg: "bg-amber-500/10", text: "text-amber-700" }
  if (lower === "organisasi masyarakat") return { bg: "bg-purple-500/10", text: "text-purple-700" }
  return { bg: "bg-gray-500/10", text: "text-gray-700" }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[4px] border border-[#D9DBDD] shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-4 bg-[#F9F9F9] border-b border-gray-200 rounded-t-xl">
        <span className="text-gray-900 flex-shrink-0">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function SesuaiToggle({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2 mt-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-xs font-semibold border transition ${
          value === true
            ? "bg-emerald-600 border-emerald-600 text-white"
            : "bg-white border-[#808489] text-gray-600 hover:border-emerald-400 hover:text-emerald-600"
        }`}
      >
        <CheckCircle className="w-3.5 h-3.5" /> Sesuai
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-xs font-semibold border transition ${
          value === false
            ? "bg-red-500 border-red-500 text-white"
            : "bg-white border-[#808489] text-gray-600 hover:border-red-400 hover:text-red-500"
        }`}
      >
        <XCircle className="w-3.5 h-3.5" /> Tidak Sesuai
      </button>
    </div>
  )
}

function ReferenceLabel({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-xs text-gray-400 mt-2">
      <span className="font-medium text-gray-500">Rencana:</span> {value || <span className="italic">-</span>}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function LaporkanRealisasiInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id") ?? ""
  const [role, setRole] = useState("")
  const [kegiatan, setKegiatan] = useState<KegiatanData | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Sesuai/tidak state — null = belum dipilih
  const [tanggalSesuai, setTanggalSesuai] = useState<boolean | null>(null)
  const [lokasiSesuai, setLokasiSesuai] = useState<boolean | null>(null)
  const [penyelenggaraSesuai, setPenyelenggaraSesuai] = useState<boolean | null>(null)
  const [pesertaSesuai, setPesertaSesuai] = useState<boolean | null>(null)

  // Aktual values
  const [aktualTanggalMulai, setAktualTanggalMulai] = useState("")
  const [aktualTanggalSelesai, setAktualTanggalSelesai] = useState("")
  const [aktualLokasi, setAktualLokasi] = useState("")
  const [aktualPenyelenggara, setAktualPenyelenggara] = useState<string[]>([])
  const [aktualPeserta, setAktualPeserta] = useState<PesertaItem[]>([])

  // Penyelenggara tag input
  const [tagInput, setTagInput] = useState("")
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const availableOptions = PENYELENGGARA_OPTIONS.filter((o) => !aktualPenyelenggara.includes(o))
  const filteredOptions = tagInput
    ? availableOptions.filter((o) => o.toLowerCase().includes(tagInput.toLowerCase()))
    : availableOptions

  // Tambahan
  const [linkDokumentasi, setLinkDokumentasi] = useState("")
  const [catatan, setCatatan] = useState("")

  useEffect(() => {
    try {
      const authRaw = localStorage.getItem("auth")
      if (authRaw) setRole((JSON.parse(authRaw) as { role: string }).role)
    } catch {}
  }, [])

  useEffect(() => {
    if (!id) return
    let stored: KegiatanData[] = []
    try { stored = JSON.parse(sessionStorage.getItem("kegiatanList") ?? "[]") } catch {}
    const storedItem = stored.find((d) => d.id === id)
    const seedItem = SEED_DATA.find((d) => d.id === id)
    const merged = seedItem ? { ...seedItem, ...(storedItem ?? {}) } : storedItem
    if (merged) {
      setKegiatan(merged as KegiatanData)
      setAktualTanggalMulai(merged.tanggalMulai)
      setAktualTanggalSelesai(merged.tanggalSelesai)
      setAktualLokasi(merged.lokasi ?? "")
      setAktualPenyelenggara([...(merged.penyelenggara ?? [])])
      setAktualPeserta((merged.peserta ?? []).map((p) => ({ ...p })))
      setLinkDokumentasi(merged.linkDokumentasi ?? "")
    }
  }, [id])

  const goBack = () => {
    if (role === "sekolah" || role === "dinas") window.location.href = `/tambah-kegiatan?view=${id}`
    else router.back()
  }

  const allAnswered =
    tanggalSesuai !== null &&
    lokasiSesuai !== null &&
    penyelenggaraSesuai !== null &&
    pesertaSesuai !== null

  const canSubmit =
    allAnswered &&
    linkDokumentasi.trim() !== "" &&
    (tanggalSesuai || (aktualTanggalMulai && aktualTanggalSelesai)) &&
    (lokasiSesuai || aktualLokasi.trim() !== "") &&
    (penyelenggaraSesuai || aktualPenyelenggara.length > 0) &&
    (pesertaSesuai || aktualPeserta.every((p) => p.kategori && p.jumlah))

  const handleSimpan = () => {
    if (!canSubmit || !kegiatan) return

    const finalTanggalMulai = tanggalSesuai ? kegiatan.tanggalMulai : aktualTanggalMulai
    const finalTanggalSelesai = tanggalSesuai ? kegiatan.tanggalSelesai : aktualTanggalSelesai
    const finalLokasi = lokasiSesuai ? (kegiatan.lokasi ?? "") : aktualLokasi
    const finalPenyelenggara = penyelenggaraSesuai ? kegiatan.penyelenggara : aktualPenyelenggara
    const finalPeserta = pesertaSesuai ? (kegiatan.peserta ?? []) : aktualPeserta

    const realize = {
      tanggalMulai: finalTanggalMulai,
      tanggalSelesai: finalTanggalSelesai,
      lokasi: finalLokasi,
      penyelenggara: finalPenyelenggara,
      peserta: finalPeserta,
      linkDokumentasi,
      catatan,
      sesuai: { tanggal: tanggalSesuai, lokasi: lokasiSesuai, penyelenggara: penyelenggaraSesuai, peserta: pesertaSesuai },
      createdAt: new Date().toISOString(),
    }

    try {
      const stored: KegiatanData[] = JSON.parse(sessionStorage.getItem("kegiatanList") ?? "[]")
      const idx = stored.findIndex((i) => i.id === id)
      const updated = { ...(idx !== -1 ? stored[idx] : kegiatan), realize, status: "terealisasi" as StatusKegiatan, linkDokumentasi }
      if (idx !== -1) stored[idx] = updated
      else stored.push(updated)
      sessionStorage.setItem("kegiatanList", JSON.stringify(stored))
      window.dispatchEvent(new CustomEvent("kegiatanUpdated"))
    } catch {}

    setSubmitted(true)
  }

  useEffect(() => {
    if (!submitted) return
    const t = setTimeout(() => {
      if (role === "sekolah" || role === "dinas") window.location.href = "/dashboard?menu=kegiatan"
      else router.back()
    }, 1500)
    return () => clearTimeout(t)
  }, [submitted])

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Realisasi Dilaporkan</h2>
          <p className="text-sm text-gray-500 mt-1">Laporan realisasi kegiatan berhasil disimpan.</p>
        </div>
      </div>
    )
  }

  if (!kegiatan) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <p className="text-sm text-gray-400">Memuat data kegiatan...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Sticky header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-2 rounded-[4px] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900">Laporkan Realisasi</h1>
            <p className="text-xs text-gray-500 truncate">{kegiatan.namaKegiatan}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Petunjuk */}
        <div className="bg-blue-50 border border-blue-200 rounded-[4px] px-4 py-3">
          <p className="text-xs text-blue-700">
            Tinjau setiap data rencana kegiatan. Pilih <strong>Sesuai</strong> jika pelaksanaan sesuai rencana, atau <strong>Tidak Sesuai</strong> untuk menginput data yang sebenarnya.
          </p>
        </div>

        {/* Tanggal */}
        <SectionCard icon={<Calendar className="w-4 h-4" />} title="Tanggal Pelaksanaan">
          <div className="text-sm text-gray-700">
            {kegiatan.tanggalMulai === kegiatan.tanggalSelesai
              ? fmtDate(kegiatan.tanggalMulai)
              : `${fmtDate(kegiatan.tanggalMulai)} – ${fmtDate(kegiatan.tanggalSelesai)}`}
          </div>
          <SesuaiToggle value={tanggalSesuai} onChange={(v) => setTanggalSesuai(v)} />
          {tanggalSesuai === false && (
            <div className="mt-3 space-y-3">
              <ReferenceLabel
                label="Rencana"
                value={kegiatan.tanggalMulai === kegiatan.tanggalSelesai
                  ? fmtDate(kegiatan.tanggalMulai)
                  : `${fmtDate(kegiatan.tanggalMulai)} – ${fmtDate(kegiatan.tanggalSelesai)}`}
              />
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Tanggal Mulai Aktual</label>
                  <input
                    type="date"
                    value={aktualTanggalMulai}
                    onChange={(e) => setAktualTanggalMulai(e.target.value)}
                    className="bg-white h-9 px-3 text-sm border border-[#808489] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Tanggal Selesai Aktual</label>
                  <input
                    type="date"
                    value={aktualTanggalSelesai}
                    onChange={(e) => setAktualTanggalSelesai(e.target.value)}
                    className="bg-white h-9 px-3 text-sm border border-[#808489] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Penyelenggara */}
        <SectionCard icon={<Building2 className="w-4 h-4" />} title="Penyelenggara">
          <div className="flex flex-col gap-1.5">
            {kegiatan.penyelenggara.map((p) => {
              const Icon = getPenyelenggaraIcon(p)
              const colors = getPenyelenggaraColors(p)
              return (
                <div key={p} className="flex items-center gap-2 py-1.5 px-2 bg-[#F9F9F9] rounded-[4px]">
                  <div className={`w-7 h-7 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                  </div>
                  <span className="text-sm text-gray-700">{p}</span>
                </div>
              )
            })}
          </div>
          <SesuaiToggle value={penyelenggaraSesuai} onChange={(v) => setPenyelenggaraSesuai(v)} />
          {penyelenggaraSesuai === false && (
            <div className="mt-3">
              <ReferenceLabel label="Rencana" value={kegiatan.penyelenggara.join(", ")} />
              <div className="mt-2 flex flex-col gap-2">
                <div className="relative">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onFocus={() => setShowTagDropdown(true)}
                    onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                    onClick={() => setShowTagDropdown(true)}
                    placeholder="Tambah penyelenggara aktual"
                    className="w-full h-9 px-3 text-sm border border-[#808489] rounded-[4px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {showTagDropdown && filteredOptions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredOptions.map((o) => (
                        <button
                          key={o}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            setAktualPenyelenggara((prev) => [...prev, o])
                            setTagInput("")
                            setShowTagDropdown(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-gray-700"
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {aktualPenyelenggara.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {aktualPenyelenggara.map((p) => {
                      const Icon = getPenyelenggaraIcon(p)
                      const colors = getPenyelenggaraColors(p)
                      return (
                        <div key={p} className="flex items-center gap-2 py-1.5 px-2 bg-[#F9F9F9] rounded-[4px]">
                          <div className={`w-7 h-7 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                          </div>
                          <span className="text-sm text-gray-700 flex-1">{p}</span>
                          <button
                            type="button"
                            onClick={() => setAktualPenyelenggara((prev) => prev.filter((x) => x !== p))}
                            className="p-0.5 hover:bg-gray-200 rounded-full"
                          >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Lokasi */}
        <SectionCard icon={<MapPin className="w-4 h-4" />} title="Lokasi">
          <p className="text-sm text-gray-700">{kegiatan.lokasi || "-"}</p>
          <SesuaiToggle value={lokasiSesuai} onChange={(v) => setLokasiSesuai(v)} />
          {lokasiSesuai === false && (
            <div className="mt-3">
              <ReferenceLabel label="Rencana" value={kegiatan.lokasi ?? "-"} />
              <input
                value={aktualLokasi}
                onChange={(e) => setAktualLokasi(e.target.value)}
                placeholder="Lokasi aktual pelaksanaan"
                className="bg-white mt-2 w-full h-9 px-3 text-sm border border-[#808489] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </SectionCard>

        {/* Peserta */}
        <SectionCard icon={<Users className="w-4 h-4" />} title="Peserta">
          {kegiatan.peserta && kegiatan.peserta.length > 0 ? (
            <div className="flex flex-col gap-2">
              {kegiatan.peserta.map((p, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 bg-[#F9F9F9] rounded-[4px]">
                  <span className="text-sm font-medium text-gray-700 min-w-[100px]">{p.kategori}</span>
                  <span className="text-sm text-gray-500">: {p.jumlah} orang</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">-</p>
          )}
          <SesuaiToggle value={pesertaSesuai} onChange={(v) => {
            setPesertaSesuai(v)
            if (!v && aktualPeserta.length === 0) {
              setAktualPeserta((kegiatan.peserta ?? []).map((p) => ({ ...p })))
            }
          }} />
          {pesertaSesuai === false && (
            <div className="mt-3">
              <ReferenceLabel
                label="Rencana"
                value={(kegiatan.peserta ?? []).map((p) => `${p.kategori}: ${p.jumlah}`).join(", ")}
              />
              <div className="mt-2 flex flex-col gap-2">
                {aktualPeserta.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={p.kategori}
                      onChange={(e) => {
                        const next = [...aktualPeserta]
                        next[i] = { ...next[i], kategori: e.target.value }
                        setAktualPeserta(next)
                      }}
                      placeholder="Kategori"
                      className="bg-white flex-1 h-9 px-3 text-sm border border-[#808489] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      min="1"
                      value={p.jumlah}
                      onChange={(e) => {
                        const next = [...aktualPeserta]
                        next[i] = { ...next[i], jumlah: e.target.value }
                        setAktualPeserta(next)
                      }}
                      placeholder="Jumlah"
                      className="bg-white w-24 h-9 px-3 text-sm border border-[#808489] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">orang</span>
                    <button
                      type="button"
                      onClick={() => setAktualPeserta((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1.5 hover:bg-red-50 rounded-[4px] text-red-400 hover:text-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setAktualPeserta((prev) => [...prev, { kategori: "", jumlah: "" }])}
                  className="self-start text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                >
                  + Tambah Kategori
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Link Dokumentasi & Catatan */}
        <SectionCard icon={<Link className="w-4 h-4" />} title="Dokumentasi & Catatan">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Link Dokumentasi <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={linkDokumentasi}
                onChange={(e) => setLinkDokumentasi(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="bg-white w-full h-9 px-3 text-sm border border-[#808489] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700">Catatan Tambahan</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tambahkan catatan jika ada hal yang perlu disampaikan..."
                rows={3}
                className="bg-white p-3 text-sm border border-[#808489] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
              />
            </div>
          </div>
        </SectionCard>

        {/* Footer */}
        <div className="flex gap-3 pt-2 pb-6">
          <button
            type="button"
            onClick={goBack}
            className="flex-1 py-2.5 rounded-[4px] border border-[#808489] text-gray-700 font-medium text-sm hover:bg-[#F9F9F9] transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSimpan}
            disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-[4px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Simpan Laporan
          </button>
        </div>

      </div>
    </div>
  )
}

export default function LaporkanRealisasiPage() {
  return (
    <Suspense>
      <LaporkanRealisasiInner />
    </Suspense>
  )
}
