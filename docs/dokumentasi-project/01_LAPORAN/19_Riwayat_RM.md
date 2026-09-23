# 19 — Riwayat Rekam Medis (Riwayat RM)

---

## Gambaran Modul Riwayat RM

Modul **Riwayat Rekam Medis** (`RiwayatRm.tsx`) bertindak sebagai pusat penelusuran (audit trail) seluruh siklus hidup sirkulasi berkas fisik rekam medis pasien di RSI Sultan Agung Semarang. Modul ini menyediakan dua sudut pandang navigasi:
1. **Pencarian Global / Seluruh Riwayat**: Menampilkan seluruh riwayat transaksi peminjaman dan pengembalian dari semua berkas RM dengan fitur filter pencarian real-time dan pagination.
2. **Pencarian Spesifik per Nomor RM**: Menelusuri seluruh riwayat transaksi untuk satu nomor RM tertentu secara kronologis dari waktu ke waktu, lengkap dengan data identitas pasien.

---

## Alur Kerja Modul

```
[Pengguna Membuka Halaman Riwayat RM]
        │
        ├── Mode 1: Tampilan Default (Seluruh Riwayat)
        │     │
        │     ├── Memanggil getAllRiwayat(searchQuery)
        │     ├── Menghitung status efektif dinamis via calculateEffectiveStatus()
        │     ├── Pagination (10 data per halaman)
        │     └── Filter pencarian (Nomor RM, Nama Pasien, Nama Peminjam, Nama Operator)
        │
        └── Mode 2: Penelusuran Spesifik Berkas
              │
              ├── Input Nomor RM (misal: "RM-DEV-0001")
              ├── Memanggil getRiwayatByRm(nomorRm)
              │     ├── Verifikasi data pasien di tabel data_rm
              │     └── Ambil kronologi transaksi peminjaman + pengembalian
              ├── Tampilkan Data Pasien & Kartu Riwayat Berkas
              └── Aksi: Lihat Detail Transaksi, Edit Catatan/Unit, Hapus Transaksi
```

---

## Service: `riwayatRmService.ts`

Service ini mengelola query analitik dan manipulasi riwayat transaksi.

### 1. `getAllRiwayat(search?: string): Promise<AllRiwayatRow[]>`

Mengambil seluruh transaksi sirkulasi berkas yang terdaftar di sistem. Menggabungkan data tabel `peminjaman` dengan `pengembalian` dan tabel `users` (sebagai operator peminjam dan petugas penerima kembali).

**Struktur Query SQL:**
```sql
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
WHERE
  p.nomorRm LIKE $1
  OR p.namaPasien LIKE $2
  OR p.namaPeminjam LIKE $3
  OR u1.name LIKE $4
ORDER BY p.tanggalPinjam DESC;
```

**Kalkulasi Status Dinamis:**
Hasil query di-mapping untuk menghitung status dinamis:
```typescript
return rawRows.map(r => ({
  ...r,
  peminjamName: r.namaPeminjam || r.operatorPeminjamName || 'Petugas',
  statusPeminjaman: calculateEffectiveStatus(r.tanggalBerkasKeluar, r.tanggalPinjam, r.tanggalBerkasKembali)
}));
```

---

### 2. `getRiwayatByRm(nomorRm: string): Promise<RiwayatRmResult>`

Digunakan untuk memeriksa riwayat satu berkas secara mendalam.

1. **Pengecekan Identitas Pasien:**
   ```sql
   SELECT nomorRm, namaPasien, nik, jenisKelamin, tanggalLahir, alamat 
   FROM data_rm 
   WHERE nomorRm = $1;
   ```
   Jika tidak ada di master `data_rm`, sistem melempar error: `"Data RM dengan nomor {nomorRm} tidak ditemukan."`

2. **Pengambilan Transaksi Berkas:**
   ```sql
   SELECT 
     p.id as peminjamanId,
     p.tanggalPinjam,
     p.tanggalBerkasKeluar,
     p.namaPeminjam,
     p.unit,
     p.jilid,
     p.catatan,
     pg.kondisiBerkas,
     p.status as baseStatus,
     p.peminjamId,
     u1.name as operatorPeminjamName,
     pg.id as pengembalianId,
     pg.tanggalBerkasKembali,
     pg.dikembalikanOlehId,
     u2.name as dikembalikanOlehName
   FROM peminjaman p
   LEFT JOIN pengembalian pg ON p.id = pg.peminjamanId
   LEFT JOIN users u1 ON p.peminjamId = u1.id
   LEFT JOIN users u2 ON pg.dikembalikanOlehId = u2.id
   WHERE p.nomorRm = $1
   ORDER BY p.tanggalPinjam DESC;
   ```

---

### 3. `updatePeminjamanHistory(peminjamanId, unit, catatan): Promise<void>`

Memungkinkan petugas mengoreksi catatan atau unit ruangan peminjaman jika terjadi kesalahan input di awal tanpa merusak integritas status transaksi:
```sql
UPDATE peminjaman 
SET unit = $1, catatan = $2, updatedAt = CURRENT_TIMESTAMP 
WHERE id = $3;
```

---

### 4. `deletePeminjamanHistory(peminjamanId: number): Promise<void>`

Menghapus catatan peminjaman beserta seluruh relasi terkait (pengembalian dan notifikasi) secara terstruktur:
```sql
DELETE FROM pengembalian WHERE peminjamanId = $1;
DELETE FROM notifications WHERE peminjamanId = $1;
DELETE FROM peminjaman WHERE id = $1;
```

---

## Fitur Antarmuka Pengguna (UI) di Riwayat RM

1. **Pencarian Real-Time (Debounced/Dynamic)**:
   - Pengguna dapat mengetikkan kata kunci pencarian pada kolom search bar.
   - Kolom pencarian mencakup Nomor RM, Nama Pasien, Nama Peminjam, atau Nama Petugas.
2. **Badge Status Interaktif**:
   - Status peminjaman divisualisasikan dengan warna tegas:
     - `DIPINJAM` (Kuning/Amber): Berkas sedang aktif dipinjam dan belum melampaui deadline 48 jam.
     - `TERLAMBAT` (Merah): Berkas belum kembali setelah >48 jam, atau dikembalikan melebihi deadline 48 jam.
     - `DIKEMBALIKAN` (Hijau): Berkas telah kembali tepat waktu (<= 48 jam dari tanggal berkas keluar).
3. **Modal Detail Transaksi**:
   - Menampilkan tanggal berkas keluar, tanggal kembali aktual, durasi pinjam, kondisi berkas (BAIK/RUSAK), nama peminjam (dokter/perawat), operator peminjaman, serta petugas penerima pengembalian.
4. **Pagination**:
   - Data dibatasi 10 baris per halaman untuk menjaga performa rendering antarmuka pengguna pada perangkat dengan spesifikasi terbatas.
