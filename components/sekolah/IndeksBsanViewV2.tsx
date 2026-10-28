"use client"

import { useState } from "react"
import { Check, ChevronDown, ChevronRight, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { EksporExcelButton, Selisih, TAHUN_AKTIF, TahunSelect, TingkatChip, fmt, nilaiSubindikator, tingkat, useDataTahun } from "./indeks-bsan/shared"

const KATEGORI = [
  { label: "Tinggi", rentang: "≥ 8,0", contoh: 8 },
  { label: "Sedang", rentang: "6,0 – 7,9", contoh: 6 },
  { label: "Rendah", rentang: "< 6,0", contoh: 0 },
]

const PESAN: Record<string, string> = {
  Tinggi: "Pertahankan capaian ini dan jaga konsistensi pelaksanaan di semua indikator, terutama pada indikator dengan skor terendah.",
  Sedang: "Perkuat indikator dengan skor terendah agar skor akhir dapat naik ke kategori Tinggi.",
  Rendah: "Prioritaskan perbaikan indikator dengan skor terendah, mulai dari subindikator yang nilainya paling rendah.",
}

const LABEL = "text-xs font-semibold uppercase tracking-wide text-gray-500"

export function IndeksBsanViewV2({ judul = "Indeks BSAN" }: { judul?: string } = {}) {
  const [tahun, setTahun] = useState(TAHUN_AKTIF)
  const [kategoriBuka, setKategoriBuka] = useState(false)
  const { data, total, tahunSebelumnya, dataSebelumnya, totalSebelumnya } = useDataTahun(tahun)
  const urut = [...data].sort((a, b) => a.skor - b.skor)
  const keIndikator = (id: string) => document.getElementById(`indikator-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })

  const sebelumnya = (id: string) => dataSebelumnya?.find((i) => i.id === id)?.skor

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{judul}</h1>
          <p className="mt-1 text-sm text-gray-500">Gambaran penerapan Budaya Sekolah Aman dan Nyaman, dinilai dari 4 indikator dengan skala 0–10.</p>
        </div>
        <div className="flex items-center gap-3">
          <TahunSelect tahun={tahun} onChange={setTahun} />
          <EksporExcelButton tahun={tahun} data={data} />
        </div>
      </div>

      <div>
        <section className="relative z-10 rounded-[4px] border border-[#D9DBDD] bg-white">
          <h2 className="border-b border-gray-200 px-6 py-4 text-lg font-semibold leading-snug text-gray-900">Skor Indeks BSAN {tahun}</h2>
          <div className="md:grid md:grid-cols-[30fr_35fr_35fr]">
            <div className="p-6">
              <p className={LABEL}>Skor Akhir</p>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="text-6xl font-bold tabular-nums leading-none text-gray-900">{fmt(total)}</span>
                <span className="text-lg text-gray-500">/ 10</span>
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                <TingkatChip skor={total} solid className="px-3 py-1 text-sm" />
                <Selisih skor={total} sebelumnya={totalSebelumnya} tahunSebelumnya={tahunSebelumnya} />
              </div>
              <button
                type="button"
                onClick={() => setKategoriBuka(!kategoriBuka)}
                aria-expanded={kategoriBuka}
                className="mt-4 inline-flex items-center gap-1 rounded text-sm font-medium text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {kategoriBuka ? "Sembunyikan kategori skor" : "Lihat kategori skor"}
                <ChevronDown className={cn("h-4 w-4 transition-transform", kategoriBuka && "rotate-180")} />
              </button>
            </div>

            <div className="flex flex-col border-t border-gray-200 p-6 md:border-l md:border-t-0">
              <p className={LABEL}>Skor per indikator</p>

              <ul className="mt-3 divide-y divide-gray-100">
                {urut.map((i) => (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => keIndikator(i.id)}
                      className="flex w-full items-center justify-between gap-4 py-2 text-left text-sm text-gray-600 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <span className="flex-1">{i.nama}</span>
                      <span className={cn("rounded-lg px-2.5 py-0.5 text-sm font-semibold tabular-nums", tingkat(i.skor).solid)}>{fmt(i.skor)}</span>
                      <ChevronRight className="-ml-1.5 h-4 w-4 shrink-0 text-gray-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gray-200 p-6 md:border-l md:border-t-0">
              <p className={LABEL}>Rekomendasi</p>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{PESAN[tingkat(total).label]}</p>
            </div>
          </div>
        </section>

        {/* Diselipkan di belakang hero: bagian atasnya tertutup, sehingga tampak menempel di bawah hero. */}
        {kategoriBuka && (
          <div className="-mt-4 flex flex-wrap items-center justify-start gap-x-6 gap-y-2 rounded-b-xl border border-gray-200 bg-[#F9F9F9] px-6 pb-3 pt-7">
            <p className={LABEL}>Kategori skor</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {KATEGORI.map((k) => (
                <li key={k.label} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", tingkat(k.contoh).dot)} />
                  {k.label}
                  <span className="text-sm font-semibold tabular-nums text-gray-900">{k.rentang}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <section className="space-y-4 pt-2">
        <div className="pb-2">
          <h2 className="text-lg font-semibold text-gray-900">Rincian per Indikator</h2>
          <p className="mt-1.5 text-sm text-gray-500">Subindikator dan rekomendasi perbaikan tiap indikator, diurutkan dari skor terendah.</p>
        </div>
        <div className="space-y-6">
          {urut.map((i) => (
            <article key={i.id} id={`indikator-${i.id}`} className="scroll-mt-[4.5rem] overflow-hidden rounded-[4px] border border-[#D9DBDD] bg-white">
              <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-5 py-4">
                <h3 className="text-lg font-semibold leading-snug text-gray-900">{i.nama}</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Penjelasan indikator ${i.nama}`}
                      className="shrink-0 rounded-full text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs leading-relaxed">{i.deskripsi}</TooltipContent>
                </Tooltip>
              </div>
              <div className="grid md:grid-cols-[30fr_35fr_35fr] md:divide-x md:divide-gray-200 max-md:divide-y max-md:divide-gray-200">
                <div className="p-5">
                  <p className={LABEL}>Skor</p>
                  <p className="mt-3 text-4xl font-bold tabular-nums leading-none text-gray-900">
                    {fmt(i.skor)}
                    <span className="text-base font-normal text-gray-400"> / 10</span>
                  </p>
                  <div className="mt-3">
                    <TingkatChip skor={i.skor} solid />
                    <Selisih skor={i.skor} sebelumnya={sebelumnya(i.id)} tahunSebelumnya={tahunSebelumnya} className="mt-1.5" />
                  </div>
                </div>

                <div className="p-5">
                  <p className={LABEL}>Subindikator</p>
                  <ul className="mt-2 divide-y divide-gray-100">
                    {i.subindikator.map((sub) => (
                      <li key={sub.nama} className="py-2.5 text-sm">
                        <p className="text-gray-700">{sub.nama}</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-gray-900">
                          {nilaiSubindikator(sub).teks}
                          <span className="font-normal text-gray-400"> / {sub.satuan === "persen" ? "100%" : "10"}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5">
                  <p className={LABEL}>Rekomendasi perbaikan</p>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    {i.rekomendasi.map((r) => (
                      <li key={r} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
