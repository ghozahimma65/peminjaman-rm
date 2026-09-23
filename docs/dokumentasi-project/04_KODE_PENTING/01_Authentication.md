# 01 — Autentikasi Pengguna (`authService.ts`)

---

- **FILE**: `src/lib/auth/authService.ts`
- **FUNCTION/COMPONENT**: `loginWithNip(nip, passwordPlain)`, `registerUser(params)`, `logLogin(userId, nip, status)`

---

## TUJUAN
Mengamankan akses ke seluruh sistem filing rekam medis, memvalidasi identitas pengguna berdasarkan NIP dan kata sandi, menerapkan kriptografi hashing satu arah (*one-way hashing*), serta mencatat log audit akses secara persisten.

---

## ALUR
1. Fungsi menerima `nip` dan `passwordPlain`.
2. Mencari baris user pada database: `SELECT * FROM users WHERE nip = $1`.
3. Jika user tidak ditemukan, catat log `FAILED` via `logLogin()` dan lemparkan error generik `"Username atau password salah."`.
4. Jika user ditemukan, panggil `bcrypt.compare(passwordPlain, user.passwordHash)`.
5. Jika hasil perbandingan `false`, catat log `FAILED` dan lemparkan error generik yang sama.
6. Jika `true`, catat log `SUCCESS` dan kembalikan objek `UserSession`.

---

## INPUT / PROSES / OUTPUT
- **INPUT**:
  - `nip`: string (Nomor Induk Pegawai)
  - `passwordPlain`: string (Kata sandi teks polos dari form login)
- **PROSES**:
  - Sanitasi input (`trim()`)
  - Query parameterisasi SQLite
  - Verifikasi kriptografi bcrypt (salt rounds 10)
  - Penulisan log audit ke tabel `login_logs`
- **OUTPUT**:
  - `Promise<UserSession>`: Objek berisi `{ id, nip, name, email, role, avatarPath }`

---

## KENAPA PENTING
Sistem ini menangani data rekam medis pasien yang bersifat rahasia (*confidential*). Penggunaan bcrypt menjamin tidak ada kata sandi yang tersimpan dalam format teks polos di database SQLite. Jika database dicuri secara fisik, kata sandi pengguna tetap aman dari serangan *dictionary attack*.

---

## KEMUNGKINAN DITANYA PENGUJI
> *"Kenapa pesan error saat NIP tidak ditemukan dan saat password salah dibuat sama persis ('Username atau password salah')?"*

---

## JAWABAN REKOMENDASI
> *"Pembedaan pesan error seperti 'NIP tidak terdaftar' atau 'Password salah' membuka celah keamanan yang disebut **User Enumeration Attack**. Dengan pesan generik yang sama, penyerang tidak dapat menebak apakah suatu NIP terdaftar di sistem atau tidak."*

---

## KODE TERKAIT

```typescript
export async function loginWithNip(nip: string, passwordPlain: string): Promise<UserSession> {
  const db = await getDb();
  const trimmedNip = nip.trim();

  const users = await db.select<UserRow[]>(
    "SELECT id, nip, email, passwordHash, name, role, avatarPath FROM users WHERE nip = $1",
    [trimmedNip]
  );

  if (users.length === 0) {
    await logLogin(null, trimmedNip, "FAILED");
    throw new Error("Username atau password salah.");
  }

  const user = users[0];
  const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);

  if (!isValid) {
    await logLogin(user.id, trimmedNip, "FAILED");
    throw new Error("Username atau password salah.");
  }

  await logLogin(user.id, trimmedNip, "SUCCESS");

  return {
    id: user.id,
    nip: user.nip,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarPath: user.avatarPath,
  };
}
```
