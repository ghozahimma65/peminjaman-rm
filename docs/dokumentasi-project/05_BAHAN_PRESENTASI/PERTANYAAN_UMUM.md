# Tanya Jawab: Pertanyaan Umum Penguji (General Questions)

---

### Q1: Mengapa mengangkat topik Filing Rekam Medis di RSI Sultan Agung Semarang?
**Jawaban**:
> *"Unit filing rekam medis adalah jantung tata kelola dokumen medis pasien. Di RSI Sultan Agung Semarang, meskipun pendaftaran pasien sudah terkomputerisasi, peredaran fisik berkas rekam medis antar ruangan perawatan dan poliklinik masih menghadapi tantangan pemantauan batas waktu 2x24 jam dan risiko berkas terselip. Sistem ini hadir khusus untuk memecahkan masalah sirkulasi fisik dokumen tersebut secara akurat dan terukur."*

---

### Q2: Apa perbedaan sistem ini dengan SIMRS (Sistem Informasi Manajemen Rumah Sakit) utama?
**Jawaban**:
> *"SIMRS utama berfokus pada rekam medis elektronik (RME) dan transaksi billing pelayanan medis. Sedangkan sistem ini berfokus spesifik pada **manajemen logistik fisik berkas rekam medis kertas (*paper-based medical record filing*)** yang secara hukum masih wajib diarsipkan dan dipinjam untuk keperluan rawat inap, tindakan operasi, visum, atau klaim asuransi."*

---

### Q3: Siapa saja pengguna utama aplikasi ini?
**Jawaban**:
> *"Pengguna sistem terbagi menjadi dua level peran:
> 1. **PETUGAS**: Petugas arsip/filing di depo rekam medis yang bertugas melayani permohonan pinjam berkas, memvalidasi berkas kembali, memeriksa kondisi fisik dokumen, dan mengunduh laporan bulanan.
> 2. **Super Admin**: Kepala unit atau administrator IT yang memiliki kewenangan audit sistem, memeriksa riwayat log login (`login_logs`), dan mengelola pengaturan aplikasi."*

---

### Q4: Mengapa memilih arsitektur aplikasi Desktop dan bukan Web Application?
**Jawaban**:
> *"Terdapat 3 pertimbangan utama:
> 1. **Keandalan Offline**: Depo filing rekam medis sering kali berada di lantai dasar (*basement*) atau area arsip terisolasi. Aplikasi desktop berbasis SQLite menjamin operasional pencatatan berkas tetap berjalan 100% lancar tanpa bergantung pada stabilitas jaringan internet atau server LAN.
> 2. **Kecepatan & Responsivitas**: Aplikasi desktop berbasis Tauri dengan backend Rust memiliki performa instan tanpa latensi loading jaringan browser.
> 3. **Interaksi Native Sistem Operasi**: Memungkinkan penyimpanan file laporan Excel dan PDF langsung ke folder lokal komputer tanpa peringatan unduhan browser."*

---

### Q5: Bagaimana jika listrik tiba-tiba padam saat petugas sedang mencatat transaksi peminjaman atau pengembalian?
**Jawaban**:
> *"Basis data SQLite menggunakan mekanisme jurnal transaksional (*Write-Ahead Logging / Rollback Journal*). Jika terjadi mati listrik mendadak di tengah proses tulis, mesin database secara otomatis memulihkan status ke kondisi stabil terakhir saat komputer dinyalakan kembali, sehingga tidak akan terjadi file database korup (*data corruption*)."*

---

### Q6: Bagaimana sistem menjamin bahwa berkas rekam medis tidak hilang?
**Jawaban**:
> *"Sistem menerapkan aturan ketat **Single Active Loan**: satu nomor rekam medis hanya dapat dipinjam oleh satu ruangan dalam satu waktu. Jika ada permohonan pinjam baru, sistem akan memblokir dan menampilkan lokasi serta nama peminjam saat ini. Ditambah fitur riwayat komprehensif, jejak pergerakan setiap berkas selalu tercatat lengkap."*

---

### Q7: Apa kontribusi nyata sistem ini terhadap akreditasi rumah sakit?
**Jawaban**:
> *"Standar akreditasi rumah sakit (seperti STARKES/KARS) mensyaratkan standar waktu penyediaan dan kepatuhan pengembalian berkas rekam medis rawat inap maksimal 2x24 jam. Sistem ini menyediakan data statistik riil kepatuhan per ruangan yang dapat dicetak langsung dalam bentuk Berita Acara resmi PDF untuk bukti dokumen audit akreditasi."*
