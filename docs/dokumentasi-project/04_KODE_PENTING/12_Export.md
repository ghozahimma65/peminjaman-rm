# 12 — Ekspor Dokumen Resmi Excel dan PDF (`exportService.ts`)

---

- **FILE**: `src/lib/exportService.ts`
- **FUNCTION/COMPONENT**: `exportToExcel()`, `exportToPdf()`, `formatErrorMessage()`

---

## TUJUAN
Menyusun dokumen laporan resmi bertanda tangan dalam format Microsoft Excel (`.xlsx`) dan Adobe PDF (`.pdf`) berstandar formulir rumah sakit, menampilkan dialog penyimpanan berkas lokal Windows, dan menuliskan buffer biner ke sistem berkas desktop via Tauri API.

---

## ALUR
1. **Dialog Penyimpanan**: Memanggil `save()` dari `@tauri-apps/plugin-dialog` untuk memungkinkan pengguna memilih lokasi folder dan nama file target di komputernya.
2. Jika pengguna membatalkan dialog, fungsi mengembalikan nilai `false`.
3. Mengambil ringkasan rekapitulasi data menggunakan `computeSummaryTables(data)`.
4. **Alur Excel (`exportToExcel`)**:
   - Inisialisasi `new ExcelJS.Workbook()` dengan metadata instansi.
   - Mengatur halaman: Orientasi *Landscape*, ukuran *A4*, font *Times New Roman*.
   - Menyusun 13 kolom rekapitulasi ruangan, format persentase, batas garis (*borders*), baris total ganda (*double bottom border*), dan lembar tanda tangan.
   - Mengonversi workbook ke buffer dan menulis ke disk via `writeFile()`.
5. **Alur PDF (`exportToPdf`)**:
   - Inisialisasi `new jsPDF("portrait", "mm", "a4")`.
   - Merender kop surat resmi (logo rumah sakit dari base64, alamat, garis pemisah hijau).
   - Menambahkan nomor dokumen berita acara resmi.
   - Merender tabel rekapitulasi menggunakan `autoTable` dari `jspdf-autotable`.
   - Merender slot tanda tangan Kepala Unit dan Petugas Pelapor.
   - Mengonversi dokumen ke array buffer dan menulis ke disk via `writeFile()`.

---

## INPUT / PROSES / OUTPUT
- **INPUT**:
  - `data: LaporanRow[]` (Dataset sirkulasi tervalidasi)
  - `filters: LaporanFilter` (Periode tanggal dan unit)
  - `officerInfo?: { name: string; nip: string }` (Identitas petugas pelapor)
- **PROSES**:
  - Konstruksi tata letak visual dokumen
  - Encoding biner data
  - Penulisan berkas I/O sistem operasi
- **OUTPUT**:
  - `Promise<boolean>`: `true` jika berkas berhasil ditulis ke disk, `false` jika dialog dibatalkan.

---

## KENAPA PENTING
Memberikan output fisik yang dapat dicetak, diarsipkan, atau diserahkan langsung kepada pimpinan rumah sakit sebagai bukti legal kepatuhan pengelolaan dokumen rekam medis.

---

## KEMUNGKINAN DITANYA PENGUJI
> *"Bagaimana cara aplikasi Tauri menyimpan file langsung ke sistem operasi tanpa memicu dialog download browser bawaan?"*

---

## JAWABAN REKOMENDASI
> *"Aplikasi ini menggunakan kombinasi dua plugin native Tauri: `@tauri-apps/plugin-dialog` untuk menampilkan jendela native File Explorer Windows (`save()`), dan `@tauri-apps/plugin-fs` (`writeFile()`) yang berkomunikasi langsung dengan backend Rust untuk menuliskan byte array ke hard disk lokal secara aman."*

---

## KODE TERKAIT

```typescript
export async function exportToExcel(
  data: LaporanRow[],
  filters: LaporanFilter = {},
  officerInfo?: { name: string; nip: string }
): Promise<boolean> {
  const filePath = await save({
    filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
    defaultPath: `Laporan_Rekam_Medis_${new Date().toISOString().slice(0, 10)}.xlsx`,
  });

  if (!filePath) return false;

  const { tabelRuang, totalRuang } = computeSummaryTables(data);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RSISA Unit Rekam Medis";
  
  const worksheet = workbook.addWorksheet("Laporan Rekapitulasi", {
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  // Konstruksi sel kop, tabel 13 kolom, dan tanda tangan ...
  
  const buffer = await workbook.xlsx.writeBuffer();
  await writeFile(filePath, new Uint8Array(buffer));
  return true;
}
```
