/**
 * Hak akses pengguna untuk aksi buat/ubah/hapus, dirinci per modul
 * (Sumber Dukungan dan Kasus Pelanggaran). Dikelola Admin Pusat,
 * disimpan di localStorage.
 */

import { readAuthSession } from "@/lib/auth-session"

export type AksesModul = "sumberDukungan" | "pelanggaran"
export type AksesAksi = "buat" | "edit" | "hapus"

/** "nasional" hanya dipakai peran Admin Pusat yang cakupannya seluruh Indonesia. */
export type TingkatWilayah = "nasional" | "provinsi" | "kabkota"

/** Peran yang boleh diberi akses lewat halaman Akses Pengguna. */
export type PeranPengguna = "adminPusat" | "bpmp" | "dinas"

export type AksesPengguna = Record<AksesModul, Record<AksesAksi, boolean>>

export interface PenggunaAkses {
  id: string
  email: string
  /** Peran akun; menentukan tingkat wilayah kewenangan yang mungkin. */
  peran: PeranPengguna
  instansi: string
  /** Cakupan penugasan: nasional, tingkat provinsi, atau tingkat kabupaten/kota. */
  tingkatWilayah: TingkatWilayah
  provinsi: string
  /** Hanya dipakai bila tingkatWilayah === "kabkota". */
  kabKota: string
  status: "aktif" | "nonaktif"
  akses: AksesPengguna
  /** ISO datetime terakhir data diubah dari halaman Admin Pusat. */
  diperbaruiPada: string
  /** Email akun yang melakukan perubahan terakhir. */
  diperbaruiOleh: string
}

export const PERAN_LABEL: Record<PeranPengguna, string> = {
  adminPusat: "Admin Pusat",
  bpmp: "BPMP",
  dinas: "Admin Dinas Pendidikan",
}

/** Versi pendek untuk badge tabel dan tombol pilihan yang ruangnya sempit. */
export const PERAN_LABEL_SINGKAT: Record<PeranPengguna, string> = {
  adminPusat: "Admin Pusat",
  bpmp: "BPMP",
  dinas: "Dinas",
}

export const PERAN_LIST: PeranPengguna[] = ["adminPusat", "bpmp", "dinas"]

/**
 * Tingkat wilayah kewenangan yang boleh dipilih per peran saat input manual:
 * Admin Pusat tidak memilih apa pun (nasional), BPMP hanya provinsi, Dinas
 * boleh provinsi atau kabupaten/kota.
 */
export const TINGKAT_PER_PERAN: Record<PeranPengguna, TingkatWilayah[]> = {
  adminPusat: ["nasional"],
  bpmp: ["provinsi"],
  dinas: ["provinsi", "kabkota"],
}

export const TINGKAT_LABEL: Record<TingkatWilayah, string> = {
  nasional: "Nasional",
  provinsi: "Provinsi",
  kabkota: "Kab/Kota",
}

const INSTANSI_PUSAT = "Puspeka Kemendikdasmen"

/** Nama instansi bawaan untuk pengguna yang diinput manual, mengikuti perannya. */
export function instansiPeran(
  peran: PeranPengguna,
  tingkat: TingkatWilayah,
  provinsi: string,
  kabKota: string
): string {
  if (peran === "adminPusat") return INSTANSI_PUSAT
  if (peran === "bpmp") return `BPMP Provinsi ${provinsi}`
  return tingkat === "kabkota"
    ? `Dinas Pendidikan Kab/Kota ${kabKota}`
    : `Dinas Pendidikan Provinsi ${provinsi}`
}

export const MODUL_LABEL: Record<AksesModul, string> = {
  sumberDukungan: "Sumber Dukungan",
  pelanggaran: "Kasus Pelanggaran",
}

export const AKSI_LABEL: Record<AksesAksi, string> = {
  buat: "Buat",
  edit: "Ubah",
  hapus: "Hapus",
}

