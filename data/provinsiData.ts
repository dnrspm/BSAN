import { MOCK_PENGAJUAN } from "./mockPokja"

export interface ProvinsiRow {
  no: number
  provinsi: string
  statusPokja: "Aktif" | "Belum Dibentuk"
  jumlahKabKota: number
  pokjaKabKota: number
  persentase: number
  pokjaId?: string
  skor?: number
  skorDelta?: number
  bidangTersedia?: number
  kontak?: string
}

const ALL_PROVINSI: { name: string; kabKota: number }[] = [
  { name: "Aceh", kabKota: 23 },
  { name: "Sumatera Utara", kabKota: 33 },
  { name: "Sumatera Barat", kabKota: 19 },
  { name: "Riau", kabKota: 12 },
  { name: "Jambi", kabKota: 11 },
  { name: "Sumatera Selatan", kabKota: 17 },
  { name: "Bengkulu", kabKota: 10 },
  { name: "Lampung", kabKota: 15 },
  { name: "Kepulauan Bangka Belitung", kabKota: 7 },
  { name: "Kepulauan Riau", kabKota: 7 },
  { name: "DKI Jakarta", kabKota: 6 },
  { name: "Jawa Barat", kabKota: 27 },
  { name: "Jawa Tengah", kabKota: 35 },
  { name: "DI Yogyakarta", kabKota: 5 },
  { name: "Jawa Timur", kabKota: 38 },
  { name: "Banten", kabKota: 8 },
  { name: "Bali", kabKota: 9 },
  { name: "Nusa Tenggara Barat", kabKota: 10 },
  { name: "Nusa Tenggara Timur", kabKota: 22 },
  { name: "Kalimantan Barat", kabKota: 14 },
  { name: "Kalimantan Tengah", kabKota: 14 },
  { name: "Kalimantan Selatan", kabKota: 13 },
  { name: "Kalimantan Timur", kabKota: 10 },
  { name: "Kalimantan Utara", kabKota: 5 },
  { name: "Sulawesi Utara", kabKota: 15 },
  { name: "Sulawesi Tengah", kabKota: 13 },
  { name: "Sulawesi Selatan", kabKota: 24 },
  { name: "Sulawesi Tenggara", kabKota: 17 },
  { name: "Gorontalo", kabKota: 6 },
  { name: "Sulawesi Barat", kabKota: 6 },
  { name: "Maluku", kabKota: 11 },
  { name: "Maluku Utara", kabKota: 10 },
  { name: "Papua Barat", kabKota: 6 },
  { name: "Papua Barat Daya", kabKota: 5 },
  { name: "Papua", kabKota: 9 },
  { name: "Papua Selatan", kabKota: 4 },
  { name: "Papua Tengah", kabKota: 8 },
  { name: "Papua Pegunungan", kabKota: 8 },
]

const PROVINSI_AKTIF = new Set([
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi",
  "Sumatera Selatan", "Bengkulu", "Lampung", "Kepulauan Bangka Belitung", "Kepulauan Riau",
  "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur",
  "Banten", "Bali", "Nusa Tenggara Barat",
  "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur",
  "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara",
  "Maluku", "Papua Barat",
])

const PROVINSI_PERLU_PERIKSA = new Set([
  "Nusa Tenggara Timur", "Gorontalo", "Maluku Utara", "Papua",
])

function getStatus(provinsi: string, kabIdx?: number): {
  status: "Aktif" | "Belum Dibentuk"
  pokjaId?: string
} {
  if (provinsi.includes(" - ")) {
    if (provinsi.startsWith("Aceh - ")) {
      const acehKabList = KAB_TO_INCLUDE["Aceh"] || []
      const formedCount = acehKabList.length
      const idx = kabIdx ?? 0
      return { status: idx < formedCount ? "Aktif" : "Belum Dibentuk" }
    }
    const statuses: Array<"Aktif" | "Belum Dibentuk"> = ["Aktif", "Aktif", "Belum Dibentuk", "Belum Dibentuk", "Belum Dibentuk"]
    const idx = Math.abs(provinsi.charCodeAt(provinsi.length - 1)) % 5
    return { status: statuses[idx] }
  }
  const match = MOCK_PENGAJUAN.find((p) => p.provinsi === provinsi)
  if (PROVINSI_AKTIF.has(provinsi)) return { status: "Aktif", pokjaId: match?.id }
  if (match) return { status: "Belum Dibentuk", pokjaId: match.id }
  if (PROVINSI_PERLU_PERIKSA.has(provinsi)) return { status: "Belum Dibentuk" }
  return { status: "Belum Dibentuk" }
}

