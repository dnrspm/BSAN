"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Heart, Scale, Shield, Phone, MapPin, Plus,
  Search, MessageCircle, Globe, Lock, Users,
  Building2, GraduationCap, HandHeart, Radio,
  ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, ChevronsDown,
  X, Pencil, Trash2, CheckCircle,
  XCircle, ExternalLink, RotateCcw, Clock, ArrowUpDown, Download,
  Upload, FileSpreadsheet, AlertCircle,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DEFAULT_DINAS_NAMA, getDinasNamaForLogs, readAuthSession } from "@/lib/auth-session"
import { RUJUKAN_LOG, dinasLog, formatLogTerakhirDisplay, getStatusAfterRestore } from "@/lib/rujukan-logs"

const D_SEED = DEFAULT_DINAS_NAMA
const actorDinasSeed = `Admin ${D_SEED}`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type KategoriDukungan =
  | "Fasilitas Kesehatan" | "Konseling" | "Bantuan Hukum"
  | "Kepolisian" | "Psikologi" | "Pendidikan" | "Sosial" | "Lainnya"

export type KategoriPenyedia = "Pemerintah Pusat" | "Pemerintah Daerah" | "Swasta" | "OMS" | "Lainnya"
export type StatusRujukan = "terverifikasi" | "menunggu" | "menunggu_review" | "nonaktif" | "butuh_perbaikan"

export interface SumberRujukan {
  id: string
  namaInstansi: string
  kategoriBentukDukungan: KategoriDukungan
  kategoriPenyedia: KategoriPenyedia | ""
  provinsi: string
  kabupatenKota: string
  kecamatan?: string
  kelurahan?: string
  namaJalan?: string
  nomorJalan?: string
  kodePos?: string
  tautanGoogleMaps?: string
  nomorCallCenter: string
  nomorCallCenter2?: string
  nomorPribadi?: string
  website?: string
  alamatKota?: string
  alamatProvinsi?: string
  aksesInfo: "publik" | "terbatas"
  status: StatusRujukan
  dibuatOleh: string
  logTerakhir?: string
  catatanPerbaikan?: string
  /** Asal usulan entri menunggu verifikasi (mempengaruhi teks log bila belum ada `logTerakhir`). */
  usulanDari?: "dinas" | "sekolah" | "pusat"
  /** Nama sekolah untuk log "Dibuat oleh Admin Sekolah …". */
  namaSekolah?: string
  createdAt?: string
  /** Jenis status menunggu: pengajuan = baru, perbaikan = laporan perbaikan data, penonaktifan = usulan nonaktif */
  jenisMenunggu?: "pengajuan" | "perbaikan" | "perbaikan_laporan" | "penonaktifan" | "pemulihan"
  /** Jenis butuh_perbaikan: ditolak = dari tolak pengajuan/perbaikan, perbaikan = dari terima laporan perbaikan */
  jenisButuhPerbaikan?: "ditolak" | "perbaikan"
  /** Nama sekolah yang pernah melaporkan item ini (untuk filter "pernah dilaporkan"). */
  dilaporkanOlehSekolah?: string
  /** Ditandai sebagai sumber dukungan nasional */
  isNasional?: boolean
}

const KOTA_SET = new Set([
  "Banda Aceh", "Sabang", "Langsa", "Lhokseumawe", "Subulussalam",
  "Medan", "Binjai", "Gunungsitoli", "Padangsidempuan", "Pematangsiantar", "Sibolga", "Tanjungbalai", "Tebing Tinggi",
  "Bukittinggi", "Padang", "Padangpanjang", "Pariaman", "Payakumbuh", "Sawahlunto", "Solok",
  "Dumai", "Pekanbaru",
  "Jambi", "Sungaipenuh",
  "Lubuklinggau", "Pagar Alam", "Palembang", "Prabumulih",
  "Bengkulu",
  "Bandar Lampung", "Metro",
  "Pangkalpinang",
  "Batam", "Tanjungpinang",
  "Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur",
  "Bandung", "Banjar", "Bekasi", "Bogor", "Cimahi", "Cirebon", "Depok", "Sukabumi", "Tasikmalaya",
  "Magelang", "Pekalongan", "Salatiga", "Semarang", "Surakarta", "Tegal",
  "Yogyakarta",
  "Batu", "Blitar", "Kediri", "Madiun", "Malang", "Mojokerto", "Pasuruan", "Probolinggo", "Surabaya",
  "Cilegon", "Serang", "Tangerang", "Tangerang Selatan",
  "Denpasar",
  "Bima", "Mataram",
  "Kupang",
  "Pontianak", "Singkawang",
  "Palangkaraya",
  "Banjarbaru", "Banjarmasin",
  "Balikpapan", "Bontang", "Samarinda",
  "Tarakan",
  "Bitung", "Kotamobagu", "Manado", "Tomohon",
  "Palu",
  "Makassar", "Palopo", "Parepare",
  "Bau-Bau", "Kendari",
  "Gorontalo",
  "Mamuju",
  "Ambon", "Tual",
  "Ternate", "Tidore Kepulauan",
  "Sorong",
  "Jayapura",
])

function getWilayahType(kabupatenKota: string): "Kota" | "Kabupaten" {
  return KOTA_SET.has(kabupatenKota) ? "Kota" : "Kabupaten"
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
export const KATEGORI_CONFIG: Record<KategoriDukungan, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  "Fasilitas Kesehatan": { label: "Fasilitas Kesehatan", icon: <Heart className="w-3.5 h-3.5" />,        color: "text-rose-600",   bg: "bg-rose-100" },
  "Konseling":           { label: "Konseling",           icon: <MessageCircle className="w-3.5 h-3.5" />, color: "text-purple-600", bg: "bg-purple-100" },
  "Bantuan Hukum":       { label: "Bantuan Hukum",       icon: <Scale className="w-3.5 h-3.5" />,         color: "text-blue-600",   bg: "bg-blue-100" },
  "Kepolisian":          { label: "Kepolisian",          icon: <Shield className="w-3.5 h-3.5" />,        color: "text-indigo-600", bg: "bg-indigo-100" },
  "Psikologi":           { label: "Psikologi",           icon: <HandHeart className="w-3.5 h-3.5" />,     color: "text-pink-600",   bg: "bg-pink-100" },
  "Pendidikan":          { label: "Pendidikan",          icon: <GraduationCap className="w-3.5 h-3.5" />, color: "text-green-600",  bg: "bg-green-100" },
  "Sosial":              { label: "Sosial",              icon: <Building2 className="w-3.5 h-3.5" />,     color: "text-amber-600",  bg: "bg-amber-100" },
  "Lainnya":             { label: "Lainnya",             icon: <Radio className="w-3.5 h-3.5" />,         color: "text-gray-600",   bg: "bg-gray-100" },
}

