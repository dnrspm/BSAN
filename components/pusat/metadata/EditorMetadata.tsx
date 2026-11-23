"use client"

import { Fragment, useState } from "react"
import { AlertTriangle, ChevronDown, ChevronRight, ChevronUp, Download, Lock, Pencil, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  LABEL_ITEM, LABEL_NILAI, fmt, filePengunci, itemBaru, labelJenis, lengkap, pasangKode,
  type Db, type ItemMeta, type Jenis, type Metadata, type TipeItem,
} from "@/lib/metadata-bsan"
import {
  BatangKategori, TH, TOMBOL_IKON, TOMBOL_MERAH, TOMBOL_PUTIH, TOMBOL_TAUTAN, TR_HEAD, TOMBOL_KECIL, TOMBOL_KECIL_HITAM, TOMBOL_UTAMA,
} from "@/components/pusat/metadata/gaya"
import { DialogItem, type HasilItem } from "@/components/pusat/metadata/DialogItem"

interface Props {
  db: Db
  ubah: (fn: (d: Db) => void) => void
  tahun: number
  jenis: Jenis
  onKembali: () => void
  onTemplate: () => void
  onToast: (pesan: string) => void
}

interface Lokasi { n: ItemMeta; arr: ItemMeta[] | null; par: ItemMeta | null }

function cari(m: Metadata, id: string): Lokasi | null {
  if (m.root.id === id) return { n: m.root, arr: null, par: null }
  for (const it of m.items) {
    if (it.id === id) return { n: it, arr: m.items, par: null }
    for (const k of it.kids) if (k.id === id) return { n: k, arr: it.kids, par: it }
  }
  return null
}

function rentang(n: ItemMeta, jenis: Jenis) {
  if (!n.nilai || n.nilai === "group") return "–"
  if (n.nilai === "link") return `URL per ${jenis === "dinas" ? "daerah" : "sekolah"}`
  if (n.nilai === "boolean") return "1 / 0"
  return `${fmt(n.min)} – ${fmt(n.max)}${n.nilai === "percentage" ? "%" : ""}`
}

interface DlgState { item: ItemMeta; baru: boolean; indukId: string | null }

