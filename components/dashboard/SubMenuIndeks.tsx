"use client"

import { useEffect, useId, useState } from "react"
import type { ComponentType } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

export interface SubMenuItem {
  id: string
  label: string
}

/**
 * Menu Indeks BSAN di sidebar sebagai accordion (pola Vertical Navigation Seragam): induk berikon dengan chevron
 * (turun = tertutup, naik = terbuka) yang hanya membuka atau menutup sub-menu tanpa berpindah halaman. Sub-menu tanpa
 * ikon, menjorok sejajar teks induk, tanpa garis, jarak antar item 8px; item aktif berlabel tebal dengan lapisan putih 10%.
 * Induk accordion tidak ikut disorot. Layar aktif dibaca dari `?halaman=<id>`; item pertama adalah layar bawaan
 * (tanpa parameter). Terbuka otomatis saat menu Indeks BSAN sedang aktif.
 */
export function MenuIndeksAccordion({
  icon: Icon, label, menuAktif, item, kelasBaris, teksNonaktif, onPilih,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  /** Menu Indeks BSAN sedang dibuka. */
  menuAktif: boolean
  item: SubMenuItem[]
  /** Kelas dasar baris induk, mengikuti item sidebar peran. */
  kelasBaris: string
  /** Kelas warna teks item tidak aktif, menyesuaikan warna sidebar peran. */
  teksNonaktif: string
  onPilih?: () => void
}) {
  const router = useRouter()
  const halaman = useSearchParams().get("halaman")
  const panelId = useId()
  const [terbuka, setTerbuka] = useState(menuAktif)
  const aktifId = menuAktif ? (item.some((i) => i.id === halaman) ? halaman : item[0]?.id) : null

  // Masuk ke Indeks BSAN (mis. lewat tombol Back atau tautan) membuka accordion-nya.
  useEffect(() => {
    if (menuAktif) setTerbuka(true)
  }, [menuAktif])

  const Chevron = terbuka ? ChevronUp : ChevronDown

  return (
    <div>
      <button
        type="button"
        aria-expanded={terbuka}
        aria-controls={panelId}
        onClick={() => setTerbuka((t) => !t)}
        className={cn(kelasBaris, teksNonaktif, "hover:bg-white/10 hover:text-white")}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        <Chevron aria-hidden className="w-4 h-4 flex-shrink-0" />
      </button>
      {terbuka && (
        <ul id={panelId} className="mt-2 mb-1 ml-7 flex flex-col gap-2">
          {item.map((sub, n) => {
            const aktif = sub.id === aktifId
            return (
              <li key={sub.id}>
                <button
                  type="button"
                  onClick={() => {
                    router.push(n === 0 ? "/dashboard?menu=indeks-bsan" : `/dashboard?menu=indeks-bsan&halaman=${sub.id}`, { scroll: false })
                    onPilih?.()
                  }}
                  aria-current={aktif ? "page" : undefined}
                  className={cn(
                    "w-full rounded-[4px] px-3 py-2 text-left text-sm transition-colors",
                    aktif ? "bg-white/10 font-semibold text-white" : cn(teksNonaktif, "font-normal hover:bg-white/10 hover:text-white")
                  )}
                >
                  {sub.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** Layar Indeks BSAN yang sedang dibuka menurut `?halaman=`; bila tidak dikenali, layar pertama (bawaan). */
export function pilihHalaman<T extends string>(halaman: string | null, tersedia: readonly T[]): T {
  return (tersedia.find((t) => t === halaman) ?? tersedia[0]) as T
}
