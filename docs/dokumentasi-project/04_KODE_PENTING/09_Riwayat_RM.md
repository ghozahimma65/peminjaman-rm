# 09 — Penelusuran Riwayat Rekam Medis (`riwayatRmService.ts`)

---

- **FILE**: `src/lib/database/riwayatRmService.ts`
- **FUNCTION/COMPONENT**: `getAllRiwayat(search?)`, `getRiwayatByRm(nomorRm)`

---

## TUJUAN
Menyediakan kueri audit trail komprehensif yang menghubungkan riwayat transaksi peminjaman, pengembalian, data pasien, serta informasi petugas yang terlibat baik sebagai operator peminjam maupun penerima berkas.

---

## ALUR
1. **`getAllRiwayat(search?)`**:
   - Membangun query SQL gabungan `peminjaman` LEFT JOIN `pengembalian` LEFT JOIN `users` (sebagai operator peminjam) LEFT JOIN `users` (sebagai penerima kembali).
   - Jika terdapat parameter `search`, terapkan filter multi-kolom `LIKE %search%` pada: `nomorRm`, `namaPasien`, `namaPeminjam`, atau nama operator akun.
   - Hasil diurutkan secara kronologis terbalik (`ORDER BY p.tanggalPinjam DESC`).
   - Setiap baris hasil di-mapping untuk menghitung status dinamis via `calculateEffectiveStatus()`.
2. **`getRiwayatByRm(nomorRm)`**:
   - Memverifikasi keberadaan pasien di `data_rm`.
   - Mengambil seluruh transaksi sirkulasi khusus untuk nomor rekam medis tersebut.

---

## INPUT / PROSES / OUTPUT
- **INPUT**:
  - `search?: string` (kata kunci pencarian global)
  - `nomorRm: string` (nomor rekam medis spesifik)
- **PROSES**:
  - Kueri relasional multi-tabel (`LEFT JOIN`)
  - Filter pencarian dinamis
  - Kalkulasi status efektif
- **OUTPUT**:
  - Array transaksi riwayat teragregasi lengkap dengan identitas pihak-pihak terkait.

---

## KENAPA PENTING
Dalam audit medis, petugas sering kali perlu mengetahui dengan cepat di mana posisi berkas fisik berada, siapa dokter terakhir yang meminjamnya, dan siapa petugas filing yang bertanggung jawab menyerahkan dokumen tersebut. Modul ini menyatukan potongan informasi dari berbagai tabel dalam satu kueri terpadu.

---

## KEMUNGKINAN DITANYA PENGUJI
> *"Kenapa kueri pada `riwayatRmService.ts` melakukan JOIN ke tabel `users` sebanyak dua kali?"*

---

## JAWABAN REKOMENDASI
> *"Karena dalam satu siklus sirkulasi berkas terdapat dua peran petugas yang berbeda: petugas yang memproses pengajuan pinjaman (`p.peminjamId = u1.id`) dan petugas yang menerima fisik berkas saat dikembalikan (`pg.dikembalikanOlehId = u2.id`). Dengan melakukan JOIN dua kali dengan alias `u1` dan `u2`, nama kedua petugas tersebut dapat disajikan secara terpisah dan jelas."*

---

## KODE TERKAIT

```typescript
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
```
