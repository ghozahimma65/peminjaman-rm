# DFD Level 2 — Proses 1.0: Autentikasi dan Manajemen Sesi

---

## Gambaran Proses 1.0

DFD Level 2 ini menguraikan secara rinci alur verifikasi kredensial saat pengguna (Petugas atau Super Admin) melakukan proses masuk (*login*) ke dalam sistem hingga sesi pengguna aktif dibentuk dan jejak audit tersimpan.

---

## Diagram Mermaid DFD Level 2 — Login

```mermaid
flowchart TD
    %% Entitas
    E1["Pengguna (Petugas / Super Admin)"]

    %% Data Stores
    D1[("D1: users")]
    D2[("D2: login_logs")]

    %% Sub-Proses 1.0
    P1_1(("1.1<br/>Validasi Format<br/>Kredensial Input"))
    P1_2(("1.2<br/>Pencarian User<br/>berdasarkan NIP"))
    P1_3(("1.3<br/>Verifikasi Hash<br/>Kata Sandi (bcrypt)"))
    P1_4(("1.4<br/>Pencatatan Audit<br/>Log Login"))
    P1_5(("1.5<br/>Penerbitan Sesi<br/>& Hak Akses"))

    %% Aliran Data
    E1 -->|"NIP dan Password Plaintext"| P1_1
    P1_1 -->|"Kredensial Bersih (Sanitized)"| P1_2
    
    P1_2 -->|"Query: SELECT WHERE nip = $1"| D1
    D1 -->|"Data Record Pengguna (Termasuk passwordHash)"| P1_2
    
    %% Jika User Tidak Ada
    P1_2 -.->|"User Tidak Ditemukan (User ID = null)"| P1_4
    P1_2 -->|"Data Akun Ditemukan"| P1_3
    
    %% Verifikasi bcrypt
    P1_3 -->|"bcrypt.compare(inputPlain, passwordHash)"| P1_3
    P1_3 -.->|"Password Salah (status: 'FAILED')"| P1_4
    P1_3 -->|"Password Cocok (status: 'SUCCESS')"| P1_4
    P1_3 -->|"Kredensial Tervalidasi"| P1_5

    %% Pencatatan Log
    P1_4 -->|"INSERT INTO login_logs (userId, nip, status)"| D2
    P1_4 -.->|"Pesan Kesalahan: 'Username atau password salah'"| E1

    %% Sesi
    P1_5 -->|"Objek Sesi Aktif (id, nip, name, role)"| E1
```

---

## Rincian Sub-Proses

### 1.1 Validasi Format Kredensial Input
- **Deskripsi**: Memeriksa bahwa kolom NIP dan kata sandi tidak kosong serta memangkas spasi berlebih (*trimming*).
- **Logika**: Jika kosong, langsung memicu pesan peringatan form di antarmuka sebelum memanggil lapisan database.

### 1.2 Pencarian Pengguna Berdasarkan NIP
- **Deskripsi**: Mengambil data akun dari data store `D1: users` menggunakan parameter NIP (`SELECT id, nip, passwordHash, name, role, avatarPath FROM users WHERE nip = $1`).
- **Penanganan Khusus**: Jika NIP tidak ditemukan di database, alur langsung dialihkan ke proses pencatatan log dengan status `'FAILED'` dan menyajikan pesan generik demi alasan keamanan (tidak membocorkan apakah NIP atau kata sandinya yang salah).

### 1.3 Verifikasi Hash Kata Sandi (`bcrypt.compare`)
- **Deskripsi**: Membandingkan teks polos kata sandi input dengan hash bcrypt yang tersimpan di kolom `passwordHash` menggunakan fungsi asinkron `bcrypt.compare()`.
- **Hasil**: Menghasilkan nilai boolean `true` jika cocok, atau `false` jika tidak sesuai.

### 1.4 Pencatatan Audit Log Login (`logLogin`)
- **Deskripsi**: Menyimpan rekam jejak setiap usaha login ke data store `D2: login_logs` dengan kolom:
  - `userId`: ID pengguna (atau `null` jika NIP tidak terdaftar)
  - `nip`: NIP yang diinputkan
  - `status`: `'SUCCESS'` jika berhasil, `'FAILED'` jika gagal.

### 1.5 Penerbitan Sesi dan Hak Akses
- **Deskripsi**: Membangun objek sesi pengguna di memori React (`AuthContext`):
  ```typescript
  {
    id: user.id,
    nip: user.nip,
    name: user.name,
    email: user.email,
    role: user.role, // 'Super Admin' atau 'PETUGAS'
    avatarPath: user.avatarPath
  }
  ```
  Objek ini menentukan kontrol visibilitas menu navigasi dan otorisasi akses rute halaman.
