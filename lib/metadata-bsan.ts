"use client"

import { useCallback, useEffect, useState } from "react"

/** Jenis data Indeks BSAN: satuan pendidikan (sekolah) atau dinas pendidikan (provinsi dan kab/kota). */
export type Jenis = "sekolah" | "dinas"
export const JENIS: { id: Jenis; label: string }[] = [
  { id: "sekolah", label: "Sekolah" },
  { id: "dinas", label: "Dinas" },
]
export const labelJenis = (j: Jenis) => (j === "sekolah" ? "Sekolah" : "Dinas")

export type TipeItem = "indeks" | "indikator" | "sub" | "aspek" | "aspek_ind" | "dokumen"
export type TipeNilai = "numeric" | "percentage" | "boolean" | "group" | "link" | ""

export const LABEL_ITEM: Record<TipeItem, string> = {
  indeks: "Indeks BSAN",
  indikator: "Indikator",
  sub: "Subindikator",
  aspek: "Aspek Tambahan",
  aspek_ind: "Indikator Aspek",
  dokumen: "Dokumen",
}
export const LABEL_NILAI: Record<Exclude<TipeNilai, "">, string> = {
  numeric: "Skala angka",
  percentage: "Persentase",
  boolean: "Ya / Tidak",
  group: "Kelompok",
  link: "Link dokumen",
}
const PREFIKS: Record<TipeItem, string> = { indeks: "IB", indikator: "I", sub: "SI", aspek: "AT", aspek_ind: "IAT", dokumen: "DOK" }

/**
 * Warna kategori: [latar, teks], satu wakil per warna. Hijau, kuning, merah, biru, dan abu dari Badge Seragam
 * (Success, Warning, Critical, Informational, Neutral). Ungu dan oranye tidak ada di Seragam (ungu paling dekat
 * dengan Soft Purple 20 palet ilustrasi, #CFC3E2) sehingga dibuat dengan rona itu dan kecerahan setara Badge
 * (OKLab L 0,86; Badge 0,856–0,952). Teks memakai gray-90 (#2F3031) seperti Badge.
 */
export const WARNA = {
  hijau: ["#9AE5B9", "#2F3031"],
  kuning: ["#FFDFA3", "#2F3031"],
  merah: ["#FFE9EA", "#2F3031"],
  biru: ["#98DAFB", "#2F3031"],
  ungu: ["#D7CAEA", "#2F3031"],
  oranye: ["#FFC5A3", "#2F3031"],
  abu: ["#EFEFEF", "#2F3031"],
} as const
export type Warna = keyof typeof WARNA

/** `f` dan `t` adalah batas bawah dan atas (teks, koma desimal diterima); `f === "kosong"` berarti kategori untuk data kosong. */
export interface Kategori { l: string; f: string; t: string; c: Warna }

export interface ItemMeta {
  id: string
  type: TipeItem
  judul: string
  desk: string
  nilai: TipeNilai
  min: number
  max: number
  kode: string
  /** Kode padanan di tahun sebelumnya (bila disalin). */
  prev: string | null
  kat: Kategori[]
  kids: ItemMeta[]
}

export interface Metadata {
  root: ItemMeta
  items: ItemMeta[]
  /** Penghitung nomor kode per awalan. */
  cnt: Record<string, number>
}

export type StatusFile = "Diproses" | "Berhasil" | "Gagal"

/** Link dokumen satu sekolah/daerah untuk satu kode dokumen, dibaca dari baris dokumen pada file data. */
export interface LinkDokumen {
  /** NPSN (sekolah) atau kode wilayah (dinas). */
  id: string
  nama: string
  /** Hanya dinas: "Provinsi" atau "Kab/Kota". */
  level?: string
  kode: string
  url: string
}

export interface FileData {
  id: string
  /** ISO 8601. */
  waktu: string
  jenis: Jenis
  nama: string
  pengunggah: string
  status: StatusFile
  /** Jumlah baris data yang berhasil dibaca. */
  n: number
  jumlahBaris: number
  pesan: string
  /** Daftar galat per baris (maksimal 50). */
  galat: string[]
  /** Link dokumen yang dibaca dari file ini. */
  dokumen?: LinkDokumen[]
}

