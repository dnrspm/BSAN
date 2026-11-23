"use client"

import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface Props {
  /** Tampil penuh. Bila tidak, tinggi daftar dikunci ke `tinggi` dan kalimat terakhir yang tampil dipotong dengan "…". */
  buka: boolean
  /** Tinggi daftar saat tertutup (satuan CSS), sama untuk semua kartu agar tinggi kartu seragam. */
  tinggi: string
  /** Dipanggil saat tertutup: apakah masih ada isi yang tidak tampil. */
  onUkur: (terpotong: boolean) => void
  /** Berubah bila isi daftar berubah, agar ukuran dihitung ulang. */
  ukuranKey: string
  className?: string
  /** Setiap anak adalah <li>; teks yang boleh dipotong diberi atribut `data-teks`. Titik penutup kalimat dibungkus `data-titik` agar disembunyikan saat diganti "…". */
  children: ReactNode
}

const teksDi = (li: HTMLElement) => li.querySelector<HTMLElement>("[data-teks]")

function kembalikan(items: HTMLElement[]) {
  for (const li of items) {
    li.style.display = ""
    li.style.removeProperty("border-bottom-width")
    const t = teksDi(li)
    if (!t) continue
    t.style.removeProperty("display")
    t.style.removeProperty("overflow")
    t.style.removeProperty("-webkit-box-orient")
    t.style.removeProperty("-webkit-line-clamp")
    t.removeAttribute("data-lanjut")
  }
}

function potongBaris(t: HTMLElement, baris: number) {
  t.style.display = "-webkit-box"
  t.style.overflow = "hidden"
  t.style.setProperty("-webkit-box-orient", "vertical")
  t.style.setProperty("-webkit-line-clamp", String(baris))
}

/**
 * Daftar bertinggi tetap saat tertutup. Isi yang melebihi tinggi itu tidak tampil, dan kalimat terakhir yang
 * tampil dipotong dengan "…" sebagai tanda masih ada isi lain. Memakai pengukuran karena tinggi baris bergantung
 * pada lebar kolom dan pembungkusan teks.
 */
export function DaftarTerpotong({ buka, tinggi, onUkur, ukuranKey, className, children }: Props) {
  const wadah = useRef<HTMLDivElement>(null)
  const daftar = useRef<HTMLUListElement>(null)

  const ukur = useCallback(() => {
    const w = wadah.current
    const ul = daftar.current
    if (!w || !ul) return
    const items = Array.from(ul.children) as HTMLElement[]
    kembalikan(items)
    if (buka) return

    const tinggiWadah = w.clientHeight
    const atas = w.getBoundingClientRect().top
    let terpotong = false
    for (let n = 0; n < items.length; n++) {
      const t = teksDi(items[n])
      if (!t) continue
      const r = t.getBoundingClientRect()
      if (r.bottom - atas <= tinggiWadah + 0.5) continue

      terpotong = true
      const tinggiBaris = parseFloat(getComputedStyle(t).lineHeight) || 20
      const baris = Math.floor((tinggiWadah - (r.top - atas)) / tinggiBaris)
      // Baris terakhir yang tampil tidak diberi garis bawah (dari divide-y), agar tampak daftarnya belum selesai.
      const tanpaGaris = (idx: number) => items[idx]?.style.setProperty("border-bottom-width", "0px")
      if (baris >= 1) {
        tanpaGaris(n)
        potongBaris(t, baris)
        for (let k = n + 1; k < items.length; k++) items[k].style.display = "none"
      } else {
        // Tidak ada ruang untuk satu baris pun: sembunyikan item ini; item sebelumnya tetap tampil penuh dan diberi
        // "…" di ujung teksnya. Hanya bila "…" membuatnya melebar satu baris, item itu dipendekkan satu baris.
        for (let k = n; k < items.length; k++) items[k].style.display = "none"
        tanpaGaris(n - 1)
        const sebelumnya = n > 0 ? teksDi(items[n - 1]) : null
        if (sebelumnya) {
          const semula = sebelumnya.getBoundingClientRect().height
          sebelumnya.setAttribute("data-lanjut", "")
          if (sebelumnya.getBoundingClientRect().height > semula + 1) {
            sebelumnya.removeAttribute("data-lanjut")
            const jumlah = Math.round(semula / tinggiBaris)
            if (jumlah > 1) potongBaris(sebelumnya, jumlah - 1)
            else sebelumnya.setAttribute("data-lanjut", "")
          }
        }
      }
      break
    }
    onUkur(terpotong)
  }, [buka, onUkur])

  useLayoutEffect(() => {
    ukur()
    const w = wadah.current
    if (!w) return
    const ro = new ResizeObserver(() => ukur())
    ro.observe(w)
    void document.fonts?.ready.then(ukur)
    return () => ro.disconnect()
  }, [ukur, ukuranKey])

  return (
    <div ref={wadah} className="relative overflow-hidden" style={{ height: buka ? undefined : tinggi, minHeight: tinggi }}>
      <ul ref={daftar} className={cn("[&_[data-lanjut]]:after:content-['…'] [&_[data-lanjut]_[data-titik]]:hidden", className)}>
        {children}
      </ul>
    </div>
  )
}
