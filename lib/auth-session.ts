export type AuthRole = "dinas" | "pusat" | "sekolah" | "bpmp"

/** Nama instansi dinas untuk teks log, mis. "Dinas Pendidikan Provinsi Aceh". */
export const DEFAULT_DINAS_NAMA = "Dinas Pendidikan Provinsi Aceh"

export type AuthSession = {
  username?: string
  role: AuthRole
  wilayah?: string
  namaSekolah?: string
  /** Diset saat login admin dinas; dipakai di log sumber dukungan ("oleh Admin {namaDinas}"). */
  namaDinas?: string
  /** Diset saat login BPMP: nama BPMP, mis. "BPMP Provinsi Aceh". */
  namaBPMP?: string
  /** Diset saat login BPMP: provinsi yang menjadi wewenang BPMP. */
  provinsiBPMP?: string
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("auth")
    if (!raw) return null
    const p = JSON.parse(raw) as Record<string, unknown>
    const role = p.role as AuthRole | undefined
    if (role !== "dinas" && role !== "pusat" && role !== "sekolah" && role !== "bpmp") return null
    return {
      username: typeof p.username === "string" ? p.username : undefined,
      role,
      wilayah: typeof p.wilayah === "string" ? p.wilayah : undefined,
      namaSekolah: typeof p.namaSekolah === "string" ? p.namaSekolah : undefined,
      namaDinas: typeof p.namaDinas === "string" ? p.namaDinas : undefined,
      namaBPMP: typeof p.namaBPMP === "string" ? p.namaBPMP : undefined,
      provinsiBPMP: typeof p.provinsiBPMP === "string" ? p.provinsiBPMP : undefined,
    }
  } catch {
    return null
  }
}

/** Nama dinas untuk string log; fallback demo Aceh jika belum tersimpan di sesi. */
export function getDinasNamaForLogs(): string {
  const a = readAuthSession()
  if (a?.namaDinas?.trim()) return a.namaDinas.trim()
  return DEFAULT_DINAS_NAMA
}
