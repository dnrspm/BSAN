/**
 * Utilitas bersama untuk fitur Laporan Akhir Tahun.
 * Dipakai saat menyinkronkan status "sudah mengisi" dari dashboard sekolah/dinas
 * ke daftar laporan yang dibaca Admin Pusat.
 */

export const LAPORAN_STORAGE_KEY = "laporanAkhirTahunList"

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
