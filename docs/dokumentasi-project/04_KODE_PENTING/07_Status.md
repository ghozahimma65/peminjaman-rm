# 07 — Penentuan Status Efektif Transaksi (`statusHelper.ts`)

---

- **FILE**: `src/lib/statusHelper.ts`
- **FUNCTION/COMPONENT**: `calculateEffectiveStatus()`, `isOverdue()`

---

## TUJUAN
Menentukan status operasional transaksi secara dinamis (`"DIPINJAM" | "DIKEMBALIKAN" | "TERLAMBAT"`) dengan mengevaluasi titik waktu aktual terhadap batas waktu peminjaman 48 jam, bukan sekadar membaca kolom status statis dari database.

---

## ALUR
1. Memeriksa keterlambatan transaksi via `isOverdue(tanggalBerkasKeluar, tanggalPinjam, tanggalBerkasKembali, referenceTime)`.
2. Jika berkas **sudah dikembalikan** (`tanggalBerkasKembali` ada):
   - Jika `tanggalBerkasKembali > deadline` $\rightarrow$ status adalah `'TERLAMBAT'`.
   - Jika `tanggalBerkasKembali <= deadline` $\rightarrow$ status adalah `'DIKEMBALIKAN'`.
3. Jika berkas **belum dikembalikan** (`tanggalBerkasKembali` null):
   - Jika `waktuSekarang > deadline` $\rightarrow$ status adalah `'TERLAMBAT'`.
   - Jika `waktuSekarang <= deadline` $\rightarrow$ status adalah `'DIPINJAM'`.

---

## INPUT / PROSES / OUTPUT
- **INPUT**:
  - `tanggalBerkasKeluar?: string | null`
  - `tanggalPinjam?: string | null`
  - `tanggalBerkasKembali?: string | null`
  - `referenceTime: Date` (default: `new Date()`)
- **PROSES**:
  - Evaluasi batas deadline
  - Pembandingan matematis waktu
- **OUTPUT**:
  - `"DIPINJAM" | "DIKEMBALIKAN" | "TERLAMBAT"`

---

## KENAPA PENTING
Jika status hanya disimpan secara statis di database, berkas yang dipinjam kemarin sore dan telah melewati batas 48 jam akan tetap berstatus `'DIPINJAM'` jika tidak ada cron/trigger database yang mengubahnya. Dengan fungsi `calculateEffectiveStatus()`, status selalu dihitung segar (*on-the-fly*) saat data diambil, menjamin akurasi real-time.

---

## KEMUNGKINAN DITANYA PENGUJI
> *"Jika berkas dikembalikan terlambat (misalnya setelah 72 jam), apakah status akhirnya adalah 'DIKEMBALIKAN' atau 'TERLAMBAT'?"*

---

## JAWABAN REKOMENDASI
> *"Status akhirnya adalah **'TERLAMBAT'**. Sesuai aturan rekam medis, berkas yang dikembalikan melebihi deadline 48 jam tetap dicatat terlambat sebagai bahan evaluasi kedisiplinan ruangan peminjam, meskipun secara fisik berkas sudah berada di depo filing."*

---

## KODE TERKAIT

```typescript
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
```
