import { readAuthSession } from "@/lib/auth-session"

// Cadangan demo bila sesi belum menyimpan wilayah.
export const WILAYAH_DEMO = { provinsi: "Aceh", kabKota: "Banda Aceh" }

export interface WilayahDinas {
  provinsi: string
  /** Kosong berarti dinas provinsi (seluruh provinsi). */
  kabKota?: string
}

/** Wilayah dinas dari sesi, berformat "Provinsi - Kab/Kota". Tanpa kab/kota berarti seluruh provinsi. */
export function bacaWilayahDinas(): WilayahDinas {
  const [provinsi, kabKota] = (readAuthSession()?.wilayah ?? "").split(" - ").map((v) => v.trim())
  return provinsi ? { provinsi, kabKota: kabKota || undefined } : WILAYAH_DEMO
}
