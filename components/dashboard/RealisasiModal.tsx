"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Kegiatan } from "./KegiatanView"

interface RealisasiModalProps {
  kegiatan: Kegiatan
  onClose: () => void
  onSave: (id: string, realize: { jumlahPeserta: number; tanggalRealisasi: string; catatan: string; linkDokumentasi: string; createdAt: string }) => void
}

export function RealisasiModal({ kegiatan, onClose, onSave }: RealisasiModalProps) {
  const [jumlahPeserta, setJumlahPeserta] = useState(kegiatan?.realize?.jumlahPeserta?.toString() || "")
  const [tanggalRealisasi, setTanggalRealisasi] = useState(kegiatan?.realize?.tanggalRealisasi || "")
  const [catatan, setCatatan] = useState(kegiatan?.realize?.catatan || "")
  const [linkDokumentasi, setLinkDokumentasi] = useState(kegiatan?.realize?.dokumentasi || (kegiatan as Record<string, unknown>)?.linkDokumentasi as string || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!jumlahPeserta || !tanggalRealisasi) return

    onSave(kegiatan.id, {
      jumlahPeserta: parseInt(jumlahPeserta),
      tanggalRealisasi,
      catatan,
      linkDokumentasi,
      createdAt: new Date().toISOString(),
    })
    onClose()
  }

  const isValid = jumlahPeserta && tanggalRealisasi

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900">Laporan Realisasi Kegiatan</h3>
            <p className="text-xs text-gray-500 mt-0.5">{kegiatan.namaKegiatan}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah Peserta <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={jumlahPeserta}
              onChange={(e) => setJumlahPeserta(e.target.value)}
              placeholder="Masukkan jumlah peserta"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Pelaksanaan <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={tanggalRealisasi}
              onChange={(e) => setTanggalRealisasi(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link Dokumentasi
            </label>
            <input
              type="url"
              value={linkDokumentasi}
              onChange={(e) => setLinkDokumentasi(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan Tambahan
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan catatan jika diperlukan..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>
        </form>

        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 px-4 text-sm"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="h-9 px-4 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simpan Laporan
          </Button>
        </div>
      </div>
    </div>
  )
}