# 22 — Laporan dan Ekspor Data

---

## Gambaran Modul Laporan

Modul **Laporan** (`Laporan.tsx`) bertugas mengumpulkan, memfilter, mengagregasi, dan menyajikan data sirkulasi peminjaman serta pengembalian berkas rekam medis dalam bentuk laporan analitik resmi RSI Sultan Agung Semarang. Modul ini dilengkapi dengan fasilitas ekspor dokumen ke dua format standar: **Microsoft Excel (`.xlsx`)** dan **Adobe PDF (`.pdf`)**.

---

## Filter dan Pengambilan Data (`laporanService.ts`)

Fungsi `getLaporanData(filters: LaporanFilter): Promise<LaporanRow[]>` menyediakan data sirkulasi dengan parameter fleksibel:
- `filters.unit`: Filter berdasarkan nama unit/ruangan (misal: "ICU", "Mawar", atau "Semua").
- `filters.startDate` dan `filters.endDate`: Filter rentang tanggal peminjaman (`date(p.tanggalPinjam)`).
- `filters.status`: Filter status sirkulasi (`DIPINJAM`, `DIKEMBALIKAN`, `TERLAMBAT`, atau `Semua`).

### Logika Agregasi: `computeSummaryTables(data)`
Sebelum ditampilkan atau diekspor, data mentah diproses oleh fungsi analitik `computeSummaryTables(data)` menjadi 3 tabel rekapitulasi:
1. **Tabel 1: Rekapitulasi per Unit/Ruang (`tabelRuang` & `totalRuang`)**
   - Menghitung per unit ruangan: Jumlah Dipinjam, Jumlah Dikembalikan, Belum Dikembalikan, Tepat Waktu, Terlambat, serta persentasenya terhadap total keseluruhan.
2. **Tabel 2: Rekapitulasi Status Berkas (`tabelStatus`)**
   - Mengelompokkan berkas menjadi 3 status: Berkas telah dipinjam, Berkas telah dikembalikan, Berkas terlambat dikembalikan.
3. **Tabel 3: Ringkasan Rekapitulasi Berkas**
   - Ringkasan komparasi rasio peminjaman terhadap pengembalian dan persentase kepatuhan sirkulasi.

---

## Modul Ekspor Excel (`exportToExcel`)

Menggunakan pustaka **ExcelJS** (`^4.4.0`) untuk menghasilkan berkas `.xlsx` dengan standar tata letak formulir rumah sakit profesional.

### Karakteristik Format Excel:
- **Dialog Simpan File**: Memanggil `@tauri-apps/plugin-dialog` (`save()`) dengan nama berkas standar `Laporan_Rekam_Medis_YYYY-MM-DD.xlsx`.
- **Penulisan Berkas**: Mengonversi workbook ke buffer dan menulis ke disk via `@tauri-apps/plugin-fs` (`writeFile()`).
- **Metadata Dokumen**:
  - `creator`: `"RSISA Unit Rekam Medis"`
  - `lastModifiedBy`: Nama petugas login aktif
  - `created`: Waktu generasi dokumen
- **Tata Letak Halaman**:
  - Orientasi: Landscape, Ukuran Kertas: A4 (PaperSize 9), Fit to 1 Page Wide.
  - Tipografi: **Times New Roman** di seluruh sel laporan.
- **Elemen Dokumen**:
  1. Kop Laporan: "RUMAH SAKIT ISLAM SULTAN AGUNG", "SEMARANG", "UNIT REKAM MEDIS / FILING".
  2. Banner Judul: Berlatar kuning (`#FFFF00`) teks tebal.
  3. Baris Periode: Menampilkan rentang tanggal yang dipilih dalam format bahasa Indonesia.
  4. Tabel Rekapitulasi Ruangan: 13 Kolom (No, Unit, Jlh Pinjam, %, Jlh Kembali, %, Belum Kembali, %, Tepat Waktu, %, Terlambat, %, Keterangan) dengan header hijau gelap (`#056839`) teks putih dan baris total bergaris ganda (*double bottom border*).
  5. Bagian Rekapitulasi Status & Ringkasan disajikan berdampingan (*side-by-side*).
  6. Lembar Pengesahan: Tanda tangan mengetahui Kepala Unit Rekam Medis dan Petugas Pelapor (Petugas Filing aktif).

---

## Modul Ekspor PDF (`exportToPdf`)

Menggunakan pustaka **jsPDF** (`^4.2.1`) dikombinasikan dengan **jspdf-autotable** (`^5.0.8`) untuk menghasilkan dokumen cetak A4 portrait resmi.

### Karakteristik Format PDF:
- **Kop Surat Resmi**:
  - Logo Rumah Sakit: Dimuat asinkron via `loadLogoBase64()` dari `/logorsi.png` dan dirender di koordinat header kiri atas.
  - Alamat Kantor: `Jl. Kaligawe Raya No. 4 Semarang 50112`, nomor telepon, fax, dan tautan web resmi di sisi kanan atas.
  - Garis Pemisah Kop: Garis horizontal warna Emerald (`#047857`) ketebalan 0.8 mm.
- **Nomor Dokumen Berita Acara**:
  - Format penomoran otomatis: `042/BA-REKAMMED/RSISA/{TAHUN_BERJALAN}`.
- **Tabel Dinamis**:
  - Menggunakan `autoTable` dengan palet warna bernuansa institusi medis (latar header hijau lembut `#E6F4EA` dan teks hijau gelap `#145032`).
- **Lembar Penandatanganan (Signatures)**:
  - Menyertakan tanggal pembuatan di Semarang.
  - Slot tanda tangan Mengetahui/Menyetujui (Kepala Unit Rekam Medis) dan Petugas Pelapor (dilengkapi Nama dan NIP petugas yang sedang aktif login).
- **Footer**:
  - Penomoran halaman terpadu di bagian kanan bawah.

---

## Penanganan Error (`formatErrorMessage`)

Ekspor data mengimplementasikan utilitas `formatErrorMessage(err)` untuk mendeteksi berbagai varian kesalahan (kesalahan sistem operasi Windows, kegagalan I/O penulisan berkas karena izin folder, pembatalan dialog oleh pengguna, atau kesalahan runtime pustaka) dan menerjemahkannya ke dalam dialog toast pesan yang jelas dan informatif bagi pengguna.
