# Matriks Keterlacakan Sistem (Traceability Matrix)

---

## Gambaran Matriks Keterlacakan

Matriks Keterlacakan menghubungkan setiap Kebutuhan Bisnis (BR), Kebutuhan Fungsional (FR), Implementasi Komponen Antarmuka & Layanan Kode, Skema Basis Data Terkait, Prosedur Pengujian, hingga Dokumen Laporan Spesifik.

---

## Tabel Matriks Keterlacakan Komprehensif

| ID Kebutuhan | Deskripsi Kebutuhan | Komponen UI | Service / Kode Sumber | Tabel Database | Prosedur Uji | Berkas Dokumentasi |
|---|---|---|---|---|---|---|
| **REQ-AUTH-01** | Otentikasi Login dengan NIP dan Enkripsi Bcrypt | `Login.tsx`, `Portal.tsx` | `src/lib/auth/authService.ts` (`loginWithNip`) | `users` | TC-AUTH-01, TC-AUTH-02, SmokeTest #5 | [`16_Authentication_dan_Security.md`](./01_LAPORAN/16_Authentication_dan_Security.md), [`01_Authentication.md`](./04_KODE_PENTING/01_Authentication.md) |
| **REQ-AUTH-02** | Audit Jejak Aktivitas Login | `LogLogin.tsx` | `src/lib/auth/authService.ts` (`logLogin`) | `login_logs` | TC-AUTH-02 | [`23_Profil_dan_User.md`](./01_LAPORAN/23_Profil_dan_User.md) |
| **REQ-AUTH-03** | Otorisasi Akses Khusus Super Admin | `Sidebar.tsx`, `App.tsx` | `src/constants.ts`, `src/context/AuthContext.tsx` | `users(role)` | TC-AUTH-03 | [`08_Aktor_dan_Hak_Akses.md`](./01_LAPORAN/08_Aktor_dan_Hak_Akses.md) |
| **REQ-RM-01** | Pendaftaran Master Data Pasien & Berkas RM | `MasterDataRm.tsx` | `src/lib/database/dataRmService.ts` (`createDataRm`) | `data_rm` | SmokeTest #2 | [`20_Data_Pasien_RM.md`](./01_LAPORAN/20_Data_Pasien_RM.md), [`10_Data_RM.md`](./04_KODE_PENTING/10_Data_RM.md) |
| **REQ-RM-02** | Validasi Format NIK 16 Digit Angka | `MasterDataRm.tsx` | `src/lib/database/dataRmService.ts` (`validateNik`) | `data_rm(nik)` | TC-RM-01 (Unit test regex) | [`20_Data_Pasien_RM.md`](./01_LAPORAN/20_Data_Pasien_RM.md) |
| **REQ-RM-03** | Deteksi Ketersediaan Fisik Berkas di Filing | `MasterDataRm.tsx` | `src/lib/database/dataRmService.ts` (`getAllDataRm`) | `data_rm`, `peminjaman`, `pengembalian` | Verifikasi Query EXISTS | [`20_Data_Pasien_RM.md`](./01_LAPORAN/20_Data_Pasien_RM.md) |
| **REQ-PINJAM-01** | Pencatatan Peminjaman Berkas Rekam Medis | `AjukanPeminjaman.tsx` | `src/lib/database/peminjamanService.ts` (`createPeminjaman`) | `peminjaman` | TC-PINJAM-01, SmokeTest #3 | [`17_Peminjaman.md`](./01_LAPORAN/17_Peminjaman.md), [`04_Peminjaman.md`](./04_KODE_PENTING/04_Peminjaman.md) |
| **REQ-PINJAM-02** | Proteksi Peminjaman Ganda (Single Active Loan) | `AjukanPeminjaman.tsx` | `src/lib/database/peminjamanService.ts` (`checkActivePeminjaman`) | `peminjaman`, `pengembalian` | TC-PINJAM-02 | [`17_Peminjaman.md`](./01_LAPORAN/17_Peminjaman.md), [`04_Peminjaman.md`](./04_KODE_PENTING/04_Peminjaman.md) |
| **REQ-PINJAM-03** | Penghitungan Batas Waktu 48 Jam (2x24 Jam) | Seluruh Modul | `src/lib/statusHelper.ts` (`calculateDeadline`) | `peminjaman` | TC-PINJAM-04 | [`05_Deadline.md`](./04_KODE_PENTING/05_Deadline.md) |
| **REQ-KEMBALI-01** | Konfirmasi Pengembalian & Kondisi Berkas (BAIK/RUSAK) | `ProsesPengembalian.tsx` | `src/lib/database/pengembalianService.ts` (`processPengembalian`) | `pengembalian`, `peminjaman` | TC-KEMBALI-01, TC-KEMBALI-02 | [`18_Pengembalian.md`](./01_LAPORAN/18_Pengembalian.md), [`06_Pengembalian.md`](./04_KODE_PENTING/06_Pengembalian.md) |
| **REQ-KEMBALI-02** | Proteksi Rollback Transaksional Pengembalian | `ProsesPengembalian.tsx` | `src/lib/database/pengembalianService.ts` (`processPengembalian`) | `pengembalian`, `peminjaman` | TC-KEMBALI-05 | [`18_Pengembalian.md`](./01_LAPORAN/18_Pengembalian.md), [`06_Pengembalian.md`](./04_KODE_PENTING/06_Pengembalian.md) |
| **REQ-NOTIF-01** | Peringatan Dini 24 Jam & Keterlambatan Otomatis | `NotificationDropdown.tsx`, Header | `src/lib/database/notificationService.ts` (`syncNotifications`) | `notifications`, `peminjaman` | TC-NOTIF-01 | [`21_Notifikasi.md`](./01_LAPORAN/21_Notifikasi.md), [`08_Notifikasi.md`](./04_KODE_PENTING/08_Notifikasi.md) |
| **REQ-RIWAYAT-01** | Audit Trail Kronologis Sirkulasi per Nomor RM | `RiwayatRm.tsx` | `src/lib/database/riwayatRmService.ts` (`getAllRiwayat`, `getRiwayatByRm`) | `peminjaman`, `pengembalian`, `users`, `data_rm` | TC-HIST-01 | [`19_Riwayat_RM.md`](./01_LAPORAN/19_Riwayat_RM.md), [`09_Riwayat_RM.md`](./04_KODE_PENTING/09_Riwayat_RM.md) |
| **REQ-LAP-01** | Rekapitulasi Analitik per Ruangan & Status | `Laporan.tsx` | `src/lib/database/laporanService.ts` (`computeSummaryTables`) | `peminjaman`, `pengembalian` | TC-LAP-01 | [`22_Laporan_dan_Export.md`](./01_LAPORAN/22_Laporan_dan_Export.md), [`11_Laporan.md`](./04_KODE_PENTING/11_Laporan.md) |
| **REQ-EXP-01** | Ekspor Microsoft Excel (.xlsx) Standar Rumah Sakit | `Laporan.tsx` | `src/lib/exportService.ts` (`exportToExcel`) | Memori Laporan | TC-EXP-01 | [`22_Laporan_dan_Export.md`](./01_LAPORAN/22_Laporan_dan_Export.md), [`12_Export.md`](./04_KODE_PENTING/12_Export.md) |
| **REQ-EXP-02** | Ekspor Adobe PDF (.pdf) Berita Acara Resmi RSISA | `Laporan.tsx` | `src/lib/exportService.ts` (`exportToPdf`) | Memori Laporan | TC-EXP-02 | [`22_Laporan_dan_Export.md`](./01_LAPORAN/22_Laporan_dan_Export.md), [`12_Export.md`](./04_KODE_PENTING/12_Export.md) |
| **REQ-PROF-01** | Pengunggahan Avatar Lokal ke AppData | `Profil.tsx` | `src/lib/auth/avatarService.ts` (`saveAvatarFile`) | `users(avatarPath)`, FS | TC-PROF-01 | [`23_Profil_dan_User.md`](./01_LAPORAN/23_Profil_dan_User.md) |
