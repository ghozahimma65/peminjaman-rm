# 21 — Sistem Notifikasi dan Peringatan

---

## Gambaran Sistem Notifikasi

Sistem notifikasi dalam aplikasi **Filing Rekam Medis** dirancang sebagai mekanisme pengingat dini (*early warning system*) bagi petugas filing. Tujuannya adalah mencegah keterlambatan pengembalian berkas fisik rekam medis yang dipinjam oleh ruangan rawat inap, instalasi gawat darurat, poliklinik rawat jalan, maupun unit penunjang lainnya di RSI Sultan Agung Semarang.

Sistem ini memantau batas waktu pengembalian (48 jam sejak berkas keluar) dan memicu dua klasifikasi notifikasi:
1. **REMINDER (Peringatan Awal)**: Muncul ketika sisa waktu pengembalian berkas tinggal $\le$ 24 jam.
2. **TERLAMBAT (Keterlambatan)**: Muncul ketika waktu saat ini telah melampaui batas waktu 48 jam dan berkas belum dikembalikan.

---

## Struktur Tabel `notifications`

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | ID unik baris notifikasi |
| `type` | `TEXT NOT NULL` | Tipe notifikasi: `'REMINDER'` atau `'TERLAMBAT'` |
| `peminjamanId` | `INTEGER NOT NULL` | Relasi FK ke tabel `peminjaman(id)` (ON DELETE CASCADE) |
| `message` | `TEXT NOT NULL` | Teks pesan deskriptif notifikasi |
| `isRead` | `BOOLEAN NOT NULL DEFAULT 0` | Status keterbacaan notifikasi (`0` = belum dibaca, `1` = sudah dibaca) |
| `createdAt` | `DATETIME DEFAULT CURRENT_TIMESTAMP` | Waktu notifikasi diterbitkan |

---

## Mekanisme Sinkronisasi Pasif (`syncNotifications`)

Aplikasi desktop ini menggunakan arsitektur **Sinkronisasi Pasif (Passive Event-Driven Synchronization)**. Sistem tidak membutuhkan background daemon service atau cron server eksternal, melainkan dieksekusi secara otomatis saat aplikasi dibuka, dimuat ulang, atau ketika navigasi halaman berlangsung.

Fungsi `syncNotifications()` pada `src/lib/database/notificationService.ts` menjalankan 3 tahapan sistematis:

```
[Panggilan syncNotifications()]
              │
              ▼
1. PEMBERSIHAN OTOMATIS (Auto-Cleanup)
   Hapus notifikasi untuk berkas yang sudah berhasil dikembalikan
              │
              ▼
2. AMBIL PEMINJAMAN AKTIF
   SELECT peminjaman WHERE status IN ('DIPINJAM', 'TERLAMBAT') 
   AND NOT EXISTS pengembalian
              │
              ▼
3. EVALUASI DEADLINE (Loop per Berkas)
   deadline = calculateDeadline(tanggalBerkasKeluar, tanggalPinjam)
   now = Waktu Saat Ini
              │
    ┌─────────┴─────────┐
    ▼                   ▼
now > deadline       now <= deadline
(TERLAMBAT)          (CEK REMINDER)
    │                   │
    ├─ Cek notif ada?   ├─ diffMs <= 24 Jam?
    │  Jika belum,      │  Jika Ya & belum ada notif:
    │  INSERT TERLAMBAT │  INSERT REMINDER
    │                   │
    └─ Update status    └─ Selesai loop
       peminjaman ke
       'TERLAMBAT'
```

### 1. Tahap Auto-Cleanup
Notifikasi yang terkait dengan peminjaman yang sudah selesai (dikembalikan) otomatis dihapus agar tidak memenuhi memori database:
```sql
DELETE FROM notifications WHERE peminjamanId IN (
  SELECT id FROM peminjaman WHERE status = 'DIKEMBALIKAN'
    OR EXISTS (SELECT 1 FROM pengembalian WHERE pengembalian.peminjamanId = peminjaman.id)
);
```

### 2. Evaluasi Kasus Keterlambatan (`TERLAMBAT`)
Jika waktu saat ini melebihi batas waktu deadline:
1. Periksa apakah notifikasi tipe `'TERLAMBAT'` untuk peminjaman tersebut sudah pernah dibuat sebelumnya (mencegah duplikasi).
2. Jika belum ada, masukkan data notifikasi baru:
   ```sql
   INSERT INTO notifications (type, peminjamanId, message) 
   VALUES ('TERLAMBAT', $1, 'RM ' || $2 || ' sudah melewati batas waktu pengembalian.');
   ```
3. Lakukan sinkronisasi otomatis status peminjaman di database dari `'DIPINJAM'` menjadi `'TERLAMBAT'`:
   ```sql
   UPDATE peminjaman SET status = 'TERLAMBAT', updatedAt = CURRENT_TIMESTAMP WHERE id = $1;
   ```

### 3. Evaluasi Kasus Peringatan Dini (`REMINDER`)
Jika waktu saat ini belum melewati deadline, hitung selisih waktu (`deadline - now`).
- Ambang batas: $24 \text{ jam} = 24 \times 60 \times 60 \times 1000 \text{ ms} = 86.400.000 \text{ ms}$.
- Jika $0 < \text{diffMs} \le 86.400.000$, dan notifikasi `'REMINDER'` belum ada:
  ```sql
  INSERT INTO notifications (type, peminjamanId, message) 
  VALUES ('REMINDER', $1, 'RM ' || $2 || ' mendekati batas waktu pengembalian.');
  ```

---

## Interaksi Antarmuka Pengguna (UI Notification Dropdown)

1. **Badge Counter Belum Dibaca (`getUnreadCount`)**:
   - Ikon lonceng pada header navigasi utama menampilkan badge merah berisi angka notifikasi yang belum dibaca (`isRead = 0`).
2. **Daftar Dropdown Notifikasi (`getNotifications`)**:
   - Menampilkan daftar notifikasi yang diurutkan berdasarkan `isRead ASC` (belum dibaca di atas) dan `createdAt DESC` (terbaru).
   - Notifikasi `TERLAMBAT` ditampilkan dengan highlight warna merah/oranye.
   - Notifikasi `REMINDER` ditampilkan dengan highlight warna kuning.
3. **Tandai Sudah Dibaca (`markAsRead(id)`)**:
   - Mengklik item notifikasi mengeksekusi `UPDATE notifications SET isRead = 1 WHERE id = $1`, memudarkan item notifikasi dan mengurangi angka badge pada header.