export interface DataTahun {
  meta: Record<Jenis, Metadata | null>
  files: FileData[]
}
export type Db = Record<number, DataTahun>

/* ===== helper murni ===== */

export const r1 = (x: number) => Math.round(x * 10) / 10
export const angka = (v: string | number | null | undefined): number | null => {
  if (v == null || v === "") return null
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."))
  return Number.isNaN(n) ? null : n
}
export const fmt = (x: number | null) => (x == null ? "–" : String(r1(x)).replace(".", ","))
const idBaru = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

export function kategoriBawaan(nilai: TipeNilai): Kategori[] {
  if (nilai === "boolean")
    return [
      { l: "Sudah Implementasi", f: "1", t: "", c: "hijau" },
      { l: "Belum Implementasi", f: "0", t: "", c: "merah" },
      { l: "Data Tidak Memadai", f: "kosong", t: "", c: "abu" },
    ]
  if (nilai === "percentage")
    return [
      { l: "Rendah", f: "0", t: "59,9", c: "merah" },
      { l: "Sedang", f: "60", t: "79,9", c: "kuning" },
      { l: "Tinggi", f: "80", t: "100", c: "hijau" },
      { l: "Data Tidak Memadai", f: "kosong", t: "", c: "abu" },
    ]
  if (nilai === "numeric")
    return [
      { l: "Rendah", f: "0", t: "5,9", c: "merah" },
      { l: "Sedang", f: "6", t: "7,9", c: "kuning" },
      { l: "Tinggi", f: "8", t: "10", c: "hijau" },
      { l: "Data Tidak Memadai", f: "kosong", t: "", c: "abu" },
    ]
  return []
}

/** Kategori kosong saat tipe nilai baru dipilih: nama diisi pengguna, rentang kosong. */
export function kategoriKosong(nilai: TipeNilai): Kategori[] {
  if (nilai === "boolean")
    return [
      { l: "", f: "1", t: "", c: "hijau" },
      { l: "", f: "0", t: "", c: "merah" },
      { l: "", f: "kosong", t: "", c: "abu" },
    ]
  return nilai === "numeric" || nilai === "percentage"
    ? [{ l: "", f: "", t: "", c: "biru" }, { l: "", f: "kosong", t: "", c: "abu" }]
    : []
}

const batasBawaan = (n: TipeNilai) => (n === "percentage" ? 100 : n === "boolean" ? 1 : 10)

export function buatKode(jenis: Jenis, tipe: TipeItem, urut: number, tahun: number) {
  return `${jenis === "sekolah" ? "S" : "D"}${PREFIKS[tipe]}-${String(urut).padStart(4, "0")}-${tahun}`
}

function buatItem(jenis: Jenis, tahun: number, tipe: TipeItem, judul: string, nilai: TipeNilai, cnt: Record<string, number>, prev: string | null = null): ItemMeta {
  const p = PREFIKS[tipe]
  cnt[p] = (cnt[p] ?? 0) + 1
  return { id: idBaru(), type: tipe, judul, desk: "", nilai, min: 0, max: batasBawaan(nilai), kode: buatKode(jenis, tipe, cnt[p], tahun), prev, kat: kategoriBawaan(nilai), kids: [] }
}

export function itemBaru(tipe: TipeItem, nilai: TipeNilai): ItemMeta {
  return { id: idBaru(), type: tipe, judul: "", desk: "", nilai, min: 0, max: 10, kode: "", prev: null, kat: kategoriBawaan(nilai), kids: [] }
}

/** Beri kode berurutan pada item baru yang disimpan. */
export function pasangKode(m: Metadata, item: ItemMeta, jenis: Jenis, tahun: number) {
  const p = PREFIKS[item.type]
  m.cnt[p] = (m.cnt[p] ?? 0) + 1
  item.kode = buatKode(jenis, item.type, m.cnt[p], tahun)
}

