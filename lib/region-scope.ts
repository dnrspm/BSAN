import { readAuthSession } from "@/lib/auth-session"
import { KAB_KOTA_BY_PROVINSI } from "@/data/kabKotaData"

export interface WilayahScope {
  /** Provinsi yang menjadi kewenangan (null untuk pusat/global). */
  provinsi: string | null
  /** Daftar kabupaten/kota di bawah provinsi kewenangan (kosong untuk pusat). */
  kabKotaList: string[]
}

/**
 * Wilayah kewenangan sesi saat ini. Untuk Admin Pusat mengembalikan scope
 * nasional (provinsi null). Untuk BPMP mengembalikan provinsi yang menjadi
 * wewenangnya dan daftar kabupaten/kota di bawahnya.
 */
export function getWilayahScope(): WilayahScope {
  const auth = readAuthSession()
  if (!auth) return { provinsi: null, kabKotaList: [] }
  if (auth.role === "pusat") return { provinsi: null, kabKotaList: [] }
  if (auth.role === "bpmp") {
    const provinsi = auth.provinsiBPMP ?? ""
    return { provinsi, kabKotaList: KAB_KOTA_BY_PROVINSI[provinsi] ?? [] }
  }
  return { provinsi: null, kabKotaList: [] }
}

/** Daftar kabupaten/kota di bawah satu provinsi (fallback kosong). */
export function kabKotaDiBawah(provinsi: string): string[] {
  return KAB_KOTA_BY_PROVINSI[provinsi] ?? []
}
