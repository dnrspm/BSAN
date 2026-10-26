"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, MapPin, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { KAB_KOTA_BY_PROVINSI } from "@/data/kabKotaData"

/** `provinsi` kosong = seluruh Indonesia; `kabKota` kosong = semua kab/kota di provinsi tersebut. */
export interface WilayahPilihan {
  provinsi: string | null
  kabKota: string | null
}

export const SELURUH_INDONESIA: WilayahPilihan = { provinsi: null, kabKota: null }

const PROVINSI_LIST = Object.keys(KAB_KOTA_BY_PROVINSI)

function labelWilayah(w: WilayahPilihan) {
  if (w.kabKota) return `${w.kabKota}, ${w.provinsi}`
  if (w.provinsi) return `${w.provinsi} (semua kab/kota)`
  return "Seluruh Indonesia"
}

const BARIS = "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
const AKTIF = "bg-blue-50 text-blue-700 font-medium"

/** Filter wilayah bertingkat: seluruh Indonesia, semua kab/kota di satu provinsi, atau satu kab/kota. */
export function WilayahFilter({ nilai, onChange }: { nilai: WilayahPilihan; onChange: (w: WilayahPilihan) => void }) {
  const [buka, setBuka] = useState(false)
  const [draf, setDraf] = useState<WilayahPilihan>(nilai)

  const bukaModal = () => {
    setDraf(nilai)
    setBuka(true)
  }
  const terapkan = () => {
    onChange(draf)
    setBuka(false)
  }
  const daftarKab = draf.provinsi ? KAB_KOTA_BY_PROVINSI[draf.provinsi] ?? [] : []

  return (
    <>
      <button
        type="button"
        onClick={bukaModal}
        className="w-full h-10 px-3 flex items-center gap-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      >
        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="flex-1 truncate text-left">{labelWilayah(nilai)}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {buka && (
        <div role="dialog" aria-modal="true" aria-label="Filter Wilayah" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setBuka(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Filter Wilayah</h3>
              <button type="button" onClick={() => setBuka(false)} className="p-1 hover:bg-gray-100 rounded-lg" aria-label="Tutup">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex h-[420px] min-h-0">
              <div className="w-1/2 border-r border-gray-100 overflow-y-auto p-2 space-y-0.5">
                <button
                  type="button"
                  onClick={() => setDraf(SELURUH_INDONESIA)}
                  className={cn(BARIS, "font-medium", draf.provinsi === null ? AKTIF : "hover:bg-gray-50 text-gray-700")}
                >
                  Seluruh Indonesia
                </button>
                <div className="border-t border-gray-100 my-1" />
                {PROVINSI_LIST.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDraf({ provinsi: p, kabKota: null })}
                    className={cn(BARIS, "flex items-center justify-between", draf.provinsi === p ? AKTIF : "hover:bg-gray-50 text-gray-700")}
                  >
                    <span className="truncate">{p}</span>
                    {draf.provinsi === p && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-blue-500" />}
                  </button>
                ))}
              </div>

              <div className="w-1/2 overflow-y-auto bg-gray-50/40 p-2 space-y-0.5">
                {draf.provinsi ? (
                  <>
                    <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{draf.provinsi}</p>
                    <button
                      type="button"
                      onClick={() => setDraf({ provinsi: draf.provinsi, kabKota: null })}
                      className={cn(BARIS, "font-medium", draf.kabKota === null ? AKTIF : "hover:bg-gray-100 text-gray-700")}
                    >
                      Semua Kabupaten/Kota
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    {daftarKab.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setDraf({ provinsi: draf.provinsi, kabKota: k })}
                        className={cn(BARIS, draf.kabKota === k ? AKTIF : "hover:bg-gray-100 text-gray-700")}
                      >
                        {k}
                      </button>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-gray-400 p-4">Pilih provinsi di kiri untuk melihat kab/kota</p>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button type="button" onClick={() => setBuka(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition">
                Batal
              </button>
              <button type="button" onClick={terapkan} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition">
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
