# 10 — Master Data Rekam Medis dan Validasi NIK (`dataRmService.ts`)

---

- **FILE**: `src/lib/database/dataRmService.ts`
- **FUNCTION/COMPONENT**: `validateNik(nik)`, `getAllDataRm()`, `getDataRmStats()`

---

## TUJUAN
Memastikan validitas format data kependudukan pasien (NIK tepat 16 digit), menyediakan daftar master data berkas rekam medis yang diperkaya dengan status fisik apakah saat ini sedang dipinjam atau tersedia, serta menghitung metrik statistik untuk ringkasan kartu antarmuka.

---

## ALUR
1. **`validateNik(nik)`**:
   - Memangkas spasi input (`nik.trim()`).
   - Melakukan evaluasi ekspresi reguler: `/^\d{16}$/`.
   - Jika karakter kurang atau lebih dari 16 digit angka, atau mengandung karakter non-angka, lemparkan error validasi.
2. **`getAllDataRm()`**:
   - Menjalankan kueri agregasi menggabungkan `data_rm` dengan `peminjaman`.
   - Menggunakan klausa subquery `EXISTS (...)` untuk memeriksa apakah terdapat transaksi peminjaman terbuka (`status IN ('DIPINJAM', 'TERLAMBAT')` tanpa catatan pengembalian) untuk menandai status boolean `isDipinjam`.

---

## INPUT / PROSES / OUTPUT
- **INPUT**:
  - `nik: string`
- **PROSES**:
  - Regex test: `/^\d{16}$/`
  - Subquery SQL dengan agregasi `COUNT(p.id)` dan ekspresi `EXISTS`
- **OUTPUT**:
  - Validasi: void (melempar error jika invalid)
  - Master data: array objek pasien lengkap dengan metrik `totalTransaksi` dan flag `isDipinjam`.

---

## KENAPA PENTING
NIK merupakan identitas kependudukan tunggal di Indonesia. Validasi ketat menjamin kualitas data master rumah sakit. Selain itu, kalkulasi `isDipinjam` langsung pada kueri master data memungkinkan petugas filing melihat ketersediaan berkas di rak arsip tanpa harus membuka menu peminjaman.

---

## KEMUNGKINAN DITANYA PENGUJI
> *"Kenapa penentuan apakah berkas sedang dipinjam pada `getAllDataRm()` menggunakan `EXISTS` dan bukan sekadar mengecek status peminjaman terakhir?"*

---

## JAWABAN REKOMENDASI
> *"Klausa `EXISTS` mengevaluasi secara spesifik apakah ada peminjaman berstatus aktif yang belum memiliki pasangan di tabel pengembalian. Cara ini menjamin integritas logika bahwa jika ada transaksi terbuka yang belum diselesaikan, berkas secara fisik pasti sedang berada di luar ruang filing."*

---

## KODE TERKAIT

```typescript
export function validateNik(nik: string): void {
  const trimmed = nik.trim();
  if (!/^\d{16}$/.test(trimmed)) {
    throw new Error("NIK wajib terdiri dari tepat 16 digit angka (tanpa huruf, spasi, atau simbol).");
  }
}

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
```
