"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Indikator, Selisih, TAHUN_AKTIF, TahunSelect, TingkatChip, fmt, tingkat, useDataTahun } from "./indeks-bsan/shared"

const LABEL = "text-xs font-semibold uppercase tracking-wide text-gray-500"

function SubindikatorRows({ indikator }: { indikator: Indikator }) {
  const urut = [...indikator.subindikator].sort((a, b) => a.skor - b.skor)
  return (
    <ul className="mt-1 divide-y divide-gray-100">
      {urut.map((s) => (
        <li key={s.nama} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
          <span className="text-gray-700">{s.nama}</span>
          <span className={cn("font-semibold tabular-nums whitespace-nowrap", tingkat(s.skor).text)}>{fmt(s.skor)}</span>
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
      {buka && (
        <ol className="mt-3 list-decimal pl-5 space-y-1.5 text-sm text-gray-600">
          {indikator.rekomendasi.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      )}
    </div>
  )
}

// Skor ada di ringkasan atas; kartu ini hanya memuat rincian (subindikator dan rekomendasi).
function IndikatorCard({ indikator, selaras, rekomendasiBuka, onToggleRekomendasi }: { indikator: Indikator; selaras?: boolean; rekomendasiBuka: boolean; onToggleRekomendasi: () => void }) {
  return (
    <article className={cn("rounded-xl border border-gray-200 bg-white p-5 flex flex-col", selaras && "md:grid md:grid-rows-subgrid md:row-span-3 md:gap-y-0")}>
      <header className="pb-4 border-b border-gray-200 space-y-3">
        <TingkatChip skor={indikator.skor} />
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="min-w-0 flex-1 text-base font-semibold text-gray-900 leading-snug">{indikator.nama}</h3>
          <span className={cn("shrink-0 text-sm font-semibold tabular-nums", tingkat(indikator.skor).text)}>{fmt(indikator.skor)}</span>
        </div>
      </header>
      <div className="mt-4">
        <p className={LABEL}>Subindikator</p>
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
  const [prioritas, ...lain] = urut

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Indeks BSAN</h1>
          <TahunSelect tahun={tahun} onChange={setTahun} />
        </div>

        <section className="rounded-xl border border-gray-200 bg-white">
          <h2 className="px-5 py-4 text-base font-semibold text-gray-900 border-b border-gray-200">Ringkasan Kondisi Sekolah Anda Tahun {tahun}</h2>

          <div className="p-5 grid gap-4 lg:grid-cols-[17rem_1fr]">
            <div className="rounded-xl bg-emerald-900 text-white p-5 flex flex-col justify-center gap-3">
              <p className="text-sm font-medium text-emerald-200">Skor Akhir Indeks BSAN</p>
              <p className="flex items-baseline gap-1.5">
                <span className="text-6xl font-bold tabular-nums leading-none">{fmt(total)}</span>
                <span className="text-lg text-emerald-300">/ 10</span>
              </p>
              <span className="self-start inline-flex items-center gap-2 rounded-full bg-emerald-800 px-3 py-1 text-sm font-medium">
                <span className={cn("w-2 h-2 rounded-full", tingkat(total).dot)} />
                {tingkat(total).label}
              </span>
              {totalSebelumnya !== undefined && (
                <p className="text-sm text-emerald-200">
                  {total === totalSebelumnya ? "Sama dengan" : total > totalSebelumnya ? `Naik ${fmt(total - totalSebelumnya)} dari` : `Turun ${fmt(totalSebelumnya - total)} dari`} {tahunSebelumnya}
                </p>
              )}
              <button type="button" onClick={() => setKategori(!kategori)} className="self-start text-xs text-emerald-200 underline">
                Lihat kategori skor
              </button>
              {kategori && (
                <ul className="text-xs text-emerald-100 space-y-1">
                  <li>Tinggi: 8,0 ke atas</li>
                  <li>Sedang: 6,0 – 7,9</li>
                  <li>Rendah: di bawah 6,0</li>
                </ul>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {data.map((i) => (
                <div key={i.id} className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900 leading-snug min-h-[2.5rem]">{i.nama}</p>
                  <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className={cn("text-2xl font-bold tabular-nums", tingkat(i.skor).text)}>
                      {fmt(i.skor)}
                      <span className="text-sm font-normal text-gray-400"> / 10</span>
                    </span>
                    <Selisih skor={i.skor} sebelumnya={sebelumnya(i.id)} tahunSebelumnya={tahunSebelumnya} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Rincian per Indikator</h2>

        <div className="space-y-4">
          <h3 className={LABEL}>Indikator prioritas · skor terendah</h3>
          <IndikatorCard indikator={prioritas} rekomendasiBuka={prioritasBuka} onToggleRekomendasi={() => setPrioritasBuka(!prioritasBuka)} />
        </div>

        <div className="space-y-4">
          <h3 className={LABEL}>Indikator lainnya</h3>
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
