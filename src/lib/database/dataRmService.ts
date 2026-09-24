import { getDb } from "./index";

export interface DataRmRow {
  nomorRm: string;
  namaPasien: string;
  nik?: string | null;
  jenisKelamin?: string | null;
  tanggalLahir?: string | null;
  alamat?: string | null;
}

/**
 * Validasi Nomor RM: Wajib angka 0-9 dan maksimal 8 digit.
 */
export function validateNomorRm(nomorRm: string): void {
  const trimmed = (nomorRm || "").trim();
  if (!trimmed || !/^\d{1,8}$/.test(trimmed)) {
    throw new Error("No. RM harus berupa angka dan maksimal 8 digit.");
  }
}

/**
 * Validasi NIK: Wajib tepat 16 digit angka, tanpa huruf, spasi, atau simbol.
 */
export function validateNik(nik: string): void {
  const trimmed = nik.trim();
  if (!/^\d{16}$/.test(trimmed)) {
    throw new Error("NIK wajib terdiri dari tepat 16 digit angka (tanpa huruf, spasi, atau simbol).");
  }
}

/**
 * Menambahkan data pasien baru ke master data RM
 */
export async function createDataRm(
  nomorRm: string,
  namaPasien: string,
  nik: string,
  jenisKelamin: string,
  tanggalLahir: string,
  alamat: string,
): Promise<void> {
  validateNomorRm(nomorRm);
  validateNik(nik);
  const db = await getDb();
  await db.execute(
    "INSERT INTO data_rm (nomorRm, namaPasien, nik, jenisKelamin, tanggalLahir, alamat, createdAt) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)",
    [nomorRm, namaPasien, nik, jenisKelamin, tanggalLahir, alamat]
  );
}

/**
 * Memperbarui data master pasien RM yang sudah ada
 */
export async function updateDataRm(
  nomorRm: string,
  namaPasien: string,
  nik: string,
  jenisKelamin: string,
  tanggalLahir: string,
  alamat: string,
): Promise<void> {
  validateNik(nik);
  const db = await getDb();
  await db.execute(
    "UPDATE data_rm SET namaPasien = $1, nik = $2, jenisKelamin = $3, tanggalLahir = $4, alamat = $5 WHERE nomorRm = $6",
    [namaPasien, nik, jenisKelamin, tanggalLahir, alamat, nomorRm]
  );
  // Sinkronkan namaPasien di transaksi peminjaman agar tetap konsisten
  await db.execute(
    "UPDATE peminjaman SET namaPasien = $1 WHERE nomorRm = $2",
    [namaPasien, nomorRm]
  );
}


/**
 * Cari data RM berdasarkan nomor RM
 */
export async function getRmByNomor(nomorRm: string): Promise<DataRmRow | null> {
  const db = await getDb();
  const result = await db.select<DataRmRow[]>(
    "SELECT nomorRm, namaPasien, nik, jenisKelamin, tanggalLahir, alamat FROM data_rm WHERE nomorRm = $1",
    [nomorRm]
  );
  return result.length > 0 ? result[0] : null;
}

export interface MasterDataRmRow {
  nomorRm: string;
  namaPasien: string;
  nik?: string | null;
  jenisKelamin?: string | null;
  tanggalLahir?: string | null;
  alamat?: string | null;
  createdAt?: string | null;
  totalTransaksi: number;
  isDipinjam?: number | boolean;
}

export interface DataRmStats {
  totalPasien: number;
  sedangDipinjam: number;
  rmBaruBulanIni: number;
}

/**
 * Mengambil ringkasan statistik Master Data RM
 */
