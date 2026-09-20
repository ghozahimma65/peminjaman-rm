import Database from "@tauri-apps/plugin-sql";
import { INITIALIZATION_SQL } from "./schema";

const DB_PATH = "sqlite:rekam_medis.db";

const DEVELOPMENT_RM_SEED = [
  ["RM-DEV-0001", "Alya Prameswari"],
  ["RM-DEV-0002", "Bima Adinata"],
  ["RM-DEV-0003", "Citra Maheswari"],
  ["RM-DEV-0004", "Dafa Wiratama"],
  ["RM-DEV-0005", "Elina Kartikasari"],
  ["RM-DEV-0006", "Farhan Nugraha"],
  ["RM-DEV-0007", "Gita Anggraini"],
  ["RM-DEV-0008", "Hadi Saputro"],
  ["RM-DEV-0009", "Intan Lestari"],
  ["RM-DEV-0010", "Jovan Ramadhan"],
  ["RM-DEV-0011", "Kirana Wulandari"],
  ["RM-DEV-0012", "Lukman Pratama"],
  ["RM-DEV-0013", "Maya Oktaviani"],
  ["RM-DEV-0014", "Nanda Firmansyah"],
  ["RM-DEV-0015", "Ovi Maharani"],
  ["RM-DEV-0016", "Putra Kurniawan"],
  ["RM-DEV-0017", "Rara Puspitasari"],
  ["RM-DEV-0018", "Seno Wicaksono"],
  ["RM-DEV-0019", "Tania Permata"],
  ["RM-DEV-0020", "Yoga Prasetyo"],
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
    await ensureColumnExists("data_rm", "nik", "TEXT");
    await ensureColumnExists("data_rm", "jenisKelamin", "TEXT");
    await ensureColumnExists("data_rm", "tanggalLahir", "TEXT");
    await ensureColumnExists("data_rm", "alamat", "TEXT");
    await ensureColumnExists("users", "avatarPath", "TEXT");

    for (const [nomorRm, namaPasien] of DEVELOPMENT_RM_SEED) {
      await db.execute(
        "INSERT OR IGNORE INTO data_rm (nomorRm, namaPasien) VALUES ($1, $2)",
        [nomorRm, namaPasien],
      );
    }

    await db.execute(
      `UPDATE peminjaman
       SET status = 'DIKEMBALIKAN', updatedAt = CURRENT_TIMESTAMP
       WHERE id IN (SELECT peminjamanId FROM pengembalian)
         AND status <> 'DIKEMBALIKAN'`,
    );

    // 2. Check if SUPER_ADMIN exists
    const users = await db.select<Record<string, unknown>[]>("SELECT * FROM users WHERE role = 'Super Admin' LIMIT 1");
    
    // 3. Inject SUPER_ADMIN if no users exist
    if (users.length === 0) {
      // Lazy load bcrypt to not slow down the boot process unnecessarily
      const bcrypt = await import("bcryptjs");
      const hash = await bcrypt.hash('superadmin123', 10);
      await db.execute(
        `INSERT INTO users (nip, passwordHash, name, role) 
         VALUES ($1, $2, $3, $4)`,
        ['superadmin', hash, 'Super Administrator', 'Super Admin']
      );
      console.log("[DB] Super Admin injected with hash.");
    } else {
      // Safe migration: check if any user has plaintext 'superadmin123'
      const unhashed = await db.select<Record<string, unknown>[]>("SELECT id FROM users WHERE passwordHash = 'superadmin123'");
      if (unhashed.length > 0) {
        const bcrypt = await import("bcryptjs");
        const hash = await bcrypt.hash('superadmin123', 10);
        await db.execute("UPDATE users SET passwordHash = $1 WHERE passwordHash = 'superadmin123'", [hash]);
        console.log(`[DB] Upgraded ${unhashed.length} account(s) from plaintext to bcrypt hash.`);
      }
    }

    console.log("[DB] Database initialized successfully.");
  } catch (error) {
    console.error("[DB] Failed to initialize database:", error);
    throw error;
  }
}
