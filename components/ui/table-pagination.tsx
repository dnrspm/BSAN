"use client"

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/** Nomor halaman yang ditampilkan; `null` = elipsis. */
function nomorHalaman(aktif: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const dekat = [aktif - 1, aktif, aktif + 1].filter((n) => n > 1 && n < total)
  const hasil: (number | null)[] = [1]
  if (dekat[0] > 2) hasil.push(null)
  hasil.push(...dekat)
  if (dekat[dekat.length - 1] < total - 1) hasil.push(null)
  hasil.push(total)
  return hasil
}

interface TablePaginationProps {
  total: number
  halaman: number
  perHalaman: number
  onHalaman: (n: number) => void
  /** Bila diisi, tampil dropdown "per halaman"; pemanggil wajib mengembalikan halaman ke 1. */
  onPerHalaman?: (n: number) => void
  opsiPerHalaman?: number[]
  /** Kata benda di teks "dari 39 …". */
  satuan?: string
  className?: string
}

/** Footer tabel: ringkasan data + (opsional) pilihan per halaman di kiri, nomor halaman di kanan. */
export function TablePagination({ total, halaman, perHalaman, onHalaman, onPerHalaman, opsiPerHalaman = [10, 25, 50, 100], satuan = "data", className }: TablePaginationProps) {
  if (total === 0) return null
  const totalHalaman = Math.max(1, Math.ceil(total / perHalaman))
  const aktif = Math.min(halaman, totalHalaman)
  const mulai = (aktif - 1) * perHalaman
  const opsi = opsiPerHalaman.includes(perHalaman) ? opsiPerHalaman : [...opsiPerHalaman, perHalaman].sort((a, b) => a - b)

  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-t border-[#D9DBDD] bg-[#F9F9F9]", className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 tabular-nums">
        <span>
          Menampilkan {mulai + 1} - {Math.min(mulai + perHalaman, total)} dari {total.toLocaleString("id-ID")} {satuan}
        </span>
        {onPerHalaman && (
          <>
            <span aria-hidden>·</span>
            <label className="relative inline-flex items-center">
              <select
                value={perHalaman}
                onChange={(e) => onPerHalaman(Number(e.target.value))}
                aria-label="Jumlah data per halaman"
                className="h-8 appearance-none rounded-[4px] border border-[#808489] bg-white pl-3 pr-8 text-sm text-gray-700 cursor-pointer hover:bg-[#F9F9F9] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {opsi.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-gray-500" />
            </label>
            <span>per halaman</span>
          </>
        )}
      </div>
      <nav aria-label="Halaman" className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onHalaman(aktif - 1)}
          disabled={aktif === 1}
          aria-label="Halaman sebelumnya"
          className="flex h-8 w-8 items-center justify-center rounded-[4px] text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {nomorHalaman(aktif, totalHalaman).map((n, i) =>
          n === null ? (
            <span key={`e${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-gray-400">…</span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onHalaman(n)}
              aria-current={n === aktif ? "page" : undefined}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-[4px] px-2 text-sm tabular-nums transition-colors",
                n === aktif ? "bg-gray-200/70 font-semibold text-gray-900" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              {n}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onHalaman(aktif + 1)}
          disabled={aktif === totalHalaman}
          aria-label="Halaman berikutnya"
          className="flex h-8 w-8 items-center justify-center rounded-[4px] text-gray-900 hover:bg-gray-100 disabled:text-gray-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </nav>
    </div>
  )
}
