"use client"
import { useEffect, useMemo, useState } from "react"
import { Search, Plus, ShieldOff, X, UserCog, UserPlus, AlertTriangle, Info, ArrowUp } from "lucide-react"
import {
  JABATAN_LABEL,
  TINGKAT_LABEL,
  aksesPenuh,
  cariKandidatEmail,
  getAktorSaatIni,
  labelJabatan,
  namaWilayahPenugasan,
  readPenggunaAkses,
  savePenggunaAkses,
  type PenggunaAkses,
  type TingkatWilayah,
} from "@/lib/user-access"

type KolomUrut = "email" | "wilayah" | "diperbarui"

/** Penanda arah urutan di header kolom — satu ikon, diputar saat menurun. */
function IkonUrut({ aktif, arah }: { aktif: boolean; arah: "asc" | "desc" }) {
  return (
    <ArrowUp
      className={`w-3.5 h-3.5 transition-transform ${aktif ? "text-gray-600" : "text-gray-300"} ${
        aktif && arah === "desc" ? "rotate-180" : ""
      }`}
    />
  )
}

function nowISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatTanggal(value: string): string {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

/** Satu pengguna yang dipilih untuk diberi akses. */
interface PenggunaTerpilih {
  email: string
  instansi: string
  tingkatWilayah: TingkatWilayah
  provinsi: string
  kabKota: string
}

interface FormState {
  terpilih: PenggunaTerpilih[]
}

function PenggunaFormModal({
  emailTerdaftar,
  onClose,
  onSave,
}: {
  emailTerdaftar: string[]
  onClose: () => void
  onSave: (form: FormState) => void
}) {
  const [terpilih, setTerpilih] = useState<PenggunaTerpilih[]>([])
  const [query, setQuery] = useState("")
  const [error, setError] = useState("")

  const emailDikecualikan = useMemo(
    () => [...emailTerdaftar, ...terpilih.map((t) => t.email)],
    [emailTerdaftar, terpilih]
  )

  const saran = useMemo(
    () => cariKandidatEmail(query, emailDikecualikan),
    [query, emailDikecualikan]
  )

  const tambah = (p: PenggunaTerpilih) => {
    setTerpilih((t) => [...t, p])
    setQuery("")
    setError("")
  }

  const hapusTerpilih = (email: string) => setTerpilih((t) => t.filter((x) => x.email !== email))

  const submit = () => {
    if (terpilih.length === 0) {
      setError("Pilih minimal satu pengguna")
      return
    }
    onSave({ terpilih })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      {/* Tinggi dipatok agar modal tidak melompat saat daftar saran muncul/hilang.
          Yang bisa di-scroll hanya daftarnya, bukan badan modal. */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg h-[560px] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Beri Akses Pengguna</h3>
              <p className="text-xs text-gray-500">Cari dan pilih pengguna yang diberi akses</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg" aria-label="Tutup">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col p-5 overflow-hidden">
          {/* Cari dan pilih pengguna, boleh lebih dari satu */}
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 mb-3 flex-shrink-0">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                Hanya pengguna yang terdaftar sebagai Admin Dinas Pendidikan yang bisa diberi akses
              </p>
            </div>

            <div className="flex-shrink-0">
              <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setError("") }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    // Enter memilih saran pertama yang memang boleh dipilih.
                    const pertama = saran.find((k) => k.adminDinas)
                    if (pertama) tambah(pertama)
                  }
                }}
                placeholder="Ketik email, instansi atau wilayah"
                className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              </div>

              {/* Daftar saran mengalir di bawah input (bukan absolute) agar
                  tidak terpotong oleh area modal yang bisa di-scroll. */}
              {query.trim() && (
                <div className="mt-1 w-full bg-white border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  {saran.length > 0 ? (
                    saran.map((k) => (
                      <button
                        key={k.email}
                        type="button"
                        disabled={!k.adminDinas}
                        onClick={() => tambah(k)}
                        className={`w-full text-left px-3 py-2.5 border-b border-gray-100 last:border-b-0 ${
                          k.adminDinas ? "hover:bg-gray-50" : "bg-gray-50/60 cursor-not-allowed"
                        }`}
                      >
                        <span
                          className={`block text-sm font-medium truncate ${
                            k.adminDinas ? "text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {k.email}
                        </span>
                        {/* Instansi sudah memuat nama wilayahnya, jadi tidak
                            perlu diulang di baris ini. */}
                        <span
                          className={`block text-xs truncate ${k.adminDinas ? "text-gray-500" : "text-gray-400"}`}
                        >
                          {labelJabatan(k)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-3 text-xs text-gray-500">
                      Tidak ada pengguna cocok dengan “{query.trim()}”.
                    </p>
                  )}
                </div>
              )}
            </div>
            {error && <p className="text-xs text-red-600 mt-1 flex-shrink-0">{error}</p>}

            {/* Yang sudah dipilih, tampil sebagai daftar seperti hasil pencarian */}
            {terpilih.length > 0 && (
              <div className="mt-4 flex flex-col min-h-0 flex-1">
                <p className="text-xs font-semibold text-gray-700 mb-1 flex-shrink-0">
                  Dipilih ({terpilih.length})
                </p>
                {/* Tinggi mengikuti isi; baru scroll saat melewati ruang tersisa. */}
                <div className="border border-gray-200 rounded-lg min-h-0 max-h-full overflow-y-auto">
                  {terpilih.map((t) => (
                    <div
                      key={t.email}
                      className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{t.email}</p>
                        <p className="text-xs text-gray-500 truncate">{labelJabatan(t)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => hapusTerpilih(t.email)}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
                        aria-label={`Hapus ${t.email}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Kondisi awal: belum mengetik dan belum memilih siapa pun */}
            {terpilih.length === 0 && !query.trim() && (
              <div className="mt-4 flex flex-1 min-h-0 flex-col items-center justify-center text-center px-6">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 mt-3">Belum ada pengguna dipilih</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Ketik email, instansi, atau wilayah di kolom pencarian untuk menemukan Admin Dinas Pendidikan
                  yang akan diberi akses.
                </p>
              </div>
            )}
        </div>
      </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={submit}
            disabled={terpilih.length === 0}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Beri Akses
          </button>
        </div>
      </div>
    </div>
  )
}

function CabutAksesModal({
  pengguna,
  onClose,
  onConfirm,
}: {
  pengguna: PenggunaAkses
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Cabut Akses Pengguna?</h3>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          <span className="font-medium text-gray-900">{pengguna.email}</span> hanya dapat melihat dan tidak lagi bisa membuat, mengubah, atau menghapus Sumber Dukungan dan Kasus Pelanggaran.
        </p>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            Ya, Cabut Akses
          </button>
        </div>
      </div>
    </div>
  )
}

export function ManajemenPenggunaView() {
  const [list, setList] = useState<PenggunaAkses[]>([])
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<PenggunaAkses | null>(null)
  const [halaman, setHalaman] = useState(1)

  const [urutKolom, setUrutKolom] = useState<KolomUrut>("email")
  const [urutArah, setUrutArah] = useState<"asc" | "desc">("asc")

  const perHalaman = 10

  /** Klik kolom yang sama membalik arah; kolom lain mulai dari arah wajarnya. */
  const ubahUrutan = (kolom: KolomUrut) => {
    if (kolom === urutKolom) {
      setUrutArah((a) => (a === "asc" ? "desc" : "asc"))
    } else {
      setUrutKolom(kolom)
      setUrutArah(kolom === "diperbarui" ? "desc" : "asc")
    }
    setHalaman(1)
  }

  useEffect(() => {
    setList(readPenggunaAkses())
    setMounted(true)
  }, [])

  const persist = (next: PenggunaAkses[]) => {
    setList(next)
    savePenggunaAkses(next)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return list
      .filter(
        (p) =>
          !q ||
          p.email.toLowerCase().includes(q) ||
          p.instansi.toLowerCase().includes(q) ||
          p.provinsi.toLowerCase().includes(q) ||
          p.kabKota.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const selisih =
          urutKolom === "email"
            ? a.email.localeCompare(b.email, "id")
            : urutKolom === "wilayah"
              ? namaWilayahPenugasan(a).localeCompare(namaWilayahPenugasan(b), "id")
              : a.diperbaruiPada.localeCompare(b.diperbaruiPada)
        return urutArah === "asc" ? selisih : -selisih
      })
  }, [list, search, urutKolom, urutArah])

  const totalHalaman = Math.max(1, Math.ceil(filtered.length / perHalaman))
  const halamanAktif = Math.min(halaman, totalHalaman)
  const mulai = (halamanAktif - 1) * perHalaman
  const halamanIni = filtered.slice(mulai, mulai + perHalaman)

  const handleSave = ({ terpilih }: FormState) => {
    const jejak = { diperbaruiPada: nowISO(), diperbaruiOleh: getAktorSaatIni() }
    const baru: PenggunaAkses[] = terpilih.map((t, i) => ({
      id: `u_${Date.now()}_${i}`,
      ...t,
      status: "aktif",
      // Masuk daftar berarti dapat hak buat, ubah, dan hapus di kedua modul.
      akses: aksesPenuh(),
      ...jejak,
    }))
    persist([...list, ...baru])
    setFormOpen(false)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Akses Pengguna</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tentukan siapa yang boleh membuat, mengubah, dan menghapus Sumber Dukungan serta Kasus Pelanggaran.
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 h-9 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex-shrink-0 whitespace-nowrap self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Beri Akses
        </button>
      </div>

      {/* Tabel */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Toolbar dalam tabel: jumlah data di kiri, pencarian di kanan */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-gray-100">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{mounted ? filtered.length : "-"}</span> pengguna
            {mounted && search.trim() && filtered.length !== list.length ? ` dari ${list.length}` : ""}
          </p>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setHalaman(1) }}
              placeholder="Cari email, atau wilayah"
              className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {mounted && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <Search className="w-8 h-8" />
            <p className="text-sm">Tidak ada pengguna ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Lebar kolom dipatok agar tidak bergeser mengikuti panjang isinya. */}
            <table className="w-full text-sm min-w-[860px] table-fixed">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="w-[34%] text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <button
                      onClick={() => ubahUrutan("email")}
                      className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-700"
                    >
                      Pengguna
                      <IkonUrut aktif={urutKolom === "email"} arah={urutArah} />
                    </button>
                  </th>
                  <th className="w-[22%] text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <button
                      onClick={() => ubahUrutan("wilayah")}
                      className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-700"
                    >
                      Wilayah Penugasan
                      <IkonUrut aktif={urutKolom === "wilayah"} arah={urutArah} />
                    </button>
                  </th>
                  <th className="w-[26%] text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                    <button
                      onClick={() => ubahUrutan("diperbarui")}
                      className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-700"
                    >
                      Diberikan Akses
                      <IkonUrut aktif={urutKolom === "diperbarui"} arah={urutArah} />
                    </button>
                  </th>
                  <th className="w-[18%] px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {halamanIni.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-900 leading-tight truncate">{p.email}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{JABATAN_LABEL}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-xs text-gray-400 truncate">{TINGKAT_LABEL[p.tingkatWilayah]}</p>
                      <p className="text-gray-900 mt-0.5 truncate">{namaWilayahPenugasan(p)}</p>
                    </td>
                    <td className="px-3 py-3.5 hidden lg:table-cell">
                      <p className="text-gray-600 truncate">{formatTanggal(p.diperbaruiPada)}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">oleh {p.diperbaruiOleh || "-"}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setDeleting(p)}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors whitespace-nowrap"
                        >
                          <ShieldOff className="w-3.5 h-3.5" /> Cabut Akses
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginasi */}
        {mounted && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Menampilkan {mulai + 1}-{Math.min(mulai + perHalaman, filtered.length)} dari {filtered.length} pengguna
            </p>
            {totalHalaman > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setHalaman(halamanAktif - 1)}
                  disabled={halamanAktif === 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                {Array.from({ length: totalHalaman }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setHalaman(n)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                      halamanAktif === n
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-50 border border-gray-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setHalaman(halamanAktif + 1)}
                  disabled={halamanAktif === totalHalaman}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {formOpen && (
        <PenggunaFormModal
          emailTerdaftar={list.map((p) => p.email)}
          onClose={() => setFormOpen(false)}
          onSave={handleSave}
        />
      )}

      {deleting && (
        <CabutAksesModal
          pengguna={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            persist(list.filter((p) => p.id !== deleting.id))
            setDeleting(null)
          }}
        />
      )}
    </div>
  )
}
