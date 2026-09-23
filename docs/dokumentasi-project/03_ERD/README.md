# Dokumentasi Entity Relationship Diagram (ERD) Sistem Filing Rekam Medis

---

## Pendahuluan

Dokumentasi ini menyajikan model data konseptual, logikal, dan fisik untuk basis data relasional SQLite (`rekam_medis.db`) yang digunakan pada aplikasi desktop **Filing Rekam Medis** di RSI Sultan Agung Semarang.

> [!IMPORTANT]
> **Prinsip Pemisahan ERD dan DFD**:
> Dokumen ini berfokus murni pada **arsitektur penyimpanan data relasional, skema tabel, atribut, tipe data, dan integritas referensial (Foreign Keys & Constraints)**. Aliran proses dan transformasi data sistem didokumentasikan terpisah pada direktori `02_DFD/`.

---

## Daftar Berkas ERD

| Berkas | Fokus Bahasan | Rincian Cakupan |
|---|---|---|
| [`ERD.md`](./ERD.md) | Diagram Relasi Entitas (ERD) | Diagram visual Mermaid ER, kardinalitas relasi, dan pemodelan entitas |
| [`Struktur_Tabel.md`](./Struktur_Tabel.md) | Kamus Data & Struktur Fisik | Spesifikasi lengkap 6 tabel: nama kolom, tipe data SQLite, kunci, nilai bawaan, dan aturan nullability |
| [`Relasi_Database.md`](./Relasi_Database.md) | Integritas Referensial & FK | Penjelasan aksi referensial (`ON DELETE RESTRICT`, `ON DELETE CASCADE`, `ON DELETE SET NULL`) dan penegakan `PRAGMA foreign_keys = ON` |

---

## Ringkasan Entitas Utama

Sistem menggunakan 6 entitas tabel yang terintegrasi:

1. **`users`**: Menyimpan identitas akun pengguna aplikasi, hash kata sandi bcrypt, dan peran (*Super Admin* atau *PETUGAS*).
2. **`login_logs`**: Mencatat riwayat percobaan login ke sistem untuk keperluan audit jejak digital.
3. **`data_rm`**: Master data identitas berkas rekam medis dan data demografi pasien.
4. **`peminjaman`**: Transaksi peminjaman fisik berkas rekam medis ke berbagai unit ruangan.
5. **`pengembalian`**: Konfirmasi fisik berkas telah diterima kembali di depo filing beserta pencatatan kondisi fisik dokumen.
6. **`notifications`**: Antrean peringatan dini operasional (peringatan 24 jam sebelum batas waktu dan status keterlambatan berkas).