export async function getDataRmStats(): Promise<DataRmStats> {
  const db = await getDb();

  const [totalRes, dipinjamRes, baruRes] = await Promise.all([
    db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM data_rm"),
    db.select<{ count: number }[]>(
      `SELECT COUNT(DISTINCT nomorRm) as count FROM peminjaman 
       WHERE status IN ('DIPINJAM', 'TERLAMBAT') 
         AND NOT EXISTS (SELECT 1 FROM pengembalian WHERE pengembalian.peminjamanId = peminjaman.id)`
    ),
    db.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM data_rm WHERE strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now')"
    ),
  ]);

  return {
    totalPasien: totalRes[0]?.count ?? 0,
    sedangDipinjam: dipinjamRes[0]?.count ?? 0,
    rmBaruBulanIni: baruRes[0]?.count ?? 0,
  };
}

/**
 * Mendapatkan seluruh Data RM beserta jumlah transaksi (peminjaman) dan status fisik berkas
 */
export async function getAllDataRm(): Promise<MasterDataRmRow[]> {
  const db = await getDb();
  const query = `
    SELECT 
      d.nomorRm, 
      d.namaPasien, 
      d.nik, 
      d.jenisKelamin, 
      d.tanggalLahir, 
      d.alamat, 
      d.createdAt,
      COUNT(p.id) as totalTransaksi,
      EXISTS (
        SELECT 1 FROM peminjaman p2 
        WHERE p2.nomorRm = d.nomorRm 
          AND p2.status IN ('DIPINJAM', 'TERLAMBAT')
          AND NOT EXISTS (SELECT 1 FROM pengembalian pg WHERE pg.peminjamanId = p2.id)
      ) as isDipinjam
    FROM data_rm d
    LEFT JOIN peminjaman p ON d.nomorRm = p.nomorRm
    GROUP BY d.nomorRm, d.namaPasien, d.nik, d.jenisKelamin, d.tanggalLahir, d.alamat, d.createdAt
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
    SELECT 
      d.nomorRm, 
      d.namaPasien, 
      d.nik, 
      d.jenisKelamin, 
      d.tanggalLahir, 
      d.alamat, 
      d.createdAt,
      COUNT(p.id) as totalTransaksi,
      EXISTS (
        SELECT 1 FROM peminjaman p2 
        WHERE p2.nomorRm = d.nomorRm 
          AND p2.status IN ('DIPINJAM', 'TERLAMBAT')
          AND NOT EXISTS (SELECT 1 FROM pengembalian pg WHERE pg.peminjamanId = p2.id)
      ) as isDipinjam
    FROM data_rm d
    LEFT JOIN peminjaman p ON d.nomorRm = p.nomorRm
    WHERE d.nomorRm LIKE $1 OR d.namaPasien LIKE $1
    GROUP BY d.nomorRm, d.namaPasien, d.nik, d.jenisKelamin, d.tanggalLahir, d.alamat, d.createdAt
    ORDER BY d.nomorRm ASC
  `;
  return await db.select<MasterDataRmRow[]>(query, [searchPattern]);
}

/**
 * Mengecek jumlah riwayat/transaksi peminjaman yang terhubung ke nomor RM
 */
export async function checkDataRmHasTransactions(nomorRm: string): Promise<number> {
  const db = await getDb();
  const result = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM peminjaman WHERE nomorRm = $1",
    [nomorRm]
  );
  return result[0]?.count ?? 0;
}

/**
 * Menghapus Data RM secara aman.
 * Menolak penghapusan bila masih terdapat transaksi/riwayat peminjaman.
 */
export async function deleteDataRm(nomorRm: string): Promise<void> {
  const db = await getDb();
  const txCount = await checkDataRmHasTransactions(nomorRm);
  if (txCount > 0) {
    throw new Error(`Data RM ${nomorRm} tidak dapat dihapus karena masih memiliki ${txCount} riwayat transaksi peminjaman.`);
  }

  const res = await db.execute("DELETE FROM data_rm WHERE nomorRm = $1", [nomorRm]);
  if (res.rowsAffected === 0) {
    throw new Error(`Data RM ${nomorRm} tidak ditemukan atau gagal dihapus.`);
  }
}

