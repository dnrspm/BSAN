"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, Download, FileSpreadsheet, Lock, Pencil, Plus, Trash2, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { readAuthSession } from "@/lib/auth-session"
import {
  JENIS, filePengunci, formatWaktu, idBaru, labelJenis, lengkap, metadataKosong, salinMetadata, useMetadataBsan,
  type Jenis, type Metadata,
} from "@/lib/metadata-bsan"
import { bacaDataXlsx, unduhTemplate } from "@/lib/metadata-bsan-excel"
import { FilterSelect } from "@/components/pusat/IndeksBsanPusatView"
import { EditorMetadata } from "@/components/pusat/metadata/EditorMetadata"
import {
  DialogBuatMetadata, DialogDetailFile, DialogHapusFile, DialogTahunBaru, DialogTemplate, DialogUnggah, type SumberBuat,
} from "@/components/pusat/metadata/Dialogs"
import {
  LENCANA, LencanaStatus, TH, TOMBOL_IKON_BORDER, TOMBOL_KECIL, TOMBOL_KECIL_HITAM, TOMBOL_UTAMA, TR_HEAD,
} from "@/components/pusat/metadata/gaya"

type Dlg =
  | { k: "tahun" }
  | { k: "buat"; y: number; j: Jenis }
  | { k: "unggah"; y: number }
  | { k: "template"; y: number; j: Jenis }
  | { k: "hapus"; y: number; id: string }
  | { k: "detail"; y: number; id: string }

/**
 * Metadata & Unggah Data Indeks BSAN (Admin Pusat). Per tahun: 1) metadata sekolah dan dinas (kerangka indikator,
 * subindikator, tipe nilai, kategori, dokumen), 2) file data .xlsx dari template yang dibuat dari metadata.
 * Metadata belum lengkap mengunci template dan unggah; ada file data berhasil/diproses mengunci metadata.
 */
