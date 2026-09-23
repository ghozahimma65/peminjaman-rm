import { getDb } from "./index";
import { calculateEffectiveStatus } from "../statusHelper";


export interface DataRmInfo {
  nomorRm: string;
  namaPasien: string;
  nik?: string | null;
  jenisKelamin?: string | null;
  tanggalLahir?: string | null;
  alamat?: string | null;
}

export interface RiwayatTransaksiRow {
  peminjamanId: number;
  tanggalPinjam: string;
  tanggalBerkasKeluar: string | null;
  unit: string;
  jilid: string | null;
  catatan: string | null;
  kondisiBerkas: "BAIK" | "RUSAK" | null;
  statusPeminjaman: string; // 'DIPINJAM', 'TERLAMBAT', 'DIKEMBALIKAN'
  
  // Detail Peminjam
  peminjamId: number;
  peminjamName: string;
  
  // Data Pengembalian (nullable jika belum kembali)
  pengembalianId: number | null;
  tanggalBerkasKembali: string | null;
  dikembalikanOlehId: number | null;
  dikembalikanOlehName: string | null;
}

export interface RiwayatRmResult {
  pasien: DataRmInfo;
  transaksi: RiwayatTransaksiRow[];
}

/**
 * Row untuk tampilan seluruh riwayat (tanpa filter per-RM)
 */
export interface AllRiwayatRow {
  peminjamanId: number;
  nomorRm: string;
  namaPasien: string;
  tanggalPinjam: string;
  tanggalBerkasKeluar: string | null;
  unit: string;
  jilid: string | null;
  catatan: string | null;
  kondisiBerkas: "BAIK" | "RUSAK" | null;
  peminjamId: number;
  peminjamName: string;
  pengembalianId: number | null;
  tanggalBerkasKembali: string | null;
  dikembalikanOlehId: number | null;
  dikembalikanOlehName: string | null;
  statusPeminjaman: string;
}

/**
 * Mencari seluruh riwayat berdasarkan Nomor RM.
 * Mengembalikan objek gabungan Pasien + array Transaksi.
 * Melempar error jika Nomor RM tidak ditemukan.
 */
export async function getRiwayatByRm(nomorRm: string): Promise<RiwayatRmResult> {
  const db = await getDb();
  
  // 1. Cek Data RM
  const pasienResult = await db.select<DataRmInfo[]>(
    "SELECT nomorRm, namaPasien, nik, jenisKelamin, tanggalLahir, alamat FROM data_rm WHERE nomorRm = $1",
    [nomorRm]
  );
  
  if (pasienResult.length === 0) {
    throw new Error(`Data RM dengan nomor ${nomorRm} tidak ditemukan.`);
  }
  
  const pasien = pasienResult[0];

  // 2. Ambil Transaksi (Peminjaman LEFT JOIN Pengembalian LEFT JOIN Users x 2)
  const query = `
    SELECT 
      p.id as peminjamanId,
      p.tanggalPinjam,
      p.tanggalBerkasKeluar,
      p.namaPeminjam,
      p.unit,
      p.jilid,
      p.catatan,
      pg.kondisiBerkas,
      p.status as baseStatus,
      p.peminjamId,
      u1.name as operatorPeminjamName,
      pg.id as pengembalianId,
      pg.tanggalBerkasKembali,
      pg.dikembalikanOlehId,
      u2.name as dikembalikanOlehName
    FROM peminjaman p
    LEFT JOIN pengembalian pg ON p.id = pg.peminjamanId
    LEFT JOIN users u1 ON p.peminjamId = u1.id
    LEFT JOIN users u2 ON pg.dikembalikanOlehId = u2.id
    WHERE p.nomorRm = $1
    ORDER BY p.tanggalPinjam DESC
  `;
  
  const rawRows = await db.select<(RiwayatTransaksiRow & { namaPeminjam?: string | null; operatorPeminjamName?: string })[]>(query, [nomorRm]);
  const transaksi = rawRows.map(t => ({
    ...t,
    peminjamName: t.namaPeminjam || t.operatorPeminjamName || 'Petugas',
    statusPeminjaman: calculateEffectiveStatus(t.tanggalBerkasKeluar, t.tanggalPinjam, t.tanggalBerkasKembali)
  }));

  return {
    pasien,
    transaksi
  };
}

/**
 * Menghapus data transaksi peminjaman (dan pengembalian jika ada) dari database
 */
export async function deletePeminjamanHistory(peminjamanId: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM pengembalian WHERE peminjamanId = $1", [peminjamanId]);
  await db.execute("DELETE FROM notifications WHERE peminjamanId = $1", [peminjamanId]);
  await db.execute("DELETE FROM peminjaman WHERE id = $1", [peminjamanId]);
}

/**
 * Mengubah catatan/unit pada transaksi peminjaman
 */
export async function updatePeminjamanHistory(peminjamanId: number, unit: string, catatan: string | null): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE peminjaman SET unit = $1, catatan = $2, updatedAt = CURRENT_TIMESTAMP WHERE id = $3",
    [unit, catatan, peminjamanId]
  );
}

/**
 * Mengambil seluruh riwayat transaksi dari semua RM.
 * Optional: filter search berdasarkan nomorRm, namaPasien, atau peminjam.
 */
export async function getAllRiwayat(search?: string): Promise<AllRiwayatRow[]> {
  const db = await getDb();

  let query = `
    SELECT
      p.id as peminjamanId,
      p.nomorRm,
      p.namaPasien,
      p.tanggalPinjam,
      p.tanggalBerkasKeluar,
      p.unit,
      p.jilid,
      p.catatan,
      p.peminjamId,
      p.namaPeminjam,
      u1.name as operatorPeminjamName,
      pg.id as pengembalianId,
      pg.tanggalBerkasKembali,
      pg.kondisiBerkas,
      pg.dikembalikanOlehId,
      u2.name as dikembalikanOlehName
    FROM peminjaman p
    LEFT JOIN pengembalian pg ON p.id = pg.peminjamanId
    LEFT JOIN users u1 ON p.peminjamId = u1.id
    LEFT JOIN users u2 ON pg.dikembalikanOlehId = u2.id
  `;

  const params: string[] = [];

  if (search && search.trim()) {
    const like = `%${search.trim()}%`;
    params.push(like, like, like, like);
    query += `
    WHERE
      p.nomorRm LIKE $1
      OR p.namaPasien LIKE $2
      OR p.namaPeminjam LIKE $3
      OR u1.name LIKE $4
    `;
  }

  query += ` ORDER BY p.tanggalPinjam DESC`;

  const rawRows = await db.select<(AllRiwayatRow & { namaPeminjam?: string | null; operatorPeminjamName?: string })[]>(query, params);
  return rawRows.map(r => ({
    ...r,
    peminjamName: r.namaPeminjam || r.operatorPeminjamName || 'Petugas',
    statusPeminjaman: calculateEffectiveStatus(r.tanggalBerkasKeluar, r.tanggalPinjam, r.tanggalBerkasKembali)
  }));
}