export const MODUL_LIST: AksesModul[] = ["sumberDukungan", "pelanggaran"]
export const AKSI_LIST: AksesAksi[] = ["buat", "edit", "hapus"]

export const STORAGE_KEY = "penggunaAkses"
/** Dinaikkan tiap struktur data berubah; data tersimpan versi lama dibuang. */
export const STORAGE_VERSI = 11

/** Semua hak (buat, ubah, hapus) di kedua modul — akses penuh. */
export function aksesPenuh(): AksesPengguna {
  return {
    sumberDukungan: { buat: true, edit: true, hapus: true },
    pelanggaran: { buat: true, edit: true, hapus: true },
  }
}

export function emptyAkses(): AksesPengguna {
  return {
    sumberDukungan: { buat: false, edit: false, hapus: false },
    pelanggaran: { buat: false, edit: false, hapus: false },
  }
}

export const DEFAULT_PENGGUNA: PenggunaAkses[] = [
  // Admin pusat — cakupan nasional
  {
    id: "p1", email: "rani@puspeka.kemdikbud.go.id",
    peran: "adminPusat",
    instansi: INSTANSI_PUSAT,
    tingkatWilayah: "nasional", provinsi: "", kabKota: "",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-01-05T08:00:00", diperbaruiOleh: "rani@puspeka.kemdikbud.go.id",
  },
  {
    id: "p2", email: "dimas@puspeka.kemdikbud.go.id",
    peran: "adminPusat",
    instansi: INSTANSI_PUSAT,
    tingkatWilayah: "nasional", provinsi: "", kabKota: "",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-01-05T08:10:00", diperbaruiOleh: "rani@puspeka.kemdikbud.go.id",
  },
  {
    id: "p3", email: "wahyu@puspeka.kemdikbud.go.id",
    peran: "adminPusat",
    instansi: INSTANSI_PUSAT,
    tingkatWilayah: "nasional", provinsi: "", kabKota: "",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-02-11T10:25:00", diperbaruiOleh: "dimas@puspeka.kemdikbud.go.id",
  },

  // BPMP — tingkat provinsi
  {
    id: "b1", email: "nadia@bpmpjabar.kemdikbud.go.id",
    peran: "bpmp",
    instansi: "BPMP Provinsi Jawa Barat",
    tingkatWilayah: "provinsi", provinsi: "Jawa Barat", kabKota: "",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-01-28T13:05:00", diperbaruiOleh: "rani@puspeka.kemdikbud.go.id",
  },
  {
    id: "b2", email: "bagus@bpmpjateng.kemdikbud.go.id",
    peran: "bpmp",
    instansi: "BPMP Provinsi Jawa Tengah",
    tingkatWilayah: "provinsi", provinsi: "Jawa Tengah", kabKota: "",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-02-06T09:45:00", diperbaruiOleh: "dimas@puspeka.kemdikbud.go.id",
  },
  {
    id: "b3", email: "ratna@bpmpjatim.kemdikbud.go.id",
    peran: "bpmp",
    instansi: "BPMP Provinsi Jawa Timur",
    tingkatWilayah: "provinsi", provinsi: "Jawa Timur", kabKota: "",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-02-19T15:20:00", diperbaruiOleh: "rani@puspeka.kemdikbud.go.id",
  },
  {
    id: "b4", email: "fitri@bpmpaceh.kemdikbud.go.id",
    peran: "bpmp",
    instansi: "BPMP Provinsi Aceh",
    tingkatWilayah: "provinsi", provinsi: "Aceh", kabKota: "",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-03-05T11:00:00", diperbaruiOleh: "dimas@puspeka.kemdikbud.go.id",
  },

  // Admin dinas pendidikan
  {
    id: "u1", email: "lestari@jakarta.go.id",
    peran: "dinas",
    instansi: "Dinas Pendidikan Provinsi DKI Jakarta",
    tingkatWilayah: "provinsi", provinsi: "DKI Jakarta", kabKota: "",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-01-12T09:15:00", diperbaruiOleh: "rani@puspeka.kemdikbud.go.id",
  },
  {
    id: "u2", email: "rahmat@jatengprov.go.id",
    peran: "dinas",
    instansi: "Dinas Pendidikan Provinsi Jawa Tengah",
    tingkatWilayah: "provinsi", provinsi: "Jawa Tengah", kabKota: "",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-01-20T14:40:00", diperbaruiOleh: "rani@puspeka.kemdikbud.go.id",
  },
  {
    id: "u3", email: "siti@acehprov.go.id",
    peran: "dinas",
    instansi: "Dinas Pendidikan Provinsi Aceh",
    tingkatWilayah: "provinsi", provinsi: "Aceh", kabKota: "",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-02-02T10:05:00", diperbaruiOleh: "rani@puspeka.kemdikbud.go.id",
  },
  {
    id: "u4", email: "budi@jatimprov.go.id",
    peran: "dinas",
    instansi: "Dinas Pendidikan Kota Surabaya",
    tingkatWilayah: "kabkota", provinsi: "Jawa Timur", kabKota: "Surabaya",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-02-10T16:22:00", diperbaruiOleh: "dimas@puspeka.kemdikbud.go.id",
  },
  {
    id: "u5", email: "teuku@bandaacehkota.go.id",
    peran: "dinas",
    instansi: "Dinas Pendidikan Kota Banda Aceh",
    tingkatWilayah: "kabkota", provinsi: "Aceh", kabKota: "Banda Aceh",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-02-18T08:30:00", diperbaruiOleh: "rani@puspeka.kemdikbud.go.id",
  },
  {
    id: "u6", email: "ahmad@jabarprov.go.id",
    peran: "dinas",
    instansi: "Dinas Pendidikan Provinsi Jawa Barat",
    tingkatWilayah: "provinsi", provinsi: "Jawa Barat", kabKota: "",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-02-24T11:45:00", diperbaruiOleh: "dimas@puspeka.kemdikbud.go.id",
  },
  {
    id: "u7", email: "devi@semarangkota.go.id",
    peran: "dinas",
    instansi: "Dinas Pendidikan Kota Semarang",
    tingkatWilayah: "kabkota", provinsi: "Jawa Tengah", kabKota: "Semarang",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-03-03T13:10:00", diperbaruiOleh: "rani@puspeka.kemdikbud.go.id",
  },
  {
    id: "u8", email: "hadi@makassarkota.go.id",
    peran: "dinas",
    instansi: "Dinas Pendidikan Kota Makassar",
    tingkatWilayah: "kabkota", provinsi: "Sulawesi Selatan", kabKota: "Makassar",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-03-09T09:05:00", diperbaruiOleh: "dimas@puspeka.kemdikbud.go.id",
  },
  {
    id: "u9", email: "ketut@denpasarkota.go.id",
    peran: "dinas",
    instansi: "Dinas Pendidikan Kota Denpasar",
    tingkatWilayah: "kabkota", provinsi: "Bali", kabKota: "Denpasar",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-03-15T15:30:00", diperbaruiOleh: "rani@puspeka.kemdikbud.go.id",
  },
  {
    id: "u10", email: "sinta@medankota.go.id",
    peran: "dinas",
    instansi: "Dinas Pendidikan Kota Medan",
    tingkatWilayah: "kabkota", provinsi: "Sumatera Utara", kabKota: "Medan",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-03-22T09:40:00", diperbaruiOleh: "rani@puspeka.kemdikbud.go.id",
  },
  {
    id: "u11", email: "agus@bandungkota.go.id",
    peran: "dinas",
    instansi: "Dinas Pendidikan Kota Bandung",
    tingkatWilayah: "kabkota", provinsi: "Jawa Barat", kabKota: "Bandung",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-03-28T14:15:00", diperbaruiOleh: "dimas@puspeka.kemdikbud.go.id",
  },
  {
    id: "u12", email: "indah@jatimprov.go.id",
    peran: "dinas",
    instansi: "Dinas Pendidikan Provinsi Jawa Timur",
    tingkatWilayah: "provinsi", provinsi: "Jawa Timur", kabKota: "",
    status: "aktif", akses: aksesPenuh(),
    diperbaruiPada: "2026-04-02T11:20:00", diperbaruiOleh: "rani@puspeka.kemdikbud.go.id",
  },
]

