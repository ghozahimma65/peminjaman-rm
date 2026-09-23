# 15 — Database

Berdasarkan `src/lib/database/schema.ts` dan `src/lib/database/index.ts`.

---

## Teknologi Database

- **Engine**: SQLite
- **Akses**: via Tauri plugin (`@tauri-apps/plugin-sql ^2.4.1`)
- **File**: `rekam_medis.db` (lokal di sistem operasi)
- **Path koneksi**: `sqlite:rekam_medis.db`
- **Foreign Key**: `PRAGMA foreign_keys = ON` diaktifkan setiap inisialisasi

---

## Daftar Tabel

### 1. Tabel `users`

```sql
CREATE TABLE IF NOT EXISTS users (
  id           INTEGER  PRIMARY KEY AUTOINCREMENT,
  nip          TEXT     UNIQUE NOT NULL,
  email        TEXT     UNIQUE,
  passwordHash TEXT     NOT NULL,
  name         TEXT     NOT NULL,
  role         TEXT     NOT NULL,
  avatarPath   TEXT,                              -- ditambah via migration
  createdAt    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | INTEGER | PK, AUTOINCREMENT | ID unik pengguna |
| `nip` | TEXT | UNIQUE, NOT NULL | Nomor Induk Pegawai |
| `email` | TEXT | UNIQUE | Email pengguna (nullable) |
| `passwordHash` | TEXT | NOT NULL | Hash bcrypt password |
| `name` | TEXT | NOT NULL | Nama lengkap |
| `role` | TEXT | NOT NULL | `'Super Admin'` atau `'PETUGAS'` |
| `avatarPath` | TEXT | NULL | Path foto profil (ditambah via `ensureColumnExists`) |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu dibuat |
| `updatedAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu terakhir diupdate |

---

### 2. Tabel `login_logs`

```sql
CREATE TABLE IF NOT EXISTS login_logs (
  id        INTEGER  PRIMARY KEY AUTOINCREMENT,
  userId    INTEGER,                              -- nullable (jika NIP tidak ditemukan)
  nip       TEXT     NOT NULL,
  loginTime DATETIME DEFAULT CURRENT_TIMESTAMP,
  status    TEXT,                                 -- 'SUCCESS' atau 'FAILED'
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE SET NULL
);
```

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | INTEGER | PK, AUTOINCREMENT | ID log |
| `userId` | INTEGER | FK → users(id), nullable | Null jika NIP tidak ditemukan |
| `nip` | TEXT | NOT NULL | NIP yang digunakan saat login |
| `loginTime` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu login |
| `status` | TEXT | - | `'SUCCESS'` atau `'FAILED'` |

**Relasi**: `login_logs.userId` → `users.id` (ON DELETE SET NULL)

---

### 3. Tabel `data_rm`

```sql
CREATE TABLE IF NOT EXISTS data_rm (
  nomorRm       TEXT     PRIMARY KEY,
  namaPasien    TEXT     NOT NULL,
  nik           TEXT,             -- ditambah via migration
  jenisKelamin  TEXT,             -- ditambah via migration
  tanggalLahir  TEXT,             -- ditambah via migration
  alamat        TEXT,             -- ditambah via migration
  createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP  -- ditambah via migration
);
```

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `nomorRm` | TEXT | PK | Nomor Rekam Medis (unique per pasien) |
| `namaPasien` | TEXT | NOT NULL | Nama lengkap pasien |
| `nik` | TEXT | NULL | NIK 16 digit (opsional) |
| `jenisKelamin` | TEXT | NULL | `'L'` atau `'P'` [PERLU KONFIRMASI nilai valid] |
| `tanggalLahir` | TEXT | NULL | Format tanggal lahir |
| `alamat` | TEXT | NULL | Alamat pasien |
| `createdAt` | DATETIME | NULL | Waktu data RM dibuat |

---

### 4. Tabel `peminjaman`

