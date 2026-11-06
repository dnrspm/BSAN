import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Status = "sudah" | "belum" | "tidak-memadai"

interface BarisAspek {
  indikator: string
  /** Teks skor apa adanya, mis. "1 / 1", "72%", atau "-" bila datanya tidak memadai. */
  skor: string
  status?: Status
}

interface Aspek {
  nama: string
  baris: BarisAspek[]
}

// Data contoh: aspek tambahan di luar 4 indikator utama, tidak ikut dihitung dalam skor akhir.
const ASPEK_TAMBAHAN: Aspek[] = [
  {
    nama: "PPKPSP",
    baris: [
      { indikator: "Implementasi G7KAIH", skor: "1 / 1", status: "sudah" },
      { indikator: "Implementasi PPC", skor: "0 / 1", status: "belum" },
      { indikator: "Implementasi GKE", skor: "-", status: "tidak-memadai" },
      { indikator: "Implementasi Upacara", skor: "0 / 1", status: "belum" },
      { indikator: "Implementasi GAWAI", skor: "0 / 1", status: "belum" },
    ],
  },
  { nama: "CKG", baris: [{ indikator: "Persentase murid ikut CKG", skor: "72%" }] },
]

const STATUS: Record<Status, { label: string; chip: string }> = {
  sudah: { label: "Sudah Implementasi", chip: "bg-emerald-300 text-emerald-950" },
  belum: { label: "Belum Implementasi", chip: "bg-rose-100 text-rose-950" },
  "tidak-memadai": { label: "Data Tidak Memadai", chip: "bg-gray-100 text-gray-700" },
}

const TH = "h-auto bg-[#F1F1F1] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600"

/** Tabel aspek tambahan Indeks BSAN: aspek, indikator, skor, dan kategori implementasi. */
export function AspekTambahan() {
  return (
    <section className="space-y-4 pt-2">
      <div className="pb-2">
        <h2 className="text-lg font-semibold text-gray-900">Aspek Tambahan</h2>
        <p className="mt-1.5 text-sm text-gray-500">Aspek di luar 4 indikator utama. Aspek ini tidak memengaruhi skor akhir Indeks BSAN.</p>
      </div>
      <div className="overflow-hidden rounded-[4px] border border-[#D9DBDD] bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[#F1F1F1]">
              <TableHead className={cn(TH, "border-r border-[#D9DBDD]")}>Aspek</TableHead>
              <TableHead className={cn(TH, "border-r border-[#D9DBDD]")}>Indikator</TableHead>
              <TableHead className={cn(TH, "border-r border-[#D9DBDD] text-center")}>Skor</TableHead>
              <TableHead className={TH}>Kategori</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ASPEK_TAMBAHAN.map((aspek) =>
              aspek.baris.map((b, n) => (
                <TableRow key={`${aspek.nama}-${b.indikator}`} className="hover:bg-transparent">
                  {n === 0 && (
                    <TableCell rowSpan={aspek.baris.length} className="w-40 border-r border-[#D9DBDD] bg-white px-4 py-3 align-top font-semibold text-gray-900">
                      {aspek.nama}
                    </TableCell>
                  )}
                  <TableCell className="border-r border-[#D9DBDD] px-4 py-3 whitespace-normal text-gray-700">{b.indikator}</TableCell>
                  <TableCell className="border-r border-[#D9DBDD] px-4 py-3 text-center font-semibold tabular-nums text-gray-900">{b.skor}</TableCell>
                  <TableCell className="px-4 py-3">
                    {b.status ? (
                      <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-semibold", STATUS[b.status].chip)}>
                        {STATUS[b.status].label}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
