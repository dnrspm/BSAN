import { cn } from "@/lib/utils"
import { WARNA, angka, type ItemMeta, type StatusFile } from "@/lib/metadata-bsan"

export const TOMBOL_UTAMA =
  "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[4px] bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
export const TOMBOL_PUTIH =
  "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[4px] border border-[#808489] bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-[#F9F9F9] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
export const TOMBOL_MERAH =
  "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[4px] bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
/** Tombol kecil (tinggi 32px) di dalam tabel. */
export const TOMBOL_KECIL =
  "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[4px] border border-[#808489] bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-[#F9F9F9] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
/** Tombol kecil hitam: aksi di dalam bagian halaman. Biru hanya untuk satu aksi utama per halaman. */
export const TOMBOL_KECIL_HITAM =
  "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[4px] bg-gray-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
export const TOMBOL_IKON =
  "inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-gray-500 transition-colors hover:bg-[#F9F9F9] hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
export const TOMBOL_IKON_BORDER = cn(TOMBOL_IKON, "border border-[#808489] text-gray-700")
export const TOMBOL_TAUTAN =
  "inline-flex items-center gap-1 text-[13px] font-semibold text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-[2px]"
export const KOLOM =
  "h-10 w-full rounded-[4px] border border-[#808489] bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
export const LENCANA = "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-semibold"

const BADGE_STATUS: Record<StatusFile, string> = {
  Berhasil: "bg-emerald-300 text-emerald-950",
  Gagal: "bg-rose-100 text-rose-950",
  Diproses: "bg-sky-200 text-sky-950",
}
export function LencanaStatus({ status }: { status: StatusFile }) {
  return <span className={cn(LENCANA, BADGE_STATUS[status])}>{status}</span>
}

/** Batang berwarna: satu segmen per kategori, lebar sesuai rentangnya. */
export function BatangKategori({ item }: { item: ItemMeta }) {
  if (!item.kat.length) return <span className="text-gray-400">–</span>
  const tip = item.kat.map((k) => k.l + (k.t !== "" ? ` ${k.f}–${k.t}` : "")).join(" · ")
  let segmen: { w: number; c: string }[]
  if (item.nilai === "boolean") {
    segmen = item.kat.map((k) => ({ w: 100 / item.kat.length, c: WARNA[k.c][0] }))
  } else {
    const mn = item.nilai === "percentage" ? 0 : item.min
    const mx = item.nilai === "percentage" ? 100 : item.max
    const span = Math.max(mx - mn, 0.1)
    segmen = item.kat
      .filter((k) => k.f !== "kosong")
      .sort((a, b) => (angka(a.f) ?? 0) - (angka(b.f) ?? 0))
      .map((k) => ({ w: Math.max((((angka(k.t) ?? 0) - (angka(k.f) ?? 0) + 0.1) / span) * 100, 4), c: WARNA[k.c][0] }))
  }
  return (
    <span className="inline-flex items-center gap-2" title={tip}>
      <span className="flex h-2 w-[84px] overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
        {segmen.map((s, i) => (
          <i key={i} className="block h-full" style={{ width: `${s.w}%`, background: s.c }} />
        ))}
      </span>
      <span className="whitespace-nowrap text-xs text-gray-500">{item.kat.length} kategori</span>
    </span>
  )
}

export const TH = "px-3 py-3 text-left text-xs font-semibold uppercase text-gray-500"
export const TR_HEAD = "border-b border-[#D9DBDD] bg-[#F1F1F1]"
