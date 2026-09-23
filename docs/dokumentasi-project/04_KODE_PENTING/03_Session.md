# 03 — Manajemen Sesi Pengguna (`AuthContext.tsx`)

---

- **FILE**: `src/context/AuthContext.tsx`
- **FUNCTION/COMPONENT**: `AuthProvider`, `useAuth()`, `setUser()`, `logout()`

---

## TUJUAN
Menyediakan state manajemen otentikasi global di seluruh aplikasi React, mengelola daur hidup sesi pengguna, dan menegakkan aturan keamanan bahwa setiap aplikasi baru dibuka harus dimulai dari halaman login/portal (*clean session on startup*).

---

## ALUR
1. Saat komponen `AuthProvider` di-*mount*, fungsi `initStore()` memuat store biner `session.bin` via `@tauri-apps/plugin-store`.
2. Sistem secara sengaja (*intentionally*) menghapus kunci `user_session` dari store jika ditemukan data sesi sebelumnya (`s.delete("user_session")`).
3. State `user` disetel ke `null` dan `isLoading` disetel ke `false`.
4. Saat login berhasil, fungsi `setUser(newUser)` memperbarui state memori React dan menyimpan data user aktif ke `session.bin`.
5. Saat fungsi `logout()` dipanggil, `setUser(null)` menghapus sesi di memori dan menghapus berkas penyimpanan sesi.

---

## INPUT / PROSES / OUTPUT
- **INPUT**:
  - `newUser`: Objek `SessionUser` atau `null`
- **PROSES**:
  - React State dispatch (`setUserState`)
  - Tauri Store binary save/delete (`store.save()`)
- **OUTPUT**:
  - React Context Provider yang mengekspos `{ user, setUser, isLoading, logout }` ke seluruh pohon komponen.

---

## KENAPA PENTING
Komputer di unit filing rekam medis rumah sakit umumnya merupakan komputer bersama (*shared workstation*) yang digunakan bergantian oleh petugas dari berbagai shift kerja. Jika sesi dipertahankan setelah aplikasi ditutup, petugas pada shift berikutnya dapat secara tidak sengaja melakukan transaksi peminjaman/pengembalian atas nama petugas shift sebelumnya.

---

## KEMUNGKINAN DITANYA PENGUJI
> *"Kenapa menggunakan plugin Tauri Store (`session.bin`) jika pada saat startup sesi selalu dihapus?"*

---

## JAWABAN REKOMENDASI
> *"Plugin Tauri Store (`session.bin`) digunakan untuk persistensi sesi sementara selama aplikasi tetap berjalan (misalnya saat reload internal atau pemulihan jendela), sekaligus menyediakan fondasi yang siap jika di masa mendatang rumah sakit menghendaki opsi fitur 'Ingat Saya' (Remember Me). Namun saat ini kebijakan keamanan rumah sakit mewajibkan otentikasi ulang setiap kali aplikasi baru dinyalakan."*

---

## KODE TERKAIT

```typescript
useEffect(() => {
  async function initStore() {
    try {
      const s = await load("session.bin");
      setStore(s);

      // INTENTIONALLY do NOT restore session on startup.
      // Every app launch must begin at the Portal page.
      // Clear any previously saved session so the store stays clean.
      const had = await s.get<SessionUser>("user_session");
      if (had) {
        await s.delete("user_session");
        await s.save();
      }
    } catch (err) {
      console.error("Failed to load session store:", err);
    } finally {
      setIsLoading(false);
    }
  }
  initStore();
}, []);
```
