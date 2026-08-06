"use client"
import { useEffect, useMemo, useState } from "react"
import { Search, Filter, Plus, Pencil, X, ShieldCheck, UserCog } from "lucide-react"
import { KAB_KOTA_BY_PROVINSI } from "@/data/kabKotaData"
import {
  AKSI_LABEL,
  AKSI_LIST,
  MODUL_LABEL,
  MODUL_LIST,
  PERAN_LABEL,
  TINGKAT_LABEL,
  cariKandidat,
  emptyAkses,
  getAktorSaatIni,
  namaWilayahPenugasan,
  readPenggunaAkses,
  savePenggunaAkses,
  totalAksesAktif,
  type AksesAksi,
  type AksesModul,
  type AksesPengguna,
  type PenggunaAkses,
  type PeranPengguna,
  type TingkatWilayah,
} from "@/lib/user-access"

const PERAN_OPTIONS: PeranPengguna[] = ["pusat", "dinas", "sekolah"]
const TINGKAT_OPTIONS: TingkatWilayah[] = ["provinsi", "kabkota"]
const PROVINSI_OPTIONS = Object.keys(KAB_KOTA_BY_PROVINSI).sort((a, b) => a.localeCompare(b, "id"))

const AKSI_BADGE: Record<AksesAksi, string> = {
  buat: "bg-blue-50 text-blue-700 border-blue-200",
  edit: "bg-amber-50 text-amber-700 border-amber-200",
  hapus: "bg-red-50 text-red-700 border-red-200",
}

function nowISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatDateTime(value: string): string {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "-"
  const tanggal = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
  const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  return `${tanggal}, ${jam}`
}

interface FormState {
  email: string
  instansi: string
  peran: PeranPengguna
  tingkatWilayah: TingkatWilayah
  provinsi: string
  kabKota: string
  status: "aktif" | "nonaktif"
  akses: AksesPengguna
}

function toForm(p?: PenggunaAkses): FormState {
  return {
    email: p?.email ?? "",
    instansi: p?.instansi ?? "",
    peran: p?.peran ?? "dinas",
    tingkatWilayah: p?.tingkatWilayah ?? "provinsi",
    provinsi: p?.provinsi ?? "",
    kabKota: p?.kabKota ?? "",
    status: p?.status ?? "aktif",
    akses: p
      ? { sumberDukungan: { ...p.akses.sumberDukungan }, pelanggaran: { ...p.akses.pelanggaran } }
      : emptyAkses(),
  }
}

