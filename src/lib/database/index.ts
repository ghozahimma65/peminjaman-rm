import Database from "@tauri-apps/plugin-sql";
import { INITIALIZATION_SQL } from "./schema";

const DB_PATH = "sqlite:rekam_medis.db";

export interface InitialPatientSeed {
  nomorRm: string;
  namaPasien: string;
  nik: string;
  jenisKelamin: string;
  tanggalLahir: string;
  alamat: string;
}

export const INITIAL_PATIENT_SEED: readonly InitialPatientSeed[] = [
  {
    nomorRm: "10000001",
    namaPasien: "Alya Prameswari",
    nik: "3301014503980001",
    jenisKelamin: "Perempuan",
    tanggalLahir: "1998-03-15",
    alamat: "Jl. Merbabu No. 12, Semarang",
  },
  {
    nomorRm: "10000002",
    namaPasien: "Bima Adinata",
    nik: "3301011207950002",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "1995-07-12",
    alamat: "Jl. Pandanaran No. 45, Semarang",
  },
  {
    nomorRm: "10000003",
    namaPasien: "Citra Maheswari",
    nik: "3301015111970003",
    jenisKelamin: "Perempuan",
    tanggalLahir: "1997-11-21",
    alamat: "Jl. Gajah Mada No. 88, Semarang",
  },
  {
    nomorRm: "10000004",
    namaPasien: "Dafa Wiratama",
    nik: "3301010408990004",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "1999-08-04",
    alamat: "Jl. Pemuda No. 102, Semarang",
  },
  {
    nomorRm: "10000005",
    namaPasien: "Nabila Putri",
    nik: "3301016205010005",
    jenisKelamin: "Perempuan",
    tanggalLahir: "2001-05-22",
    alamat: "Jl. Majapahit No. 56, Semarang",
  },
  {
    nomorRm: "10000006",
    namaPasien: "Raka Saputra",
    nik: "3301011809960006",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "1996-09-18",
    alamat: "Jl. Diponegoro No. 34, Semarang",
  },
  {
    nomorRm: "10000007",
    namaPasien: "Sinta Maharani",
    nik: "3301014901940007",
    jenisKelamin: "Perempuan",
    tanggalLahir: "1994-01-29",
    alamat: "Jl. Siliwangi No. 71, Semarang",
  },
  {
    nomorRm: "10000008",
    namaPasien: "Fajar Ramadhan",
    nik: "3301011512930008",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "1993-12-15",
    alamat: "Jl. Kelinci No. 9, Semarang",
  },
  {
    nomorRm: "10000009",
    namaPasien: "Intan Permata",
    nik: "3301016504000009",
    jenisKelamin: "Perempuan",
    tanggalLahir: "2000-04-25",
    alamat: "Jl. Veteran No. 17, Semarang",
  },
  {
    nomorRm: "10000010",
    namaPasien: "Bagas Pratama",
    nik: "3301012306970010",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "1997-06-23",
    alamat: "Jl. Pahlawan No. 3, Semarang",
  },
] as const;

let dbInstance: Database | null = null;

async function ensureColumnExists(tableName: string, columnName: string, columnDefinition: string): Promise<void> {
  const db = await getDb();
  const columns = await db.select<{ name: string }[]>(`PRAGMA table_info(${tableName})`);

  if (columns.some(column => column.name === columnName)) {
    return;
  }

  try {
    await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes("duplicate column name")) {
      throw error;
    }
  }
}

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load(DB_PATH);
  }
  return dbInstance;
}

