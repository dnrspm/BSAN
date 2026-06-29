// ---------------------------------------------------------------------------
// Shared POKJA types — used by FormPokja, DashboardView, DataPokjaView
// ---------------------------------------------------------------------------

export interface MemberField {
  nama: string
  email: string
  jenisKelamin: "Laki-Laki" | "Perempuan" | ""
  noWhatsapp: string
  instansi: string
  jabatan: string
}

export const PIMPINAN_ROLES = [
  { key: "ketua", label: "Ketua Kelompok Kerja" },
  { key: "wakil", label: "Wakil Ketua Kelompok Kerja" },
  { key: "koordinator", label: "Koordinator" },
] as const

export const BIDANG_ROLES = [
  { key: "pendidikan", label: "Bidang Pendidikan" },
  { key: "pppa", label: "Bidang PPPA" },
  { key: "sosial", label: "Bidang Sosial" },
  { key: "kesehatan", label: "Bidang Kesehatan" },
  { key: "kominfo", label: "Bidang Kominfo" },
  { key: "dukbangga", label: "Bidang Dukbangga" },
] as const

export const ALL_ROLES = [...PIMPINAN_ROLES, ...BIDANG_ROLES] as const

export type PimpinanKey = (typeof PIMPINAN_ROLES)[number]["key"]
export type BidangKey = (typeof BIDANG_ROLES)[number]["key"]
export type RoleKey = PimpinanKey | BidangKey

export type Members = Record<RoleKey, MemberField>

export interface SkDokumen {
  file: File | null
  nomorSK: string
  tanggalSK: string
  periodeMultai: string
  periodeSelesai: string
}

/** Full payload collected by the 4-step form */
export interface PokjaData {
  region: string
  nomorKanal: string
  members: Members
  sk: SkDokumen
  consent: boolean
}

export type PokjaStatus =
  | "draf"
  | "belum-dibentuk"
  | "masih-diverifikasi"
  | "aktif"
  | "butuh-perbaikan"

export interface ValidasiLog {
  tanggal: string
  aksi: "pengajuan" | "terima" | "tolak" | "perbaiki" | "aktivasi" | "sk_expired"
  aktor: "user" | "admin_pusat" | "sistem"
  alasan?: string
}

/** One POKJA entry stored in the dinas state */
export interface PokjaItem {
  id: string
  nama: string
  status: PokjaStatus
  data: PokjaData
  tanggalDiverifikasi?: string
  alasanPenolakan?: string
  validasiLog: ValidasiLog[]
}

export const emptyMember = (): MemberField => ({
  nama: "",
  email: "",
  jenisKelamin: "",
  noWhatsapp: "",
  instansi: "",
  jabatan: "",
})

export function getRoleLabel(key: RoleKey): string {
  return ALL_ROLES.find((r) => r.key === key)?.label ?? key
}

// ---------------------------------------------------------------------------
// Draft types for "Save as Draft" feature
// ---------------------------------------------------------------------------

export type AnggotaItem = {
  nama: string
  email: string
  jenisKelamin: string
  bidang: string
  noWhatsapp: string
  instansi: string
  jabatan: string
}

export const emptyAnggota = (): AnggotaItem => ({
  nama: "",
  email: "",
  jenisKelamin: "",
  bidang: "",
  noWhatsapp: "",
  instansi: "",
  jabatan: "",
})

export interface PokjaDraft {
  id: string
  region: string
  createdAt: string
  updatedAt: string
  kanalPengaduan: string
  members: Members
  anggotaList: AnggotaItem[]
  sk: {
    fileName: string
    nomorSK: string
    tanggalSK: string
    periodeMulai: string
    periodeSelesai: string
  }
}