/** Salin metadata ke tahun/jenis lain: semua item mendapat kode baru dan menyimpan kode asal sebagai padanan. */
export function salinMetadata(src: Metadata, jenis: Jenis, tahun: number): Metadata {
  const cnt: Record<string, number> = {}
  const f = (n: ItemMeta): ItemMeta => {
    const c = buatItem(jenis, tahun, n.type, n.judul, n.nilai, cnt, n.kode)
    return { ...c, min: n.min, max: n.max, desk: n.desk, kat: n.kat.map((k) => ({ ...k })), kids: n.kids.map(f) }
  }
  return { root: f(src.root), items: src.items.map(f), cnt }
}

const DASAR = {
  indikator: [
    ["Kesejahteraan Psikologis dan Keamanan Sosiokultural", [["Ketersediaan layanan konseling", "numeric"], ["Penanganan kasus perundungan dan kekerasan", "numeric"], ["Iklim sekolah yang inklusif terhadap keberagaman", "numeric"]]],
    ["Pelindungan Fisik", [["Persentase Murid Melaksanakan CKG", "percentage"], ["Kelayakan sarana dan prasarana sekolah", "numeric"], ["Ketersediaan protokol keselamatan dan tanggap darurat", "numeric"]]],
    ["Keadaban dan Keamanan Digital", [["Literasi digital murid dan pendidik", "numeric"], ["Kebijakan penggunaan gawai di sekolah", "numeric"], ["Penanganan kasus perundungan siber", "numeric"]]],
    ["Pemenuhan Kebutuhan Spiritual", [["Ketersediaan sarana ibadah yang layak", "numeric"], ["Persentase murid mengikuti kegiatan keagamaan", "percentage"], ["Ketersediaan pendidik agama sesuai keyakinan murid", "numeric"]]],
  ],
  aspek: [
    ["PPKPSP", [["Implementasi G7KAIH", "boolean"], ["Implementasi PPC", "boolean"], ["Implementasi GKE", "boolean"], ["Implementasi Upacara", "boolean"], ["Implementasi GAWAI", "boolean"]]],
    ["CKG", [["Persentase murid ikut CKG", "percentage"]]],
  ],
} as const

/** Metadata lengkap contoh (4 indikator, 2 aspek tambahan, 1 dokumen). */
export function metadataContoh(jenis: Jenis, tahun: number): Metadata {
  const cnt: Record<string, number> = {}
  const root = buatItem(jenis, tahun, "indeks", "Indeks BSAN", "numeric", cnt)
  const items: ItemMeta[] = []
  for (const [judul, anak] of DASAR.indikator) {
    const n = buatItem(jenis, tahun, "indikator", judul, "numeric", cnt)
    for (const [j, t] of anak) n.kids.push(buatItem(jenis, tahun, "sub", j, t, cnt))
    items.push(n)
  }
  for (const [judul, anak] of DASAR.aspek) {
    const n = buatItem(jenis, tahun, "aspek", judul, "group", cnt)
    for (const [j, t] of anak) n.kids.push(buatItem(jenis, tahun, "aspek_ind", j, t, cnt))
    items.push(n)
  }
  items.push(buatItem(jenis, tahun, "dokumen", "Laporan Hasil Indeks BSAN", "link", cnt))
  return { root, items, cnt }
}

/** Metadata kosong: hanya Indeks BSAN yang tipe nilainya belum dipilih. */
export function metadataKosong(jenis: Jenis, tahun: number): Metadata {
  const cnt: Record<string, number> = {}
  const root = buatItem(jenis, tahun, "indeks", "Indeks BSAN", "numeric", cnt)
  root.nilai = ""
  root.kat = []
  return { root, items: [], cnt }
}

/** Lengkap: Indeks BSAN punya tipe nilai, ada minimal satu indikator, dan setiap indikator/aspek punya item di bawahnya. */
export function lengkap(m: Metadata | null): boolean {
  if (!m || !m.root.nilai) return false
  return m.items.some((n) => n.type === "indikator") && m.items.every((n) => n.type === "dokumen" || n.kids.length > 0)
}