export async function initializeDatabase(): Promise<void> {
  try {
    const db = await getDb();

    // 1. Run migrations / create tables
    for (const query of INITIALIZATION_SQL) {
      await db.execute(query);
    }

    await ensureColumnExists("pengembalian", "kondisiBerkas", "TEXT NOT NULL DEFAULT 'BAIK'");
    await ensureColumnExists("pengembalian", "catatanPengembalian", "TEXT");
    await ensureColumnExists("peminjaman", "namaPeminjam", "TEXT");
    await ensureColumnExists("data_rm", "nik", "TEXT");
    await ensureColumnExists("data_rm", "jenisKelamin", "TEXT");
    await ensureColumnExists("data_rm", "tanggalLahir", "TEXT");
    await ensureColumnExists("data_rm", "alamat", "TEXT");
    await ensureColumnExists("data_rm", "createdAt", "DATETIME");
    await ensureColumnExists("users", "avatarPath", "TEXT");

    // 2. Ensure default user exists first (for foreign keys in seed loans)
    const existingUsers = await db.select<{ id: number }[]>("SELECT id FROM users LIMIT 1");
    let defaultUserId = existingUsers[0]?.id;

    if (!defaultUserId) {
      const bcrypt = await import("bcryptjs");
      const hash = await bcrypt.hash("superadmin123", 10);
      const res = await db.execute(
        `INSERT INTO users (nip, passwordHash, name, role) 
         VALUES ($1, $2, $3, $4)`,
        ["superadmin", hash, "Super Administrator", "Super Admin"]
      );
      defaultUserId = res.lastInsertId as number;
      console.log("[DB] Super Admin injected with hash.");
    } else {
      // Safe migration: check if any user has plaintext 'superadmin123'
      const unhashed = await db.select<{ id: number }[]>("SELECT id FROM users WHERE passwordHash = 'superadmin123'");
      if (unhashed.length > 0) {
        const bcrypt = await import("bcryptjs");
        const hash = await bcrypt.hash("superadmin123", 10);
        await db.execute("UPDATE users SET passwordHash = $1 WHERE passwordHash = 'superadmin123'", [hash]);
        console.log(`[DB] Upgraded ${unhashed.length} account(s) from plaintext to bcrypt hash.`);
      }
    }

    // 3. Seed exact 10 normal patients
    for (const p of INITIAL_PATIENT_SEED) {
      await db.execute(
        `INSERT OR IGNORE INTO data_rm (nomorRm, namaPasien, nik, jenisKelamin, tanggalLahir, alamat, createdAt) 
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [p.nomorRm, p.namaPasien, p.nik, p.jenisKelamin, p.tanggalLahir, p.alamat]
      );
    }

    // 4. Safe migration for legacy RM-DEV data
    // Remap any existing transactions on RM-DEV-0001 to 10000001 (Alya Prameswari)
    await db.execute("UPDATE peminjaman SET nomorRm = '10000001' WHERE nomorRm = 'RM-DEV-0001'");
    // Safely remove unreferenced legacy RM-DEV seeds
    await db.execute("DELETE FROM data_rm WHERE nomorRm LIKE 'RM-DEV%' AND nomorRm NOT IN (SELECT nomorRm FROM peminjaman)");

    // 5. Seed initial realistic test transactions with dynamic timestamps
    const now = new Date();
    const normalStart = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const reminderStart = new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString();
    const lateStart = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();
    const returnedStart = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();
    const returnedAt = new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString();

    // Skenario B: JATUH TEMPO (10000003 - Citra Maheswari, deadline in ~18h)
    const existingLoanB = await db.select<{ id: number }[]>("SELECT id FROM peminjaman WHERE nomorRm = '10000003' LIMIT 1");
    if (existingLoanB.length === 0) {
      await db.execute(
        `INSERT INTO peminjaman (tanggalPinjam, tanggalBerkasKeluar, peminjamId, namaPeminjam, unit, nomorRm, namaPasien, jilid, catatan, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [reminderStart, reminderStart, defaultUserId, "dr. Arif Sp.B", "Poli Bedah", "10000003", "Citra Maheswari", "1", "Persiapan tindakan bedah minor", "DIPINJAM"]
      );
    }

    // Skenario C: TERLAMBAT (10000004 - Dafa Wiratama, deadline passed ~24h ago)
    const existingLoanC = await db.select<{ id: number }[]>("SELECT id FROM peminjaman WHERE nomorRm = '10000004' LIMIT 1");
    if (existingLoanC.length === 0) {
      await db.execute(
        `INSERT INTO peminjaman (tanggalPinjam, tanggalBerkasKeluar, peminjamId, namaPeminjam, unit, nomorRm, namaPasien, jilid, catatan, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [lateStart, lateStart, defaultUserId, "Ns. Rini S.Kep", "Bangsal Rawat Inap Melati", "10000004", "Dafa Wiratama", "1", "Perawatan intensif rawat inap", "DIPINJAM"]
      );
    }

    // Skenario A: NORMAL (10000002 - Bima Adinata, deadline in ~46h)
    const existingLoanA = await db.select<{ id: number }[]>("SELECT id FROM peminjaman WHERE nomorRm = '10000002' LIMIT 1");
    if (existingLoanA.length === 0) {
      await db.execute(
        `INSERT INTO peminjaman (tanggalPinjam, tanggalBerkasKeluar, peminjamId, namaPeminjam, unit, nomorRm, namaPasien, jilid, catatan, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [normalStart, normalStart, defaultUserId, "dr. Hendra Sp.PD", "Poli Penyakit Dalam", "10000002", "Bima Adinata", "1", "Kontrol rutin rawat jalan", "DIPINJAM"]
      );
    }

    // Skenario D: SUDAH DIKEMBALIKAN (10000001 - Alya Prameswari)
    const existingLoanD = await db.select<{ id: number }[]>("SELECT id FROM peminjaman WHERE nomorRm = '10000001' LIMIT 1");
    if (existingLoanD.length === 0) {
      const insertRes = await db.execute(
        `INSERT INTO peminjaman (tanggalPinjam, tanggalBerkasKeluar, peminjamId, namaPeminjam, unit, nomorRm, namaPasien, jilid, catatan, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [returnedStart, returnedStart, defaultUserId, "dr. Maya Sp.S", "Poli Saraf", "10000001", "Alya Prameswari", "1", "Konsultasi neurologi", "DIKEMBALIKAN"]
      );
      const peminjamanId = insertRes.lastInsertId as number;
      await db.execute(
        `INSERT INTO pengembalian (peminjamanId, tanggalBerkasKembali, dikembalikanOlehId, konfirmasiKembali, kondisiBerkas, catatanPengembalian)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [peminjamanId, returnedAt, defaultUserId, 1, "BAIK", "Berkas lengkap dan rapi"]
      );
    } else {
      // Ensure return record exists for loanD
      const existingRetD = await db.select<{ id: number }[]>(
        "SELECT id FROM pengembalian WHERE peminjamanId = $1 LIMIT 1",
        [existingLoanD[0].id]
      );
      if (existingRetD.length === 0) {
        await db.execute(
          `INSERT INTO pengembalian (peminjamanId, tanggalBerkasKembali, dikembalikanOlehId, konfirmasiKembali, kondisiBerkas, catatanPengembalian)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [existingLoanD[0].id, returnedAt, defaultUserId, 1, "BAIK", "Berkas lengkap dan rapi"]
        );
      }
    }

    // 6. Self-healing synchronization:
    // Peminjaman yang memiliki row pengembalian HARUS berstatus 'DIKEMBALIKAN'
    await db.execute(
      `UPDATE peminjaman
       SET status = 'DIKEMBALIKAN', updatedAt = CURRENT_TIMESTAMP
       WHERE id IN (SELECT peminjamanId FROM pengembalian)
         AND status <> 'DIKEMBALIKAN'`,
    );

    // Peminjaman yang TIDAK memiliki row pengembalian TIDAK BOLEH berstatus 'DIKEMBALIKAN'
    await db.execute(
      `UPDATE peminjaman
       SET status = 'DIPINJAM', updatedAt = CURRENT_TIMESTAMP
       WHERE id NOT IN (SELECT peminjamanId FROM pengembalian)
         AND status = 'DIKEMBALIKAN'`,
    );

    // 7. Ensure SQLite triggers are installed
    await db.execute("DROP TRIGGER IF EXISTS trg_pengembalian_after_delete");
    await db.execute(
      `CREATE TRIGGER IF NOT EXISTS trg_pengembalian_after_delete
       AFTER DELETE ON pengembalian
       BEGIN
         DELETE FROM peminjaman 
         WHERE id = OLD.peminjamanId;
       END;`
    );

    await db.execute(
      `CREATE TRIGGER IF NOT EXISTS trg_pengembalian_after_insert
       AFTER INSERT ON pengembalian
       BEGIN
         UPDATE peminjaman 
         SET status = 'DIKEMBALIKAN', updatedAt = CURRENT_TIMESTAMP 
         WHERE id = NEW.peminjamanId;
       END;`
    );

    console.log("[DB] Database initialized successfully.");
  } catch (error) {
    console.error("[DB] Failed to initialize database:", error);
    throw error;
  }
}
