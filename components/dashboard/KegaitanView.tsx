"use client"

import { useState, useEffect } from "react"
import { Plus, Eye, CheckCircle, Clock, PlayCircle } from "lucide-react"
import { RealisasiModal } from "./RealisasiModal"

export type StatusActivities = "selesai" | "berlangsung" | "menunggu"

export interface Activities {
  id: string
  namaActivities: string
  penyelengara: string
  waktuActivities: string
  deskripsiActivities: string
  dokumentasi?: string | null
  status: StatusActivities
  createdAt?: string
  realisasi?: Realisasi | null
}

export interface Realisasi {
  jumlahPeserta: number
  tanggalRealisasi: string
  catatan: string
  dokumentasi: string
  createdAt: string
}

const SEED_DATA: Activities[] = [
  { id: "kg-1", namaActivities: "Workshop PKSA", penyelengara: "SMA Negeri 1 Banda Aceh", waktuActivities: "2025-04-15T10:00", deskripsiActivities: "Workshop pengenalan isu kekerasan pada anak", status: "selesai" },
  { id: "kg-2", namaActivities: "Sosialisasi Hak Anak", penyelengara: "SMP Negeri 2 Banda Aceh", waktuActivities: "2025-06-20T14:00", deskripsiActivities: "Sosialisasi hak anak kepada seluruh siswa dan wali kelas", status: "berlangsung" },
  { id: "kg-3", namaActivities: "Rapat Koordinasi Kelompok Kerja", penyelengara: "Dinas Pendidikan Prov Aceh", waktuActivities: "2025-07-10T09:00", deskripsiActivities: "Rapat koordinasi bulanan antar anggota kelompok kerja", status: "menunggu" },
]

function StatusBadge({ status }: { status: StatusActivities }) {
  if (status === "selesai") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full whitespace-nowrap text-[13px] font-semibold bg-emerald-300 text-emerald-950">
      Selesai
    </span>
  )
  if (status === "berlangsung") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full whitespace-nowrap text-[13px] font-semibold bg-sky-200 text-sky-950">
      Berlangsung
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full whitespace-nowrap text-[13px] font-semibold bg-amber-200 text-amber-950">
      Terjadwal
    </span>
  )
}

export function ActivitiesView() {
  const [list, setList] = useState<Activities[]>([])
  const [mounted, setMounted] = useState(false)
  const [selectedRealisasi, setSelectedRealisasi] = useState<Activities | null>(null)

  useEffect(() => {
    const loadData = () => {
      try {
        const stored: Activities[] = JSON.parse(sessionStorage.getItem("kegaitanList") ?? "[]")
        const storedMap = new Map(stored.map((i) => [i.id, i]))
        const seedMerged = SEED_DATA.map((s) => storedMap.has(s.id) ? { ...s, ...storedMap.get(s.id) } : s)
        const newItems = stored.filter((i) => !SEED_DATA.find((s) => s.id === i.id))
        setList([...seedMerged, ...newItems])
      } catch {
        setList([...SEED_DATA])
      }
    }

    setMounted(true)
    loadData()

    const onStorage = (e: StorageEvent) => { if (e.key === "kegaitanList") loadData() }
    window.addEventListener("storage", onStorage)
    window.addEventListener("kegaitanUpdated", loadData)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("kegaitanUpdated", loadData)
    }
  }, [])

  const handleRealisasiSave = (id: string, realisasi: Realisasi) => {
    setList(prev => prev.map(item => 
      item.id === id ? { ...item, realisasi } : item
    ))
    const updated = list.map(item => 
      item.id === id ? { ...item, realisasi } : item
    )
    sessionStorage.setItem("kegaitanList", JSON.stringify(updated))
    window.dispatchEvent(new Event("kegaitanUpdated"))
  }

  if (!mounted) return null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Activities</h2>
          <p className="text-xs text-gray-500 mt-0.5">Daftar kegiatan yang diselenggarakan oleh Kelompok Kerja</p>
        </div>
        <a
          href="/tambah-kegaitan"
          className="flex items-center gap-1.5 h-9 px-4 rounded-[4px] text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Activities
        </a>
      </div>

      <div className="rounded-[4px] border border-gray-200 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F1F1F1] border-b border-gray-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Nama Activities</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Penyelenggara</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Waktu</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Deskripsi</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    Belum ada kegiatan
                  </td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F9F9F9] transition-colors">
                    <td className="px-4 py-3.5 font-medium text-gray-800">{item.namaActivities}</td>
                    <td className="px-4 py-3.5 text-gray-600">{item.penyelengara}</td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                      {new Date(item.waktuActivities).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 max-w-[200px] truncate">{item.deskripsiActivities}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/tambah-kegaitan?view=${item.id}`}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-[#F9F9F9] transition-colors whitespace-nowrap"
                        >
                          Cek Detail
                        </a>
                        {item.status === "selesai" && (
                          item.realisasi ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full whitespace-nowrap text-[13px] font-semibold bg-emerald-300 text-emerald-950">
                              Sudah Lapor
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedRealisasi(item)}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-[#F9F9F9] transition-colors whitespace-nowrap"
                            >
                              Lapor Realisasi
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRealisasi && (
        <RealisasiModal 
          kegiatan={selectedRealisasi} 
          onClose={() => setSelectedRealisasi(null)}
          onSave={handleRealisasiSave}
        />
      )}
    </div>
  )
}