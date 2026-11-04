/**
 * Peran tingkat pusat. Ketiganya berlingkup seluruh daerah dan memakai
 * dasbor pusat yang sama (sesi `role: "pusat"`); yang membedakan adalah
 * hak akses per modul, sesuai matriks di bawah.
 *
 * - adminPusat      : Puspeka, Kemendikdasmen.
 * - adminKementerian: setingkat Puspeka tetapi dari kementerian lain
 *                     (internal kementerian), seluruh daerah.
 * - pimpinan        : pimpinan tingkat nasional, hanya memantau.
 */

import { readAuthSession } from "@/lib/auth-session"

export type PeranPusat = "adminPusat" | "adminKementerian" | "pimpinan"

export type ModulPusat =
  | "pendaftaranPokja"
  | "sumberDukungan"
  | "inputKasus"
  | "aksesPengguna"
  | "formEvaluasi"
  | "indeksBsan"

/** "edit" mencakup melihat; "none" berarti menu disembunyikan. */
export type HakModul = "edit" | "view" | "none"

export const PERAN_PUSAT_LIST: PeranPusat[] = ["adminPusat", "adminKementerian", "pimpinan"]

export const PERAN_PUSAT_LABEL: Record<PeranPusat, string> = {
  adminPusat: "Admin Pusat",
  adminKementerian: "Admin Kementerian",
  pimpinan: "Pimpinan Nasional",
}

/** Keterangan instansi di bawah nama peran (sidebar). */
export const PERAN_PUSAT_SUBJUDUL: Record<PeranPusat, string> = {
  adminPusat: "Puspeka",
  adminKementerian: "Lintas Kementerian",
  pimpinan: "Pemantauan Nasional",
}

/**
 * Warna sidebar per peran agar tiap peran langsung dikenali. Admin Pusat tetap
 * slate; berbeda dari dinas (biru) dan BPMP (marun).
 */
export const WARNA_SIDEBAR_PUSAT: Record<PeranPusat, { bg: string; border: string }> = {
  adminPusat: { bg: "bg-slate-900", border: "border-slate-700" },
  adminKementerian: { bg: "bg-teal-900", border: "border-teal-700" },
  pimpinan: { bg: "bg-indigo-950", border: "border-indigo-800" },
}

export const HAK_PERAN_PUSAT: Record<PeranPusat, Record<ModulPusat, HakModul>> = {
  adminPusat: {
    pendaftaranPokja: "view",
    sumberDukungan: "edit",
    inputKasus: "edit",
    aksesPengguna: "edit",
    formEvaluasi: "edit",
    indeksBsan: "view",
  },
  pimpinan: {
    pendaftaranPokja: "view",
    sumberDukungan: "view",
    inputKasus: "view",
    aksesPengguna: "none",
    formEvaluasi: "view",
    indeksBsan: "view",
  },
  adminKementerian: {
    pendaftaranPokja: "view",
    sumberDukungan: "view",
    inputKasus: "edit",
    aksesPengguna: "none",
    formEvaluasi: "view",
    indeksBsan: "view",
  },
}

/** Peran pusat sesi saat ini; sesi pusat lama tanpa penanda dianggap Admin Pusat. */
export function getPeranPusat(): PeranPusat {
  const s = readAuthSession()
  return s?.peranPusat ?? "adminPusat"
}

export function hakModul(modul: ModulPusat, peran: PeranPusat = getPeranPusat()): HakModul {
  return HAK_PERAN_PUSAT[peran][modul]
}

/**
 * Apakah sesi saat ini boleh mengubah data modul tersebut. Hanya berlaku bagi
 * peran pusat — peran lain (dinas, BPMP, sekolah) tidak diatur matriks ini
 * sehingga selalu true.
 */
export function bolehUbahModul(modul: ModulPusat): boolean {
  const s = readAuthSession()
  if (s?.role !== "pusat") return true
  return hakModul(modul, s.peranPusat ?? "adminPusat") === "edit"
}

/**
 * Validasi pengajuan Kelompok Kerja (terima/tolak) tetap hanya dilakukan Admin
 * Pusat; Admin Kementerian dan Pimpinan Nasional hanya melihat pendaftaran.
 */
export function bolehValidasiPokja(): boolean {
  const s = readAuthSession()
  if (s?.role !== "pusat") return true
  return (s.peranPusat ?? "adminPusat") === "adminPusat"
}
