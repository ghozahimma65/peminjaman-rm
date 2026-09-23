# 06 — Proses Pengembalian Berkas dan Rollback (`pengembalianService.ts`)

---

- **FILE**: `src/lib/database/pengembalianService.ts`
- **FUNCTION/COMPONENT**: `processPengembalian(peminjamanId, userId, kondisiBerkas, tanggalBerkasKembali)`

---

## TUJUAN
Memproses pengembalian fisik berkas rekam medis dengan proteksi transaksional bertingkat, validasi integritas waktu (*temporal validation*), pencatatan kondisi fisik (BAIK/RUSAK), dan penanganan pemulihan kegagalan (*rollback handler*).

---

## ALUR
1. Mengambil timestamp waktu sekarang secara otomatis (`new Date().toISOString()`).
2. Melakukan validasi temporal: waktu kembali tidak boleh lebih awal dari `tanggalBerkasKeluar` atau `tanggalPinjam`.
3. Memastikan peminjaman masih aktif (status `DIPINJAM` atau `TERLAMBAT`).
4. Memperbarui status peminjaman menjadi `'DIKEMBALIKAN'` pada tabel `peminjaman`.
5. Melakukan verifikasi ulang status (*sanity check*) bahwa baris benar-benar telah terupdate.
6. Menyisipkan record ke tabel `pengembalian` dengan mencatat `peminjamanId`, `tanggalBerkasKembali`, `dikembalikanOlehId`, dan `kondisiBerkas`.
7. Jika terjadi galat di tengah proses, blok `catch` secara otomatis membatalkan record pengembalian (`DELETE`) dan merestore status peminjaman kembali ke `'DIPINJAM'`.
8. Jika error disebabkan pelanggaran `UNIQUE constraint` (duplikasi pengembalian), lemparkan pesan yang ramah pengguna.

---

## INPUT / PROSES / OUTPUT
- **INPUT**:
  - `peminjamanId`: number
  - `userId`: number (petugas yang sedang login)
  - `kondisiBerkas`: "BAIK" | "RUSAK" (default: "BAIK")
  - `tanggalBerkasKembali?`: string (opsional)
- **PROSES**:
  - Validasi temporal
  - Pengecekan status aktif
  - Eksekusi UPDATE tabel `peminjaman`
  - Eksekusi INSERT tabel `pengembalian`
  - Penanganan Rollback jika gagal
- **OUTPUT**:
  - `Promise<void>` (Sukses tanpa return value, melempar Error jika gagal).

---

## KENAPA PENTING
Pengembalian berkas melibatkan dua tabel yang saling terikat secara relasional. Tanpa proteksi rollback, kegagalan di tengah jalan dapat menyebabkan status peminjaman berubah menjadi `'DIKEMBALIKAN'` padahal baris riwayat di tabel `pengembalian` belum terbentuk, sehingga merusak integritas data laporan.

---

## KEMUNGKINAN DITANYA PENGUJI
> *"Bagaimana sistem menangani situasi di mana dua petugas secara bersamaan mengklik tombol konfirmasi pengembalian untuk berkas yang sama?"*

---

## JAWABAN REKOMENDASI
> *"Sistem dilindungi oleh constraint tingkat database: `peminjamanId INTEGER UNIQUE NOT NULL` pada tabel `pengembalian`. Transaksi pertama akan berhasil, sedangkan transaksi kedua akan langsung digagalkan oleh mesin SQLite karena pelanggaran constraint UNIQUE. Blok catch kemudian menangkap error tersebut dan menampilkan pesan informatif: 'Berkas ini sudah dikembalikan (duplikasi transaksi)'."*

---

## KODE TERKAIT

```typescript
export async function processPengembalian(
  peminjamanId: number, 
  userId: number, 
  kondisiBerkas: "BAIK" | "RUSAK" = "BAIK", 
  tanggalBerkasKembali?: string
): Promise<void> {
  const db = await getDb();
  const returnDate = tanggalBerkasKembali || new Date().toISOString();

  // Validasi temporal
  const pinjamRows = await db.select<{ tanggalBerkasKeluar: string | null; tanggalPinjam: string }[]>(
    "SELECT tanggalBerkasKeluar, tanggalPinjam FROM peminjaman WHERE id = $1",
    [peminjamanId]
  );
  if (pinjamRows.length > 0) {
    const referenceDate = new Date(pinjamRows[0].tanggalBerkasKeluar || pinjamRows[0].tanggalPinjam);
    const returnDateObj = new Date(returnDate);
    if (returnDateObj < referenceDate) {
      throw new Error(`Waktu kembali tidak boleh lebih awal dari waktu berkas keluar.`);
    }
  }

  let insertedReturnId: number | null = null;
  try {
    await db.execute(
      `UPDATE peminjaman SET status = 'DIKEMBALIKAN', updatedAt = CURRENT_TIMESTAMP
       WHERE id = $1 AND status IN ('DIPINJAM', 'TERLAMBAT')`,
      [peminjamanId],
    );

    const insertResult = await db.execute(
      `INSERT INTO pengembalian (peminjamanId, tanggalBerkasKembali, dikembalikanOlehId, konfirmasiKembali, kondisiBerkas)
       VALUES ($1, $2, $3, 1, $4)`,
      [peminjamanId, returnDate, userId, kondisiBerkas],
    );
    insertedReturnId = insertResult.lastInsertId as number;
  } catch (error: unknown) {
    // Rollback manual
    if (insertedReturnId) await db.execute("DELETE FROM pengembalian WHERE id = $1", [insertedReturnId]);
    await db.execute("UPDATE peminjaman SET status = 'DIPINJAM', updatedAt = CURRENT_TIMESTAMP WHERE id = $1", [peminjamanId]);
    
    const errMessage = (error as Error).message || "";
    if (errMessage.includes("UNIQUE")) {
      throw new Error("Berkas ini sudah dikembalikan (duplikasi transaksi).");
    }
    throw error;
  }
}
```
