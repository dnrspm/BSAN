"use client"

import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Indikator, Selisih, TAHUN_AKTIF, TahunSelect, TingkatChip, fmt, nilaiSubindikator, tingkat, useDataTahun } from "./indeks-bsan/shared"

// Warna kartu Skor Indeks BSAN mengikuti tingkat (sama dengan warna chip statusnya).
const TEMA_TOTAL: Record<string, { kartu: string; redup: string; chip: string }> = {
  Tinggi: { kartu: "bg-emerald-700 text-white", redup: "text-emerald-100", chip: "bg-emerald-900 text-white" },
  Sedang: { kartu: "bg-yellow-400 text-yellow-950", redup: "text-yellow-900", chip: "bg-yellow-950 text-yellow-50" },
  Rendah: { kartu: "bg-red-700 text-white", redup: "text-red-100", chip: "bg-red-900 text-white" },
}

const LABEL = "text-xs font-semibold uppercase tracking-wide text-gray-500"

function SubindikatorRows({ indikator }: { indikator: Indikator }) {
  const urut = [...indikator.subindikator].sort((a, b) => nilaiSubindikator(a).skor10 - nilaiSubindikator(b).skor10)
  return (
    <ul className="divide-y divide-gray-100">
      {urut.map((s) => {
        const nilai = nilaiSubindikator(s)
        return (
          <li key={s.nama} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
            <span className="text-gray-700">{s.nama}</span>
            <span className={cn("font-semibold tabular-nums whitespace-nowrap", tingkat(nilai.skor10).text)}>{nilai.teks}</span>
          </li>
        )
      })}
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
      {buka && (
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          {indikator.rekomendasi.map((r) => (
            <li key={r} className="flex gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Skor ada di ringkasan atas; kartu ini hanya memuat rincian (subindikator dan rekomendasi).
function IndikatorCard({ indikator, selaras, terendah, rekomendasiBuka, onToggleRekomendasi }: { indikator: Indikator; selaras?: boolean; terendah?: boolean; rekomendasiBuka: boolean; onToggleRekomendasi: () => void }) {
  return (
    <article className={cn("rounded-xl border border-gray-200 bg-white p-5 flex flex-col", selaras && "md:grid md:grid-rows-subgrid md:row-span-3 md:gap-y-0")}>
      <header className="pb-4 border-b border-gray-200">
        <div className="flex items-baseline justify-between gap-4">
          <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h3 className="text-base font-semibold text-gray-900 leading-snug">{indikator.nama}</h3>
            {terendah && <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-medium text-white">Indikator terendah</span>}
          </div>
          <span className={cn("shrink-0 text-sm font-semibold tabular-nums", tingkat(indikator.skor).text)}>{fmt(indikator.skor)}</span>
        </div>
      </header>
      <div className="mt-2">
        <SubindikatorRows indikator={indikator} />
      </div>
      <Rekomendasi indikator={indikator} buka={rekomendasiBuka} onToggle={onToggleRekomendasi} />
    </article>
  )
}

export function IndeksBsanView() {
  const [tahun, setTahun] = useState(TAHUN_AKTIF)
  const { data, total, tahunSebelumnya, dataSebelumnya, totalSebelumnya } = useDataTahun(tahun)
  const [kategori, setKategori] = useState(false)
  const [prioritasBuka, setPrioritasBuka] = useState(false)
  const [lainBuka, setLainBuka] = useState(false)
  const sebelumnya = (id: string) => dataSebelumnya?.find((i) => i.id === id)?.skor
  const urut = [...data].sort((a, b) => a.skor - b.skor)
  const temaTotal = TEMA_TOTAL[tingkat(total).label]
  const [prioritas, ...lain] = urut

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Indeks BSAN</h1>
          <TahunSelect tahun={tahun} onChange={setTahun} />
        </div>

        <section>
          <div className="grid gap-4 lg:grid-cols-[17rem_1fr]">
            <div className={cn("rounded-xl p-5 flex flex-col justify-center gap-3", temaTotal.kartu)}>
              <p className={cn("text-sm font-medium", temaTotal.redup)}>Skor Indeks BSAN {tahun}</p>
              <p className="flex items-baseline gap-1.5">
                <span className="text-6xl font-bold tabular-nums leading-none">{fmt(total)}</span>
                <span className={cn("text-lg", temaTotal.redup)}>/ 10</span>
              </p>
              <span className={cn("self-start rounded-full px-3 py-1 text-sm font-medium", temaTotal.chip)}>{tingkat(total).label}</span>
              {totalSebelumnya !== undefined && (
                <p className={cn("text-sm", temaTotal.redup)}>
                  {total === totalSebelumnya ? "Sama dengan" : total > totalSebelumnya ? `Naik ${fmt(total - totalSebelumnya)} dari` : `Turun ${fmt(totalSebelumnya - total)} dari`} {tahunSebelumnya}
                </p>
              )}
              <button type="button" onClick={() => setKategori(!kategori)} className={cn("self-start text-xs underline", temaTotal.redup)}>
                Lihat kategori skor
              </button>
              {kategori && (
                <ul className="text-xs space-y-1">
                  <li>Tinggi: 8,0 ke atas</li>
                  <li>Sedang: 6,0 – 7,9</li>
                  <li>Rendah: di bawah 6,0</li>
                </ul>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {data.map((i) => (
                <div key={i.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-semibold text-gray-900 leading-snug min-h-[2.5rem]">{i.nama}</p>
                  <p className={cn("mt-2 text-2xl font-bold tabular-nums", tingkat(i.skor).text)}>
                    {fmt(i.skor)}
                    <span className="text-sm font-normal text-gray-400"> / 10</span>
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <TingkatChip skor={i.skor} />
                    <Selisih skor={i.skor} sebelumnya={sebelumnya(i.id)} tahunSebelumnya={tahunSebelumnya} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Rincian per Indikator</h2>

        <div className="space-y-4">
          <IndikatorCard indikator={prioritas} terendah rekomendasiBuka={prioritasBuka} onToggleRekomendasi={() => setPrioritasBuka(!prioritasBuka)} />
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {lain.map((i) => (
              <IndikatorCard key={i.id} indikator={i} selaras rekomendasiBuka={lainBuka} onToggleRekomendasi={() => setLainBuka(!lainBuka)} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
