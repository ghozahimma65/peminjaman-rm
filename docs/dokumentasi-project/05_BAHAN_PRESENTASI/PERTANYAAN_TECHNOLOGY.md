# Tanya Jawab: Pertanyaan Teknologi & Toolchain (Technology Questions)

---

### Q1: Mengapa memilih Tauri v2 daripada Electron untuk pengembangan desktop?
**Jawaban**:
> *"Terdapat 3 keunggulan mutlak Tauri v2 dibanding Electron:
> 1. **Ukuran Bundel Sangat Kecil**: Electron menyertakan seluruh runtime Chromium dan Node.js sehingga ukuran installer mencapai > 120 MB. Tauri memanfaatkan webview bawaan sistem operasi (WebView2 di Windows) dan backend Rust berbobot ringan, menghasilkan installer hanya sekitar 10–20 MB.
> 2. **Konsumsi RAM Sangat Hemat**: Aplikasi Electron membutuhkan 200–400 MB RAM saat idle. Aplikasi Tauri hanya mengonsumsi 50–80 MB RAM, sehingga sangat ramah untuk komputer loket rumah sakit dengan RAM terbatas.
> 3. **Keamanan & Kecepatan Rust**: Lapisan logika sistem native ditulis dalam bahasa Rust yang terkenal dengan keamanan memori (*memory safety*) dan kecepatan tinggi."*

---

### Q2: Mengapa menggunakan React 19 dan Vite 7 daripada Next.js atau Create React App (CRA)?
**Jawaban**:
> *"1. **Next.js** dirancang terutama untuk aplikasi web berbasis Server-Side Rendering (SSR). Dalam arsitektur desktop Tauri, aplikasi berjalan secara Single-Page Application (SPA) lokal tanpa memerlukan server Node.js.
> 2. **Create React App (CRA)** sudah usang (*deprecated*) dan lambat.
> 3. **Vite 7** menawarkan Hot Module Replacement (HMR) berkecepatan tinggi berbasis ESM dan kompilasi produksi yang sangat optimal untuk bundel desktop lokal."*

---

### Q3: Mengapa menggunakan pustaka ExcelJS daripada SheetJS (xlsx)?
**Jawaban**:
> *"Pustaka **ExcelJS** mendukung pengaturan gaya visual formulir tingkat lanjut (*cell styling*) secara gratis dan lengkap: pengaturan jenis font (**Times New Roman**), warna latar sel (kuning dan hijau instansi), format persentase otomatis, garis batas sel ganda (*double bottom border*), dan orientasi cetak halaman A4 Landscape. Sedangkan SheetJS versi gratis (Community Edition) membatasi fitur-fitur manipulasi visual sel tersebut."*

---

### Q4: Mengapa menggunakan jsPDF dan jspdf-autotable untuk dokumen PDF?
**Jawaban**:
> *"Kombinasi **jsPDF** dan plugin **jspdf-autotable** memungkinkan pembentukan dokumen cetak A4 secara presisi milimeter. Sistem dapat menyematkan logo rumah sakit resolusi tinggi melalui format base64, menyusun kop surat resmi dengan garis batas Emerald, membagi teks panjang secara otomatis (*word wrapping*), serta membuat tabel rekapitulasi dinamis lengkap dengan penomoran halaman dan blok tanda tangan resmi."*

---

### Q5: Bagaimana proses pembuatan installer Windows (.msi dan .exe) dilakukan?
**Jawaban**:
> *"Melalui perintah:
> ```bash
> pnpm tauri build
> ```
> Toolchain Tauri mengompilasi bundel frontend Vite menjadi aset statis, mengompilasi kode Rust di `src-tauri` menjadi file biner native Windows (`rekam-medis-desktop.exe`), lalu memanfaatkan WiX Toolset dan NSIS untuk memproduksi paket installer Windows formal berupa berkas `.msi` dan `nsis-setup.exe` di folder `src-tauri/target/release/bundle/`."*
