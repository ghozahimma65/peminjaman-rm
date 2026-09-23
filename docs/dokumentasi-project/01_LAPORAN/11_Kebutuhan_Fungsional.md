# 11 — Kebutuhan Fungsional

Seluruh kebutuhan fungsional di bawah ini dapat dibuktikan langsung dari source code.

---

## KF-01: Autentikasi

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KF-01.1 | Sistem harus mengizinkan pengguna masuk menggunakan NIP dan password | `loginWithNip()` di `authService.ts` |
| KF-01.2 | Sistem harus memverifikasi password menggunakan bcrypt | `bcrypt.compare()` di `authService.ts` |
| KF-01.3 | Sistem harus mencatat setiap percobaan login (sukses dan gagal) | `logLogin()` di `authService.ts` |
| KF-01.4 | Sistem harus memungkinkan registrasi petugas baru | `registerUser()` di `authService.ts` |
| KF-01.5 | Sistem harus menolak registrasi dengan NIP atau email duplikat | Cek duplikat di `registerUser()` |
| KF-01.6 | Session harus dihapus setiap kali aplikasi ditutup | `AuthContext.tsx` — session intentionally cleared on startup |

---

## KF-02: Master Data Rekam Medis

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KF-02.1 | Sistem harus menyimpan data pasien (Nomor RM, Nama, NIK, Jenis Kelamin, Tgl Lahir, Alamat) | Tabel `data_rm` di `schema.ts` |
| KF-02.2 | Sistem harus memvalidasi NIK 16 digit angka | `validateNik()` di `dataRmService.ts` |
| KF-02.3 | Sistem harus mencegah nomor RM duplikat | `nomorRm TEXT PRIMARY KEY` di schema |
| KF-02.4 | Sistem harus menampilkan semua data RM dengan jumlah transaksi dan status dipinjam | `getAllDataRm()` di `dataRmService.ts` |
| KF-02.5 | Sistem harus memungkinkan pencarian berdasarkan nomor RM atau nama pasien | `searchDataRm()` di `dataRmService.ts` |
| KF-02.6 | Sistem harus menampilkan statistik (total pasien, sedang dipinjam, baru bulan ini) | `getDataRmStats()` di `dataRmService.ts` |

---

## KF-03: Peminjaman

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KF-03.1 | Sistem harus mencatat peminjaman berkas dengan data lengkap | `createPeminjaman()` di `peminjamanService.ts` |
| KF-03.2 | Sistem harus mencegah peminjaman berkas yang masih aktif dipinjam | `checkActivePeminjaman()` di `peminjamanService.ts` |
| KF-03.3 | Sistem harus mencatat siapa yang meminjam (operator dan nama peminjam) | Field `peminjamId` dan `namaPeminjam` |
| KF-03.4 | Sistem harus menampilkan semua data peminjaman dengan status terkini | `getAllPeminjaman()` di `peminjamanService.ts` |
| KF-03.5 | Sistem harus menghitung status peminjaman secara otomatis | `calculateEffectiveStatus()` di `statusHelper.ts` |

---

## KF-04: Pengembalian

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KF-04.1 | Sistem harus memungkinkan konfirmasi pengembalian berkas | `processPengembalian()` di `pengembalianService.ts` |
| KF-04.2 | Sistem harus merekam timestamp aktual pengembalian | `new Date().toISOString()` di `processPengembalian()` |
| KF-04.3 | Sistem harus memvalidasi bahwa tanggal kembali tidak lebih awal dari tanggal pinjam | Validasi temporal di `processPengembalian()` |
| KF-04.4 | Sistem harus mencegah pengembalian duplikat | `UNIQUE` constraint di `pengembalian.peminjamanId` |
| KF-04.5 | Sistem harus mencatat siapa yang mengkonfirmasi pengembalian | Field `dikembalikanOlehId` |
| KF-04.6 | Sistem harus mendukung rollback jika pengembalian gagal | Try-catch + rollback di `processPengembalian()` |

---

## KF-05: Status Berkas

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KF-05.1 | Sistem harus menentukan status otomatis: DIPINJAM, TERLAMBAT, DIKEMBALIKAN | `calculateEffectiveStatus()` |
| KF-05.2 | Deadline pengembalian dihitung dari tanggalBerkasKeluar + 48 jam | `calculateDeadline()` di `statusHelper.ts` |
| KF-05.3 | Jika tanggalBerkasKeluar kosong, gunakan tanggalPinjam sebagai referensi | Fallback di `calculateDeadline()` |

---

## KF-06: Notifikasi

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KF-06.1 | Sistem harus membuat notifikasi REMINDER saat ≤24 jam sebelum deadline | `syncNotifications()` |
| KF-06.2 | Sistem harus membuat notifikasi TERLAMBAT saat melewati deadline | `syncNotifications()` |
| KF-06.3 | Notifikasi harus otomatis dihapus setelah berkas dikembalikan | DELETE di awal `syncNotifications()` |
| KF-06.4 | Pengguna harus dapat menandai notifikasi sebagai sudah dibaca | `markAsRead()` |

---

## KF-07: Riwayat RM

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KF-07.1 | Sistem harus menampilkan seluruh riwayat transaksi dari semua RM | `getAllRiwayat()` di `riwayatRmService.ts` |
| KF-07.2 | Sistem harus mendukung pencarian berdasarkan nomor RM, nama pasien, peminjam | Parameter `search` di `getAllRiwayat()` |
| KF-07.3 | Sistem harus menampilkan riwayat per nomor RM tertentu | `getRiwayatByRm()` |

---

## KF-08: Laporan

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KF-08.1 | Sistem harus menghasilkan laporan rekapitulasi yang dapat difilter | `getLaporanData(filters)` |
| KF-08.2 | Filter laporan berdasarkan: tanggal mulai, tanggal akhir, unit, status | `LaporanFilter` interface |
| KF-08.3 | Sistem harus menghitung tabel rekapitulasi per ruang | `computeSummaryTables()` |
| KF-08.4 | Sistem harus dapat mengekspor laporan ke Excel | `exportToExcel()` di `exportService.ts` |
| KF-08.5 | Sistem harus dapat mengekspor laporan ke PDF | `exportToPdf()` di `exportService.ts` |

---

## KF-09: Profil

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KF-09.1 | Pengguna harus dapat mengubah nama dan email profil | `updateUserProfile()` di `authService.ts` |
| KF-09.2 | Pengguna harus dapat mengganti password | `changeUserPassword()` di `authService.ts` |
| KF-09.3 | Sistem harus memvalidasi password lama sebelum ganti password | bcrypt compare di `changeUserPassword()` |
| KF-09.4 | Pengguna harus dapat mengupload foto profil | `saveAvatarFile()` di `avatarService.ts` |

---

## KF-10: Log Login (Super Admin)

| Kode | Kebutuhan | Implementasi |
|------|-----------|-------------|
| KF-10.1 | Super Admin harus dapat melihat seluruh log login | Halaman `LogLogin.tsx` |
| KF-10.2 | Log mencatat NIP, waktu login, dan status (SUCCESS/FAILED) | Tabel `login_logs` di schema |
