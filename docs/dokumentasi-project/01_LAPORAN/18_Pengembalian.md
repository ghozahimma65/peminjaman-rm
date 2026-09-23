# 18 — Pengembalian

---

## Gambaran Modul Pengembalian

Modul pengembalian mencakup dua halaman:
1. **Proses Pengembalian** (`ProsesPengembalian.tsx`) — konfirmasi pengembalian berkas
2. **Daftar Pengembalian** (`DaftarPengembalian.tsx`) — riwayat pengembalian

---

## Alur Proses Pengembalian

### Langkah-langkah

1. Petugas membuka **Pengembalian → Proses Pengembalian**
2. Input nomor RM berkas yang akan dikembalikan
3. `findActivePeminjamanByRm(nomorRm)` mencari peminjaman aktif
4. Jika tidak ditemukan → tampilkan pesan "berkas tidak dipinjam"
5. Jika ditemukan → tampilkan info berkas (nama pasien, peminjam, batas waktu, status)
6. Petugas memilih kondisi berkas: **BAIK** atau **RUSAK**
7. Petugas klik "Konfirmasi Pengembalian" → modal konfirmasi
8. `processPengembalian()` dieksekusi
9. Jika berhasil → navigasi ke Daftar Pengembalian

---

## Service: pengembalianService.ts

### `findActivePeminjamanByRm(nomorRm)`

```sql
SELECT p.*, u.name as peminjamName
FROM peminjaman p
LEFT JOIN users u ON p.peminjamId = u.id
LEFT JOIN pengembalian pg ON pg.peminjamanId = p.id
WHERE p.nomorRm = $1
  AND p.status IN ('DIPINJAM', 'TERLAMBAT')
  AND pg.id IS NULL                   -- tidak ada record pengembalian
ORDER BY p.tanggalPinjam DESC LIMIT 1
```

---

### `processPengembalian(peminjamanId, userId, kondisiBerkas)`

Ini adalah fungsi kritis dengan proteksi berlapis:

```typescript
// 1. Ambil timestamp aktual
const returnDate = tanggalBerkasKembali || new Date().toISOString();

// 2. Validasi temporal: tidak boleh sebelum tanggal pinjam
if (returnDateObj < referenceDate) {
  throw new Error("Tanggal pengembalian tidak valid...");
}

// 3. Cek masih aktif
const activeRows = await db.select(...WHERE id = $1 AND status IN ('DIPINJAM', 'TERLAMBAT'));
if (activeRows.length === 0) {
  throw new Error("Peminjaman ini sudah dikembalikan atau tidak lagi aktif.");
}

// 4. Update status
UPDATE peminjaman SET status = 'DIKEMBALIKAN' WHERE id = $1;

// 5. Verifikasi update berhasil
if (updatedRows[0]?.status !== "DIKEMBALIKAN") {
  throw new Error("Status peminjaman tidak berhasil diperbarui.");
}

// 6. Insert record pengembalian
INSERT INTO pengembalian (peminjamanId, tanggalBerkasKembali, dikembalikanOlehId,
                          konfirmasiKembali, kondisiBerkas)
VALUES ($1, $2, $3, 1, $4);
```

**Rollback jika gagal**:
```typescript
catch (error) {
  if (insertedReturnId) {
    await db.execute("DELETE FROM pengembalian WHERE id = $1", [insertedReturnId]);
  }
  await db.execute("UPDATE peminjaman SET status = 'DIPINJAM'... WHERE id = $1", [peminjamanId]);
  throw error;
}
```

---

## Pencegahan Duplikat Pengembalian

Tabel `pengembalian` memiliki constraint:
```sql
peminjamanId INTEGER UNIQUE NOT NULL
```

Jika berkas yang sama dikembalikan dua kali, SQLite akan melempar error UNIQUE constraint.
Sistem menangkapnya:
```typescript
if (errMessage.includes("UNIQUE constraint failed")) {
  throw new Error("Berkas ini sudah dikembalikan (duplikasi transaksi).");
}
```

---

## Timestamp Pengembalian

```typescript
// Timestamp diambil saat proses dikonfirmasi, bukan diinput manual
const returnDate = new Date().toISOString();
// Contoh: "2026-09-23T08:30:15.123Z" (ISO 8601 UTC)
```

Timestamp ini yang kemudian menjadi dasar penentuan apakah pengembalian tepat waktu atau
terlambat.

---

## Penentuan Status Akhir

Setelah pengembalian, status ditentukan oleh `calculateEffectiveStatus()`:

```
deadline = tanggalBerkasKeluar + 48 jam

if (tanggalBerkasKembali > deadline): → TERLAMBAT
else: → DIKEMBALIKAN (tepat waktu)
```

---

## Kondisi Berkas

| Nilai | Keterangan |
|-------|-----------|
| `'BAIK'` | Default — berkas dalam kondisi baik |
| `'RUSAK'` | Berkas rusak/tidak lengkap |

Default: `'BAIK'` (dari schema: `kondisiBerkas TEXT NOT NULL DEFAULT 'BAIK'`).

---

## Daftar Pengembalian

`getPengembalianHistory(filters?)` mengambil data pengembalian dengan filter opsional:
- `tanggalMulai` / `tanggalAkhir`: filter berdasarkan `date(pg.tanggalBerkasKembali)`
- `unit`: filter berdasarkan unit asal peminjaman

Query menggunakan `INNER JOIN` dengan `peminjaman` (hanya yang sudah dikembalikan).

**Catatan penting**: Filter tanggal menggunakan fungsi `date()` SQLite yang mengekstrak
tanggal dalam UTC. Di timezone WIB (+7), tanggal UTC bisa berbeda dari tanggal lokal.
Untuk menghindari masalah ini, default filter menggunakan `'all'` (tanpa filter tanggal).

---

## Fitur Tambahan di Daftar Pengembalian

- Update kondisi berkas: `updatePengembalianKondisi()`
- Hapus pengembalian: `deletePengembalian()` — menggunakan transaction eksplisit dan
  merestore status peminjaman ke `'DIPINJAM'`