export const filePengunci = (d: DataTahun, j: Jenis) => d.files.filter((f) => f.jenis === j && (f.status === "Berhasil" || f.status === "Diproses"))

export interface Cakupan { ok: boolean; pesan: string[]; mn?: number; mx?: number }

/** Periksa kategori: semua nilai dalam rentang harus tercakup, tanpa celah dan tanpa tumpang tindih (ketelitian 1 desimal). */
export function periksaCakupan(d: { nilai: TipeNilai; min: string; max: string; kat: Kategori[] }): Cakupan {
  if (!d.nilai) return { ok: false, pesan: [] }
  if (d.nilai === "group" || d.nilai === "link") return { ok: true, pesan: [] }
  const tanpaNama = d.kat.some((k) => !k.l.trim())
  if (d.nilai === "boolean") return tanpaNama ? { ok: false, pesan: ["Isi nama semua kategori"] } : { ok: true, pesan: [] }
  const rentang = d.kat.filter((k) => k.f !== "kosong")
  if (!rentang.length) return { ok: false, pesan: ["Tambah minimal 1 kategori rentang"] }
  if (tanpaNama) return { ok: false, pesan: ["Isi nama semua kategori"] }
  const mn = angka(d.min)
  const mx = angka(d.max)
  if (mn == null || mx == null || mn >= mx) return { ok: false, pesan: ["Nilai minimum harus lebih kecil dari maksimum"] }
  const galat: string[] = []
  const ks = rentang.map((k) => ({ l: k.l, f: angka(k.f), t: angka(k.t) }))
  for (const k of ks) {
    if (k.f == null || k.t == null) galat.push(`${k.l}: isi rentang dari dan sampai`)
    else if (k.f > k.t) galat.push(`${k.l}: “dari” lebih besar dari “sampai”`)
    else if (k.f < mn || k.t > mx) galat.push(`${k.l}: di luar rentang ${fmt(mn)} sampai ${fmt(mx)}`)
  }
  if (galat.length) return { ok: false, pesan: galat, mn, mx }
  const urut = (ks as { l: string; f: number; t: number }[]).sort((a, b) => a.f - b.f)
  let cur = mn
  urut.forEach((k, i) => {
    if (r1(k.f) > r1(cur)) galat.push(`Nilai ${fmt(cur)} sampai ${fmt(r1(k.f - 0.1))} belum punya kategori`)
    if (i > 0 && r1(k.f) <= r1(urut[i - 1].t)) galat.push(`${urut[i - 1].l} dan ${k.l} tumpang tindih`)
    cur = Math.max(cur, r1(k.t + 0.1))
  })
  if (r1(cur) <= r1(mx)) galat.push(`Nilai ${fmt(cur)} sampai ${fmt(mx)} belum punya kategori`)
  return { ok: !galat.length, pesan: galat, mn, mx }
}

/** Daftar kode untuk template: Indeks BSAN, indikator, subindikator, indikator aspek, dan dokumen (kelompok aspek tidak berkode data). */
export interface BarisKode { item: ItemMeta; induk: ItemMeta | null; tipe: string }
export function daftarKode(m: Metadata): BarisKode[] {
  const out: BarisKode[] = [{ item: m.root, induk: null, tipe: "indeks_bsan" }]
  for (const n of m.items) {
    if (n.type === "indikator") out.push({ item: n, induk: null, tipe: "indikator" })
    if (n.type === "dokumen") out.push({ item: n, induk: null, tipe: "dokumen" })
    for (const k of n.kids) out.push({ item: k, induk: n, tipe: k.type === "sub" ? "sub_indikator" : "indikator_aspek" })
  }
  return out
}

/* ===== data contoh dan penyimpanan ===== */

