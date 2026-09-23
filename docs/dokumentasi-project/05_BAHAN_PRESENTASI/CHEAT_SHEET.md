# Lembar Pintar Ujian & Sidang (Cheat Sheet Ringkas)

---

## 1. Elevator Pitch (Penjelasan 30 Detik)
> *"Sistem Filing Rekam Medis RSI Sultan Agung Semarang adalah aplikasi desktop berbasis **Tauri v2**, **React 19**, **TypeScript**, dan **SQLite**. Sistem ini mendigitalisasi proses sirkulasi berkas fisik rekam medis pasien dengan menegakkan aturan ketat bahwa **satu berkas fisik hanya dapat dipinjam oleh satu pihak dalam satu waktu**, memantau batas peminjaman **48 jam** dengan sistem peringatan dini otomatis, menyediakan **audit trail** kronologis per berkas, serta menghasilkan laporan rekapitulasi kepatuhan ruangan yang dapat diekspor langsung ke format resmi **Excel (.xlsx)** dan **PDF (.pdf)**."*

---

## 2. Arsitektur Teknologi dalam Sekilas
- **Frontend Framework**: React 19.x + TypeScript 5.8 + Vite 7.x
- **Desktop Runtime**: Tauri v2.x (Backend Rust berbobot ringan, footprint RAM < 80 MB)
- **Styling**: Tailwind CSS v4.x + Lucide Icons + Font Plus Jakarta Sans
- **Database**: SQLite lokal via `@tauri-apps/plugin-sql` (6 tabel relasional)
- **Keamanan**: bcryptjs (work factor 10) + audit trail `login_logs`
- **Ekspor Dokumen**: ExcelJS (Times New Roman, 13 kolom rekapitulasi) & jsPDF + autotable (Kop resmi RSISA)

---

## 3. Logika Bisnis Utama (The "Golden Rules")

### Aturan 1: Single Active Loan
- Berkas fisik rekam medis tidak boleh dipinjam jika sedang berstatus `DIPINJAM` atau `TERLAMBAT`.
- Validasi dilakukan dua lapis: di komponen UI (`AjukanPeminjaman.tsx`) dan di service database (`checkActivePeminjaman` di `peminjamanService.ts`).

### Aturan 2: Batas Waktu 48 Jam & Status Dinamis
```
Deadline = tanggalBerkasKeluar + 48 Jam (Fallback: tanggalPinjam + 48 Jam)

- Jika sudah dikembalikan:
    waktuKembali > Deadline  --> TERLAMBAT
    waktuKembali <= Deadline --> DIKEMBALIKAN (Tepat Waktu)

- Jika belum dikembalikan:
    waktuSekarang > Deadline --> TERLAMBAT
    waktuSekarang <= Deadline --> DIPINJAM (Aktif)
```

### Aturan 3: Notifikasi Pasif Cerdas
- **Pembersihan Otomatis**: Setiap sinkronisasi, notifikasi untuk berkas yang sudah kembali otomatis dihapus dari database.
- **REMINDER**: Diterbitkan saat sisa waktu pengembalian $\le$ 24 jam.
- **TERLAMBAT**: Diterbitkan saat waktu melewati 48 jam dan otomatis memutakhirkan status peminjaman menjadi `TERLAMBAT`.

### Aturan 4: Zero Duplicate Return & Rollback Safety
- Kolom `peminjamanId` pada tabel `pengembalian` berstatus `UNIQUE`.
- Proses pengembalian dibungkus penanganan rollback manual: jika terjadi kegagalan, record pengembalian dihapus dan status peminjaman dikembalikan ke `'DIPINJAM'`.

---

## 4. Matriks Peran Pengguna (Role Matrix)

| Fitur / Halaman | PETUGAS | Super Admin |
|---|:---:|:---:|
| Portal & Login NIP | ✅ | ✅ |
| Dashboard Ringkasan | ✅ | ✅ |
| Master Data Pasien & RM | ✅ | ✅ |
| Input Peminjaman Baru | ✅ | ✅ |
| Daftar & Filter Peminjaman | ✅ | ✅ |
| Proses Konfirmasi Pengembalian | ✅ | ✅ |
| Daftar & Filter Pengembalian | ✅ | ✅ |
| Penelusuran Riwayat Lengkap RM | ✅ | ✅ |
| Laporan & Ekspor Excel/PDF | ✅ | ✅ |
| Edit Profil & Ganti Password | ✅ | ✅ |
| **Audit Jejak Log Login (`login_logs`)** | ❌ | ✅ |
| **Menu Pengaturan Sistem** | ❌ | ✅ |
