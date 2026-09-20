/**
 * Helper terpusat untuk kalkulasi Batas Pengembalian (Deadline)
 * dan Status Peminjaman / Pengembalian Rekam Medis (2 x 24 jam / 48 jam).
 */

export const RETURN_PERIOD_MS = 2 * 24 * 60 * 60 * 1000; // 48 Jam (2 x 24 Jam)

/**
 * Menghitung batas pengembalian (deadline) berdasarkan tanggalBerkasKeluar (atau fallback tanggalPinjam).
 */
export function calculateDeadline(tanggalBerkasKeluar?: string | null, tanggalPinjam?: string | null): Date | null {
  const dateStr = tanggalBerkasKeluar || tanggalPinjam;
  if (!dateStr) return null;
  const startTime = new Date(dateStr);
  if (Number.isNaN(startTime.getTime())) return null;
  return new Date(startTime.getTime() + RETURN_PERIOD_MS);
}

/**
 * Menentukan apakah suatu transaksi terlambat.
 * - Jika sudah dikembalikan (`tanggalBerkasKembali` diset): terlambat jika `tanggalBerkasKembali > deadline`.
 * - Jika belum dikembalikan: terlambat jika `referenceTime (default: sekarang) > deadline`.
 */
export function isOverdue(
  tanggalBerkasKeluar?: string | null,
  tanggalPinjam?: string | null,
  tanggalBerkasKembali?: string | null,
  referenceTime: Date = new Date()
): boolean {
  const deadline = calculateDeadline(tanggalBerkasKeluar, tanggalPinjam);
  if (!deadline) return false;

  if (tanggalBerkasKembali) {
    const returnTime = new Date(tanggalBerkasKembali);
    if (Number.isNaN(returnTime.getTime())) return false;
    return returnTime.getTime() > deadline.getTime();
  }

  return referenceTime.getTime() > deadline.getTime();
}

/**
 * Mendapatkan status standar transaksi:
 * - 'TERLAMBAT': jika `isOverdue` true (baik sudah dikembalikan maupun belum).
 * - 'DIKEMBALIKAN': jika sudah dikembalikan dan `isOverdue` false.
 * - 'DIPINJAM': jika belum dikembalikan dan `isOverdue` false.
 */
export function calculateEffectiveStatus(
  tanggalBerkasKeluar?: string | null,
  tanggalPinjam?: string | null,
  tanggalBerkasKembali?: string | null,
  referenceTime: Date = new Date()
): "DIPINJAM" | "DIKEMBALIKAN" | "TERLAMBAT" {
  const late = isOverdue(tanggalBerkasKeluar, tanggalPinjam, tanggalBerkasKembali, referenceTime);
  if (late) {
    return "TERLAMBAT";
  }
  if (tanggalBerkasKembali) {
    return "DIKEMBALIKAN";
  }
  return "DIPINJAM";
}
