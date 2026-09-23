# 25 — Kelebihan dan Keterbatasan Sistem

---

## Kelebihan Sistem

Aplikasi **Filing Rekam Medis** memiliki sejumlah keunggulan teknis dan fungsional yang menjadikannya solusi andal bagi unit rekam medis:

### 1. Arsitektur Desktop Modern, Ringan, dan Mandiri (*Offline-First*)
- Dibangun menggunakan **Tauri v2** dengan backend **Rust**, menghasilkan footprint memori RAM yang sangat kecil (rata-rata di bawah 80 MB, jauh lebih hemat dibandingkan framework berbasis Electron yang dapat mengonsumsi ratusan megabyte).
- Bekerja secara penuh tanpa ketergantungan koneksi internet (*100% offline-ready*). Operasional pencatatan berkas rekam medis di depo filing tidak akan terganggu oleh putusnya jaringan rumah sakit.

### 2. Keamanan Kredensial dan Jejak Audit
- Seluruh kata sandi pengguna dienkripsi searah menggunakan algoritma **bcryptjs** dengan faktor kerja (*work factor/salt rounds*) 10. Tidak ada kata sandi berbentuk teks polos (*plaintext*) yang tersimpan di disk.
- Tersedia pencatatan otomatis riwayat percobaan login (`login_logs`) yang dapat diaudit langsung oleh `Super Admin`.

### 3. Integritas Transaksional dan Proteksi Duplikasi
- Mencegah peminjaman ganda (*double borrowing*) pada berkas yang sama melalui validasi query aktif serta pengecekan ketersediaan fisik berkas.
- Modul pengembalian dilengkapi penanganan error tingkat rendah dengan mekanisme *rollback* manual apabila salah satu tahap query gagal.
- Tabel pengembalian menerapkan constraint `peminjamanId INTEGER UNIQUE` untuk memblokir anomali duplikasi pencatatan pengembalian berkas.

### 4. Kalkulasi Status Dinamis dan Bebas Desinkronisasi
- Status transaksi (`DIPINJAM`, `DIKEMBALIKAN`, `TERLAMBAT`) tidak hanya bergantung pada status statis di database, melainkan dihitung ulang secara deterministik melalui fungsi `calculateEffectiveStatus()`. Hal ini menjamin status selalu akurat terhadap referensi waktu aktual (misalnya berkas yang melewati batas 48 jam langsung terdeteksi terlambat).

### 5. Dokumen Ekspor Standar Rumah Sakit
- Ekspor Microsoft Excel (`.xlsx`) via **ExcelJS** menghasilkan laporan landscape A4 berformat resmi, lengkap dengan perhitungan persentase otomatis per ruangan dan kolom tanda tangan pengesahan.
- Ekspor PDF (`.pdf`) via **jsPDF** menghasilkan berkas berita acara resmi ber-kop surat Rumah Sakit Islam Sultan Agung Semarang, alamat lengkap, dan penomoran dokumen formal.

### 6. Migrasi Skema Mandiri & Idempoten
- Modul inisialisasi database (`ensureColumnExists` dan `INITIALIZATION_SQL`) secara otomatis memeriksa dan memperbarui struktur kolom jika terdapat perubahan versi aplikasi, tanpa memerlukan migrator database eksternal yang rumit.

---

## Keterbatasan Sistem

Meskipun telah memenuhi seluruh kebutuhan fungsional pokok, sistem ini memiliki beberapa batasan teknis yang perlu dipahami:

### 1. Database Tersimpan Lokal pada Satu Perangkat (*Single-Machine Storage*)
- Basis data SQLite (`rekam_medis.db`) tersimpan secara fisik di direktori lokal komputer pengguna (`AppData/Local`).
- Perubahan data yang dilakukan pada satu komputer tidak secara otomatis tersinkronisasi ke komputer lain tanpa adanya mekanisme replikasi basis data jaringan atau server terpusat.

### 2. Sesi Pengguna Direset Setiap Aplikasi Dibuka Ulang
- Demi alasan keamanan operasional di ruangan kerja bersama (*shared workstation*), sesi login secara sengaja dibersihkan setiap kali aplikasi ditutup atau dimulai ulang (`AuthContext.tsx`). Pengguna wajib login kembali setiap kali aplikasi dijalankan.

### 3. Pilihan Unit Ruangan Masih Bersifat Statis di Kode
- Daftar 22 unit ruangan peminjam (`RUANGAN_OPTIONS` pada `constants.ts`) saat ini dikodekan secara statis di sisi frontend. Penambahan nama ruangan baru memerlukan pembaruan kode dan kompilasi ulang aplikasi.

### 4. Batas Waktu Peminjaman Ditetapkan Kaku (48 Jam)
- Batas waktu pengembalian berkas ditetapkan konstan 48 jam (2 × 24 jam) untuk seluruh jenis peminjaman. Sistem belum menyediakan konfigurasi durasi dinamis berdasarkan jenis ruangan (misalnya peminjaman rawat jalan 24 jam vs rawat inap 48 jam).

### 5. Penomoran Dokumen Laporan Masih Bersifat Statis
- Nomor berita acara pada berkas PDF menggunakan format tahunan standar `042/BA-REKAMMED/RSISA/{year}`. Belum ada pencatat nomor urut surat dinamis di basis data.
