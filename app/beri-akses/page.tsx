"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Info, Plus, Search, Trash2, UserPlus, X } from "lucide-react"
import { KAB_KOTA_BY_PROVINSI } from "@/data/kabKotaData"
import {
  PERAN_LABEL_SINGKAT,
  PERAN_LIST,
  TINGKAT_LABEL,
  TINGKAT_PER_PERAN,
  aksesPenuh,
  cariKandidatEmail,
  getAktorSaatIni,
  instansiPeran,
  labelJabatan,
  readPenggunaAkses,
  savePenggunaAkses,
  type PenggunaAkses,
  type PeranPengguna,
  type TingkatWilayah,
} from "@/lib/user-access"

/** Kembali ke tabel Akses Pengguna di dashboard Admin Pusat. */
const URL_KEMBALI = "/dashboard?menu=pengguna"

/** Provinsi yang punya daftar kab/kota — dipakai di form input manual. */
const PROVINSI_OPTIONS = Object.keys(KAB_KOTA_BY_PROVINSI).sort((a, b) => a.localeCompare(b, "id"))

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Satu pengguna yang dipilih untuk diberi akses. */
interface PenggunaTerpilih {
  email: string
  peran: PeranPengguna
  instansi: string
  tingkatWilayah: TingkatWilayah
  provinsi: string
  kabKota: string
}

function nowISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function SectionCard({
  title,
  deskripsi,
  children,
}: {
  title: string
  deskripsi?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      {deskripsi && <p className="text-xs text-gray-500 mt-0.5">{deskripsi}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function BeriAksesPage() {
  const router = useRouter()

  const [daftar, setDaftar] = useState<PenggunaAkses[]>([])
  const [terpilih, setTerpilih] = useState<PenggunaTerpilih[]>([])
  const [query, setQuery] = useState("")
  const [error, setError] = useState("")

  // Input manual: dipakai saat email belum terdaftar di direktori, sehingga
  // peran dan wilayah kewenangannya harus ditentukan sendiri oleh admin.
  const [manualOpen, setManualOpen] = useState(false)
  /** Satu peran/wilayah bisa dipakai banyak email — tiap email punya barisnya sendiri. */
  const [manualEmails, setManualEmails] = useState<string[]>([""])
  const [manualPeran, setManualPeran] = useState<PeranPengguna | "">("")
  const [manualTingkat, setManualTingkat] = useState<TingkatWilayah | "">("")
  const [manualProvinsi, setManualProvinsi] = useState("")
  const [manualKabKota, setManualKabKota] = useState("")
  const [manualError, setManualError] = useState("")

  useEffect(() => {
    setDaftar(readPenggunaAkses())
  }, [])

  const emailDikecualikan = useMemo(
    () => [...daftar.map((p) => p.email), ...terpilih.map((t) => t.email)],
    [daftar, terpilih]
  )

  const saran = useMemo(
    () => cariKandidatEmail(query, emailDikecualikan, 8),
    [query, emailDikecualikan]
  )

  const tambah = (p: PenggunaTerpilih) => {
    setTerpilih((t) => [...t, p])
    setQuery("")
    setError("")
  }

  const hapusTerpilih = (email: string) => setTerpilih((t) => t.filter((x) => x.email !== email))

  const bukaManual = () => {
    const q = query.trim()
    // Kata kunci yang berbentuk email dibawa ke kolom email agar tidak diketik ulang.
    setManualEmails([q.includes("@") ? q : ""])
    setManualPeran("")
    setManualTingkat("")
    setManualProvinsi("")
    setManualKabKota("")
    setManualError("")
    setManualOpen(true)
    setError("")
  }

  const tutupManual = () => {
    setManualOpen(false)
    setManualError("")
  }

  /**
   * Ganti peran: opsi wilayah mengikuti peran, jadi pilihan wilayah sebelumnya
   * dibuang. Admin Pusat dan BPMP tingkatnya sudah pasti, langsung diisikan.
   */
  const pilihPeran = (peran: PeranPengguna) => {
    const tingkatOpsi = TINGKAT_PER_PERAN[peran]
    setManualPeran(peran)
    setManualTingkat(tingkatOpsi.length === 1 ? tingkatOpsi[0] : "")
    setManualProvinsi("")
    setManualKabKota("")
    setManualError("")
  }

  /**
   * Wilayah kewenangan sudah lengkap sesuai perannya — kolom email baru
   * dibuka setelah ini terpenuhi.
   */
  const wilayahLengkap =
    !!manualPeran &&
    !!manualTingkat &&
    (manualTingkat === "nasional" ||
      (!!manualProvinsi && (manualTingkat !== "kabkota" || !!manualKabKota)))

  const jumlahEmailTerisi = manualEmails.filter((e) => e.trim()).length

  const ubahEmailManual = (index: number, nilai: string) => {
    setManualEmails((list) => list.map((e, i) => (i === index ? nilai : e)))
    setManualError("")
  }

  const tambahBarisEmail = () => {
    setManualEmails((list) => [...list, ""])
    setManualError("")
  }

  const hapusBarisEmail = (index: number) => {
    setManualEmails((list) => list.filter((_, i) => i !== index))
    setManualError("")
  }

  const tambahManual = () => {
    if (!manualPeran) {
      setManualError("Pilih peran pengguna")
      return
    }
    if (!manualTingkat) {
      setManualError("Pilih wilayah kewenangan")
      return
    }
    // Admin Pusat cakupannya nasional, tidak terikat provinsi/kab-kota.
    if (manualTingkat !== "nasional" && !manualProvinsi) {
      setManualError("Pilih provinsi")
      return
    }
    if (manualTingkat === "kabkota" && !manualKabKota) {
      setManualError("Pilih kabupaten/kota")
      return
    }
    // Baris kosong diabaikan; sisanya divalidasi satu per satu.
    const emails = manualEmails.map((e) => e.trim().toLowerCase()).filter(Boolean)
    if (emails.length === 0) {
      setManualError("Masukkan minimal satu email")
      return
    }
    for (const [i, email] of emails.entries()) {
      if (!POLA_EMAIL.test(email)) {
        setManualError(`“${email}” bukan alamat email yang valid`)
        return
      }
      if (emailDikecualikan.some((e) => e.trim().toLowerCase() === email)) {
        setManualError(`${email} sudah punya akses atau sudah dipilih`)
        return
      }
      if (emails.indexOf(email) !== i) {
        setManualError(`${email} ditulis lebih dari sekali`)
        return
      }
    }
    const provinsi = manualTingkat === "nasional" ? "" : manualProvinsi
    const kabKota = manualTingkat === "kabkota" ? manualKabKota : ""
    const instansi = instansiPeran(manualPeran, manualTingkat, provinsi, kabKota)
    // Semua email berbagi peran dan wilayah yang sama.
    setTerpilih((t) => [
      ...t,
      ...emails.map((email) => ({
        email,
        peran: manualPeran,
        instansi,
        tingkatWilayah: manualTingkat,
        provinsi,
        kabKota,
      })),
    ])
    setQuery("")
    setError("")
    setManualOpen(false)
    setManualError("")
  }

  const simpan = () => {
    if (terpilih.length === 0) {
      setError("Pilih minimal satu pengguna")
      return
    }
    const jejak = { diperbaruiPada: nowISO(), diperbaruiOleh: getAktorSaatIni() }
    const baru: PenggunaAkses[] = terpilih.map((t, i) => ({
      id: `u_${Date.now()}_${i}`,
      ...t,
      status: "aktif",
      // Masuk daftar berarti dapat hak buat, ubah, dan hapus di kedua modul.
      akses: aksesPenuh(),
      ...jejak,
    }))
    savePenggunaAkses([...daftar, ...baru])
    router.push(URL_KEMBALI)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push(URL_KEMBALI)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900">Beri Akses Pengguna</h1>
            <p className="text-xs text-gray-500">
              Cari dan pilih pengguna yang diberi akses membuat, mengubah, dan menghapus data
            </p>
          </div>
        </div>
      </div>

      {/* pb-24: ruang agar isi terakhir tidak tertutup bar aksi yang dipatok di bawah */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            Akses bisa diberikan ke Admin Pusat, BPMP, dan Admin Dinas Pendidikan yang terdaftar. Bila
            emailnya belum terdaftar, input manual beserta peran dan wilayah kewenangannya.
          </p>
        </div>

        <SectionCard title="Cari Pengguna" deskripsi="Ketik email, instansi, atau wilayah pengguna">
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
                  const pertama = saran.find((k) => k.peran !== null)
                  if (pertama?.peran) tambah({ ...pertama, peran: pertama.peran })
                }
              }}
              placeholder="Ketik email, instansi atau wilayah"
              className="w-full h-10 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {query.trim() && (
            <div className="mt-2 w-full border border-gray-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              {saran.length > 0 ? (
                saran.map((k) => (
                  <button
                    key={k.email}
                    type="button"
                    disabled={k.peran === null}
                    onClick={() => { if (k.peran) tambah({ ...k, peran: k.peran }) }}
                    className={`w-full text-left px-3 py-2.5 border-b border-gray-100 last:border-b-0 ${
                      k.peran ? "hover:bg-gray-50" : "bg-gray-50/60 cursor-not-allowed"
                    }`}
                  >
                    <span
                      className={`block text-sm font-medium truncate ${
                        k.peran ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {k.email}
                    </span>
                    {/* Instansi sudah memuat nama wilayahnya, jadi tidak
                        perlu diulang di baris ini. */}
                    <span
                      className={`block text-xs truncate ${k.peran ? "text-gray-500" : "text-gray-400"}`}
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

          {!manualOpen && (
            <button
              type="button"
              onClick={bukaManual}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Email tidak ditemukan? Input manual
            </button>
          )}

          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </SectionCard>

        {/* Input manual: email di luar direktori, peran dan wilayah ditentukan admin */}
        {manualOpen && (
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Input Pengguna Manual</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pilih peran dan wilayah kewenangan dulu, lalu masukkan email-nya
                </p>
              </div>
              <button
                type="button"
                onClick={tutupManual}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label="Tutup input manual"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700">Peran</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                  {PERAN_LIST.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => pilihPeran(p)}
                      className={`h-10 px-2 rounded-lg border text-sm font-medium transition truncate ${
                        manualPeran === p
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {PERAN_LABEL_SINGKAT[p]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opsi wilayah mengikuti peran: Admin Pusat tanpa pilihan,
                  BPMP hanya provinsi, Dinas boleh provinsi atau kab/kota. */}
              {manualPeran === "dinas" && (
                <div>
                  <label className="text-xs font-medium text-gray-700">Wilayah Kewenangan</label>
                  <div className="grid grid-cols-2 gap-2 mt-1 sm:max-w-sm">
                    {TINGKAT_PER_PERAN.dinas.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setManualTingkat(t)
                          if (t === "provinsi") setManualKabKota("")
                          setManualError("")
                        }}
                        className={`h-10 rounded-lg border text-sm font-medium transition ${
                          manualTingkat === t
                            ? "border-blue-600 bg-blue-50 text-blue-600"
                            : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {TINGKAT_LABEL[t]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!!manualTingkat && manualTingkat !== "nasional" && (
                <div className={`grid gap-3 ${manualTingkat === "kabkota" ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Provinsi</label>
                    <select
                      value={manualProvinsi}
                      onChange={(e) => { setManualProvinsi(e.target.value); setManualKabKota(""); setManualError("") }}
                      className={`w-full h-10 px-2 mt-1 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        manualProvinsi ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      <option value="" disabled>Pilih provinsi</option>
                      {PROVINSI_OPTIONS.map((p) => (
                        <option key={p} value={p} className="text-gray-900">{p}</option>
                      ))}
                    </select>
                  </div>
                  {manualTingkat === "kabkota" && (
                    <div>
                      <label className="text-xs font-medium text-gray-700">Kabupaten/Kota</label>
                      <select
                        value={manualKabKota}
                        onChange={(e) => { setManualKabKota(e.target.value); setManualError("") }}
                        disabled={!manualProvinsi}
                        className={`w-full h-10 px-2 mt-1 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          manualKabKota ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        <option value="" disabled>Pilih kabupaten/kota</option>
                        {(KAB_KOTA_BY_PROVINSI[manualProvinsi] ?? []).map((k) => (
                          <option key={k} value={k} className="text-gray-900">{k}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Email terakhir: satu peran/wilayah bisa diterapkan ke banyak email sekaligus,
                  tiap email pakai baris sendiri seperti form isian lain. */}
              {wilayahLengkap && (
                <div>
                  <label className="text-xs font-medium text-gray-700">Email</label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Semua email di bawah ini memakai peran dan wilayah yang sama.
                  </p>
                  <div className="mt-1.5 space-y-2">
                    {manualEmails.map((email, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => ubahEmailManual(i, e.target.value)}
                          placeholder="nama@instansi.go.id"
                          className="flex-1 h-10 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                        {manualEmails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => hapusBarisEmail(i)}
                            className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                            aria-label={`Hapus email baris ${i + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={tambahBarisEmail}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg px-3 py-2 transition w-full justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Email
                  </button>
                </div>
              )}

              {manualError && <p className="text-xs text-red-600">{manualError}</p>}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={tutupManual}
                  className="px-3 h-9 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={tambahManual}
                  className="px-3 h-9 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition"
                >
                  Tambahkan{jumlahEmailTerisi > 1 ? ` ${jumlahEmailTerisi} Email` : ""}
                </button>
              </div>
            </div>
          </section>
        )}

        <SectionCard title={`Pengguna Dipilih (${terpilih.length})`}>
          {terpilih.length > 0 ? (
            <div className="border border-gray-200 rounded-lg">
              {terpilih.map((t) => (
                <div
                  key={t.email}
                  className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 last:border-b-0"
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
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10 px-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 mt-3">Belum ada pengguna dipilih</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Pengguna yang dipilih dari pencarian atau input manual akan tampil di sini sebelum
                akses diberikan.
              </p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Aksi utama dipatok di bawah layar agar selalu terjangkau, baik saat
          halamannya pendek maupun panjang. */}
      <div className="fixed bottom-0 inset-x-0 z-10 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-end gap-2">
          <button
            onClick={() => router.push(URL_KEMBALI)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={simpan}
            disabled={terpilih.length === 0}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Beri Akses{terpilih.length > 0 ? ` (${terpilih.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  )
}
