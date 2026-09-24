import { getDb } from "./index";
import { calculateDeadline } from "../statusHelper";

export interface NotificationRow {
  id: number;
  type: "REMINDER" | "TERLAMBAT";
  peminjamanId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationRowWithRm extends NotificationRow {
  nomorRm: string | null;
}

/**
 * Sinkronisasi notifikasi secara pasif
 * Dipanggil ketika aplikasi di-load atau user membuka area tertentu.
 */
export async function syncNotifications(): Promise<void> {
  const db = await getDb();
  
  // Bersihkan notifikasi untuk peminjaman yang sudah DIKEMBALIKAN
  await db.execute(
    `DELETE FROM notifications WHERE peminjamanId IN (
      SELECT id FROM peminjaman WHERE status = 'DIKEMBALIKAN'
        OR EXISTS (SELECT 1 FROM pengembalian WHERE pengembalian.peminjamanId = peminjaman.id)
    )`
  );

  // Cari peminjaman yang masih aktif (DIPINJAM atau TERLAMBAT)
  const aktifPeminjaman = await db.select<{ id: number, nomorRm: string, tanggalBerkasKeluar: string | null, tanggalPinjam: string, status: string }[]>(
    `SELECT id, nomorRm, tanggalBerkasKeluar, tanggalPinjam, status FROM peminjaman 
     WHERE status IN ('DIPINJAM', 'TERLAMBAT')
       AND NOT EXISTS (SELECT 1 FROM pengembalian WHERE pengembalian.peminjamanId = peminjaman.id)`
  );

  const now = new Date().getTime();

  for (const p of aktifPeminjaman) {
    const deadlineObj = calculateDeadline(p.tanggalBerkasKeluar, p.tanggalPinjam);
    if (!deadlineObj) continue;
    
    const deadline = deadlineObj.getTime();

    if (now > deadline) {
      // TERLAMBAT
      const existing = await db.select<{ id: number }[]>(
        `SELECT id FROM notifications WHERE peminjamanId = $1 AND type = 'TERLAMBAT'`,
        [p.id]
      );
      
      if (existing.length === 0) {
        await db.execute(
          `INSERT INTO notifications (type, peminjamanId, message) VALUES ('TERLAMBAT', $1, $2)`,
          [p.id, `RM ${p.nomorRm} sudah melewati batas waktu pengembalian.`]
        );
      }
      
      if (p.status === 'DIPINJAM') {
        // Otomatis ubah status peminjaman menjadi TERLAMBAT
        await db.execute(
          `UPDATE peminjaman SET status = 'TERLAMBAT', updatedAt = CURRENT_TIMESTAMP WHERE id = $1`,
          [p.id]
        );
      }
    } else {
      // Belum terlambat. Cek reminder (deadline - now <= 24 jam)
      const diffMs = deadline - now;
      if (diffMs <= 24 * 60 * 60 * 1000 && diffMs > 0) {
        // REMINDER
        const existing = await db.select<{ id: number }[]>(
          `SELECT id FROM notifications WHERE peminjamanId = $1 AND type = 'REMINDER'`,
          [p.id]
        );

        if (existing.length === 0) {
          await db.execute(
            `INSERT INTO notifications (type, peminjamanId, message) VALUES ('REMINDER', $1, $2)`,
            [p.id, `RM ${p.nomorRm} mendekati batas waktu pengembalian.`]
          );
        }
      }
    }
  }
}

export async function getNotifications(): Promise<NotificationRow[]> {
  const db = await getDb();
  const result = await db.select<NotificationRow[]>(
    `SELECT id, type, peminjamanId, message, isRead, createdAt 
     FROM notifications 
     ORDER BY isRead ASC, createdAt DESC`
  );
  return result;
}

export async function getNotificationsWithRm(): Promise<NotificationRowWithRm[]> {
  const db = await getDb();
  const result = await db.select<NotificationRowWithRm[]>(
    `SELECT n.id, n.type, n.peminjamanId, n.message, n.isRead, n.createdAt,
            p.nomorRm
     FROM notifications n
     LEFT JOIN peminjaman p ON n.peminjamanId = p.id
     ORDER BY n.isRead ASC, n.createdAt DESC`
  );
  return result;
}

export async function markAsRead(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE notifications SET isRead = 1 WHERE id = $1`, [id]);
}

export async function markAllAsRead(): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE notifications SET isRead = 1 WHERE isRead = 0`);
}

export async function getUnreadCount(): Promise<number> {
  const db = await getDb();
  const result = await db.select<{ count: number }[]>(
    `SELECT COUNT(id) as count FROM notifications WHERE isRead = 0`
  );
  return result[0]?.count || 0;
}