/** Halaman metadata satu jenis dan tahun: pohon indikator, aspek tambahan, dan dokumen; terkunci bila sudah ada data terunggah. */
export function EditorMetadata({ db, ubah, tahun, jenis, onKembali, onTemplate, onToast }: Props) {
  const m = db[tahun]?.meta[jenis]
  const [terbuka, setTerbuka] = useState<Record<string, boolean>>({})
  const [dlg, setDlg] = useState<DlgState | null>(null)
  const [hapus, setHapus] = useState<Lokasi | null>(null)
  if (!m) return null

  const pengunci = filePengunci(db[tahun], jenis)
  const L = pengunci.length > 0
  const ok = lengkap(m)
  const buka = (n: ItemMeta) => terbuka[n.id] ?? n.id === m.items[0]?.id
  const label = labelJenis(jenis)
  /** Saat terkunci hanya item Dokumen yang tetap bisa diubah, karena nilainya link dan tidak memengaruhi skor. */
  const kunciItem = (n: ItemMeta) => L && n.type !== "dokumen"

  const ringkas = (() => {
    let a = 0, b = 0, c = 0, d = 0
    for (const n of m.items) {
      if (n.type === "indikator") { a++; b += n.kids.length } else if (n.type === "aspek") c++; else d++
    }
    return `${a} indikator · ${b} subindikator · ${c} aspek · ${d} dokumen`
  })()

  const geser = (id: string, arah: -1 | 1) =>
    ubah((d) => {
      const f = cari(d[tahun].meta[jenis]!, id)
      if (!f?.arr) return
      const i = f.arr.indexOf(f.n)
      const k = i + arah
      if (k < 0 || k >= f.arr.length) return
      f.arr.splice(i, 1)
      f.arr.splice(k, 0, f.n)
    })

  const tambah = (tipe: TipeItem, induk: ItemMeta | null) => {
    const nilai = tipe === "aspek" ? "group" : tipe === "dokumen" ? "link" : ""
    setDlg({ item: itemBaru(tipe, nilai), baru: true, indukId: induk?.id ?? null })
  }

  const simpan = (h: HasilItem) => {
    if (!dlg) return
    const { item, baru, indukId } = dlg
    ubah((d) => {
      const mm = d[tahun].meta[jenis]!
      if (baru) {
        const it: ItemMeta = { ...item, ...h }
        pasangKode(mm, it, jenis, tahun)
        const arr = indukId ? cari(mm, indukId)!.n.kids : mm.items
        arr.push(it)
      } else {
        const f = cari(mm, item.id)
        if (f) Object.assign(f.n, h, item.type === "indeks" ? { judul: f.n.judul } : {})
      }
    })
    if (baru && indukId) setTerbuka((t) => ({ ...t, [indukId]: true }))
    setDlg(null)
    onToast(baru ? `${LABEL_ITEM[item.type]} ditambahkan` : "Tersimpan")
  }

  const hapusItem = () => {
    if (!hapus) return
    ubah((d) => {
      const f = cari(d[tahun].meta[jenis]!, hapus.n.id)
      if (f?.arr) f.arr.splice(f.arr.indexOf(f.n), 1)
    })
    setHapus(null)
  }

  const baris = (n: ItemMeta, idx: number, len: number, lvl: 1 | 2): React.ReactNode => {
    const induk = n.type === "indikator" || n.type === "aspek"
    const K = kunciItem(n)
    return (
      <Fragment key={n.id}>
        <tr className={cn("border-b border-[#eef0f2] transition-colors [&:hover_.hv]:opacity-100 [&:focus-within_.hv]:opacity-100", K ? "bg-[#F1F1F1]/60 text-gray-500" : "hover:bg-[#F9F9F9]")}>
          <td className={cn("py-3 pr-3", lvl === 2 ? "pl-[52px]" : "pl-4")}>
            <div className="flex min-w-0 items-center gap-1.5">
              {induk && (
                <button
                  type="button" onClick={() => setTerbuka((t) => ({ ...t, [n.id]: !buka(n) }))}
                  aria-expanded={buka(n)} aria-label={`${buka(n) ? "Tutup" : "Buka"} ${n.judul}`} className={cn(TOMBOL_IKON, "h-6 w-6")}
                >
                  {buka(n) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              <div className="min-w-0">
                <p className={cn("break-words font-semibold", K ? "text-gray-500" : "text-gray-900")}>{n.judul}</p>
                {n.desk && <p className="truncate text-xs text-gray-500" title={n.desk}>{n.desk}</p>}
              </div>
            </div>
          </td>
          <td className={cn("px-3 py-3", K ? "text-gray-500" : "text-gray-700")}>{n.nilai ? LABEL_NILAI[n.nilai] : "–"}</td>
          <td className={cn("px-3 py-3", K ? "text-gray-500" : "text-gray-700")}>{rentang(n, jenis)}</td>
          <td className={cn("px-3 py-3", K && "opacity-60")}><BatangKategori item={n} /></td>
          <td className={cn("px-3 py-3 font-mono text-[12.5px]", K ? "text-gray-500" : "text-gray-700")}>{n.kode}</td>
          <td className="px-3 py-3">
            <div className="flex items-center justify-end gap-1">
              {!K && n.type !== "indeks" && (
                <>
                  <button type="button" onClick={() => geser(n.id, -1)} disabled={idx === 0} aria-label={`Naikkan ${n.judul}`} className={cn(TOMBOL_IKON, "hv opacity-0")}><ChevronUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => geser(n.id, 1)} disabled={idx >= len - 1} aria-label={`Turunkan ${n.judul}`} className={cn(TOMBOL_IKON, "hv opacity-0")}><ChevronDown className="h-4 w-4" /></button>
                </>
              )}
              {K ? (
                <button type="button" onClick={() => setDlg({ item: n, baru: false, indukId: null })} aria-label={`Cek detail ${n.judul}`} className={TOMBOL_KECIL}>Cek Detail</button>
              ) : (
                <button type="button" onClick={() => setDlg({ item: n, baru: false, indukId: null })} aria-label={`Ubah ${n.judul}`} className={TOMBOL_IKON}><Pencil className="h-4 w-4" /></button>
              )}
              {!K && n.type !== "indeks" && (
                <button type="button" onClick={() => setHapus(cari(m, n.id))} aria-label={`Hapus ${n.judul}`} className={cn(TOMBOL_IKON, "hv opacity-0")}><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          </td>
        </tr>
        {induk && buka(n) && (
          <>
            {n.kids.map((k, i) => baris(k, i, n.kids.length, 2))}
            {!L && (
              <tr className="border-b border-[#eef0f2]">
                <td colSpan={6} className="py-2.5 pl-[52px]">
                  <button type="button" onClick={() => tambah(n.type === "indikator" ? "sub" : "aspek_ind", n)} className={TOMBOL_TAUTAN}>
                    <Plus className="h-3.5 w-3.5" /> {n.type === "indikator" ? "Subindikator" : "Indikator aspek"}
                  </button>
                </td>
              </tr>
            )}
          </>
        )}
      </Fragment>
    )
  }

  const kelompok = (judul: string, tipe: "indikator" | "aspek" | "dokumen", tombol: string) => {
    const daftar = m.items.filter((n) => n.type === tipe)
    return (
      <>
        <tr className="bg-[#F9F9F9]">
          <td colSpan={5} className="px-4 py-2.5 text-xs font-semibold uppercase text-gray-500">{judul} ({daftar.length})</td>
          <td className="px-3 py-2.5 text-right">
            {(!L || tipe === "dokumen") && (
              <button type="button" onClick={() => tambah(tipe, null)} className={TOMBOL_TAUTAN}><Plus className="h-3.5 w-3.5" /> {tombol}</button>
            )}
          </td>
        </tr>
        {daftar.length ? daftar.map((n, i) => baris(n, i, daftar.length, 1)) : (
          <tr className="border-b border-[#eef0f2]"><td colSpan={6} className="px-4 py-3 text-gray-400">Belum ada</td></tr>
        )}
      </>
    )
  }

  const dialogItem = dlg && (
    <DialogItem
      key={dlg.item.id} item={dlg.item} baru={dlg.baru} jenis={jenis} tahun={tahun} terkunci={kunciItem(dlg.item)}
      induk={dlg.indukId ? cari(m, dlg.indukId)?.n ?? null : null}
      onTutup={() => setDlg(null)} onSimpan={simpan}
    />
  )

  return (
    <div className="space-y-5">
      <div>
        <nav aria-label="Navigasi halaman" className="mb-2 flex items-center gap-1.5 text-sm text-gray-500">
          <button type="button" onClick={onKembali} className="hover:text-gray-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-[2px]">Metadata &amp; Unggah Data</button>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="text-gray-900" aria-current="page">Metadata {label} {tahun}</span>
        </nav>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">Metadata {label} {tahun}</h1>
            <p className="mt-0.5 text-sm text-gray-500">{ringkas}</p>
          </div>
          <button type="button" onClick={onTemplate} disabled={!ok} title={ok ? undefined : "Lengkapi metadata dulu"} className={TOMBOL_UTAMA}>
            <Download className="h-4 w-4" /> Template
          </button>
        </div>
      </div>

      {L && (
        <div className="flex items-center gap-2.5 rounded-[4px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">Sebagian terkunci karena ada {pengunci.length} file data {label} {tahun}. Hapus file untuk mengubah indikator, aspek, dan kategori. Dokumen masih bisa diubah.</span>
          <button type="button" onClick={onKembali} className={TOMBOL_KECIL_HITAM}>Lihat file</button>
        </div>
      )}

      <section className="overflow-hidden rounded-[4px] border border-[#D9DBDD] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] table-fixed text-sm">
            <colgroup>
              <col /><col className="w-[12%]" /><col className="w-[11%]" /><col className="w-[17%]" /><col className="w-[15%]" /><col className="w-[150px]" />
            </colgroup>
            <thead>
              <tr className={TR_HEAD}>
                <th className={cn(TH, "pl-4")}>Judul</th><th className={TH}>Tipe nilai</th><th className={TH}>Rentang</th><th className={TH}>Kategori</th><th className={TH}>Kode</th><th className={TH} />
              </tr>
            </thead>
            <tbody>
              {baris(m.root, 0, 1, 1)}
              {kelompok("Indikator", "indikator", "Indikator")}
              {kelompok("Aspek Tambahan", "aspek", "Aspek")}
              {kelompok("Download Dokumen", "dokumen", "Dokumen")}
            </tbody>
          </table>
        </div>
      </section>

      {dialogItem}

      <Dialog open={!!hapus} onOpenChange={(o) => !o && setHapus(null)}>
        <DialogContent className="sm:max-w-md">
          {hapus && (
            <>
              <DialogHeader>
                <DialogTitle>Hapus {LABEL_ITEM[hapus.n.type].toLowerCase()}?</DialogTitle>
                <DialogDescription>
                  “{hapus.n.judul}”{hapus.n.kids.length ? ` dan ${hapus.n.kids.length} item di bawahnya` : ""} akan dihapus dari metadata.
                </DialogDescription>
              </DialogHeader>
              {L && hapus.n.type === "dokumen" && (
                <div className="flex gap-2.5 rounded-[4px] border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900" role="alert">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>Link dokumen ini hilang dari data yang sudah diunggah, dan tombol unduhnya hilang dari halaman sekolah atau daerah. Tindakan ini tidak bisa dibatalkan.</p>
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setHapus(null)} className={TOMBOL_PUTIH}>Batal</button>
                <button type="button" onClick={hapusItem} className={TOMBOL_MERAH}>Hapus</button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
