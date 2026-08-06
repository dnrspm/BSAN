"use client"

import { useState, useEffect, useLayoutEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Sidebar } from "@/components/dashboard/Sidebar"
import { Header } from "@/components/dashboard/Header"
import { DashboardView } from "@/components/views/DinasHome"
import { DataPokjaView } from "@/components/dashboard/DataPokjaView"
import { SumberRujukanView } from "@/components/dashboard/SumberRujukanView"
import { KegiatanView } from "@/components/dashboard/KegiatanView"

import { SidebarPusat, PusatMenu } from "@/components/pusat/SidebarPusat"
import { HeaderPusat } from "@/components/pusat/HeaderPusat"
import { DashboardPusatView } from "@/components/pusat/DashboardPusatView"
import { DaftarPengajuanView } from "@/components/pusat/DaftarPengajuanView"
import { DetailPengajuan } from "@/components/pusat/DetailPengajuan"
import { ValidatePokjaDrawer } from "@/components/pusat/ValidatePokjaDrawer"
import { LaporanAkhirTahunPusatView } from "@/components/pusat/LaporanAkhirTahunPusatView"
import { ManajemenPenggunaView } from "@/components/pusat/ManajemenPenggunaView"

import { SekolahDashboard } from "@/components/sekolah/SekolahDashboard"
import { PelanggaranView } from "@/components/sekolah/PelanggaranView"

import { MOCK_PENGAJUAN, PengajuanPokja } from "@/data/mockPokja"
import type { PokjaItem, PokjaData } from "@/types/pokja"
import { getDrafts, clearDraft } from "@/lib/draft-storage"

type AdminRole = "dinas" | "pusat" | "sekolah"
type DinaMenu = "dashboard" | "data-pokja" | "sumber-rujukan" | "kegiatan" | "pelanggaran"

const REGION = "Provinsi Aceh"

const emptyMember = () => ({ nama: "", email: "", jenisKelamin: "" as "", noWhatsapp: "", instansi: "", jabatan: "" })

const E = emptyMember
const SK0 = { file: null, nomorSK: "", tanggalSK: "", periodeMultai: "", periodeSelesai: "" }
const B = (id: string, nama: string): PokjaItem => ({
  id, nama, status: "belum-dibentuk",
  data: { region: nama, nomorKanal: "", members: { catatan: E() }, sk: SK0, consent: false }
})

