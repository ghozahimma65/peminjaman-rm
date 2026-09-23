# 03 — Identifikasi Masalah

Berikut adalah masalah-masalah yang diidentifikasi berdasarkan fitur yang diimplementasikan
dalam source code sistem.

---

## Masalah 1 — Tidak Ada Pencatatan Digital Peminjaman Berkas

**Bukti dari kode**: Adanya `peminjamanService.ts` dengan fungsi `createPeminjaman()` dan
`checkActivePeminjaman()` menunjukkan bahwa sebelumnya tidak ada sistem pencatatan yang
mencegah berkas yang sedang dipinjam untuk dipinjam ulang.

Sistem menangani ini dengan:
```typescript
// Dari peminjamanService.ts
const active = await checkActivePeminjaman(data.nomorRm);
if (active) {
  throw new Error(`Rekam medis ${data.nomorRm} masih berstatus aktif dipinjam.`);
}
```

---

## Masalah 2 — Tidak Ada Batas Waktu dan Monitoring Keterlambatan

**Bukti dari kode**: `statusHelper.ts` mendefinisikan:
```typescript
export const RETURN_PERIOD_MS = 2 * 24 * 60 * 60 * 1000; // 48 jam
```

Fungsi `calculateEffectiveStatus()` secara otomatis menentukan apakah berkas sudah
melewati batas 48 jam atau belum.

---

## Masalah 3 — Tidak Ada Notifikasi Pengingat

**Bukti dari kode**: `notificationService.ts` mengimplementasikan dua jenis notifikasi:
- **REMINDER**: dikirim saat berkas mendekati batas waktu (≤24 jam sebelum deadline)
- **TERLAMBAT**: dikirim saat berkas sudah melewati batas 48 jam

---

## Masalah 4 — Tidak Ada Riwayat Transaksi per Pasien

**Bukti dari kode**: `riwayatRmService.ts` menyediakan fungsi `getRiwayatByRm()` dan
`getAllRiwayat()` yang memungkinkan penelusuran seluruh riwayat berdasarkan nomor RM atau
pencarian global.

---

## Masalah 5 — Pembuatan Laporan Manual yang Memakan Waktu

**Bukti dari kode**: `exportService.ts` (657 baris) mengimplementasikan ekspor laporan ke
format Excel (`.xlsx`) dan PDF, lengkap dengan header institusi, tabel rekapitulasi
per ruang, dan tanda tangan digital.

---

## Masalah 6 — Keamanan Akses Sistem

**Bukti dari kode**: Sistem mengimplementasikan:
- Autentikasi berbasis NIP + password dengan bcrypt hash (cost factor 10)
- Dua role: `Super Admin` dan `PETUGAS`
- Log aktivitas login (sukses dan gagal) di tabel `login_logs`
- Pesan error generik untuk keamanan: `"Username atau password salah."` (tidak membedakan username/password salah)

---

## Masalah 7 — Data Pasien Tidak Terstandarisasi

**Bukti dari kode**: `dataRmService.ts` mengimplementasikan validasi NIK 16 digit:
```typescript
export function validateNik(nik: string): void {
  const trimmed = nik.trim();
  if (!/^\d{16}$/.test(trimmed)) {
    throw new Error("NIK wajib terdiri dari tepat 16 digit angka...");
  }
}
```

---

## Ringkasan Masalah

| No | Masalah | Solusi Sistem |
|----|---------|---------------|
| 1 | Pencatatan manual berkas yang dipinjam | Form peminjaman + database |
| 2 | Tidak ada monitoring keterlambatan | Status otomatis + deadline 48 jam |
| 3 | Tidak ada notifikasi | REMINDER & TERLAMBAT otomatis |
| 4 | Tidak ada riwayat digital per RM | Halaman Riwayat RM |
| 5 | Laporan manual | Ekspor Excel + PDF |
| 6 | Keamanan akses tidak terjamin | Login NIP + bcrypt + role |
| 7 | Data pasien tidak terstandar | Validasi NIK 16 digit |
