# Struktur Fisik Tabel Basis Data (Data Dictionary)

---

## 1. Tabel: `users`
Menyimpan kredensial otentikasi, profil pengguna, dan hak akses otorisasi sistem.

### Kamus Data
| Nama Kolom | Tipe SQLite | Kunci / Constraint | Nilai Bawaan (Default) | Keterangan |
|---|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | - | ID unik internal pengguna |
| `nip` | `TEXT` | `UNIQUE NOT NULL` | - | Nomor Induk Pegawai unik |
| `email` | `TEXT` | `UNIQUE` | `NULL` | Alamat surat elektronik |
| `passwordHash` | `TEXT` | `NOT NULL` | - | Hash kata sandi bcrypt (cost factor 10) |
| `name` | `TEXT` | `NOT NULL` | - | Nama lengkap petugas |
| `role` | `TEXT` | `NOT NULL` | - | Hak akses: `'Super Admin'` atau `'PETUGAS'` |
| `avatarPath` | `TEXT` | - | `NULL` | Path relatif file foto profil di AppData |
| `createdAt` | `DATETIME` | - | `CURRENT_TIMESTAMP` | Waktu pendaftaran akun |
| `updatedAt` | `DATETIME` | - | `CURRENT_TIMESTAMP` | Waktu modifikasi data terakhir |

### DDL SQL
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nip TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  passwordHash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatarPath TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Tabel: `login_logs`
Mencatat jejak digital setiap upaya masuk (*login attempts*) untuk audit kepatuhan keamanan.

### Kamus Data
| Nama Kolom | Tipe SQLite | Kunci / Constraint | Nilai Bawaan (Default) | Keterangan |
|---|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | - | ID log audit |
| `userId` | `INTEGER` | `FOREIGN KEY(userId) REFERENCES users(id) ON DELETE SET NULL` | `NULL` | Referensi ke akun user yang mencoba login |
| `nip` | `TEXT` | `NOT NULL` | - | NIP yang diketikkan pada form |
| `loginTime` | `DATETIME` | - | `CURRENT_TIMESTAMP` | Waktu percobaan login |
| `status` | `TEXT` | - | - | Hasil percobaan: `'SUCCESS'` atau `'FAILED'` |

