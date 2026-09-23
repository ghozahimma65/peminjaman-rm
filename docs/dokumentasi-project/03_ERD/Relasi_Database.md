# Integritas Referensial dan Relasi Basis Data

---

## Penegakan Kunci Asing di SQLite

Secara bawaan (*default*), mesin basis data SQLite tidak mengaktifkan validasi kunci asing (*Foreign Key Constraints*). Oleh karena itu, pada berkas inisialisasi basis data `schema.ts`, perintah pertama yang dieksekusi setiap kali koneksi database dibuka adalah:

```sql
PRAGMA foreign_keys = ON;
```

Pengaturan ini memastikan bahwa setiap operasi `INSERT`, `UPDATE`, maupun `DELETE` tunduk pada batasan integritas referensial yang telah dirancang.

---

## Matriks Relasi Antar Tabel

| No | Tabel Asal (Child) | Kolom Foreign Key | Tabel Tujuan (Parent) | Kolom Primary Key | Aturan `ON DELETE` | Penjelasan Rationale |
|---|---|---|---|---|---|---|
| 1 | `login_logs` | `userId` | `users` | `id` | `ON DELETE SET NULL` | Jejak audit login tetap tersimpan untuk analisis forensik keamanan meskipun akun pengguna dihapus. Kolom `nip` tetap menyimpan identitas pengguna terkait. |
| 2 | `peminjaman` | `peminjamId` | `users` | `id` | `ON DELETE RESTRICT` | Akun petugas rekam medis tidak boleh dihapus jika masih tercatat sebagai penanggung jawab transaksi peminjaman berkas rekam medis. |
| 3 | `peminjaman` | `nomorRm` | `data_rm` | `nomorRm` | `ON DELETE RESTRICT` | Master berkas rekam medis pasien tidak dapat dihapus apabila berkas tersebut pernah memiliki riwayat peminjaman. |
| 4 | `pengembalian` | `peminjamanId` | `peminjaman` | `id` | `ON DELETE RESTRICT` | Transaksi peminjaman yang sudah selesai dikembalikan tidak boleh dihapus begitu saja tanpa melalui proses pembatalan resmi. Kolom ini juga berstatus `UNIQUE` untuk mencegah duplikasi pengembalian. |
| 5 | `pengembalian` | `dikembalikanOlehId` | `users` | `id` | `ON DELETE RESTRICT` | Mencegah penghapusan akun petugas penerima berkas untuk menjaga akuntabilitas serah terima fisik berkas. |
| 6 | `notifications` | `peminjamanId` | `peminjaman` | `id` | `ON DELETE CASCADE` | Notifikasi pengingat bersifat sementara (*transient*). Jika data transaksi peminjaman dihapus, seluruh notifikasi terkait akan terhapus otomatis secara bersih. |

---

## Rincian Perilaku Integritas Relasional

### 1. Perlindungan Integritas Operasional (`ON DELETE RESTRICT`)
Untuk tabel transaksi inti (`peminjaman` dan `pengembalian`), sistem memberlakukan `ON DELETE RESTRICT`. 
- **Skenario**: Seorang admin mencoba menghapus user `PETUGAS` atau data pasien di `data_rm`.
- **Perilaku Database**: SQLite akan melempar pengecualian (*foreign key constraint failure*), menggagalkan eksekusi, dan menjaga konsistensi data riwayat sirkulasi rekam medis dari *orphaned records*.

### 2. Penjaminan Relasi Tepat Satu-ke-Satu ($1 : 1$) pada Pengembalian
Tabel `pengembalian` memiliki definisi kolom:
```sql
peminjamanId INTEGER UNIQUE NOT NULL
```
- Menjamin bahwa satu transaksi peminjaman fisik hanya boleh memiliki **satu kali** proses konfirmasi kembali.
- Jika terjadi *race condition* atau double-click pada tombol konfirmasi, SQLite secara otomatis menolak upaya penulisan baris kedua dengan pesan error `UNIQUE constraint failed: pengembalian.peminjamanId`.

### 3. Otomatisasi Pembersihan Notifikasi (`ON DELETE CASCADE`)
Definisi pada tabel `notifications`:
```sql
FOREIGN KEY(peminjamanId) REFERENCES peminjaman(id) ON DELETE CASCADE
```
- Menjamin database tidak meninggalkan "sampah" pesan pengingat saat suatu transaksi dihapus melalui fitur audit riwayat (`deletePeminjamanHistory`).

### 4. Jejak Audit Forensik (`ON DELETE SET NULL`)
Definisi pada tabel `login_logs`:
```sql
FOREIGN KEY(userId) REFERENCES users(id) ON DELETE SET NULL
```
- Menjaga prinsip kepatuhan audit keamanan informasi: data percobaan masuk tidak pernah hilang dari rekam jejak, bahkan jika pengguna tersebut telah dinonaktifkan dari sistem.
