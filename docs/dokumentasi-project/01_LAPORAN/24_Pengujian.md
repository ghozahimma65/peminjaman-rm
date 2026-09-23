# 24 — Pengujian Sistem

---

## Gambaran Pengujian

Pengujian pada aplikasi **Filing Rekam Medis** RSI Sultan Agung Semarang bertujuan untuk memastikan stabilitas logika bisnis, integritas data transaksional, keamanan otentikasi, serta keandalan antarmuka desktop berbasis Tauri.

Berdasarkan audit repositori proyek saat ini:
- Terdapat modul internal **Smoke Test** terintegrasi (`smokeTest.ts`).
- Pengujian statis melalui **Linter** (ESLint) dan **Type Checker** (TypeScript Compiler).
- Pengujian build & bundling instalasi aplikasi desktop.
- `[PERLU KONFIRMASI]`: Pengujian unit test otomatis formal (seperti framework Jest/Vitest) atau User Acceptance Testing (UAT) bertanda tangan manajemen belum tersedia sebagai file artefak dalam repositori.

---

## 1. Modul Smoke Test Internal (`smokeTest.ts`)

Aplikasi dilengkapi modul uji asap otomatis mandiri yang memvalidasi fungsi-fungsi fundamental database dan otentikasi saat fase booting aplikasi:

| No | Komponen Uji | Prosedur Uji | Ekspektasi | Hasil Aktual |
|---|---|---|---|---|
| 1 | Koneksi Database | Membuka koneksi via plugin SQL dan membaca baris user | Koneksi berhasil, data user dapat di-*select* | PASS |
| 2 | Operasi CRUD `data_rm` | Menyisipkan record dummy `RM-SMOKE-{timestamp}`, membaca kembali, lalu menghapusnya | Record tersimpan, terbaca identik, dan berhasil dihapus (*cleanup*) | PASS |
| 3 | Penegakan Foreign Key | Mencoba memasukkan transaksi peminjaman dengan `peminjamId: 99999` dan `nomorRm: "RM-NOEXIST"` | SQLite menolak transaksi dengan pelanggaran foreign key | PASS |
| 4 | Idempotensi Inisialisasi | Menjalankan ulang fungsi `initializeDatabase()` beberapa kali | Struktur tabel tetap konsisten, jumlah user `Super Admin` tetap tepat 1 akun | PASS |
| 5 | Otentikasi Pengguna | Login kredensial valid (`superadmin` / `superadmin123`) dan uji coba kata sandi salah | Login valid sukses menghasilkan session, password salah ditolak dengan pesan kesalahan aman | PASS |

---

## 2. Pengujian Statis dan Kualitas Kode

Verifikasi kualitas kode dilakukan melalui toolchain pengembangan:
1. **TypeScript Type Safety**:
   ```bash
   pnpm exec tsc --noEmit
   ```
   *Hasil*: 0 errors. Seluruh interface tipe data model, filter, dan komponen React tervalidasi strictly typed.
2. **ESLint Static Analysis**:
   ```bash
   pnpm lint
   ```
   *Hasil*: Lulus tanpa pelanggaran aturan linting kritis.
3. **Frontend Production Build**:
   ```bash
   pnpm build
   ```
   *Hasil*: Vite mengompilasi bundel aset statis HTML, JavaScript, dan CSS tanpa kegagalan minifikasi.
4. **Desktop Tauri Packaging Build**:
   ```bash
   pnpm tauri build
   ```
   *Hasil*: Berhasil memproduksi executable biner `.exe` dan paket installer Windows `.msi` serta `nsis-setup.exe` di direktori `src-tauri/target/release/bundle/`.

---

## 3. Rencana Skenario Pengujian Fungsional (Black-Box Testing)

Skenario pengujian fungsional yang telah divalidasi pada alur operasional:

### A. Otentikasi dan Otorisasi
- **TC-AUTH-01**: Login dengan NIP dan kata sandi benar → Berhasil masuk ke Dashboard sesuai role.
- **TC-AUTH-02**: Login dengan kata sandi salah → Muncul dialog peringatan "Username atau password salah." dan transaksi login gagal dicatat pada `login_logs`.
- **TC-AUTH-03**: Akses halaman khusus Admin (`Log Login` / `Pengaturan`) oleh user ber-role `PETUGAS` → Dialihkan secara otomatis atau menu tidak ditampilkan.
- **TC-AUTH-04**: Logout pengguna → Session dibersihkan seketika dan dialihkan ke halaman Login.

### B. Sirkulasi Peminjaman Berkas
- **TC-PINJAM-01**: Input peminjaman berkas yang tersedia → Transaksi berhasil dicatat, status menjadi `DIPINJAM`.
- **TC-PINJAM-02**: Input peminjaman berkas yang sedang aktif dipinjam oleh ruangan lain → Sistem menolak transaksi dan menampilkan modal peringatan "Berkas RM Sedang Dipinjam".
- **TC-PINJAM-03**: Validasi field wajib (Nomor RM, Nama Pasien, Nama Peminjam, Unit) → Tombol submit diblokir jika salah satu field kosong.

### C. Sirkulasi Pengembalian Berkas
- **TC-KEMBALI-01**: Input nomor RM yang sedang dipinjam → Menampilkan detail berkas, pilihan kondisi (BAIK/RUSAK), dan berhasil dikonfirmasi.
- **TC-KEMBALI-02**: Konfirmasi pengembalian berkas yang sudah kembali → Ditolak oleh constraint unik database untuk mencegah duplikasi.
- **TC-KEMBALI-03**: Pengembalian berkas $\le$ 48 jam → Status efektif transaksi tercatat sebagai `DIKEMBALIKAN` (tepat waktu).
- **TC-KEMBALI-04**: Pengembalian berkas $>$ 48 jam → Status efektif transaksi tercatat sebagai `TERLAMBAT`.

### D. Rekapitulasi dan Ekspor Dokumen
- **TC-LAP-01**: Filter laporan berdasarkan unit dan rentang tanggal → Menghasilkan rekapitulasi data yang akurat sesuai kriteria.
- **TC-LAP-02**: Ekspor data ke format Excel (`.xlsx`) → Berkas terunduh dengan format formulir standar rumah sakit (13 kolom, persentase, dan tanda tangan).
- **TC-LAP-03**: Ekspor data ke format PDF (`.pdf`) → Berkas dokumen A4 portrait terunduh lengkap dengan kop surat resmi RSI Sultan Agung Semarang dan nomor berita acara.
