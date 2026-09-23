# 12 — Kebutuhan Non-Fungsional

---

## KNF-01: Keamanan

| Kode | Kebutuhan | Implementasi | Bukti |
|------|-----------|-------------|-------|
| KNF-01.1 | Password harus disimpan dalam bentuk hash | bcrypt cost factor 10 | `authService.ts` baris 102 |
| KNF-01.2 | Pesan error login harus generik (tidak membocorkan informasi) | Pesan: "Username atau password salah." untuk kedua kasus | `authService.ts` baris 25, 36 |
| KNF-01.3 | Session harus dihapus saat aplikasi ditutup | Intentionally clear session on startup | `AuthContext.tsx` komentar |
| KNF-01.4 | Aktivitas login harus diaudit | Tabel `login_logs` | `schema.ts`, `authService.ts` |
| KNF-01.5 | Akses fitur tertentu dibatasi berdasarkan role | Flag `adminOnly` di menu | `constants.ts` |

---

## KNF-02: Ketersediaan (Availability)

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KNF-02.1 | Sistem harus beroperasi tanpa koneksi internet | SQLite lokal, tidak ada API call eksternal |
| KNF-02.2 | Database harus tersedia sejak pertama kali aplikasi dibuka | `initializeDatabase()` dijalankan di `useEffect` App.tsx |
| KNF-02.3 | Sistem harus bertahan dari database yang lama (migrasi) | `ensureColumnExists()` di `index.ts` |

---

## KNF-03: Performa

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KNF-03.1 | Query database harus efisien (indexed) | Primary key dan FOREIGN KEY sebagai index implisit |
| KNF-03.2 | bcrypt tidak boleh memblokir UI | `await import("bcryptjs")` lazy load di `initializeDatabase()` |
| KNF-03.3 | Dashboard harus memuat data secara paralel | `Promise.allSettled([getAllPeminjaman(), getPengembalianHistory()])` |

---

## KNF-04: Integritas Data

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KNF-04.1 | Tidak boleh ada pengembalian duplikat | `UNIQUE NOT NULL` pada `pengembalian.peminjamanId` |
| KNF-04.2 | Foreign key constraint harus aktif | `PRAGMA foreign_keys = ON` di awal inisialisasi |
| KNF-04.3 | Penghapusan data cascading diatur dengan tepat | `ON DELETE SET NULL`, `ON DELETE RESTRICT`, `ON DELETE CASCADE` |
| KNF-04.4 | Pengembalian harus dilakukan rollback jika gagal | Try-catch + rollback manual di `processPengembalian()` |
| KNF-04.5 | Tanggal pengembalian tidak boleh lebih awal dari tanggal pinjam | Validasi temporal di `processPengembalian()` |

---

## KNF-05: Portabilitas

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KNF-05.1 | Aplikasi dapat diinstal di Windows | Build `.exe`, `.msi`, `nsis-setup.exe` |
| KNF-05.2 | Aplikasi berjalan sebagai executable mandiri | Tauri bundling — Rust backend + Web frontend |

---

## KNF-06: Usability

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KNF-06.1 | Antarmuka responsif dan modern | Tailwind CSS v4, layout sidebar, dark/light themed components |
| KNF-06.2 | Navigasi intuitif dengan sidebar menu | `Layout.tsx` dengan sidebar + submenu collapsible |
| KNF-06.3 | Pesan error yang informatif | Error handling di setiap service dengan pesan bahasa Indonesia |
| KNF-06.4 | Status berkas ditampilkan dengan badge berwarna | `StatusBadge` components di `Dashboard.tsx` dan page lain |

---

## KNF-07: Maintainability

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KNF-07.1 | Logika status terpusat (tidak tersebar di banyak tempat) | Semua status dihitung di `statusHelper.ts` |
| KNF-07.2 | Database layer terpisah dari UI layer | `src/lib/database/` sebagai layer terpisah dari `src/pages/` |
| KNF-07.3 | TypeScript untuk keamanan tipe | `tsconfig.json` dengan strict mode |
| KNF-07.4 | Kode dapat di-lint dan di-compile | `pnpm lint` dan `pnpm exec tsc --noEmit` tersedia |

---

## KNF-08: Kapasitas Data

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KNF-08.1 | Database dapat menampung data tidak terbatas | SQLite tidak memiliki batas baris (praktis) |
| KNF-08.2 | Halaman Riwayat RM menggunakan pagination | Pagination 10 data per halaman di `RiwayatRm.tsx` |
