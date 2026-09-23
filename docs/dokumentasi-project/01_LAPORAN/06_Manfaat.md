# 06 — Manfaat Sistem

---

## Manfaat bagi Petugas Filing / Rekam Medis

1. **Efisiensi Pencatatan**: Petugas tidak perlu lagi mencatat peminjaman secara manual.
   Sistem menyediakan form terstruktur dengan validasi otomatis.

2. **Monitoring Real-Time**: Status setiap berkas (dipinjam, terlambat, sudah kembali)
   dapat diketahui secara langsung dari halaman Daftar Peminjaman atau Dashboard.

3. **Notifikasi Otomatis**: Petugas mendapatkan peringatan otomatis tanpa harus
   memeriksa satu per satu status berkas secara manual.

4. **Pencegahan Peminjaman Ganda**: Sistem secara otomatis mencegah berkas yang
   sedang dipinjam untuk dipinjam ulang:
   ```typescript
   // peminjamanService.ts
   const active = await checkActivePeminjaman(data.nomorRm);
   if (active) {
     throw new Error(`Rekam medis ${data.nomorRm} masih berstatus aktif dipinjam.`);
   }
   ```

5. **Riwayat Lengkap**: Petugas dapat menelusuri seluruh riwayat transaksi berkas
   RM tertentu, termasuk siapa yang pernah meminjam dan kapan dikembalikan.

---

## Manfaat bagi Kepala Unit Rekam Medis

1. **Laporan Siap Pakai**: Laporan rekapitulasi dapat diekspor ke Excel dan PDF
   dalam format resmi dengan header institusi RSI Sultan Agung.

2. **Pemantauan Kinerja**: Laporan mencakup data tepat waktu vs terlambat per
   unit/ruang, memudahkan evaluasi kepatuhan pengembalian berkas.

3. **Log Aktivitas**: Seluruh aktivitas login petugas tercatat di tabel `login_logs`
   (diakses melalui menu Log Login — khusus Super Admin).

---

## Manfaat bagi Manajemen Rumah Sakit

1. **Akuntabilitas**: Setiap transaksi memiliki pencatat yang jelas (peminjamId, dikembalikanOlehId).

2. **Data Historis**: Semua data tersimpan permanen di database SQLite lokal.

3. **Keamanan Data**: Password di-hash dengan bcrypt, tidak ada data yang dikirim
   ke server eksternal.

---

## Manfaat bagi Pasien (Tidak Langsung)

1. **Berkas Lebih Mudah Dilacak**: Dokter/perawat dapat lebih cepat mendapatkan
   berkas yang dibutuhkan.

2. **Keamanan Data Pasien**: NIK dan data pribadi pasien hanya disimpan di database
   lokal, tidak dikirim ke internet.

---

## Manfaat Teknis

1. **Offline-First**: Tidak bergantung koneksi internet, aman dari gangguan jaringan.

2. **Instalasi Mandiri**: Tersedia dalam format `.msi` (installer Windows) dan `.exe`
   (NSIS setup), memudahkan distribusi ke komputer unit rekam medis.

3. **Data Persisten**: SQLite menyimpan data di file `rekam_medis.db` yang dapat
   di-backup secara manual.
