"use client"

import { useState } from "react"
import { Check, ChevronDown, CircleAlert, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { EksporExcelButton, type Indikator, Selisih, TAHUN_AKTIF, TahunSelect, TingkatChip, fmt, nilaiSubindikator, tingkat, useDataTahun } from "./indeks-bsan/shared"

const KATEGORI = [
  { label: "Tinggi", rentang: "≥ 8,0", contoh: 8 },
  { label: "Sedang", rentang: "6,0 – 7,9", contoh: 6 },
  { label: "Rendah", rentang: "< 6,0", contoh: 0 },
]

const LABEL = "text-xs font-semibold uppercase tracking-wide text-gray-500"

function SubindikatorRows({ indikator }: { indikator: Indikator }) {
  const urut = [...indikator.subindikator].sort((a, b) => nilaiSubindikator(a).skor10 - nilaiSubindikator(b).skor10)
  return (
    <ul className="divide-y divide-gray-100">
      {urut.map((s) => {
        const nilai = nilaiSubindikator(s)
        return (
          <li key={s.nama} className="py-2.5 text-sm">
            <p className="text-gray-700">{s.nama}</p>
            <p className="mt-0.5 font-semibold tabular-nums text-gray-900">
              {nilai.teks}
              <span className="font-normal text-gray-400"> / {s.satuan === "persen" ? "100%" : "10"}</span>
            </p>
          </li>
        )
      })}
    </ul>
  )
}

function DaftarRekomendasi({ indikator }: { indikator: Indikator }) {
  return (
    <ul className="mt-3 space-y-2 text-sm text-gray-600">
      {indikator.rekomendasi.map((r) => (
        <li key={r} className="flex gap-2">
          <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
          <span>{r}</span>
        </li>
      ))}
    </ul>
  )
}

function Rekomendasi({ indikator, buka, onToggle }: { indikator: Indikator; buka: boolean; onToggle: () => void }) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={buka}
        className={cn(LABEL, "w-full flex items-center justify-between hover:text-gray-700")}
      >
        Rekomendasi perbaikan
        <ChevronDown className={cn("w-4 h-4 transition-transform", buka && "rotate-180")} />
      </button>
      {buka && <DaftarRekomendasi indikator={indikator} />}
    </div>
  )
}

// Skor ada di ringkasan atas; kartu ini hanya memuat rincian (subindikator dan rekomendasi).
function IndikatorCard({ indikator, selaras, terendah, rekomendasiBuka = false, onToggleRekomendasi }: { indikator: Indikator; selaras?: boolean; terendah?: boolean; rekomendasiBuka?: boolean; onToggleRekomendasi?: () => void }) {
  return (
    <article className={cn("rounded-xl border border-gray-200 bg-white p-5 flex flex-col", terendah && "overflow-hidden", selaras && "md:grid md:grid-rows-subgrid md:row-span-3 md:gap-y-0")}>
      {terendah && (
        <div className="-mx-5 -mt-5 mb-4 flex items-center gap-1.5 border-b border-gray-200 bg-gray-100 px-5 py-2 text-xs font-medium text-gray-700">
          <CircleAlert className="w-3.5 h-3.5" />
          Indikator terendah · perlu perhatian lebih
        </div>
      )}
      <header className="pb-4 border-b border-gray-200">
        <div className="flex items-baseline justify-between gap-4">
          <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h3 className="text-base font-semibold text-gray-900 leading-snug">{indikator.nama}</h3>
          </div>
          <span className={cn("shrink-0 rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums", tingkat(indikator.skor).solid)}>{fmt(indikator.skor)}</span>
        </div>
      </header>
      {terendah ? (
        // Rekomendasi selalu terbuka dan bersebelahan dengan subindikator agar tidak ada ruang kosong.
        <div className="mt-2 md:grid md:grid-cols-2 md:gap-8">
          <SubindikatorRows indikator={indikator} />
          <div className="mt-4 border-t border-gray-200 pt-4 md:mt-0 md:border-l md:border-t-0 md:pl-8 md:pt-2.5">
            <p className={LABEL}>Rekomendasi perbaikan</p>
            <DaftarRekomendasi indikator={indikator} />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-2">
            <SubindikatorRows indikator={indikator} />
          </div>
          <Rekomendasi indikator={indikator} buka={rekomendasiBuka} onToggle={onToggleRekomendasi ?? (() => {})} />
        </>
      )}
    </article>
  )
}

