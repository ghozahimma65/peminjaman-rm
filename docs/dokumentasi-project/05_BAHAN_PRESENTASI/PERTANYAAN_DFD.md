# Tanya Jawab: Pertanyaan DFD (Data Flow Diagram)

---

### Q1: Apa perbedaan mendasar antara DFD Level 0, Level 1, dan Level 2?
**Jawaban**:
> *"**DFD Level 0 (Context Diagram)** menggambarkan sistem secara keseluruhan sebagai satu proses tunggal untuk melihat batasan sistem dengan entitas luar. **DFD Level 1** memecah proses tunggal tersebut menjadi proses-proses fungsional utama (di sistem kami ada 7 proses) beserta data store yang digunakan. **DFD Level 2** mendekomposisi sub-proses spesifik (seperti proses login, peminjaman, pengembalian, dan laporan) menjadi langkah-langkah penanganan data yang sangat detail."*

---

### Q2: Mengapa `File System (OS)` dimasukkan sebagai Entitas Eksternal pada DFD?
**Jawaban**:
> *"Karena media penyimpanan file sistem operasi berada di luar kendali langsung logika proses aplikasi. Saat aplikasi mengekspor berkas Excel/PDF atau menyimpan file foto avatar, sistem berinteraksi dengan API sistem operasi untuk menyerahkan aliran biner data ke disk fisik komputer. Dalam metodologi rekayasa perangkat lunak, subsistem eksternal seperti I/O storage yang bertindak sebagai sumber input atau penyerap (*sink*) data dapat dimodelkan sebagai entitas eksternal."*

---

### Q3: Mengapa tidak ada Data Store pada DFD Level 0 (Context Diagram)?
**Jawaban**:
> *"Sesuai konvensi baku perancangan DFD (metodologi Gane-Sarson / DeMarco-Yourdon), Diagram Konteks hanya boleh memuat entitas luar, aliran data, dan satu proses utama sistem. Seluruh data store berada di dalam batasan sistem (*inside boundary*) sehingga baru boleh dimunculkan saat sistem didekomposisi pada Level 1."*

---

### Q4: Apa perbedaan esensial antara DFD dan Flowchart?
**Jawaban**:
> *"**Flowchart** berfokus pada **aliran kontrol algoritma dan urutan waktu langkah eksekusi** (ada percabangan logika 'IF/ELSE' dan perulangan 'LOOP'). Sedangkan **DFD** berfokus pada **aliran data dan transformasinya** (dari mana data berasal, diproses menjadi apa, dan ke mana data mengalir) tanpa memedulikan urutan waktu eksekusi kode."*

---

### Q5: Sebutkan 7 proses utama yang ada pada DFD Level 1 sistem ini!
**Jawaban**:
> *"Tujuh proses utama tersebut adalah:
> 1. `Proses 1.0`: Autentikasi & Manajemen Sesi
> 2. `Proses 2.0`: Manajemen Data RM & Pasien
> 3. `Proses 3.0`: Pengelolaan Peminjaman Berkas RM
> 4. `Proses 4.0`: Pengelolaan Pengembalian Berkas RM
> 5. `Proses 5.0`: Monitoring Notifikasi & Peringatan Dini
> 6. `Proses 6.0`: Pengolahan Laporan & Ekspor Dokumen
> 7. `Proses 7.0`: Manajemen Profil & Audit Log"*

---

### Q6: Bagaimana aliran data pada proses pengembalian di DFD Level 2?
**Jawaban**:
> *"Alirannya berawal dari input Nomor RM oleh Petugas $\rightarrow$ Sistem mencari peminjaman aktif di data store `peminjaman` dan `pengembalian` $\rightarrow$ Petugas memilih kondisi berkas fisik (BAIK/RUSAK) $\rightarrow$ Sistem memperbarui status peminjaman di data store `peminjaman` menjadi `'DIKEMBALIKAN'` $\rightarrow$ Sistem menyisipkan baris konfirmasi baru ke data store `pengembalian` $\rightarrow$ Sistem mengembalikan notifikasi sukses ke Petugas."*
