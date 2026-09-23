# Tanya Jawab: Pertanyaan Modul Pengembalian (Return Questions)

---

### Q1: Bagaimana alur kerja petugas saat memproses pengembalian berkas rekam medis?
**Jawaban**:
> *"1. Petugas membuka menu **Pengembalian $\rightarrow$ Proses Pengembalian**.
> 2. Petugas menginputkan Nomor RM yang dikembalikan.
> 3. Sistem memanggil `findActivePeminjamanByRm(nomorRm)` untuk memuat detail berkas yang sedang dipinjam.
> 4. Petugas memeriksa kondisi fisik map dan berkas di dalamnya, lalu memilih kondisi: `BAIK` atau `RUSAK`.
> 5. Petugas mengklik tombol **Konfirmasi Pengembalian**.
> 6. Sistem memvalidasi integritas waktu, memperbarui status peminjaman, menyisipkan rekaman pengembalian, dan menampilkan pesan sukses."*

---

### Q2: Bagaimana sistem menentukan apakah suatu pengembalian tepat waktu atau terlambat?
**Jawaban**:
> *"Penentuan status dilakukan melalui fungsi `calculateEffectiveStatus()`:
> - Batas waktu (*deadline*) dihitung dari: `tanggalBerkasKeluar + 48 jam`.
> - Jika waktu aktual berkas kembali (`tanggalBerkasKembali`) lebih besar dari batas deadline, transaksi diklasifikasikan sebagai **`TERLAMBAT`**.
> - Jika waktu kembali kurang dari atau sama dengan deadline, transaksi diklasifikasikan sebagai **`DIKEMBALIKAN`** (tepat waktu)."*

---

### Q3: Mengapa sistem mencatat kondisi fisik berkas (BAIK / RUSAK)?
**Jawaban**:
> *"Dokumen rekam medis adalah dokumen hukum berkekuatan autentik. Mencatat kondisi fisik dokumen saat diterima kembali di depo filing berfungsi untuk memantau pemeliharaan fisik dokumen serta memberikan dasar investigasi apabila ada berkas rekam medis yang robek, basah, atau lembarannya hilang selama berada di ruang perawatan."*

---

### Q4: Bagaimana mekanisme pencegahan transaksi pengembalian ganda (*duplicate return*)?
**Jawaban**:
> *"Tabel `pengembalian` memiliki batasan fisik:
> `peminjamanId INTEGER UNIQUE NOT NULL`.
> Jika terjadi klik ganda (*double click*) pada tombol konfirmasi, permintaan kedua akan langsung ditolak oleh SQLite karena melanggar batasan `UNIQUE`. Sistem kemudian menangkap galat tersebut dan menampilkan pesan informatif: *'Berkas ini sudah dikembalikan (duplikasi transaksi)'*."*

---

### Q5: Jelaskan mekanisme *Rollback* manual jika proses pengembalian mengalami kegagalan di tengah jalan!
**Jawaban**:
> *"Pada fungsi `processPengembalian()`, jika setelah status peminjaman diubah menjadi `'DIKEMBALIKAN'` terjadi galat saat menyimpan ke tabel `pengembalian`, blok `catch` akan mengeksekusi dua tindakan pemulihan:
> 1. Menghapus rekaman parsial di tabel pengembalian: `DELETE FROM pengembalian WHERE id = $insertedReturnId`.
> 2. Mengembalikan status transaksi ke semula: `UPDATE peminjaman SET status = 'DIPINJAM' WHERE id = $peminjamanId`.
> Cara ini menjamin basis data kembali ke status konsisten dan tidak ada data menggantung."*