const berkas = (id: string, waktu: string, jenis: Jenis, nama: string, status: StatusFile, n: number): FileData => ({
  id, waktu, jenis, nama, pengunggah: "admin.pusat", status, n,
  jumlahBaris: status === "Gagal" ? 4 : n,
  pesan: status === "Gagal" ? "Tidak ada baris yang dapat diproses dari 4 baris. Kode metadata tidak ditemukan pada metadata tahun ini." : `Semua ${n} baris berhasil diproses.`,
  galat: status === "Gagal" ? ["Baris 2: kode_metadata “SI-0001-2025” tidak ditemukan", "Baris 3: kode_metadata “SI-0002-2025” tidak ditemukan"] : [],
})

function seed(): Db {
  const m25 = { sekolah: metadataContoh("sekolah", 2025), dinas: metadataContoh("dinas", 2025) }
  const m26 = { sekolah: salinMetadata(m25.sekolah, "sekolah", 2026), dinas: salinMetadata(m25.dinas, "dinas", 2026) }
  m26.sekolah.items[0].desk = "Rasa aman, dukungan psikologis, dan penerimaan keberagaman yang dirasakan warga sekolah."
  // Dokumen kedua (tahun 2026) agar tombol unduh dokumen tampil lebih dari satu pada demo.
  for (const j of ["sekolah", "dinas"] as const) {
    const m = m26[j]
    const dok = buatItem(j, 2026, "dokumen", "Rekomendasi Tindak Lanjut", "link", m.cnt)
    m.items.push(dok)
  }
  const kodeDok = (m: Metadata) => m.items.filter((n) => n.type === "dokumen").map((n) => n.kode)
  const [sd1, sd2] = kodeDok(m26.sekolah)
  const [dd1, dd2] = kodeDok(m26.dinas)
  const BERKAS_DEMO = "https://drive.google.com/drive/folders/1xmDQ_cnnw30K-B3ZeJoR799cEMWIZq-D"
  const linkSekolah: LinkDokumen[] = [
    { id: "10100000", nama: "SDN 1 Banda Aceh", kode: sd1, url: BERKAS_DEMO },
    { id: "10100000", nama: "SDN 1 Banda Aceh", kode: sd2, url: BERKAS_DEMO },
    { id: "10100071", nama: "SMPN 2 Banda Aceh", kode: sd1, url: BERKAS_DEMO },
    { id: "10100142", nama: "SMAN 3 Bireuen", kode: sd1, url: BERKAS_DEMO },
  ]
  const linkDinas: LinkDokumen[] = [
    { id: "11", nama: "Aceh", level: "Provinsi", kode: dd1, url: BERKAS_DEMO },
    { id: "11", nama: "Aceh", level: "Provinsi", kode: dd2, url: BERKAS_DEMO },
    { id: "11.71", nama: "Banda Aceh", level: "Kab/Kota", kode: dd1, url: BERKAS_DEMO },
  ]
  return {
    2025: { meta: m25, files: [
      berkas("s25-2", "2025-10-14T09:30:00", "dinas", "data_indeks_bsan_dinas_2025.xlsx", "Berhasil", 538),
      berkas("s25-1", "2025-10-12T14:40:00", "sekolah", "data_indeks_bsan_sekolah_2025.xlsx", "Berhasil", 412),
    ] },
    2026: { meta: m26, files: [
      { ...berkas("s26-1", "2026-11-05T08:00:00", "sekolah", "contoh_data_indeks_bsan_sekolah_2026.xlsx", "Berhasil", 466), dokumen: linkSekolah },
      berkas("s26-2", "2026-11-04T16:20:00", "sekolah", "contoh_data_indeks_bsan_sekolah_2026_revisi.xlsx", "Berhasil", 39),
      berkas("s26-3", "2026-11-04T10:05:00", "sekolah", "data_sekolah_2026_salah_kode.xlsx", "Gagal", 0),
      { ...berkas("s26-4", "2026-11-03T14:10:00", "dinas", "contoh_data_indeks_bsan_dinas_2026.xlsx", "Berhasil", 552), dokumen: linkDinas },
    ] },
    2027: { meta: { sekolah: salinMetadata(m26.sekolah, "sekolah", 2027), dinas: null }, files: [] },
  }
}

