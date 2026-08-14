"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, ShieldOff, AlertTriangle, ArrowUp } from "lucide-react"
import {
  PERAN_LABEL,
  PERAN_LABEL_SINGKAT,
  PERAN_LIST,
  TINGKAT_LABEL,
  namaWilayahPenugasan,
  readPenggunaAkses,
  savePenggunaAkses,
  type PenggunaAkses,
  type PeranPengguna,
} from "@/lib/user-access"

type KolomUrut = "email" | "peran" | "wilayah" | "diperbarui"

/** Warna badge per peran agar barisnya cepat dibedakan sekilas. */
const PERAN_BADGE: Record<PeranPengguna, string> = {
  adminPusat: "bg-purple-50 text-purple-700 border-purple-200",
  bpmp: "bg-amber-50 text-amber-700 border-amber-200",
  dinas: "bg-blue-50 text-blue-700 border-blue-200",
}

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

function formatTanggal(value: string): string {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
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
  const router = useRouter()
  const [list, setList] = useState<PenggunaAkses[]>([])
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState("")
  const [filterPeran, setFilterPeran] = useState<PeranPengguna | "semua">("semua")
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
      .filter((p) => filterPeran === "semua" || p.peran === filterPeran)
      .filter(
        (p) =>
          !q ||
          p.email.toLowerCase().includes(q) ||
          p.instansi.toLowerCase().includes(q) ||
          p.provinsi.toLowerCase().includes(q) ||
          p.kabKota.toLowerCase().includes(q) ||
          PERAN_LABEL[p.peran].toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const selisih =
          urutKolom === "email"
            ? a.email.localeCompare(b.email, "id")
            : urutKolom === "peran"
              // Urutan peran mengikuti PERAN_LIST (pusat → BPMP → dinas), bukan abjad.
              ? PERAN_LIST.indexOf(a.peran) - PERAN_LIST.indexOf(b.peran)
              : urutKolom === "wilayah"
                ? namaWilayahPenugasan(a).localeCompare(namaWilayahPenugasan(b), "id")
                : a.diperbaruiPada.localeCompare(b.diperbaruiPada)
        return urutArah === "asc" ? selisih : -selisih
      })
  }, [list, search, filterPeran, urutKolom, urutArah])

  const totalHalaman = Math.max(1, Math.ceil(filtered.length / perHalaman))
  const halamanAktif = Math.min(halaman, totalHalaman)
  const mulai = (halamanAktif - 1) * perHalaman
  const halamanIni = filtered.slice(mulai, mulai + perHalaman)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Akses Pengguna</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Atur dan tentukan akses pengguna yang bisa membuat, mengubah, dan menghapus Sumber Dukungan serta Kasus Pelanggaran.
          </p>
        </div>
        <button
          onClick={() => router.push("/beri-akses")}
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
            {mounted && filtered.length !== list.length ? ` dari ${list.length}` : ""}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <select
              value={filterPeran}
              onChange={(e) => { setFilterPeran(e.target.value as PeranPengguna | "semua"); setHalaman(1) }}
              className="h-9 px-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition sm:w-44"
              aria-label="Filter peran"
            >
              <option value="semua">Semua Peran</option>
              {PERAN_LIST.map((p) => (
                <option key={p} value={p}>{PERAN_LABEL_SINGKAT[p]}</option>
              ))}
            </select>
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setHalaman(1) }}
                placeholder="Cari email atau wilayah"
                className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {mounted && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <Search className="w-8 h-8" />
            <p className="text-sm">Tidak ada pengguna ditemukan</p>
            {filterPeran !== "semua" && (
              <button
                onClick={() => { setFilterPeran("semua"); setHalaman(1) }}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Tampilkan semua peran
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Lebar kolom dipatok agar tidak bergeser mengikuti panjang isinya. */}
            <table className="w-full text-sm min-w-[960px] table-fixed">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="w-[30%] text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <button
                      onClick={() => ubahUrutan("email")}
                      className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-700"
                    >
                      Pengguna
                      <IkonUrut aktif={urutKolom === "email"} arah={urutArah} />
                    </button>
                  </th>
                  <th className="w-[16%] text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <button
                      onClick={() => ubahUrutan("peran")}
                      className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-700"
                    >
                      Peran
                      <IkonUrut aktif={urutKolom === "peran"} arah={urutArah} />
                    </button>
                  </th>
                  <th className="w-[20%] text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <button
                      onClick={() => ubahUrutan("wilayah")}
                      className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-700"
                    >
                      Wilayah Penugasan
                      <IkonUrut aktif={urutKolom === "wilayah"} arah={urutArah} />
                    </button>
                  </th>
                  <th className="w-[22%] text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                    <button
                      onClick={() => ubahUrutan("diperbarui")}
                      className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-700"
                    >
                      Diberikan Akses
                      <IkonUrut aktif={urutKolom === "diperbarui"} arah={urutArah} />
                    </button>
                  </th>
                  <th className="w-[16%] px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {halamanIni.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-900 leading-tight truncate">{p.email}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{p.instansi || "-"}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap ${PERAN_BADGE[p.peran]}`}
                      >
                        {PERAN_LABEL_SINGKAT[p.peran]}
                      </span>
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
