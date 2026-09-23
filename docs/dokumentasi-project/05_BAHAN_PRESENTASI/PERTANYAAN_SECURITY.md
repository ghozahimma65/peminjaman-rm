# Tanya Jawab: Pertanyaan Keamanan Sistem (Security Questions)

---

### Q1: Apakah aplikasi ini rentan terhadap serangan SQL Injection? Bagaimana sistem mencegahnya?
**Jawaban**:
> *"Aplikasi ini **100% kebal terhadap serangan SQL Injection**. Seluruh operasi basis data menggunakan kueri berparameter (*Parameterized Queries / Prepared Statements*) yang disediakan oleh plugin Tauri SQL:
> ```typescript
> await db.execute("INSERT INTO users (nip, name) VALUES ($1, $2)", [nip, name]);
> ```
> Data masukan pengguna tidak pernah digabungkan secara langsung (*string concatenation*) ke dalam perintah SQL, sehingga karakter berbahaya seperti `' OR '1'='1` hanya akan diperlakukan sebagai nilai string biasa dan bukan bagian dari sintaks SQL."*

---

### Q2: Bagaimana sistem mencegah serangan penebakan akun (*User Enumeration Attack*) pada form login?
**Jawaban**:
> *"Sistem menyamakan pesan kesalahan untuk semua skenario kegagalan login. Baik ketika NIP tidak terdaftar maupun ketika NIP terdaftar tetapi password salah, sistem selalu menampilkan pesan yang sama persis:
> **'Username atau password salah.'**
> Dengan demikian, penyerang tidak dapat mengetahui apakah suatu NIP pegawai terdaftar atau tidak di sistem."*

---

### Q3: Bagaimana perlindungan kata sandi di tingkat basis data?
**Jawaban**:
> *"Kata sandi tidak pernah disimpan dalam bentuk teks polos (*plaintext*). Sistem menggunakan fungsi satu arah **bcryptjs** dengan faktor kerja (*salt rounds*) 10. Jika file database SQLite dicuri secara fisik dari hard disk, penyerang tidak dapat mendekripsi kata sandi tersebut karena bcrypt dirancang komputasional intensif untuk menahan serangan *rainbow tables* dan *brute-force*."*

---

### Q4: Mengapa sistem membatasi unggahan foto profil maksimal 5 MB dan memvalidasi tipe MIME?
**Jawaban**:
> *"Pada berkas `avatarService.ts`, terdapat validasi ganda:
> 1. Pengecekan ukuran (`file.size > 5 * 1024 * 1024 bytes`) untuk mencegah penimbunan memori (*denial of service / storage exhaustion*).
> 2. Pengecekan tipe berkas (`!file.type.startsWith('image/')`) untuk mencegah pengguna menyisipkan file executable berbahaya (`.exe`, `.bat`, `.dll`) yang disamarkan sebagai foto profil."*

---

### Q5: Bagaimana sistem membatasi hak akses agar petugas biasa tidak dapat melihat log login admin?
**Jawaban**:
> *"Sistem menerapkan **Role-Based Access Control (RBAC)** di mana peran akun tersimpan di token sesi memori (`user.role`). Komponen navigasi dan perutean memeriksa izin secara bersyarat: menu **Log Login** dan **Pengaturan** disembunyikan dan diblokir secara terprogram jika role pengguna bukan `'Super Admin'`."*
