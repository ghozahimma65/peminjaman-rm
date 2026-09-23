# Tanya Jawab: Pertanyaan Basis Data (Database Questions)

---

### Q1: Mengapa menggunakan SQLite dan bukan MySQL atau PostgreSQL?
**Jawaban**:
> *"SQLite adalah basis data relasional bertipe **embedded/serverless**. Untuk aplikasi desktop mandiri di loket filing rekam medis, SQLite memiliki keunggulan:
> 1. **Zero Configuration**: Petugas tidak perlu menginstal atau menyalakan service daemon server database terpisah.
> 2. **File Portabel**: Seluruh basis data (termasuk indeks dan skema) tersimpan dalam satu file biner tunggal (`rekam_medis.db`), sehingga proses backup sangat mudah (cukup menyalin satu file).
> 3. **Performa Tinggi**: Kueri dieksekusi langsung di memori proses lokal via Tauri Plugin Rust tanpa overhead protokol jaringan TCP/IP."*

---

### Q2: Mengapa wajib mengeksekusi `PRAGMA foreign_keys = ON;` pada setiap koneksi?
**Jawaban**:
> *"Secara historis untuk alasan kompatibilitas mundur (*backward compatibility*), mesin SQLite menonaktifkan validasi Foreign Key secara default. Jika kita mendefinisikan sintaks `FOREIGN KEY(...) REFERENCES...` tanpa menjalankan `PRAGMA foreign_keys = ON;`, SQLite hanya akan menyimpan definisi tersebut tetapi tidak akan memvalidasi apakah ID yang dirujuk benar-benar ada. Dengan mengeksekusi PRAGMA tersebut pada inisialisasi koneksi, seluruh constraint integritas referensial ditegakkan secara nyata."*

---

### Q3: Di mana lokasi fisik file database `rekam_medis.db` disimpan di sistem operasi Windows?
**Jawaban**:
> *"Plugin SQL Tauri (`@tauri-apps/plugin-sql`) menyimpan file basis data di direktori data lokal aplikasi pengguna Windows, yaitu di:
> `C:\Users\<Nama_User>\AppData\Local\<App_Identifier>\rekam_medis.db`.
> Lokasi ini terisolasi per pengguna dan aman dari penghapusan tidak sengaja oleh pembersihan file sementara."*

---

### Q4: Bagaimana sistem menangani migrasi skema tabel jika di masa depan terdapat penambahan kolom baru?
**Jawaban**:
> *"Sistem memiliki fungsi pembantu mandiri `ensureColumnExists(tableName, columnName, columnDefinition)` yang dipanggil saat `initializeDatabase()`. Fungsi ini membaca skema tabel yang ada menggunakan kueri `PRAGMA table_info(tableName)`. Jika kolom belum ada, sistem mengeksekusi `ALTER TABLE ... ADD COLUMN ...` secara dinamis dan aman tanpa merusak data yang sudah ada."*

---

### Q5: Bagaimana mekanisme backup data jika sewaktu-waktu komputer kasir/filing mengalami kerusakan?
**Jawaban**:
> *"Karena SQLite berbentuk file biner tunggal, prosedur backup sangat sederhana: petugas atau admin IT cukup menyalin file `rekam_medis.db` ke flashdisk eksternal atau penyimpanan cloud instansi. Untuk pemulihan (*restore*), file cadangan tersebut cukup disalin kembali ke direktori `AppData\Local` komputer baru."*

---

### Q6: Bagaimana SQLite menangani masalah penguncian file (*locking*) jika ada akses bersamaan?
**Jawaban**:
> *"SQLite menggunakan mekanisme file-locking internal. Pada sistem ini, seluruh kueri database diatur melalui koneksi tunggal (*singleton instance*) di `getDb()`, sehingga akses asinkron dari berbagai komponen React diantrekan secara berurutan dan teratur, mencegah terjadinya galat database terkunci (*database is locked*)."*
