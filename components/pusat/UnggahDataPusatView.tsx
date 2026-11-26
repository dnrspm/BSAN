"use client"

import { cn } from "@/lib/utils"
import { useModeUnggah, type ModeUnggah } from "@/lib/mode-unggah"
import { UnggahIndeksBsanView } from "@/components/pusat/UnggahIndeksBsanView"
import { MetadataUnggahView } from "@/components/pusat/MetadataUnggahView"

const OPSI: { id: ModeUnggah; label: string; desk: string }[] = [
  { id: "mvp", label: "MVP", desk: "Tanpa metadata. Unggah file CSV skor." },
  { id: "ideal", label: "Ideal", desk: "Dengan metadata. Template Excel dan validasi dibuat dari metadata." },
]

/** Unggah Data Admin Pusat: pilih mode MVP (tanpa metadata) atau Ideal (dengan metadata). */
export function UnggahDataPusatView() {
  const { mode, setMode } = useModeUnggah()
  const aktif = OPSI.find((o) => o.id === mode)!
  return (
    <>
      {mode === "mvp" ? <UnggahIndeksBsanView /> : <MetadataUnggahView />}

      {/* Pengalih demo: melayang di pojok bawah agar tidak terbaca sebagai bagian dari desain halaman. */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-gray-900/90 py-1.5 pl-3.5 pr-1.5 text-xs text-white shadow-lg backdrop-blur" title={aktif.desk}>
        <span className="font-medium text-gray-300">Mode</span>
        <div role="radiogroup" aria-label="Mode unggah" className="inline-flex rounded-full bg-white/10 p-0.5">
          {OPSI.map((o) => (
            <button
              key={o.id} type="button" role="radio" aria-checked={mode === o.id} onClick={() => setMode(o.id)}
              className={cn("h-7 rounded-full px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white", mode === o.id ? "bg-white text-gray-900" : "text-gray-200 hover:bg-white/10")}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
