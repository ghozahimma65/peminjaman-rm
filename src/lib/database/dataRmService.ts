import { getDb } from "./index";

export interface DataRmRow {
  nomorRm: string;
  namaPasien: string;
}

/**
 * Cari data RM berdasarkan nomor RM
 */
export async function getRmByNomor(nomorRm: string): Promise<DataRmRow | null> {
  const db = await getDb();
  const result = await db.select<DataRmRow[]>(
    "SELECT nomorRm, namaPasien FROM data_rm WHERE nomorRm = $1",
    [nomorRm]
  );
  return result.length > 0 ? result[0] : null;
}

export interface MasterDataRmRow {
  nomorRm: string;
  namaPasien: string;
  totalTransaksi: number;
}

/**
 * Mendapatkan seluruh Data RM beserta jumlah transaksi (peminjaman)
 */
export async function getAllDataRm(): Promise<MasterDataRmRow[]> {
  const db = await getDb();
  const query = `
    SELECT d.nomorRm, d.namaPasien, COUNT(p.id) as totalTransaksi
    FROM data_rm d
    LEFT JOIN peminjaman p ON d.nomorRm = p.nomorRm
    GROUP BY d.nomorRm, d.namaPasien
    ORDER BY d.nomorRm ASC
  `;
  return await db.select<MasterDataRmRow[]>(query);
}

/**
 * Mencari Data RM berdasarkan nomor RM atau nama pasien
 */
export async function searchDataRm(keyword: string): Promise<MasterDataRmRow[]> {
  const db = await getDb();
  const searchPattern = `%${keyword}%`;
  const query = `
    SELECT d.nomorRm, d.namaPasien, COUNT(p.id) as totalTransaksi
    FROM data_rm d
    LEFT JOIN peminjaman p ON d.nomorRm = p.nomorRm
    WHERE d.nomorRm LIKE $1 OR d.namaPasien LIKE $1
    GROUP BY d.nomorRm, d.namaPasien
    ORDER BY d.nomorRm ASC
  `;
  return await db.select<MasterDataRmRow[]>(query, [searchPattern]);
}