export const PENYEDIA_CONFIG: Record<string, { color: string; bg: string }> = {
  "Pemerintah Pusat":  { color: "text-blue-700",   bg: "bg-blue-50" },
  "Pemerintah Daerah": { color: "text-indigo-700", bg: "bg-indigo-50" },
  "Swasta":            { color: "text-amber-700",  bg: "bg-amber-50" },
  "OMS":               { color: "text-green-700",  bg: "bg-green-50" },
  "Lainnya":           { color: "text-gray-700",   bg: "bg-gray-100" },
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
export const SEED: SumberRujukan[] = [
  {
    id: "sr-nasional-1", namaInstansi: "Kepolisian Republik Indonesia (Polri)",
    kategoriBentukDukungan: "Kepolisian", kategoriPenyedia: "Pemerintah Pusat",
    provinsi: "Seluruh Indonesia", kabupatenKota: "Seluruh Indonesia", namaJalan: "Jl. Trunojoyo No. 3", nomorJalan: "",
    kelurahan: "Gunung", kecamatan: "Kebayoran Baru", alamatKota: "Jakarta Selatan", alamatProvinsi: "DKI Jakarta",
    nomorCallCenter: "110", nomorPribadi: "081112223333", aksesInfo: "publik", status: "terverifikasi",
    dibuatOleh: "Admin Pusat", usulanDari: "pusat",
    logTerakhir: RUJUKAN_LOG.dibuatTerverifikasiPusat, website: "https://www.polri.go.id",
  },
  
  {
    id: "sr-nasional-3", namaInstansi: "Komisi Perlindungan Anak Indonesia (KPAI)",
    kategoriBentukDukungan: "Sosial", kategoriPenyedia: "Pemerintah Pusat",
    provinsi: "Seluruh Indonesia", kabupatenKota: "Seluruh Indonesia", namaJalan: "Jl. Matraman No. 56", nomorJalan: "",
    kelurahan: "Pisangan Baru", kecamatan: "Matraman", alamatKota: "Jakarta Timur", alamatProvinsi: "DKI Jakarta",
    nomorCallCenter: "021-6916565", nomorCallCenter2: "021-6916566", nomorPribadi: "081234567890", aksesInfo: "publik", status: "terverifikasi",
    dibuatOleh: "Admin Pusat", usulanDari: "pusat",
    logTerakhir: RUJUKAN_LOG.dibuatTerverifikasiPusat, website: "https://www.kpai.go.id",
  },
  {
    id: "sr-nasional-5", namaInstansi: "BNPT - Badan Nasional Penanggulangan Terorisme",
    kategoriBentukDukungan: "Lainnya", kategoriPenyedia: "Pemerintah Pusat",
    provinsi: "Seluruh Indonesia", kabupatenKota: "Seluruh Indonesia", namaJalan: "Jl. Padjajaran", nomorJalan: "No. 45",
    kelurahan: "Baranangsiang", kecamatan: "Bogor Timur",
    tautanGoogleMaps: "https://www.google.com/maps/place/Badan+Nasional+Penanggulangan+Terorisme/@-6.518397,106.8761706,17z/data=!3m1!4b1!4m6!3m5!1s0x2e69c0e6789e2691:0xde40f9595e05e114!8m2!3d-6.518397!4d106.8761706!16s%2Fg%2F11b6syscb0?entry=ttu&g_ep=EgoyMDI2MDYxMy4wIKXMDSoASAFQAw%3D%3D",
    alamatKota: "Kota Bogor", alamatProvinsi: "Jawa Barat",
    nomorCallCenter: "021-8090555", nomorCallCenter2: "021-8090556", nomorPribadi: "081234567890", aksesInfo: "publik", status: "terverifikasi",
    dibuatOleh: "Admin Pusat", usulanDari: "pusat",
    logTerakhir: RUJUKAN_LOG.dibuatTerverifikasiPusat, website: "https://www.bnpt.go.id",
  },
  {
    id: "sr-contoh-1kontak", namaInstansi: "Hotline Perlindungan Anak Nasional",
    kategoriBentukDukungan: "Sosial", kategoriPenyedia: "Pemerintah Pusat",
    provinsi: "Seluruh Indonesia", kabupatenKota: "Seluruh Indonesia",
    namaJalan: "Jl. Merdeka", nomorJalan: "No. 1",
    kelurahan: "Gambir", kecamatan: "Gambir", alamatKota: "Jakarta Pusat", alamatProvinsi: "DKI Jakarta",
    nomorCallCenter: "1500771", aksesInfo: "publik", status: "terverifikasi",
    dibuatOleh: "Admin Pusat", usulanDari: "pusat",
    logTerakhir: RUJUKAN_LOG.dibuatTerverifikasiPusat,
  },
  {
    id: "sr-contoh-2kontak", namaInstansi: "Layanan Psikologi Nasional",
    kategoriBentukDukungan: "Psikologi", kategoriPenyedia: "Pemerintah Pusat",
    provinsi: "Seluruh Indonesia", kabupatenKota: "Seluruh Indonesia",
    namaJalan: "Jl. Sudirman", nomorJalan: "No. 50",
    kelurahan: "Karet Tengsin", kecamatan: "Tanah Abang", alamatKota: "Jakarta Pusat", alamatProvinsi: "DKI Jakarta",
    tautanGoogleMaps: "https://maps.google.com/?q=-6.2088,106.8456",
    nomorCallCenter: "1500772", nomorCallCenter2: "021-12345678", aksesInfo: "publik", status: "terverifikasi",
    dibuatOleh: "Admin Pusat", usulanDari: "pusat",
    logTerakhir: RUJUKAN_LOG.dibuatTerverifikasiPusat,
  },
  {
    id: "sr-contoh-3kontak", namaInstansi: "Bantuan Hukum Nasional",
    kategoriBentukDukungan: "Bantuan Hukum", kategoriPenyedia: "Pemerintah Pusat",
    provinsi: "Seluruh Indonesia", kabupatenKota: "Seluruh Indonesia",
    namaJalan: "Jl. MH Thamrin", nomorJalan: "No. 10",
    kelurahan: "Menteng", kecamatan: "Menteng", alamatKota: "Jakarta Pusat", alamatProvinsi: "DKI Jakarta",
    nomorCallCenter: "1500773", nomorCallCenter2: "021-87654321", nomorPribadi: "081234567891", aksesInfo: "publik", status: "terverifikasi",
    dibuatOleh: "Admin Pusat", usulanDari: "pusat",
    logTerakhir: RUJUKAN_LOG.dibuatTerverifikasiPusat, website: "https://bantuanhukum.go.id",
  },
  {
    id: "sr-review-1",
    namaInstansi: "Unit Layanan Psikologi Terpadu",
    kategoriBentukDukungan: "Psikologi",
    kategoriPenyedia: "Pemerintah Daerah",
    provinsi: "Aceh",
    kabupatenKota: "Banda Aceh",
    namaJalan: "Jl. Teuku Umar",
    nomorJalan: "No. 45",
    nomorCallCenter: "065199988", nomorPribadi: "085277788899",
    aksesInfo: "publik",
    status: "terverifikasi",
    dibuatOleh: actorDinasSeed,
    usulanDari: "dinas",
    logTerakhir: dinasLog.dibuatTerverifikasi(D_SEED),
  },
  {
    id: "sr-1", namaInstansi: "RSUD Zainoel Abidin",
    kategoriBentukDukungan: "Fasilitas Kesehatan", kategoriPenyedia: "Pemerintah Daerah",
    provinsi: "Aceh", kabupatenKota: "Banda Aceh", namaJalan: "Jl. Tgk. Daud Beureueh", nomorJalan: "No. 108",
    nomorCallCenter: "065123560", aksesInfo: "publik", status: "terverifikasi",
    dibuatOleh: actorDinasSeed, usulanDari: "dinas",
    logTerakhir: dinasLog.diperbaharui(D_SEED),
  },
  {
    id: "sr-2", namaInstansi: "Puskesmas Baiturrahman",
    kategoriBentukDukungan: "Fasilitas Kesehatan", kategoriPenyedia: "Pemerintah Daerah",
    provinsi: "Aceh", kabupatenKota: "Banda Aceh", namaJalan: "Jl. Sri Ratu Safiatuddin",
    nomorCallCenter: "065122345", aksesInfo: "publik", status: "terverifikasi",
    dibuatOleh: actorDinasSeed, usulanDari: "dinas",
    logTerakhir: dinasLog.dibuatTerverifikasi(D_SEED),
  },
  {
    id: "sr-3", namaInstansi: "Pusat Konseling Remaja Aceh",
    kategoriBentukDukungan: "Konseling", kategoriPenyedia: "OMS",
    provinsi: "Aceh", kabupatenKota: "Banda Aceh", namaJalan: "Jl. Teungku Chik Ditiro", nomorJalan: "No. 26",
    nomorCallCenter: "065131456", nomorPribadi: "08127654321", aksesInfo: "terbatas", status: "menunggu",
    dibuatOleh: "Admin Sekolah SMAN 1 Banda Aceh", usulanDari: "sekolah", namaSekolah: "SMAN 1 Banda Aceh",
    logTerakhir: RUJUKAN_LOG.dibuatSekolah("SMAN 1 Banda Aceh"),
  },
  {
    id: "sr-4", namaInstansi: "LBH Banda Aceh",
    kategoriBentukDukungan: "Bantuan Hukum", kategoriPenyedia: "OMS",
    provinsi: "Aceh", kabupatenKota: "Banda Aceh", namaJalan: "Jl. T. Daud Syah", nomorJalan: "No. 5",
    nomorCallCenter: "065127890", aksesInfo: "publik", status: "menunggu",
    dibuatOleh: "Admin Sekolah SMAN 2 Banda Aceh", usulanDari: "sekolah", namaSekolah: "SMAN 2 Banda Aceh",
    logTerakhir: RUJUKAN_LOG.dibuatSekolah("SMAN 2 Banda Aceh"),
  },
  {
    id: "sr-5", namaInstansi: "Polresta Banda Aceh",
    kategoriBentukDukungan: "Kepolisian", kategoriPenyedia: "Pemerintah Pusat",
    provinsi: "Aceh", kabupatenKota: "Banda Aceh", namaJalan: "Jl. Sultan Malikul Saleh",
    nomorCallCenter: "110", aksesInfo: "publik", status: "terverifikasi",
    dibuatOleh: "Admin Pusat", usulanDari: "pusat",
    logTerakhir: RUJUKAN_LOG.dibuatTerverifikasiPusat, website: "https://polrestabandaaceh.id",
  },
  {
    id: "sr-6",
    namaInstansi: "UPTD Dinas Sosial Kota Banda Aceh",
    kategoriBentukDukungan: "Sosial", kategoriPenyedia: "Pemerintah Daerah",
    provinsi: "Aceh", kabupatenKota: "Banda Aceh", namaJalan: "Jl. T. Amir Hamzah",
    nomorCallCenter: "065112233", aksesInfo: "publik", status: "terverifikasi",
    dibuatOleh: actorDinasSeed, usulanDari: "dinas",
    logTerakhir: dinasLog.dibuatTerverifikasi(D_SEED),
  },
  {
    id: "sr-7",
    namaInstansi: "Klinik Pratama Medika",
    kategoriBentukDukungan: "Fasilitas Kesehatan", kategoriPenyedia: "Swasta",
    provinsi: "Aceh", kabupatenKota: "Banda Aceh", namaJalan: "Jl. Prof. Ali Hasyimi No. 20",
    nomorCallCenter: "065145678", aksesInfo: "publik", status: "nonaktif",
    dibuatOleh: actorDinasSeed, usulanDari: "dinas",
    logTerakhir: dinasLog.dinonaktifkan(D_SEED),
  },
  {
    id: "sr-tolak-aceh-1", namaInstansi: "Klinik Bidan Dewi",
    kategoriBentukDukungan: "Fasilitas Kesehatan", kategoriPenyedia: "Swasta",
    provinsi: "Aceh", kabupatenKota: "Lhokseumawe", namaJalan: "Jl. Masjid", nomorJalan: "No. 5",
    nomorCallCenter: "064512345", aksesInfo: "publik", status: "butuh_perbaikan",
    jenisButuhPerbaikan: "ditolak",
    dibuatOleh: "Admin Sekolah SMAN 1 Lhokseumawe", namaSekolah: "SMAN 1 Lhokseumawe",
    logTerakhir: "Ditolak: Alamat tidak valid",
    diusulkanDari: "sekolah",
  },
  {
    id: "sr-perbaikan-aceh-1", namaInstansi: "Pusat Konseling Inspiration Aceh",
    kategoriBentukDukungan: "Konseling", kategoriPenyedia: "Swasta",
    provinsi: "Aceh", kabupatenKota: "Banda Aceh", namaJalan: "Jl. Hasanamba", nomorJalan: "No. 18",
    nomorCallCenter: "065198765", aksesInfo: "publik", status: "butuh_perbaikan",
    jenisButuhPerbaikan: "perbaikan",
    dibuatOleh: "Admin Sekolah SMA Labschool", namaSekolah: "SMA Labschool Banda Aceh",
    logTerakhir: "Butuh perbaikan: Upload dokumen tidak lengkap",
    diusulkanDari: "sekolah",
  },
  {
    id: "sr-review-aceh-1", namaInstansi: "Yayasan Perlindungan Anak Aceh",
    kategoriBentukDukungan: "Sosial", kategoriPenyedia: "OMS",
    provinsi: "Aceh", kabupatenKota: "Banda Aceh", namaJalan: "Jl. Sultan", nomorJalan: "No. 12",
    nomorCallCenter: "065178999", aksesInfo: "publik", status: "menunggu_review",
    dibuatOleh: "Admin Sekolah SMA Syiah Kuala", namaSekolah: "SMA Syiah Kuala",
    logTerakhir: "Diproses oleh Admin Dinas Aceh",
    diusulkanDari: "sekolah",
  },
  {
    id: "sr-pemulihan-aceh-1", namaInstansi: "Puskesmas Langsa",
    kategoriBentukDukungan: "Fasilitas Kesehatan", kategoriPenyedia: "Pemerintah Daerah",
    provinsi: "Aceh", kabupatenKota: "Langsa", namaJalan: "Jl. Diponegoro", nomorJalan: "No. 30",
    nomorCallCenter: "064112233", aksesInfo: "publik", status: "menunggu",
    jenisMenunggu: "pemulihan",
    dibuatOleh: "Admin Dinas Aceh", namaSekolah: undefined,
    logTerakhir: "Usulan pemulihan menunggu verifikasi",
    diusulkanDari: "dinas",
  },
  // --- Seed lintas wilayah untuk demo fitur "Semua Wilayah" ---
  {
    id: "sr-jkt-1", namaInstansi: "RSUP Dr. Cipto Mangunkusumo",
    kategoriBentukDukungan: "Fasilitas Kesehatan", kategoriPenyedia: "Pemerintah Pusat",
    provinsi: "DKI Jakarta", kabupatenKota: "Jakarta Pusat", namaJalan: "Jl. Diponegoro", nomorJalan: "No. 71",
    nomorCallCenter: "02119408991", aksesInfo: "publik", status: "terverifikasi",
    dibuatOleh: "Admin Pusat", usulanDari: "pusat",
    logTerakhir: RUJUKAN_LOG.dibuatTerverifikasiPusat,
  },
  {
    id: "sr-jkt-2", namaInstansi: "LBH Jakarta",
    kategoriBentukDukungan: "Bantuan Hukum", kategoriPenyedia: "OMS",
    provinsi: "DKI Jakarta", kabupatenKota: "Jakarta Pusat", namaJalan: "Jl. Diponegoro", nomorJalan: "No. 74",
    nomorCallCenter: "02131925276", aksesInfo: "publik", status: "terverifikasi",
    dibuatOleh: "Admin Pusat", usulanDari: "pusat",
    logTerakhir: RUJUKAN_LOG.dibuatTerverifikasiPusat,
  },
  {
    id: "sr-jkt-3", namaInstansi: "Komnas Perempuan",
    kategoriBentukDukungan: "Bantuan Hukum", kategoriPenyedia: "Pemerintah Pusat",
    provinsi: "DKI Jakarta", kabupatenKota: "Jakarta Pusat", namaJalan: "Jl. Latuharhary", nomorJalan: "No. 4B",
    nomorCallCenter: "02139007748", aksesInfo: "publik", status: "terverifikasi",
    dibuatOleh: "Admin Pusat", usulanDari: "pusat",
    logTerakhir: RUJUKAN_LOG.dibuatTerverifikasiPusat,
  },
  {
    id: "sr-sby-1", namaInstansi: "RSUD Dr. Soetomo",
    kategoriBentukDukungan: "Fasilitas Kesehatan", kategoriPenyedia: "Pemerintah Daerah",
    provinsi: "Jawa Timur", kabupatenKota: "Surabaya", namaJalan: "Jl. Mayjen Prof. Dr. Moestopo", nomorJalan: "No. 6-8",
    kecamatan: "Gubeng", kelurahan: "Mojo",
    nomorCallCenter: "0315501078", nomorCallCenter2: "0315501079", nomorPribadi: "081334455667", aksesInfo: "publik", status: "terverifikasi",
    dibuatOleh: "Admin Pusat", usulanDari: "pusat",
    logTerakhir: RUJUKAN_LOG.dibuatTerverifikasiPusat,
  },
  {
    id: "sr-mks-1", namaInstansi: "Yayasan Lembaga Konsumen",
    kategoriBentukDukungan: "Konseling", kategoriPenyedia: "OMS",
    provinsi: "Sulawesi Selatan", kabupatenKota: "Makassar", namaJalan: "Jl. AP. Pettarani", nomorJalan: "No. 4",
    nomorCallCenter: "04114119600", aksesInfo: "publik", status: "terverifikasi",
    tautanGoogleMaps: "https://www.google.com/maps/embed?pb=!1v1699999999999!3d-5.157!4d119.422",
    dibuatOleh: "Admin Pusat", usulanDari: "pusat",
    logTerakhir: RUJUKAN_LOG.dibuatTerverifikasiPusat,
  },
  {
    id: "sr-mdn-1", namaInstansi: "P2TP2A Kota Medan",
    kategoriBentukDukungan: "Sosial", kategoriPenyedia: "Pemerintah Daerah",
    provinsi: "Sumatera Utara", kabupatenKota: "Medan", namaJalan: "Jl. Kapten Maulana Lubis",
    nomorCallCenter: "0618458844", nomorPribadi: "082156789012", aksesInfo: "publik", status: "terverifikasi",
    dibuatOleh: "Admin Pusat", usulanDari: "pusat",
    logTerakhir: RUJUKAN_LOG.dibuatTerverifikasiPusat,
  },
  // --- Status: butuh_perbaikan (Ditolak) ---
  {
    id: "sr-tolak-1", namaInstansi: "Klinik Abadi Sejahtera",
    kategoriBentukDukungan: "Fasilitas Kesehatan", kategoriPenyedia: "Swasta",
    provinsi: "Jawa Barat", kabupatenKota: "Bandung", namaJalan: "Jl. Asia Afrika", nomorJalan: "No. 15",
    nomorCallCenter: "022123456", aksesInfo: "publik", status: "butuh_perbaikan",
    jenisButuhPerbaikan: "ditolak",
    dibuatOleh: "Admin Sekolah SMAN 5 Bandung", namaSekolah: "SMAN 5 Bandung",
    logTerakhir: "Ditolak: Data tidak valid",
    diusulkanDari: "sekolah",
  },
  {
    id: "sr-tolak-2", namaInstansi: "Pusat Konseling Inspiration",
    kategoriBentukDukungan: "Konseling", kategoriPenyedia: "Swasta",
    provinsi: "Jawa Timur", kabupatenKota: "Surabaya", namaJalan: "Jl. Basuki Rahmat", nomorJalan: "No. 88",
    nomorCallCenter: "031123456", aksesInfo: "publik", status: "butuh_perbaikan",
    jenisButuhPerbaikan: "perbaikan",
    dibuatOleh: "Admin Sekolah SMA Hang Tuah 1", namaSekolah: "SMA Hang Tuah 1",
    logTerakhir: "Butuh perbaikan: Nomor telepon tidak valid",
    diusulkanDari: "sekolah",
  },
  // --- Status: menunggu_review ---
  {
    id: "sr-review-2", namaInstansi: "LBH Surabaya",
    kategoriBentukDukungan: "Bantuan Hukum", kategoriPenyedia: "OMS",
    provinsi: "Jawa Timur", kabupatenKota: "Surabaya", namaJalan: "Jl. Darmo", nomorJalan: "No. 26",
    nomorCallCenter: "031567890", aksesInfo: "publik", status: "menunggu_review",
    dibuatOleh: "Admin Sekolah SMA Alhidayah", namaSekolah: "SMA Alhidayah",
    logTerakhir: "Diproses oleh Admin Dinas Jawa Timur",
    diusulkanDari: "sekolah",
  },
  // --- Status: menunggu dengan berbagai jenisMenunggu ---
  {
    id: "sr-perbaikan-1", namaInstansi: "RS Permata",
    kategoriBentukDukungan: "Fasilitas Kesehatan", kategoriPenyedia: "Swasta",
    provinsi: "Banten", kabupatenKota: "Tangerang", namaJalan: "Jl. MH. Thamrin", nomorJalan: "No. 10",
    nomorCallCenter: "021123789", aksesInfo: "publik", status: "menunggu",
    jenisMenunggu: "perbaikan",
    dibuatOleh: "Admin Sekolah SMAN 3 Tangeran", namaSekolah: "SMAN 3 Tangeran",
    logTerakhir: "Menunggu perbaikan data oleh admin sekolah",
    diusulkanDari: "sekolah",
  },
  {
    id: "sr-pemulihan-1", namaInstansi: "Puskesmas Sejahtera",
    kategoriBentukDukungan: "Fasilitas Kesehatan", kategoriPenyedia: "Pemerintah Daerah",
    provinsi: "Sumatera Selatan", kabupatenKota: "Palembang", namaJalan: "Jl. Jend. Sudirman", nomorJalan: "No. 45",
    nomorCallCenter: "071112233", aksesInfo: "publik", status: "menunggu",
    jenisMenunggu: "pemulihan",
    dibuatOleh: "Admin Dinas Sumatera Selatan", namaSekolah: undefined,
    logTerakhir: "Usulan pemulihan menunggu verifikasi",
    diusulkanDari: "dinas",
  },
  // --- Status: nonaktif ---
  {
    id: "sr-nonaktif-1", namaInstansi: "Klinik Utama Sentosa",
    kategoriBentukDukungan: "Fasilitas Kesehatan", kategoriPenyedia: "Swasta",
    provinsi: "Jawa Tengah", kabupatenKota: "Semarang", namaJalan: "Jl. Pandanaran", nomorJalan: "No. 30",
    nomorCallCenter: "024123456", aksesInfo: "publik", status: "nonaktif",
    dibuatOleh: "Admin Dinas Jawa Tengah", namaSekolah: undefined,
    logTerakhir: "Dinonaktifkan karena tidak aktif beroperasi",
    diusulkanDari: "dinas",
  },
]

// ---------------------------------------------------------------------------
// Infer jenisMenunggu dari logTerakhir untuk data lama yang belum punya field ini
// ---------------------------------------------------------------------------
function resolveJenisMenunggu(item: Pick<SumberRujukan, "jenisMenunggu" | "logTerakhir" | "status" | "usulanDari">): "pengajuan" | "perbaikan" | "perbaikan_laporan" | "penonaktifan" | "pemulihan" | undefined {
  if (item.status !== "menunggu") return undefined
  if ((item.jenisMenunggu as string) === "dilaporan") return "perbaikan_laporan"
  if ((item.jenisMenunggu as string) === "perbaikan" && item.usulanDari !== "sekolah") return "perbaikan_laporan"
  if (item.jenisMenunggu) return item.jenisMenunggu
  if (item.logTerakhir && /dilaporkan/i.test(item.logTerakhir)) return "perbaikan_laporan"
  return "pengajuan"
}

// ---------------------------------------------------------------------------
// Status badge (non-clickable)
// ---------------------------------------------------------------------------
function StatusBadge({ status, jenisMenunggu, jenisButuhPerbaikan }: { status: StatusRujukan; jenisMenunggu?: "pengajuan" | "perbaikan" | "perbaikan_laporan" | "penonaktifan" | "pemulihan"; jenisButuhPerbaikan?: "ditolak" | "perbaikan" }) {
  if (status === "terverifikasi") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3" /> Terverifikasi
      </span>
    )
  }
  if (status === "menunggu") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        <Clock className="w-3 h-3" /> Perlu Verifikasi
      </span>
    )
  }
  if (status === "butuh_perbaikan") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <XCircle className="w-3 h-3" /> Ditolak
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
      <XCircle className="w-3 h-3" /> Nonaktif
    </span>
  )
}

