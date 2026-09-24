import { getDb } from "./index";

export interface PeminjamanDetailRow {
  id: number;
  tanggalPinjam: string;
  tanggalBerkasKeluar: string | null;
  peminjamId: number;
  unit: string;
  nomorRm: string;
  namaPasien: string;
  namaPeminjam: string | null;
  jilid: string | null;
  catatan: string | null;
  status: string;
  peminjamName: string;
}

export interface PengembalianHistoryRow {
  id: number;
  peminjamanId: number;
  tanggalBerkasKembali: string;
  dikembalikanOlehId: number;
  konfirmasiKembali: boolean;
  kondisiBerkas: "BAIK" | "RUSAK";
  catatanPengembalian?: string | null;

  // From peminjaman
  nomorRm: string;
  namaPasien: string;
  catatan?: string | null;
  tanggalPinjam: string;
  tanggalBerkasKeluar: string | null;
  unit: string;
  jilid: string | null;
  status: string; // Should be DIKEMBALIKAN
  
  // From users
  peminjamName: string;
  dikembalikanOlehName: string;
}

export async function findActivePeminjamanByRm(nomorRm: string): Promise<PeminjamanDetailRow | null> {
  const db = await getDb();
  const result = await db.select<(PeminjamanDetailRow & { namaPeminjam?: string | null })[]>(
    `SELECT p.*, u.name as peminjamName
     FROM peminjaman p 
     LEFT JOIN users u ON p.peminjamId = u.id 
     LEFT JOIN pengembalian pg ON pg.peminjamanId = p.id
     WHERE p.nomorRm = $1
       AND p.status IN ('DIPINJAM', 'TERLAMBAT')
       AND pg.id IS NULL
     ORDER BY p.tanggalPinjam DESC LIMIT 1`,
    [nomorRm]
  );
  if (result.length === 0) return null;
  const row = result[0];
  return {
    ...row,
    peminjamName: row.namaPeminjam || row.peminjamName || 'Petugas'
  };
}

export async function processPengembalian(peminjamanId: number, userId: number, kondisiBerkas: "BAIK" | "RUSAK" = "BAIK", tanggalBerkasKembali?: string, catatanPengembalian?: string | null): Promise<void> {
  const db = await getDb();
  // Tanggal kembali HARUS waktu aktual saat proses diproses (Requirement H & I)
  const returnDate = tanggalBerkasKembali || new Date().toISOString();

  // ── Validasi temporal: tanggal kembali tidak boleh lebih awal dari berkas keluar ──
  {
    const pinjamRows = await db.select<{ tanggalBerkasKeluar: string | null; tanggalPinjam: string }[]>(
      "SELECT tanggalBerkasKeluar, tanggalPinjam FROM peminjaman WHERE id = $1",
      [peminjamanId]
    );
    if (pinjamRows.length > 0) {
      const referenceStr = pinjamRows[0].tanggalBerkasKeluar || pinjamRows[0].tanggalPinjam;
      const referenceDate = new Date(referenceStr);
      const returnDateObj = new Date(returnDate);
      if (!Number.isNaN(referenceDate.getTime()) && !Number.isNaN(returnDateObj.getTime())) {
        if (returnDateObj < referenceDate) {
          const label = pinjamRows[0].tanggalBerkasKeluar ? "tanggal/jam berkas keluar" : "tanggal pinjam";
          throw new Error(
            `Tanggal pengembalian tidak valid: waktu kembali (${returnDateObj.toLocaleString("id-ID")}) tidak boleh lebih awal dari ${label} (${referenceDate.toLocaleString("id-ID")}).`
          );
        }
      }
    }
  }
  let insertedReturnId: number | null = null;

  try {
    const activeRows = await db.select<{ id: number; status: string }[]>(
      `SELECT p.id, p.status 
       FROM peminjaman p 
       WHERE p.id = $1 
         AND p.status IN ('DIPINJAM', 'TERLAMBAT')
         AND NOT EXISTS (SELECT 1 FROM pengembalian pg WHERE pg.peminjamanId = p.id)`,
      [peminjamanId],
    );
    if (activeRows.length === 0) {
      const existingReturns = await db.select<{ id: number }[]>(
        "SELECT id FROM pengembalian WHERE peminjamanId = $1",
        [peminjamanId]
      );
      if (existingReturns.length > 0) {
        throw new Error("Berkas ini sudah dikembalikan (duplikasi transaksi).");
      }
      throw new Error("Peminjaman ini sudah tidak aktif atau tidak ditemukan.");
    }

    const insertResult = await db.execute(
      `INSERT INTO pengembalian (peminjamanId, tanggalBerkasKembali, dikembalikanOlehId, konfirmasiKembali, kondisiBerkas, catatanPengembalian)
       VALUES ($1, $2, $3, 1, $4, $5)`,
      [peminjamanId, returnDate, userId, kondisiBerkas, catatanPengembalian ?? null],
    );
    insertedReturnId = insertResult.lastInsertId as number;

    // Trigger SQLite trg_pengembalian_after_insert secara otomatis dan atomik
    // mengubah status peminjaman menjadi 'DIKEMBALIKAN'.
    // Defense-in-depth update:
    await db.execute(
      `UPDATE peminjaman SET status = 'DIKEMBALIKAN', updatedAt = CURRENT_TIMESTAMP
       WHERE id = $1 AND status <> 'DIKEMBALIKAN'`,
      [peminjamanId],
    );
  } catch (error: unknown) {
    if (insertedReturnId) {
      try {
        await db.execute("DELETE FROM pengembalian WHERE id = $1", [insertedReturnId]);
      } catch (cleanupError) {
        console.error("[Return] Cleanup failed:", cleanupError);
      }
    }
    
    const errMessage = (error as Error).message || "";
    // If it's a UNIQUE constraint failure, throw a custom message
    if (errMessage.includes("UNIQUE") || errMessage.includes("UNIQUE constraint failed")) {
      const err = new Error("Berkas ini sudah dikembalikan (duplikasi transaksi).");
      Object.assign(err, { cause: error });
      throw err;
    }
    throw error;
  }
}

