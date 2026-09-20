import { getDb } from "./index";

export interface PeminjamanDetailRow {
  id: number;
  tanggalPinjam: string;
  tanggalBerkasKeluar: string | null;
  peminjamId: number;
  unit: string;
  nomorRm: string;
  namaPasien: string;
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
  
  // From peminjaman
  nomorRm: string;
  namaPasien: string;
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
  const result = await db.select<PeminjamanDetailRow[]>(
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
  return result.length > 0 ? result[0] : null;
}

export async function processPengembalian(peminjamanId: number, userId: number, kondisiBerkas: "BAIK" | "RUSAK" = "BAIK", tanggalBerkasKembali?: string): Promise<void> {
  const db = await getDb();
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
    const activeRows = await db.select<{ id: number }[]>(
      "SELECT id FROM peminjaman WHERE id = $1 AND status IN ('DIPINJAM', 'TERLAMBAT')",
      [peminjamanId],
    );
    if (activeRows.length === 0) {
      throw new Error("Peminjaman ini sudah dikembalikan atau tidak lagi aktif.");
    }

    await db.execute(
      `UPDATE peminjaman SET status = 'DIKEMBALIKAN', updatedAt = CURRENT_TIMESTAMP
       WHERE id = $1 AND status IN ('DIPINJAM', 'TERLAMBAT')`,
      [peminjamanId],
    );

    const updatedRows = await db.select<{ status: string }[]>("SELECT status FROM peminjaman WHERE id = $1", [peminjamanId]);
    if (updatedRows[0]?.status !== "DIKEMBALIKAN") {
      throw new Error("Status peminjaman tidak berhasil diperbarui.");
    }

    const insertResult = await db.execute(
      `INSERT INTO pengembalian (peminjamanId, tanggalBerkasKembali, dikembalikanOlehId, konfirmasiKembali, kondisiBerkas)
       VALUES ($1, $2, $3, 1, $4)`,
      [peminjamanId, returnDate, userId, kondisiBerkas],
    );
    insertedReturnId = insertResult.lastInsertId as number;
  } catch (error: unknown) {
    try {
      if (insertedReturnId) await db.execute("DELETE FROM pengembalian WHERE id = $1", [insertedReturnId]);
      await db.execute("UPDATE peminjaman SET status = 'DIPINJAM', updatedAt = CURRENT_TIMESTAMP WHERE id = $1", [peminjamanId]);
    } catch (rollbackError) {
      console.error("[Return] Recovery failed:", rollbackError);
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
  const db = await getDb();
  await db.execute("BEGIN TRANSACTION");
  try {
    const rows = await db.select<{ peminjamanId: number }[]>("SELECT peminjamanId FROM pengembalian WHERE id = $1", [id]);
    if (rows.length === 0) throw new Error("Data pengembalian tidak ditemukan.");
    await db.execute("DELETE FROM pengembalian WHERE id = $1", [id]);
    await db.execute("UPDATE peminjaman SET status = 'DIPINJAM', updatedAt = CURRENT_TIMESTAMP WHERE id = $1", [rows[0].peminjamanId]);
    await db.execute("COMMIT");
  } catch (error) {
    await db.execute("ROLLBACK");
    throw error;
  }
}

export async function getPengembalianHistory(filters?: FilterPengembalian): Promise<PengembalianHistoryRow[]> {
  const db = await getDb();
  
  let query = `
    SELECT 
      pg.id, pg.peminjamanId, pg.tanggalBerkasKembali, pg.dikembalikanOlehId, pg.konfirmasiKembali, pg.kondisiBerkas,
      p.nomorRm, p.namaPasien, p.tanggalPinjam, p.tanggalBerkasKeluar, p.unit, p.jilid, p.status,
      u1.name as peminjamName,
      u2.name as dikembalikanOlehName
    FROM pengembalian pg
    INNER JOIN peminjaman p ON pg.peminjamanId = p.id
    LEFT JOIN users u1 ON p.peminjamId = u1.id
    LEFT JOIN users u2 ON pg.dikembalikanOlehId = u2.id
    WHERE 1=1
  `;
  
  const params: (string | number)[] = [];
  
  if (filters?.tanggalMulai) {
    params.push(filters.tanggalMulai + ' 00:00:00');
    query += ` AND pg.tanggalBerkasKembali >= $${params.length}`;
  }
  
  if (filters?.tanggalAkhir) {
    params.push(filters.tanggalAkhir + ' 23:59:59');
    query += ` AND pg.tanggalBerkasKembali <= $${params.length}`;
  }
  
  if (filters?.unit) {
    params.push(filters.unit);
    query += ` AND p.unit = $${params.length}`;
  }
  
  query += ` ORDER BY pg.tanggalBerkasKembali DESC`;
  
  return await db.select<PengembalianHistoryRow[]>(query, params);
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
