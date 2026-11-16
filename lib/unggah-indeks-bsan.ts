"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/** Jenis data yang diunggah: skor satuan pendidikan atau skor dinas (provinsi dan kab/kota). */
export type BagianUnggah = "sekolah" | "dinas"

export const BAGIAN_UNGGAH: { id: BagianUnggah; label: string; deskripsi: string }[] = [
  { id: "sekolah", label: "Sekolah", deskripsi: "File CSV skor Indeks BSAN satuan pendidikan." },
  { id: "dinas", label: "Dinas", deskripsi: "File CSV skor Indeks BSAN dinas pendidikan provinsi dan kab/kota." },
]

export const labelBagian = (b: BagianUnggah) => BAGIAN_UNGGAH.find((x) => x.id === b)?.label ?? b
export type StatusUnggah = "Diproses" | "Berhasil" | "Gagal"

export interface Unggahan {
  id: string
  tahun: number
  bagian: BagianUnggah
  /** ISO 8601. */
  waktu: string
  namaFile: string
  pengunggah: string
  status: StatusUnggah
  /** Ringkasan hasil pemrosesan (alasan bila gagal). */
  pesan?: string
  jumlahBaris?: number
  barisBerhasil?: number
  /** Isi file yang diunggah. */
  isiAsli: string
  /** File balikan sistem: isi asli ditambah kolom status dan keterangan tiap baris. Kosong selama masih diproses. */
  isiHasil?: string
}

/** Tahun yang dapat dikelola datanya, terbaru lebih dulu. */
export const TAHUN_UNGGAH = [2027, 2026, 2025]

export const TEMPLATE_CSV: Record<BagianUnggah, { nama: string; isi: string; kolomWajib: [string, string] }> = {
  sekolah: {
    nama: "template_indeks_bsan_sekolah.csv",
    isi: "npsn;nama_sekolah;skor\r\n10100001;SDN 1 Contoh;7,5\r\n10100002;SMPN 2 Contoh;6,8",
    kolomWajib: ["NPSN", "skor"],
  },
  dinas: {
    nama: "template_indeks_bsan_dinas.csv",
    isi: "daerah;tingkat;skor\r\nAceh;Provinsi;6,9\r\nBanda Aceh;Kab/Kota;7,5",
    kolomWajib: ["daerah", "skor"],
  },
}

const KUNCI = "unggah-indeks-bsan"

type HasilProses = Required<Pick<Unggahan, "status" | "pesan" | "jumlahBaris" | "barisBerhasil" | "isiHasil">>

/**
 * Validasi contoh (demo): kolom `npsn` dan `skor` wajib; tiap baris harus punya NPSN 8 digit dan skor 0–10.
 * Menghasilkan status, ringkasan, dan file balikan berisi status tiap baris.
 */
export function prosesCsv(isi: string, bagian: BagianUnggah = "sekolah"): HasilProses {
  const baris = isi.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() && !l.toLowerCase().startsWith("sep="))
  const gagal = (pesan: string, jumlahBaris = 0): HasilProses => ({ status: "Gagal", pesan, jumlahBaris, barisBerhasil: 0, isiHasil: isi })
  if (baris.length === 0) return gagal("File kosong. Unggah file CSV yang berisi data.")

  const pemisah = [";", "\t", ","].find((p) => baris[0].includes(p)) ?? ";"
  const sel = (l: string) => l.split(pemisah).map((c) => c.trim().replace(/^"|"$/g, ""))
  const kepala = sel(baris[0]).map((c) => c.toLowerCase())
  // Nama kolom boleh bervariasi: "NPSN", "Skor Indeks BSAN", "skor_akhir", dan sebagainya.
  // Sekolah dikenali dari NPSN; dinas tidak punya NPSN sehingga dikenali dari nama daerahnya.
  const kolomKunci = bagian === "sekolah" ? "NPSN" : "daerah"
  const iNpsn = kepala.findIndex((c) => (bagian === "sekolah" ? c.includes("npsn") : ["daerah", "kab", "provinsi", "wilayah", "dinas"].some((k) => c.includes(k))))
  const iSkor = [(c: string) => c === "skor", (c: string) => c.includes("skor"), (c: string) => c.includes("indeks") || c.includes("nilai")]
    .map((cocok) => kepala.findIndex(cocok))
    .find((i) => i >= 0) ?? -1
  if (iNpsn < 0 || iSkor < 0) {
    return gagal(`Kolom wajib tidak ditemukan. Pastikan baris pertama memuat kolom ${kolomKunci} dan skor. Kolom yang terbaca: ${kepala.join(", ") || "(kosong)"}.`)
  }

  const data = baris.slice(1)
  if (data.length === 0) return gagal("File hanya berisi judul kolom, tidak ada data ${bagian}.")

  let berhasil = 0
  const hasil = data.map((l) => {
    const c = sel(l)
    const skor = Number((c[iSkor] ?? "").replace(",", "."))
    const npsn = c[iNpsn] ?? ""
    const alasan = npsn === "" || npsn === "-" ? `${kolomKunci === "NPSN" ? "NPSN" : "Nama daerah"} tidak boleh kosong` : c[iSkor] === "" || Number.isNaN(skor) || skor < 0 || skor > 10 ? "Skor harus angka 0–10" : ""
    if (!alasan) berhasil++
    return `${l}${pemisah}${alasan ? "Gagal" : "Berhasil"}${pemisah}${alasan}`
  })
  const isiHasil = [`${baris[0]}${pemisah}status${pemisah}keterangan`, ...hasil].join("\r\n")

  if (berhasil === 0) return { ...gagal(`Tidak ada baris yang dapat diproses dari ${data.length} baris. Pastikan kolom ${kolomKunci} terisi dan skor berupa angka 0–10.`, data.length), isiHasil }
  const sisa = data.length - berhasil
  return {
    status: "Berhasil",
    pesan: sisa === 0 ? `Semua ${data.length} baris berhasil diproses.` : `${berhasil} dari ${data.length} baris berhasil diproses; ${sisa} baris gagal dan perlu diperbaiki (lihat file setelah diproses).`,
    jumlahBaris: data.length,
    barisBerhasil: berhasil,
    isiHasil,
  }
}

