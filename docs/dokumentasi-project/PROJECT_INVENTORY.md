# Inventaris Berkas Proyek (Project Inventory)

---

## 1. Konfigurasi Proyek & Toolchain

| Jalur Berkas | Deskripsi / Peran |
|---|---|
| `package.json` | Konfigurasi dependensi Node.js (React 19, TypeScript 5.8, Tailwind CSS 4, Vite 7, ExcelJS, jsPDF, Tauri plugins) |
| `tsconfig.json` & `tsconfig.app.json` | Konfigurasi kompilator TypeScript (Strict mode, JSX React-JSX) |
| `vite.config.ts` | Konfigurasi bundler Vite untuk antarmuka desktop |
| `eslint.config.js` | Konfigurasi aturan linting ESLint |
| `src-tauri/tauri.conf.json` | Konfigurasi inti Tauri v2 (nama produk "Filing Rekam Medis", identifier, bundle windows .msi/.exe, security permissions) |
| `src-tauri/Cargo.toml` | Konfigurasi dependensi bahasa Rust |
| `src-tauri/src/main.rs` & `lib.rs` | Titik masuk program backend Rust native |

---

## 2. Lapisan Logika & Layanan Basis Data (`src/lib/`)

| Jalur Berkas | Deskripsi / Peran |
|---|---|
| `src/lib/database/index.ts` | Koneksi database SQLite singleton, pemanggilan migrasi skema, injeksi akun default Super Admin dan data seed 20 RM |
| `src/lib/database/schema.ts` | Skema DDL pembentukan 6 tabel utama dan penegakan `PRAGMA foreign_keys = ON;` |
| `src/lib/database/peminjamanService.ts` | Logika transaksi peminjaman berkas, validasi ketersediaan berkas aktif (`checkActivePeminjaman`) |
| `src/lib/database/pengembalianService.ts` | Logika pengembalian berkas fisik, validasi waktu, pencatatan kondisi (BAIK/RUSAK), dan penanganan rollback |
| `src/lib/database/riwayatRmService.ts` | Kueri gabungan multi-tabel riwayat sirkulasi berkas, pencarian dinamis, pagination |
| `src/lib/database/dataRmService.ts` | Pengelolaan master data berkas RM, validasi format NIK 16 digit, agregasi ketersediaan berkas di filing |
| `src/lib/database/notificationService.ts` | Sinkronisasi pasif notifikasi batas waktu 48 jam, peringatan dini 24 jam, pembersihan notifikasi otomatis |
| `src/lib/database/laporanService.ts` | Kueri penyaringan data laporan sirkulasi dan kalkulasi 3 tabel rekapitulasi analitik |
| `src/lib/database/smokeTest.ts` | Modul pengujian mandiri internal (uji koneksi, CRUD, FK enforcement, idempotensi, dan login) |
| `src/lib/auth/authService.ts` | Otentikasi login, hashing kata sandi bcrypt (cost factor 10), pencatatan jejak log login |
| `src/lib/auth/avatarService.ts` | Pengunggahan file foto profil ke direktori lokal Tauri AppData dan rendering Blob URL |
| `src/lib/statusHelper.ts` | Helper terpusat kalkulasi batas waktu pengembalian (deadline 48 jam) dan status efektif dinamis |
| `src/lib/exportService.ts` | Pembuatan dan ekspor dokumen resmi Microsoft Excel (.xlsx via ExcelJS) dan PDF (.pdf via jsPDF) |

---

## 3. Komponen Antarmuka Pengguna & Navigasi (`src/`)

| Jalur Berkas | Deskripsi / Peran |
|---|---|
| `src/App.tsx` | Komponen akar aplikasi, pemuatan database, pemicu sinkronisasi notifikasi, perutean halaman |
| `src/main.tsx` | Titik masuk rendering React DOM |
| `src/index.css` | Gaya global CSS Tailwind v4 |
| `src/constants.ts` | Definisi menu navigasi, hak akses admin, dan daftar konstan 22 unit ruangan (`RUANGAN_OPTIONS`) |
| `src/context/AuthContext.tsx` | State manajemen sesi pengguna React Context terpadu dengan kebijakan pembersihan sesi saat boot |

### Halaman-Halaman (`src/pages/`)
- `src/pages/Portal.tsx`: Halaman awal pemilihan opsi masuk/registrasi
- `src/pages/Login.tsx`: Formulir login berbasis NIP dan kata sandi
- `src/pages/Register.tsx`: Formulir pendaftaran akun petugas baru
- `src/pages/Dashboard.tsx`: Beranda utama menyajikan ringkasan metrik statistik dan aksi cepat
- `src/pages/AjukanPeminjaman.tsx`: Formulir transaksi peminjaman berkas rekam medis
- `src/pages/DaftarPeminjaman.tsx`: Tabel daftar peminjaman berkas dengan filter status
- `src/pages/ProsesPengembalian.tsx`: Formulir pencarian dan konfirmasi pengembalian berkas fisik
- `src/pages/DaftarPengembalian.tsx`: Tabel riwayat pengembalian berkas
- `src/pages/RiwayatRm.tsx`: Penelusuran riwayat lengkap sirkulasi berkas per nomor RM dengan pagination 10 baris
- `src/pages/MasterDataRm.tsx`: Manajemen master berkas rekam medis dan pendaftaran pasien baru
- `src/pages/Laporan.tsx`: Filter laporan analitik dan pemicu ekspor dokumen Excel/PDF
- `src/pages/Profil.tsx`: Pengaturan identitas petugas, ganti kata sandi, dan foto avatar
- `src/pages/LogLogin.tsx`: Halaman audit riwayat log percobaan login khusus Super Admin
- `src/pages/PlaceholderPage.tsx`: Halaman transisi/pengaturan placeholder

---

## 4. Paket Dokumentasi Proyek (`docs/dokumentasi-project/`)

- **`01_LAPORAN/`**: 26 berkas laporan lengkap (Gambaran Umum s/d Kesimpulan).
- **`02_DFD/`**: 7 berkas DFD (README, Context Diagram Level 0, Level 1, dan Level 2 Login, Peminjaman, Pengembalian, Laporan).
- **`03_ERD/`**: 4 berkas ERD (README, Diagram Konseptual ERD, Struktur Fisik Tabel / Kamus Data, dan Integritas Relasional / FK).
- **`04_KODE_PENTING/`**: 13 berkas telaah kode kritis (Authentication, Database, Session, Peminjaman, Deadline, Pengembalian, Status, Notifikasi, Riwayat, Data RM, Laporan, Export).
- **`05_BAHAN_PRESENTASI/`**: 14 berkas bahan presentasi (Cheat Sheet, Wajib Hafal, Alur Presentasi, dan 11 berkas tanya jawab penguji).
- **Berkas Root**: `TRACEABILITY.md`, `PROJECT_INVENTORY.md`, `NEED_CONFIRMATION.md`.
