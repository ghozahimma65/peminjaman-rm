# Tanya Jawab: Pertanyaan Koding & Pemrograman (Coding Questions)

---

### Q1: Mengapa menggunakan TypeScript dibanding JavaScript murni?
**Jawaban**:
> *"TypeScript memberikan **Type Safety (keamanan tipe data)** saat kompilasi (*compile-time*). Dalam aplikasi medis dengan model data kompleks (seperti `PeminjamanRow`, `LaporanFilter`, `RiwayatTransaksiRow`), TypeScript mencegah bug umum seperti kesalahan penulisan nama properti (*typo*), akses properti `undefined`, atau ketidakcocokan tipe parameter sebelum kode sempat dijalankan di lingkungan produksi."*

---

### Q2: Bagaimana cara kerja pola desain Singleton pada modul database (`getDb`)?
**Jawaban**:
> *"Fungsi `getDb()` pada `src/lib/database/index.ts` menerapkan pola **Singleton Pattern**:
> ```typescript
> let dbInstance: Database | null = null;
> export async function getDb(): Promise<Database> {
>   if (!dbInstance) {
>     dbInstance = await Database.load(DB_PATH);
>   }
>   return dbInstance;
> }
> ```
> Singleton memastikan bahwa aplikasi hanya membuka tepat satu koneksi fisik ke file SQLite. Hal ini menghemat konsumsi memori dan mencegah konflik *database file locking* antar service."*

---

### Q3: Bagaimana komunikasi antara antarmuka React dengan backend Rust berjalan di Tauri?
**Jawaban**:
> *"Tauri menggunakan mekanisme **Inter-Process Communication (IPC)** berbasis pesan asinkron yang sangat cepat. Saat frontend React memanggil `db.select()` atau `db.execute()`, perintah tersebut dikirim melalui jembatan IPC native ke thread Rust yang mengeksekusi kueri langsung terhadap mesin SQLite C-library, lalu mengembalikan hasilnya kembali ke React sebagai Promise JavaScript."*

---

### Q4: Bagaimana strategi penanganan error (*Error Handling*) diterapkan pada lapisan service?
**Jawaban**:
> *"Setiap operasi kritis dibungkus dalam blok `try...catch` yang terstruktur:
> 1. Galat teknis tingkat rendah (seperti `UNIQUE constraint failed`) diterjemahkan menjadi pesan kontekstual bahasa Indonesia yang ramah pengguna.
> 2. Pada operasi multi-tahap (seperti pengembalian berkas), blok `catch` secara otomatis memicu prosedur rollback manual untuk mengembalikan status data ke kondisi semula.
> 3. Terdapat utilitas `formatErrorMessage()` di `exportService.ts` yang mampu mengurai berbagai tipe objek galat menjadi string pesan yang bersih untuk dialog toast."*

---

### Q5: Bagaimana cara menjaga performa antarmuka agar tidak terjadi lag saat menampilkan ribuan baris riwayat rekam medis?
**Jawaban**:
> *"Sistem menerapkan dua strategi utama:
> 1. **Pagination di UI**: Pada `RiwayatRm.tsx`, data dibatasi 10 baris per halaman sehingga DOM browser hanya merender 10 elemen baris tabel dalam satu waktu.
> 2. **Pencarian Real-Time Dinamis**: Kueri pencarian memanfaatkan filtering parameter SQL `LIKE` langsung pada mesin SQLite yang telah terindeks, sehingga proses pemfilteran data tidak membebani memori CPU browser."*
