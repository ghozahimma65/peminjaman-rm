# 01 — Gambaran Umum Sistem

## Nama Sistem

**Filing Rekam Medis** (nama produk: `Filing Rekam Medis`, identifier: `com.rekammedis.desktop`)

Nama ini diambil langsung dari `src-tauri/tauri.conf.json`:
```json
"productName": "Filing Rekam Medis"
```

---

## Deskripsi Singkat

Filing Rekam Medis adalah **aplikasi desktop** yang dibangun menggunakan framework **Tauri v2** (Rust + React). Sistem ini dirancang untuk mengelola proses **peminjaman dan pengembalian berkas fisik rekam medis** di lingkungan **Rumah Sakit Islam Sultan Agung (RSI Sultan Agung) Semarang**.

Sistem ini berfungsi sebagai alat bantu digital bagi petugas unit rekam medis dalam:

1. Mencatat dan mengelola **data pasien (Master Data RM)**
2. Memproses **peminjaman** berkas rekam medis ke unit/ruang pelayanan
3. Memproses **pengembalian** berkas dan mencatat tanggal kembali aktual
4. Memonitor status berkas (Dipinjam / Terlambat / Dikembalikan)
5. Menampilkan **riwayat** transaksi per nomor RM
6. Menghasilkan **laporan rekapitulasi** dalam format Excel dan PDF
7. Mengelola **notifikasi** pengingat pengembalian dan keterlambatan

---

## Ruang Lingkup Sistem

Sistem ini beroperasi **secara offline** — tidak membutuhkan koneksi internet untuk fungsi utama. Database disimpan secara lokal menggunakan **SQLite** melalui plugin Tauri (`@tauri-apps/plugin-sql`).

Sistem dibangun untuk dijalankan di platform **Windows** (terlihat dari output build: `.exe`, `.msi`, `nsis-setup.exe`), meskipun Tauri mendukung multi-platform secara prinsip.

---

## Institusi Pengguna

Berdasarkan source code (`exportService.ts` dan `Portal.tsx`):

- **Nama RS**: Rumah Sakit Islam Sultan Agung
- **Kota**: Semarang
- **Unit**: Unit Rekam Medis / Filing
- **Alamat** (dari export PDF): Jl. Kaligawe Raya No. 4 Semarang 50112

---

## Fitur Utama (Ringkasan)

| No | Fitur | Status |
|----|-------|--------|
| 1 | Portal / Halaman Sambutan | ✅ Ada |
| 2 | Login dengan NIP + Password | ✅ Ada |
| 3 | Register Akun Petugas Baru | ✅ Ada |
| 4 | Dashboard Ringkasan | ✅ Ada |
| 5 | Master Data RM (CRUD Pasien) | ✅ Ada |
| 6 | Peminjaman Baru | ✅ Ada |
| 7 | Daftar Peminjaman | ✅ Ada |
| 8 | Proses Pengembalian | ✅ Ada |
| 9 | Daftar Pengembalian | ✅ Ada |
| 10 | Riwayat RM | ✅ Ada |
| 11 | Laporan & Export Excel/PDF | ✅ Ada |
| 12 | Notifikasi (Reminder + Terlambat) | ✅ Ada |
| 13 | Profil & Ganti Password | ✅ Ada |
| 14 | Log Login (Super Admin) | ✅ Ada |

---

## Versi

- **Versi Aplikasi**: 0.1.0 (dari `package.json` dan `tauri.conf.json`)
- **Status**: Production build tersedia (`.exe` + `.msi` + `.nsis-setup.exe`)