const MOCK_POKJA_LIST: PokjaItem[] = [
  {
    id: "p1", nama: "Provinsi Jawa Timur", status: "aktif", tanggalDiverifikasi: "2024-03-15",
    validasiLog: [{ tanggal: "2024-03-15", aksi: "terima", aktor: "admin_pusat" }],
    data: {
      region: "Provinsi Jawa Timur", nomorKanal: "0812xxx",
      members: {
        ketua:       { nama: "Dr. Budi Santoso, M.Si",      email: "budi@jatim.go.id",   jenisKelamin: "Laki-Laki" as const,  noWhatsapp: "08121234567", instansi: "Dinas Pendidikan Provinsi Jawa Timur",  jabatan: "Ketua" },
        wakil:       { nama: "Ibu Siti Rahayu, M.Pd",       email: "siti@jatim.go.id",   jenisKelamin: "Perempuan" as const,  noWhatsapp: "08121234568", instansi: "Dinas Pendidikan Provinsi Jawa Timur",  jabatan: "Wakil Ketua" },
        koordinator: { nama: "Bpk. Ahmad Wijaya, S.H",      email: "ahmad@jatim.go.id",  jenisKelamin: "Laki-Laki" as const,  noWhatsapp: "08121234569", instansi: "Sekretariat Daerah Provinsi Jawa Timur", jabatan: "Koordinator" },
        pendidikan:  { nama: "Ibu Devi Kusuma, S.Pd",       email: "devi@jatim.go.id",   jenisKelamin: "Perempuan" as const,  noWhatsapp: "08121234570", instansi: "Dinas Pendidikan Provinsi Jawa Timur",  jabatan: "Anggota" },
        pppa:        { nama: "Bpk. Hadi Prasetyo, M.H",     email: "hadi@jatim.go.id",   jenisKelamin: "Laki-Laki" as const,  noWhatsapp: "08121234571", instansi: "DP3A Provinsi Jawa Timur",              jabatan: "Anggota" },
        sosial:      { nama: "Ibu Wati Susilowati, S.Sos",  email: "wati@jatim.go.id",   jenisKelamin: "Perempuan" as const,  noWhatsapp: "08121234572", instansi: "Dinas Sosial Provinsi Jawa Timur",      jabatan: "Anggota" },
        kesehatan:   { nama: "Dr. Nugroho, Sp.A",           email: "nugroho@jatim.go.id",jenisKelamin: "Laki-Laki" as const,  noWhatsapp: "08121234573", instansi: "Dinas Kesehatan Provinsi Jawa Timur",   jabatan: "Anggota" },
        kominfo:     { nama: "Bpk. Firman Hermawan, S.Kom", email: "firman@jatim.go.id", jenisKelamin: "Laki-Laki" as const,  noWhatsapp: "08121234574", instansi: "Dinas Kominfo Provinsi Jawa Timur",     jabatan: "Anggota" },
        dukbangga:   { nama: "Ibu Rina Hartati, M.Acc",     email: "rina@jatim.go.id",   jenisKelamin: "Perempuan" as const,  noWhatsapp: "08121234575", instansi: "BPKAD Provinsi Jawa Timur",             jabatan: "Anggota" },
      },
      sk: { file: null, nomorSK: "420/001/2024", tanggalSK: "2024-01-15", periodeMultai: "2024-01-15", periodeSelesai: "2027-01-14" },
      consent: false
    }
  },
  {
    id: "p2", nama: "Provinsi DKI Jakarta", status: "butuh-perbaikan", tanggalDiverifikasi: "2024-02-20",
    validasiLog: [
      { tanggal: "2024-02-20", aksi: "terima",     aktor: "admin_pusat" },
      { tanggal: "2025-01-01", aksi: "sk_expired", aktor: "sistem",      alasan: "SK berakhir" }
    ],
    data: {
      region: "Provinsi DKI Jakarta", nomorKanal: "0813xxx",
      members: {
        ketua:       { nama: "Dr. Ani Kusuma, M.Si",   email: "ani@dki.go.id",    jenisKelamin: "Perempuan" as const, noWhatsapp: "08131234567", instansi: "Dinas Pendidikan DKI Jakarta", jabatan: "Ketua" },
        wakil:       { nama: "Bpk. Reza Pratama",      email: "reza@dki.go.id",   jenisKelamin: "Laki-Laki" as const, noWhatsapp: "08131234568", instansi: "Dinas Pendidikan DKI Jakarta", jabatan: "Wakil Ketua" },
        koordinator: { nama: "Ibu Siti Aminah",        email: "siti@dki.go.id",   jenisKelamin: "Perempuan" as const, noWhatsapp: "08131234569", instansi: "Setda DKI Jakarta",            jabatan: "Koordinator" },
        pendidikan:  { nama: "Bpk. Budi Hartono",      email: "budi@dki.go.id",   jenisKelamin: "Laki-Laki" as const, noWhatsapp: "08131234570", instansi: "Dinas Pendidikan DKI Jakarta", jabatan: "Anggota" },
        pppa:        { nama: "Ibu Linda Sari",         email: "linda@dki.go.id",  jenisKelamin: "Perempuan" as const, noWhatsapp: "08131234571", instansi: "DP3A DKI Jakarta",             jabatan: "Anggota" },
        sosial:      { nama: "Bpk. Anton Wijaya",      email: "anton@dki.go.id",  jenisKelamin: "Laki-Laki" as const, noWhatsapp: "08131234572", instansi: "Dinas Sosial DKI Jakarta",     jabatan: "Anggota" },
        kesehatan:   { nama: "Dr. Sarah Rahmawati",    email: "sarah@dki.go.id",  jenisKelamin: "Perempuan" as const, noWhatsapp: "08131234573", instansi: "Dinas Kesehatan DKI Jakarta",  jabatan: "Anggota" },
        kominfo:     { nama: "Bpk. Rizal Fauzi, S.Kom",email: "rizal@dki.go.id", jenisKelamin: "Laki-Laki" as const, noWhatsapp: "08131234574", instansi: "Dinas Kominfo DKI Jakarta",    jabatan: "Anggota" },
        dukbangga:   { nama: "Ibu Maya Kurniawati",    email: "maya@dki.go.id",   jenisKelamin: "Perempuan" as const, noWhatsapp: "08131234575", instansi: "BPKAD DKI Jakarta",            jabatan: "Anggota" },
      },
      sk: { file: null, nomorSK: "456/002/2024", tanggalSK: "2024-01-20", periodeMultai: "2024-01-20", periodeSelesai: "2024-12-31" },
      consent: false
    }
  },
  {
    id: "p3", nama: "Provinsi Jawa Barat", status: "aktif", tanggalDiverifikasi: "2024-03-15",
    validasiLog: [
      { tanggal: "2024-01-05", aksi: "pengajuan", aktor: "user" },
      { tanggal: "2024-01-10", aksi: "tolak",     aktor: "admin_pusat", alasan: "Data anggota tidak lengkap" },
      { tanggal: "2024-02-20", aksi: "perbaiki",  aktor: "user",        alasan: "Data anggota sudah diperbaiki" },
      { tanggal: "2024-03-15", aksi: "aktivasi",  aktor: "admin_pusat" }
    ],
    data: {
      region: "Provinsi Jawa Barat", nomorKanal: "0814xxx",
      members: {
        ketua:       { nama: "Bpk. Dedi Supriadi, M.Pd",  email: "dedi@jabar.go.id",  jenisKelamin: "Laki-Laki" as const,  noWhatsapp: "08141234567", instansi: "Dinas Pendidikan Provinsi Jawa Barat", jabatan: "Ketua" },
        wakil:       { nama: "Ibu Rina Marlina, S.Pd",    email: "rina@jabar.go.id",  jenisKelamin: "Perempuan" as const,  noWhatsapp: "08141234568", instansi: "Dinas Pendidikan Provinsi Jawa Barat", jabatan: "Wakil Ketua" },
        koordinator: { nama: "Bpk. Rudi Hermawan, M.Si",  email: "rudi@jabar.go.id",  jenisKelamin: "Laki-Laki" as const,  noWhatsapp: "08141234569", instansi: "Sekretariat Daerah Provinsi Jawa Barat",jabatan: "Koordinator" },
        pendidikan:  { nama: "Ibu Siti Nurhaliza, S.Pd",  email: "siti@jabar.go.id",  jenisKelamin: "Perempuan" as const,  noWhatsapp: "08141234570", instansi: "Dinas Pendidikan Provinsi Jawa Barat", jabatan: "Anggota" },
        pppa:        { nama: "Bpk. Undang Hasan, M.H",    email: "undang@jabar.go.id",jenisKelamin: "Laki-Laki" as const,  noWhatsapp: "08141234571", instansi: "DP3A Provinsi Jawa Barat",             jabatan: "Anggota" },
        sosial:      { nama: "Ibu Yanti Kusuma, S.Sos",   email: "yanti@jabar.go.id", jenisKelamin: "Perempuan" as const,  noWhatsapp: "08141234572", instansi: "Dinas Sosial Provinsi Jawa Barat",     jabatan: "Anggota" },
      },
      sk: { file: null, nomorSK: "789/003/2024", tanggalSK: "2024-01-05", periodeMultai: "2024-01-05", periodeSelesai: "2027-01-04" },
      consent: false
    }
  },
  {
    id: "p4", nama: "Provinsi Jawa Tengah", status: "masih-diverifikasi",
    validasiLog: [{ tanggal: "2024-02-01", aksi: "pengajuan", aktor: "user" }],
    data: {
      region: "Provinsi Jawa Tengah", nomorKanal: "0815xxx",
      members: {
        ketua:       { nama: "Bpk. Hendra Wijanto, S.H, M.H", email: "hendra@jateng.go.id", jenisKelamin: "Laki-Laki" as const,  noWhatsapp: "08151234567", instansi: "Dinas Pendidikan Provinsi Jawa Tengah", jabatan: "Ketua" },
        wakil:       { nama: "Ibu Diana Permata, M.Pd",       email: "diana@jateng.go.id",  jenisKelamin: "Perempuan" as const,  noWhatsapp: "08151234568", instansi: "Dinas Pendidikan Provinsi Jawa Tengah", jabatan: "Wakil Ketua" },
        koordinator: { nama: "Bpk. Susanto, M.Si",            email: "susanto@jateng.go.id",jenisKelamin: "Laki-Laki" as const,  noWhatsapp: "08151234569", instansi: "Sekretariat Daerah Provinsi Jawa Tengah", jabatan: "Koordinator" },
        pendidikan:  { nama: "Ibu Maya Kumala, S.Pd",         email: "maya@jateng.go.id",   jenisKelamin: "Perempuan" as const,  noWhatsapp: "08151234570", instansi: "Dinas Pendidikan Provinsi Jawa Tengah", jabatan: "Anggota" },
        pppa:        { nama: "Bpk. Ali Akbar, M.H",           email: "ali@jateng.go.id",    jenisKelamin: "Laki-Laki" as const,  noWhatsapp: "08151234571", instansi: "DP3A Provinsi Jawa Tengah",              jabatan: "Anggota" },
        sosial:      { nama: "Ibu Ratna Sari, S.Sos",         email: "ratna@jateng.go.id",  jenisKelamin: "Perempuan" as const,  noWhatsapp: "08151234572", instansi: "Dinas Sosial Provinsi Jawa Tengah",      jabatan: "Anggota" },
      },
      sk: { file: null, nomorSK: "101/004/2024", tanggalSK: "2024-02-01", periodeMultai: "2024-02-01", periodeSelesai: "2027-01-31" },
      consent: false
    }
  },
  B("p5",  "Provinsi Aceh"),
  B("p6",  "Provinsi Bali"),
  B("p7",  "Provinsi Banten"),
  B("p8",  "Provinsi Bengkulu"),
  B("p9",  "Provinsi D.I. Yogyakarta"),
  B("p10", "Provinsi Gorontalo"),
  B("p11", "Provinsi Jambi"),
  B("p12", "Provinsi Kalimantan Barat"),
  B("p13", "Provinsi Kalimantan Selatan"),
  B("p14", "Provinsi Kalimantan Tengah"),
  B("p15", "Provinsi Kalimantan Timur"),
  B("p16", "Provinsi Kalimantan Utara"),
  B("p17", "Provinsi Kepulauan Bangka Belitung"),
  B("p18", "Provinsi Kepulauan Riau"),
  B("p19", "Provinsi Lampung"),
  B("p20", "Provinsi Maluku"),
  B("p21", "Provinsi Maluku Utara"),
  B("p22", "Provinsi Nusa Tenggara Barat"),
  B("p23", "Provinsi Nusa Tenggara Timur"),
  B("p24", "Provinsi Papua"),
  B("p25", "Provinsi Papua Barat"),
  B("p26", "Provinsi Papua Barat Daya"),
  B("p27", "Provinsi Papua Pegunungan"),
  B("p28", "Provinsi Papua Selatan"),
  B("p29", "Provinsi Papua Tengah"),
  B("p30", "Provinsi Riau"),
  B("p31", "Provinsi Sulawesi Barat"),
  B("p32", "Provinsi Sulawesi Selatan"),
  B("p33", "Provinsi Sulawesi Tengah"),
  B("p34", "Provinsi Sulawesi Tenggara"),
  B("p35", "Provinsi Sulawesi Utara"),
  B("p36", "Provinsi Sumatera Barat"),
  B("p37", "Provinsi Sumatera Selatan"),
  B("p38", "Provinsi Sumatera Utara"),
]

function DashboardPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasProcessedSubmit = useRef(false)
  const hasProcessedPerbaikan = useRef(false)

  const [role, setRole] = useState<AdminRole>("dinas")
  const [dinasMenu, setDinasMenu] = useState<DinaMenu>("dashboard")
  const [pusatMenu, setPusatMenu] = useState<PusatMenu>("dashboard")
  const [pengajuan, setPengajuan] = useState<PengajuanPokja[]>(MOCK_PENGAJUAN)
  const [pokjaList, setPokjaList] = useState<PokjaItem[]>(MOCK_POKJA_LIST)
  const [selectedPengajuan, setSelectedPengajuan] = useState<PengajuanPokja | null>(null)
  const [validatingPokja, setValidatingPokja] = useState<PokjaItem | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const auth = localStorage.getItem("auth")
    if (!auth) {
      router.replace("/")
      return
    }
    try {
      const parsed = JSON.parse(auth) as { role: AdminRole }
      if (parsed.role === "pusat") setRole("pusat")
      else if (parsed.role === "dinas") setRole("dinas")
      else if (parsed.role === "sekolah") setRole("sekolah")
      else {
        router.replace("/")
        return
      }
    } catch {
      router.replace("/")
    }
  }, [])

  // Handle ?menu= URL param for dinas
  useEffect(() => {
    const menuParam = searchParams.get("menu") as DinaMenu | null
    if (menuParam && ["dashboard", "data-pokja", "sumber-rujukan", "kegiatan", "pelanggaran"].includes(menuParam)) {
      setDinasMenu(menuParam)
    }
  }, [searchParams])

  // Handle ?menu= URL param for pusat
  useEffect(() => {
    const menuParam = searchParams.get("menu") as PusatMenu | null
    if (menuParam === "pelanggaran" || menuParam === "pengguna") {
      setPusatMenu(menuParam)
    }
  }, [searchParams])

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pokjaList")
      const mockIds  = new Set(MOCK_POKJA_LIST.map(p => p.id))
      const mockNames = new Map(MOCK_POKJA_LIST.map(p => [p.nama.trim().toLowerCase(), p.id]))

      const merged: PokjaItem[] = MOCK_POKJA_LIST.map(p => ({ ...p }))

      if (stored) {
        const parsed = JSON.parse(stored) as PokjaItem[]
        const seen = new Set<string>()
        for (const p of parsed) {
          if (seen.has(p.id)) continue
          seen.add(p.id)

          if (mockIds.has(p.id)) {
            const idx = merged.findIndex(m => m.id === p.id)
            if (idx !== -1) merged[idx] = {
              ...merged[idx],
              status: p.status,
              data: p.data,
              validasiLog: p.validasiLog,
              alasanPenolakan: p.alasanPenolakan,
              tanggalDiverifikasi: p.tanggalDiverifikasi,
            }
            continue
          }

          const key = p.nama.trim().toLowerCase()
          if (mockNames.has(key)) {
            const idx = merged.findIndex(m => m.nama.trim().toLowerCase() === key)
            if (idx !== -1) merged[idx] = {
              ...merged[idx],
              status: p.status,
              data: p.data,
              validasiLog: p.validasiLog,
              alasanPenolakan: p.alasanPenolakan,
              tanggalDiverifikasi: p.tanggalDiverifikasi,
            }
          } else {
            merged.push(p)
          }
        }
      }

      const mockDefaults = new Map(MOCK_POKJA_LIST.map(p => [p.id, { status: p.status, hasLog: false }]))
      const toSave = merged.filter(p => {
        const def = mockDefaults.get(p.id)
        if (def) {
          return p.status !== def.status || (p.validasiLog && p.validasiLog.length > 0) || !!p.alasanPenolakan
        }
        return true
      })
      localStorage.setItem("pokjaList", JSON.stringify(toSave))
      setPokjaList(merged)
    } catch {
      setPokjaList(MOCK_POKJA_LIST)
    }
    setMounted(true)
  }, [])

  // Check if we're coming from a recent submission
  const justSubmitted = searchParams.get("pokjaSubmitted") === "1" || searchParams.get("pokjaCreated") === "1"

  // Load draft only if: mounted, not just submitted, and no submitted pokja for this region
  useEffect(() => {
    if (!mounted) return
    if (justSubmitted) return  // Skip loading draft right after submission
    
    // Check if there's already a submitted pokja for this region (exclude draf)
    const hasSubmittedPokja = pokjaList.some(p => 
      p.data.region === REGION && 
      p.status !== "draf" &&
      (p.status === "masih-diverifikasi" || p.status === "aktif" || p.status === "butuh-perbaikan")
    )
    
    // If already submitted, don't load draft
    if (hasSubmittedPokja) return
    
    // Remove any existing draft pokja first (cleanup)
    setPokjaList(prev => prev.filter(p => p.id !== "draft_ongoing"))
    
    // Otherwise load draft if exists
    try {
      const draft = getDrafts()
      if (draft) {
        const draftPokja: PokjaItem = {
          id: "draft_ongoing",
          nama: REGION,
          status: "draf",
          data: {
            region: REGION,
            nomorKanal: draft.kanalPengaduan,
            members: draft.members,
            sk: {
              file: null,
              nomorSK: draft.sk.nomorSK,
              tanggalSK: draft.sk.tanggalSK,
              periodeMultai: draft.sk.periodeMulai,
              periodeSelesai: draft.sk.periodeSelesai,
            },
            consent: false,
          },
          validasiLog: [],
        }
        setPokjaList(prev => {
          const filtered = prev.filter(p => p.id !== "draft_ongoing")
          return [draftPokja, ...filtered]
        })
      }
    } catch {}
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    try {
      const mockDefaults = new Map(MOCK_POKJA_LIST.map(p => [p.id, p.status]))
      const seen = new Set<string>()
      const toSave = pokjaList.filter(p => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        if (mockDefaults.has(p.id)) {
          return p.status !== mockDefaults.get(p.id) || (p.validasiLog && p.validasiLog.length > 0) || !!p.alasanPenolakan
        }
        return true
      })
      localStorage.setItem("pokjaList", JSON.stringify(toSave))
    } catch {}
  }, [pokjaList, mounted])

  useEffect(() => {
    if (!mounted) return
    if (searchParams.get("pokjaCreated") !== "1" && searchParams.get("pokjaSubmitted") !== "1") return
    if (hasProcessedSubmit.current) return
    hasProcessedSubmit.current = true

    try {
      const raw = sessionStorage.getItem("newPokjaData")
      if (!raw) return

      const parsed = JSON.parse(raw) as Omit<PokjaData, "sk"> & {
        sk: Omit<PokjaData["sk"], "file"> & { file: string | null }
        pokjaStatus?: string
      }

      const resolvedStatus = (parsed.pokjaStatus === "aktif" || parsed.pokjaStatus === "masih-diverifikasi")
        ? parsed.pokjaStatus
        : (role === "pusat" ? "aktif" : "masih-diverifikasi")

      const existingIds = new Set(pokjaList.map(p => p.id))
      let newId = `pokja-${Date.now()}`
      while (existingIds.has(newId)) {
        newId = `pokja-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      }

      const today = new Date().toISOString().slice(0, 10)
      const newLog = { tanggal: today, aksi: "pengajuan", aktor: resolvedStatus === "aktif" ? "admin_pusat" : "user" }

      const newPokja: PokjaItem = {
        id: newId,
        nama: parsed.region,
        status: resolvedStatus as PokjaItem["status"],
        validasiLog: [newLog],
        data: {
          ...parsed,
          sk: { ...parsed.sk, file: null, periodeMultai: parsed.sk.periodeMultai ?? "" },
        },
      }

      setPokjaList((prev) => {
        const seen = new Set<string>()
        const deduped = prev.filter(p => {
          if (seen.has(p.id)) return false
          seen.add(p.id)
          return true
        })
        const sameRegionIdx = deduped.findIndex(p =>
          p.nama.trim().toLowerCase() === newPokja.nama.trim().toLowerCase()
        )
        if (sameRegionIdx !== -1) {
          const updated = [...deduped]
          const existing = updated[sameRegionIdx]
          updated[sameRegionIdx] = {
            ...existing,
            status: newPokja.status,
            data: newPokja.data,
            validasiLog: [newLog],
          }
          clearDraft()
          return updated
        }
        if (deduped.some(p => p.id === newId)) return deduped
        clearDraft()
        return [...deduped, newPokja]
      })

      const url = new URL(window.location.href)
      url.searchParams.delete("pokjaCreated")
      url.searchParams.delete("pokjaSubmitted")
      window.history.replaceState({}, "", url.toString())
    } catch (e) {
      console.error("Failed to process pokja submission", e)
    }
  }, [mounted, searchParams])

  useEffect(() => {
    if (!mounted) return
    if (searchParams.get("pokjaPerbaikan") !== "1") return
    if (hasProcessedPerbaikan.current) return
    hasProcessedPerbaikan.current = true

    try {
      const raw = sessionStorage.getItem("perbaikanSubmitData")
      if (!raw) return
      sessionStorage.removeItem("perbaikanSubmitData")

      const parsed = JSON.parse(raw) as Omit<PokjaData, "sk"> & {
        sk: Omit<PokjaData["sk"], "file"> & { file: string | null }
        prevStatus?: string
        deskripsiPerbaikan?: string
      }

      const today = new Date().toISOString().slice(0, 10)
      const isEdit = parsed.prevStatus === "aktif"
      const defaultAlasan = isEdit
        ? "Kelompok Kerja diperbarui dan diajukan ulang untuk verifikasi"
        : "Data diperbaiki dan diajukan kembali"
      const logPerbaiki = {
        tanggal: today,
        aksi: isEdit ? "edit" : "perbaiki",
        aktor: "user",
        alasan: parsed.deskripsiPerbaikan?.trim() || defaultAlasan,
      }

      setPokjaList((prev) => {
        const seen = new Set<string>()
        const deduped = prev.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true })
        const idx = deduped.findIndex(p =>
          p.nama.trim().toLowerCase() === parsed.region.trim().toLowerCase()
        )
        if (idx === -1) return deduped
        const updated = [...deduped]
        const existing = updated[idx]
        updated[idx] = {
          ...existing,
          status: "masih-diverifikasi",
          data: { ...parsed, sk: { ...parsed.sk, file: null, periodeMultai: parsed.sk.periodeMultai ?? "" } },
          validasiLog: [...(existing.validasiLog ?? []), logPerbaiki],
        }
        return updated
      })

      const url = new URL(window.location.href)
      url.searchParams.delete("pokjaPerbaikan")
      window.history.replaceState({}, "", url.toString())
    } catch (e) {
      console.error("Failed to process pokja perbaikan", e)
    }
  }, [mounted, searchParams])

  const navigateToBuatPokja = () => {
    router.push("/buat-pokja")
  }

  const handlePerbaikiPokja = (pokja: PokjaItem) => {
    try {
      sessionStorage.setItem("perbaikanPokjaData", JSON.stringify({
        prevStatus: pokja.status,
        nomorKanal: pokja.data?.nomorKanal ?? "",
        members: pokja.data?.members ?? {},
        sk: {
          nomorSK: pokja.data?.sk?.nomorSK ?? "",
          tanggalSK: pokja.data?.sk?.tanggalSK ?? "",
          periodeMulai: pokja.data?.sk?.periodeMultai ?? "",
          periodeSelesai: pokja.data?.sk?.periodeSelesai ?? "",
        },
      }))
    } catch {}
    router.push("/buat-pokja")
  }

  const handleSavePengajuan = (updated: PengajuanPokja) => {
    setPengajuan((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  const handleSavePokjaValidation = (updated: PokjaItem) => {
    setPokjaList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    setValidatingPokja(null)
  }

  return (
    <>
      {role === "dinas" && (
        <div className="min-h-screen bg-gray-50 flex">
          <Sidebar activeMenu={dinasMenu} onMenuChange={setDinasMenu} />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-4 md:p-6 overflow-auto">
              {dinasMenu === "dashboard" && (
                <DashboardView
                  pokjaList={pokjaList.filter((p) => p.data.region === REGION)}
                  onBuatPokja={navigateToBuatPokja}
                  onViewDataPokja={() => setDinasMenu("data-pokja")}
                  onViewSumberRujukan={() => setDinasMenu("sumber-rujukan")}
                  onViewActivities={() => setDinasMenu("kegiatan")}
                  onPerbaikiPokja={handlePerbaikiPokja}
                  onContinueDraft={() => router.push("/buat-pokja?draftId=draft_ongoing")}
                />
              )}
              {dinasMenu === "data-pokja" && (
                <DataPokjaView
                  pokjaList={pokjaList}
                  onBuatPokja={navigateToBuatPokja}
                  onContinueDraft={() => router.push("/buat-pokja?draftId=draft_ongoing")}
                  isAdminPusat={false}
                  onValidatePusat={(p) => setValidatingPokja(p)}
                  onPerbaikiPokja={handlePerbaikiPokja}
                />
              )}
              {dinasMenu === "sumber-rujukan" && <SumberRujukanView />}
              {dinasMenu === "kegiatan" && <KegiatanView />}
              {dinasMenu === "pelanggaran" && <PelanggaranView editId={searchParams.get("edit") ?? undefined} />}
            </main>
          </div>
        </div>
      )}

      {role === "pusat" && (
        <div className="min-h-screen bg-gray-50 flex">
          <SidebarPusat activeMenu={pusatMenu} onMenuChange={setPusatMenu} />
          <div className="flex-1 flex flex-col min-w-0">
            <div className="md:hidden h-14" aria-hidden="true" />
            <HeaderPusat />
            <main className="flex-1 px-4 md:px-6 py-6">
              {pusatMenu === "dashboard" && (
                <DashboardPusatView
                  pokjaList={pokjaList}
                  onValidatePusat={(pokja) => setValidatingPokja(pokja)}
                  onViewSumberRujukan={() => setPusatMenu("sumber-rujukan")}
                  onViewActivities={() => setPusatMenu("k" as PusatMenu)}
                  onGoToPokja={(pokja) => {
                    setPusatMenu("pokja")
                    setValidatingPokja(pokja)
                  }}
                />
              )}
              {pusatMenu === "pokja" && (
                <DaftarPengajuanView 
                  pokjaList={pokjaList} 
                  onSelect={(pokja) => setValidatingPokja(pokja)}
                />
              )}
              {pusatMenu === "sumber-rujukan" && <SumberRujukanView />}
              {pusatMenu === "k" && < KegiatanView />}
              {pusatMenu === "pelanggaran" && <PelanggaranView editId={searchParams.get("edit") ?? undefined} />}
              {pusatMenu === "laporan-akhir-tahun" && <LaporanAkhirTahunPusatView />}
              {pusatMenu === "pengguna" && <ManajemenPenggunaView />}
            </main>
          </div>
          {selectedPengajuan && (
            <DetailPengajuan
              item={selectedPengajuan}
              onClose={() => setSelectedPengajuan(null)}
              onSave={(updated) => {
                handleSavePengajuan(updated)
                setSelectedPengajuan(null)
              }}
            />
          )}
          {validatingPokja && (
            <ValidatePokjaDrawer
              pokja={validatingPokja}
              onClose={() => setValidatingPokja(null)}
              onSave={handleSavePokjaValidation}
            />
          )}
        </div>
      )}

      {role === "sekolah" && (
        <div className="min-h-screen bg-gray-50">
          <SekolahDashboard searchParams={searchParams} />
        </div>
      )}
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <DashboardPageInner />
    </Suspense>
  )
}