export interface FilterPengembalian {
  tanggalMulai?: string;
  tanggalAkhir?: string;
  unit?: string;
}

export async function updatePengembalianKondisi(id: number, kondisiBerkas: "BAIK" | "RUSAK"): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE pengembalian SET kondisiBerkas = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2", [kondisiBerkas, id]);
}

export async function deletePengembalian(id: number): Promise<void> {
  if (!id || typeof id !== "number" || id <= 0) {
    throw new Error("ID pengembalian tidak valid.");
  }
  const db = await getDb();
  
  // 1. Validasi & pastikan row pengembalian ada
  const rows = await db.select<{ id: number; peminjamanId: number }[]>(
    "SELECT id, peminjamanId FROM pengembalian WHERE id = $1", 
    [id]
  );
  if (rows.length === 0) {
    throw new Error("Data pengembalian tidak ditemukan.");
  }
  const { peminjamanId } = rows[0];

  // 2. Hapus row pengembalian.
  // Trigger SQLite 'trg_pengembalian_after_delete' secara atomik dan pasti
  // menghapus parent peminjaman (WHERE id = OLD.peminjamanId) beserta cascaded notifications.
  const res = await db.execute("DELETE FROM pengembalian WHERE id = $1", [id]);
  if (res.rowsAffected === 0) {
    throw new Error("Data pengembalian gagal dihapus.");
  }

  // 3. Defense-in-depth: pastikan peminjaman & notifikasi terkait terhapus jika belum terhapus
  await db.execute("DELETE FROM notifications WHERE peminjamanId = $1", [peminjamanId]);
  await db.execute("DELETE FROM peminjaman WHERE id = $1", [peminjamanId]);
}

export async function getPengembalianHistory(filters?: FilterPengembalian): Promise<PengembalianHistoryRow[]> {
  const db = await getDb();
  
  let query = `
    SELECT 
      pg.id, pg.peminjamanId, pg.tanggalBerkasKembali, pg.dikembalikanOlehId, pg.konfirmasiKembali, pg.kondisiBerkas,
      pg.catatanPengembalian,
      p.nomorRm, p.namaPasien, p.catatan, p.tanggalPinjam, p.tanggalBerkasKeluar, p.unit, p.jilid, p.status, p.namaPeminjam,
      u1.name as operatorPeminjamName,
      u2.name as dikembalikanOlehName
    FROM pengembalian pg
    INNER JOIN peminjaman p ON pg.peminjamanId = p.id
    LEFT JOIN users u1 ON p.peminjamId = u1.id
    LEFT JOIN users u2 ON pg.dikembalikanOlehId = u2.id
    WHERE 1=1
  `;
  
  const params: (string | number)[] = [];
  
  if (filters?.tanggalMulai) {
    params.push(filters.tanggalMulai);
    query += ` AND date(pg.tanggalBerkasKembali) >= date($${params.length})`;
  }
  
  if (filters?.tanggalAkhir) {
    params.push(filters.tanggalAkhir);
    query += ` AND date(pg.tanggalBerkasKembali) <= date($${params.length})`;
  }
  
  if (filters?.unit) {
    params.push(filters.unit);
    query += ` AND p.unit = $${params.length}`;
  }
  
  query += ` ORDER BY pg.tanggalBerkasKembali DESC`;
  
  const rows = await db.select<(PengembalianHistoryRow & { namaPeminjam?: string | null; operatorPeminjamName?: string })[]>(query, params);
  return rows.map(r => ({
    ...r,
    peminjamName: r.namaPeminjam || r.operatorPeminjamName || 'Petugas'
  }));
}

export async function getUniqueUnitsFromPengembalian(): Promise<string[]> {
  const db = await getDb();
  // Get unique units for the dropdown from transactions
  const result = await db.select<{unit: string}[]>(
    `SELECT DISTINCT p.unit 
     FROM pengembalian pg 
     INNER JOIN peminjaman p ON pg.peminjamanId = p.id 
     WHERE p.unit IS NOT NULL AND p.unit != '' 
     ORDER BY p.unit ASC`
  );
  return result.map(r => r.unit);
}