/**
 * Direktori akun dinas. Dipakai sebagai sumber saran saat Admin Pusat
 * mencari email di modal Beri Akses — instansi dan wilayahnya ikut
 * terbawa dari direktori.
 */
export interface KandidatPengguna {
  email: string
  instansi: string
  /** Jabatan akun, mis. "Admin Dinas Pendidikan" atau "Kepala Sekolah". */
  jabatan: string
  /** Peran yang akan diberikan; null bila akun tidak boleh diberi akses. */
  peran: PeranPengguna | null
  tingkatWilayah: TingkatWilayah
  provinsi: string
  kabKota: string
}

/**
 * Label jabatan lengkap dengan instansinya, mis.
 * "Admin Dinas Pendidikan Kota Makassar" atau "Kepala Sekolah SMAN 5 Surabaya".
 */
export function labelJabatan(k: {
  instansi: string
  jabatan?: string
  peran?: PeranPengguna | null
}): string {
  if (k.peran === "dinas") return `Admin ${k.instansi}`
  if (k.peran === "adminPusat" || k.peran === "bpmp") {
    const label = PERAN_LABEL[k.peran]
    // Instansi BPMP sudah memuat kata "BPMP", jadi tidak perlu diawali lagi.
    if (k.instansi.toLowerCase().includes(label.toLowerCase())) return k.instansi
    return `${label} ${k.instansi}`
  }
  const jabatan = (k.jabatan ?? "").trim()
  // Hindari pengulangan bila jabatan sudah menyebut instansinya.
  if (!jabatan) return k.instansi
  if (jabatan.toLowerCase().includes(k.instansi.toLowerCase())) return jabatan
  return `${jabatan} ${k.instansi}`
}