const KUNCI = "metadata-bsan-v2"

/** Baca data tersimpan; unggahan yang masih "Diproses" saat halaman ditinggalkan dianggap selesai. Null bila belum ada. */
function muatDb(): Db | null {
  try {
    const mentah = localStorage.getItem(KUNCI)
    if (!mentah) return null
    const t = JSON.parse(mentah) as Db
    for (const y of Object.keys(t)) t[+y].files = t[+y].files.map((f) => (f.status === "Diproses" ? { ...f, status: "Berhasil" } : f))
    return t
  } catch {
    return null
  }
}

/** Metadata dan riwayat unggahan, disimpan di localStorage (demo) agar tidak hilang saat berpindah menu. */
export function useMetadataBsan() {
  const [db, setDb] = useState<Db>(seed)
  // Simpan baru boleh jalan setelah data tersimpan selesai dimuat; bila tidak, seed menimpa localStorage.
  const [siap, setSiap] = useState(false)

  useEffect(() => {
    const t = muatDb()
    if (t) setDb(t)
    setSiap(true)
  }, [])

  useEffect(() => {
    if (!siap) return
    try {
      localStorage.setItem(KUNCI, JSON.stringify(db))
    } catch {}
  }, [db, siap])

  const ubah = useCallback((fn: (d: Db) => void) => {
    setDb((p) => {
      const n = structuredClone(p)
      fn(n)
      return n
    })
  }, [])

  return { db, ubah }
}

/* ===== dokumen unduhan per sekolah/daerah ===== */

/** Identitas sekolah atau daerah yang halaman Indeks BSAN-nya sedang dibuka. */
export interface IdentitasDokumen {
  jenis: Jenis
  /** Sekolah: NPSN bila ada. */
  npsn?: string
  /** Sekolah: nama sekolah. Dinas: nama daerah (tanpa awalan "Dinas Pendidikan"). */
  nama?: string
  /** Dinas saja. */
  level?: "Provinsi" | "Kab/Kota"
}

export interface DokumenUnduh { kode: string; judul: string; deskripsi: string; url: string | null }

const normNama = (s: string | undefined) => (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

function cocok(l: LinkDokumen, who: IdentitasDokumen) {
  if (who.jenis === "sekolah") return (!!who.npsn && l.id === who.npsn) || (!!who.nama && normNama(l.nama) === normNama(who.nama))
  return normNama(l.level) === normNama(who.level) && normNama(l.nama) === normNama(who.nama)
}

/**
 * Dokumen unduhan untuk satu sekolah/daerah pada satu tahun: satu entri per item Dokumen di metadata. Link diambil
 * dari file data Berhasil terbaru yang memuatnya, sehingga file baru menimpa dan menghapus file mengembalikan link lama.
 */
export function dokumenUnduh(db: Db, tahun: number, who: IdentitasDokumen): DokumenUnduh[] {
  const th = db[tahun]
  const meta = th?.meta[who.jenis]
  if (!th || !meta) return []
  const berkas = th.files.filter((f) => f.jenis === who.jenis && f.status === "Berhasil")
  return meta.items
    .filter((n) => n.type === "dokumen")
    .map((n) => {
      let url: string | null = null
      for (const f of berkas) {
        const l = f.dokumen?.find((d) => d.kode === n.kode && cocok(d, who))
        if (l) { url = l.url; break }
      }
      return { kode: n.kode, judul: n.judul, deskripsi: n.desk, url }
    })
}

/** Versi baca-saja dari data metadata untuk halaman lain (tidak menulis ke penyimpanan). */
export function useDokumenUnduh(tahun: number, who: IdentitasDokumen | null): DokumenUnduh[] {
  const [db, setDb] = useState<Db | null>(null)
  useEffect(() => {
    setDb(muatDb() ?? seed())
  }, [])
  if (!db || !who) return []
  return dokumenUnduh(db, tahun, who)
}

/** "24/03/2025 11:12" */
export function formatWaktu(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export { idBaru }
