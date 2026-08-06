/**
 * Hak akses pengguna untuk aksi buat/ubah/hapus, dirinci per modul
 * (Sumber Dukungan dan Kasus Pelanggaran). Dikelola Admin Pusat,
 * disimpan di localStorage.
 */

import { readAuthSession } from "@/lib/auth-session"

export type AksesModul = "sumberDukungan" | "pelanggaran"
export type AksesAksi = "buat" | "edit" | "hapus"

export type PeranPengguna = "pusat" | "dinas" | "sekolah"

export type TingkatWilayah = "provinsi" | "kabkota"

export type AksesPengguna = Record<AksesModul, Record<AksesAksi, boolean>>

export interface PenggunaAkses {
  id: string
  email: string
  instansi: string
  peran: PeranPengguna
  /** Cakupan penugasan: tingkat provinsi atau tingkat kabupaten/kota. */
  tingkatWilayah: TingkatWilayah
  provinsi: string
  /** Hanya dipakai bila tingkatWilayah === "kabkota". */
  kabKota: string
  status: "aktif" | "nonaktif"
  akses: AksesPengguna
  /** ISO datetime terakhir data diubah dari halaman Admin Pusat. */
  diperbaruiPada: string
  /** Nama/akun yang melakukan perubahan terakhir. */
  diperbaruiOleh: string
}

export const PERAN_LABEL: Record<PeranPengguna, string> = {
  pusat: "Admin Pusat",
  dinas: "Admin Dinas",
  sekolah: "Admin Sekolah",
}

