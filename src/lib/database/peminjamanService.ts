import { getDb } from "./index";

export interface PeminjamanRow {
  id?: number;
  tanggalPinjam: string;
  tanggalBerkasKeluar?: string | null;
  peminjamId: number;
  unit: string;
  nomorRm: string;
  namaPasien: string;
  jilid?: string | null;
  catatan?: string | null;
  status: "DIPINJAM" | "DIKEMBALIKAN" | "TERLAMBAT";
  createdAt?: string;
  updatedAt?: string;
  peminjamName?: string; // from join
}

export async function checkActivePeminjaman(nomorRm: string): Promise<PeminjamanRow | null> {
  const db = await getDb();
  // Peminjaman aktif = DIPINJAM atau TERLAMBAT
  const result = await db.select<PeminjamanRow[]>(
    `SELECT * FROM peminjaman 
     WHERE nomorRm = $1 AND status IN ('DIPINJAM', 'TERLAMBAT')
       AND NOT EXISTS (SELECT 1 FROM pengembalian WHERE pengembalian.peminjamanId = peminjaman.id)
     ORDER BY tanggalPinjam DESC LIMIT 1`,
    [nomorRm]
  );
  return result.length > 0 ? result[0] : null;
}

export async function createPeminjaman(data: Omit<PeminjamanRow, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const db = await getDb();
  
  // Extra layer of validation (defense in depth)
  const active = await checkActivePeminjaman(data.nomorRm);
  if (active) {
    throw new Error(`Rekam medis ${data.nomorRm} masih berstatus aktif dipinjam.`);
  }

  const result = await db.execute(
    `INSERT INTO peminjaman (
      tanggalPinjam, tanggalBerkasKeluar, peminjamId, unit, 
      nomorRm, namaPasien, jilid, catatan, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      data.tanggalPinjam,
      data.tanggalBerkasKeluar || null,
      data.peminjamId,
      data.unit,
      data.nomorRm,
      data.namaPasien,
      data.jilid || null,
      data.catatan || null,
      data.status
    ]
  );
  
  return result.lastInsertId as number;
}

export async function getAllPeminjaman(): Promise<PeminjamanRow[]> {
  const db = await getDb();
  try {
    return await db.select<PeminjamanRow[]>(
      `SELECT p.id, p.tanggalPinjam, p.tanggalBerkasKeluar, p.peminjamId,
        p.unit, p.nomorRm, p.namaPasien, p.jilid, p.catatan,
        p.createdAt, p.updatedAt,
        CASE WHEN EXISTS (SELECT 1 FROM pengembalian pg WHERE pg.peminjamanId = p.id)
             THEN 'DIKEMBALIKAN' ELSE p.status END as status,
        u.name as peminjamName
       FROM peminjaman p
       LEFT JOIN users u ON p.peminjamId = u.id
       ORDER BY p.tanggalPinjam DESC`,
    );
  } catch (error) {
    console.warn("[Peminjaman] Effective status query failed, using base query:", error);
    return db.select<PeminjamanRow[]>(
      `SELECT p.*, u.name as peminjamName
       FROM peminjaman p
       LEFT JOIN users u ON p.peminjamId = u.id
       ORDER BY p.tanggalPinjam DESC`,
    );
  }
}
