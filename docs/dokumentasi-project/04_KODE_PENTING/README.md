# Dokumentasi Kode Kritis (Critical Code Guide)

---

## Gambaran Umum

Direktori ini mendokumentasikan kode-kode program paling esensial dalam aplikasi **Filing Rekam Medis**. Setiap modul dijelaskan secara terperinci mencakup tujuan fungsi, alur logika, mekanisme input-proses-output, alasan kepentingan arsitektural, potensi pertanyaan dosen penguji/auditor teknis beserta strategi jawabannya, serta cuplikan kode sumber aktual.

---

## Daftar Berkas Kode Kritis

| No | Berkas | Modul Terkait | Fungsi / Logika Kunci |
|---|---|---|---|
| 01 | [`01_Authentication.md`](./01_Authentication.md) | `authService.ts` | `loginWithNip`, `bcrypt.compare`, `registerUser`, `logLogin` |
| 02 | [`02_Database.md`](./02_Database.md) | `database/index.ts` & `schema.ts` | `getDb`, `initializeDatabase`, `ensureColumnExists`, FK enforcement |
| 03 | [`03_Session.md`](./03_Session.md) | `AuthContext.tsx` | Manajemen Sesi React, Reset Sesi on Launch, Proteksi Rute |
| 04 | [`04_Peminjaman.md`](./04_Peminjaman.md) | `peminjamanService.ts` | `checkActivePeminjaman`, `createPeminjaman`, single active loan rule |
| 05 | [`05_Deadline.md`](./05_Deadline.md) | `statusHelper.ts` | `calculateDeadline`, `RETURN_PERIOD_MS = 48 jam`, fallback waktu |
| 06 | [`06_Pengembalian.md`](./06_Pengembalian.md) | `pengembalianService.ts` | `processPengembalian`, rollback bertingkat, constraint UNIQUE |
| 07 | [`07_Status.md`](./07_Status.md) | `statusHelper.ts` | `calculateEffectiveStatus`, status dinamis vs statis |
| 08 | [`08_Notifikasi.md`](./08_Notifikasi.md) | `notificationService.ts` | `syncNotifications`, auto-cleanup, ambang 24 jam & 48 jam |
| 09 | [`09_Riwayat_RM.md`](./09_Riwayat_RM.md) | `riwayatRmService.ts` | `getAllRiwayat`, `getRiwayatByRm`, audit sirkulasi multi-tabel |
| 10 | [`10_Data_RM.md`](./10_Data_RM.md) | `dataRmService.ts` | `validateNik` (16 digit), agregasi ketersediaan fisik berkas |
| 11 | [`11_Laporan.md`](./11_Laporan.md) | `laporanService.ts` | `getLaporanData`, `computeSummaryTables`, 3 tabel rekapitulasi |
| 12 | [`12_Export.md`](./12_Export.md) | `exportService.ts` | `exportToExcel` (ExcelJS), `exportToPdf` (jsPDF), dialog FS |

---

## Standar Format Penjelasan

Setiap berkas kode kritis disusun dengan struktur baku:
1. **FILE**: Lokasi berkas fisik pada repositori proyek.
2. **FUNCTION/COMPONENT**: Nama fungsi, metode, atau komponen React yang dianalisis.
3. **TUJUAN**: Mengapa kode ini dibuat dan peran fungsionalnya dalam sistem.
4. **ALUR**: Tahapan langkah eksekusi komputasi secara runut.
5. **INPUT / PROSES / OUTPUT**: Spesifikasi parameter data masuk, algoritma pengolahan, dan hasil kembalian.
6. **KENAPA PENTING**: Alasan kode ini kritikal dan dampaknya bila kode ini ditiadakan.
7. **KEMUNGKINAN DITANYA PENGUJI**: Prediksi pertanyaan penguji seputar arsitektur atau keamanan kode.
8. **JAWABAN REKOMENDASI**: Panduan jawaban berbasis fakta kode untuk merespons penguji.
9. **KODE TERKAIT**: Cuplikan kode sumber aktual dari repositori.
