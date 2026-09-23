# 08 — Sinkronisasi Notifikasi Otomatis (`notificationService.ts`)

---

- **FILE**: `src/lib/database/notificationService.ts`
- **FUNCTION/COMPONENT**: `syncNotifications()`, `getNotifications()`, `markAsRead()`, `getUnreadCount()`

---

## TUJUAN
Melakukan pemantauan berkas aktif secara pasif (*passive synchronization*), membersihkan pesan usang dari berkas yang telah dikembalikan, serta menerbitkan peringatan `REMINDER` ($\le 24$ jam) dan `TERLAMBAT` ($> 48$ jam).

---

## ALUR
1. **Auto-Cleanup**: Menghapus notifikasi dari peminjaman yang statusnya sudah `'DIKEMBALIKAN'` atau sudah memiliki pasangan di tabel `pengembalian`.
2. **Ambil Peminjaman Aktif**: Query seluruh transaksi dengan status `DIPINJAM` atau `TERLAMBAT`.
3. **Iterasi Evaluasi**: Untuk setiap peminjaman aktif:
   - Hitung deadline via `calculateDeadline()`.
   - Jika `now > deadline`:
     - Cek apakah notifikasi `'TERLAMBAT'` sudah ada. Jika belum, masukkan pesan keterlambatan.
     - Jika status di tabel `peminjaman` masih `'DIPINJAM'`, mutakhirkan menjadi `'TERLAMBAT'`.
   - Jika `now <= deadline`:
     - Hitung selisih waktu `diffMs = deadline - now`.
     - Jika $0 < \text{diffMs} \le 24\text{ jam}$ dan notifikasi `'REMINDER'` belum ada, masukkan pesan pengingat 24 jam.

---

## INPUT / PROSES / OUTPUT
- **INPUT**: Waktu sistem saat fungsi dieksekusi (`new Date().getTime()`).
- **PROSES**:
  - Pembersihan otomatis query DELETE
  - Loop evaluasi deadline
  - Penulisan baris baru ke tabel `notifications`
  - Update status otomatis pada tabel `peminjaman`
- **OUTPUT**:
  - `Promise<void>`

---

## KENAPA PENTING
Aplikasi desktop offline tidak memiliki background cron server seperti di lingkungan server Linux/Node.js. Fungsi `syncNotifications` menyediakan mekanisme pintar yang berjalan setiap kali user membuka aplikasi atau mengakses halaman, menjaga antrean notifikasi selalu relevan dan bersih dari pesan usang.

---

## KEMUNGKINAN DITANYA PENGUJI
> *"Kapan `syncNotifications()` dipanggil dalam siklus hidup aplikasi?"*

---

## JAWABAN REKOMENDASI
> *"Fungsi `syncNotifications()` dipanggil pada level atas aplikasi (`App.tsx` di dalam `useEffect`) saat pertama kali antarmuka dimuat, serta dipanggil ulang setiap kali terjadi transaksi peminjaman baru atau pengembalian berkas, menjamin status peringatan selalu mutakhir."*

---

## KODE TERKAIT

```typescript
export async function syncNotifications(): Promise<void> {
  const db = await getDb();
  
  // 1. Bersihkan notifikasi untuk peminjaman yang sudah DIKEMBALIKAN
  await db.execute(
    `DELETE FROM notifications WHERE peminjamanId IN (
      SELECT id FROM peminjaman WHERE status = 'DIKEMBALIKAN'
        OR EXISTS (SELECT 1 FROM pengembalian WHERE pengembalian.peminjamanId = peminjaman.id)
    )`
  );

  // 2. Cari peminjaman aktif
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
        await db.execute(
          `UPDATE peminjaman SET status = 'TERLAMBAT', updatedAt = CURRENT_TIMESTAMP WHERE id = $1`,
          [p.id]
        );
      }
    } else {
      // REMINDER (<= 24 jam)
      const diffMs = deadline - now;
      if (diffMs <= 24 * 60 * 60 * 1000 && diffMs > 0) {
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
```
