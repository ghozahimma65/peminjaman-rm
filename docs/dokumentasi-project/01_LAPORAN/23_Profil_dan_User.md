# 23 — Profil dan Manajemen Pengguna

---

## Gambaran Modul Profil

Halaman **Profil** (`Profil.tsx`) menyediakan antarmuka bagi pengguna aktif (baik `Super Admin` maupun `PETUGAS`) untuk melihat dan memperbarui informasi identitas pribadi, mengelola foto profil (*avatar*), serta melakukan pergantian kata sandi (*change password*).

---

## Fitur Manajemen Pengguna

### 1. Pembaruan Informasi Profil (`updateUserProfile`)
Petugas dapat memperbarui Nama Lengkap dan Alamat Email:
- **Validasi Unik Email**: Sistem memeriksa bahwa email baru belum digunakan oleh pengguna lain di database (`SELECT id FROM users WHERE email = $1 AND id <> $2`).
- **Update Database**:
  ```sql
  UPDATE users 
  SET name = $1, email = $2, avatarPath = $3, updatedAt = CURRENT_TIMESTAMP 
  WHERE id = $4;
  ```
- **Sinkronisasi State**: Setelah data di database berhasil diperbarui, context otentikasi (`AuthContext`) di-refresh untuk memperbarui tampilan nama pengguna di header aplikasi.

### 2. Manajemen Foto Profil / Avatar (`avatarService.ts`)
Aplikasi mendukung pengunggahan foto profil lokal yang disimpan langsung pada sistem penyimpanan lokal aplikasi desktop (*Tauri AppData*):
- **Validasi File**:
  - Ukuran maksimum: **5 MB** (`5 * 1024 * 1024` bytes).
  - Format yang didukung: Format gambar standar (JPG, PNG, WEBP, GIF).
- **Penyimpanan Berkas Fisik**:
  - File disimpan pada direktori aplikasi: `BaseDirectory.AppData` di dalam folder `avatars/`.
  - Penamaan file otomatis unik: `avatar_{userId}_{timestamp}.{ext}`.
- **Relasi Database**:
  - Kolom `avatarPath` pada tabel `users` hanya menyimpan referensi path relatif (contoh: `avatars/avatar_1_1711200000.png`).
- **Rendering Gambar**:
  - `getAvatarDisplayUrl(avatarPath)` membaca byte file dari AppData secara asinkron via `@tauri-apps/plugin-fs` (`readFile`) dan membungkusnya ke dalam *Blob Object URL* (`URL.createObjectURL(blob)`) untuk dirender secara aman di tag `<img>` React.
- **Pembersihan Berkas Usang**:
  - `deleteAvatarFile(avatarPath)` menghapus foto profil lama dari disk saat pengguna mengunggah foto baru.

### 3. Pergantian Kata Sandi (`changeUserPassword`)
Mekanisme pergantian kata sandi menerapkan prinsip keamanan kriptografi:
1. Memvalidasi kecocokan password lama menggunakan `bcrypt.compare(oldPasswordPlain, currentHash)`.
2. Jika password lama tidak cocok, melempar error: `"Password lama tidak sesuai."`
3. Menghasilkan hash baru untuk password baru menggunakan bcrypt dengan cost factor 10 (`bcrypt.hash(newPasswordPlain, 10)`).
4. Menyimpan hash baru ke database:
   ```sql
   UPDATE users SET passwordHash = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2;
   ```

---

## Log Aktivitas Login (`login_logs`)

Untuk memantau jejak keamanan akun, sistem secara otomatis mencatat setiap percobaan masuk:
- Dicatat melalui fungsi `logLogin(userId, nip, status)` pada setiap proses login.
- Status tercatat sebagai `'SUCCESS'` atau `'FAILED'`.
- Khusus pengguna dengan role `Super Admin`, riwayat log login ini dapat ditinjau secara berkala melalui menu khusus **Log Login** (`LogLogin.tsx`).
