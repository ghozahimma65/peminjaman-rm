# 08 — Aktor dan Hak Akses

Berdasarkan source code, sistem memiliki dua aktor dengan hak akses berbeda.

---

## Aktor 1 — Super Admin

### Identitas Default
- **NIP**: `superadmin`
- **Password Default**: `superadmin123` (di-hash dengan bcrypt saat inisialisasi DB pertama)
- **Nama**: `Super Administrator`
- **Role**: `Super Admin`
- **Dibuat oleh**: Sistem otomatis saat database pertama kali diinisialisasi (`index.ts`)

### Hak Akses Super Admin
Super Admin dapat mengakses **semua fitur** dalam sistem, termasuk:

| Fitur | Akses |
|-------|-------|
| Dashboard | ✅ |
| Master Data RM | ✅ |
| Peminjaman Baru | ✅ |
| Daftar Peminjaman | ✅ |
| Proses Pengembalian | ✅ |
| Daftar Pengembalian | ✅ |
| Riwayat RM | ✅ |
| Laporan (Rekap Peminjaman) | ✅ |
| **Log Login** | ✅ (eksklusif) |
| **Pengaturan** | ✅ (eksklusif) |
| Profil | ✅ |

### Bukti Kode
```typescript
// constants.ts
{ id: "log-login", label: "Log Login", icon: Icons.LogLogin, adminOnly: true },
{ id: "pengaturan", label: "Pengaturan", icon: Icons.Pengaturan, adminOnly: true },
```

```typescript
// App.tsx — Filter menu berdasarkan role
const visibleMenuItems = MENU_ITEMS.filter(item => {
  if (item.adminOnly && user.role !== 'Super Admin') {
    return false;
  }
  return true;
});
```

---

## Aktor 2 — Petugas (PETUGAS)

### Cara Mendapatkan Akses
Petugas mendaftarkan akun melalui halaman **Register** yang dapat diakses dari halaman
login. Semua akun yang didaftarkan melalui register otomatis mendapatkan role `PETUGAS`:

```typescript
// authService.ts
await db.execute(
  "INSERT INTO users (nip, name, email, passwordHash, role, avatarPath) VALUES ($1, $2, $3, $4, $5, $6)",
  [nipTrimmed, nameTrimmed, emailTrimmed, hash, "PETUGAS", params.avatarPath || null]
);
```

### Hak Akses Petugas

| Fitur | Akses |
|-------|-------|
| Dashboard | ✅ |
| Master Data RM | ✅ |
| Peminjaman Baru | ✅ |
| Daftar Peminjaman | ✅ |
| Proses Pengembalian | ✅ |
| Daftar Pengembalian | ✅ |
| Riwayat RM | ✅ |
| Laporan (Rekap Peminjaman) | ✅ |
| Log Login | ❌ (disembunyikan) |
| Pengaturan | ❌ (disembunyikan) |
| Profil | ✅ |

---

## Data yang Dicatat per Transaksi

Setiap transaksi peminjaman mencatat:
- `peminjamId`: ID user operator yang menginput peminjaman
- `namaPeminjam`: Nama peminjam eksternal (dokter/perawat/dll) jika berbeda dari operator

Pengembalian mencatat:
- `dikembalikanOlehId`: ID user operator yang melakukan konfirmasi pengembalian

---

## Catatan Keamanan

- Password disimpan dalam bentuk hash bcrypt (bukan plaintext)
- Jika database lama menyimpan password plaintext `superadmin123`, sistem secara otomatis
  meng-upgrade ke hash bcrypt saat inisialisasi:
  ```typescript
  // index.ts
  const unhashed = await db.select<...>("SELECT id FROM users WHERE passwordHash = 'superadmin123'");
  if (unhashed.length > 0) {
    const hash = await bcrypt.hash('superadmin123', 10);
    await db.execute("UPDATE users SET passwordHash = $1 WHERE passwordHash = 'superadmin123'", [hash]);
  }
  ```
- Pesan error login bersifat generik: `"Username atau password salah."` (tidak membedakan
  apakah NIP atau password yang salah — ini adalah praktik keamanan yang baik)
