# Tanya Jawab: Pertanyaan Modul Peminjaman (Borrowing Questions)

---

### Q1: Apa saja syarat agar suatu berkas rekam medis dapat dipinjam?
**Jawaban**:
> *"Suatu berkas rekam medis dapat dipinjam apabila memenuhi 3 syarat:
> 1. Nomor RM terdaftar dalam master data (`data_rm`).
> 2. Berkas fisik sedang berada di depo filing (tidak sedang dipinjam oleh ruangan lain / tidak ada record aktif di tabel `peminjaman`).
> 3. Formulir peminjaman terisi lengkap: Nomor RM, Nama Peminjam (Dokter/Perawat), Unit Ruangan, dan Tanggal Pinjam."*

---

### Q2: Bagaimana sistem mencegah terjadinya peminjaman ganda (*double borrowing*) pada berkas yang sama?
**Jawaban**:
> *"Sistem menerapkan validasi berlapis (*Defense-in-Depth*):
> 1. **Di Antarmuka UI**: Saat petugas mengetikkan Nomor RM di form peminjaman, fungsi `checkActivePeminjaman(nomorRm)` langsung dieksekusi. Jika berkas sedang dipinjam, sistem menampilkan modal peringatan detail berisi nama unit peminjam dan memblokir tombol submit.
> 2. **Di Service Layer**: Di dalam fungsi `createPeminjaman()`, kueri verifikasi pinjaman aktif dijalankan ulang tepat sebelum `INSERT`. Jika ada transaksi terbuka, eksekusi query langsung dibatalkan dengan melempar Error."*

---

### Q3: Apa perbedaan antara kolom `tanggalPinjam` dan `tanggalBerkasKeluar`?
**Jawaban**:
> *"**`tanggalPinjam`** adalah waktu ketika permohonan peminjaman berkas dicatat ke dalam sistem komputer oleh petugas filing. Sedangkan **`tanggalBerkasKeluar`** adalah waktu aktual ketika dokumen fisik rekam medis benar-benar diserahkan kepada kurir atau diambil oleh petugas ruangan. Pembedaan ini penting karena batas waktu pengembalian 48 jam dihitung sejak berkas fisik meninggalkan ruang penyimpanan arsip."*

---

### Q4: Apa perbedaan antara kolom `peminjamId` dan `namaPeminjam` pada tabel `peminjaman`?
**Jawaban**:
> *"**`peminjamId`** adalah Foreign Key ke tabel `users(id)` yang mencatat akun **petugas rekam medis** yang sedang aktif login dan memproses transaksi di komputer filing. Sedangkan **`namaPeminjam`** adalah kolom teks yang mencatat nama **dokter, perawat, atau staf ruangan** yang secara fisik mengajukan peminjaman berkas tersebut."*

---

### Q5: Dari mana daftar 22 unit ruangan peminjam berasal dan apakah dapat ditambah langsung melalui aplikasi?
**Jawaban**:
> *"Daftar 22 unit ruangan (seperti ICU, Mawar, Naim, PICU, NICU, VK, dll.) saat ini didefinisikan sebagai konstanta baku pada berkas `constants.ts` (`RUANGAN_OPTIONS`). Sesuai batasan sistem saat ini, penambahan ruangan baru belum dapat dilakukan melalui antarmuka dinamis, melainkan memerlukan pembaruan kode dan kompilasi ulang."*

---

### Q6: Apa yang terjadi jika berkas rekam medis yang dipinjam tidak pernah dikembalikan ke ruang filing?
**Jawaban**:
> *"Sistem akan terus menandai berkas tersebut dengan status `'TERLAMBAT'`, memunculkan notifikasi keterlambatan berulang di lonceng notifikasi, menampilkannya pada tabel rekapitulasi keterlambatan per ruangan, dan secara permanen memblokir peminjaman baru untuk nomor RM tersebut hingga berkas fisik dikonfirmasi kembali di menu Pengembalian."*
