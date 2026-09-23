# Entity Relationship Diagram (ERD)

---

## Diagram Konseptual Relasi Entitas

Diagram di bawah ini menggambarkan seluruh relasi antar entitas dalam basis data SQLite aplikasi **Filing Rekam Medis** RSI Sultan Agung Semarang:

```mermaid
erDiagram
    users ||--o{ login_logs : "memiliki"
    users ||--o{ peminjaman : "mencatat"
    users ||--o{ pengembalian : "menerima"
    data_rm ||--o{ peminjaman : "dipinjam_dalam"
    peminjaman ||--o| pengembalian : "diselesaikan_oleh"
    peminjaman ||--o{ notifications : "memicu"

    users {
        INTEGER id PK "AUTOINCREMENT"
        TEXT nip UK "Nomor Induk Pegawai"
        TEXT email UK "Alamat Email"
        TEXT passwordHash "Hash Bcrypt Salt 10"
        TEXT name "Nama Lengkap"
        TEXT role "Super Admin / PETUGAS"
        TEXT avatarPath "Path Foto di AppData"
        DATETIME createdAt "Waktu Dibuat"
        DATETIME updatedAt "Waktu Diubah"
    }

    login_logs {
        INTEGER id PK "AUTOINCREMENT"
        INTEGER userId FK "users.id (ON DELETE SET NULL)"
        TEXT nip "NIP Percobaan Masuk"
        DATETIME loginTime "Timestamp Login"
        TEXT status "SUCCESS / FAILED"
    }

    data_rm {
        TEXT nomorRm PK "Nomor Rekam Medis Unik"
        TEXT namaPasien "Nama Lengkap Pasien"
        TEXT nik "NIK 16 Digit Angka"
        TEXT jenisKelamin "Laki-laki / Perempuan"
        TEXT tanggalLahir "Format YYYY-MM-DD"
        TEXT alamat "Alamat Pasien"
        DATETIME createdAt "Waktu Registrasi"
    }

    peminjaman {
        INTEGER id PK "AUTOINCREMENT"
        DATETIME tanggalPinjam "Waktu Peminjaman"
        DATETIME tanggalBerkasKeluar "Waktu Berkas Keluar"
        INTEGER peminjamId FK "users.id (ON DELETE RESTRICT)"
        TEXT namaPeminjam "Dokter / Perawat"
        TEXT unit "Ruangan Peminjam"
        TEXT nomorRm FK "data_rm.nomorRm (ON DELETE RESTRICT)"
        TEXT namaPasien "Nama Pasien Snapshot"
        TEXT jilid "Nomor Jilid Berkas"
        TEXT catatan "Catatan Keperluan"
        TEXT status "DIPINJAM / DIKEMBALIKAN / TERLAMBAT"
        DATETIME createdAt "Waktu Record Dibuat"
        DATETIME updatedAt "Waktu Record Diubah"
    }

    pengembalian {
        INTEGER id PK "AUTOINCREMENT"
        INTEGER peminjamanId UK_FK "peminjaman.id (UNIQUE, ON DELETE RESTRICT)"
        DATETIME tanggalBerkasKembali "Waktu Fisik Diterima"
        INTEGER dikembalikanOlehId FK "users.id (ON DELETE RESTRICT)"
        BOOLEAN konfirmasiKembali "Flag Konfirmasi (1)"
        TEXT kondisiBerkas "BAIK / RUSAK"
        DATETIME createdAt "Waktu Dibuat"
        DATETIME updatedAt "Waktu Diubah"
    }

    notifications {
        INTEGER id PK "AUTOINCREMENT"
        TEXT type "REMINDER / TERLAMBAT"
        INTEGER peminjamanId FK "peminjaman.id (ON DELETE CASCADE)"
        TEXT message "Pesan Deskripsi"
        BOOLEAN isRead "0: Belum Dibaca, 1: Dibaca"
        DATETIME createdAt "Waktu Terbit"
    }
```

---

## Analisis Kardinalitas dan Karakteristik Relasi

### 1. `users` ke `login_logs` (One-to-Many / $1 : N$)
- Satu pengguna dapat memiliki **banyak** catatan riwayat login sepanjang penggunaan aplikasi.
- Satu baris riwayat login merujuk ke **tepat satu** akun pengguna (atau `NULL` jika login dicoba dengan NIP yang tidak terdaftar di sistem).

### 2. `users` ke `peminjaman` (One-to-Many / $1 : N$)
- Satu akun petugas rekam medis dapat bertindak sebagai operator pencatat untuk **banyak** transaksi peminjaman berkas.
- Setiap baris transaksi peminjaman dicatat oleh **tepat satu** operator petugas rekam medis aktif (`peminjamId`).

### 3. `users` ke `pengembalian` (One-to-Many / $1 : N$)
- Satu akun petugas dapat mengonfirmasi penerimaan kembali **banyak** berkas rekam medis.
- Setiap pengembalian dicatat dan disahkan oleh **tepat satu** petugas penerima (`dikembalikanOlehId`).

### 4. `data_rm` ke `peminjaman` (One-to-Many / $1 : N$)
- Satu berkas rekam medis pasien dapat dipinjam **berkali-kali** sepanjang waktu (riwayat sirkulasi kumulatif).
- Namun, secara aturan bisnis aplikasi (*business logic*), berkas yang sama **hanya dapat memiliki satu transaksi peminjaman aktif** pada satu satuan waktu. Transaksi peminjaman baru hanya dapat dibuat jika transaksi peminjaman sebelumnya telah memiliki pasangan di tabel `pengembalian`.

### 5. `peminjaman` ke `pengembalian` (One-to-One / $1 : 1$)
- Setiap baris transaksi peminjaman hanya boleh diselesaikan oleh **maksimal satu** baris pengembalian.
- Penegakan integritas ini dijamin secara fisik di level skema basis data melalui constraint `peminjamanId INTEGER UNIQUE NOT NULL` pada tabel `pengembalian`.

### 6. `peminjaman` ke `notifications` (One-to-Many / $1 : N$)
- Satu transaksi peminjaman dapat memicu **beberapa** notifikasi (misalnya mula-mula menerbitkan notifikasi `REMINDER`, lalu jika berkas belum dikembalikan melampaui 48 jam, menerbitkan notifikasi `TERLAMBAT`).
- Relasi menerapkan aksi referensial `ON DELETE CASCADE`. Jika suatu transaksi peminjaman dihapus, seluruh notifikasi terkait akan dihapus secara otomatis.
