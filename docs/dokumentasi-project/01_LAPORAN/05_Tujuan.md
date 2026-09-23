# 05 — Tujuan Sistem

---

## Tujuan Umum

Membangun aplikasi desktop untuk mengelola proses peminjaman dan pengembalian berkas rekam
medis di Rumah Sakit Islam Sultan Agung Semarang secara digital, terstruktur, dan dapat
diandalkan tanpa koneksi internet.

---

## Tujuan Khusus

### 1. Digitalisasi Pencatatan Berkas

Mencatat setiap transaksi peminjaman dan pengembalian berkas rekam medis secara digital,
termasuk:
- Nomor RM pasien
- Nama peminjam (dari tabel `users`)
- Unit/ruang tujuan (dari 22 pilihan ruangan di `constants.ts`)
- Tanggal dan waktu pinjam
- Jilid berkas dan catatan tambahan

**Implementasi**: `createPeminjaman()` di `peminjamanService.ts`

---

### 2. Monitoring Status Berkas Otomatis

Menentukan status berkas secara otomatis berdasarkan aturan bisnis 48 jam tanpa input manual.

**Implementasi**: `calculateEffectiveStatus()` di `statusHelper.ts`
- `DIPINJAM`: belum melewati 48 jam
- `TERLAMBAT`: sudah melewati 48 jam, belum dikembalikan
- `DIKEMBALIKAN`: berkas sudah dikembalikan (tepat waktu atau terlambat)

---

### 3. Notifikasi Otomatis

Memberikan notifikasi kepada petugas tanpa perlu pengecekan manual:
- **REMINDER**: ≤24 jam sebelum batas waktu
- **TERLAMBAT**: sudah melewati batas 48 jam

**Implementasi**: `syncNotifications()` di `notificationService.ts`

---

### 4. Riwayat Transaksi per Pasien

Menyediakan penelusuran riwayat lengkap transaksi peminjaman dan pengembalian per nomor RM.

**Implementasi**: `getRiwayatByRm()` dan `getAllRiwayat()` di `riwayatRmService.ts`

---

### 5. Laporan Rekapitulasi

Menghasilkan laporan rekapitulasi yang dapat diekspor ke Excel (`.xlsx`) dan PDF (`.pdf`),
lengkap dengan:
- Header institusi RSI Sultan Agung
- Tabel rekapitulasi per ruang/unit
- Ringkasan status berkas
- Tanda tangan petugas dan kepala unit

**Implementasi**: `exportToExcel()` dan `exportToPdf()` di `exportService.ts`

---

### 6. Keamanan Akses

Memastikan hanya petugas yang terdaftar yang dapat mengakses sistem, dengan:
- Login menggunakan NIP dan password
- Password di-hash dengan bcrypt (cost factor 10)
- Dua level akses: Super Admin dan Petugas
- Log seluruh aktivitas login (sukses dan gagal)

**Implementasi**: `authService.ts`, `AuthContext.tsx`

---

### 7. Operasi Offline

Beroperasi sepenuhnya tanpa koneksi internet, dengan data tersimpan lokal di file
SQLite (`rekam_medis.db`).

**Implementasi**: `@tauri-apps/plugin-sql` dengan path `sqlite:rekam_medis.db`
