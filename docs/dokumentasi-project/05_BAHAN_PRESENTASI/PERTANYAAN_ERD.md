# Tanya Jawab: Pertanyaan ERD (Entity Relationship Diagram)

---

### Q1: Apa perbedaan mendasar antara DFD dan ERD?
**Jawaban**:
> *"**DFD (Data Flow Diagram)** memodelkan aspek fungsional sistem yaitu **aliran dan transformasi data melalui proses**. Sedangkan **ERD (Entity Relationship Diagram)** memodelkan aspek struktural statis sistem yaitu **entitas data, atribut, tipe data, kardinalitas relasi, dan batasan integritas basis data**."*

---

### Q2: Mengapa relasi antara `peminjaman` dan `pengembalian` adalah 1-ke-1 (One-to-One)?
**Jawaban**:
> *"Karena secara logika operasional, satu transaksi peminjaman fisik hanya boleh diselesaikan oleh tepat satu kali penerimaan berkas kembali. Penegakan 1-ke-1 ini diimplementasikan di tingkat skema fisik database melalui penambahan batasan:
> `peminjamanId INTEGER UNIQUE NOT NULL` pada tabel `pengembalian`. Dengan constraint `UNIQUE`, mesin basis data SQLite secara fisik menolak jika ada lebih dari satu baris pengembalian yang merujuk pada transaksi peminjaman yang sama."*

---

### Q3: Mengapa pada tabel `peminjaman` terdapat kolom `namaPasien`, padahal sudah memiliki Foreign Key `nomorRm` ke tabel `data_rm`? Bukankah ini redundan / melanggar bentuk normal ketiga (3NF)?
**Jawaban**:
> *"Secara teori normalisasi murni, hal ini tampak denormalisasi. Namun dalam rekayasa sistem rekam medis, ini adalah pola desain **Snapshot Data (Histori Abadi)**. Jika sewaktu-waktu data nama pasien di master data mengalami koreksi ejaan atau perubahan status hukum kependudukan, arsip transaksi peminjaman masa lalu tetap menyimpan nama pasien persis seperti yang tertulis pada saat dokumen tersebut dipinjam. Selain itu, cara ini mengoptimalkan performa kueri transaksi harian tanpa perlu operasi `JOIN` berulang."*

---

### Q4: Mengapa tabel `data_rm` menggunakan `nomorRm` bertipe `TEXT` sebagai Primary Key, bukan `id INTEGER AUTOINCREMENT`?
**Jawaban**:
> *"Karena di dunia rekam medis, **Nomor Rekam Medis adalah Natural Key** yang sudah dijamin unik secara universal di rumah sakit dan tercetak secara fisik pada map dokumen pasien (misal format `RM-DEV-0001` atau `01-23-45`). Menggunakan Natural Key sebagai Primary Key menghilangkan kebutuhan surrogate key buatan, mempermudah pelacakan fisik, dan mempercepat pencarian langsung."*

---

### Q5: Jelaskan mengapa pada relasi `notifications` diterapkan aturan `ON DELETE CASCADE`!
**Jawaban**:
> *"Notifikasi adalah entitas pelengkap yang masa hidupnya terikat langsung dengan status transaksi peminjaman. Jika suatu baris peminjaman dihapus dari sistem (misalnya saat pembatalan transaksi oleh supervisor), baris-baris notifikasi peringatan yang terkait tidak lagi memiliki relevansi operasional. Dengan `ON DELETE CASCADE`, SQLite secara otomatis menghapus notifikasi tersebut sehingga database bebas dari baris sampah (*orphaned records*)."*

---

### Q6: Mengapa pada relasi `peminjaman` ke `users` diterapkan aturan `ON DELETE RESTRICT`?
**Jawaban**:
> *"Aturan `ON DELETE RESTRICT` diterapkan demi menjaga **akuntabilitas legalitas arsip medis**. Jika seorang petugas rekam medis yang pernah mencatat peminjaman berkas hendak dihapus akunnya oleh admin, database akan menolaknya. Hal ini mencegah hilangnya jejak siapa operator yang bertanggung jawab mengeluarkan berkas rekam medis tersebut."*