function seed(): Unggahan[] {
  const buat = (id: string, tahun: number, waktu: string, namaFile: string, isiAsli: string, bagian: BagianUnggah = "sekolah"): Unggahan => ({
    id, tahun, bagian, waktu, namaFile, pengunggah: "admin.pusat", isiAsli, ...prosesCsv(isiAsli, bagian),
  })
  return [
    buat("seed-1", 2026, "2026-11-05T08:00:00", "skor_bsan_sekolah_2026_final.csv", "npsn;nama_sekolah;skor\r\n10100001;SDN 1 Banda Aceh;8,2\r\n10100002;SMPN 2 Banda Aceh;6,4\r\n10100003;SMAN 3 Bireuen;5,1"),
    buat("seed-2", 2026, "2026-11-04T16:20:00", "skor_bsan_sekolah_2026_revisi.csv", "npsn;nama_sekolah;skor\r\n10100001;SDN 1 Banda Aceh;8,2\r\n1010002;SMPN 2 Banda Aceh;6,4\r\n10100003;SMAN 3 Bireuen;11"),
    buat("seed-3", 2026, "2026-11-04T10:05:00", "data_sekolah_2026.csv", "nama_sekolah;nilai\r\nSDN 1 Banda Aceh;8,2"),
    buat("seed-5", 2026, "2026-11-03T14:10:00", "skor_bsan_dinas_2026.csv", "daerah;tingkat;skor\r\nAceh;Provinsi;6,9\r\nBanda Aceh;Kab/Kota;7,5\r\nBireuen;Kab/Kota;5,8", "dinas"),
    buat("seed-4", 2025, "2025-11-10T09:30:00", "skor_bsan_sekolah_2025.csv", "npsn;nama_sekolah;skor\r\n10100001;SDN 1 Banda Aceh;7,6\r\n10100002;SMPN 2 Banda Aceh;5,9"),
  ]
}

/** Riwayat unggahan, disimpan di localStorage (demo) agar tidak hilang saat berpindah menu. */
export function useUnggahan() {
  const [daftar, setDaftar] = useState<Unggahan[]>(seed)
  const siap = useRef(false)

  const selesaikan = useCallback((id: string) => {
    setDaftar((d) => d.map((u) => (u.id === id && u.status === "Diproses" ? { ...u, ...prosesCsv(u.isiAsli, u.bagian) } : u)))
  }, [])

  useEffect(() => {
    try {
      const mentah = localStorage.getItem(KUNCI)
      if (mentah) {
        const tersimpan = JSON.parse(mentah) as Unggahan[]
        setDaftar(tersimpan)
        // Unggahan yang masih "Diproses" saat halaman ditinggalkan diselesaikan sekarang.
        tersimpan.filter((u) => u.status === "Diproses").forEach((u) => setTimeout(() => selesaikan(u.id), 800))
      }
    } catch {}
    siap.current = true
  }, [selesaikan])

  useEffect(() => {
    if (!siap.current) return
    try {
      localStorage.setItem(KUNCI, JSON.stringify(daftar))
    } catch {}
  }, [daftar])

  const tambah = useCallback(
    (data: Pick<Unggahan, "tahun" | "bagian" | "namaFile" | "pengunggah" | "isiAsli">) => {
      const id = `u-${Date.now()}`
      setDaftar((d) => [{ ...data, id, waktu: new Date().toISOString(), status: "Diproses" }, ...d])
      setTimeout(() => selesaikan(id), 1500)
    },
    [selesaikan]
  )

  return { daftar, tambah }
}

/** "24/03/2025 11:12" */
export function formatWaktu(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function unduhCsv(nama: string, isi: string) {
  const url = URL.createObjectURL(new Blob(["﻿" + isi], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = nama
  a.click()
  URL.revokeObjectURL(url)
}
