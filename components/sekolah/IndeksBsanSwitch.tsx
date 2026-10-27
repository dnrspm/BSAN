"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { IndeksBsanView } from "./IndeksBsanView"
import { IndeksBsanViewV2 } from "./IndeksBsanViewV2"

const VERSI = [1, 2] as const

/** Menampilkan Indeks BSAN versi 1 atau 2, dengan tab melayang di kanan bawah untuk berpindah. */
export function IndeksBsanSwitch({ judul }: { judul?: string }) {
  const [versi, setVersi] = useState<(typeof VERSI)[number]>(1)

  return (
    <>
      {versi === 1 ? <IndeksBsanView judul={judul} /> : <IndeksBsanViewV2 judul={judul} />}
      <div role="tablist" aria-label="Versi tampilan" className="fixed bottom-6 right-6 z-40 flex gap-1 rounded-full bg-gray-900 p-1 shadow-lg">
        {VERSI.map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={versi === v}
            onClick={() => setVersi(v)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
              versi === v ? "bg-white text-gray-900" : "text-gray-300 hover:text-white"
            )}
          >
            Versi {v}
          </button>
        ))}
      </div>
    </>
  )
}
