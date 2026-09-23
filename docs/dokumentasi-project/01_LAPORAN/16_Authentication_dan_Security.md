# 16 — Authentication dan Security

---

## Alur Authentication

### Login

```
Input: NIP (string) + Password plain (string)
         ↓
1. SELECT user WHERE nip = $1
   └─ Jika tidak ada → log FAILED → throw "Username atau password salah."
         ↓
2. bcrypt.compare(passwordPlain, user.passwordHash)
   └─ Jika tidak cocok → log FAILED → throw "Username atau password salah."
         ↓
3. log SUCCESS
         ↓
4. return SessionUser { id, nip, name, email, role, avatarPath }
```

**File**: `src/lib/auth/authService.ts`, fungsi `loginWithNip()`

---

### Register

```
Input: NIP, Nama, Email, Password plain, Foto (opsional)
         ↓
1. Validasi input (NIP kosong? Nama kosong? Format email? Password kosong?)
         ↓
2. Cek NIP duplikat (SELECT WHERE nip = $1)
         ↓
3. Cek Email duplikat (SELECT WHERE email = $1)
         ↓
4. bcrypt.hash(passwordPlain, 10)
         ↓
5. INSERT INTO users (role='PETUGAS')
         ↓
6. return SessionUser
```

**File**: `src/lib/auth/authService.ts`, fungsi `registerUser()`

---

### Logout

```
User klik Logout → konfirmasi
         ↓
logout() → setUser(null)
         ↓
store.delete("user_session") + store.save()
         ↓
Kembali ke Portal
```

**File**: `src/context/AuthContext.tsx`

---

## Session Management

- Session disimpan menggunakan **Tauri Store** (`@tauri-apps/plugin-store`)
- File: `session.bin` (terenkripsi oleh Tauri)
- Saat app startup: session lama **sengaja dihapus**

```typescript
// AuthContext.tsx
// INTENTIONALLY do NOT restore session on startup.
// Every app launch must begin at the Portal page.
const had = await s.get<SessionUser>("user_session");
if (had) {
  await s.delete("user_session");
  await s.save();
}
```

Ini berarti: **setiap kali aplikasi dibuka, pengguna harus login ulang**.

---

## Password Security

### bcrypt

| Aspek | Detail |
|-------|--------|
| Algoritma | bcrypt |
| Library | `bcryptjs ^3.0.3` |
| Cost Factor | 10 |
| Salt | Otomatis (random, embedded dalam hash) |
| Hash Output | `$2b$10$...` (60 karakter) |

### Mengapa bcrypt?

1. **Designed for passwords**: Sengaja lambat (tidak bisa di-brute-force cepat)
2. **Built-in salt**: Setiap password berbeda hash meski plaintext sama
3. **Cost factor adjustable**: Bisa dinaikkan seiring peningkatan hardware

---

## Keamanan Login

### Pesan Error Generik

```typescript
// Tidak membedakan "NIP salah" vs "password salah"
throw new Error("Username atau password salah.");
```

Ini mencegah **user enumeration attack** (penyerang tidak tahu apakah NIP terdaftar atau tidak).

### Log Audit

Setiap percobaan login dicatat:
```sql
INSERT INTO login_logs (userId, nip, status) VALUES ($1, $2, $3)
-- status: 'SUCCESS' atau 'FAILED'
-- userId: null jika NIP tidak ditemukan
```

---

## Role-Based Access Control (RBAC)

### Role yang Ada

| Role | Dibuat oleh | Hak Akses |
|------|-------------|-----------|
| `Super Admin` | Sistem (auto-inject) | Semua fitur + Log Login + Pengaturan |
| `PETUGAS` | Register | Semua fitur operasional kecuali Log Login dan Pengaturan |

### Implementasi

```typescript
// constants.ts
{ id: "log-login", label: "Log Login", adminOnly: true },
{ id: "pengaturan", label: "Pengaturan", adminOnly: true },

// App.tsx
const visibleMenuItems = MENU_ITEMS.filter(item => {
  if (item.adminOnly && user.role !== 'Super Admin') return false;
  return true;
});
```

---

## Migrasi Password Lama (Keamanan)

Saat inisialisasi, sistem mendeteksi dan meng-upgrade akun yang masih menyimpan
password plaintext:

```typescript
// index.ts
const unhashed = await db.select<...>(
  "SELECT id FROM users WHERE passwordHash = 'superadmin123'"
);
if (unhashed.length > 0) {
  const hash = await bcrypt.hash('superadmin123', 10);
  await db.execute(
    "UPDATE users SET passwordHash = $1 WHERE passwordHash = 'superadmin123'",
    [hash]
  );
}
```

---

## Avatar / Foto Profil

Foto profil disimpan sebagai file di sistem file lokal menggunakan `avatarService.ts`.
Path file disimpan di kolom `users.avatarPath`.

```typescript
// avatarService.ts
// Menyalin file foto ke direktori aplikasi Tauri
export async function saveAvatarFile(file: File): Promise<string>
```

---

## Keamanan Database

- Semua query menggunakan **parameterized queries** (tidak ada string concatenation)
- Contoh safe: `"SELECT ... WHERE nip = $1"` dengan `[nip]` sebagai parameter
- Ini mencegah **SQL Injection**
- `PRAGMA foreign_keys = ON` diaktifkan → constraint relasional dijaga oleh SQLite