const KAB_TO_INCLUDE: Record<string, string[]> = {
  "Aceh": ["Banda Aceh", "Aceh Besar", "Pidie", "Aceh Utara", "Aceh Timur", "Aceh Barat", "Aceh Tengah", "Pidie Jaya", "Bireuen", "Lhokseumawe"],
  "Sumatera Utara": ["Medan", "Deli Serdang", "Simalungun", "Toba Samosir", "Labuhanbatu", "Padang Sidempuan"],
  "DKI Jakarta": ["Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur", "Kepulauan Seribu"],
  "Jawa Barat": ["Bandung", "Bekasi", "Bogor", "Depok", "Cirebon", "Sukabumi", "Garut", "Karawang"],
  "Jawa Timur": ["Surabaya", "Malang", "Sidoarjo", "Gresik", "Mojokerto", "Kediri", "Jember", "Banyuwangi"],
  "Bali": ["Denpasar", "Badung", "Gianyar", "Klungkung", "Bangli", "Karangasem", "Jembrana", "Buleleng", "Tabanan"],
  "Sulawesi Selatan": ["Makassar", "Gowa", "Maros", "Parepare", "Mamuju", "Bantaeng", "Bone", "Luwu"],
  "Papua": ["Jayapura", "Mamberamo Tengah", "Keerom", "Sarmi", "Biak Numfor", "Supiori", "Yahukimo", "Puncak", "Tolikara"],
}

function seedScore(seed: number, min: number, max: number): number {
  const x = Math.sin(seed + 1) * 10000
  return min + Math.floor((x - Math.floor(x)) * (max - min + 1))
}

function seedDelta(seed: number): number {
  const x = Math.sin(seed + 13) * 10000
  const raw = Math.floor((x - Math.floor(x)) * 21) - 10 // -10 to +10
  return raw === 0 ? 1 : raw
}

function seedPhone(seed: number): string {
  const x = Math.abs(Math.sin(seed + 7) * 1e10)
  const digits = Math.floor(x) % 100000000
  return `0812${String(digits).padStart(8, "0")}`
}

function generateRows(): ProvinsiRow[] {
  const rows: ProvinsiRow[] = []
  let no = 0

  for (const p of ALL_PROVINSI) {
    const { status, pokjaId } = getStatus(p.name)
    const includedKab = KAB_TO_INCLUDE[p.name] || []
    const pokjaKabKota = status === "Aktif" ? includedKab.length : 0
    no++
    const skor = status === "Aktif" ? seedScore(no, 60, 100) : undefined
    const bidangTersedia = status === "Aktif" ? 3 + (no % 3) : undefined
    const skorDelta = skor != null ? seedDelta(no) : undefined
    const matchPokja = MOCK_PENGAJUAN.find((p2) => p2.id === pokjaId)
    const kontak = status === "Aktif"
      ? (matchPokja?.kanalPengaduan ?? seedPhone(no))
      : undefined
    rows.push({
      no: no,
      provinsi: p.name,
      statusPokja: status,
      jumlahKabKota: p.kabKota,
      pokjaKabKota,
      persentase: p.kabKota > 0 ? Math.round((pokjaKabKota / p.kabKota) * 100) : 0,
      pokjaId,
      skor,
      skorDelta,
      bidangTersedia,
      kontak,
    })

    if (KAB_TO_INCLUDE[p.name]) {
      for (let kabIdx = 0; kabIdx < KAB_TO_INCLUDE[p.name].length; kabIdx++) {
        const kabName = KAB_TO_INCLUDE[p.name][kabIdx]
        const fullName = `${p.name} - ${kabName}`
        const { status: kabStatus, pokjaId: kabPokjaId } = getStatus(fullName, kabIdx)
        const isAktif = kabStatus === "Aktif"
        const kabNo = ++no
        const kabSkor = isAktif ? seedScore(kabNo, 60, 100) : undefined
        const kabBidang = isAktif ? 3 + (kabNo % 3) : undefined
        const kabSkorDelta = isAktif ? seedDelta(kabNo) : undefined
        const kabKontak = isAktif ? seedPhone(kabNo) : undefined
        rows.push({
          no: kabNo,
          provinsi: fullName,
          statusPokja: kabStatus,
          jumlahKabKota: 1,
          pokjaKabKota: isAktif ? 1 : 0,
          persentase: isAktif ? 100 : 0,
          pokjaId: kabPokjaId,
          skor: kabSkor,
          skorDelta: kabSkorDelta,
          bidangTersedia: kabBidang,
          kontak: kabKontak,
        })
      }
    }
  }

  return rows
}