export const TINGKAT_LABEL: Record<TingkatWilayah, string> = {
  provinsi: "Provinsi",
  kabkota: "Kab/Kota",
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
export const STORAGE_VERSI = 5

export function emptyAkses(): AksesPengguna {
  return {
    sumberDukungan: { buat: false, edit: false, hapus: false },
    pelanggaran: { buat: false, edit: false, hapus: false },
  }
}

type AksiTriplet = [buat: boolean, edit: boolean, hapus: boolean]

function akses(sd: AksiTriplet, pl: AksiTriplet): AksesPengguna {
  return {
    sumberDukungan: { buat: sd[0], edit: sd[1], hapus: sd[2] },
    pelanggaran: { buat: pl[0], edit: pl[1], hapus: pl[2] },
  }
}

export const DEFAULT_PENGGUNA: PenggunaAkses[] = [
  {
    id: "u1", email: "rani@puspeka.kemdikbud.go.id",
    instansi: "Puspeka", peran: "pusat",
    tingkatWilayah: "provinsi", provinsi: "DKI Jakarta", kabKota: "",
    status: "aktif", akses: akses([true, true, true], [true, true, true]),
    diperbaruiPada: "2026-01-12T09:15:00", diperbaruiOleh: "Admin Pusat",
  },
  {
    id: "u2", email: "dimas@puspeka.kemdikbud.go.id",
    instansi: "Puspeka", peran: "pusat",
    tingkatWilayah: "provinsi", provinsi: "DKI Jakarta", kabKota: "",
    status: "aktif", akses: akses([true, true, false], [true, true, false]),
    diperbaruiPada: "2026-01-20T14:40:00", diperbaruiOleh: "Rani Puspitasari",
  },
  {
    id: "u3", email: "siti@acehprov.go.id",
    instansi: "Dinas Pendidikan Provinsi Aceh", peran: "dinas",
    tingkatWilayah: "provinsi", provinsi: "Aceh", kabKota: "",
    status: "aktif", akses: akses([true, true, true], [true, true, false]),
    diperbaruiPada: "2026-02-02T10:05:00", diperbaruiOleh: "Rani Puspitasari",
  },
  {
    id: "u4", email: "budi@jatimprov.go.id",
    instansi: "Dinas Pendidikan Kota Surabaya", peran: "dinas",
    tingkatWilayah: "kabkota", provinsi: "Jawa Timur", kabKota: "Surabaya",
    status: "aktif", akses: akses([true, false, false], [true, true, false]),
    diperbaruiPada: "2026-02-10T16:22:00", diperbaruiOleh: "Dimas Ardiansyah",
  },
  {
    id: "u5", email: "wati@sman1bandaaceh.sch.id",
    instansi: "SMAN 1 Banda Aceh", peran: "sekolah",
    tingkatWilayah: "kabkota", provinsi: "Aceh", kabKota: "Banda Aceh",
    status: "nonaktif", akses: emptyAkses(),
    diperbaruiPada: "2026-02-18T08:30:00", diperbaruiOleh: "Rani Puspitasari",
  },
  {
    id: "u6", email: "ahmad@jabarprov.go.id",
    instansi: "Dinas Pendidikan Provinsi Jawa Barat", peran: "dinas",
    tingkatWilayah: "provinsi", provinsi: "Jawa Barat", kabKota: "",
    status: "aktif", akses: akses([true, true, false], [false, false, false]),
    diperbaruiPada: "2026-02-24T11:45:00", diperbaruiOleh: "Dimas Ardiansyah",
  },
  {
    id: "u7", email: "devi@semarangkota.go.id",
    instansi: "Dinas Pendidikan Kota Semarang", peran: "dinas",
    tingkatWilayah: "kabkota", provinsi: "Jawa Tengah", kabKota: "Semarang",
    status: "aktif", akses: akses([true, false, false], [true, false, false]),
    diperbaruiPada: "2026-03-03T13:10:00", diperbaruiOleh: "Rani Puspitasari",
  },
  {
    id: "u8", email: "hadi@makassarkota.go.id",
    instansi: "Dinas Pendidikan Kota Makassar", peran: "dinas",
    tingkatWilayah: "kabkota", provinsi: "Sulawesi Selatan", kabKota: "Makassar",
    status: "aktif", akses: akses([true, true, true], [true, true, true]),
    diperbaruiPada: "2026-03-09T09:05:00", diperbaruiOleh: "Dimas Ardiansyah",
  },
  {
    id: "u9", email: "nugroho@sman3denpasar.sch.id",
    instansi: "SMAN 3 Denpasar", peran: "sekolah",
    tingkatWilayah: "kabkota", provinsi: "Bali", kabKota: "Denpasar",
    status: "aktif", akses: akses([false, false, false], [true, false, false]),
    diperbaruiPada: "2026-03-15T15:30:00", diperbaruiOleh: "Rani Puspitasari",
  },
]

/**
 * Direktori akun yang terdaftar di tiap wilayah. Dipakai saat menambah
 * pengguna: Admin Pusat memilih wilayah dahulu, lalu memilih email dari
 * daftar ini — instansi dan peran ikut terbawa dari direktori.
 */
export interface KandidatPengguna {
  email: string
  instansi: string
  peran: PeranPengguna
  tingkatWilayah: TingkatWilayah
  provinsi: string
  kabKota: string
}

const K = (
  email: string,
  instansi: string,
  peran: PeranPengguna,
  provinsi: string,
  kabKota = ""
): KandidatPengguna => ({
  email, instansi, peran,
  tingkatWilayah: kabKota ? "kabkota" : "provinsi",
  provinsi, kabKota,
})

export const KANDIDAT_PENGGUNA: KandidatPengguna[] = [
  // Tingkat provinsi
  K("rani@puspeka.kemdikbud.go.id", "Puspeka", "pusat", "DKI Jakarta"),
  K("dimas@puspeka.kemdikbud.go.id", "Puspeka", "pusat", "DKI Jakarta"),
  K("lestari@jakarta.go.id", "Dinas Pendidikan Provinsi DKI Jakarta", "dinas", "DKI Jakarta"),
  K("siti@acehprov.go.id", "Dinas Pendidikan Provinsi Aceh", "dinas", "Aceh"),
  K("maulana@acehprov.go.id", "Dinas Pendidikan Provinsi Aceh", "dinas", "Aceh"),
  K("ahmad@jabarprov.go.id", "Dinas Pendidikan Provinsi Jawa Barat", "dinas", "Jawa Barat"),
  K("yuni@jabarprov.go.id", "Dinas Pendidikan Provinsi Jawa Barat", "dinas", "Jawa Barat"),
  K("rahmat@jatengprov.go.id", "Dinas Pendidikan Provinsi Jawa Tengah", "dinas", "Jawa Tengah"),
  K("indah@jatimprov.go.id", "Dinas Pendidikan Provinsi Jawa Timur", "dinas", "Jawa Timur"),
  K("firman@sumutprov.go.id", "Dinas Pendidikan Provinsi Sumatera Utara", "dinas", "Sumatera Utara"),
  K("gede@baliprov.go.id", "Dinas Pendidikan Provinsi Bali", "dinas", "Bali"),
  K("asri@sulselprov.go.id", "Dinas Pendidikan Provinsi Sulawesi Selatan", "dinas", "Sulawesi Selatan"),

  // Tingkat kabupaten/kota
  K("budi@jatimprov.go.id", "Dinas Pendidikan Kota Surabaya", "dinas", "Jawa Timur", "Surabaya"),
  K("laras@surabaya.go.id", "Dinas Pendidikan Kota Surabaya", "dinas", "Jawa Timur", "Surabaya"),
  K("kepsek@sman5surabaya.sch.id", "SMAN 5 Surabaya", "sekolah", "Jawa Timur", "Surabaya"),
  K("devi@semarangkota.go.id", "Dinas Pendidikan Kota Semarang", "dinas", "Jawa Tengah", "Semarang"),
  K("kepsek@sman1semarang.sch.id", "SMAN 1 Semarang", "sekolah", "Jawa Tengah", "Semarang"),
  K("hadi@makassarkota.go.id", "Dinas Pendidikan Kota Makassar", "dinas", "Sulawesi Selatan", "Makassar"),
  K("kepsek@sman2makassar.sch.id", "SMAN 2 Makassar", "sekolah", "Sulawesi Selatan", "Makassar"),
  K("wati@sman1bandaaceh.sch.id", "SMAN 1 Banda Aceh", "sekolah", "Aceh", "Banda Aceh"),
  K("teuku@bandaacehkota.go.id", "Dinas Pendidikan Kota Banda Aceh", "dinas", "Aceh", "Banda Aceh"),
  K("nugroho@sman3denpasar.sch.id", "SMAN 3 Denpasar", "sekolah", "Bali", "Denpasar"),
  K("ketut@denpasarkota.go.id", "Dinas Pendidikan Kota Denpasar", "dinas", "Bali", "Denpasar"),
  K("sinta@medankota.go.id", "Dinas Pendidikan Kota Medan", "dinas", "Sumatera Utara", "Medan"),
  K("kepsek@sman4medan.sch.id", "SMAN 4 Medan", "sekolah", "Sumatera Utara", "Medan"),
  K("agus@bandungkota.go.id", "Dinas Pendidikan Kota Bandung", "dinas", "Jawa Barat", "Bandung"),
  K("kepsek@sman8bandung.sch.id", "SMAN 8 Bandung", "sekolah", "Jawa Barat", "Bandung"),
]

/** Kandidat pada satu wilayah, terurut menurut email. */
export function cariKandidat(
  tingkatWilayah: TingkatWilayah,
  provinsi: string,
  kabKota: string
): KandidatPengguna[] {
  if (!provinsi) return []
  if (tingkatWilayah === "kabkota" && !kabKota) return []
  return KANDIDAT_PENGGUNA.filter(
    (k) =>
      k.tingkatWilayah === tingkatWilayah &&
      k.provinsi === provinsi &&
      (tingkatWilayah === "provinsi" || k.kabKota === kabKota)
  ).sort((a, b) => a.email.localeCompare(b.email, "id"))
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
  const peran = p.peran === "pusat" || p.peran === "dinas" || p.peran === "sekolah" ? p.peran : "dinas"
  const tingkatWilayah = p.tingkatWilayah === "kabkota" ? "kabkota" : "provinsi"
  return {
    id: p.id,
    email: p.email,
    instansi: typeof p.instansi === "string" ? p.instansi : "",
    peran,
    tingkatWilayah,
    provinsi: typeof p.provinsi === "string" ? p.provinsi : "",
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

/** Nama wilayah penugasan tanpa tingkatnya, mis. "Surabaya" atau "Aceh". */
export function namaWilayahPenugasan(p: PenggunaAkses): string {
  return (p.tingkatWilayah === "kabkota" ? p.kabKota : p.provinsi) || "-"
}

/** Nama pelaku perubahan untuk log; fallback bila sesi tidak punya nama. */
export function getAktorSaatIni(): string {
  const auth = readAuthSession()
  return auth?.username?.trim() || "Admin Pusat"
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
