# DFD Level 1 — Dekomposisi Sistem

---

## Gambaran DFD Level 1

DFD Level 1 mendekomposisi proses utama sistem filing menjadi **7 sub-proses fungsional**, menunjukkan secara transparan bagaimana data dipertukarkan antara entitas eksternal, proses pengolahan, dan 6 data store logis.

---

## Diagram Mermaid DFD Level 1

```mermaid
flowchart TD
    %% Entitas Eksternal
    E1["Petugas Rekam Medis"]
    E2["Super Admin"]
    E3["File System (OS)"]

    %% Data Stores
    D1[("D1: users")]
    D2[("D2: login_logs")]
    D3[("D3: data_rm")]
    D4[("D4: peminjaman")]
    D5[("D5: pengembalian")]
    D6[("D6: notifications")]

    %% Proses-Proses
    P1(("1.0<br/>Autentikasi &<br/>Manajemen Sesi"))
    P2(("2.0<br/>Manajemen Data RM<br/>& Pasien"))
    P3(("3.0<br/>Pengelolaan Peminjaman<br/>Berkas RM"))
    P4(("4.0<br/>Pengelolaan Pengembalian<br/>Berkas RM"))
    P5(("5.0<br/>Monitoring Notifikasi<br/>& Peringatan Dini"))
    P6(("6.0<br/>Pengolahan Laporan<br/>& Ekspor Dokumen"))
    P7(("7.0<br/>Manajemen Profil &<br/>Audit Log"))

    %% Aliran Proses 1.0 (Autentikasi)
    E1 -->|"Kredensial Login (NIP, Password)"| P1
    E2 -->|"Kredensial Super Admin"| P1
    P1 -->|"Data Verifikasi User"| D1
    D1 -->|"Password Hash, Role"| P1
    P1 -->|"Pencatatan Log Login"| D2
    P1 -->|"Objek Sesi Pengguna"| E1
    P1 -->|"Objek Sesi Super Admin"| E2

    %% Aliran Proses 2.0 (Master Data RM)
    E1 -->|"Data Pasien Baru, Keyword Cari"| P2
    P2 -->|"Insert Record Pasien"| D3
    D3 -->|"Informasi Pasien"| P2
    D4 -->|"Status Berkas Dipinjam"| P2
    P2 -->|"Daftar Master RM & Metrik"| E1

    %% Aliran Proses 3.0 (Peminjaman)
    E1 -->|"Formulir Peminjaman (RM, Peminjam, Unit, Waktu)"| P3
    D3 -->|"Verifikasi Keberadaan Berkas"| P3
    D4 -->|"Cek Peminjaman Aktif"| P3
    D5 -->|"Cek Status Pengembalian"| P3
    P3 -->|"Insert Data Peminjaman"| D4
    P3 -->|"Konfirmasi Peminjaman Berhasil"| E1

    %% Aliran Proses 4.0 (Pengembalian)
    E1 -->|"Nomor RM, Kondisi Berkas (BAIK/RUSAK)"| P4
    D4 -->|"Data Peminjaman Aktif"| P4
    P4 -->|"Update Status Peminjaman"| D4
    P4 -->|"Insert Record Pengembalian"| D5
    P4 -->|"Konfirmasi Pengembalian Berhasil"| E1

    %% Aliran Proses 5.0 (Notifikasi)
    D4 -->|"Data Peminjaman Aktif"| P5
    D5 -->|"Data Berkas Kembali"| P5
    P5 -->|"Auto-Cleanup Notifikasi Kembali"| D6
    P5 -->|"Insert Peringatan (Reminder / Terlambat)"| D6
    P5 -->|"Update Status Overdue 'TERLAMBAT'"| D4
    D6 -->|"List Notifikasi & Unread Count"| P5
    P5 -->|"Badge Peringatan & Antrean Pesan"| E1

    %% Aliran Proses 6.0 (Laporan & Ekspor)
    E1 -->|"Filter (Unit, Tanggal, Status)"| P6
    D4 -->|"Data Peminjaman"| P6
    D5 -->|"Data Pengembalian"| P6
    D1 -->|"Nama Petugas Pelapor"| P6
    P6 -->|"Tabel Ringkasan Rekapitulasi"| E1
    P6 -->|"File Excel .xlsx & PDF .pdf"| E3

    %% Aliran Proses 7.0 (Profil & Audit)
    E1 -->|"Update Nama, Email, Password, Avatar"| P7
    E3 -->|"File Binary Foto Avatar"| P7
    P7 -->|"Update User, Hash Baru, Avatar Path"| D1
    P7 -->|"Simpan File Avatar ke AppData"| E3
    E2 -->|"Permintaan Log Audit"| P7
    D2 -->|"Data Riwayat Login"| P7
    P7 -->|"Tabel Log Audit Login"| E2
```

