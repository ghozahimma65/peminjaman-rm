# DFD Level 2 — Proses 3.0: Pengelolaan Peminjaman Berkas RM

---

## Gambaran Proses 3.0

DFD Level 2 ini menguraikan alur validasi dan pencatatan transaksi peminjaman berkas rekam medis fisik pada modul **Peminjaman Baru** (`AjukanPeminjaman.tsx`) dan `peminjamanService.ts`.

---

## Diagram Mermaid DFD Level 2 — Peminjaman

```mermaid
flowchart TD
    %% Entitas
    E1["Petugas Rekam Medis"]

    %% Data Stores
    D3[("D3: data_rm")]
    D4[("D4: peminjaman")]
    D5[("D5: pengembalian")]

    %% Sub-Proses 3.0
    P3_1(("3.1<br/>Pencarian & Verifikasi<br/>Nomor RM Pasien"))
    P3_2(("3.2<br/>Validasi Status<br/>Ketersediaan Berkas"))
    P3_3(("3.3<br/>Validasi Kelengkapan<br/>Formulir Peminjaman"))
    P3_4(("3.4<br/>Penyimpanan Record<br/>Transaksi Peminjaman"))
    P3_5(("3.5<br/>Konfirmasi &<br/>Notifikasi Sukses"))

    %% Aliran Data
    E1 -->|"Input Nomor RM"| P3_1
    P3_1 -->|"Query: SELECT WHERE nomorRm = $1"| D3
    D3 -->|"Data Pasien (Nama, NIK, dll.)"| P3_1
    P3_1 -->|"Data Pasien Ditemukan (Auto-fill Form)"| E1
    
    %% Validasi Peminjaman Aktif
    P3_1 -->|"Nomor RM Terverifikasi"| P3_2
    P3_2 -->|"Query: Cek Peminjaman Aktif (status IN DIPINJAM, TERLAMBAT & belum kembali)"| D4
    D5 -->|"Data Record Pengembalian"| P3_2
    
    %% Kasus Berkas Sedang Dipinjam
    P3_2 -.->|"Berkas Masih Dipinjam Ruangan Lain"| E1
    
    %% Kasus Berkas Tersedia
    P3_2 -->|"Berkas Tersedia (TIDAK ADA Pinjaman Aktif)"| P3_3
    E1 -->|"Input Detail: Peminjam, Unit, Waktu Keluar, Jilid, Catatan"| P3_3
    
    %% Simpan Transaksi
    P3_3 -->|"Payload Data Peminjaman Valid"| P3_4
    P3_4 -->|"INSERT INTO peminjaman (status='DIPINJAM', createdAt=NOW)"| D4
    
    %% Output
    P3_4 -->|"ID Transaksi Baru"| P3_5
    P3_5 -->|"Pesan Konfirmasi Peminjaman Berhasil"| E1
```

---

## Rincian Sub-Proses

### 3.1 Pencarian & Verifikasi Nomor RM Pasien
- **Deskripsi**: Petugas menginputkan Nomor RM pada kolom pencarian formulir.
- **Query**: Membaca data store `D3: data_rm` (`SELECT nomorRm, namaPasien FROM data_rm WHERE nomorRm = $1`).
- **Output Aliran**: Jika ditemukan, nama pasien otomatis terisi pada formulir antarmuka. Jika tidak ditemukan, formulir memberikan opsi untuk mendaftarkan pasien baru ke master data terlebih dahulu.

### 3.2 Validasi Status Ketersediaan Berkas (`checkActivePeminjaman`)
- **Deskripsi**: Mencegah peminjaman ganda (*double borrowing*) pada berkas fisik yang sama.
- **Logika SQL**:
  ```sql
  SELECT p.* FROM peminjaman p
  LEFT JOIN pengembalian pg ON pg.peminjamanId = p.id
  WHERE p.nomorRm = $1
    AND p.status IN ('DIPINJAM', 'TERLAMBAT')
    AND pg.id IS NULL
  ORDER BY p.tanggalPinjam DESC LIMIT 1;
  ```
- **Kondisi Penolakan**: Jika query mengembalikan data peminjaman aktif, sistem menampilkan modal peringatan detail berisi nama unit peminjam saat ini, nama dokter/perawat peminjam, dan batas waktu pengembalian. Peminjaman baru untuk nomor RM tersebut diblokir.

### 3.3 Validasi Kelengkapan Formulir Peminjaman
- **Deskripsi**: Memastikan seluruh atribut wajib terisi:
  - `nomorRm` (Wajib)
  - `namaPeminjam` (Wajib, nama dokter/perawat)
  - `unit` (Wajib, pilihan dari salah satu daftar 22 unit ruangan)
  - `tanggalPinjam` (Wajib, format ISO timestamp)
  - `tanggalBerkasKeluar` (Waktu aktual fisik berkas keluar dari filing)
  - `jilid` (Opsional)
  - `catatan` (Opsional)

### 3.4 Penyimpanan Record Transaksi Peminjaman (`createPeminjaman`)
- **Deskripsi**: Menyimpan data peminjaman baru ke data store `D4: peminjaman`.
- **Query**:
  ```sql
  INSERT INTO peminjaman (
    nomorRm, namaPasien, peminjamId, namaPeminjam, unit,
    tanggalPinjam, tanggalBerkasKeluar, jilid, catatan, status, createdAt
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'DIPINJAM', CURRENT_TIMESTAMP);
  ```
- **Catatan**: Kolom `peminjamId` mencatat ID akun petugas rekam medis yang sedang aktif login sebagai operator pencatat transaksi.

### 3.5 Konfirmasi & Notifikasi Sukses
- **Deskripsi**: Mengembalikan pesan sukses ke antarmuka pengguna dan mengalihkan navigasi ke halaman **Daftar Peminjaman** (`DaftarPeminjaman.tsx`).