// ---------------------------------------------------------------------------
// Detail slide-over panel
// ---------------------------------------------------------------------------
function DetailPanel({
  item,
  dinasNamaForLog,
  onClose,
  onVerify,
  onUnverify,
  onEdit,
  onDelete,
  onRestore,
  onNeedRevision,
  onTolakPenonaktifan,
  onTolakLaporan,
  onTolakPemulihan,
}: {
  item: SumberRujukan
  dinasNamaForLog: string
  onClose: () => void
  onVerify: (id: string) => void
  onUnverify: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string, catatan: string) => void
  onRestore: (id: string) => void
  onNeedRevision: (id: string, catatan: string, jenis: "ditolak" | "perbaikan") => void
  onTolakPenonaktifan: (id: string, catatan: string) => void
  onTolakLaporan: (id: string, catatan: string) => void
  onTolakPemulihan: (id: string, catatan: string) => void
}) {
  const resolvedJenis = resolveJenisMenunggu(item)
  const [showRevisionModal, setShowRevisionModal] = useState(false)
  const [revisionModalMode, setRevisionModalMode] = useState<"tolak" | "tolak_penonaktifan" | "tolak_laporan" | "tolak_pemulihan">("tolak")
  const [revisionNotes, setRevisionNotes] = useState("")
  const [showNonaktifModal, setShowNonaktifModal] = useState(false)
  const [nonaktifNotes, setNonaktifNotes] = useState("")
  const kategoriCfg = KATEGORI_CONFIG[item.kategoriBentukDukungan]
  const penyediaCfg = item.kategoriPenyedia ? PENYEDIA_CONFIG[item.kategoriPenyedia] : null
  const alamat = [item.namaJalan, item.nomorJalan, item.kelurahan, item.kecamatan, item.alamatKota ?? (item.kabupatenKota !== "Seluruh Indonesia" ? item.kabupatenKota : null), item.alamatProvinsi ?? (item.provinsi !== "Seluruh Indonesia" ? item.provinsi : null), item.kodePos]
    .filter(Boolean).join(", ")

  const handleSubmitRevision = () => {
    if (revisionNotes.trim()) {
      if (revisionModalMode === "tolak_penonaktifan") {
        onTolakPenonaktifan(item.id, revisionNotes.trim())
      } else if (revisionModalMode === "tolak_laporan") {
        onTolakLaporan(item.id, revisionNotes.trim())
      } else if (revisionModalMode === "tolak_pemulihan") {
        onTolakPemulihan(item.id, revisionNotes.trim())
      } else {
        onNeedRevision(item.id, revisionNotes.trim(), "ditolak")
      }
      setShowRevisionModal(false)
      setRevisionNotes("")
    }
  }

  const handleSubmitNonaktif = () => {
    onDelete(item.id, nonaktifNotes.trim())
    setShowNonaktifModal(false)
    setNonaktifNotes("")
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose}>
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
              {kategoriCfg.icon}
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">{item.namaInstansi}</h2>
              <StatusBadge status={item.status} jenisMenunggu={resolveJenisMenunggu(item)} jenisButuhPerbaikan={item.jenisButuhPerbaikan} />
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Log Terakhir - selalu tampil */}
        <div className="px-5 py-3 bg-amber-50 border-b-2 border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-amber-700 uppercase">Status</p>
            <StatusBadge status={item.status} jenisMenunggu={resolveJenisMenunggu(item)} jenisButuhPerbaikan={item.jenisButuhPerbaikan} />
          </div>
          <p className="text-sm font-medium text-amber-900 mb-1">Isi Log Terakhir: {item.logTerakhir || "(Tidak ada)"}</p>
          {item.catatanPerbaikan ? (
            <p className="text-xs text-amber-700 leading-relaxed">Catatan: {item.catatanPerbaikan}</p>
          ) : (
            <p className="text-xs text-amber-600 italic">(Tidak ada catatan)</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Kategori Dukungan</p>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                {kategoriCfg.label}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Kategori Penyedia</p>
              {item.kategoriPenyedia ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                  {item.kategoriPenyedia}
                </span>
              ) : <span className="text-gray-400 text-xs">-</span>}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Alamat</p>
            <div className="bg-gray-50 rounded-lg p-3 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 leading-relaxed">{alamat || "-"}</p>
            </div>
            {item.tautanGoogleMaps && (
              <a href={item.tautanGoogleMaps} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-600 hover:underline">
                <ExternalLink className="w-3.5 h-3.5" /> Lihat di Google Maps
              </a>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Kontak</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Call Center</p>
                  <p className="text-sm font-medium text-gray-900">{item.nomorCallCenter}</p>
                </div>
              </div>
              {item.nomorCallCenter2 && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Call Center 2</p>
                    <p className="text-sm font-medium text-gray-900">{item.nomorCallCenter2}</p>
                  </div>
                </div>
              )}
              {item.nomorPribadi && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                  <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Nomor Pribadi</p>
                    <p className="text-sm font-medium text-gray-900">{item.nomorPribadi}</p>
                  </div>
                </div>
              )}
              {item.website && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                  <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Website</p>
                    <a href={item.website} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline break-all">{item.website}</a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Aksi</p>
            <div className="flex flex-col gap-2 w-full">
              {item.status === "nonaktif" ? (
                <button
                  onClick={() => onRestore(item.id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition w-full"
                >
                  <RotateCcw className="w-4 h-4" /> Pulihkan
                </button>
              ) : item.status === "butuh_perbaikan" ? (
                <button
                  onClick={() => onEdit(item.id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition w-full"
                >
                  <Pencil className="w-4 h-4" /> Perbaiki Sumber Dukungan
                </button>
              ) : item.status === "menunggu" ? (
                <>
                  {resolvedJenis === "penonaktifan" ? (
                    <>
                      <button
                        onClick={() => onDelete(item.id, "")}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition w-full border border-green-200"
                      >
                        <CheckCircle className="w-4 h-4" /> Terima Penonaktifan
                      </button>
                      <button
                        onClick={() => { setRevisionModalMode("tolak_penonaktifan"); setShowRevisionModal(true) }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition w-full border border-red-200"
                      >
                        <XCircle className="w-4 h-4" /> Tolak
                      </button>
                    </>
                  ) : resolvedJenis === "perbaikan_laporan" ? (
                    <>
                      <button
                        onClick={() => onNeedRevision(item.id, "", "ditolak")}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition w-full border border-green-200"
                      >
                        <CheckCircle className="w-4 h-4" /> Terima Laporan
                      </button>
                      <button
                        onClick={() => { setRevisionModalMode("tolak_laporan"); setShowRevisionModal(true) }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition w-full border border-red-200"
                      >
                        <XCircle className="w-4 h-4" /> Tolak
                      </button>
                    </>
                  ) : resolvedJenis === "pemulihan" ? (
                    <>
                      <button
                        onClick={() => onRestore(item.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 transition w-full border border-teal-200"
                      >
                        <CheckCircle className="w-4 h-4" /> Terima Pemulihan
                      </button>
                      <button
                        onClick={() => { setRevisionModalMode("tolak_pemulihan"); setShowRevisionModal(true) }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition w-full border border-red-200"
                      >
                        <XCircle className="w-4 h-4" /> Tolak
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onVerify(item.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition w-full border border-green-200"
                      >
                        <CheckCircle className="w-4 h-4" /> {resolvedJenis === "perbaikan" ? "Terima Perbaikan" : "Terima Pengajuan"}
                      </button>
                      <button
                        onClick={() => { setRevisionModalMode("tolak"); setShowRevisionModal(true) }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition w-full border border-red-200"
                      >
                        <XCircle className="w-4 h-4" /> Tolak
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => onEdit(item.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition w-full border border-blue-200"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => setShowNonaktifModal(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition w-full"
                  >
                    <Trash2 className="w-4 h-4" /> Nonaktifkan
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revision Notes Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRevisionModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {revisionModalMode === "tolak_penonaktifan" ? "Tolak Penonaktifan" : revisionModalMode === "tolak_laporan" ? "Tolak Laporan" : revisionModalMode === "tolak_pemulihan" ? "Tolak Pemulihan" : "Tolak"}
                </h3>
                <p className="text-xs text-gray-500">
                  {revisionModalMode === "tolak_penonaktifan"
                    ? "Tuliskan alasan penolakan usulan penonaktifan"
                    : revisionModalMode === "tolak_laporan"
                    ? "Tuliskan alasan penolakan laporan perbaikan"
                    : revisionModalMode === "tolak_pemulihan"
                    ? "Tuliskan alasan penolakan usulan pemulihan"
                    : "Tuliskan alasan penolakan"}
                </p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan untuk sekolah
                </label>
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Contoh: Mohon lengkapi alamat lengkap dan nomor call center..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  rows={4}
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowRevisionModal(false); setRevisionNotes(""); setRevisionModalMode("tolak") }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitRevision}
                disabled={!revisionNotes.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700"
              >
                {revisionModalMode === "tolak_penonaktifan" ? "Tolak Penonaktifan" : revisionModalMode === "tolak_laporan" ? "Tolak Laporan" : revisionModalMode === "tolak_pemulihan" ? "Tolak Pemulihan" : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nonaktif Modal */}
      {showNonaktifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNonaktifModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Nonaktifkan Sumber Dukungan</h3>
                <p className="text-xs text-gray-500">Tuliskan alasan mengapa dinonaktifkan</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alasan nonaktif
                </label>
                <textarea
                  value={nonaktifNotes}
                  onChange={(e) => setNonaktifNotes(e.target.value)}
                  placeholder="Contoh: Data tidak valid atau sudah tidak beroperasi..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  rows={4}
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowNonaktifModal(false); setNonaktifNotes("") }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitNonaktif}
                disabled={!nonaktifNotes.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Nonaktifkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// ---------------------------------------------------------------------------
// Provinsi list for filter
// ---------------------------------------------------------------------------
const PROVINSI_LIST = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau",
  "Jambi", "Bengkulu", "Sumatera Selatan", "Kepulauan Bangka Belitung", "Lampung",
  "DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur",
  "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
  "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat", "Sulawesi Selatan", "Sulawesi Tenggara",
  "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur",
  "Maluku", "Maluku Utara", "Papua Barat", "Papua",
]

type SortMode = "relevansi" | "terbaru" | "nama_az"

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------
export function SumberRujukanView({ wilayahDinas }: { wilayahDinas?: { provinsi: string; kabupatenKota: string } }) {
  const router = useRouter()
  const dinasNamaLog = getDinasNamaForLogs()

  // Wilayah dinas dari prop atau fallback ke Aceh / Banda Aceh
  const myProvinsi = wilayahDinas?.provinsi ?? "Aceh"
  const myKabupatenKota = wilayahDinas?.kabupatenKota ?? "Banda Aceh"
  const auth = readAuthSession()
  const isPusat = auth?.role === "pusat"

  const [list, setList] = useState<SumberRujukan[]>(SEED)
  const [search, setSearch] = useState("")
  const [filterWilayah, setFilterWilayah] = useState<{ province: string; kabupaten: string } | null>(isPusat ? null : { province: myProvinsi, kabupaten: myKabupatenKota })
  const [filterKategori, setFilterKategori] = useState<KategoriDukungan | "semua">("semua")
  const [filterStatus, setFilterStatus] = useState<StatusRujukan | "semua">("semua")
  const [filterPenyedia, setFilterPenyedia] = useState<KategoriPenyedia | "semua">("semua")
  const [sortMode, setSortMode] = useState<SortMode>("terbaru")
  const [selected, setSelected] = useState<SumberRujukan | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [showWilayahModal, setShowWilayahModal] = useState(false)
  const [showStats, setShowStats] = useState(true)

  useEffect(() => {
    const loadData = () => {
      try {
        const raw = localStorage.getItem("rujukanList")
        let stored: Array<Partial<SumberRujukan> & { id: string }> = []
        if (raw != null && raw !== "") {
          const parsed = JSON.parse(raw) as unknown
          if (Array.isArray(parsed)) stored = parsed as Array<Partial<SumberRujukan> & { id: string }>
        }
        const storedMap = new Map(stored.map((i) => [i.id, i]))
        const seedMerged = SEED.map((s) => (storedMap.has(s.id) ? { ...s, ...storedMap.get(s.id) } : s)) as SumberRujukan[]
        const newItems = stored.filter((i) => !SEED.find((s) => s.id === i.id)) as SumberRujukan[]
        const merged = [...seedMerged, ...newItems]
        setList(merged.length > 0 ? merged : [...SEED])
      } catch {
        setList([...SEED])
      }
    }

    loadData()

    // storage fires in other tabs; rujukanUpdated fires in the same tab from RujukanForm
    const onStorage = (e: StorageEvent) => { if (e.key === "rujukanList") loadData() }
    window.addEventListener("storage", onStorage)
    window.addEventListener("rujukanUpdated", loadData)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("rujukanUpdated", loadData)
    }
  }, [])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterWilayah, filterKategori, filterStatus, filterPenyedia, sortMode])

  const filtered = list
    .filter((item) => {
      const matchSearch =
        search.trim() === "" ||
        item.namaInstansi.toLowerCase().includes(search.toLowerCase()) ||
        item.kabupatenKota.toLowerCase().includes(search.toLowerCase()) ||
        item.provinsi.toLowerCase().includes(search.toLowerCase())
      const isNasionalItem = item.isNasional || item.provinsi === "Seluruh Indonesia" || (!item.provinsi && !item.kabupatenKota)
      const matchWilayah = !filterWilayah || isNasionalItem ||
        (filterWilayah.province === item.provinsi && (!filterWilayah.kabupaten || !item.kabupatenKota || item.kabupatenKota === filterWilayah.kabupaten))
      const matchKategori = filterKategori === "semua" || item.kategoriBentukDukungan === filterKategori
      const matchStatus = filterStatus === "semua" ? item.status !== "menunggu_review" : item.status === filterStatus
      const matchPenyedia = filterPenyedia === "semua" || item.kategoriPenyedia === filterPenyedia
      return matchSearch && matchWilayah && matchKategori && matchStatus && matchPenyedia
    })
    .sort((a, b) => {
      if (sortMode === "nama_az") return a.namaInstansi.localeCompare(b.namaInstansi)
      if (sortMode === "terbaru") {
        if (a.createdAt && !b.createdAt) return -1
        if (!a.createdAt && b.createdAt) return 1
        return (b.createdAt ?? b.id).localeCompare(a.createdAt ?? a.id)
      }
      // relevansi: wilayah sendiri → provinsi sama → lainnya
      const rankA = a.kabupatenKota === myKabupatenKota && a.provinsi === myProvinsi ? 0 : a.provinsi === myProvinsi ? 1 : 2
      const rankB = b.kabupatenKota === myKabupatenKota && b.provinsi === myProvinsi ? 0 : b.provinsi === myProvinsi ? 1 : 2
      return rankA - rankB
    })

  // Pagination calculations
  const totalRows = filtered.length
  const totalPages = Math.ceil(totalRows / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows)
  const paginatedData = filtered.slice(startIndex, endIndex)

  const persistRujukanPatch = (id: string, patch: Partial<SumberRujukan> & { status?: StatusRujukan }) => {
    try {
      const stored: Array<Record<string, unknown> & { id: string }> = JSON.parse(localStorage.getItem("rujukanList") ?? "[]")
      const idx = stored.findIndex((row) => row.id === id)
      if (idx >= 0) {
        stored[idx] = { ...stored[idx], ...patch, id }
      } else {
        const seed = SEED.find((s) => s.id === id)
        stored.push({ ...(seed ?? { id }), ...patch, id } as Record<string, unknown> & { id: string })
      }
      localStorage.setItem("rujukanList", JSON.stringify(stored))
      window.dispatchEvent(new CustomEvent("rujukanUpdated"))
    } catch { /* ignore */ }
  }

  const handleVerify = (id: string) => {
    const isPusat = readAuthSession()?.role === "pusat"
    const log = isPusat ? RUJUKAN_LOG.diverifikasiPusat : dinasLog.diverifikasi(dinasNamaLog)
    persistRujukanPatch(id, { status: "terverifikasi", logTerakhir: log, jenisMenunggu: undefined })
    setList((prev) => prev.map((i) =>
      i.id === id ? { ...i, status: "terverifikasi" as StatusRujukan, logTerakhir: log, jenisMenunggu: undefined } : i
    ))
  }

  const handleUnverify = (id: string) => {
    const isPusat = readAuthSession()?.role === "pusat"
    const log = isPusat ? RUJUKAN_LOG.batalkanVerifikasiPusat : dinasLog.batalkanVerifikasi(dinasNamaLog)
    persistRujukanPatch(id, { status: "menunggu", logTerakhir: log })
    setList((prev) => prev.map((i) =>
      i.id === id ? { ...i, status: "menunggu" as StatusRujukan, logTerakhir: log } : i
    ))
  }

  const handleDelete = (id: string, catatan: string) => {
    const isPusat = readAuthSession()?.role === "pusat"
    const log = isPusat ? RUJUKAN_LOG.dinonaktifkanPusat : dinasLog.dinonaktifkan(dinasNamaLog)
    persistRujukanPatch(id, { status: "nonaktif", logTerakhir: log, catatanPerbaikan: catatan })
    setList((prev) => prev.map((i) =>
      i.id === id ? { ...i, status: "nonaktif" as StatusRujukan, logTerakhir: log, catatanPerbaikan: catatan } : i
    ))
  }

  const handleRestore = (id: string) => {
    const item = list.find((i) => i.id === id)
    if (!item) return
    const nextStatus = getStatusAfterRestore(item.usulanDari)
    const isPusat = readAuthSession()?.role === "pusat"
    const logTerakhir = isPusat ? RUJUKAN_LOG.dipulihkanPusat : dinasLog.dipulihkan(dinasNamaLog)
    persistRujukanPatch(id, { status: nextStatus, logTerakhir })
    setList((prev) => prev.map((i) =>
      i.id === id ? { ...i, status: nextStatus, logTerakhir } : i
    ))
  }

  const handleNeedRevision = (id: string, catatan: string, jenis: "ditolak" | "perbaikan" = "ditolak") => {
    const isPusat = readAuthSession()?.role === "pusat"
    const log = jenis === "perbaikan"
      ? (isPusat ? "Butuh perbaikan oleh Admin Pusat" : `Butuh perbaikan oleh Admin ${dinasNamaLog}`)
      : (isPusat ? "Ditolak oleh Admin Pusat" : dinasLog.butuhPerbaikan(dinasNamaLog))
    persistRujukanPatch(id, {
      status: "butuh_perbaikan" as StatusRujukan,
      logTerakhir: log,
      catatanPerbaikan: catatan,
      jenisButuhPerbaikan: jenis,
      jenisMenunggu: undefined,
    })
    setList((prev) => prev.map((i) =>
      i.id === id ? { ...i, status: "butuh_perbaikan" as StatusRujukan, logTerakhir: log, catatanPerbaikan: catatan, jenisButuhPerbaikan: jenis, jenisMenunggu: undefined } : i
    ))
  }

  const handleTolakPenonaktifan = (id: string, catatan: string) => {
    const isPusat = readAuthSession()?.role === "pusat"
    const log = `Usulan penonaktifan ditolak oleh Admin ${isPusat ? "Pusat" : dinasNamaLog}`
    persistRujukanPatch(id, { status: "terverifikasi", logTerakhir: log, catatanPerbaikan: catatan, jenisMenunggu: undefined })
    setList((prev) => prev.map((i) =>
      i.id === id ? { ...i, status: "terverifikasi" as StatusRujukan, logTerakhir: log, catatanPerbaikan: catatan, jenisMenunggu: undefined } : i
    ))
  }

  const handleTolakLaporan = (id: string, catatan: string) => {
    const isPusat = readAuthSession()?.role === "pusat"
    const log = `Laporan perbaikan ditolak oleh Admin ${isPusat ? "Pusat" : dinasNamaLog}`
    persistRujukanPatch(id, { status: "terverifikasi", logTerakhir: log, catatanPerbaikan: catatan, jenisMenunggu: undefined })
    setList((prev) => prev.map((i) =>
      i.id === id ? { ...i, status: "terverifikasi" as StatusRujukan, logTerakhir: log, catatanPerbaikan: catatan, jenisMenunggu: undefined } : i
    ))
  }

  const handleTolakPemulihan = (id: string, catatan: string) => {
    const isPusat = readAuthSession()?.role === "pusat"
    const log = `Usulan pemulihan ditolak oleh Admin ${isPusat ? "Pusat" : dinasNamaLog}`
    persistRujukanPatch(id, { status: "nonaktif", logTerakhir: log, catatanPerbaikan: catatan, jenisMenunggu: undefined })
    setList((prev) => prev.map((i) =>
      i.id === id ? { ...i, status: "nonaktif" as StatusRujukan, logTerakhir: log, catatanPerbaikan: catatan, jenisMenunggu: undefined } : i
    ))
  }

  const handleEdit = (id: string) => router.push(`/sumber-rujukan/form?edit=${id}`)

  const exportToCSV = () => {
    const headers = [
      "Nama Instansi", "Kategori Dukungan", "Kategori Penyedia",
      "Provinsi", "Kabupaten/Kota", "Alamat",
      "Nomor Call Center", "Nomor Pribadi", "Nomor Call Center 2", "Website",
      "Akses Informasi", "Status", "Dibuat Oleh",
      "Alamat Kota", "Alamat Provinsi",
    ]
    const rows = filtered.map((item) => [
      item.namaInstansi,
      item.kategoriBentukDukungan,
      item.kategoriPenyedia ?? "",
      item.provinsi ?? "",
      item.kabupatenKota ?? "",
      [item.namaJalan, item.nomorJalan, item.kodePos].filter(Boolean).join(" "),
      item.nomorCallCenter ?? "",
      item.nomorPribadi ?? "",
      item.nomorCallCenter2 ?? "",
      item.website ?? "",
      item.aksesInfo === "publik" ? "Publik" : "Terbatas",
      item.status,
      item.dibuatOleh ?? "",
      item.alamatKota ?? "",
      item.alamatProvinsi ?? "",
    ])
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const scopeLabel = filterWilayah
      ? [filterWilayah.kabupaten || null, filterWilayah.province].filter(Boolean).join("-").replace(/\s+/g, "-")
      : "Semua"
    a.href = url
    a.download = `Sumber-Dukungan-${scopeLabel}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const PROVINSI_OPTIONS = [
    "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau",
    "Jambi", "Sumatera Selatan", "Kepulauan Bangka Belitung", "Bengkulu",
    "Lampung", "DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah",
    "DI Yogyakarta", "Jawa Timur", "Bali", "Nusa Tenggara Barat",
    "Nusa Tenggara Timur", "Kalimantan Barat", "Kalimantan Tengah",
    "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
    "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat",
    "Sulawesi Selatan", "Sulawesi Tenggara", "Maluku", "Maluku Utara",
    "Papua Barat", "Papua",
  ]
  const KATEGORI_DUKUNGAN_OPTIONS: KategoriDukungan[] = [
    "Fasilitas Kesehatan", "Konseling", "Bantuan Hukum",
    "Kepolisian", "Psikologi", "Pendidikan", "Sosial", "Lainnya",
  ]
  const KATEGORI_PENYEDIA_OPTIONS: KategoriPenyedia[] = [
    "Pemerintah Pusat", "Pemerintah Daerah", "Swasta", "OMS", "Lainnya",
  ]

  const downloadTemplate = () => {
    const headers = [
      "Nama Instansi", "Kategori Dukungan", "Kategori Penyedia",
      "Provinsi", "Kabupaten/Kota", "Kecamatan",
      "Kelurahan", "Nama Jalan", "Nomor Jalan", "Kode Pos",
      "Tautan Google Maps", "Nomor Call Center", "Nomor Pribadi",
      "Website", "Akses Informasi",
    ]
    const sampleRows = [
      ["RSUD示例", "Fasilitas Kesehatan", "Pemerintah Daerah", "Aceh", "Banda Aceh", "", "", "", "", "", "", "", "0651123456", "", "", "Publik"],
      ["Puskesmas示例", "Fasilitas Kesehatan", "Pemerintah Daerah", "Aceh", "Banda Aceh", "Baiturrahman", "Peunayong", "Jl. Sri Ratu", "", "", "", "0651987654", "", "", "Publik"],
      ["LBH示例", "Bantuan Hukum", "OMS", "Aceh", "Banda Aceh", "", "", "Jl. T. Daud", "No. 5", "", "", "", "0651123456", "0812xxxx", "www.example.org", "Terbatas"],
    ]
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csv = [headers, ...sampleRows].map((row) => row.map(escape).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "template-sumber-dukungan.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "")
    if (lines.length === 0) return { headers: [], rows: [] }
    const parseRow = (row: string): string[] => {
      const result: string[] = []
      let current = ""
      let inQuotes = false
      for (let i = 0; i < row.length; i++) {
        const char = row[i]
        if (char === '"') {
          if (inQuotes && row[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === "," && !inQuotes) {
          result.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }
    const headers = parseRow(lines[0])
    const rows = lines.slice(1).map(parseRow).filter((row) => row.some((cell) => cell !== ""))
    return { headers, rows }
  }

  const validateRow = (row: string[], rowIndex: number): { valid: boolean; errors: string[]; data: Partial<SumberRujukan> } => {
    const errors: string[] = []
    const h = row
    const get = (idx: number) => h[idx] ?? ""

    const namaInstansi = get(0).trim()
    const kategoriDukungan = get(1).trim() as KategoriDukungan
    const kategoriPenyedia = get(2).trim() as KategoriPenyedia
    const provinsi = get(3).trim()
    const kabupatenKota = get(4).trim()
    const kecamatan = get(5).trim()
    const kelurahan = get(6).trim()
    const namaJalan = get(7).trim()
    const nomorJalan = get(8).trim()
    const kodePos = get(9).trim()
    const tautanGoogleMaps = get(10).trim()
    const nomorCallCenter = get(11).trim()
    const nomorPribadi = get(12).trim()
    const website = get(13).trim()
    const aksesInfoRaw = get(14).trim()
    const aksesInfo: "publik" | "terbatas" = aksesInfoRaw === "Terbatas" ? "terbatas" : "publik"
    const nomorCallCenter2 = get(15).trim()
    const alamatKota = get(16).trim()
    const alamatProvinsi = get(17).trim()

    if (!namaInstansi) errors.push(`Baris ${rowIndex + 1}: "Nama Instansi" wajib diisi`)
    if (!kategoriDukungan || !KATEGORI_DUKUNGAN_OPTIONS.includes(kategoriDukungan)) {
      errors.push(`Baris ${rowIndex + 1}: "Kategori Dukungan" tidak valid (gunakan: ${KATEGORI_DUKUNGAN_OPTIONS.join(", ")})`)
    }
    if (!kategoriPenyedia || !KATEGORI_PENYEDIA_OPTIONS.includes(kategoriPenyedia)) {
      errors.push(`Baris ${rowIndex + 1}: "Kategori Penyedia" tidak valid (gunakan: ${KATEGORI_PENYEDIA_OPTIONS.join(", ")})`)
    }
    if (!provinsi || !PROVINSI_OPTIONS.includes(provinsi)) {
      errors.push(`Baris ${rowIndex + 1}: "Provinsi" tidak valid`)
    }
    if (!kabupatenKota) errors.push(`Baris ${rowIndex + 1}: "Kabupaten/Kota" wajib diisi`)
    if (!nomorCallCenter) errors.push(`Baris ${rowIndex + 1}: "Nomor Call Center" wajib diisi`)

    return {
      valid: errors.length === 0,
      errors,
      data: {
        namaInstansi,
        kategoriBentukDukungan: kategoriDukungan as KategoriDukungan,
        kategoriPenyedia: kategoriPenyedia as KategoriPenyedia,
        provinsi,
        kabupatenKota,
        kecamatan,
        kelurahan,
        namaJalan,
        nomorJalan,
        kodePos,
        tautanGoogleMaps,
        nomorCallCenter,
        nomorCallCenter2,
        nomorPribadi,
        website,
        aksesInfo,
        alamatKota,
        alamatProvinsi,
      },
    }
  }

  const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const { headers, rows } = parseCSV(text)

        if (headers.length === 0 || rows.length === 0) {
          setImportError({ show: true, message: "File tidak valid atau kosong", errors: [] })
          return
        }

        const validItems: SumberRujukan[] = []
        const allErrors: string[] = []

        rows.forEach((row, idx) => {
          const { valid, errors, data } = validateRow(row, idx)
          if (valid) {
            const newItem: SumberRujukan = {
              id: `sr-${Date.now()}-${idx}`,
              namaInstansi: data.namaInstansi!,
              kategoriBentukDukungan: data.kategoriBentukDukungan!,
              kategoriPenyedia: data.kategoriPenyedia!,
              provinsi: data.provinsi!,
              kabupatenKota: data.kabupatenKota!,
              kecamatan: data.kecamatan,
              kelurahan: data.kelurahan,
              namaJalan: data.namaJalan,
              nomorJalan: data.nomorJalan,
              kodePos: data.kodePos,
              tautanGoogleMaps: data.tautanGoogleMaps,
              nomorCallCenter: data.nomorCallCenter!,
              nomorCallCenter2: data.nomorCallCenter2,
              nomorPribadi: data.nomorPribadi,
              website: data.website,
              alamatKota: data.alamatKota,
              alamatProvinsi: data.alamatProvinsi,
              aksesInfo: data.aksesInfo ?? "publik",
              status: "terverifikasi",
              dibuatOleh: "Admin Pusat",
              logTerakhir: RUJUKAN_LOG.dibuatTerverifikasiPusat,
              usulanDari: "pusat",
              createdAt: new Date().toISOString(),
            }
            validItems.push(newItem)
          } else {
            allErrors.push(...errors)
          }
        })

        if (validItems.length > 0) {
          try {
            const stored = JSON.parse(localStorage.getItem("rujukanList") ?? "[]") as Array<Record<string, unknown>>
            localStorage.setItem("rujukanList", JSON.stringify([...stored, ...validItems]))
            window.dispatchEvent(new CustomEvent("rujukanUpdated"))
          } catch { /* ignore */ }
        }

        if (allErrors.length > 0) {
          setImportError({ show: true, message: `${validItems.length} berhasil, ${allErrors.length} gagal`, errors: allErrors })
        } else if (validItems.length === 0) {
          setImportError({ show: true, message: "Tidak ada data yang valid", errors: allErrors })
        } else {
          setImportSuccess({ show: true, count: validItems.length })
        }
      } catch {
        setImportError({ show: true, message: "Gagal membaca file", errors: [] })
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const [importError, setImportError] = useState<{ show: boolean; message: string; errors: string[] }>({ show: false, message: "", errors: [] })
  const [importSuccess, setImportSuccess] = useState<{ show: boolean; count: number }>({ show: false, count: 0 })

  const statKeys: KategoriDukungan[] = [
    "Fasilitas Kesehatan", "Konseling", "Bantuan Hukum", "Kepolisian",
    "Psikologi", "Pendidikan", "Sosial", "Lainnya"
  ]
  const statList = isPusat 
    ? list 
    : list.filter((i) => i.provinsi === myProvinsi && i.kabupatenKota === myKabupatenKota)

  return (
    <div className="space-y-5">
      {/* Heading */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Sumber Dukungan</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Daftar kontak layanan untuk membangun lingkungan sekolah yang aman, nyaman, dan inklusif</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Template & Import - only for Admin Pusat */}
          {isPusat && (
            <>
              <button
                type="button"
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition"
              >
                <FileSpreadsheet className="w-4 h-4" /> Template
              </button>
              <label className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition cursor-pointer">
                <Upload className="w-4 h-4" /> Import
                <input type="file" accept=".csv,.xlsx,.xls" onChange={importExcel} className="hidden" />
              </label>
              <div className="w-px h-7 bg-gray-200" />
            </>
          )}
          {/* Add New - Primary Action */}
          <button
            onClick={() => router.push("/sumber-rujukan/form")}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Wilayah Display with Stats Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-lg">Wilayah:</span>
          {filterWilayah ? (
            <span className="font-bold text-gray-900 text-lg">
              {filterWilayah.kabupaten 
                ? `${filterWilayah.province} - ${filterWilayah.kabupaten}` 
                : filterWilayah.province}
            </span>
          ) : (
            <span className="font-bold text-gray-500 text-lg">
              Semua Wilayah
            </span>
          )}
          <button
            onClick={() => setShowWilayahModal(true)}
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium text-sm px-2 py-1 rounded-md transition"
          >
            Ganti
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Statistik:</span>
          <button
            onClick={() => setShowStats(!showStats)}
            className={`relative w-10 h-5 rounded-full transition-colors ${showStats ? "bg-blue-600" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${showStats ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {/* Stat cards - only show if showStats is true */}
      {showStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statKeys.map((key) => {
          const cfg = KATEGORI_CONFIG[key]
          const count = filtered.filter((i) => i.kategoriBentukDukungan === key && i.status !== "nonaktif").length
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full ${cfg.bg} ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                {cfg.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 leading-tight">{cfg.label}</p>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ketik nama instansi atau kota"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Sort + Filter + Ekspor */}
      <div className="flex flex-row items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 bg-white">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="text-sm focus:outline-none bg-transparent text-gray-700"
          >
            <option value="terbaru">Terbaru</option>
            <option value="nama_az">Nama A–Z</option>
          </select>
        </div>
        <div className="w-px h-6 bg-gray-200" />
        <Select value={filterKategori} onValueChange={(v) => setFilterKategori(v as KategoriDukungan | "semua")}>
          <SelectTrigger className="w-[180px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Kategori</SelectItem>
            {(Object.keys(KATEGORI_CONFIG) as KategoriDukungan[]).map((k) => (
              <SelectItem key={k} value={k}>{k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as StatusRujukan | "semua")}>
          <SelectTrigger className="w-[180px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="terverifikasi">Terverifikasi</SelectItem>
            <SelectItem value="menunggu">Perlu Verifikasi</SelectItem>
            <SelectItem value="nonaktif">Nonaktif</SelectItem>
            <SelectItem value="butuh_perbaikan">Ditolak</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPenyedia} onValueChange={(v) => setFilterPenyedia(v as KategoriPenyedia | "semua")}>
          <SelectTrigger className="w-[180px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <SelectValue placeholder="Semua Penyedia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Penyedia</SelectItem>
            {(["Pemerintah Pusat", "Pemerintah Daerah", "Swasta", "OMS", "Lainnya"] as KategoriPenyedia[]).map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="w-px h-6 bg-gray-200" />
        <button
          type="button"
          onClick={exportToCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" /> Ekspor CSV
        </button>
      </div>

      {/* Table */}
      {totalRows === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="font-semibold text-gray-700 text-sm">Data Tidak Tersedia</p>
          <p className="text-gray-500 text-xs mt-1">Coba ubah filter atau kata kunci pencarian.</p>
        </div>
      ) : (
        <>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama Instansi</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Wilayah</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Log Terakhir</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((item) => {
                  const kategoriCfg = KATEGORI_CONFIG[item.kategoriBentukDukungan]
                  const penyediaCfg = item.kategoriPenyedia ? PENYEDIA_CONFIG[item.kategoriPenyedia] : null
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.status === "nonaktif" ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-gray-900 whitespace-nowrap">{item.namaInstansi}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 whitespace-nowrap">
                            {kategoriCfg.label}
                          </span>
                          {item.kategoriPenyedia && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 whitespace-nowrap">
                              {item.kategoriPenyedia}
                            </span>
                          )}
                          {item.website && (
                            <a href={item.website} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:underline whitespace-nowrap">
                              <Globe className="w-3 h-3" /> Website
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-gray-800 whitespace-nowrap">{item.isNasional || item.provinsi === "Seluruh Indonesia" ? "Nasional" : `${getWilayahType(item.kabupatenKota)} ${item.kabupatenKota}`}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-gray-600 max-w-[220px] leading-relaxed">{formatLogTerakhirDisplay(item, dinasNamaLog)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status} jenisMenunggu={resolveJenisMenunggu(item)} jenisButuhPerbaikan={item.jenisButuhPerbaikan} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <a
                          href={`/sumber-rujukan/form?view=${item.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Cek Detail
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {totalRows > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-gray-200">
            {/* Info & Rows per page */}
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>
                Menampilkan {startIndex + 1}-{endIndex} dari {totalRows}
              </span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}
                className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="hidden sm:inline">baris/halaman</span>
            </div>
            {/* Page Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Halaman pertama"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Halaman sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm text-gray-600">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Halaman berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Halaman terakhir"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        </>
      )}

      {/* Detail slide-over */}
      {selected && (
        <DetailPanel
          item={selected}
          dinasNamaForLog={dinasNamaLog}
          onClose={() => setSelected(null)}
          onVerify={handleVerify}
          onUnverify={handleUnverify}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRestore={handleRestore}
          onNeedRevision={handleNeedRevision}
          onTolakPenonaktifan={handleTolakPenonaktifan}
          onTolakLaporan={handleTolakLaporan}
          onTolakPemulihan={handleTolakPemulihan}
        />
      )}

      {/* Import Error Modal */}
      {importError.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setImportError({ show: false, message: "", errors: [] })} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Import Gagal</h3>
                <p className="text-xs text-gray-500">{importError.message}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-2">
                {importError.errors.slice(0, 20).map((err, idx) => (
                  <p key={idx} className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>
                ))}
                {importError.errors.length > 20 && (
                  <p className="text-xs text-gray-500 text-center py-2">...dan {importError.errors.length - 20} error lainnya</p>
                )}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200">
              <button
                onClick={() => setImportError({ show: false, message: "", errors: [] })}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Success Modal */}
      {importSuccess.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setImportSuccess({ show: false, count: 0 })} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex flex-col items-center gap-3 px-5 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Import Berhasil</h3>
                <p className="text-sm text-gray-500 mt-1">{importSuccess.count} data sumber dukungan berhasil ditambahkan</p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200">
              <button
                onClick={() => setImportSuccess({ show: false, count: 0 })}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wilayah Modal - 2 columns */}
      {showWilayahModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowWilayahModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Filter Wilayah</h3>
              <button onClick={() => setShowWilayahModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {/* 2 Column Layout: Province | Kabupaten */}
            <div className="flex-1 overflow-hidden">
              <div className="flex h-full max-h-[400px]">
                {/* Left: Province List */}
                <div className="w-1/2 border-r border-gray-100 overflow-y-auto">
                  <div className="p-2">
                    {/* All Provinces Option */}
                    <button
                      onClick={() => { setFilterWilayah(null); setShowWilayahModal(false) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${!filterWilayah ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
                    >
                      Semua Provinsi
                    </button>
                    {PROVINSI_LIST.map((province) => {
                      const kabupatens = Array.from(new Set(list.filter((i) => i.provinsi === province).map((i) => i.kabupatenKota))).filter(Boolean).sort()
                      const isSelected = filterWilayah?.province === province
                      return (
                        <button
                          key={province}
                          onClick={() => setFilterWilayah({ province, kabupaten: "" })}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                            isSelected ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50"
                          }`}
                        >
                          <span className="truncate">{province}</span>
                          {kabupatens.length > 0 && <span className="text-xs text-gray-400">{kabupatens.length}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {/* Right: Kabupaten List */}
                <div className="w-1/2 overflow-y-auto bg-white">
                  <div className="p-2">
                    {filterWilayah ? (
                      (() => {
                        const kabupatens = Array.from(new Set(list.filter((i) => i.provinsi === filterWilayah.province).map((i) => i.kabupatenKota))).filter(Boolean).sort()
                        if (kabupatens.length === 0) {
                          return <p className="text-sm text-gray-400 p-3">Tidak ada kabupaten/kota</p>
                        }
                        return (
                          <>
                            <button
                              onClick={() => { setFilterWilayah({ province: filterWilayah.province, kabupaten: "" }); setShowWilayahModal(false) }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                                !filterWilayah.kabupaten ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100"
                              }`}
                            >
                              Semua Kabupaten/Kota
                            </button>
                            {kabupatens.map((kab) => (
                              <button
                                key={kab}
                                onClick={() => { setFilterWilayah({ province: filterWilayah.province, kabupaten: kab }); setShowWilayahModal(false) }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                                  filterWilayah?.kabupaten === kab ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100"
                                }`}
                              >
                                {kab}
                              </button>
                            ))}
                          </>
                        )
                      })()
                    ) : (
                      <p className="text-sm text-gray-400 p-3">Pilih province di kiri</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowWilayahModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={() => setShowWilayahModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
