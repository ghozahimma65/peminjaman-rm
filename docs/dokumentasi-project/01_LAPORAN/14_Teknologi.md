# 14 — Teknologi yang Digunakan

Semua versi diambil langsung dari `package.json`.

---

## Framework Utama

### Tauri 2.x
- **Apa itu**: Framework untuk membangun aplikasi desktop menggunakan teknologi web
- **Mengapa**: Lebih ringan dari Electron karena menggunakan WebView OS (tidak bundle browser)
- **CLI**: `@tauri-apps/cli ^2`
- **API**: `@tauri-apps/api ^2`
- **Bahasa backend**: Rust (dikompilasi menjadi `.exe` native)

### React 19.x
- **Apa itu**: Library JavaScript untuk membangun user interface
- **Versi**: `react ^19.1.0`, `react-dom ^19.1.0`
- **Mengapa**: Komponen reusable, state management yang mudah

---

## Bahasa Pemrograman

### TypeScript 5.8.x
- **Apa itu**: JavaScript dengan sistem tipe statis
- **Versi**: `typescript ~5.8.3`
- **Mengapa**: Menangkap error saat compile-time, bukan runtime

---

## Build & Development Tools

| Tool | Versi | Peran |
|------|-------|-------|
| Vite | `^7.0.4` | Build tool + dev server (localhost:1420) |
| ESLint | `^10.10.0` | Linter kode |
| TypeScript ESLint | `^8.70.0` | TypeScript-specific lint rules |
| Autoprefixer | `^10.6.1` | CSS vendor prefixes otomatis |
| PostCSS | `^8.5.28` | CSS preprocessor |

---

## Styling

### Tailwind CSS 4.x
- **Versi**: `tailwindcss ^4.3.3`
- **Plugin Vite**: `@tailwindcss/vite ^4.3.3`
- **Mengapa**: Utility-first CSS, tidak perlu menulis CSS manual untuk komponen

---

## Database

### SQLite via @tauri-apps/plugin-sql
- **Versi plugin**: `@tauri-apps/plugin-sql ^2.4.1`
- **File database**: `rekam_medis.db` (lokal)
- **Koneksi**: `sqlite:rekam_medis.db`
- **Query**: Raw SQL dengan parameterized queries (`$1`, `$2`, dll.)
- **Mengapa SQLite**: Embedded, tidak perlu server database terpisah, cocok untuk desktop offline

---

## Keamanan

### bcryptjs 3.0.x
- **Versi**: `bcryptjs ^3.0.3`
- **Type definitions**: `@types/bcryptjs ^3.0.0`
- **Digunakan untuk**: Hash password saat register, verifikasi saat login
- **Cost factor**: 10 (dari source code: `bcrypt.hash(password, 10)`)
- **Mengapa bcrypt**: Algoritma hash satu arah yang dirancang khusus untuk password (lambat sengaja, salt otomatis)

---

## Export / Reporting

### ExcelJS 4.4.x
- **Versi**: `exceljs ^4.4.0`
- **Digunakan untuk**: Ekspor laporan rekapitulasi ke format `.xlsx`
- **Fitur yang dipakai**: Worksheet, cell styling, merge, border, font, fill, number format

### jsPDF 4.2.x + jspdf-autotable 5.0.x
- **Versi**: `jspdf ^4.2.1`, `jspdf-autotable ^5.0.8`
- **Digunakan untuk**: Ekspor laporan ke format `.pdf`
- **Fitur yang dipakai**: Portrait A4, text, line, autoTable (tabel otomatis), image (logo)

### xlsx 0.18.x
- **Versi**: `xlsx ^0.18.5`
- **Catatan**: Library ini ada di `dependencies` tapi tidak terlihat digunakan di `exportService.ts` (yang menggunakan ExcelJS). **[PERLU KONFIRMASI]** apakah digunakan di tempat lain.

---

## Plugin Tauri Tambahan

| Plugin | Versi | Fungsi |
|--------|-------|--------|
| `@tauri-apps/plugin-dialog` | `^2.7.3` | Dialog "Save File" (untuk pilih lokasi export) |
| `@tauri-apps/plugin-fs` | `^2.5.2` | `writeFile()` untuk menyimpan file export |
| `@tauri-apps/plugin-opener` | `^2` | Membuka file/URL eksternal |
| `@tauri-apps/plugin-store` | `^2.4.5` | Penyimpanan session ke `session.bin` |

---

## Font

Font yang digunakan di aplikasi: **Plus Jakarta Sans** (terlihat dari output build yang
menyertakan file `.ttf`: `PlusJakartaSans-Regular`, `Bold`, `Medium`, `SemiBold`).

Font di laporan Excel: **Times New Roman** (hardcoded di `exportService.ts`).

---

## Struktur Project

```
rekam-medis-desktop/
├── src/                    ← Source code frontend (React/TypeScript)
│   ├── pages/              ← Halaman-halaman aplikasi
│   ├── components/         ← Komponen UI reusable
│   ├── context/            ← React Context (AuthContext)
│   ├── lib/                ← Logic layer (services, helpers)
│   ├── types/              ← TypeScript type definitions
│   ├── constants.ts        ← Konstanta aplikasi (menu, ruangan)
│   ├── App.tsx             ← Root component + routing
│   └── main.tsx            ← Entry point
├── src-tauri/              ← Source code backend Rust
│   ├── src/                ← Rust main.rs
│   ├── tauri.conf.json     ← Konfigurasi Tauri
│   └── Cargo.toml          ← Rust dependencies
├── public/                 ← Asset statis (logo, background)
├── dist/                   ← Output build frontend
├── package.json            ← Node.js dependencies
└── vite.config.ts          ← Konfigurasi Vite
```