/** Kandidat admin dinas — boleh dipilih. */
const K = (email: string, instansi: string, provinsi: string, kabKota = ""): KandidatPengguna => ({
  email, instansi, jabatan: PERAN_LABEL.dinas, peran: "dinas",
  tingkatWilayah: kabKota ? "kabkota" : "provinsi",
  provinsi, kabKota,
})

/** Kandidat admin pusat — cakupannya nasional, tidak terikat wilayah. */
const KP = (email: string): KandidatPengguna => ({
  email, instansi: INSTANSI_PUSAT, jabatan: PERAN_LABEL.adminPusat, peran: "adminPusat",
  tingkatWilayah: "nasional", provinsi: "", kabKota: "",
})

/** Kandidat BPMP — selalu di tingkat provinsi. */
const KB = (email: string, provinsi: string): KandidatPengguna => ({
  email, instansi: `BPMP Provinsi ${provinsi}`, jabatan: PERAN_LABEL.bpmp, peran: "bpmp",
  tingkatWilayah: "provinsi", provinsi, kabKota: "",
})

/** Akun tanpa peran — muncul di pencarian tetapi tidak bisa dipilih. */
const KL = (
  email: string,
  instansi: string,
  jabatan: string,
  provinsi: string,
  kabKota = ""
): KandidatPengguna => ({
  email, instansi, jabatan, peran: null,
  tingkatWilayah: kabKota ? "kabkota" : "provinsi",
  provinsi, kabKota,
})

