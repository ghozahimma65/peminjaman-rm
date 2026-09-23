# Tanya Jawab: Pertanyaan Autentikasi & Keamanan (Authentication Questions)

---

### Q1: Mengapa menggunakan algoritma bcrypt dan memilih cost factor (salt rounds) 10?
**Jawaban**:
> *"**bcrypt** adalah standar industri algoritma hashing satu arah (*one-way hash*) yang dirancang khusus untuk password dengan fitur *Key Stretching* dan *Salt* otomatis. Nilai **cost factor 10** berarti algoritma melakukan perputaran hashing sebanyak $2^{10} = 1.024$ iterasi. Nilai ini memberikan keseimbangan optimal antara keamanan tinggi terhadap serangan brute-force dengan kecepatan eksekusi login yang tetap instan di komputer petugas (kurang dari 100 milidetik per verifikasi)."*

---

### Q2: Bagaimana cara kerja verifikasi password saat pengguna login?
**Jawaban**:
> *"Saat pengguna memasukkan kata sandi di formulir:
> 1. Sistem mencari baris pengguna berdasarkan NIP untuk mengambil `passwordHash` yang tersimpan di database.
> 2. Sistem memanggil fungsi `bcrypt.compare(passwordPlain, user.passwordHash)`.
> 3. Algoritma bcrypt mengekstrak *salt* yang tertanam di dalam hash yang tersimpan, meng-hash kata sandi inputan dengan salt tersebut, lalu membandingkannya dalam waktu konstan (*constant-time comparison*) untuk mencegah serangan *timing attack*.
> 4. Jika cocok mengembalikan `true`, jika berbeda mengembalikan `false`."*

---

### Q3: Mengapa sesi pengguna secara sengaja direset (*clean session*) setiap kali aplikasi dibuka ulang?
**Jawaban**:
> *"Pada berkas `AuthContext.tsx`, sistem secara sengaja menghapus sesi tersimpan pada fungsi `initStore()`:
> ```typescript
> const had = await s.get<SessionUser>("user_session");
> if (had) {
>   await s.delete("user_session");
>   await s.save();
> }
> ```
> Kebijakan ini diterapkan karena komputer loket filing rekam medis di rumah sakit digunakan secara bergantian oleh petugas dari berbagai shift kerja (Pagi, Siang, Malam). Mewajibkan login setiap aplikasi baru dinyalakan menjamin bahwa setiap transaksi yang dicatat selalu benar-benar dapat dipertanggungjawabkan oleh petugas yang sedang bertugas."*

---

### Q4: Bagaimana mekanisme Otorisasi Berbasis Peran (*Role-Based Access Control / RBAC*) dijalankan?
**Jawaban**:
> *"Sistem membagi pengguna menjadi dua peran: `Super Admin` dan `PETUGAS`.
> Di sisi frontend, menu navigasi memeriksa properti `user.role`:
> - Menu **Log Login** dan **Pengaturan** memiliki flag `adminOnly: true`. Jika peran pengguna bukan `'Super Admin'`, tombol navigasi tersebut disembunyikan dari sidebar dan akses ke rute komponen diblokir secara otomatis."*

---

### Q5: Apa fungsi tabel `login_logs` dan data apa saja yang dicatat?
**Jawaban**:
> *"Tabel `login_logs` berfungsi sebagai **jejak audit kepatuhan keamanan (security audit trail)**. Setiap ada percobaan masuk ke aplikasi, fungsi `logLogin()` mencatat:
> - `userId`: ID pengguna (bernilai `NULL` jika NIP tidak dikenal)
> - `nip`: NIP yang dimasukkan pada form
> - `loginTime`: Timestamp waktu percobaan
> - `status`: `'SUCCESS'` untuk login berhasil atau `'FAILED'` untuk login gagal.
> Data ini dapat dipantau oleh Super Admin untuk mendeteksi apakah ada pihak tidak berwenang yang mencoba menebak kata sandi akun petugas."*