### DDL SQL
```sql
CREATE TABLE IF NOT EXISTS login_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  nip TEXT NOT NULL,
  loginTime DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT,
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 3. Tabel: `data_rm`
Menyimpan master data berkas rekam medis dan data kependudukan pasien.

### Kamus Data
| Nama Kolom | Tipe SQLite | Kunci / Constraint | Nilai Bawaan (Default) | Keterangan |
|---|---|---|---|---|
| `nomorRm` | `TEXT` | `PRIMARY KEY` | - | Nomor rekam medis fisik pasien (kunci utama) |
| `namaPasien` | `TEXT` | `NOT NULL` | - | Nama lengkap pasien |
| `nik` | `TEXT` | - | `NULL` | NIK KTP (wajib 16 digit angka jika diisi) |
| `jenisKelamin` | `TEXT` | - | `NULL` | Jenis kelamin pasien |
| `tanggalLahir` | `TEXT` | - | `NULL` | Tanggal lahir pasien (`YYYY-MM-DD`) |
| `alamat` | `TEXT` | - | `NULL` | Alamat domisili pasien |
| `createdAt` | `DATETIME` | - | `CURRENT_TIMESTAMP` | Waktu registrasi berkas RM |

### DDL SQL
```sql
CREATE TABLE IF NOT EXISTS data_rm (
  nomorRm TEXT PRIMARY KEY,
  namaPasien TEXT NOT NULL,
  nik TEXT,
  jenisKelamin TEXT,
  tanggalLahir TEXT,
  alamat TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Tabel: `peminjaman`
Menyimpan setiap transaksi peminjaman berkas rekam medis ke unit perawatan/poliklinik.

### Kamus Data
| Nama Kolom | Tipe SQLite | Kunci / Constraint | Nilai Bawaan (Default) | Keterangan |
|---|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | - | ID transaksi peminjaman |
| `tanggalPinjam` | `DATETIME` | - | `CURRENT_TIMESTAMP` | Waktu pengajuan transaksi |
| `tanggalBerkasKeluar` | `DATETIME` | - | `NULL` | Waktu fisik berkas diserahkan ke kurir/peminjam |
| `peminjamId` | `INTEGER` | `NOT NULL, FK -> users(id) ON DELETE RESTRICT` | - | Petugas filing yang memproses transaksi |
| `namaPeminjam` | `TEXT` | - | `NULL` | Nama dokter/perawat/petugas yang meminjam |
| `unit` | `TEXT` | `NOT NULL` | - | Nama unit/ruangan peminjam (salah satu dari 22 unit) |
| `nomorRm` | `TEXT` | `NOT NULL, FK -> data_rm(nomorRm) ON DELETE RESTRICT` | - | Nomor berkas RM yang dipinjam |
| `namaPasien` | `TEXT` | `NOT NULL` | - | Snapshot nama pasien saat peminjaman dibuat |
| `jilid` | `TEXT` | - | `NULL` | Penomoran volume/jilid berkas (opsional) |
| `catatan` | `TEXT` | - | `NULL` | Keterangan/alasan peminjaman berkas |
| `status` | `TEXT` | `NOT NULL` | - | Status dasar: `'DIPINJAM'`, `'DIKEMBALIKAN'`, `'TERLAMBAT'` |
| `createdAt` | `DATETIME` | - | `CURRENT_TIMESTAMP` | Waktu record pertama kali disimpan |
| `updatedAt` | `DATETIME` | - | `CURRENT_TIMESTAMP` | Waktu pembaruan status |

### DDL SQL
```sql
CREATE TABLE IF NOT EXISTS peminjaman (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tanggalPinjam DATETIME DEFAULT CURRENT_TIMESTAMP,
  tanggalBerkasKeluar DATETIME,
  peminjamId INTEGER NOT NULL,
  namaPeminjam TEXT,
  unit TEXT NOT NULL,
  nomorRm TEXT NOT NULL,
  namaPasien TEXT NOT NULL,
  jilid TEXT,
  catatan TEXT,
  status TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(peminjamId) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(nomorRm) REFERENCES data_rm(nomorRm) ON DELETE RESTRICT
);
```

---

## 5. Tabel: `pengembalian`
Mencatat konfirmasi fisik saat berkas rekam medis diserahkan kembali ke unit filing.

### Kamus Data
| Nama Kolom | Tipe SQLite | Kunci / Constraint | Nilai Bawaan (Default) | Keterangan |
|---|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | - | ID record pengembalian |
| `peminjamanId` | `INTEGER` | `UNIQUE NOT NULL, FK -> peminjaman(id) ON DELETE RESTRICT` | - | Relasi unik 1-ke-1 ke transaksi peminjaman |
| `tanggalBerkasKembali` | `DATETIME` | - | `CURRENT_TIMESTAMP` | Timestamp penerimaan kembali berkas |
| `dikembalikanOlehId` | `INTEGER` | `NOT NULL, FK -> users(id) ON DELETE RESTRICT` | - | Petugas filing yang menerima berkas fisik |
| `konfirmasiKembali` | `BOOLEAN` | - | `0` | Flag validasi penerimaan fisik |
| `kondisiBerkas` | `TEXT` | `NOT NULL` | `'BAIK'` | Evaluasi kondisi fisik: `'BAIK'` atau `'RUSAK'` |
| `createdAt` | `DATETIME` | - | `CURRENT_TIMESTAMP` | Waktu pencatatan pengembalian |
| `updatedAt` | `DATETIME` | - | `CURRENT_TIMESTAMP` | Waktu update data pengembalian |

### DDL SQL
```sql
CREATE TABLE IF NOT EXISTS pengembalian (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  peminjamanId INTEGER UNIQUE NOT NULL,
  tanggalBerkasKembali DATETIME DEFAULT CURRENT_TIMESTAMP,
  dikembalikanOlehId INTEGER NOT NULL,
  konfirmasiKembali BOOLEAN DEFAULT 0,
  kondisiBerkas TEXT NOT NULL DEFAULT 'BAIK',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(peminjamanId) REFERENCES peminjaman(id) ON DELETE RESTRICT,
  FOREIGN KEY(dikembalikanOlehId) REFERENCES users(id) ON DELETE RESTRICT
);
```

---

## 6. Tabel: `notifications`
Menyimpan antrean pesan peringatan dini bagi petugas rekam medis terkait batas waktu pengembalian.

### Kamus Data
| Nama Kolom | Tipe SQLite | Kunci / Constraint | Nilai Bawaan (Default) | Keterangan |
|---|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | - | ID baris notifikasi |
| `type` | `TEXT` | `NOT NULL` | - | Kategori: `'REMINDER'` ($\le$ 24 jam) atau `'TERLAMBAT'` ($> 48$ jam) |
| `peminjamanId` | `INTEGER` | `NOT NULL, FK -> peminjaman(id) ON DELETE CASCADE` | - | Relasi ke transaksi peminjaman terkait |
| `message` | `TEXT` | `NOT NULL` | - | Pesan teks ringkas pengingat |
| `isRead` | `BOOLEAN` | `NOT NULL` | `0` | Status dibaca: `0` (belum), `1` (sudah) |
| `createdAt` | `DATETIME` | - | `CURRENT_TIMESTAMP` | Waktu peringatan diterbitkan |

### DDL SQL
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  peminjamanId INTEGER NOT NULL,
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(peminjamanId) REFERENCES peminjaman(id) ON DELETE CASCADE
);
```
