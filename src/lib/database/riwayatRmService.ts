import { getDb } from "./index";

export interface DataRmInfo {
  nomorRm: string;
  namaPasien: string;
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
 * Mencari seluruh riwayat berdasarkan Nomor RM.
 * Mengembalikan objek gabungan Pasien + array Transaksi.
 * Melempar error jika Nomor RM tidak ditemukan.
 */
export async function getRiwayatByRm(nomorRm: string): Promise<RiwayatRmResult> {
  const db = await getDb();
  
  // 1. Cek Data RM
  const pasienResult = await db.select<DataRmInfo[]>(
    "SELECT nomorRm, namaPasien FROM data_rm WHERE nomorRm = $1",
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
      p.unit,
      p.jilid,
      p.catatan,
      pg.kondisiBerkas,
      CASE WHEN pg.id IS NOT NULL THEN 'DIKEMBALIKAN' ELSE p.status END as statusPeminjaman,
      p.peminjamId,
      u1.name as peminjamName,
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
  
  const transaksi = await db.select<RiwayatTransaksiRow[]>(query, [nomorRm]);

  return {
    pasien,
    transaksi
  };
}
