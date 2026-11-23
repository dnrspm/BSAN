"use client"

import { useEffect, useState } from "react"
import { Download, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { readAuthSession } from "@/lib/auth-session"
import { bacaWilayahDinas } from "@/lib/wilayah-dinas"
import { useDokumenUnduh, type IdentitasDokumen } from "@/lib/metadata-bsan"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const DASAR =
  "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[4px] px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
const BIRU = cn(DASAR, "bg-blue-600 text-white hover:bg-blue-700")

/** Identitas sekolah/daerah dari akun yang login, untuk halaman Indeks BSAN milik sendiri. */
function useIdentitasSesi(aktif: boolean): IdentitasDokumen | null {
  const [id, setId] = useState<IdentitasDokumen | null>(null)
  useEffect(() => {
    if (!aktif) return
    const s = readAuthSession()
    if (s?.role === "sekolah") setId({ jenis: "sekolah", nama: s.namaSekolah })
    else if (s?.role === "dinas") {
      const w = bacaWilayahDinas()
      setId(w.kabKota ? { jenis: "dinas", level: "Kab/Kota", nama: w.kabKota } : { jenis: "dinas", level: "Provinsi", nama: w.provinsi })
    }
  }, [aktif])
  return id
}

interface Props {
  tahun: number
  /** Sekolah/daerah yang detailnya dibuka; kosong = akun yang sedang login. */
  identitas?: IdentitasDokumen
}

const TOMBOL_BARIS =
  "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[4px] border border-[#808489] bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-[#F9F9F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"

/**
 * Satu tombol umum "Unduh Dokumen" untuk sekolah atau daerah. Diklik, ia membuka pop-up berisi semua dokumen yang
 * didaftarkan di metadata (item Download Dokumen) untuk tahun yang dipilih, berapa pun jumlahnya, sehingga dokumen
 * baru tidak mengubah tata letak halaman. Dokumen yang linknya belum diisi untuk daerah ini tampil nonaktif.
 */
export function UnduhDokumen({ tahun, identitas }: Props) {
  const sesi = useIdentitasSesi(!identitas)
  const who = identitas ?? sesi
  const dokumen = useDokumenUnduh(tahun, who)
  if (dokumen.length === 0) return null
  const siapa = who?.nama ? `, ${who.nama}` : ""

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={BIRU}>
          <Download className="h-4 w-4" aria-hidden="true" /> Unduh Dokumen
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unduh Dokumen</DialogTitle>
          <DialogDescription>
            {who?.nama ? `${who.nama} · ` : ""}Tahun {tahun}
          </DialogDescription>
        </DialogHeader>
        <ul className="divide-y divide-[#D9DBDD] overflow-hidden rounded-[4px] border border-[#D9DBDD]">
          {dokumen.map((d) => (
            <li key={d.kode} className="flex items-center gap-3 px-4 py-3">
              <FileText className={cn("h-5 w-5 shrink-0", d.url ? "text-gray-500" : "text-gray-300")} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold", d.url ? "text-gray-900" : "text-gray-500")}>{d.judul} {tahun}</p>
                {d.deskripsi && <p className="mt-0.5 text-xs text-gray-500">{d.deskripsi}</p>}
              </div>
              {d.url ? (
                <a href={d.url} target="_blank" rel="noopener noreferrer" aria-label={`Unduh ${d.judul} ${tahun}${siapa}`} className={TOMBOL_BARIS}>
                  <Download className="h-3.5 w-3.5" aria-hidden="true" /> Unduh
                </a>
              ) : (
                <span className="shrink-0 text-xs text-gray-500">Belum tersedia</span>
              )}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
