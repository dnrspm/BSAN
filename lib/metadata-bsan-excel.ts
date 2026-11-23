"use client"

import type { Cell, CellValue } from "exceljs"
import { LABEL_NILAI, angka, daftarKode, labelJenis, type Jenis, type Metadata, type StatusFile } from "@/lib/metadata-bsan"

const BARIS_DATA = 1000
const BIRU_TUA = "FF1F4E78"
const ABU = "FFF2F2F2"

const KOLOM: Record<Jenis, string[]> = {
  sekolah: ["npsn", "nama_sekolah", "kode_metadata", "judul", "nilai", "kategori", "rekomendasi"],
  dinas: ["level", "kode_wilayah", "nama_daerah", "kode_metadata", "judul", "nilai", "kategori", "rekomendasi"],
}
/** Kolom yang terisi otomatis (rumus), indeks mulai dari 0. */
const OTOMATIS: Record<Jenis, string[]> = { sekolah: ["judul", "kategori"], dinas: ["judul", "kategori"] }

/** exceljs dimuat saat dibutuhkan; bentuk ekspornya berbeda antara bundler (named) dan Node (default). */
async function muatWorkbook() {
  const mod = await import("exceljs")
  const lib = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod
  return lib.Workbook
}

const huruf = (i: number) => String.fromCharCode(65 + i)

function simpan(blob: Blob, nama: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nama
  a.click()
  URL.revokeObjectURL(url)
}
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export const namaTemplate = (j: Jenis, tahun: number) => `template_indeks_bsan_${j}_${tahun}.xlsx`

/**
 * Buat template Excel dari metadata yang sudah lengkap: sheet Data (dropdown kode_metadata, validasi nilai sesuai
 * rentang tiap kode, judul dan kategori terisi rumus), Daftar Kode dan Kategori sebagai rujukan, serta Petunjuk.
 */
