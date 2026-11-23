"use client"

import { Fragment, useState } from "react"
import { Check, ChevronDown, ChevronRight, ChevronUp, ExternalLink, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AspekTambahan } from "./indeks-bsan/AspekTambahan"
import { DaftarTerpotong } from "./indeks-bsan/DaftarTerpotong"
import { UnduhDokumen } from "./indeks-bsan/UnduhDokumen"
import type { IdentitasDokumen } from "@/lib/metadata-bsan"
import { LastUpdate, Selisih, TAHUN_AKTIF, TERAKHIR_DIPERBARUI, TahunSelect, TingkatChip, fmt, nilaiSubindikator, tingkat, useDataTahun } from "./indeks-bsan/shared"

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

const PENJELASAN_BSAN =
  "Budaya Sekolah Aman dan Nyaman (BSAN) adalah program Kementerian Pendidikan untuk menciptakan lingkungan sekolah yang aman, nyaman, dan bebas dari kekerasan, mencakup aspek fisik, psikologis, spiritual, dan sosiokultural. Indeks BSAN menggambarkan penerapannya, dinilai dari 4 indikator dengan skala 0–10."

const LABEL = "text-xs font-semibold uppercase tracking-wide text-gray-500"

/** Lebar kolom kartu skor di atas dan kartu tiap indikator dibuat sama (26 : 40 : 34) agar garis kolomnya lurus. */
const KOLOM_GRID = "md:grid-cols-[26fr_40fr_34fr]"

/** Alamat halaman glosarium (situs lain, dibuka di tab baru). TODO: ganti dengan alamat resmi dari tim produk. */
const URL_GLOSARIUM = "#"

/** Tinggi daftar subindikator dan rekomendasi saat tertutup; sama di semua kartu. */
const TINGGI_DAFTAR = "14rem"

/** Instansi lain yang detail skornya dibuka (mis. oleh admin dinas); `skorTahun` memberi skor akhirnya per tahun. */
export interface DetailInstansi {
  nama: string
  /** NPSN; kosong untuk dinas. */
  npsn?: string
  kabKota?: string
  provinsi?: string
  skorTahun: (tahun: number) => number | null
}

/** Identitas untuk mencari link dokumen: sekolah lewat NPSN/nama, daerah lewat tingkat dan nama daerah. */
function identitasDokumen(i: DetailInstansi): IdentitasDokumen {
  if (i.npsn) return { jenis: "sekolah", npsn: i.npsn, nama: i.nama }
  return i.kabKota ? { jenis: "dinas", level: "Kab/Kota", nama: i.kabKota } : { jenis: "dinas", level: "Provinsi", nama: i.provinsi }
}

interface IndeksBsanViewProps {
  judul?: string
  /** Bila diisi, tampilkan detail skor instansi ini, bukan skor akun yang login. */
  instansi?: DetailInstansi
  /** Jejak halaman di atas judul; item tanpa `onClick` adalah halaman aktif. */
  breadcrumb?: { label: string; onClick?: () => void }[]
}