export const KANDIDAT_PENGGUNA: KandidatPengguna[] = [
  // Admin pusat — tanpa wilayah kewenangan
  KP("rani@puspeka.kemdikbud.go.id"),
  KP("dimas@puspeka.kemdikbud.go.id"),
  KP("wahyu@puspeka.kemdikbud.go.id"),

  // BPMP — tingkat provinsi
  KB("nadia@bpmpjabar.kemdikbud.go.id", "Jawa Barat"),
  KB("bagus@bpmpjateng.kemdikbud.go.id", "Jawa Tengah"),
  KB("ratna@bpmpjatim.kemdikbud.go.id", "Jawa Timur"),
  KB("fitri@bpmpaceh.kemdikbud.go.id", "Aceh"),
  KB("surya@bpmpsulsel.kemdikbud.go.id", "Sulawesi Selatan"),
  KB("wulan@bpmpbali.kemdikbud.go.id", "Bali"),

  // Dinas — tingkat provinsi
  K("lestari@jakarta.go.id", "Dinas Pendidikan Provinsi DKI Jakarta", "DKI Jakarta"),
  K("hendra@jakarta.go.id", "Dinas Pendidikan Provinsi DKI Jakarta", "DKI Jakarta"),
  K("siti@acehprov.go.id", "Dinas Pendidikan Provinsi Aceh", "Aceh"),
  K("maulana@acehprov.go.id", "Dinas Pendidikan Provinsi Aceh", "Aceh"),
  K("ahmad@jabarprov.go.id", "Dinas Pendidikan Provinsi Jawa Barat", "Jawa Barat"),
  K("yuni@jabarprov.go.id", "Dinas Pendidikan Provinsi Jawa Barat", "Jawa Barat"),
  K("rahmat@jatengprov.go.id", "Dinas Pendidikan Provinsi Jawa Tengah", "Jawa Tengah"),
  K("indah@jatimprov.go.id", "Dinas Pendidikan Provinsi Jawa Timur", "Jawa Timur"),
  K("firman@sumutprov.go.id", "Dinas Pendidikan Provinsi Sumatera Utara", "Sumatera Utara"),
  K("gede@baliprov.go.id", "Dinas Pendidikan Provinsi Bali", "Bali"),
  K("asri@sulselprov.go.id", "Dinas Pendidikan Provinsi Sulawesi Selatan", "Sulawesi Selatan"),

  // Dinas — tingkat kabupaten/kota
  K("budi@jatimprov.go.id", "Dinas Pendidikan Kota Surabaya", "Jawa Timur", "Surabaya"),
  K("laras@surabaya.go.id", "Dinas Pendidikan Kota Surabaya", "Jawa Timur", "Surabaya"),
  K("devi@semarangkota.go.id", "Dinas Pendidikan Kota Semarang", "Jawa Tengah", "Semarang"),
  K("prasetyo@semarangkota.go.id", "Dinas Pendidikan Kota Semarang", "Jawa Tengah", "Semarang"),
  K("hadi@makassarkota.go.id", "Dinas Pendidikan Kota Makassar", "Sulawesi Selatan", "Makassar"),
  K("nurul@makassarkota.go.id", "Dinas Pendidikan Kota Makassar", "Sulawesi Selatan", "Makassar"),
  K("teuku@bandaacehkota.go.id", "Dinas Pendidikan Kota Banda Aceh", "Aceh", "Banda Aceh"),
  K("cut@bandaacehkota.go.id", "Dinas Pendidikan Kota Banda Aceh", "Aceh", "Banda Aceh"),
  K("ketut@denpasarkota.go.id", "Dinas Pendidikan Kota Denpasar", "Bali", "Denpasar"),
  K("wayan@denpasarkota.go.id", "Dinas Pendidikan Kota Denpasar", "Bali", "Denpasar"),
  K("sinta@medankota.go.id", "Dinas Pendidikan Kota Medan", "Sumatera Utara", "Medan"),
  K("rudi@medankota.go.id", "Dinas Pendidikan Kota Medan", "Sumatera Utara", "Medan"),
  K("agus@bandungkota.go.id", "Dinas Pendidikan Kota Bandung", "Jawa Barat", "Bandung"),
  K("mira@bandungkota.go.id", "Dinas Pendidikan Kota Bandung", "Jawa Barat", "Bandung"),

  // Akun non-dinas: ikut muncul saat dicari, tetapi tidak bisa diberi akses
  KL("kepsek@sman5surabaya.sch.id", "SMAN 5 Surabaya", "Kepala Sekolah", "Jawa Timur", "Surabaya"),
  KL("operator@sman5surabaya.sch.id", "SMAN 5 Surabaya", "Operator Sekolah", "Jawa Timur", "Surabaya"),
  KL("kepsek@sman1semarang.sch.id", "SMAN 1 Semarang", "Kepala Sekolah", "Jawa Tengah", "Semarang"),
  KL("guru.bk@sman1semarang.sch.id", "SMAN 1 Semarang", "Guru BK", "Jawa Tengah", "Semarang"),
  KL("kepsek@sman1bandaaceh.sch.id", "SMAN 1 Banda Aceh", "Kepala Sekolah", "Aceh", "Banda Aceh"),
  KL("kepsek@sman3denpasar.sch.id", "SMAN 3 Denpasar", "Kepala Sekolah", "Bali", "Denpasar"),
  KL("kepsek@sman2makassar.sch.id", "SMAN 2 Makassar", "Kepala Sekolah", "Sulawesi Selatan", "Makassar"),
  KL("humas@disdikjabar.go.id", "Dinas Pendidikan Provinsi Jawa Barat", "Staf Humas", "Jawa Barat"),
]