```sql
CREATE TABLE IF NOT EXISTS peminjaman (
  id                  INTEGER  PRIMARY KEY AUTOINCREMENT,
  tanggalPinjam       DATETIME DEFAULT CURRENT_TIMESTAMP,
  tanggalBerkasKeluar DATETIME,                 -- waktu berkas fisik keluar rak
  peminjamId          INTEGER  NOT NULL,
  namaPeminjam        TEXT,                     -- ditambah via migration
  unit                TEXT     NOT NULL,
  nomorRm             TEXT     NOT NULL,
  namaPasien          TEXT     NOT NULL,
  jilid               TEXT,
  catatan             TEXT,
  status              TEXT     NOT NULL,         -- DIPINJAM/TERLAMBAT/DIKEMBALIKAN
  createdAt           DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(peminjamId) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(nomorRm)    REFERENCES data_rm(nomorRm) ON DELETE RESTRICT
);
```

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | INTEGER | PK, AUTOINCREMENT | ID transaksi |
| `tanggalPinjam` | DATETIME | DEFAULT now | Waktu peminjaman dicatat |
| `tanggalBerkasKeluar` | DATETIME | NULL | Waktu berkas fisik keluar (dapat berbeda dari tanggalPinjam) |
| `peminjamId` | INTEGER | FK → users(id), NOT NULL | Operator yang menginput |
| `namaPeminjam` | TEXT | NULL | Nama peminjam eksternal (dokter/perawat) |
| `unit` | TEXT | NOT NULL | Unit/ruang tujuan berkas |
| `nomorRm` | TEXT | FK → data_rm(nomorRm) | Nomor RM pasien |
| `namaPasien` | TEXT | NOT NULL | Nama pasien (denormalized) |
| `jilid` | TEXT | NULL | Nomor jilid berkas |
| `catatan` | TEXT | NULL | Catatan tambahan |
| `status` | TEXT | NOT NULL | Status saat ini di database |
| `createdAt` | DATETIME | DEFAULT now | |
| `updatedAt` | DATETIME | DEFAULT now | |

**Catatan penting**: `status` di database **tidak selalu mencerminkan status aktual**.
Status aktual dihitung ulang menggunakan `calculateEffectiveStatus()` saat query.

---

### 5. Tabel `pengembalian`

```sql
CREATE TABLE IF NOT EXISTS pengembalian (
  id                   INTEGER  PRIMARY KEY AUTOINCREMENT,
  peminjamanId         INTEGER  UNIQUE NOT NULL,    -- satu peminjaman = satu pengembalian
  tanggalBerkasKembali DATETIME DEFAULT CURRENT_TIMESTAMP,
  dikembalikanOlehId   INTEGER  NOT NULL,
  konfirmasiKembali    BOOLEAN  DEFAULT 0,
  kondisiBerkas        TEXT     NOT NULL DEFAULT 'BAIK',  -- ditambah via migration
  createdAt            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt            DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(peminjamanId)       REFERENCES peminjaman(id) ON DELETE RESTRICT,
  FOREIGN KEY(dikembalikanOlehId) REFERENCES users(id)     ON DELETE RESTRICT
);
```

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | INTEGER | PK, AUTOINCREMENT | ID pengembalian |
| `peminjamanId` | INTEGER | **UNIQUE**, FK → peminjaman(id) | Mencegah duplikat pengembalian |
| `tanggalBerkasKembali` | DATETIME | DEFAULT now | Timestamp aktual pengembalian |
| `dikembalikanOlehId` | INTEGER | FK → users(id), NOT NULL | Petugas yang konfirmasi |
| `konfirmasiKembali` | BOOLEAN | DEFAULT 0 | Flag konfirmasi (selalu 1 setelah proses) |
| `kondisiBerkas` | TEXT | DEFAULT 'BAIK' | `'BAIK'` atau `'RUSAK'` |
| `createdAt` | DATETIME | DEFAULT now | |
| `updatedAt` | DATETIME | DEFAULT now | |

---

### 6. Tabel `notifications`

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id           INTEGER  PRIMARY KEY AUTOINCREMENT,
  type         TEXT     NOT NULL,         -- 'REMINDER' atau 'TERLAMBAT'
  peminjamanId INTEGER  NOT NULL,
  message      TEXT     NOT NULL,
  isRead       BOOLEAN  DEFAULT 0,
  createdAt    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(peminjamanId) REFERENCES peminjaman(id) ON DELETE CASCADE
);
```

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | INTEGER | PK, AUTOINCREMENT | ID notifikasi |
| `type` | TEXT | NOT NULL | `'REMINDER'` atau `'TERLAMBAT'` |
| `peminjamanId` | INTEGER | FK → peminjaman(id), CASCADE | Hapus jika peminjaman dihapus |
| `message` | TEXT | NOT NULL | Isi pesan notifikasi |
| `isRead` | BOOLEAN | DEFAULT 0 | Status baca/belum |
| `createdAt` | DATETIME | DEFAULT now | |

---

## Mekanisme Migrasi

Database menggunakan pola **additive migration** melalui fungsi `ensureColumnExists()`:

```typescript
// index.ts
await ensureColumnExists("pengembalian", "kondisiBerkas", "TEXT NOT NULL DEFAULT 'BAIK'");
await ensureColumnExists("peminjaman",   "namaPeminjam",  "TEXT");
await ensureColumnExists("data_rm",      "nik",           "TEXT");
await ensureColumnExists("data_rm",      "jenisKelamin",  "TEXT");
await ensureColumnExists("data_rm",      "tanggalLahir",  "TEXT");
await ensureColumnExists("data_rm",      "alamat",        "TEXT");
await ensureColumnExists("data_rm",      "createdAt",     "DATETIME");
await ensureColumnExists("users",        "avatarPath",    "TEXT");
```

Ini memastikan database lama (sebelum kolom tersebut ada) dapat di-upgrade secara otomatis.
