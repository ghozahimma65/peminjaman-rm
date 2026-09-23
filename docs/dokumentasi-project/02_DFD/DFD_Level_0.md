# DFD Level 0 — Diagram Konteks (Context Diagram)

---

## Gambaran Diagram Konteks

Diagram Konteks mendefinisikan batasan terluar (*system boundary*) dari aplikasi **Filing Rekam Medis**, memetakan seluruh entitas eksternal yang berinteraksi langsung dengan sistem beserta aliran input data yang diberikan dan aliran informasi output yang diterima.

---

## Diagram Mermaid DFD Level 0

```mermaid
flowchart TD
    %% Entitas Eksternal
    E1["Petugas Rekam Medis"]
    E2["Super Admin"]
    E3["File System (OS Local)"]

    %% Proses Tunggal
    P0(("0.0<br/>Sistem Informasi<br/>Filing Rekam Medis<br/>(RSISA)"))

    %% Aliran Data Petugas
    E1 -->|"1. Kredensial Login (NIP, Password)<br/>2. Data Registrasi Pasien (NIK, Nama, Alamat, dll.)<br/>3. Data Peminjaman (Nomor RM, Peminjam, Unit, Waktu)<br/>4. Data Pengembalian (Nomor RM, Kondisi Berkas)<br/>5. Parameter Filter Laporan (Tanggal, Unit, Status)<br/>6. Update Profil (Nama, Email, Password, Foto)"| P0

    P0 -->|"1. Status Sesi & Hak Akses<br/>2. Data Master RM & Status Ketersediaan<br/>3. Status Transaksi & Riwayat Berkas<br/>4. Notifikasi Peringatan (Reminder & Terlambat)<br/>5. Preview Laporan & Rekapitulasi"| E1

    %% Aliran Data Super Admin
    E2 -->|"1. Kredensial Super Admin<br/>2. Permintaan Tinjauan Log Audit Login<br/>3. Permintaan Pengaturan Sistem"| P0

    P0 -->|"1. Laporan Log Audit Aktivitas Login<br/>2. Ringkasan Pengaturan & Metrik Sistem"| E2

    %% Aliran Data File System
    E3 -->|"1. File Gambar Avatar (Binary Stream)"| P0
    P0 -->|"1. Dokumen Laporan Excel (.xlsx)<br/>2. Dokumen Laporan PDF Resmi (.pdf)<br/>3. File Avatar Tersimpan (AppData/avatars)"| E3
```

---

## Penjelasan Entitas Eksternal dan Aliran Data

### 1. Entitas: Petugas Rekam Medis
Pengguna operasional harian di bagian depo filing rekam medis.
- **Input ke Sistem**:
  - `Kredensial Login`: NIP dan password akun.
  - `Data Registrasi Pasien`: Nomor RM, Nama Pasien, NIK 16 digit, Jenis Kelamin, Tanggal Lahir, Alamat.
  - `Data Peminjaman`: Nomor RM, Nama Peminjam, Unit Ruangan, Tanggal Pinjam, Tanggal Berkas Keluar, Jilid, Catatan.
  - `Data Pengembalian`: Nomor RM, Kondisi Berkas (BAIK / RUSAK).
  - `Parameter Filter Laporan`: Rentang tanggal, unit ruangan, status berkas.
  - `Pembaruan Profil`: Nama, Email, Password baru, dan unggahan foto.
- **Output dari Sistem**:
  - `Status Sesi & Hak Akses`: Token sesi lokal dan peran akun.
  - `Data Master RM`: Informasi identitas pasien dan ketersediaan berkas fisik.
  - `Status Transaksi & Riwayat`: Riwayat audit sirkulasi berkas secara kronologis.
  - `Notifikasi Peringatan`: Peringatan 24 jam menjelang batas waktu dan peringatan berkas terlambat.
  - `Preview Rekapitulasi`: Ringkasan peminjaman, pengembalian, dan kepatuhan per ruangan.

### 2. Entitas: Super Admin
Pengguna tingkat administrator dengan kewenangan pengawasan dan pemeliharaan.
- **Input ke Sistem**:
  - `Kredensial Super Admin`: NIP `superadmin` dan kata sandi verifikasi.
  - `Permintaan Log Audit`: Perintah untuk memeriksa catatan aktivitas login.
- **Output dari Sistem**:
  - `Laporan Log Audit`: Daftar seluruh riwayat percobaan login (sukses dan gagal) beserta timestamp dan NIP terkait.

### 3. Entitas: File System (OS Local)
Subsistem penyimpanan file pada komputer lokal pengguna yang diakses melalui API Tauri Plugin FS dan Dialog.
- **Input ke Sistem**:
  - File gambar mentah yang dipilih pengguna untuk foto profil.
- **Output dari Sistem**:
  - Berkas fisik Microsoft Excel (`.xlsx`) hasil ekspor laporan rekapitulasi.
  - Berkas fisik dokumen PDF (`.pdf`) hasil ekspor berita acara peminjaman.
  - Berkas foto profil yang disimpan ke direktori lokal aplikasi (`AppData/avatars/`).