/** Sejajarkan isi tiap langkah dengan judulnya (lebar badge 20px + gap 8px). */
const STEP_INDENT = "pl-7"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function SectionTitle({ nomor, judul, aktif }: { nomor: number; judul: string; aktif: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
          aktif ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-400"
        }`}
      >
        {nomor}
      </span>
      <span className={`text-xs font-bold uppercase tracking-wider ${aktif ? "text-gray-500" : "text-gray-300"}`}>
        {judul}
      </span>
    </div>
  )
}

function PenggunaFormModal({
  initialData,
  emailTerdaftar,
  onClose,
  onSave,
}: {
  initialData?: PenggunaAkses
  emailTerdaftar: string[]
  onClose: () => void
  onSave: (form: FormState) => void
}) {
  const isEdit = !!initialData
  const [form, setForm] = useState<FormState>(() => toForm(initialData))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const toggleAkses = (modul: AksesModul, aksi: AksesAksi) =>
    setForm((f) => {
      const next = { ...f.akses, [modul]: { ...f.akses[modul] } }
      next[modul][aksi] = !next[modul][aksi]
      // Hak hapus mengandaikan hak ubah pada modul yang sama.
      if (aksi === "hapus" && next[modul].hapus) next[modul].edit = true
      if (aksi === "edit" && !next[modul].edit) next[modul].hapus = false
      return { ...f, akses: next }
    })

  const kabKotaOptions = KAB_KOTA_BY_PROVINSI[form.provinsi] ?? []

  // Langkah 1 selesai bila wilayah penugasan lengkap.
  const wilayahLengkap = !!form.provinsi && (form.tingkatWilayah === "provinsi" || !!form.kabKota)

  const kandidat = useMemo(() => {
    if (!wilayahLengkap) return []
    const sudahAda = new Set(emailTerdaftar.map((e) => e.toLowerCase()))
    return cariKandidat(form.tingkatWilayah, form.provinsi, form.kabKota).filter(
      (k) => !sudahAda.has(k.email.toLowerCase())
    )
  }, [wilayahLengkap, form.tingkatWilayah, form.provinsi, form.kabKota, emailTerdaftar])

  // Wilayah tanpa kandidat: email, instansi, dan peran diketik manual.
  const modeManual = wilayahLengkap && kandidat.length === 0

  // Langkah 2 terbuka bila email sudah dipilih (atau diketik dengan format valid).
  const emailDipilih = modeManual ? EMAIL_RE.test(form.email.trim()) : !!form.email

  const pilihEmail = (email: string) => {
    const k = kandidat.find((c) => c.email === email)
    setForm((f) => ({
      ...f,
      email,
      instansi: k?.instansi ?? "",
      peran: k?.peran ?? f.peran,
    }))
  }

  const gantiWilayah = (patch: Partial<FormState>) =>
    // Ganti wilayah membatalkan pilihan email karena daftarnya ikut berubah.
    setForm((f) => ({ ...f, ...patch, email: "", instansi: "" }))

  const submit = () => {
    const next: Record<string, string> = {}
    if (!form.provinsi) next.provinsi = "Provinsi wajib dipilih"
    if (form.tingkatWilayah === "kabkota" && !form.kabKota) next.kabKota = "Kabupaten/Kota wajib dipilih"
    if (!form.email.trim()) {
      next.email = modeManual ? "Email wajib diisi" : "Pilih pengguna terlebih dahulu"
    } else if (modeManual) {
      if (!EMAIL_RE.test(form.email.trim())) next.email = "Format email tidak valid"
      else if (emailTerdaftar.some((e) => e.toLowerCase() === form.email.trim().toLowerCase())) {
        next.email = "Email ini sudah terdaftar"
      }
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSave({ ...form, email: form.email.trim(), instansi: form.instansi.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isEdit ? "Ubah Pengguna" : "Tambah Whitelist Pengguna"}
              </h3>
              <p className="text-xs text-gray-500">
                {isEdit ? "Atur hak akses dan status akun" : "Tentukan wilayah dan penggunanya, lalu atur hak akses"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg" aria-label="Tutup">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isEdit ? (
            /* Mode ubah: identitas & wilayah tidak diubah dari sini. */
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1">
              <p className="text-sm font-medium text-gray-900">{form.email}</p>
              <p className="text-xs text-gray-500">{form.instansi}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-white text-gray-600 border-gray-200">
                  {PERAN_LABEL[form.peran]}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-white text-gray-600 border-gray-200">
                  {TINGKAT_LABEL[form.tingkatWilayah]} · {form.tingkatWilayah === "kabkota" ? form.kabKota : form.provinsi}
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Langkah 1 — wilayah penugasan, lalu pengguna di wilayah itu */}
              <div>
                <SectionTitle nomor={1} judul="Wilayah & Pengguna" aktif />
                <div className={STEP_INDENT}>
                <div className="flex gap-2 mt-2">
                  {TINGKAT_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => gantiWilayah({ tingkatWilayah: t, kabKota: "" })}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                        form.tingkatWilayah === t
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {TINGKAT_LABEL[t]}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Provinsi <span className="text-red-500">*</span></label>
                    <select
                      value={form.provinsi}
                      onChange={(e) => gantiWilayah({ provinsi: e.target.value, kabKota: "" })}
                      className="mt-1 w-full h-9 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    >
                      <option value="">Pilih provinsi</option>
                      {PROVINSI_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    {errors.provinsi && <p className="text-xs text-red-600 mt-1">{errors.provinsi}</p>}
                  </div>
                  {form.tingkatWilayah === "kabkota" && (
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Kabupaten/Kota <span className="text-red-500">*</span></label>
                      <select
                        value={form.kabKota}
                        onChange={(e) => gantiWilayah({ kabKota: e.target.value })}
                        disabled={!form.provinsi}
                        className="mt-1 w-full h-9 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">{form.provinsi ? "Pilih kabupaten/kota" : "Pilih provinsi dahulu"}</option>
                        {kabKotaOptions.map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                      {errors.kabKota && <p className="text-xs text-red-600 mt-1">{errors.kabKota}</p>}
                    </div>
                  )}
                </div>

                {/* Daftar pengguna muncul begitu wilayahnya lengkap */}
                {!wilayahLengkap ? null : modeManual ? (
                  /* Tidak ada kandidat di wilayah ini: email diketik manual. */
                  <>
                    <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mt-3">
                      Tidak ada pengguna terdaftar di wilayah ini. Masukkan datanya secara manual.
                    </p>
                    <div className="mt-3">
                      <label className="text-xs font-semibold text-gray-700">Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="nama@instansi.go.id"
                        className="mt-1 w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    <label className="block text-xs font-semibold text-gray-700 mt-3">
                      Pengguna <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-52 overflow-y-auto">
                      {kandidat.map((k) => (
                        <label
                          key={k.email}
                          className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-gray-50 ${
                            form.email === k.email ? "bg-slate-50" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="kandidat-email"
                            checked={form.email === k.email}
                            onChange={() => pilihEmail(k.email)}
                            className="mt-1 w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm text-gray-900 truncate">{k.email}</span>
                            <span className="block text-xs text-gray-500 truncate">
                              {k.instansi} · {PERAN_LABEL[k.peran]}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                  </>
                )}

                </div>
              </div>
            </>
          )}

          {/* Langkah 2 — hak akses */}
          <div className={isEdit ? "" : "border-t border-gray-100 pt-4"}>
            {isEdit ? (
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hak Akses</span>
              </div>
            ) : (
              <SectionTitle nomor={2} judul="Hak Akses" aktif={emailDipilih} />
            )}

            <div className={isEdit ? "" : STEP_INDENT}>
            {!isEdit && !emailDipilih ? (
              <p className="text-xs text-gray-400 mt-2">Pilih pengguna dahulu untuk menentukan hak aksesnya.</p>
            ) : (
              <>
                <p className="text-xs text-gray-500 mt-2 mb-3">
                  Atur per modul. Hak Hapus otomatis menyertakan hak Ubah.
                </p>
                <div className="space-y-2">
                  {MODUL_LIST.map((modul) => (
                    <div key={modul} className="border border-gray-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900">{MODUL_LABEL[modul]}</p>
                      <div className="flex flex-wrap gap-4 mt-2">
                        {AKSI_LIST.map((aksi) => (
                          <label key={aksi} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.akses[modul][aksi]}
                              onChange={() => toggleAkses(modul, aksi)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {AKSI_LABEL[aksi]}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status hanya diatur saat mengubah; pengguna baru selalu aktif. */}
                {isEdit && (
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-gray-700">Status Akun</label>
                    <select
                      value={form.status}
                      onChange={(e) => set("status", e.target.value as "aktif" | "nonaktif")}
                      className="mt-1 w-full h-9 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                )}
                {isEdit && form.status === "nonaktif" && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                    Akun nonaktif tidak dapat melakukan aksi apa pun meski hak akses dicentang.
                  </p>
                )}
              </>
            )}
            </div>
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
            disabled={!isEdit && !emailDipilih}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Simpan
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
  const [filterPeran, setFilterPeran] = useState<PeranPengguna | "semua">("semua")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PenggunaAkses | undefined>(undefined)

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
      .filter((p) => {
        const matchSearch =
          !q ||
          p.email.toLowerCase().includes(q) ||
          p.instansi.toLowerCase().includes(q) ||
          p.provinsi.toLowerCase().includes(q) ||
          p.kabKota.toLowerCase().includes(q)
        const matchPeran = filterPeran === "semua" || p.peran === filterPeran
        return matchSearch && matchPeran
      })
      .sort((a, b) => a.email.localeCompare(b.email, "id"))
  }, [list, search, filterPeran])

  const jumlahBerakses = list.filter((p) => p.status === "aktif" && totalAksesAktif(p) > 0).length

  const handleSave = (form: FormState) => {
    const jejak = { diperbaruiPada: nowISO(), diperbaruiOleh: getAktorSaatIni() }
    if (editing) {
      persist(list.map((p) => (p.id === editing.id ? { ...p, ...form, ...jejak } : p)))
    } else {
      persist([...list, { id: `u_${Date.now()}`, ...form, ...jejak }])
    }
    setFormOpen(false)
    setEditing(undefined)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Atur siapa yang boleh membuat, mengubah, dan menghapus Sumber Dukungan serta Kasus Pelanggaran
          </p>
        </div>
        <button
          onClick={() => { setEditing(undefined); setFormOpen(true) }}
          className="inline-flex items-center gap-2 px-4 h-9 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition self-start"
        >
          <Plus className="w-4 h-4" />
          Tambah Whitelist Pengguna
        </button>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">Total Pengguna</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{mounted ? list.length : "-"}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">Punya Hak Akses</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{mounted ? jumlahBerakses : "-"}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">Akun Nonaktif</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">
            {mounted ? list.filter((p) => p.status === "nonaktif").length : "-"}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari email, instansi, atau wilayah"
            className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={filterPeran}
            onChange={(e) => setFilterPeran(e.target.value as PeranPengguna | "semua")}
            className="h-9 pl-9 pr-8 text-sm border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-700"
          >
            <option value="semua">Semua Peran</option>
            {PERAN_OPTIONS.map((p) => (
              <option key={p} value={p}>{PERAN_LABEL[p]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabel */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {mounted && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <Search className="w-8 h-8" />
            <p className="text-sm">Tidak ada pengguna ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[980px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pengguna</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Wilayah Penugasan</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hak Akses</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Diperbarui</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-900 leading-tight flex items-center gap-2">
                          {p.email}
                          {p.status === "nonaktif" && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                              Nonaktif
                            </span>
                          )}
                        </p>
                        {/* Akun nonaktif: peran tidak ditampilkan, cukup penanda Nonaktif. */}
                        {p.status === "aktif" && (
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-600 border-gray-200">
                            {PERAN_LABEL[p.peran]}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="text-xs text-gray-400">{TINGKAT_LABEL[p.tingkatWilayah]}</p>
                        <p className="text-gray-900 mt-0.5">{namaWilayahPenugasan(p)}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="space-y-1.5">
                          {MODUL_LIST.map((modul) => {
                            const aktif = AKSI_LIST.filter((aksi) => p.akses[modul][aksi])
                            return (
                              <div key={modul} className="flex flex-wrap items-center gap-1">
                                <span className="text-xs text-gray-500">{MODUL_LABEL[modul]}:</span>
                                {aktif.length === 0 ? (
                                  <span className="text-xs text-gray-400">Tidak ada akses</span>
                                ) : (
                                  aktif.map((aksi) => (
                                    <span
                                      key={aksi}
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                        p.status === "nonaktif"
                                          ? "bg-gray-50 text-gray-400 border-gray-200"
                                          : AKSI_BADGE[aksi]
                                      }`}
                                    >
                                      {AKSI_LABEL[aksi]}
                                    </span>
                                  ))
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 hidden lg:table-cell">
                        <p className="text-gray-600">{formatDateTime(p.diperbaruiPada)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">oleh {p.diperbaruiOleh || "-"}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setEditing(p); setFormOpen(true) }}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Ubah
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mounted && filtered.length > 0 && (
        <p className="text-xs text-gray-400 text-right">Menampilkan {filtered.length} dari {list.length} pengguna</p>
      )}

      {formOpen && (
        <PenggunaFormModal
          initialData={editing}
          emailTerdaftar={list.map((p) => p.email)}
          onClose={() => { setFormOpen(false); setEditing(undefined) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
