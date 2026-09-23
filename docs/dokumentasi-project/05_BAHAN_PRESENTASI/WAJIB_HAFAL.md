# Fakta Wajib Hafal (Angka Kunci & Parameter Sistem)

---

## 1. Parameter Waktu & Sirkulasi

| Parameter | Nilai / Durasi | Keterangan |
|---|---|---|
| **Batas Waktu Pengembalian (Deadline)** | **48 Jam (2 × 24 Jam)** | Dihitung dari `tanggalBerkasKeluar` (fallback: `tanggalPinjam`) |
| **Ambang Notifikasi REMINDER** | $\le$ **24 Jam** | Muncul saat sisa waktu pengembalian kurang dari 24 jam |
| **Ambang Notifikasi TERLAMBAT** | $>$ **48 Jam** | Muncul otomatis saat waktu saat ini melewati deadline |
| **Unit Pengembalian Default** | `'all'` (Semua) | Menghindari desinkronisasi tanggal UTC SQLite vs WIB (+7) |
| **Paging Riwayat RM** | **10 Baris per Halaman** | Batas pagination antarmuka tabel |

---

## 2. Parameter Basis Data & Kriptografi

| Parameter | Nilai / Spesifikasi | Keterangan |
|---|---|---|
| **Total Tabel Database** | **6 Tabel** | `users`, `login_logs`, `data_rm`, `peminjaman`, `pengembalian`, `notifications` |
| **Mesin Basis Data** | **SQLite (file `rekam_medis.db`)** | Disimpan lokal di `AppLocalData` perangkat |
| **Algoritma Hashing Kata Sandi** | **bcryptjs** | Cost factor / work factor = **10** |
| **Kredensial Super Admin Default** | NIP: `superadmin` / Password: `superadmin123` | Di-hash otomatis saat boot pertama kali |
| **Kunci Asing (Foreign Keys)** | `PRAGMA foreign_keys = ON;` | Ditegakkan eksplisit pada setiap koneksi |
| **Constraint Kritis Pengembalian** | `peminjamanId INTEGER UNIQUE` | Mencegah anomali duplikasi pengembalian berkas |
| **Format Validasi NIK** | `/^\d{16}$/` | Tepat 16 digit angka tanpa simbol atau huruf |
| **Seed Data Awal** | **20 Berkas RM** | `RM-DEV-0001` hingga `RM-DEV-0020` |

---

## 3. Parameter Akses & Organisasi

| Parameter | Nilai / Spesifikasi | Keterangan |
|---|---|---|
| **Institusi Pengguna** | **RSI Sultan Agung Semarang** | Jl. Kaligawe Raya No. 4 Semarang |
| **Jumlah Peran Akun (Roles)** | **2 Peran** | `Super Admin` dan `PETUGAS` |
| **Menu Khusus Super Admin** | **Log Login** & **Pengaturan** | Tidak dapat diakses oleh user ber-role `PETUGAS` |
| **Kebijakan Sesi Aplikasi** | **Direset saat aplikasi dibuka** | Sesi sebelumnya di `session.bin` otomatis dihapus |
| **Jumlah Pilihan Ruangan** | **22 Ruangan** | ADN, B Fetal, Bizzah 1, Bizzah 2, B Ma'ruf, B Nisa 1, B Nisa 2, B Salam 1, B Salam 2, B Syifa, Darulmuqomah, Darussalam, Firdaus, Mawar, Naim, ICU, ICU Solusi, NICU, PICU, ICCU, PERIST/Perinatologi, VK/Kamar Bersalin, Rekam Medis |

---

## 4. Parameter Laporan & Ekspor

| Parameter | Nilai / Spesifikasi | Keterangan |
|---|---|---|
| **Format Ekspor Didukung** | **2 Format** | Microsoft Excel (`.xlsx`) & Adobe PDF (`.pdf`) |
| **Library Ekspor Excel** | **ExcelJS (^4.4.0)** | Font: **Times New Roman**, landscape A4, 13 kolom rekapitulasi |
| **Library Ekspor PDF** | **jsPDF (^4.2.1)** & **jspdf-autotable** | Kop resmi RSI Sultan Agung Semarang + Logo base64 |
| **Nomor Berita Acara PDF** | `042/BA-REKAMMED/RSISA/{year}` | Terbit otomatis mengikuti tahun kalender berjalan |
| **Ukuran Maksimum Foto Profil** | **5 MB** | Disimpan di folder lokal `AppData/avatars/` |