/**
 * Cari kandidat lewat kata kunci (email, instansi, atau wilayah) untuk
 * dropdown saran di modal Beri Akses. Email pada `kecuali` disembunyikan
 * karena sudah punya akses atau sudah dipilih.
 */
export function cariKandidatEmail(
  query: string,
  kecuali: string[] = [],
  batas = 6
): KandidatPengguna[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const tersembunyi = new Set(kecuali.map((e) => e.trim().toLowerCase()))
  return KANDIDAT_PENGGUNA.filter((k) => {
    if (tersembunyi.has(k.email.toLowerCase())) return false
    return (
      k.email.toLowerCase().includes(q) ||
      k.instansi.toLowerCase().includes(q) ||
      k.provinsi.toLowerCase().includes(q) ||
      k.kabKota.toLowerCase().includes(q)
    )
  })
    .sort((a, b) => {
      // Akun berperan (yang bisa dipilih) di atas, lalu yang emailnya
      // diawali kata kunci.
      const aBisa = a.peran !== null
      const bBisa = b.peran !== null
      if (aBisa !== bBisa) return aBisa ? -1 : 1
      const aAwal = a.email.toLowerCase().startsWith(q) ? 0 : 1
      const bAwal = b.email.toLowerCase().startsWith(q) ? 0 : 1
      return aAwal - bAwal || a.email.localeCompare(b.email, "id")
    })
    .slice(0, batas)
}

function normalizeAkses(raw: unknown): AksesPengguna {
  const base = emptyAkses()
  if (!raw || typeof raw !== "object") return base
  const src = raw as Record<string, Record<string, unknown> | undefined>
  for (const modul of MODUL_LIST) {
    for (const aksi of AKSI_LIST) base[modul][aksi] = src[modul]?.[aksi] === true
  }
  return base
}

function normalizePengguna(raw: unknown): PenggunaAkses | null {
  if (!raw || typeof raw !== "object") return null
  const p = raw as Record<string, unknown>
  if (typeof p.id !== "string" || typeof p.email !== "string") return null
  const peran: PeranPengguna =
    p.peran === "adminPusat" || p.peran === "bpmp" ? p.peran : "dinas"
  const tingkatWilayah: TingkatWilayah =
    peran === "adminPusat"
      ? "nasional"
      : peran === "bpmp"
        ? "provinsi"
        : p.tingkatWilayah === "kabkota"
          ? "kabkota"
          : "provinsi"
  return {
    id: p.id,
    email: p.email,
    peran,
    instansi: typeof p.instansi === "string" ? p.instansi : "",
    tingkatWilayah,
    provinsi: tingkatWilayah !== "nasional" && typeof p.provinsi === "string" ? p.provinsi : "",
    kabKota: tingkatWilayah === "kabkota" && typeof p.kabKota === "string" ? p.kabKota : "",
    status: p.status === "nonaktif" ? "nonaktif" : "aktif",
    akses: normalizeAkses(p.akses),
    diperbaruiPada: typeof p.diperbaruiPada === "string" ? p.diperbaruiPada : "",
    diperbaruiOleh: typeof p.diperbaruiOleh === "string" ? p.diperbaruiOleh : "",
  }
}