export function IndeksBsanView({ judul = "Indeks BSAN", instansi, breadcrumb }: IndeksBsanViewProps = {}) {
  const [tahun, setTahun] = useState(TAHUN_AKTIF)
  const [kategoriBuka, setKategoriBuka] = useState(false)
  /** Kartu yang daftarnya dibuka penuh. */
  const [terbuka, setTerbuka] = useState<Record<string, boolean>>({})
  /** Kolom (`<id>:sub`, `<id>:rek`) yang isinya melebihi tinggi tertutup; hasil ukur DaftarTerpotong. */
  const [terpotong, setTerpotong] = useState<Record<string, boolean>>({})
  const ukur = (kunci: string) => (v: boolean) => setTerpotong((t) => (t[kunci] === v ? t : { ...t, [kunci]: v }))
  const { data, total: skorAkhir, tahunSebelumnya, dataSebelumnya, totalSebelumnya } = useDataTahun(tahun, instansi?.skorTahun)
  const belumMengikuti = skorAkhir === null
  const total = skorAkhir ?? 0
  const urut = [...data].sort((a, b) => a.skor - b.skor)
  const keIndikator = (id: string) => document.getElementById(`indikator-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })

  const sebelumnya = (id: string) => dataSebelumnya?.find((i) => i.id === id)?.skor

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          {breadcrumb && (
            <Breadcrumb className="mb-5">
              <BreadcrumbList>
                {breadcrumb.map((b, n) => (
                  <Fragment key={b.label}>
                    {n > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {b.onClick ? (
                        <BreadcrumbLink asChild>
                          <button type="button" onClick={b.onClick} className="hover:underline">{b.label}</button>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{b.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
          <h1 className={cn("font-semibold text-gray-900", instansi ? "text-2xl font-bold" : "text-xl")}>{instansi?.nama ?? judul}</h1>
          {instansi ? (
            <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-10 gap-y-2 text-sm">
              {(
                [
                  instansi.npsn ? ["NPSN", instansi.npsn] : null,
                  instansi.kabKota
                    ? ["Kab/Kota, Provinsi", instansi.provinsi ? `${instansi.kabKota}, Prov. ${instansi.provinsi}` : instansi.kabKota]
                    : instansi.provinsi
                      ? ["Provinsi", instansi.provinsi]
                      : null,
                  ["Terakhir diperbarui", TERAKHIR_DIPERBARUI],
                ].filter(Boolean) as [string, string][]
              ).map(([label, nilai]) => (
                <Fragment key={label}>
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-semibold tabular-nums text-gray-900">{nilai}</dd>
                </Fragment>
              ))}
            </dl>
          ) : (
            <p className="mt-1 text-sm text-gray-500">Gambaran penerapan Budaya Sekolah Aman dan Nyaman, dinilai dari 4 indikator dengan skala 0–10. <LastUpdate /></p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 md:max-w-[62%] md:justify-end">
          <TahunSelect tahun={tahun} onChange={setTahun} />
          <UnduhDokumen tahun={tahun} identitas={instansi && identitasDokumen(instansi)} />
        </div>
      </div>

      {belumMengikuti ? (
        <div className="rounded-[4px] border border-[#D9DBDD] bg-white px-6 py-16 text-center">
          <p className="text-base font-semibold text-gray-900">Skor belum tersedia</p>
          <p className="mt-1 text-sm text-gray-500">{instansi?.nama} belum mengikuti evaluasi BSAN pada tahun {tahun}.</p>
        </div>
      ) : (
      <>

      <div>
        <section className="relative z-10 rounded-[4px] border border-[#D9DBDD] bg-white">
          <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold leading-snug text-gray-900">Skor Indeks BSAN {tahun}</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Penjelasan Indeks BSAN"
                  className="shrink-0 rounded-full text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs leading-relaxed">{PENJELASAN_BSAN}</TooltipContent>
            </Tooltip>
          </div>
          <div className={cn("md:grid", KOLOM_GRID)}>
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
          {urut.map((i) => {
            const buka = !!terbuka[i.id]
            const bisaLipat = !!(terpotong[`${i.id}:sub`] || terpotong[`${i.id}:rek`])
            // Subindikator diurutkan dari nilai terendah, seperti indikator di halaman ini, agar yang paling lemah selalu terlihat.
            const subUrut = [...i.subindikator].sort((a, b) => nilaiSubindikator(a).skor10 - nilaiSubindikator(b).skor10)
            return (
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
              <div className={cn("grid max-md:divide-y max-md:divide-gray-200", KOLOM_GRID)}>
                <div className="p-5 md:row-span-2">
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

                <div className="p-5 md:border-l md:border-gray-200">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className={LABEL}>Subindikator</p>
                    <p className={cn(LABEL, "w-24 shrink-0 text-right")}>Nilai</p>
                  </div>
                  <div className="mt-2">
                    <DaftarTerpotong buka={buka} tinggi={TINGGI_DAFTAR} onUkur={ukur(`${i.id}:sub`)} ukuranKey={subUrut.map((x) => x.nama).join("|")} className="divide-y divide-gray-100">
                      {subUrut.map((sub) => (
                        <li key={sub.nama} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                          <span data-teks className="min-w-0 text-gray-700">{sub.nama}</span>
                          {/* Dua kolom (nama | nilai) dengan lebar tetap tanpa garis pemisah; isi kolom nilai rata kanan. */}
                          <span className="w-24 shrink-0 text-right tabular-nums">
                            <span className="font-semibold text-gray-900">{nilaiSubindikator(sub).teks}</span>
                            <span className="text-gray-400"> / {sub.satuan === "persen" ? "100%" : "10"}</span>
                          </span>
                        </li>
                      ))}
                    </DaftarTerpotong>
                  </div>
                </div>

                <div className="p-5 md:border-l md:border-gray-200">
                  <p className={LABEL}>Rekomendasi perbaikan</p>
                  <div className="mt-2">
                    <DaftarTerpotong buka={buka} tinggi={TINGGI_DAFTAR} onUkur={ukur(`${i.id}:rek`)} ukuranKey={i.rekomendasi.join("|")} className="space-y-2 pt-0.5 text-sm text-gray-600">
                      {i.rekomendasi.map((r) => (
                        <li key={r} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                          <span data-teks className="min-w-0">{r.replace(/\.$/, "")}<span data-titik>{r.endsWith(".") ? "." : ""}</span></span>
                        </li>
                      ))}
                    </DaftarTerpotong>
                  </div>
                </div>
                {/* Sel gabungan di bawah kolom Subindikator dan Rekomendasi. Selalu ada di semua kartu (kosong bila tidak perlu tombol) agar tinggi kartu seragam. */}
                <div className={cn("md:col-span-2 md:col-start-2 md:border-l md:border-gray-200", !(bisaLipat || buka) && "max-md:hidden")}>
                  <div className={cn("flex min-h-12 items-center px-5 py-3", (bisaLipat || buka) && "border-t border-gray-200")}>
                    {(bisaLipat || buka) && (
                      <button
                        type="button"
                        onClick={() => setTerbuka((t) => ({ ...t, [i.id]: !buka }))}
                        aria-expanded={buka}
                        className="inline-flex items-center gap-1 rounded-[2px] text-sm font-semibold text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        {buka ? <>Tampilkan lebih sedikit <ChevronUp className="h-4 w-4" aria-hidden="true" /></> : <>Lihat semua subindikator dan rekomendasi <ChevronDown className="h-4 w-4" aria-hidden="true" /></>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
            )
          })}
        </div>
      </section>

      <AspekTambahan />
      </>
      )}

      <p className="border-t border-gray-200 pt-6 text-sm text-gray-600">
        Informasi selengkapnya bisa merujuk pada glosarium.{" "}
        <a
          href={URL_GLOSARIUM}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Klik di sini untuk membuka glosarium di tab baru"
          className="inline-flex items-center gap-1 rounded-[2px] font-semibold text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Klik di sini <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </p>
    </div>
  )
}
