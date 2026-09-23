# Dokumentasi Data Flow Diagram (DFD) Sistem Filing Rekam Medis

---

## Pendahuluan

Dokumentasi ini menyajikan pemodelan terstruktur **Data Flow Diagram (DFD)** untuk aplikasi **Filing Rekam Medis** di RSI Sultan Agung Semarang. DFD digunakan secara khusus untuk menggambarkan bagaimana data mengalir dari entitas luar (*external entity*), diproses oleh proses sistem, disimpan dalam repositori data (*data store*), hingga menghasilkan output kembali ke entitas luar.

> [!IMPORTANT]
> **Prinsip Pemisahan DFD dan ERD**:
> Dokumen ini berfokus murni pada **aliran data dan transformasi proses** (*behavioral view*), bukan representasi fisik struktur tabel database. Pemodelan struktur tabel dan relasi entitas fisik dibahas tersendiri pada direktori `03_ERD/`.

---

## Daftar Berkas DFD

| Berkas | Tingkat Pemodelan | Cakupan Aliran Data |
|---|---|---|
| [`DFD_Level_0.md`](./DFD_Level_0.md) | DFD Level 0 (Context Diagram) | Batasan sistem global, entitas eksternal, dan pertukaran data utama |
| [`DFD_Level_1.md`](./DFD_Level_1.md) | DFD Level 1 | Dekomposisi 7 proses utama sistem dan data store terkait |
| [`DFD_Level_2_Login.md`](./DFD_Level_2_Login.md) | DFD Level 2 — Proses 1.0 | Alur rinci verifikasi kredensial, hashing, logging, dan sesi pengguna |
| [`DFD_Level_2_Peminjaman.md`](./DFD_Level_2_Peminjaman.md) | DFD Level 2 — Proses 3.0 | Validasi ketersediaan berkas fisik, input formulir, dan pencatatan |
| [`DFD_Level_2_Pengembalian.md`](./DFD_Level_2_Pengembalian.md) | DFD Level 2 — Proses 4.0 | Pencarian pinjaman aktif, input kondisi berkas, kalkulasi waktu, & rollback |
| [`DFD_Level_2_Laporan.md`](./DFD_Level_2_Laporan.md) | DFD Level 2 — Proses 6.0 | Filter parameter, kalkulasi rekapitulasi, generasi file Excel & PDF |

---

## Notasi dan Konvensi Pemodelan

Dokumentasi ini mengadopsi notasi standar DFD (Gane & Sarson / DeMarco Yourdon):
1. **Entitas Eksternal (External Entity)**: Sumber input atau tujuan akhir informasi di luar batasan langsung proses.
   - `Petugas Rekam Medis`: Petugas operasional di unit filing.
   - `Super Admin`: Administrator sistem rekam medis.
   - `File System (OS)`: Media penyimpanan lokal komputer pengguna untuk file ekspor Excel, PDF, dan foto avatar.
2. **Proses (Process)**: Transformasi data yang mengubah input menjadi output. Ditandai dengan penomoran berjenjang (misal: `1.0`, `1.1`, `3.2`).
3. **Penyimpanan Data (Data Store)**: Repositori data logis:
   - `D1: users` (Penyimpanan akun pengguna & hak akses)
   - `D2: login_logs` (Penyimpanan riwayat log audit masuk)
   - `D3: data_rm` (Master identitas berkas rekam medis & pasien)
   - `D4: peminjaman` (Pencatatan sirkulasi peminjaman berkas)
   - `D5: pengembalian` (Pencatatan konfirmasi fisik kembali berkas)
   - `D6: notifications` (Penyimpanan antrean pesan peringatan dini)
4. **Aliran Data (Data Flow)**: Panah berarah yang merepresentasikan paket data spesifik yang bergerak di antara entitas, proses, dan data store.
