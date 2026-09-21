import { getDb } from "./index";
import { calculateEffectiveStatus } from "../statusHelper";

export interface PeminjamanRow {
  id?: number;
  tanggalPinjam: string;
  tanggalBerkasKeluar?: string | null;
  peminjamId: number;
  namaPeminjam?: string | null;
  unit: string;
  nomorRm: string;
  namaPasien: string;
  jilid?: string | null;
  catatan?: string | null;
  status: "DIPINJAM" | "DIKEMBALIKAN" | "TERLAMBAT";
  createdAt?: string;
  updatedAt?: string;
  peminjamName?: string; // from namaPeminjam or user join
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
      tanggalPinjam, tanggalBerkasKeluar, peminjamId, namaPeminjam, unit, 
      nomorRm, namaPasien, jilid, catatan, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      data.tanggalPinjam,
      data.tanggalBerkasKeluar || null,
      data.peminjamId,
      data.namaPeminjam || null,
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
  const rows = await db.select<(PeminjamanRow & { tanggalBerkasKembali?: string | null; operatorName?: string })[]>(
    `SELECT p.id, p.tanggalPinjam, p.tanggalBerkasKeluar, p.peminjamId, p.namaPeminjam,
      p.unit, p.nomorRm, p.namaPasien, p.jilid, p.catatan,
      p.createdAt, p.updatedAt,
      pg.tanggalBerkasKembali,
      u.name as operatorName
     FROM peminjaman p
     LEFT JOIN pengembalian pg ON pg.peminjamanId = p.id
     LEFT JOIN users u ON p.peminjamId = u.id
     ORDER BY p.tanggalPinjam DESC`,
  );

  return rows.map(r => ({
    ...r,
    peminjamName: r.namaPeminjam || r.operatorName || 'Petugas',
    status: calculateEffectiveStatus(r.tanggalBerkasKeluar, r.tanggalPinjam, r.tanggalBerkasKembali)
  }));
}

