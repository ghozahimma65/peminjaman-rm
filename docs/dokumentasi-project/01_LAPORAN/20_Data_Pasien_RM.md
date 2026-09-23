# 20 — Data Pasien dan Master Data Rekam Medis

---

## Gambaran Modul Master Data RM

Modul **Master Data RM** (`MasterDataRm.tsx`) berfungsi sebagai repositori sentral data identitas pasien dan nomor rekam medis fisik yang dikelola oleh Unit Rekam Medis RSI Sultan Agung Semarang. Berkas fisik rekam medis memiliki nomor unik yang diregistrasikan di sini sebelum dapat dilakukan sirkulasi peminjaman.

---

## Struktur Data Pasien (`data_rm`)

Tabel `data_rm` didefinisikan dalam `schema.ts` sebagai berikut:

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `nomorRm` | `TEXT PRIMARY KEY` | Nomor unik berkas rekam medis (contoh: `RM-DEV-0001`, `01-23-45`) |
| `namaPasien` | `TEXT NOT NULL` | Nama lengkap pasien pemilik berkas |
| `nik` | `TEXT` | Nomor Induk Kependudukan (tepat 16 digit angka) |
| `jenisKelamin` | `TEXT` | Jenis kelamin pasien (`Laki-laki` / `Perempuan`) |
| `tanggalLahir` | `TEXT` | Tanggal lahir pasien (`YYYY-MM-DD`) |
| `alamat` | `TEXT` | Alamat tempat tinggal pasien |
| `createdAt` | `DATETIME DEFAULT CURRENT_TIMESTAMP` | Waktu registrasi berkas ke sistem |

---

## Aturan Bisnis & Validasi

### 1. Validasi Format NIK (Nomor Induk Kependudukan)
Fungsi `validateNik()` pada `dataRmService.ts` menerapkan validasi ketat:
```typescript
export function validateNik(nik: string): void {
  const trimmed = nik.trim();
  if (!/^\d{16}$/.test(trimmed)) {
    throw new Error("NIK wajib terdiri dari tepat 16 digit angka (tanpa huruf, spasi, atau simbol).");
  }
}
```
- NIK harus berupa string tepat 16 digit numerik.
- Karakter alfabetik, simbol, atau spasi akan ditolak dan memicu pesan kesalahan validasi sebelum query insert dijalankan.

### 2. Integritas Primary Key (Nomor RM)
- Kolom `nomorRm` bertindak sebagai Primary Key.
- Nomor RM tidak boleh duplikat. Usaha pendaftaran nomor RM yang sudah ada akan memicu pelanggaran `UNIQUE / PRIMARY KEY constraint` pada SQLite.

---

## Service: `dataRmService.ts`

Service ini mengoperasikan operasi CRUD dan kalkulasi statistik master berkas rekam medis.

### 1. `createDataRm(...)`
Mendaftarkan berkas rekam medis baru setelah melalui validasi NIK:
```sql
INSERT INTO data_rm (nomorRm, namaPasien, nik, jenisKelamin, tanggalLahir, alamat, createdAt) 
VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);
```

### 2. `getRmByNomor(nomorRm: string): Promise<DataRmRow | null>`
Mengambil informasi lengkap pasien berdasarkan primary key `nomorRm`. Digunakan saat validasi auto-complete pada formulir peminjaman rekam medis.

### 3. `getAllDataRm(): Promise<MasterDataRmRow[]>`
Mengambil seluruh daftar master data RM yang diperkaya dengan data agregasi operasional:
- `totalTransaksi`: Total berapa kali berkas tersebut pernah dipinjam.
- `isDipinjam`: Boolean/integer indikator apakah saat ini berkas fisik sedang keluar/dipinjam.

```sql
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
ORDER BY d.nomorRm ASC;
```

### 4. `searchDataRm(keyword: string): Promise<MasterDataRmRow[]>`
Mencari berkas RM berdasarkan nomor RM atau nama pasien dengan operator `LIKE %keyword%`.

### 5. `getDataRmStats(): Promise<DataRmStats>`
Menghitung indikator metrik kartu ringkasan dashboard:
- `totalPasien`: Total baris pada tabel `data_rm`.
- `sedangDipinjam`: Jumlah berkas RM yang statusnya sedang dipinjam aktif (belum ada di tabel `pengembalian`).
- `rmBaruBulanIni`: Jumlah berkas RM baru yang didaftarkan pada bulan kalender berjalan (`strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now')`).

---

## Seed Data Pengembangan (Development Data)

Untuk memfasilitasi pengujian dan demonstrasi operasional di lingkungan development/testing, sistem secara otomatis mengeksekusi seed data saat inisialisasi database (`schema.ts`):
- Tersedia **20 rekam medis awal**: `RM-DEV-0001` hingga `RM-DEV-0020`.
- Injeksi menggunakan `INSERT OR IGNORE` sehingga tidak menimpa data yang telah dimodifikasi sebelumnya.
- Data seed mencakup variasi jenis kelamin, tanggal lahir, dan alamat di wilayah Semarang dan sekitarnya.