---

## Deskripsi Rinci Sub-Proses

### Proses 1.0: Autentikasi & Manajemen Sesi
- **Tujuan**: Memverifikasi identitas pengguna, mengamankan hak akses, dan mencatat riwayat masuk ke sistem.
- **Input**: NIP dan password teks polos.
- **Penyimpanan Terlibat**: Membaca `D1: users`, menulis log percobaan ke `D2: login_logs`.
- **Output**: Sesi pengguna terotentikasi berisi ID, NIP, Nama, dan Peran (*Role*).

### Proses 2.0: Manajemen Data RM & Pasien
- **Tujuan**: Mendaftarkan identitas pasien baru, memvalidasi NIK 16 digit, dan menampilkan daftar master rekam medis beserta status ketersediaan fisiknya.
- **Input**: Nomor RM, NIK, Nama Pasien, Jenis Kelamin, Tanggal Lahir, Alamat.
- **Penyimpanan Terlibat**: Menulis dan membaca `D3: data_rm`, membaca `D4: peminjaman` untuk menghitung total peminjaman dan ketersediaan berkas.
- **Output**: Daftar master RM teragregasi dan ringkasan metrik statistik.

### Proses 3.0: Pengelolaan Peminjaman Berkas RM
- **Tujuan**: Memvalidasi ketersediaan fisik berkas (memastikan berkas tidak sedang dipinjam oleh ruangan lain) dan mencatat transaksi peminjaman baru.
- **Input**: Nomor RM, Nama Peminjam, Unit Ruangan, Tanggal Pinjam, Tanggal Berkas Keluar, Jilid, Catatan.
- **Penyimpanan Terlibat**: Membaca `D3: data_rm`, membaca `D4: peminjaman` & `D5: pengembalian`, menulis transaksi baru ke `D4: peminjaman`.
- **Output**: Konfirmasi peminjaman berhasil atau notifikasi penolakan peminjaman ganda.

### Proses 4.0: Pengelolaan Pengembalian Berkas RM
- **Tujuan**: Memproses pengembalian fisik berkas, mencatat kondisi (BAIK/RUSAK), dan mengupdate status peminjaman secara aman (*transactional rollback*).
- **Input**: Nomor RM yang dikembalikan, pilihan kondisi berkas.
- **Penyimpanan Terlibat**: Membaca dan memperbarui status pada `D4: peminjaman`, menyisipkan record pengembalian ke `D5: pengembalian`.
- **Output**: Bukti konfirmasi berkas telah diterima kembali di depo filing.

### Proses 5.0: Monitoring Notifikasi & Peringatan Dini
- **Tujuan**: Melakukan sinkronisasi waktu pasif terhadap batas waktu 48 jam, membersihkan notifikasi berkas yang telah kembali, dan memicu peringatan REMINDER ($\le$ 24 jam) atau TERLAMBAT ($> 48$ jam).
- **Input**: Timestamp waktu berjalan sistem komputer.
- **Penyimpanan Terlibat**: Membaca `D4: peminjaman` & `D5: pengembalian`, memutakhirkan status peminjaman pada `D4: peminjaman`, mengelola baris antrean pada `D6: notifications`.
- **Output**: Tampilan badge lonceng belum dibaca dan daftar pesan pengingat di antarmuka pengguna.

### Proses 6.0: Pengolahan Laporan & Ekspor Dokumen
- **Tujuan**: Menghasilkan rekapitulasi kepatuhan peminjaman per ruangan dan mengekspor dokumen resmi bertanda tangan.
- **Input**: Parameter filter rentang tanggal, unit ruangan, dan status berkas.
- **Penyimpanan Terlibat**: Membaca data relasi dari `D4: peminjaman`, `D5: pengembalian`, dan `D1: users`.
- **Output**: Tampilan tabel rekapitulasi di layar, file Microsoft Excel (`.xlsx`), dan dokumen cetak Adobe PDF (`.pdf`) yang tersimpan di media penyimpanan pengguna (`E3: File System`).

### Proses 7.0: Manajemen Profil & Audit Log
- **Tujuan**: Mengelola informasi akun pengguna, fasilitas ubah kata sandi, penyimpanan avatar ke folder lokal aplikasi, serta penyajian riwayat audit log bagi Super Admin.
- **Input**: Data profil baru, password lama & baru, file gambar profil, filter log.
- **Penyimpanan Terlibat**: Memperbarui `D1: users`, membaca `D2: login_logs`, membaca/menulis file fisik di `E3: File System`.
- **Output**: Profil terbarui dan tabel rekapitulasi audit login.
