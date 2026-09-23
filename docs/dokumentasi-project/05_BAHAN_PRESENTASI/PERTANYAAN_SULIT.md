# Tanya Jawab: Pertanyaan Kritis & Jebakan Penguji (Tough Defense Questions)

---

### Q1: "Kenapa Anda membuat aplikasi Desktop dan bukan Web App? Bukankah Web App jauh lebih mudah diakses dari browser komputer mana saja di rumah sakit?"
**Jawaban Cerdas**:
> *"Pemilihan desktop didasarkan pada **analisis resiko operasional depo rekam medis**:
> 1. **Kemandirian Jaringan (Zero Downtime)**: Depo arsip fisik rekam medis adalah bagian vital rumah sakit yang tidak boleh berhenti beroperasi sedetik pun. Jika jaringan internet atau server SIMRS pusat mengalami gangguan, petugas loket tetap dapat mencatat sirkulasi berkas fisik tanpa hambatan.
> 2. **Keamanan Data Fisik Pasien**: Sistem desktop terisolasi secara lokal, menghilangkan risiko serangan berbasis web publik seperti *Cross-Site Scripting (XSS)* dari internet luar atau sniffing jaringan terbuka.
> 3. **Efisiensi Perangkat**: Aplikasi desktop berbasis Tauri sangat ringan (<80 MB RAM) dan dapat diinstal langsung pada komputer loket dengan spesifikasi rendah tanpa membutuhkan konfigurasi browser atau server lokal."*

---

### Q2: "Bagaimana jika rumah sakit ingin memasang aplikasi ini di 3 loket filing sekaligus? Bukankah SQLite lokal tidak bisa sinkron antar komputer?"
**Jawaban Cerdas**:
> *"Secara arsitektur saat ini, sistem memang dirancang sebagai sistem mandiri loket tunggal (*single-workstation offline filing*). Namun, jika rumah sakit menghendaki sinkronisasi multi-loket:
> 1. File database SQLite dapat diletakkan pada folder jaringan bersama (*Shared Network Drive LAN*) yang diakses secara simultan oleh ketiga komputer loket.
> 2. Pilihan kedua yang lebih elegan adalah memanfaatkan driver Tauri Plugin SQL yang modular: kita cukup mengubah konfigurasi connection string dari `sqlite:rekam_medis.db` menjadi koneksi server jaringan seperti `postgres://user:pass@simrs-server/rekam_medis` tanpa perlu mengubah satu baris pun logika bisnis di React."*

---

### Q3: "Kenapa status transaksi dihitung ulang secara dinamis (`calculateEffectiveStatus`) dan tidak disimpan langsung di database saja? Bukankah itu membebani komputasi frontend?"
**Jawaban Cerdas**:
> *"Menyimpan status waktu secara statis di database akan menimbulkan **masalah desinkronisasi waktu (*Stale State Problem*)**.
> Contoh: Berkas dipinjam hari Senin jam 08.00 pagi. Jika pada hari Rabu jam 09.00 (setelah 49 jam) berkas belum kembali, status di database akan tetap tertulis `'DIPINJAM'` jika tidak ada daemon server yang terus-menerus memindai database setiap detik.
> Komputasi `calculateEffectiveStatus()` hanya membandingkan dua nilai timestamp integer milidetik di memori JavaScript. Operasi ini membutuhkan waktu kurang dari 0,001 milidetik untuk ribuan baris, menjamin status selalu 100% akurat terhadap jam saat ini tanpa membebani sistem sama sekali."*

---

### Q4: "Bagaimana jika seorang petugas yang nakal memundurkan jam komputernya di Windows agar berkas yang dipinjam tidak terdeteksi terlambat?"
**Jawaban Cerdas**:
> *"Sistem memiliki dua mekanisme penangkal (*tamper mitigation*):
> 1. **Validasi Temporal Relatif**: Pada `processPengembalian()`, sistem memvalidasi bahwa waktu pengembalian tidak boleh mendahului waktu berkas keluar (`returnDateObj >= referenceDate`). Jika jam dimundurkan ke waktu sebelum berkas keluar, transaksi pengembalian akan otomatis ditolak oleh sistem.
> 2. **Pencatatan Default Database**: Kolom `createdAt` pada tabel `peminjaman` dan `pengembalian` menggunakan nilai bawaan SQLite `DEFAULT CURRENT_TIMESTAMP` yang mencatat waktu sistem UTC.
> 3. Untuk lingkungan enterprise rumah sakit, komputer staf dikunci dalam domain Active Directory dengan sinkronisasi waktu jaringan NTP (*Network Time Protocol*) otomatis dari server pusat rumah sakit."*

---

### Q5: "Apakah validasi NIK 16 digit angka dengan Regex sudah cukup? Bagaimana jika user memasukkan angka sembarang seperti '1111111111111111'?"
**Jawaban Cerdas**:
> *"Validasi format `/^\d{16}$/` pada fungsi `validateNik()` adalah validasi integritas tipe dan panjang data (*syntactic validation*). Validasi ini mencegah kesalahan ketik umum seperti spasi, huruf, atau jumlah digit yang kurang/berlebih.
> Namun, untuk memvalidasi apakah angka tersebut benar-benar NIK resmi Dukcapil yang sah, secara regulasi rumah sakit memerlukan integrasi API resmi ke server Dukcapil / BPJS Kesehatan. Sistem kami sengaja membatasi validasi pada format numerik 16 digit agar aplikasi tetap dapat beroperasi secara penuh dalam mode *offline-first* tanpa bergantung pada koneksi internet ke server eksternal."*

---

### Q6: "Bagaimana jika file basis data SQLite `rekam_medis.db` rusak atau tidak sengaja terhapus oleh pengguna?"
**Jawaban Cerdas**:
> *"1. File database disimpan di direktori tersembunyi sistem Windows (`AppData/Local`), sehingga terlindung dari akses pengguna awam.
> 2. Mesin SQLite memiliki proteksi kerusakan bawaan berbasis ACID dan *Write-Ahead Logging* yang mencegah kerusakan file saat komputer tiba-tiba mati listrik.
> 3. Sebagai prosedur operasional standar (SOP), aplikasi dilengkapi fitur ekspor berkala ke Microsoft Excel (`.xlsx`), sehingga jika skenario terburuk terjadi (misalnya hard disk fisik komputer terbakar), seluruh rekapitulasi data peminjaman dan pengembalian tetap memiliki salinan cadangan yang dapat dipulihkan kembali."*
