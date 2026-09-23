# 07 — Batasan Sistem

Berikut adalah batasan sistem yang dapat dibuktikan dari source code.

---

## Batasan Fungsional

### 1. Satu Berkas Aktif per Nomor RM

Sistem hanya mengizinkan **satu transaksi peminjaman aktif** per nomor RM dalam satu waktu.
Jika berkas belum dikembalikan, peminjaman baru akan ditolak.

```typescript
// peminjamanService.ts
const active = await checkActivePeminjaman(data.nomorRm);
if (active) {
  throw new Error(`Rekam medis ${data.nomorRm} masih berstatus aktif dipinjam.`);
}
```

### 2. Batas Pengembalian Tetap 48 Jam

Batas pengembalian selalu dihitung sebagai **tanggalBerkasKeluar + 48 jam** (atau
tanggalPinjam + 48 jam jika `tanggalBerkasKeluar` tidak diset). Nilai ini bersifat
tetap (hardcoded) di `statusHelper.ts`:
```typescript
export const RETURN_PERIOD_MS = 2 * 24 * 60 * 60 * 1000;
```
Tidak ada konfigurasi untuk mengubah periode ini melalui UI.

### 3. Pilihan Ruangan Terbatas

Ruangan/unit tujuan peminjaman terbatas pada 22 pilihan yang sudah didefinisikan di
`constants.ts`. Tidak ada fitur menambah ruangan baru melalui UI.

### 4. Dua Role Saja

Sistem hanya mengenal dua role:
- `Super Admin`: NIP `superadmin`, akses penuh termasuk Log Login
- `PETUGAS`: semua pengguna yang didaftarkan melalui register

Tidak ada role menengah (misalnya supervisor/kepala unit).

### 5. Tidak Ada Multi-Jilid dalam Satu Transaksi

Setiap transaksi peminjaman mencatat satu berkas (dengan field `jilid` untuk menandai
jilid berapa). Tidak ada mekanisme meminjam beberapa jilid sekaligus dalam satu transaksi.

---

## Batasan Teknis

### 6. Hanya untuk Windows (Praktis)

Meskipun Tauri mendukung multi-platform, build yang dihasilkan adalah `.exe`, `.msi`,
dan `nsis-setup.exe` — format khusus Windows. `[PERLU KONFIRMASI]` apakah build
untuk macOS/Linux direncanakan.

### 7. Database Lokal, Tidak Ada Sinkronisasi

Database SQLite tersimpan di lokal komputer. Tidak ada fitur sinkronisasi antar komputer
atau backup otomatis ke server.

### 8. Tidak Ada Pencarian Berkas Fisik

Sistem mencatat transaksi digital tetapi tidak memiliki fitur lokasi fisik berkas
(misalnya nomor rak, nomor laci).

### 9. Session Tidak Dipulihkan Setelah App Ditutup

```typescript
// AuthContext.tsx
// INTENTIONALLY do NOT restore session on startup.
// Every app launch must begin at the Portal page.
const had = await s.get<SessionUser>("user_session");
if (had) {
  await s.delete("user_session");
  await s.save();
}
```
Setiap kali aplikasi dibuka, pengguna harus login ulang.

### 10. Log Login Hanya Dapat Dilihat oleh Super Admin

Menu "Log Login" memiliki flag `adminOnly: true` di `constants.ts`. Petugas biasa tidak
dapat melihat log aktivitas login.

### 11. Tidak Ada Pencetakan Langsung dari Aplikasi

Fitur laporan hanya menghasilkan file Excel/PDF yang disimpan ke lokasi yang dipilih
pengguna. Tidak ada fitur cetak langsung ke printer dari dalam aplikasi.

---

## Batasan Data

### 12. NIK Wajib 16 Digit

Jika NIK diisi, harus tepat 16 digit angka. Tidak ada NIK 15 digit atau format lain yang
diterima.

### 13. Data Seed Development

Sistem memiliki 20 data RM dummy untuk pengembangan (RM-DEV-0001 s/d RM-DEV-0020) yang
otomatis dimasukkan saat inisialisasi database. Data ini **tidak dapat dihapus** melalui UI
tanpa mengakses database langsung.