export function IndeksBsanView({ judul = "Indeks BSAN" }: { judul?: string } = {}) {
  const [tahun, setTahun] = useState(TAHUN_AKTIF)
  const { data, total, tahunSebelumnya, dataSebelumnya, totalSebelumnya } = useDataTahun(tahun)
  const [lainBuka, setLainBuka] = useState(false)
  const [penjelasanBuka, setPenjelasanBuka] = useState(false)
  const sebelumnya = (id: string) => dataSebelumnya?.find((i) => i.id === id)?.skor
  const urut = [...data].sort((a, b) => a.skor - b.skor)
  const [prioritas, ...lain] = urut

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{judul}</h1>
            <p className="mt-1 text-sm text-gray-500">Gambaran penerapan Budaya Sekolah Aman dan Nyaman, dinilai dari 4 indikator dengan skala 0–10.</p>
          </div>
          <div className="flex items-center gap-3">
            <TahunSelect tahun={tahun} onChange={setTahun} />
            <EksporExcelButton tahun={tahun} data={data} />
          </div>
        </div>

        <section>
          <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-lg font-semibold text-gray-900 leading-snug">Skor Indeks BSAN {tahun}</p>

              <div className="flex flex-1 flex-col justify-center rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold tabular-nums leading-none text-gray-900">{fmt(total)}</span>
                  <span className="text-lg text-gray-500">/ 10</span>
                </p>
                <div className="mt-3">
                  <TingkatChip skor={total} solid className="px-3 py-1 text-sm" />
                  <Selisih skor={total} sebelumnya={totalSebelumnya} tahunSebelumnya={tahunSebelumnya} className="mt-2 text-base" />
                </div>
              </div>

              <p className="text-sm leading-relaxed text-gray-600">
                Capaian berada pada kategori {tingkat(total).label}.{" "}
                {tingkat(total).label === "Tinggi" && "Pertahankan, terutama indikator terendah."}
                {tingkat(total).label === "Sedang" && "Perkuat indikator terendah untuk naik ke Tinggi."}
                {tingkat(total).label === "Rendah" && "Prioritaskan perbaikan indikator terendah."}
              </p>

              <div className="border-t border-gray-200 pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Kategori skor</p>
                <ul className="overflow-hidden rounded-lg bg-gray-50 divide-y divide-gray-200">
                  {KATEGORI.map((k) => (
                    <li key={k.label} className="flex items-center gap-2.5 px-3 py-1 text-sm text-gray-600">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", tingkat(k.contoh).dot)} />
                      <span className="flex-1">{k.label}</span>
                      <span className="w-16 text-right tabular-nums text-xs">{k.rentang}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-1.5">
                <h2 className="text-base font-semibold text-gray-900">4 Indikator Penilaian</h2>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setPenjelasanBuka(true)}
                      aria-label="Lihat penjelasan indikator penilaian"
                      className="rounded-full text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Lihat penjelasan indikator</TooltipContent>
                </Tooltip>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.map((i) => (
                  <div key={i.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-base font-semibold text-gray-900 leading-snug min-h-[2.75rem]">{i.nama}</p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">
                      {fmt(i.skor)}
                      <span className="text-base font-normal text-gray-400"> / 10</span>
                    </p>
                    <div className="mt-2">
                      <TingkatChip skor={i.skor} solid />
                      <Selisih skor={i.skor} sebelumnya={sebelumnya(i.id)} tahunSebelumnya={tahunSebelumnya} className="mt-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </section>
      </div>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Rincian per Indikator</h2>

        <div className="space-y-4">
          <IndikatorCard indikator={prioritas} terendah />
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {lain.map((i) => (
              <IndikatorCard key={i.id} indikator={i} selaras rekomendasiBuka={lainBuka} onToggleRekomendasi={() => setLainBuka(!lainBuka)} />
            ))}
          </div>
        </div>
      </section>

      <Dialog open={penjelasanBuka} onOpenChange={setPenjelasanBuka}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>4 Indikator Penilaian</DialogTitle>
            <DialogDescription>Skor Indeks BSAN dihitung dari empat indikator berikut, masing-masing dinilai pada skala 0–10.</DialogDescription>
          </DialogHeader>
          <ul className="divide-y divide-gray-100">
            {data.map((i) => (
              <li key={i.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold text-gray-900">{i.nama}</p>
                <p className="mt-1 text-sm text-gray-600">{i.deskripsi}</p>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}
