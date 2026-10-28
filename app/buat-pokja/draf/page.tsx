"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileText, Trash2, Edit3, Plus, Clock } from "lucide-react"
import { PokjaDraft } from "@/types/pokja"

const DRAFT_KEY = "pokjaDrafts"

function getDrafts(): PokjaDraft[] {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveDraftToStorage(drafts: PokjaDraft[]): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function DaftarDrafPage() {
  const router = useRouter()
  const [drafts, setDrafts] = useState<PokjaDraft[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setDrafts(getDrafts())
    setLoading(false)
  }, [])

  const handleDelete = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus draf ini?")) return
    const filtered = drafts.filter((d) => d.id !== id)
    saveDraftToStorage(filtered)
    setDrafts(filtered)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <span className="text-gray-300">/</span>
            <h1 className="text-sm font-semibold text-gray-900">Daftar Draf Kelompok Kerja</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Info banner */}
        <div className="rounded-[4px] bg-yellow-50 border border-yellow-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">Draf Tersimpan</p>
              <p className="text-xs text-yellow-700 mt-1">
                Draf disimpan di perangkat Anda dan tidak akan dikirim hingga Anda menekan tombol "Ajukan".
                Anda dapat melanjutkan pengisian kapan saja dengan memilih draf di bawah.
              </p>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {drafts.length === 0 ? (
          <div className="bg-white rounded-[4px] border border-gray-200 p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Belum Ada Draf</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Klik tombol "Simpan Draf" saat mengisi formulir untuk menyimpan progress Anda.
            </p>
            <button
              onClick={() => router.push("/buat-pokja")}
              className="mt-6 flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-[4px] hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Buat Kelompok Kerja Baru
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-[4px] border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-[#F1F1F1]">
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Nama Draf</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Wilayah</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Terakhir Diedit</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((draft) => (
                  <tr key={draft.id} className="border-b border-gray-100 last:border-0 hover:bg-[#F9F9F9]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-900">{draft.namaDraft}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{draft.region}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">{formatDate(draft.updatedAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/buat-pokja?draftId=${draft.id}`)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-[#F9F9F9] transition-colors whitespace-nowrap"
                        >
                          Lanjutkan
                        </button>
                        <button
                          onClick={() => handleDelete(draft.id)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-xs font-medium border border-gray-300 bg-white text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Link ke buat baru */}
        {drafts.length > 0 && (
          <button
            onClick={() => router.push("/buat-pokja")}
            className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-300 rounded-[4px] text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition"
          >
            <Plus className="w-4 h-4" />
            Buat Draf Baru
          </button>
        )}
      </div>
    </div>
  )
}