export async function unduhTemplate(m: Metadata, jenis: Jenis, tahun: number) {
  const Workbook = await muatWorkbook()
  const wb = new Workbook()
  const label = labelJenis(jenis)
  const sch = jenis === "sekolah"
  const kodes = daftarKode(m)

  const pet = wb.addWorksheet("Petunjuk")
  pet.getColumn(1).width = 120
  const nSatuan = sch ? "sekolah" : "provinsi/kab-kota"
  ;[
    `Template Data Indeks BSAN ${tahun} · ${sch ? "Sekolah" : "Dinas (Provinsi dan Kab/Kota)"}`,
    `1. Isi sheet "Data ${label}": satu baris untuk setiap ${nSatuan} per kode metadata.`,
    "2. Pilih kode_metadata dari dropdown. Kolom abu-abu (judul dan kategori) terisi otomatis.",
    '3. Nilai dicek sesuai rentang tiap kode. Kosongkan nilai jika data tidak tersedia (kategori jadi "Data Tidak Memadai").',
    "4. Untuk kode dokumen (DOK), isi nilai dengan link file yang bisa diunduh pengguna dari halaman detail.",
    "5. Simpan sebagai .xlsx, lalu unggah di menu Indeks BSAN › Metadata & Unggah Data.",
    'Sheet "Daftar Kode" dan "Kategori" dibuat dari metadata dan jangan diubah.',
  ].forEach((t, i) => {
    const c = pet.getCell(i + 1, 1)
    c.value = t
    if (i === 0) c.font = { bold: true, size: 13 }
  })

  const data = wb.addWorksheet(`Data ${label}`)
  const dk = wb.addWorksheet("Daftar Kode")
  const kt = wb.addWorksheet("Kategori")

  dk.addRow(["kode_metadata", "judul", "type_metadata", "induk_kode_metadata", "tipe_nilai", "min", "max"])
  for (const { item, induk, tipe } of kodes) {
    const n = item.nilai
    dk.addRow([item.kode, item.judul, tipe, induk?.kode ?? "", n ? LABEL_NILAI[n] : "", n === "link" || n === "group" || !n ? null : item.min, n === "link" || n === "group" || !n ? null : item.max])
  }
  kt.addRow(["kode_metadata", "kategori", "dari", "sampai", "warna"])
  for (const { item } of kodes) {
    for (const k of item.kat) {
      const kosong = k.f === "kosong"
      const dari = kosong ? null : angka(k.f)
      const sampai = kosong ? null : item.nilai === "boolean" ? dari : angka(k.t)
      kt.addRow([item.kode, k.l, dari, sampai, k.c[0].toUpperCase() + k.c.slice(1)])
    }
  }
  for (const ws of [dk, kt]) {
    ws.getRow(1).font = { bold: true }
    ws.columns.forEach((c) => (c.width = 24))
  }
  dk.getColumn(2).width = 60

  // Sheet Data
  const kolom = KOLOM[jenis]
  data.addRow(kolom)
  const head = data.getRow(1)
  head.font = { bold: true, color: { argb: "FFFFFFFF" } }
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BIRU_TUA } }
  data.views = [{ state: "frozen", ySplit: 1 }]
  const lebar: Record<string, number> = { npsn: 14, nama_sekolah: 34, level: 12, kode_wilayah: 14, nama_daerah: 26, kode_metadata: 20, judul: 56, nilai: 12, kategori: 22, rekomendasi: 50 }
  kolom.forEach((k, i) => (data.getColumn(i + 1).width = lebar[k] ?? 16))

  const L = (k: string) => huruf(kolom.indexOf(k))
  const kodeC = L("kode_metadata"), judulC = L("judul"), nilaiC = L("nilai"), katC = L("kategori")
  const nDK = kodes.length + 1
  const nKT = Math.max(kt.rowCount, 2)
  const dkRange = (c1: string, c2: string) => `'Daftar Kode'!$${c1}$2:$${c2}$${nDK}`
  const katR = (c: string) => `Kategori!$${c}$2:$${c}$${nKT}`

  for (let r = 2; r <= BARIS_DATA + 1; r++) {
    data.getCell(`${judulC}${r}`).value = { formula: `IF(${kodeC}${r}="","",IFERROR(VLOOKUP(${kodeC}${r},'Daftar Kode'!$A$2:$B$${nDK},2,FALSE),""))`, result: "" }
    data.getCell(`${katC}${r}`).value = {
      formula:
        `IF(${kodeC}${r}="","",IF(${nilaiC}${r}="",IFERROR(LOOKUP(2,1/((${katR("A")}=${kodeC}${r})*(${katR("C")}="")),${katR("B")}),""),` +
        `IFERROR(LOOKUP(2,1/((${katR("A")}=${kodeC}${r})*(${katR("C")}<>"")*(${katR("C")}<=${nilaiC}${r})*(${katR("D")}>=${nilaiC}${r})),${katR("B")}),"")))`,
      result: "",
    }
  }
  for (const k of OTOMATIS[jenis]) {
    const c = data.getColumn(kolom.indexOf(k) + 1)
    c.eachCell({ includeEmpty: true }, (cell, r) => {
      if (r > 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ABU } }
    })
  }

  // `dataValidations` ada di exceljs tetapi tidak ada di tipenya; rentang sel memakai rumus relatif terhadap sel pertama.
  const dv = (data as unknown as { dataValidations: { add: (alamat: string, aturan: unknown) => void } }).dataValidations
  dv.add(`${kodeC}2:${kodeC}${BARIS_DATA + 1}`, {
    type: "list", allowBlank: true, formulae: [dkRange("A", "A")],
    showErrorMessage: true, errorStyle: "stop", errorTitle: "Kode tidak dikenal", error: "Pilih kode_metadata dari daftar.",
  })
  dv.add(`${nilaiC}2:${nilaiC}${BARIS_DATA + 1}`, {
    type: "custom", allowBlank: true,
    formulae: [
      `OR(${nilaiC}2="",IF(IFERROR(VLOOKUP(${kodeC}2,${dkRange("A", "E")},5,FALSE),"")="${LABEL_NILAI.link}",LEFT(${nilaiC}2,4)="http",` +
        `AND(ISNUMBER(${nilaiC}2),${nilaiC}2>=VLOOKUP(${kodeC}2,${dkRange("A", "G")},6,FALSE),${nilaiC}2<=VLOOKUP(${kodeC}2,${dkRange("A", "G")},7,FALSE))))`,
    ],
    showErrorMessage: true, errorStyle: "stop", errorTitle: "Nilai tidak valid", error: "Nilai harus berada dalam rentang kode ini, atau link (http) untuk dokumen.",
  })
  if (!sch) {
    dv.add(`A2:A${BARIS_DATA + 1}`, { type: "list", allowBlank: true, formulae: ['"Provinsi,Kab/Kota"'], showErrorMessage: true, errorStyle: "stop", error: "Pilih Provinsi atau Kab/Kota." })
  } else {
    dv.add(`A2:A${BARIS_DATA + 1}`, { type: "textLength", operator: "equal", allowBlank: true, formulae: [8], showErrorMessage: true, errorStyle: "stop", error: "NPSN harus 8 digit." })
    data.getColumn(1).numFmt = "@"
  }

  const buf = await wb.xlsx.writeBuffer()
  simpan(new Blob([buf], { type: XLSX_MIME }), namaTemplate(jenis, tahun))
}

/* ===== membaca file terisi ===== */

export interface HasilBaca {
  status: StatusFile
  n: number
  jumlahBaris: number
  pesan: string
  galat: string[]
}

