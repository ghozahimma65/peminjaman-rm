# Panduan Alur Presentasi Sidang & Demonstrasi Sistem

---

## Rencana Alokasi Waktu (Total: 15–20 Menit)

- **00:00 – 03:00 (3 Menit)**: Pendahuluan, Latar Belakang & Rumusan Masalah di RSI Sultan Agung
- **03:00 – 06:00 (3 Menit)**: Arsitektur Sistem, DFD & ERD Ringkas
- **06:00 – 14:00 (8 Menit)**: Skenario Demonstrasi Aplikasi Langsung (*Live System Demo*)
- **14:00 – 16:00 (2 Menit)**: Kelebihan Teknis & Evaluasi Kinerja
- **16:00 – Selesai**: Sesi Tanya Jawab Penguji

---

## Tahap 1: Pembukaan & Latar Belakang (Slide 1–4)
- **Salam & Pengenalan**: Perkenalkan judul proyek *"Sistem Informasi Filing Rekam Medis Berbasis Desktop pada Rumah Sakit Islam Sultan Agung Semarang"*.
- **Masalah Utama**:
  1. Berkas fisik rekam medis rentan terselip atau tidak diketahui keberadaannya karena pencatatan manual di buku ekspedisi kertas.
  2. Kesulitan memantau kepatuhan batas pengembalian 2 x 24 jam (48 jam).
  3. Proses rekapitulasi laporan bulanan ke pimpinan memakan waktu lama karena harus menghitung ribuan berkas manual per ruangan.
- **Solusi**: Digitalisasi sirkulasi rekam medis dengan proteksi single-active-loan, early warning notifikasi, dan ekspor instan Excel/PDF berstandar resmi.

---

## Tahap 2: Arsitektur & Landasan Teori (Slide 5–7)
- Jelaskan **Tauri v2 + Rust + SQLite**:
  - Mengapa bukan Electron? Konsumsi RAM hemat (< 80 MB vs > 300 MB).
  - Mengapa SQLite lokal? Rumah sakit memerlukan aplikasi yang tetap dapat beroperasi 100% saat jaringan internet/LAN terputus (*offline-first*).
- Tampilkan diagram **DFD Level 0** dan **ERD 6 Tabel**.
- Tekankan bahwa struktur database telah menerapkan `PRAGMA foreign_keys = ON;` dan enkripsi kata sandi `bcrypt`.

---

## Tahap 3: Skenario Live Demo Terstruktur (Langkah Demi Langkah)

### Skenario 1: Login Petugas & Dashboard
- Buka aplikasi. Tunjukkan bahwa aplikasi selalu mulai dari halaman awal secara bersih (*clean session on startup*).
- Login menggunakan akun Petugas (atau register akun baru untuk membuktikan enkripsi password).
- Tunjukkan metrik ringkasan di dashboard (total pasien, berkas sedang dipinjam, berkas baru).

### Skenario 2: Master Data Pasien & Validasi NIK
- Masuk ke menu **Data RM**.
- Coba input NIK tidak valid (misal 10 digit atau huruf) $\rightarrow$ tunjukkan sistem menolaknya secara tegas (`validateNik`).
- Input data pasien baru dengan NIK valid 16 digit. Berkas otomatis muncul di master data dengan status fisik `Tersedia di Filing`.

### Skenario 3: Transaksi Peminjaman Berkas
- Buka **Peminjaman Baru**.
- Masukkan nomor RM pasien yang baru didaftarkan.
- Pilih ruangan peminjam dari daftar 22 unit (misal: "ICU").
- Isi nama peminjam (Dokter/Perawat).
- Simpan transaksi $\rightarrow$ status berkas berubah menjadi `DIPINJAM`.
- **Uji Coba Proteksi Double Loan**: Coba pinjam kembali nomor RM yang sama ke ruangan lain (misal: "Mawar") $\rightarrow$ **Tunjukkan sistem menolak peminjaman dengan modal peringatan jelas** bahwa berkas sedang berada di ruangan ICU.

### Skenario 4: Monitoring Notifikasi
- Tunjukkan ikon lonceng pada header navigasi.
- Jelaskan mekanisme `syncNotifications`: jika sisa waktu $\le 24$ jam muncul `REMINDER`, jika $> 48$ jam muncul `TERLAMBAT` dan status peminjaman otomatis ter-update di database.

### Skenario 5: Pengembalian Berkas Fisik
- Masuk ke menu **Pengembalian $\rightarrow$ Proses Pengembalian**.
- Masukkan nomor RM yang sedang dipinjam tadi. Sistem otomatis memuat detail transaksi.
- Pilih kondisi fisik berkas (`BAIK`).
- Konfirmasi Pengembalian $\rightarrow$ tunjukkan bahwa status berubah menjadi `DIKEMBALIKAN` (atau `TERLAMBAT` jika melewati 48 jam).
- Jelaskan proteksi rollback transaksional yang mencegah inkonsistensi data.

### Skenario 6: Riwayat & Audit Trail
- Buka menu **Riwayat RM**.
- Tunjukkan penelusuran riwayat berkas lengkap dengan operator peminjam dan petugas penerima.
- Demonstrasikan fitur pencarian real-time dan pagination 10 baris.

### Skenario 7: Generasi Laporan & Ekspor
- Masuk ke menu **Laporan**.
- Terapkan filter periode tanggal dan ruangan.
- Tunjukkan 3 tabel rekapitulasi analitik hasil perhitungan otomatis `computeSummaryTables`.
- Klik **Ekspor Excel** $\rightarrow$ buka file `.xlsx` yang dihasilkan di depan penguji (perlihatkan font Times New Roman, landscape A4, dan tabel 13 kolom).
- Klik **Ekspor PDF** $\rightarrow$ buka file `.pdf` yang dihasilkan (perlihatkan kop resmi RSI Sultan Agung Semarang dan nomor berita acara).

### Skenario 8: Keamanan & Role Super Admin
- Logout dari akun Petugas.
- Login dengan akun `Super Admin` (NIP: `superadmin`).
- Tunjukkan menu khusus **Log Login** yang merekam jejak login dari demo sebelumnya.

---

## Tahap 4: Penutup & Kesimpulan
- Rangkum manfaat yang diperoleh rumah sakit: efisiensi waktu, keterlacakan 100% berkas fisik, dan kepatuhan akreditasi rekam medis.
- Buka sesi tanya jawab dengan percaya diri.
