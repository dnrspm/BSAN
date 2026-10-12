/**
 * Direktori master instansi untuk fitur Laporan Akhir Tahun.
 * Berisi seluruh dinas pendidikan dan sekolah yang terdaftar, sehingga
 * Admin Pusat dapat melihat status pengisian (sudah/belum) tiap instansi
 * pada halaman detail laporan.
 */

export type JenjangInstansi =
  | "PAUD"
  | "SD"
  | "SMP"
  | "SMA"
  | "SMK"
  | "PKBM"
  | "SLB"
  | "Sekolah Nasional Terintegrasi"
  | "Dinas Pendidikan"

export interface EntitasDirektori {
  id: string
  nama: string
  jenis: "sekolah" | "dinas"
  jenjang: JenjangInstansi
  provinsi: string
}

export const DIREKTORI_ENTITAS: EntitasDirektori[] = [
  // Dinas Pendidikan
  { id: "dinas-aceh", nama: "Dinas Pendidikan Provinsi Aceh", jenis: "dinas", jenjang: "Dinas Pendidikan", provinsi: "Aceh" },
  { id: "dinas-sumut", nama: "Dinas Pendidikan Provinsi Sumatera Utara", jenis: "dinas", jenjang: "Dinas Pendidikan", provinsi: "Sumatera Utara" },
  { id: "dinas-dkijakarta", nama: "Dinas Pendidikan Provinsi DKI Jakarta", jenis: "dinas", jenjang: "Dinas Pendidikan", provinsi: "DKI Jakarta" },
  { id: "dinas-jabar", nama: "Dinas Pendidikan Provinsi Jawa Barat", jenis: "dinas", jenjang: "Dinas Pendidikan", provinsi: "Jawa Barat" },
  { id: "dinas-jateng", nama: "Dinas Pendidikan Provinsi Jawa Tengah", jenis: "dinas", jenjang: "Dinas Pendidikan", provinsi: "Jawa Tengah" },
  { id: "dinas-jatim", nama: "Dinas Pendidikan Provinsi Jawa Timur", jenis: "dinas", jenjang: "Dinas Pendidikan", provinsi: "Jawa Timur" },
  { id: "dinas-bali", nama: "Dinas Pendidikan Provinsi Bali", jenis: "dinas", jenjang: "Dinas Pendidikan", provinsi: "Bali" },
  { id: "dinas-sulsel", nama: "Dinas Pendidikan Provinsi Sulawesi Selatan", jenis: "dinas", jenjang: "Dinas Pendidikan", provinsi: "Sulawesi Selatan" },
  { id: "dinas-bandaceh", nama: "Dinas Pendidikan Kota Banda Aceh", jenis: "dinas", jenjang: "Dinas Pendidikan", provinsi: "Aceh" },
  { id: "dinas-medan", nama: "Dinas Pendidikan Kota Medan", jenis: "dinas", jenjang: "Dinas Pendidikan", provinsi: "Sumatera Utara" },
  { id: "dinas-bandung", nama: "Dinas Pendidikan Kota Bandung", jenis: "dinas", jenjang: "Dinas Pendidikan", provinsi: "Jawa Barat" },
  { id: "dinas-semarang", nama: "Dinas Pendidikan Kota Semarang", jenis: "dinas", jenjang: "Dinas Pendidikan", provinsi: "Jawa Tengah" },
  { id: "dinas-surabaya", nama: "Dinas Pendidikan Kota Surabaya", jenis: "dinas", jenjang: "Dinas Pendidikan", provinsi: "Jawa Timur" },
  { id: "dinas-makassar", nama: "Dinas Pendidikan Kota Makassar", jenis: "dinas", jenjang: "Dinas Pendidikan", provinsi: "Sulawesi Selatan" },
  { id: "dinas-denpasar", nama: "Dinas Pendidikan Kota Denpasar", jenis: "dinas", jenjang: "Dinas Pendidikan", provinsi: "Bali" },

  // Sekolah — SMA (selaras dengan data laporan tahun 2025)
  { id: "sma-1-bandaceh", nama: "SMA Negeri 1 Banda Aceh", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-2-bandaceh", nama: "SMA Negeri 2 Banda Aceh", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-3-lhokseumawe", nama: "SMA Negeri 3 Lhokseumawe", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-1-sabang", nama: "SMA Negeri 1 Sabang", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-2-langsa", nama: "SMA Negeri 2 Langsa", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-1-acehbesar", nama: "SMA Negeri 1 Aceh Besar", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-1-pidie", nama: "SMA Negeri 1 Pidie", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-1-bireuen", nama: "SMA Negeri 1 Bireuen", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-1-acehutara", nama: "SMA Negeri 1 Aceh Utara", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-2-acehutara", nama: "SMA Negeri 2 Aceh Utara", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-1-simeulue", nama: "SMA Negeri 1 Simeulue", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-1-acehjaya", nama: "SMA Negeri 1 Aceh Jaya", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-1-naganraya", nama: "SMA Negeri 1 Nagan Raya", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-1-acehbarat", nama: "SMA Negeri 1 Aceh Barat", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-1-pidiejaya", nama: "SMA Negeri 1 Pidie Jaya", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-1-benermeriah", nama: "SMA Negeri 1 Bener Meriah", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-1-acehtengah", nama: "SMA Negeri 1 Aceh Tengah", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-1-gayolues", nama: "SMA Negeri 1 Gayo Lues", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-1-acehtenggara", nama: "SMA Negeri 1 Aceh Tenggara", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },
  { id: "sma-1-langsa", nama: "SMA Negeri 1 Langsa", jenis: "sekolah", jenjang: "SMA", provinsi: "Aceh" },

  // Sekolah — SMA lain
  { id: "sma-5-surabaya", nama: "SMA Negeri 5 Surabaya", jenis: "sekolah", jenjang: "SMA", provinsi: "Jawa Timur" },
  { id: "sma-1-semarang", nama: "SMA Negeri 1 Semarang", jenis: "sekolah", jenjang: "SMA", provinsi: "Jawa Tengah" },
  { id: "sma-3-denpasar", nama: "SMA Negeri 3 Denpasar", jenis: "sekolah", jenjang: "SMA", provinsi: "Bali" },
  { id: "sma-2-makassar", nama: "SMA Negeri 2 Makassar", jenis: "sekolah", jenjang: "SMA", provinsi: "Sulawesi Selatan" },

  // Sekolah — SD
  { id: "sd-1-bandaceh", nama: "SD Negeri 1 Banda Aceh", jenis: "sekolah", jenjang: "SD", provinsi: "Aceh" },
  { id: "sd-2-bandaceh", nama: "SD Negeri 2 Banda Aceh", jenis: "sekolah", jenjang: "SD", provinsi: "Aceh" },
  { id: "sd-1-jakarta", nama: "SD Negeri 1 Jakarta", jenis: "sekolah", jenjang: "SD", provinsi: "DKI Jakarta" },
  { id: "sd-2-surabaya", nama: "SD Negeri 2 Surabaya", jenis: "sekolah", jenjang: "SD", provinsi: "Jawa Timur" },

  // Sekolah — SMP
  { id: "smp-1-bandaceh", nama: "SMP Negeri 1 Banda Aceh", jenis: "sekolah", jenjang: "SMP", provinsi: "Aceh" },
  { id: "smp-1-bandung", nama: "SMP Negeri 1 Bandung", jenis: "sekolah", jenjang: "SMP", provinsi: "Jawa Barat" },
  { id: "smp-3-semarang", nama: "SMP Negeri 3 Semarang", jenis: "sekolah", jenjang: "SMP", provinsi: "Jawa Tengah" },

  // Sekolah — SMK
  { id: "smk-1-medan", nama: "SMK Negeri 1 Medan", jenis: "sekolah", jenjang: "SMK", provinsi: "Sumatera Utara" },
  { id: "smk-2-surabaya", nama: "SMK Negeri 2 Surabaya", jenis: "sekolah", jenjang: "SMK", provinsi: "Jawa Timur" },

  // Sekolah — SLB
  { id: "slb-1-bandaaceh", nama: "SLB Negeri 1 Banda Aceh", jenis: "sekolah", jenjang: "SLB", provinsi: "Aceh" },
  { id: "slb-1-denpasar", nama: "SLB Negeri 1 Denpasar", jenis: "sekolah", jenjang: "SLB", provinsi: "Bali" },

  // Sekolah — PKBM
  { id: "pkbm-1-bandung", nama: "PKBM Harapan Bangsa Bandung", jenis: "sekolah", jenjang: "PKBM", provinsi: "Jawa Barat" },
  { id: "pkbm-1-makassar", nama: "PKBM Cerdas Mandiri Makassar", jenis: "sekolah", jenjang: "PKBM", provinsi: "Sulawesi Selatan" },

  // Sekolah — PAUD
  { id: "paud-1-bandaceh", nama: "PAUD Tunas Harapan Banda Aceh", jenis: "sekolah", jenjang: "PAUD", provinsi: "Aceh" },
  { id: "paud-1-semarang", nama: "PAUD Melati Semarang", jenis: "sekolah", jenjang: "PAUD", provinsi: "Jawa Tengah" },

  // Sekolah Nasional Terintegrasi
  { id: "snt-1-jakarta", nama: "Sekolah Nasional Terintegrasi Jakarta", jenis: "sekolah", jenjang: "Sekolah Nasional Terintegrasi", provinsi: "DKI Jakarta" },
  { id: "snt-1-surabaya", nama: "Sekolah Nasional Terintegrasi Surabaya", jenis: "sekolah", jenjang: "Sekolah Nasional Terintegrasi", provinsi: "Jawa Timur" },
]

export const DIREKTORI_SEKOLAH = DIREKTORI_ENTITAS.filter((e) => e.jenis === "sekolah")
export const DIREKTORI_DINAS = DIREKTORI_ENTITAS.filter((e) => e.jenis === "dinas")