const PLACEHOLDER_ROWS: ProvinsiRow[] = [
  { no: 9001, provinsi: "Aceh - Sabang", statusPokja: "Belum Dibentuk", jumlahKabKota: 1, pokjaKabKota: 0, persentase: 0 },
  { no: 9002, provinsi: "Aceh - Subulussalam", statusPokja: "Belum Dibentuk", jumlahKabKota: 1, pokjaKabKota: 0, persentase: 0 },
  { no: 9003, provinsi: "Aceh - Simeulue", statusPokja: "Belum Dibentuk", jumlahKabKota: 1, pokjaKabKota: 0, persentase: 0 },
  { no: 9004, provinsi: "Aceh - Aceh Tenggara", statusPokja: "Belum Dibentuk", jumlahKabKota: 1, pokjaKabKota: 0, persentase: 0 },
  { no: 9005, provinsi: "Aceh - Gayo Lues", statusPokja: "Belum Dibentuk", jumlahKabKota: 1, pokjaKabKota: 0, persentase: 0 },
  { no: 9006, provinsi: "Aceh - Aceh Selatan", statusPokja: "Belum Dibentuk", jumlahKabKota: 1, pokjaKabKota: 0, persentase: 0 },
  { no: 9007, provinsi: "Aceh - Aceh Barat Daya", statusPokja: "Belum Dibentuk", jumlahKabKota: 1, pokjaKabKota: 0, persentase: 0 },
  { no: 9008, provinsi: "Aceh - Nagan Raya", statusPokja: "Belum Dibentuk", jumlahKabKota: 1, pokjaKabKota: 0, persentase: 0 },
  { no: 9009, provinsi: "Aceh - Aceh Singkil", statusPokja: "Belum Dibentuk", jumlahKabKota: 1, pokjaKabKota: 0, persentase: 0 },
  { no: 9010, provinsi: "Aceh - Bener Meriah", statusPokja: "Belum Dibentuk", jumlahKabKota: 1, pokjaKabKota: 0, persentase: 0 },
  { no: 9011, provinsi: "Aceh - Aceh Tamiang", statusPokja: "Belum Dibentuk", jumlahKabKota: 1, pokjaKabKota: 0, persentase: 0 },
  { no: 9012, provinsi: "Aceh - Langsa", statusPokja: "Belum Dibentuk", jumlahKabKota: 1, pokjaKabKota: 0, persentase: 0 },
  { no: 9013, provinsi: "Aceh - Aceh Jaya", statusPokja: "Belum Dibentuk", jumlahKabKota: 1, pokjaKabKota: 0, persentase: 0 },
]

export const PROVINSI_DATA: ProvinsiRow[] = [...generateRows(), ...PLACEHOLDER_ROWS]

export const TOTAL_PROVINSI = ALL_PROVINSI.length
export const TOTAL_KAB_KOTA = 514
export const KAB_KOTA_PER_PROVINSI: Record<string, number> =
  Object.fromEntries(ALL_PROVINSI.map(p => [p.name, p.kabKota]))
export const PROVINSI_TERBENTUK = PROVINSI_DATA.filter((p) => p.statusPokja === "Aktif").length
export const KAB_KOTA_TERBENTUK = PROVINSI_DATA.reduce((s, p) => s + p.pokjaKabKota, 0)
export const PERSENTASE_NASIONAL =
  TOTAL_PROVINSI > 0 ? Math.round((PROVINSI_TERBENTUK / TOTAL_PROVINSI) * 100) : 0
export const LAST_UPDATED = "2 Februari 2026, 16:50:00"
