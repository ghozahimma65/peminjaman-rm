# 02 — Inisialisasi Database dan Skema (`index.ts` & `schema.ts`)

---

- **FILE**: `src/lib/database/index.ts` & `src/lib/database/schema.ts`
- **FUNCTION/COMPONENT**: `getDb()`, `initializeDatabase()`, `ensureColumnExists()`

---

## TUJUAN
Menyediakan koneksi tunggal (*singleton connection*) ke SQLite lokal, mengeksekusi DDL pembentukan 6 tabel utama, menegakkan integritas foreign key, menangani migrasi kolom otomatis, menyuntikkan data *seed* awal, serta memastikan keberadaan akun bawaan `Super Admin`.

---

## ALUR
1. `getDb()` memuat berkas database `sqlite:rekam_medis.db` via `@tauri-apps/plugin-sql` secara *lazy-loaded* dan menyimpannya pada memori variabel `dbInstance`.
2. `initializeDatabase()` mengeksekusi array perintah `INITIALIZATION_SQL` (termasuk `PRAGMA foreign_keys = ON;` dan pembuatan 6 tabel).
3. Menjalankan fungsi pembantu `ensureColumnExists` untuk memastikan kolom-kolom baru (seperti `kondisiBerkas`, `nik`, `avatarPath`) sudah terpasang jika aplikasi di-update dari versi lama.
4. Menyuntikkan 20 data master rekam medis dummy (`RM-DEV-0001` s/d `RM-DEV-0020`) via `INSERT OR IGNORE`.
5. Memeriksa ketersediaan akun `Super Admin`. Jika belum ada, lakukan hashing bcrypt kata sandi `superadmin123` dengan cost factor 10 dan simpan ke tabel `users`.
6. Jika ada akun lama yang kata sandinya masih *plaintext*, otomatis lakukan *upgrade* ke hash bcrypt.

---

## INPUT / PROSES / OUTPUT
- **INPUT**: Konfigurasi nama berkas `sqlite:rekam_medis.db`.
- **PROSES**:
  - DDL Execution loop
  - `PRAGMA table_info()` checking
  - Dynamic `ALTER TABLE ADD COLUMN`
  - Safe seeding & akun bootstrapping
- **OUTPUT**:
  - Basis data SQLite yang siap digunakan oleh seluruh lapisan aplikasi.

---

## KENAPA PENTING
Aplikasi desktop didistribusikan langsung ke komputer lokal pengguna tanpa backend server terpisah. Mekanisme ini menjamin setiap kali aplikasi baru diinstal atau dibuka, database akan otomatis terbentuk dan siap pakai (*zero configuration*) tanpa memerlukan setup SQL manual.

---

## KEMUNGKINAN DITANYA PENGUJI
> *"Kenapa menggunakan fungsi `ensureColumnExists` dan bukan tool migrasi seperti Prisma atau Knex?"*

---

## JAWABAN REKOMENDASI
> *"Dalam ekosistem desktop ringan Tauri v2 dengan driver Rust SQLite (`@tauri-apps/plugin-sql`), penggunaan migrator Node.js berat seperti Prisma tidak efisien karena menambah ukuran bundel secara drastis. Fungsi `ensureColumnExists` bekerja secara native memeriksa `PRAGMA table_info` dan mengeksekusi `ALTER TABLE` secara mandiri, aman, dan sangat ringan."*

---

## KODE TERKAIT

```typescript
export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load(DB_PATH);
  }
  return dbInstance;
}

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
```
