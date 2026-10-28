"use client"

import { useState } from "react"
import { Building2, CheckCircle2, MapPin, Phone, Send } from "lucide-react"
import type { KategoriDukungan, SumberRujukan } from "@/components/dashboard/SumberRujukanView"
import { RUJUKAN_LOG } from "@/lib/rujukan-logs"
import { readAuthSession } from "@/lib/auth-session"

const KATEGORI_OPTIONS: KategoriDukungan[] = [
  "Fasilitas Kesehatan",
  "Konseling",
  "Bantuan Hukum",
  "Kepolisian",
  "Psikologi",
  "Pendidikan",
  "Sosial",
  "Lainnya",
]

export interface UsulInstansiPayload {
  id: string
  wilayah: string
  namaInstansi: string
  kategoriBentukDukungan: KategoriDukungan
  alamat: string
  nomorKontak: string
  keterangan: string
  createdAt: string
}

interface UsulInstansiFormProps {
  wilayah: string
}

export function UsulInstansiForm({ wilayah }: UsulInstansiFormProps) {
  const [namaInstansi, setNamaInstansi] = useState("")
  const [kategori, setKategori] = useState<KategoriDukungan>("Konseling")
  const [alamat, setAlamat] = useState("")
  const [nomorKontak, setNomorKontak] = useState("")
  const [keterangan, setKeterangan] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    const payload: UsulInstansiPayload = {
      id: `usul-${Date.now()}`,
      wilayah,
      namaInstansi: namaInstansi.trim(),
      kategoriBentukDukungan: kategori,
      alamat: alamat.trim(),
      nomorKontak: nomorKontak.trim(),
      keterangan: keterangan.trim(),
      createdAt: new Date().toISOString(),
    }
    try {
      const raw = localStorage.getItem("usulInstansiList")
      const prev: UsulInstansiPayload[] = raw ? JSON.parse(raw) : []
      localStorage.setItem("usulInstansiList", JSON.stringify([payload, ...prev]))

      const auth = readAuthSession()
      const namaSekolah = auth?.namaSekolah?.trim() || "Sekolah"
      const kontakDigits = payload.nomorKontak.replace(/\D/g, "")
      const newRujukan: SumberRujukan = {
        id: `sr-${Date.now()}`,
        namaInstansi: payload.namaInstansi,
        kategoriBentukDukungan: payload.kategoriBentukDukungan,
        kategoriPenyedia: "",
        provinsi: "Aceh",
        kabupatenKota: wilayah,
        namaJalan: payload.alamat,
        nomorJalan: "",
        kodePos: "",
        tautanGoogleMaps: "",
        nomorCallCenter: kontakDigits || payload.nomorKontak.trim(),
        nomorPribadi: "",
        website: "",
        aksesInfo: "publik",
        status: "menunggu",
        jenisMenunggu: "pengajuan",
        dibuatOleh: `Admin Sekolah ${namaSekolah}`,
        logTerakhir: RUJUKAN_LOG.dibuatSekolah(namaSekolah),
        usulanDari: "sekolah",
        namaSekolah,
        createdAt: payload.createdAt,
      }
      const rujukanRaw = localStorage.getItem("rujukanList")
      const rujukanStored: SumberRujukan[] = rujukanRaw ? JSON.parse(rujukanRaw) : []
      localStorage.setItem("rujukanList", JSON.stringify([...rujukanStored, newRujukan]))
      window.dispatchEvent(new CustomEvent("rujukanUpdated"))
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      setSending(false)
      setSubmitted(true)
      setNamaInstansi("")
      setAlamat("")
      setNomorKontak("")
      setKeterangan("")
    }, 400)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Usul Instansi / Layanan Baru</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Ajukan penambahan instansi atau layanan sebagai Sumber Dukungan apabila belum terdaftar di sistem untuk wilayah{" "}
          <span className="font-medium text-gray-700">{wilayah}</span>.
        </p>
      </div>

      {submitted && (
        <div className="flex items-start gap-3 rounded-[4px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Usulan berhasil dikirim</p>
            <p className="text-xs text-emerald-800/90 mt-0.5">
              Data tersimpan untuk keperluan demo. Pada produksi, usulan akan dikirim ke dinas untuk verifikasi.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-[4px] border border-gray-200 shadow-sm p-5 md:p-6 space-y-5">
        <div>
          <label className="text-xs font-medium text-gray-700">Wilayah</label>
          <div className="mt-1 flex items-center gap-2 rounded-[4px] border border-gray-200 bg-[#F9F9F9] px-3 py-2.5 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            {wilayah}
          </div>
        </div>

        <div>
          <label htmlFor="nama" className="text-xs font-medium text-gray-700">
            Nama instansi / layanan <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="nama"
              required
              value={namaInstansi}
              onChange={(e) => setNamaInstansi(e.target.value)}
              placeholder="Contoh: Pusat Layanan Anak Terpadu"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-[4px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="kategori" className="text-xs font-medium text-gray-700">
            Kategori bentuk dukungan <span className="text-red-500">*</span>
          </label>
          <select
            id="kategori"
            value={kategori}
            onChange={(e) => setKategori(e.target.value as KategoriDukungan)}
            className="mt-1 w-full rounded-[4px] border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            {KATEGORI_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="alamat" className="text-xs font-medium text-gray-700">
            Alamat singkat <span className="text-red-500">*</span>
          </label>
          <textarea
            id="alamat"
            required
            rows={3}
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Jalan, kelurahan, kecamatan"
            className="mt-1 w-full rounded-[4px] border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="kontak" className="text-xs font-medium text-gray-700">
            Nomor kontak / call center <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="kontak"
              required
              value={nomorKontak}
              onChange={(e) => setNomorKontak(e.target.value)}
              placeholder="Contoh: 0651xxxxxx"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-[4px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="ket" className="text-xs font-medium text-gray-700">
            Keterangan / alasan usulan
          </label>
          <textarea
            id="ket"
            rows={3}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Jelaskan kebutuhan sekolah terkait layanan ini"
            className="mt-1 w-full rounded-[4px] border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-[4px] text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition"
        >
          <Send className="w-4 h-4" />
          {sending ? "Mengirim..." : "Kirim usulan"}
        </button>
      </form>
    </div>
  )
}
