# 04 — Rumusan Masalah

> **Catatan**: Rumusan masalah formal biasanya ditetapkan oleh penulis laporan.
> Berikut adalah draft rumusan masalah yang dapat digunakan, berdasarkan fitur aktual sistem.
> Konfirmasikan dengan pembimbing/dosen jika perlu penyesuaian.

---

## Rumusan Masalah

Berdasarkan identifikasi masalah yang ada pada unit rekam medis, maka rumusan masalah
dalam pengembangan sistem ini adalah:

1. **Bagaimana merancang dan membangun sistem informasi desktop** yang dapat mencatat
   transaksi peminjaman dan pengembalian berkas rekam medis secara digital?

2. **Bagaimana sistem dapat memantau status berkas** (dipinjam, terlambat, dikembalikan)
   secara otomatis berdasarkan batas waktu 2 × 24 jam?

3. **Bagaimana sistem dapat memberikan notifikasi** kepada petugas ketika berkas mendekati
   batas waktu pengembalian (≤24 jam) atau sudah terlambat (>48 jam)?

4. **Bagaimana sistem dapat menghasilkan laporan rekapitulasi** peminjaman dan pengembalian
   berkas rekam medis dalam format Excel dan PDF yang siap digunakan?

5. **Bagaimana sistem dapat menjamin keamanan akses** melalui autentikasi berbasis NIP
   dan password yang terenkripsi dengan bcrypt?

6. **Bagaimana sistem dapat beroperasi secara offline** tanpa ketergantungan pada
   infrastruktur server atau internet?

---

## Catatan Teknis

Rumusan masalah di atas sepenuhnya didukung oleh implementasi yang ada:

| Rumusan | Implementasi | File |
|---------|-------------|------|
| Pencatatan digital | `createPeminjaman()`, `processPengembalian()` | `peminjamanService.ts`, `pengembalianService.ts` |
| Pemantauan status otomatis | `calculateEffectiveStatus()` | `statusHelper.ts` |
| Notifikasi | `syncNotifications()` | `notificationService.ts` |
| Laporan Excel/PDF | `exportToExcel()`, `exportToPdf()` | `exportService.ts` |
| Keamanan login | `loginWithNip()`, `bcrypt.compare()` | `authService.ts` |
| Operasi offline | SQLite lokal (`rekam_medis.db`) | `index.ts` |
