# 17 — Peminjaman

---

## Gambaran Modul Peminjaman

Modul peminjaman mencakup dua halaman:
1. **Peminjaman Baru** (`AjukanPeminjaman.tsx`) — form input peminjaman baru
2. **Daftar Peminjaman** (`DaftarPeminjaman.tsx`) — tampilan semua transaksi

---

## Alur Peminjaman Baru

### Langkah-langkah

1. Petugas membuka menu **Peminjaman → Peminjaman Baru**
2. Mencari nomor RM atau nama pasien
3. Sistem menampilkan data pasien dari `data_rm`
4. Sistem mengecek apakah berkas sedang aktif dipinjam
5. Jika aktif → tampilkan error, tidak bisa lanjut
6. Jika tidak aktif → petugas mengisi form
7. Submit → data tersimpan di database

### Form Peminjaman

| Field | Keterangan | Wajib |
|-------|-----------|-------|
| Nomor RM | Dipilih dari Master Data RM | ✅ |
| Nama Pasien | Otomatis dari data RM | ✅ (otomatis) |
| Nama Peminjam | Free text (dokter/perawat yang pinjam) | ✅ |
| Unit/Ruang Tujuan | Dropdown 22 pilihan dari `RUANGAN_OPTIONS` | ✅ |
| Jilid | Nomor jilid berkas | ❌ |
| Catatan | Catatan tambahan | ❌ |
| Tanggal Pinjam | Otomatis (`CURRENT_TIMESTAMP`) | ✅ (otomatis) |

---

## Service: peminjamanService.ts

### `checkActivePeminjaman(nomorRm)`

```typescript
// Mengecek apakah berkas sedang aktif dipinjam
// Query: SELECT FROM peminjaman WHERE nomorRm = $1
//        AND status IN ('DIPINJAM', 'TERLAMBAT')
//        AND NOT EXISTS (SELECT 1 FROM pengembalian WHERE peminjamanId = id)
```

**Catatan**: Pengecekan menggunakan dua kondisi:
- Status `DIPINJAM` atau `TERLAMBAT`
- Tidak ada record di tabel `pengembalian` untuk ID tersebut

Ini mencegah race condition dimana status belum diupdate tapi sudah ada pengembalian.

---

### `createPeminjaman(data)`

```typescript
// Validasi ganda (defense in depth):
const active = await checkActivePeminjaman(data.nomorRm);
if (active) {
  throw new Error(`Rekam medis ${data.nomorRm} masih berstatus aktif dipinjam.`);
}

// Insert ke database
INSERT INTO peminjaman (
  tanggalPinjam, tanggalBerkasKeluar, peminjamId, namaPeminjam,
  unit, nomorRm, namaPasien, jilid, catatan, status
) VALUES (...)
```

Status awal peminjaman: `DIPINJAM`.

---

### `getAllPeminjaman()`

```typescript
// JOIN dengan tabel pengembalian dan users
SELECT p.*, pg.tanggalBerkasKembali, u.name as operatorName
FROM peminjaman p
LEFT JOIN pengembalian pg ON pg.peminjamanId = p.id
LEFT JOIN users u ON p.peminjamId = u.id
ORDER BY p.tanggalPinjam DESC
```

Hasil kemudian di-map:
```typescript
rows.map(r => ({
  ...r,
  peminjamName: r.namaPeminjam || r.operatorName || 'Petugas',
  status: calculateEffectiveStatus(r.tanggalBerkasKeluar, r.tanggalPinjam, r.tanggalBerkasKembali)
}))
```

Status dihitung ulang dari `statusHelper.ts`, bukan mengambil langsung dari kolom `status` database.

---

## Penanganan `namaPeminjam` vs `peminjamId`

Sistem memiliki dua field untuk mencatat peminjam:
- `peminjamId`: ID user operator yang menginput di sistem
- `namaPeminjam`: Nama pihak yang benar-benar meminjam (dokter/perawat/dll.)

Kedua field ini bisa berbeda. Misalnya:
- Petugas A (peminjamId=5) menginput peminjaman untuk dokter B (namaPeminjam="dr. B").

Saat tampil di UI, prioritas:
```typescript
peminjamName: r.namaPeminjam || r.operatorName || 'Petugas'
```

---

## Penghitungan Deadline

Deadline dihitung dari:
```
tanggalBerkasKeluar + 48 jam
```
atau jika `tanggalBerkasKeluar` tidak diset:
```
tanggalPinjam + 48 jam
```

Logika ini ada di `calculateDeadline()` di `statusHelper.ts`.

---

## Ruangan yang Tersedia (22 Pilihan)

```
ADN, B Fetal, Bizzah 1, Bizzah 2, B Ma'ruf, B Nisa 1, B Nisa 2,
B Salam 1, B Salam 2, B Syifa, Darulmuqomah, Darussalam, Firdaus,
Mawar, Naim, ICU, ICU Solusi, NICU, PICU, ICCU, PERIST/Perinatologi,
VK/Kamar Bersalin, Rekam Medis
```

Sumber: `src/constants.ts`, `RUANGAN_OPTIONS`
