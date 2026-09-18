import { getDb } from "./index";

export interface LaporanRow {
  id: number;
  nomorRm: string;
  namaPasien: string;
  tanggalPinjam: string;
  tanggalBerkasKeluar: string | null;
  tanggalBerkasKembali: string | null;
  unit: string;
  jilid: string | null;
  status: string;
  peminjamName: string | null;
  pengembaliName: string | null;
}

export interface LaporanFilter {
  unit?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export async function getDistinctUnits(): Promise<string[]> {
  const db = await getDb();
  const result = await db.select<{ unit: string }[]>(
    `SELECT DISTINCT unit FROM peminjaman ORDER BY unit ASC`
  );
  return result.map(r => r.unit);
}

export async function getLaporanData(filters: LaporanFilter): Promise<LaporanRow[]> {
  const db = await getDb();
  
  let query = `
    SELECT 
      p.id, p.nomorRm, p.namaPasien, p.tanggalPinjam, p.tanggalBerkasKeluar, 
      p.unit, p.jilid,
      CASE WHEN k.id IS NOT NULL THEN 'DIKEMBALIKAN' ELSE p.status END as status,
      u1.name as peminjamName,
      k.tanggalBerkasKembali, 
      u2.name as pengembaliName
    FROM peminjaman p
    LEFT JOIN users u1 ON p.peminjamId = u1.id
    LEFT JOIN pengembalian k ON p.id = k.peminjamanId
    LEFT JOIN users u2 ON k.dikembalikanOlehId = u2.id
    WHERE 1=1
  `;
  
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filters.unit && filters.unit !== 'Semua') {
    query += ` AND p.unit = $${paramIdx++}`;
    params.push(filters.unit);
  }

  if (filters.status && filters.status !== 'Semua') {
    query += ` AND p.status = $${paramIdx++}`;
    params.push(filters.status);
  }

  if (filters.startDate) {
    query += ` AND date(p.tanggalPinjam) >= date($${paramIdx})`;
    params.push(filters.startDate);
    paramIdx++;
  }

  if (filters.endDate) {
    query += ` AND date(p.tanggalPinjam) <= date($${paramIdx})`;
    params.push(filters.endDate);
  }

  query += ` ORDER BY p.tanggalPinjam DESC`;

  return await db.select<LaporanRow[]>(query, params);
}
