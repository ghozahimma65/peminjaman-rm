# 02 — Latar Belakang

> **Catatan**: Bagian latar belakang akademik tidak sepenuhnya dapat ditentukan dari source code.
> Informasi di bawah ini disusun berdasarkan konteks sistem dan kode yang ada.
> Bagian yang bersifat asumsi atau perlu dikonfirmasi diberi tanda **[PERLU KONFIRMASI]**.

---

## Konteks Institusi

Rumah Sakit Islam Sultan Agung (RSI Sultan Agung) Semarang adalah institusi pelayanan kesehatan yang
beroperasi di Jl. Kaligawe Raya No. 4 Semarang 50112 (ditemukan di `exportService.ts`).

Unit Rekam Medis (Filing) bertanggung jawab atas pengelolaan berkas rekam medis pasien secara fisik.

---

## Masalah yang Melatarbelakangi [PERLU KONFIRMASI]

Berdasarkan fitur-fitur yang diimplementasikan dalam sistem, dapat disimpulkan bahwa terdapat
kebutuhan nyata di unit rekam medis yang mendorong pengembangan sistem ini:

### 1. Pengelolaan Berkas Fisik yang Tidak Terstruktur

Berkas rekam medis dipinjam oleh berbagai unit/ruang pelayanan (daftar ruangan: ADN, B Fetal,
Bizzah 1, Bizzah 2, dll. — terdapat 22 pilihan ruangan dalam `constants.ts`). Tanpa sistem
pencatatan yang memadai, sulit untuk melacak:
- Berkas mana yang sedang dipinjam
- Siapa yang meminjam
- Kapan batas waktu pengembalian

### 2. Keterlambatan Pengembalian Berkas

Sistem mengimplementasikan aturan batas pengembalian **2 × 24 jam (48 jam)** dari `statusHelper.ts`:
```typescript
export const RETURN_PERIOD_MS = 2 * 24 * 60 * 60 * 1000; // 48 Jam
```

Aturan ini menunjukkan bahwa keterlambatan pengembalian berkas merupakan masalah nyata yang
perlu dimonitor secara aktif.

### 3. Tidak Ada Sistem Notifikasi Otomatis [PERLU KONFIRMASI]

Sistem dilengkapi fitur notifikasi otomatis (REMINDER saat ≤24 jam sebelum deadline, TERLAMBAT
saat sudah melewati batas), yang mengindikasikan bahwa sebelumnya tidak ada mekanisme pengingat
pengembalian yang efektif.

### 4. Sulitnya Pembuatan Laporan Manual [PERLU KONFIRMASI]

Sistem menyediakan fitur ekspor laporan rekapitulasi ke Excel dan PDF. Hal ini
mengindikasikan bahwa sebelumnya laporan dibuat secara manual, yang memerlukan waktu dan
rentan kesalahan.

### 5. Tidak Ada Riwayat Digital per Pasien

Fitur "Riwayat RM" memungkinkan penelusuran seluruh transaksi peminjaman dan pengembalian
berdasarkan nomor RM. Ini menunjukkan kebutuhan akan rekam jejak digital yang tidak
tersedia pada sistem manual sebelumnya.

---

## Solusi yang Ditawarkan

Sistem Filing Rekam Medis menawarkan solusi berupa **aplikasi desktop offline** yang:

1. Mencatat setiap transaksi peminjaman dengan data lengkap (siapa, kapan, ke mana)
2. Mencatat pengembalian dengan **timestamp aktual** saat proses dilakukan
3. Menghitung status otomatis (DIPINJAM / TERLAMBAT / DIKEMBALIKAN)
4. Mengirimkan notifikasi otomatis kepada petugas
5. Menghasilkan laporan rekapitulasi yang siap cetak/kirim
6. Menyimpan semua data secara lokal (tidak bergantung server/internet)

---

## Alasan Aplikasi Desktop

Berdasarkan pilihan teknologi (Tauri + SQLite lokal), sistem ini sengaja dirancang sebagai
**aplikasi desktop** karena:

- **[PERLU KONFIRMASI]** Infrastruktur jaringan di unit rekam medis mungkin terbatas
- **[PERLU KONFIRMASI]** Data bersifat sensitif dan tidak ingin dikirim ke server eksternal
- Data disimpan lokal di file `rekam_medis.db` (SQLite) — tidak perlu internet