export function MetadataUnggahView() {
  const { db, ubah } = useMetadataBsan()
  const [edit, setEdit] = useState<{ y: number; j: Jenis } | null>(null)
  const [dlg, setDlg] = useState<Dlg | null>(null)
  const [fy, setFy] = useState("")
  const [fj, setFj] = useState<Jenis | "">("")
  const [terbuka, setTerbuka] = useState<Record<number, boolean>>({})
  const [toast, setToast] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const tampilToast = (p: string) => {
    setToast(p)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(""), 3200)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  const tahunUrut = Object.keys(db).map(Number).sort((a, b) => b - a)
  const buka = (y: number) => terbuka[y] ?? tahunUrut.indexOf(y) < 2

  const bukaEditor = (y: number, j: Jenis) => {
    setEdit({ y, j })
    window.scrollTo({ top: 0 })
  }
  const kembali = () => {
    setEdit(null)
    window.scrollTo({ top: 0 })
  }

  const tahunBaru = (tahun: number, salinDari: number | null) => {
    if (db[tahun]) { setDlg(null); return tampilToast(`Tahun ${tahun} sudah ada`) }
    ubah((d) => {
      const src = salinDari ? d[salinDari].meta : null
      d[tahun] = { meta: { sekolah: src?.sekolah ? salinMetadata(src.sekolah, "sekolah", tahun) : null, dinas: src?.dinas ? salinMetadata(src.dinas, "dinas", tahun) : null }, files: [] }
    })
    setTerbuka((t) => ({ ...t, [tahun]: true }))
    setDlg(null)
    tampilToast(`Tahun ${tahun} ditambahkan`)
  }

  const buatMetadata = (y: number, j: Jenis, s: SumberBuat) => {
    const lain: Jenis = j === "sekolah" ? "dinas" : "sekolah"
    ubah((d) => {
      const sumber = s === "other" ? d[y].meta[lain] : s === "prev" ? d[y - 1]?.meta[j] : null
      d[y].meta[j] = sumber ? salinMetadata(sumber, j, y) : metadataKosong(j, y)
    })
    setDlg(null)
    bukaEditor(y, j)
    tampilToast(`Metadata ${labelJenis(j)} ${y} dibuat`)
  }

  const unggah = async (y: number, j: Jenis, file: File) => {
    const meta = db[y].meta[j]
    if (!meta) return
    const hasil = await bacaDataXlsx(file, meta, j)
    const id = idBaru()
    ubah((d) => {
      d[y].files.unshift({ id, waktu: new Date().toISOString(), jenis: j, nama: file.name, pengunggah: readAuthSession()?.username ?? "admin.pusat", ...hasil, status: "Diproses" })
    })
    // Pemrosesan di server disimulasikan; status akhir mengikuti hasil pemeriksaan file.
    setTimeout(() => ubah((d) => { const f = d[y]?.files.find((x) => x.id === id); if (f) f.status = hasil.status }), 1500)
    setDlg(null)
    tampilToast(hasil.status === "Gagal" ? "File diunggah, tetapi tidak dapat diproses. Lihat detailnya." : `File diunggah · Metadata ${labelJenis(j)} ${y} kini terkunci`)
  }

  const hapusFile = (y: number, id: string) => {
    const f = db[y].files.find((x) => x.id === id)
    if (!f) return
    ubah((d) => { d[y].files = d[y].files.filter((x) => x.id !== id) })
    const sisa = filePengunci({ ...db[y], files: db[y].files.filter((x) => x.id !== id) }, f.jenis).length
    setDlg(null)
    tampilToast(sisa ? "File dihapus" : `File dihapus · Metadata ${labelJenis(f.jenis)} ${y} bisa diubah lagi`)
  }

  if (edit) {
    return (
      <>
        <EditorMetadata
          db={db} ubah={ubah} tahun={edit.y} jenis={edit.j} onKembali={kembali}
          onTemplate={() => setDlg({ k: "template", y: edit.y, j: edit.j })} onToast={tampilToast}
        />
        {renderDialog()}
        <Toast pesan={toast} />
      </>
    )
  }

  function renderDialog() {
    if (!dlg) return null
    const tutup = () => setDlg(null)
    if (dlg.k === "tahun") return <DialogTahunBaru tahunAda={tahunUrut} onTutup={tutup} onBuat={tahunBaru} />
    if (dlg.k === "buat") {
      const lain: Jenis = dlg.j === "sekolah" ? "dinas" : "sekolah"
      return <DialogBuatMetadata tahun={dlg.y} jenis={dlg.j} adaLain={!!db[dlg.y].meta[lain]} adaTahunLalu={!!db[dlg.y - 1]?.meta[dlg.j]} onTutup={tutup} onBuat={(s) => buatMetadata(dlg.y, dlg.j, s)} />
    }
    if (dlg.k === "unggah") {
      return (
        <DialogUnggah
          tahun={dlg.y} meta={db[dlg.y].meta} onTutup={tutup}
          onUnggah={(j, f) => unggah(dlg.y, j, f)}
          onTemplate={(j) => setDlg({ k: "template", y: dlg.y, j })}
        />
      )
    }
    if (dlg.k === "template") {
      const m = db[dlg.y].meta[dlg.j]
      if (!m) return null
      return <DialogTemplate tahun={dlg.y} jenis={dlg.j} meta={m} onTutup={tutup} onUnduh={async () => { await unduhTemplate(m, dlg.j, dlg.y); tutup(); tampilToast(`template_indeks_bsan_${dlg.j}_${dlg.y}.xlsx diunduh`) }} />
    }
    const f = db[dlg.y]?.files.find((x) => x.id === dlg.id)
    if (!f) return null
    if (dlg.k === "detail") return <DialogDetailFile file={f} tahun={dlg.y} onTutup={tutup} />
    const urut = db[dlg.y].files
    const adaFileLama = urut.slice(urut.indexOf(f) + 1).some((o) => o.jenis === f.jenis && o.status === "Berhasil")
    return <DialogHapusFile file={f} tahun={dlg.y} adaFileLama={adaFileLama} onTutup={tutup} onHapus={() => hapusFile(dlg.y, dlg.id)} />
  }

  const tampil = tahunUrut.filter((y) => !fy || String(y) === fy)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Metadata &amp; Unggah Data</h1>
          <p className="mt-0.5 text-sm text-gray-500">Siapkan metadata, unduh template, lalu unggah data sekolah atau dinas.</p>
        </div>
        <button type="button" onClick={() => setDlg({ k: "tahun" })} className={cn(TOMBOL_UTAMA, "shrink-0")}>
          <Plus className="h-4 w-4" /> Tahun Baru
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 [&>*]:w-full [&>*]:shrink-0 sm:[&>*]:w-[180px]">
        <FilterSelect aria-label="Filter tahun" value={fy} onChange={(e) => setFy(e.target.value)}>
          <option value="">Semua Tahun</option>
          {tahunUrut.map((y) => <option key={y} value={y}>{y}</option>)}
        </FilterSelect>
        <FilterSelect aria-label="Filter jenis data" value={fj} onChange={(e) => setFj(e.target.value as Jenis | "")}>
          <option value="">Semua Jenis Data</option>
          {JENIS.map((j) => <option key={j.id} value={j.id}>{j.label}</option>)}
        </FilterSelect>
      </div>

      <div className="space-y-4">
        {tampil.map((y) => {
          const d = db[y]
          const jumlahSiap = JENIS.filter((j) => lengkap(d.meta[j.id])).length
          const adaMeta = jumlahSiap > 0
          const files = d.files.filter((f) => !fj || f.jenis === fj)
          const b = buka(y)
          return (
            <section key={y} className="rounded-[4px] border border-[#D9DBDD] bg-white">
              <button
                type="button" onClick={() => setTerbuka((t) => ({ ...t, [y]: !b }))} aria-expanded={b}
                className="flex w-full items-center gap-2.5 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
              >
                <h2 className="text-base font-bold text-gray-900">Tahun {y}</h2>
                <span className="text-sm text-gray-500">{d.files.length} file</span>
                {jumlahSiap < 2 && <span className={cn(LENCANA, "bg-[#efefef] text-[#2f3031]")}>Metadata belum lengkap</span>}
                <span className="flex-1" />
                <ChevronDown className={cn("h-5 w-5 text-gray-500 transition-transform", b && "rotate-180")} aria-hidden="true" />
              </button>

              {b && (
                <div className="space-y-4 border-t border-[#D9DBDD] bg-[#F9F9F9] px-5 pb-5 pt-4">
                  {/* 1. Metadata */}
                  <div className="overflow-hidden rounded-[4px] border border-[#D9DBDD] bg-white">
                    <Langkah no={1} judul="Metadata" />
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] table-fixed text-sm">
                        <colgroup><col className="w-[16%]" /><col /><col className="w-[16%]" /><col className="w-[230px]" /></colgroup>
                        <thead><tr className={TR_HEAD}><th className={cn(TH, "pl-4")}>Jenis</th><th className={TH}>Isi</th><th className={TH}>Status</th><th className={TH} /></tr></thead>
                        <tbody className="divide-y divide-[#eef0f2]">
                          {JENIS.map((j) => {
                            const m = d.meta[j.id]
                            if (!m) {
                              return (
                                <tr key={j.id}>
                                  <td className="py-3 pl-4 pr-3 font-medium text-gray-900">{j.label}</td>
                                  <td className="px-3 py-3 text-gray-500">–</td>
                                  <td className="px-3 py-3"><span className={cn(LENCANA, "bg-[#efefef] text-[#2f3031]")}>Belum dibuat</span></td>
                                  <td className="px-3 py-3"><div className="flex justify-end"><button type="button" onClick={() => setDlg({ k: "buat", y, j: j.id })} className={TOMBOL_KECIL_HITAM}><Plus className="h-3.5 w-3.5" /> Buat</button></div></td>
                                </tr>
                              )
                            }
                            const kunci = filePengunci(d, j.id).length
                            const ok = lengkap(m)
                            return (
                              <tr key={j.id}>
                                <td className="py-3 pl-4 pr-3 font-medium text-gray-900">{j.label}</td>
                                <td className="px-3 py-3 text-gray-600">{ringkasan(m)}</td>
                                <td className="px-3 py-3">
                                  {kunci ? (
                                    <span className={cn(LENCANA, "bg-amber-100 text-amber-900")} title={`Hapus ${kunci} file data ${j.label} untuk mengubah`}><Lock className="h-3 w-3" aria-hidden="true" /> Terkunci</span>
                                  ) : ok ? (
                                    <span className={cn(LENCANA, "bg-emerald-300 text-emerald-950")}>Siap</span>
                                  ) : (
                                    <span className={cn(LENCANA, "bg-[#efefef] text-[#2f3031]")}>Belum lengkap</span>
                                  )}
                                </td>
                                <td className="px-3 py-3">
                                  <div className="flex justify-end gap-1.5">
                                    <button type="button" onClick={() => setDlg({ k: "template", y, j: j.id })} disabled={!ok} title={ok ? undefined : "Lengkapi metadata dulu"} className={TOMBOL_KECIL_HITAM}>
                                      <Download className="h-3.5 w-3.5" /> Template
                                    </button>
                                    <button type="button" onClick={() => bukaEditor(y, j.id)} className={TOMBOL_KECIL}>
                                      {kunci ? "Cek Detail" : <><Pencil className="h-3.5 w-3.5" /> Ubah</>}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 2. File data */}
                  <div className="overflow-hidden rounded-[4px] border border-[#D9DBDD] bg-white">
                    <Langkah no={2} judul="File Data" mati={!adaMeta}>
                      <button type="button" onClick={() => setDlg({ k: "unggah", y })} disabled={!adaMeta} className={TOMBOL_KECIL_HITAM}>
                        <Upload className="h-3.5 w-3.5" /> Unggah Data
                      </button>
                    </Langkah>
                    {!adaMeta ? (
                      <Kosong ikon={<Lock className="h-4 w-4" />} teks="Lengkapi metadata dulu" />
                    ) : files.length === 0 ? (
                      <Kosong ikon={<FileSpreadsheet className="h-4 w-4" />} teks={d.files.length ? "Tidak ada file ditemukan" : "Belum ada file"} />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] table-fixed text-sm">
                          <colgroup><col className="w-[17%]" /><col className="w-[11%]" /><col /><col className="w-[13%]" /><col className="w-[12%]" /><col className="w-[170px]" /></colgroup>
                          <thead><tr className={TR_HEAD}><th className={cn(TH, "pl-4")}>Waktu Unggah</th><th className={TH}>Jenis Data</th><th className={TH}>Nama File</th><th className={TH}>Pengunggah</th><th className={TH}>Status</th><th className={TH} /></tr></thead>
                          <tbody className="divide-y divide-[#eef0f2]">
                            {files.map((f) => (
                              <tr key={f.id} className="transition-colors hover:bg-[#F9F9F9]">
                                <td className="py-3 pl-4 pr-3 tabular-nums text-gray-600">{formatWaktu(f.waktu)}</td>
                                <td className="px-3 py-3 text-gray-600">{labelJenis(f.jenis)}</td>
                                <td className="truncate px-3 py-3 font-medium text-gray-900" title={f.nama}>{f.nama}</td>
                                <td className="truncate px-3 py-3 text-gray-600" title={f.pengunggah}>{f.pengunggah}</td>
                                <td className="px-3 py-3"><LencanaStatus status={f.status} /></td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button type="button" onClick={() => setDlg({ k: "detail", y, id: f.id })} aria-label={`Cek detail ${f.nama}`} className={TOMBOL_KECIL}>Cek Detail</button>
                                    <button type="button" onClick={() => setDlg({ k: "hapus", y, id: f.id })} aria-label={`Hapus ${f.nama}`} title="Hapus file" className={TOMBOL_IKON_BORDER}><Trash2 className="h-4 w-4" /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )
        })}
      </div>

      {renderDialog()}
      <Toast pesan={toast} />
    </div>
  )
}

function ringkasan(m: Metadata) {
  let a = 0, b = 0, c = 0, d = 0
  for (const n of m.items) {
    if (n.type === "indikator") { a++; b += n.kids.length } else if (n.type === "aspek") c++; else d++
  }
  return `${a} indikator · ${b} subindikator · ${c} aspek · ${d} dokumen`
}

function Langkah({ no, judul, mati, children }: { no: number; judul: string; mati?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-[#D9DBDD] bg-white px-4 py-3">
      <span className={cn("inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", mati ? "bg-gray-300" : "bg-blue-600")} aria-hidden="true">{no}</span>
      <h3 className="text-[15px] font-semibold text-gray-900">{judul}</h3>
      <span className="flex-1" />
      {children}
    </div>
  )
}

function Kosong({ ikon, teks }: { ikon: React.ReactNode; teks: string }) {
  return <div className="flex items-center justify-center gap-2 px-4 py-7 text-sm text-gray-500">{ikon}{teks}</div>
}

function Toast({ pesan }: { pesan: string }) {
  if (!pesan) return null
  return (
    <div role="status" className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-gray-900 px-4 py-2.5 text-[13px] text-white shadow-lg">
      {pesan}
    </div>
  )
}