function teks(v: CellValue): string {
  if (v == null) return ""
  if (typeof v === "object") {
    if ("result" in v && v.result != null) return teks(v.result as CellValue)
    if ("richText" in v) return v.richText.map((r) => r.text).join("").trim()
    if ("text" in v) return String(v.text).trim()
    if (v instanceof Date) return v.toISOString()
    return ""
  }
  return String(v).trim()
}
const nilaiSel = (c: Cell) => teks(c.value)

const gagal = (pesan: string, galat: string[] = [], jumlahBaris = 0): HasilBaca => ({ status: "Gagal", n: 0, jumlahBaris, pesan, galat })

/** Baca dan periksa template Excel yang sudah diisi terhadap metadata tahun dan jenis yang dipilih. */
export async function bacaDataXlsx(file: File, m: Metadata, jenis: Jenis): Promise<HasilBaca> {
  const Workbook = await muatWorkbook()
  const wb = new Workbook()
  try {
    await wb.xlsx.load(await file.arrayBuffer())
  } catch {
    return gagal("File tidak dapat dibaca sebagai .xlsx. Gunakan template yang diunduh dari halaman ini.")
  }
  const ws = wb.worksheets.find((w) => w.name.toLowerCase().startsWith("data"))
  if (!ws) return gagal(`Sheet “Data ${labelJenis(jenis)}” tidak ditemukan. Gunakan template yang diunduh dari halaman ini.`)

  const idx = new Map<string, number>()
  ws.getRow(1).eachCell((c, i) => idx.set(nilaiSel(c).toLowerCase(), i))
  const wajib = jenis === "sekolah" ? ["npsn", "kode_metadata", "nilai"] : ["level", "kode_wilayah", "kode_metadata", "nilai"]
  const hilang = wajib.filter((k) => !idx.has(k))
  if (hilang.length) return gagal(`Kolom wajib tidak ditemukan: ${hilang.join(", ")}. Pastikan baris pertama sesuai template.`)

  const item = new Map(daftarKode(m).filter((b) => b.item.nilai && b.item.nilai !== "group").map((b) => [b.item.kode, b.item]))
  const ambil = (r: number, k: string) => (idx.has(k) ? nilaiSel(ws.getCell(r, idx.get(k)!)) : "")
  const galat: string[] = []
  const lihat = new Set<string>()
  let jumlah = 0
  let ok = 0
  for (let r = 2; r <= ws.rowCount; r++) {
    const kode = ambil(r, "kode_metadata")
    const nil = ambil(r, "nilai")
    const satuan = jenis === "sekolah" ? ambil(r, "npsn") : ambil(r, "kode_wilayah")
    if (!kode && !nil && !satuan) continue
    jumlah++
    const tambah = (s: string) => galat.push(`Baris ${r}: ${s}`)
    if (jenis === "sekolah" && !/^\d{8}$/.test(satuan)) { tambah("NPSN harus 8 digit angka"); continue }
    if (jenis === "dinas") {
      if (!satuan) { tambah("kode_wilayah tidak boleh kosong"); continue }
      if (!/^(provinsi|kab\/kota)$/i.test(ambil(r, "level"))) { tambah("level harus Provinsi atau Kab/Kota"); continue }
    }
    const it = item.get(kode)
    if (!it) { tambah(kode ? `kode_metadata “${kode}” tidak ditemukan pada metadata ${m.root.kode.slice(-4)}` : "kode_metadata tidak boleh kosong"); continue }
    const kunci = `${satuan}|${kode}`
    if (lihat.has(kunci)) { tambah(`${satuan} dengan kode ${kode} muncul lebih dari sekali`); continue }
    if (nil !== "") {
      if (it.nilai === "link") {
        if (!/^https?:\/\//i.test(nil)) { tambah(`nilai untuk ${kode} harus berupa link (http)`); continue }
      } else {
        const v = angka(nil)
        if (v == null) { tambah(`nilai “${nil}” bukan angka`); continue }
        if (it.nilai === "boolean" ? v !== 0 && v !== 1 : v < it.min || v > it.max) {
          tambah(`nilai ${nil} di luar rentang ${it.nilai === "boolean" ? "1 / 0" : `${it.min}–${it.max}`} untuk ${kode}`)
          continue
        }
      }
    }
    lihat.add(kunci)
    ok++
  }

  if (jumlah === 0) return gagal("Tidak ada baris data. Isi minimal satu baris pada sheet Data.")
  if (ok === 0) return gagal(`Tidak ada baris yang dapat diproses dari ${jumlah} baris. Periksa daftar galat, lalu unggah ulang.`, galat.slice(0, 50), jumlah)
  const sisa = jumlah - ok
  return {
    status: "Berhasil",
    n: ok,
    jumlahBaris: jumlah,
    pesan: sisa === 0 ? `Semua ${jumlah} baris berhasil diproses.` : `${ok} dari ${jumlah} baris berhasil diproses; ${sisa} baris gagal dan perlu diperbaiki.`,
    galat: galat.slice(0, 50),
  }
}
