"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  LABEL_ITEM, LABEL_NILAI, WARNA, fmt, kategoriKosong, labelJenis, periksaCakupan,
  type ItemMeta, type Jenis, type Kategori, type TipeNilai, type Warna,
} from "@/lib/metadata-bsan"
import { KOLOM, TOMBOL_IKON, TOMBOL_PUTIH, TOMBOL_TAUTAN, TOMBOL_UTAMA } from "@/components/pusat/metadata/gaya"

export interface HasilItem { judul: string; desk: string; nilai: TipeNilai; min: number; max: number; kat: Kategori[] }

interface Props {
  item: ItemMeta
  baru: boolean
  induk: ItemMeta | null
  jenis: Jenis
  tahun: number
  /** Metadata terkunci: dialog hanya untuk melihat. */
  terkunci: boolean
  onTutup: () => void
  onSimpan: (h: HasilItem) => void
}

const INPUT_KAT = "h-[34px] w-full rounded-[4px] border border-[#808489] bg-white px-2 text-[13px] disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

/** Pop-up tambah/ubah/lihat satu item metadata: judul, definisi, tipe nilai, rentang, dan kategori berwarna. */
export function DialogItem({ item, baru, induk, jenis, tahun, terkunci: kunci, onTutup, onSimpan }: Props) {
  const L = !baru && kunci
  const [judul, setJudul] = useState(item.judul)
  const [desk, setDesk] = useState(item.desk)
  const [nilai, setNilai] = useState<TipeNilai>(item.nilai)
  const [min, setMin] = useState(String(item.min).replace(".", ","))
  const [max, setMax] = useState(String(item.max).replace(".", ","))
  const [kat, setKat] = useState<Kategori[]>(() => item.kat.map((k) => ({ ...k })))
  const [palet, setPalet] = useState(-1)
  const [galatJudul, setGalatJudul] = useState(false)

  const grup = nilai === "group" || nilai === "link"
  const cakupan = periksaCakupan({ nilai, min, max, kat })
  const bisaSimpan = !L && (grup || (!!nilai && cakupan.ok))
  const judulTerkunci = L || item.type === "indeks"
  const satuan = jenis === "dinas" ? "provinsi/kab-kota" : "sekolah"

  const ubahKat = (i: number, p: Partial<Kategori>) => setKat((k) => k.map((x, j) => (j === i ? { ...x, ...p } : x)))
  const pilihTipe = (v: TipeNilai) => {
    setNilai(v)
    setMin("0")
    setMax(v === "percentage" ? "100" : "10")
    setKat(kategoriKosong(v))
    setPalet(-1)
  }
  const tambahKat = () =>
    setKat((k) => {
      const i = k.findIndex((x) => x.f === "kosong")
      const baru: Kategori = { l: "", f: "", t: "", c: "biru" }
      return i < 0 ? [...k, baru] : [...k.slice(0, i), baru, ...k.slice(i)]
    })

  const simpan = () => {
    if (!judul.trim()) return setGalatJudul(true)
    onSimpan({
      judul: judul.trim(),
      desk: desk.trim(),
      nilai,
      min: Number(String(min).replace(",", ".")) || 0,
      max: nilai === "boolean" ? 1 : Number(String(max).replace(",", ".")) || 0,
      kat: grup ? [] : kat,
    })
  }

  const judulDlg = (baru ? "Tambah " : L ? "" : "Ubah ") + LABEL_ITEM[item.type]
  const boolean = nilai === "boolean"

  return (
    <Dialog open onOpenChange={(o) => !o && onTutup()}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{judulDlg}</DialogTitle>
          <DialogDescription className="sr-only">Atur judul, definisi, tipe nilai, rentang, dan kategori item metadata.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {induk && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-[4px] bg-[#F9F9F9] px-3 py-2.5 text-[13px] text-gray-500">
              <span>Induk <b className="font-semibold text-gray-900">{induk.judul}</b></span>
              <span>{labelJenis(jenis)} {tahun}</span>
            </div>
          )}

          <label className="block text-gray-600">
            Judul
            <input
              value={judul}
              onChange={(e) => { setJudul(e.target.value); setGalatJudul(false) }}
              disabled={judulTerkunci}
              autoFocus={baru}
              aria-invalid={galatJudul}
              className={cn(KOLOM, "mt-1.5", galatJudul && "border-red-600")}
            />
            {galatJudul && <span className="mt-1 block text-xs font-medium text-red-600">Judul wajib diisi.</span>}
          </label>

          <label className="block text-gray-600">
            Definisi
            <textarea
              value={desk}
              onChange={(e) => setDesk(e.target.value)}
              disabled={L}
              rows={3}
              className="mt-1.5 min-h-[72px] w-full resize-y rounded-[4px] border border-[#808489] bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </label>

          {nilai === "link" && (
            <div className="rounded-[4px] bg-[#F9F9F9] px-3 py-2.5 text-[13px] text-gray-500">
              Link dokumen diisi per {satuan} di template data. Pengguna mengunduhnya dari halaman detail Indeks BSAN.
            </div>
          )}

          {!grup && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-gray-600">
                  Tipe nilai
                  <select value={nilai} onChange={(e) => pilihTipe(e.target.value as TipeNilai)} disabled={L} className={cn(KOLOM, "mt-1.5")}>
                    {!nilai && <option value="" disabled>Pilih tipe nilai</option>}
                    {(["numeric", "percentage", "boolean"] as const).map((t) => (
                      <option key={t} value={t}>{LABEL_NILAI[t]}</option>
                    ))}
                  </select>
                </label>
                {nilai && !boolean ? (
                  <div className="text-gray-600">
                    Rentang nilai
                    <div className="mt-1.5 flex items-center gap-2">
                      <input value={min} onChange={(e) => setMin(e.target.value)} disabled={L} aria-label="Minimum" className={KOLOM} />
                      –
                      <input value={max} onChange={(e) => setMax(e.target.value)} disabled={L} aria-label="Maksimum" className={KOLOM} />
                    </div>
                  </div>
                ) : <div />}
              </div>

              <div className="text-gray-600">
                Kategori
                {nilai ? (
                  <>
                    <div className="mt-1.5 overflow-hidden rounded-[4px] border border-[#D9DBDD]">
                      <table className="w-full border-collapse text-[13px]">
                        <thead>
                          <tr className="bg-[#F1F1F1] text-left text-[11px] font-semibold uppercase text-gray-500">
                            <th className="w-11 px-2.5 py-2">Warna</th>
                            <th className="px-2.5 py-2">Nama kategori</th>
                            {boolean ? <th className="w-[110px] px-2.5 py-2">Nilai</th> : <><th className="w-24 px-2.5 py-2">Dari</th><th className="w-24 px-2.5 py-2">Sampai</th></>}
                            <th className="w-10" />
                          </tr>
                        </thead>
                        <tbody>
                          {kat.map((k, i) => (
                            <BarisKategori
                              key={i}
                              k={k} boolean={boolean} L={L} bisaHapus={!L && !boolean && kat.length >= 2}
                              paletBuka={palet === i}
                              onPalet={() => setPalet(palet === i ? -1 : i)}
                              onUbah={(p) => ubahKat(i, p)}
                              onWarna={(c) => { ubahKat(i, { c }); setPalet(-1) }}
                              onHapus={() => { setKat((x) => x.filter((_, j) => j !== i)); setPalet(-1) }}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!L && !boolean && (
                      <button type="button" onClick={tambahKat} className={cn(TOMBOL_TAUTAN, "mt-2")}>
                        <Plus className="h-3.5 w-3.5" /> Kategori
                      </button>
                    )}
                  </>
                ) : (
                  <div className="mt-1.5 rounded-[4px] bg-[#F9F9F9] px-3 py-2.5 text-center text-[13px] text-gray-500">Pilih tipe nilai dulu</div>
                )}
              </div>

              {!L && nilai && (cakupan.ok ? (
                !boolean && (
                  <div className="flex items-start gap-2 rounded-[4px] bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-800" role="status">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    Semua nilai {fmt(cakupan.mn ?? 0)} sampai {fmt(cakupan.mx ?? 0)} sudah punya kategori
                  </div>
                )
              ) : (
                <div className="flex items-start gap-2 rounded-[4px] bg-rose-50 px-3 py-2.5 text-[13px] text-rose-800" role="status">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <ul className="list-disc pl-4">{cakupan.pesan.map((m) => <li key={m}>{m}</li>)}</ul>
                </div>
              ))}
            </>
          )}

          {!baru && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-[4px] bg-[#F9F9F9] px-3 py-2.5 text-[13px] text-gray-500">
              <span>Kode <b className="font-mono text-xs font-semibold text-gray-900">{item.kode}</b></span>
              <span>Padanan {tahun - 1} <b className="font-mono text-xs font-semibold text-gray-900">{item.prev ?? "–"}</b></span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          {L ? (
            <button type="button" onClick={onTutup} className={TOMBOL_PUTIH}>Tutup</button>
          ) : (
            <>
              <button type="button" onClick={onTutup} className={TOMBOL_PUTIH}>Batal</button>
              <button type="button" onClick={simpan} disabled={!bisaSimpan} className={TOMBOL_UTAMA}>Simpan</button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function BarisKategori({
  k, boolean, L, bisaHapus, paletBuka, onPalet, onUbah, onWarna, onHapus,
}: {
  k: Kategori; boolean: boolean; L: boolean; bisaHapus: boolean; paletBuka: boolean
  onPalet: () => void; onUbah: (p: Partial<Kategori>) => void; onWarna: (c: Warna) => void; onHapus: () => void
}) {
  const kosong = k.f === "kosong"
  return (
    <>
      <tr className="border-t border-[#eef0f2]">
        <td className="px-2 py-1.5">
          <button
            type="button" onClick={onPalet} disabled={L} aria-label={`Warna ${k.l || "kategori"}: ${k.c}`} aria-expanded={paletBuka}
            className="block h-[26px] w-[26px] rounded-[4px] border border-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed"
            style={{ background: WARNA[k.c][0] }}
          />
        </td>
        <td className="px-2 py-1.5"><input value={k.l} onChange={(e) => onUbah({ l: e.target.value })} disabled={L} aria-label="Nama kategori" className={INPUT_KAT} /></td>
        {kosong ? (
          <td colSpan={boolean ? 1 : 2} className="px-2 py-1.5"><input value="Data kosong" disabled aria-label="Rentang" className={INPUT_KAT} /></td>
        ) : boolean ? (
          <td className="px-2 py-1.5"><input value={k.f} disabled aria-label="Nilai" className={INPUT_KAT} /></td>
        ) : (
          <>
            <td className="px-2 py-1.5"><input value={k.f} onChange={(e) => onUbah({ f: e.target.value })} disabled={L} aria-label="Dari" className={INPUT_KAT} /></td>
            <td className="px-2 py-1.5"><input value={k.t} onChange={(e) => onUbah({ t: e.target.value })} disabled={L} aria-label="Sampai" className={INPUT_KAT} /></td>
          </>
        )}
        <td className="px-1 py-1.5">
          {bisaHapus && (
            <button type="button" onClick={onHapus} aria-label={`Hapus kategori ${k.l}`} className={TOMBOL_IKON}><X className="h-4 w-4" /></button>
          )}
        </td>
      </tr>
      {paletBuka && (
        <tr>
          <td colSpan={5} className="bg-[#F9F9F9] px-2.5 py-2">
            <div className="flex gap-1.5">
              {(Object.keys(WARNA) as Warna[]).map((c) => (
                <button
                  key={c} type="button" onClick={() => onWarna(c)} aria-label={c}
                  className="h-[26px] w-[26px] rounded-[4px] border border-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  style={{ background: WARNA[c][0], boxShadow: k.c === c ? "0 0 0 2px #111827" : undefined }}
                />
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
