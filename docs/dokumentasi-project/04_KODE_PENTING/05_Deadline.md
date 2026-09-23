# 05 — Kalkulasi Batas Waktu Pengembalian / Deadline (`statusHelper.ts`)

---

- **FILE**: `src/lib/statusHelper.ts`
- **FUNCTION/COMPONENT**: `calculateDeadline(tanggalBerkasKeluar, tanggalPinjam)`, `RETURN_PERIOD_MS`

---

## TUJUAN
Menghitung batas waktu pengembalian (*deadline*) berkas rekam medis secara presisi berdasarkan standar operasional rumah sakit yaitu **2 × 24 jam (48 jam)** sejak berkas fisik meninggalkan unit filing rekam medis.

---

## ALUR
1. Mengambil parameter `tanggalBerkasKeluar`. Jika bernilai `null`/`undefined`, gunakan fallback `tanggalPinjam`.
2. Jika kedua nilai tidak ada atau tidak valid (*NaN*), kembalikan `null`.
3. Mengonversi string tanggal ke milidetik via `new Date(dateStr).getTime()`.
4. Menambahkan konstanta `RETURN_PERIOD_MS` ($48 \times 60 \times 60 \times 1000 = 172.800.000\text{ ms}$).
5. Mengembalikan objek `Date` baru yang merepresentasikan titik batas waktu akhir pengembalian.

---

## INPUT / PROSES / OUTPUT
- **INPUT**:
  - `tanggalBerkasKeluar?: string | null` (Waktu berkas fisik diserahkan)
  - `tanggalPinjam?: string | null` (Waktu pengajuan peminjaman)
- **PROSES**:
  - Penentuan tanggal referensi awal (prioritas: `tanggalBerkasKeluar`, fallback: `tanggalPinjam`)
  - Penambahan durasi offset $48\text{ jam}$
- **OUTPUT**:
  - `Date | null`: Objek waktu batas pengembalian.

---

## KENAPA PENTING
Sesuai standar operasional pelayanan rekam medis rumah sakit, batas waktu peredaran berkas rekam medis di ruangan rawat/poliklinik adalah maksimal 2 x 24 jam. Logika ini menjadi patokan tunggal bagi modul peminjaman, monitoring notifikasi peringatan dini, maupun evaluasi kepatuhan pada laporan.

---

## KEMUNGKINAN DITANYA PENGUJI
> *"Kenapa perhitungan deadline memprioritaskan `tanggalBerkasKeluar` dibandingkan `tanggalPinjam`?"*

---

## JAWABAN REKOMENDASI
> *"Karena sering kali terjadi jeda waktu antara permohonan peminjaman diajukan dalam sistem (`tanggalPinjam`) dengan waktu berkas fisik rekam medis benar-benar diambil/dibawa oleh kurir menuju ruangan (`tanggalBerkasKeluar`). Menghitung deadline sejak berkas keluar mencerminkan waktu peminjaman fisik yang adil dan akurat bagi ruangan peminjam."*

---

## KODE TERKAIT

```typescript
export const RETURN_PERIOD_MS = 2 * 24 * 60 * 60 * 1000; // 48 Jam (2 x 24 Jam)

export function calculateDeadline(tanggalBerkasKeluar?: string | null, tanggalPinjam?: string | null): Date | null {
  const dateStr = tanggalBerkasKeluar || tanggalPinjam;
  if (!dateStr) return null;
  const startTime = new Date(dateStr);
  if (Number.isNaN(startTime.getTime())) return null;
  return new Date(startTime.getTime() + RETURN_PERIOD_MS);
}
```
