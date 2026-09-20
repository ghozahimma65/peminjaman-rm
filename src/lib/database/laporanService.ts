import { getDb } from "./index";
import { calculateEffectiveStatus } from "../statusHelper";

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
      p.status as baseStatus,
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

  const rows = await db.select<(LaporanRow & { baseStatus?: string })[]>(query, params);
  
  let mapped = rows.map(r => ({
    ...r,
    status: calculateEffectiveStatus(r.tanggalBerkasKeluar, r.tanggalPinjam, r.tanggalBerkasKembali)
  }));

  if (filters.status && filters.status !== 'Semua') {
    mapped = mapped.filter(r => r.status === filters.status);
  }

  return mapped;
}

export interface TabelRekapitulasiRuang {
  no: number;
  unit: string;
  jumlahDipinjam: number;
  jumlahDikembalikan: number;
  belumDikembalikan: number;
  tepatWaktu: number;
  terlambat: number;
  keterangan: string;
}

export interface TabelStatusBerkas {
  no: number;
  statusBerkas: string;
  jumlah: number;
}

export function computeSummaryTables(data: LaporanRow[]) {
  const roomMap = new Map<string, {
    dipinjam: number;
    dikembalikan: number;
    belumDikembalikan: number;
    tepatWaktu: number;
    terlambat: number;
  }>();

  for (const row of data) {
    const room = row.unit || "Lainnya";
    if (!roomMap.has(room)) {
      roomMap.set(room, { dipinjam: 0, dikembalikan: 0, belumDikembalikan: 0, tepatWaktu: 0, terlambat: 0 });
    }
    const stat = roomMap.get(room)!;
    stat.dipinjam += 1;
    if (row.status === "DIKEMBALIKAN") {
      stat.dikembalikan += 1;
      stat.tepatWaktu += 1;
    } else if (row.status === "TERLAMBAT") {
      if (row.tanggalBerkasKembali) {
        stat.dikembalikan += 1;
      } else {
        stat.belumDikembalikan += 1;
      }
      stat.terlambat += 1;
    } else {
      stat.belumDikembalikan += 1;
      stat.tepatWaktu += 1;
    }
  }

  const tabelRuang: TabelRekapitulasiRuang[] = Array.from(roomMap.entries()).map(([unit, stat], idx) => ({
    no: idx + 1,
    unit,
    jumlahDipinjam: stat.dipinjam,
    jumlahDikembalikan: stat.dikembalikan,
    belumDikembalikan: stat.belumDikembalikan,
    tepatWaktu: stat.tepatWaktu,
    terlambat: stat.terlambat,
    keterangan: "-"
  }));

  const totalRuang: TabelRekapitulasiRuang = {
    no: 0,
    unit: "Total",
    jumlahDipinjam: tabelRuang.reduce((s, r) => s + r.jumlahDipinjam, 0),
    jumlahDikembalikan: tabelRuang.reduce((s, r) => s + r.jumlahDikembalikan, 0),
    belumDikembalikan: tabelRuang.reduce((s, r) => s + r.belumDikembalikan, 0),
    tepatWaktu: tabelRuang.reduce((s, r) => s + r.tepatWaktu, 0),
    terlambat: tabelRuang.reduce((s, r) => s + r.terlambat, 0),
    keterangan: "-"
  };

  const totalDipinjam = totalRuang.jumlahDipinjam;
  const totalDikembalikan = totalRuang.jumlahDikembalikan;
  const totalTerlambat = totalRuang.terlambat;

  const tabelStatus: TabelStatusBerkas[] = [
    { no: 1, statusBerkas: "Berkas telah dipinjam", jumlah: totalDipinjam },
    { no: 2, statusBerkas: "Berkas telah dikembalikan", jumlah: totalDikembalikan },
    { no: 3, statusBerkas: "Berkas terlambat dikembalikan", jumlah: totalTerlambat }
  ];

  const totalStatusCount = tabelStatus.reduce((s, r) => s + r.jumlah, 0);

  return { tabelRuang, totalRuang, tabelStatus, totalStatusCount };
}

