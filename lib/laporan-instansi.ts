/**
 * Utilitas bersama untuk fitur Laporan Akhir Tahun.
 * Dipakai saat menyinkronkan status "sudah mengisi" dari dashboard sekolah/dinas
 * ke daftar laporan yang dibaca Admin Pusat.
 */

export const LAPORAN_STORAGE_KEY = "laporanAkhirTahunList"

/**
 * Menghapus entri laporan dummy tahun 2026 yang tersisa dari seed versi lama,
 * sehingga tidak lagi muncul di dashboard pusat, sekolah, dinas, maupun BPMP.
 * Hanya menyasar entri dummy (id/createdAt seed lama), bukan periode resmi
 * yang dibuat kemudian.
 */
export function purgeLegacyLaporan2026(): void {
  if (typeof window === "undefined") return
  try {
    const raw = localStorage.getItem(LAPORAN_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Array<{ id?: string; tahun?: string; createdAt?: string }>
    if (!Array.isArray(parsed)) return
    const filtered = parsed.filter(
      (item) =>
        item?.id !== "laporan-2026" &&
        !(
          item?.tahun === "2026" &&
          typeof item.createdAt === "string" &&
          item.createdAt.startsWith("2025-07-01")
        )
    )
    if (filtered.length !== parsed.length) {
      localStorage.setItem(LAPORAN_STORAGE_KEY, JSON.stringify(filtered))
    }
  } catch {
    /* abaikan */
  }
}

/**
 * Menormalkan nama instansi untuk pencocokan, sehingga variasi penulisan
 * seperti "SDN 1 Banda Aceh" dan "SD Negeri 1 Banda Aceh" dianggap sama.
 */
export function normalizeNamaInstansi(nama: string): string {
  return (nama ?? "")
    .toLowerCase()
    .replace(/\bnegeri\b/g, "")
    .replace(/\bsman\b/g, "sma")
    .replace(/\bsmkn\b/g, "smk")
    .replace(/\bsmpn\b/g, "smp")
    .replace(/\bsdn\b/g, "sd")
    .replace(/\bslbn\b/g, "slb")
    .replace(/[^a-z0-9]/g, "")
}

export interface SekolahIsian {
  id: string
  namaSekolah: string
  jumlahKasus: number
  skor: number | null
  googleFormResponseUrl: string
  tanggalSubmit: string
}

export interface DinasIsian {
  id: string
  namaDinas: string
  skor: number | null
  googleFormResponseUrl: string
  tanggalSubmit: string
}

/**
 * Menambahkan/menghapus entri pengisian pada periode tertentu di
 * `laporanAkhirTahunList`, agar halaman detail Admin Pusat ikut terbarui.
 */
export function syncSubmission(
  tahun: string,
  identitas: string,
  jenis: "sekolah" | "dinas",
  filled: boolean,
  daftarSekolah: SekolahIsian[] = [],
  daftarDinas: DinasIsian[] = []
): { daftarSekolah: SekolahIsian[]; daftarDinas: DinasIsian[] } {
  if (typeof window === "undefined") return { daftarSekolah, daftarDinas }

  const target = normalizeNamaInstansi(identitas)
  const tanggalSubmit = new Date().toISOString().slice(0, 10)

  if (jenis === "dinas") {
    const arr = [...daftarDinas]
    const idx = arr.findIndex((d) => normalizeNamaInstansi(d.namaDinas) === target)
    if (filled && idx === -1) {
      arr.push({
        id: `dinas-${Date.now()}`,
        namaDinas: identitas,
        skor: null,
        googleFormResponseUrl: "",
        tanggalSubmit,
      })
    } else if (!filled && idx !== -1) {
      arr.splice(idx, 1)
    }
    return { daftarSekolah, daftarDinas: arr }
  }

  const arr = [...daftarSekolah]
  const idx = arr.findIndex((s) => normalizeNamaInstansi(s.namaSekolah) === target)
  if (filled && idx === -1) {
    arr.push({
      id: `sek-${Date.now()}`,
      namaSekolah: identitas,
      jumlahKasus: 0,
      skor: null,
      googleFormResponseUrl: "",
      tanggalSubmit,
    })
  } else if (!filled && idx !== -1) {
    arr.splice(idx, 1)
  }
  return { daftarSekolah: arr, daftarDinas }
}
