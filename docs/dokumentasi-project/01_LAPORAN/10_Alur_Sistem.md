# 10 — Alur Sistem

---

## Alur 1: Startup Aplikasi

```
Buka App
  ↓
Inisialisasi Database (initializeDatabase)
  ├─ Buat tabel jika belum ada (INITIALIZATION_SQL)
  ├─ Migrasi kolom baru (ensureColumnExists)
  ├─ Seed data RM dummy (20 data, INSERT OR IGNORE)
  ├─ Repair status (UPDATE DIKEMBALIKAN jika sudah ada di pengembalian)
  └─ Inject Super Admin jika belum ada (hash bcrypt)
  ↓
Tampilkan Portal (halaman sambutan)
  ↓
User klik "MASUK KE SISTEM"
  ↓
Tampilkan Login
```

---

## Alur 2: Login

```
User input NIP + Password
  ↓
loginWithNip(nip, password)
  ├─ SELECT user WHERE nip = $1
  ├─ Jika tidak ada → Log FAILED → throw Error (pesan generik)
  ├─ bcrypt.compare(password, hash)
  ├─ Jika tidak cocok → Log FAILED → throw Error
  └─ Log SUCCESS → return SessionUser
  ↓
setUser(sessionUser) → simpan ke Tauri Store (session.bin)
  ↓
Navigasi ke Dashboard
```

---

## Alur 3: Register Petugas Baru

```
User isi form (NIP, Nama, Email, Password, Foto Profil)
  ↓
Validasi client-side
  ├─ NIP tidak boleh kosong
  ├─ Nama tidak boleh kosong
  ├─ Format email valid
  ├─ Password tidak kosong
  └─ Konfirmasi password cocok
  ↓
registerUser(params)
  ├─ Cek duplikat NIP
  ├─ Cek duplikat Email
  ├─ bcrypt.hash(password, 10)
  └─ INSERT user baru dengan role 'PETUGAS'
  ↓
Kembali ke Login
```

---

## Alur 4: Peminjaman Baru

```
Petugas buka "Peminjaman Baru"
  ↓
Pilih/cari Nomor RM (dari Master Data RM)
  ↓
getRmByNomor(nomorRm) → validasi RM ada di database
  ↓
Sistem cek: checkActivePeminjaman(nomorRm)
  ├─ Jika aktif → tampilkan error "Masih dipinjam"
  └─ Jika tidak aktif → lanjut
  ↓
Petugas isi form:
  - Nomor RM (dari pilihan)
  - Nama Pasien (otomatis dari data RM)
  - Nama Peminjam (free text)
  - Unit/Ruang tujuan (dropdown)
  - Jilid (opsional)
  - Catatan (opsional)
  ↓
createPeminjaman(data)
  ├─ Double-check checkActivePeminjaman (defense in depth)
  └─ INSERT INTO peminjaman (status='DIPINJAM', tanggalPinjam=now)
  ↓
Berkas tercatat sebagai DIPINJAM
Sistem mulai menghitung countdown 48 jam
```

---

## Alur 5: Pengembalian Berkas

```
Petugas buka "Proses Pengembalian"
  ↓
Input Nomor RM → findActivePeminjamanByRm(nomorRm)
  ├─ Cari peminjaman DIPINJAM/TERLAMBAT yang belum ada di tabel pengembalian
  └─ Tampilkan data berkas (nama pasien, peminjam, batas kembali, status)
  ↓
Petugas pilih kondisi berkas (Lengkap / Tidak Lengkap)
  ↓
Petugas klik "Kembalikan" → konfirmasi modal
  ↓
processPengembalian(peminjamanId, userId, kondisi)
  ├─ Ambil tanggal pengembalian aktual: new Date().toISOString()
  ├─ Validasi: tanggalKembali tidak boleh < tanggalBerkasKeluar
  ├─ UPDATE peminjaman SET status='DIKEMBALIKAN'
  ├─ Verifikasi UPDATE berhasil
  └─ INSERT INTO pengembalian (tanggalBerkasKembali, konfirmasiKembali=1)
  ↓
Jika gagal → rollback (DELETE pengembalian, UPDATE status='DIPINJAM')
  ↓
Navigasi ke Daftar Pengembalian
```

---

## Alur 6: Notifikasi

```
syncNotifications() dipanggil (saat load app atau halaman tertentu)
  ↓
DELETE notifikasi untuk berkas yang sudah DIKEMBALIKAN
  ↓
Ambil semua peminjaman DIPINJAM/TERLAMBAT
  ↓
Untuk setiap peminjaman:
  ├─ Hitung deadline = tanggalBerkasKeluar + 48 jam
  ├─ now > deadline?
  │   ├─ Ya → INSERT TERLAMBAT (jika belum ada)
  │   │      → UPDATE status ke TERLAMBAT (jika masih DIPINJAM)
  │   └─ Tidak → (deadline - now) ≤ 24 jam?
  │               └─ Ya → INSERT REMINDER (jika belum ada)
```

---

## Alur 7: Export Laporan

```
Petugas buka "Rekap Peminjaman"
  ↓
Set filter (tanggal, unit, status)
  ↓
getLaporanData(filters) → query JOIN peminjaman+pengembalian+users
  ↓
computeSummaryTables(data) → hitung per ruang, status, total
  ↓
Pilih Export Excel atau Export PDF
  ↓
Buka dialog save file
  ↓
exportToExcel() / exportToPdf()
  ├─ Build workbook/dokumen dengan ExcelJS / jsPDF
  ├─ Tambah header institusi RSI Sultan Agung
  ├─ Tambah tabel rekapitulasi per ruang
  ├─ Tambah tabel status berkas
  └─ Tambah bagian tanda tangan
  ↓
writeFile(filePath, buffer) → simpan ke lokasi yang dipilih
```

---

## Alur 8: Logout

```
User klik tombol Logout
  ↓
Konfirmasi modal
  ↓
logout()
  ├─ setUser(null)
  └─ store.delete("user_session") + store.save()
  ↓
Kembali ke Portal
```
