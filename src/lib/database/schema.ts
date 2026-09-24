export const INITIALIZATION_SQL = [
  `PRAGMA foreign_keys = ON;`,
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nip TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    passwordHash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatarPath TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS login_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    nip TEXT NOT NULL,
    loginTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE SET NULL
  );`,
  `CREATE TABLE IF NOT EXISTS data_rm (
    nomorRm TEXT PRIMARY KEY,
    namaPasien TEXT NOT NULL,
    nik TEXT,
    jenisKelamin TEXT,
    tanggalLahir TEXT,
    alamat TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS peminjaman (
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
  );`,
  `CREATE TABLE IF NOT EXISTS pengembalian (
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
  );`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    peminjamanId INTEGER NOT NULL,
    message TEXT NOT NULL,
    isRead BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(peminjamanId) REFERENCES peminjaman(id) ON DELETE CASCADE
  );`,
  `DROP TRIGGER IF EXISTS trg_pengembalian_after_delete;`,
  `CREATE TRIGGER IF NOT EXISTS trg_pengembalian_after_delete
  AFTER DELETE ON pengembalian
  BEGIN
    DELETE FROM peminjaman 
    WHERE id = OLD.peminjamanId;
  END;`,
  `CREATE TRIGGER IF NOT EXISTS trg_pengembalian_after_insert
  AFTER INSERT ON pengembalian
  BEGIN
    UPDATE peminjaman 
    SET status = 'DIKEMBALIKAN', updatedAt = CURRENT_TIMESTAMP 
    WHERE id = NEW.peminjamanId;
  END;`
];
