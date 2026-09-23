# 04 — Layanan Peminjaman Rekam Medis (`peminjamanService.ts`)

---

- **FILE**: `src/lib/database/peminjamanService.ts`
- **FUNCTION/COMPONENT**: `checkActivePeminjaman(nomorRm)`, `createPeminjaman(data)`, `getAllPeminjaman()`

---

## TUJUAN
Mengelola transaksi sirkulasi peminjaman berkas rekam medis dan menegakkan aturan bisnis utama: **Satu berkas rekam medis hanya dapat dipinjam oleh satu pihak dalam satu waktu (*single active loan per physical document*)**.

---

## ALUR
1. Sebelum peminjaman disimpan, `createPeminjaman` mengeksekusi `checkActivePeminjaman(data.nomorRm)` sebagai proteksi pertahanan berlapis (*defense-in-depth*).
2. `checkActivePeminjaman` mencari apakah berkas tersebut memiliki transaksi dengan status `DIPINJAM` atau `TERLAMBAT` yang belum memiliki rekaman di tabel `pengembalian` (`NOT EXISTS (SELECT 1 FROM pengembalian WHERE peminjamanId = peminjaman.id)`).
3. Jika berkas masih berstatus aktif dipinjam, sistem menggagalkan transaksi dan melempar pesan error: `"Rekam medis {nomorRm} masih berstatus aktif dipinjam."`
4. Jika berkas berstatus bebas (tersedia di filing), query `INSERT INTO peminjaman` dieksekusi dengan status awal `'DIPINJAM'`.
5. Mengembalikan `lastInsertId` transaksi baru.

---

## INPUT / PROSES / OUTPUT
- **INPUT**:
  - `data`: Objek berisi `{ tanggalPinjam, tanggalBerkasKeluar, peminjamId, namaPeminjam, unit, nomorRm, namaPasien, jilid, catatan, status }`
- **PROSES**:
  - Query verifikasi ketersediaan berkas aktif
  - Eksekusi parameterized insert query SQLite
- **OUTPUT**:
  - `Promise<number>`: ID baris peminjaman yang baru dibuat.

---

## KENAPA PENTING
Berkas rekam medis adalah dokumen fisik tunggal (*hardcopy*). Jika sistem mengizinkan berkas yang sama dipinjam oleh dua ruangan berbeda (misalnya Poli Bedah dan Rawat Inap Melati pada saat bersamaan), akan timbul anomali lokasi berkas fisik yang dapat membahayakan keselamatan pasien karena dokter tidak memegang berkas riwayat medis yang dibutuhkan.

---

## KEMUNGKINAN DITANYA PENGUJI
> *"Kenapa verifikasi pinjaman aktif dilakukan dua kali (di frontend UI dan di service `createPeminjaman`)?"*

---

## JAWABAN REKOMENDASI
> *"Ini adalah penerapan prinsip **Defense-in-Depth** (pertahanan berlapis). Validasi di UI bertujuan untuk kenyamanan interaksi pengguna (*User Experience*), sedangkan validasi di service layer adalah benteng keamanan integritas data agar transaksi peminjaman ganda tidak pernah tembus ke basis data dalam kondisi apa pun."*

---

## KODE TERKAIT

```typescript
export async function checkActivePeminjaman(nomorRm: string): Promise<PeminjamanRow | null> {
  const db = await getDb();
  // Peminjaman aktif = DIPINJAM atau TERLAMBAT dan belum ada di tabel pengembalian
  const result = await db.select<PeminjamanRow[]>(
    `SELECT * FROM peminjaman 
     WHERE nomorRm = $1 AND status IN ('DIPINJAM', 'TERLAMBAT')
       AND NOT EXISTS (SELECT 1 FROM pengembalian WHERE pengembalian.peminjamanId = peminjaman.id)
     ORDER BY tanggalPinjam DESC LIMIT 1`,
    [nomorRm]
  );
  return result.length > 0 ? result[0] : null;
}

export async function createPeminjaman(data: Omit<PeminjamanRow, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const db = await getDb();
  
  // Extra layer of validation (defense in depth)
  const active = await checkActivePeminjaman(data.nomorRm);
  if (active) {
    throw new Error(`Rekam medis ${data.nomorRm} masih berstatus aktif dipinjam.`);
  }

  const result = await db.execute(
    `INSERT INTO peminjaman (
      tanggalPinjam, tanggalBerkasKeluar, peminjamId, namaPeminjam, unit, 
      nomorRm, namaPasien, jilid, catatan, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      data.tanggalPinjam,
      data.tanggalBerkasKeluar || null,
      data.peminjamId,
      data.namaPeminjam || null,
      data.unit,
      data.nomorRm,
      data.namaPasien,
      data.jilid || null,
      data.catatan || null,
      data.status
    ]
  );
  
  return result.lastInsertId as number;
}
```
