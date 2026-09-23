# 09 — Analisis Sistem

---

## Analisis Sistem Berjalan [PERLU KONFIRMASI]

Sistem yang berjalan sebelumnya di unit rekam medis RSI Sultan Agung diasumsikan masih
menggunakan metode manual (buku catatan/formulir kertas) berdasarkan kebutuhan fitur yang
diimplementasikan. **[PERLU KONFIRMASI]** apakah ada sistem lain sebelumnya.

---

## Analisis Sistem yang Diusulkan

### Aliran Data Utama

```
Petugas → Input Peminjaman → Database → Status Monitoring → Notifikasi
                                    ↓
               Input Pengembalian → Konfirmasi → Update Status
                                    ↓
                               Laporan → Export Excel/PDF
```

### Komponen Analisis

#### 1. Analisis Aktor
Dua aktor teridentifikasi dari source code:
- **Super Admin**: akses penuh + fitur administrasi
- **Petugas**: operasional harian (peminjaman & pengembalian)

#### 2. Analisis Proses Bisnis Utama

**Proses Peminjaman:**
1. Petugas mencari nomor RM pasien
2. Sistem memvalidasi apakah RM masih aktif dipinjam
3. Petugas mengisi form: unit tujuan, jilid, catatan, nama peminjam
4. Sistem mencatat waktu pinjam otomatis (`CURRENT_TIMESTAMP`)
5. Status berkas berubah menjadi `DIPINJAM`
6. Sistem mulai menghitung countdown 48 jam

**Proses Pengembalian:**
1. Petugas mencari nomor RM berkas yang akan dikembalikan
2. Sistem memvalidasi bahwa berkas sedang aktif dipinjam
3. Petugas memilih kondisi berkas (Lengkap/Tidak Lengkap)
4. Sistem mencatat timestamp pengembalian aktual (`new Date().toISOString()`)
5. Status berkas berubah menjadi `DIKEMBALIKAN`
6. Sistem membersihkan notifikasi terkait berkas tersebut

**Proses Notifikasi:**
1. Dipanggil secara pasif saat app load atau user membuka area tertentu
2. Membersihkan notifikasi untuk berkas yang sudah dikembalikan
3. Membuat notifikasi TERLAMBAT jika now > deadline
4. Membuat notifikasi REMINDER jika (deadline - now) ≤ 24 jam
5. Otomatis mengubah status peminjaman dari `DIPINJAM` ke `TERLAMBAT`

#### 3. Analisis Penghitungan Status

```
Deadline = tanggalBerkasKeluar + 48 jam
        (atau tanggalPinjam + 48 jam jika keluar tidak ada)

if (sudah dikembalikan):
  if (tanggalBerkasKembali > deadline): TERLAMBAT
  else: DIKEMBALIKAN (tepat waktu)

if (belum dikembalikan):
  if (now > deadline): TERLAMBAT
  else: DIPINJAM
```

#### 4. Analisis Database

Database memiliki 5 tabel utama:
1. `users` — pengguna sistem
2. `login_logs` — log aktivitas masuk
3. `data_rm` — master data pasien
4. `peminjaman` — transaksi peminjaman
5. `pengembalian` — transaksi pengembalian
6. `notifications` — notifikasi sistem

---

## Keunggulan Analisis Sistem Ini

| Aspek | Keterangan |
|-------|-----------|
| **Integritas Data** | Constraint UNIQUE pada `peminjamanId` di tabel `pengembalian` mencegah pengembalian duplikat |
| **Atomisitas** | Pengembalian menggunakan pola rollback jika terjadi error |
| **Audit Trail** | Setiap transaksi menyimpan siapa yang melakukan (`peminjamId`, `dikembalikanOlehId`) |
| **Toleransi Migrasi** | `ensureColumnExists()` memastikan kolom baru ditambah tanpa menghancurkan data lama |
| **Keamanan** | bcrypt hash + error message generik + log aktivitas |
