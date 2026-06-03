# Konteks Proyek: BSAN Dashboard

## Stack
- Next.js 16 App Router, TypeScript, Tailwind CSS v4
- Storage: localStorage/sessionStorage (demo, belum database)
- Roles: `admin_dinas` (per provinsi), `admin_pusat`, `sekolah`

---

## Fitur: Mekanisme Perbaikan POKJA

### Alur Lengkap
1. Admin pusat menolak pokja → status `butuh-perbaikan`, log `tolak` + alasan tersimpan
2. Admin dinas melihat status `butuh-perbaikan` di **beranda** (card) DAN **detail pokja**
3. Banner merah menampilkan alasan penolakan + tombol "Perbaiki Data POKJA"
4. Klik → `handlePerbaikiPokja()` menyimpan `perbaikanPokjaData` ke sessionStorage (termasuk `prevStatus`) → navigate ke `/buat-pokja`
5. Form pre-fill semua field, judul berubah "Perbaikan Data POKJA", badge "Mode Perbaikan"
6. Step 4 (review) tampilkan textarea "Catatan Pengubahan" → disimpan sebagai `deskripsiPerbaikan` di payload
7. Submit → `perbaikanSubmitData` di sessionStorage → redirect `/?pokjaPerbaikan=1`
8. `page.tsx` handler: update status `masih-diverifikasi`, log aksi `"edit"` (jika prevStatus=aktif) atau `"perbaiki"` (jika prevStatus=butuh-perbaikan), alasan = input user atau default

### Aksi Log POKJA
- `pengajuan` (biru) — Admin Dinas
- `terima` (hijau) — Admin Pusat
- `tolak` (merah) — Admin Pusat
- `perbaiki` (amber) — Admin Dinas (setelah ditolak)
- `edit` (indigo) — Admin Dinas (edit pokja yang sudah aktif/menunggu)
- `aktivasi`, `sk_expired`, `sistem`

---

## Fitur: Sumber Dukungan (sebelumnya "Sumber Rujukan")

### Wording
Semua teks "Sumber Rujukan" sudah diganti → "Sumber Dukungan" di seluruh codebase.

### Kontak Multi-Entry
- Setiap entry kontak: satu field nomor + select dropdown tipe (`call_center` | `nomor_pribadi`)
- Bisa tambah lebih dari satu kontak via tombol "Tambah Kontak"
- Data disimpan di field `kontak: KontakEntry[]` di `FormState` (RujukanForm.tsx)
- Backward-compat: `nomorCallCenter` = first call_center entry, `nomorPribadi` = joined nomor_pribadi

### Kategori Penyedia
`"Pemerintah Pusat" | "Pemerintah Daerah" | "Swasta" | "OMS" | "Lainnya"`

---

## Fitur: Visibilitas Sumber Dukungan Lintas Wilayah

### Keputusan Desain (Disetujui)

**Prinsip utama:** Semua sumber dukungan dari seluruh Indonesia bisa dilihat semua pokja,
tapi tiap pokja bisa dengan cepat melihat yang relevan dengan wilayahnya.

#### Scope Toggle
- Default scope: **"Wilayah Saya"** (paling relevan sehari-hari)
- Toggle pill "Wilayah Saya" vs "Semua Wilayah" di atas filter bar
- Cards ringkasan di atas **responsif terhadap scope** — angka berubah sesuai scope aktif

#### Filter
- **Scope** (Wilayah Saya / Semua Wilayah) — primer, tampil sebagai toggle
- **Provinsi** — hanya tampil saat scope "Semua Wilayah"
- **Kategori penyedia**, **Bentuk dukungan**, **Status** — selalu tampil

#### Tabel
- Kolom **Wilayah** (Kab./Kota sebagai chip + provinsi di sub-teks) hanya tampil saat scope "Semua Wilayah"
- Saat scope "Wilayah Saya" kolom wilayah redundan → disembunyikan
- Badge "Wilayah Saya" (chip hijau kecil) di kolom nama saat scope nasional untuk highlight entri lokal

#### Sort
- Sort berdasarkan **kedekatan administratif**: wilayah sendiri → provinsi sama → nasional
- Tersedia juga sort: Terbaru, Nama A-Z

#### Implikasi Teknis
- `SumberRujukan` sudah punya `provinsi` + `kabupatenKota` — sudah siap
- `SumberRujukanView` perlu menerima prop `wilayahDinas: { provinsi: string; kabupatenKota: string }` dari parent
- Di `page.tsx` / komponen yang render `SumberRujukanView`, pass auth session wilayah dinas
- Saat admin dinas tambah sumber dukungan → wilayah otomatis dari session auth

---

## Arsitektur Data

### PokjaItem (localStorage `pokjaList`)
- `status`: `belum-dibentuk` | `masih-diverifikasi` | `aktif` | `butuh-perbaikan`
- `validasiLog`: `{ tanggal, aksi, aktor, alasan? }[]`
- `data`: `PokjaData` — termasuk `region`, `nomorKanal`, `members`, `sk`

### SumberRujukan (sessionStorage `rujukanList` + SEED di SumberRujukanView.tsx)
- `kontak?: KontakEntry[]` — array multi-kontak baru
- `provinsi`, `kabupatenKota` — untuk filter wilayah
- `usulanDari`: `"dinas" | "sekolah" | "pusat"`
- `status`: `"terverifikasi" | "menunggu" | "menunggu_review" | "dihapus"`

---

## File-File Kunci
| File | Fungsi |
|------|--------|
| `app/page.tsx` | Root page, state pokjaList, router semua role |
| `app/buat-pokja/page.tsx` | Form wizard 4-step buat/edit/perbaiki pokja |
| `components/dashboard/DataPokjaView.tsx` | View detail + list pokja (dinas & pusat) |
| `components/pusat/ValidatePokjaDrawer.tsx` | Drawer validasi pokja (terima/tolak) admin pusat |
| `components/dashboard/SumberRujukanView.tsx` | View + tabel sumber dukungan (dinas) |
| `components/forms/RujukanForm.tsx` | Form tambah/edit sumber dukungan |
| `components/views/DinasHome.tsx` | Beranda admin dinas |
| `lib/auth-session.ts` | Session helper, getDinasNamaForLogs() |
| `lib/rujukan-logs.ts` | Log helpers untuk sumber dukungan |