export function readPenggunaAkses(): PenggunaAkses[] {
  if (typeof window === "undefined") return DEFAULT_PENGGUNA
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PENGGUNA
    const parsed = JSON.parse(raw) as unknown
    // Data versi lama (array polos / versi berbeda) dibuang agar kolom baru
    // tidak tampil kosong; pakai data awal.
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return DEFAULT_PENGGUNA
    const wrapper = parsed as { versi?: unknown; data?: unknown }
    if (wrapper.versi !== STORAGE_VERSI || !Array.isArray(wrapper.data)) return DEFAULT_PENGGUNA
    const list = wrapper.data.map(normalizePengguna).filter((p): p is PenggunaAkses => p !== null)
    return list.length > 0 ? list : DEFAULT_PENGGUNA
  } catch {
    return DEFAULT_PENGGUNA
  }
}

export function savePenggunaAkses(list: PenggunaAkses[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ versi: STORAGE_VERSI, data: list }))
  } catch {
    /* kuota penuh / storage tidak tersedia — abaikan */
  }
}

/**
 * Pesan sukses yang dititipkan satu halaman untuk ditampilkan halaman berikutnya
 * (mis. Beri Akses → tabel Akses Pengguna). Sekali baca, langsung dihapus.
 */
const NOTIF_KEY = "penggunaAksesNotif"

export function simpanNotifAkses(pesan: string): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(NOTIF_KEY, pesan)
  } catch {
    /* storage tidak tersedia — abaikan */
  }
}

export function ambilNotifAkses(): string {
  if (typeof window === "undefined") return ""
  try {
    const pesan = sessionStorage.getItem(NOTIF_KEY) ?? ""
    if (pesan) sessionStorage.removeItem(NOTIF_KEY)
    return pesan
  } catch {
    return ""
  }
}

/** Nama wilayah penugasan tanpa tingkatnya, mis. "Surabaya" atau "Aceh". */
export function namaWilayahPenugasan(p: PenggunaAkses): string {
  if (p.tingkatWilayah === "nasional") return "Seluruh Indonesia"
  return (p.tingkatWilayah === "kabkota" ? p.kabKota : p.provinsi) || "-"
}

/** Email pelaku perubahan untuk log; fallback bila sesi belum menyimpan email. */
export function getAktorSaatIni(): string {
  const auth = readAuthSession()
  const username = auth?.username?.trim()
  if (username?.includes("@")) return username
  return "admin.pusat@puspeka.kemdikbud.go.id"
}

/** Jumlah aksi yang diizinkan untuk satu pengguna (0–6). */
export function totalAksesAktif(p: PenggunaAkses): number {
  return MODUL_LIST.reduce(
    (n, modul) => n + AKSI_LIST.filter((aksi) => p.akses[modul][aksi]).length,
    0
  )
}

/**
 * Cek apakah pengguna (dicocokkan lewat email) boleh melakukan aksi
 * tertentu pada satu modul. Pengguna nonaktif selalu ditolak.
 */
export function bolehAksi(
  email: string | undefined,
  modul: AksesModul,
  aksi: AksesAksi,
  list: PenggunaAkses[] = readPenggunaAkses()
): boolean {
  if (!email) return false
  const key = email.trim().toLowerCase()
  const user = list.find((p) => p.email.trim().toLowerCase() === key)
  if (!user || user.status !== "aktif") return false
  return user.akses[modul][aksi]
}
