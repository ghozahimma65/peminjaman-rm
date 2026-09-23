# Daftar Konfirmasi Kebutuhan & Asumsi Teknis (Need Confirmation)

---

## Gambaran Umum

Berdasarkan audit menyeluruh terhadap kode sumber aktual (*source code audit*) pada repositori proyek per tanggal **23 September 2026**, seluruh fakta teknis telah diverifikasi langsung dari berkas konfigurasi, skema database, dan logika komponen. 

Namun demikian, terdapat beberapa aspek non-kode atau kebijakan manajerial rumah sakit yang **`[PERLU KONFIRMASI]`** lebih lanjut dengan pihak manajemen RSI Sultan Agung Semarang atau dosen pembimbing/penguji.

---

## Daftar Butir Konfirmasi

| No | Topik / Aspek | Kondisi Aktual pada Repositori Kode | Hal yang Perlu Dikonfirmasi ke Pengguna / Penguji |
|---|---|---|---|
| 1 | **Framework Unit Testing Otomatis** | Tidak ditemukan skrip pengujian otomatis formal (seperti Vitest atau Jest) pada `package.json`. Pengujian runtime dilakukan via modul internal `smokeTest.ts` serta uji tipe data TypeScript (`tsc --noEmit`). | Apakah penguji/institusi mewajibkan adanya berkas suite unit test formal (Vitest/Jest) dalam laporan, ataukah pengujian asap (*smoke test*) dan build verification sudah dianggap mencukupi? |
| 2 | **Dokumen User Acceptance Testing (UAT)** | Berkas laporan UAT resmi yang ditandatangani oleh kepala unit rekam medis tidak tersimpan dalam repositori git. | Apakah lembar pengujian penerimaan pengguna (UAT) akan dilampirkan sebagai dokumen fisik terpisah dalam berkas laporan skripsi/proyek? |
| 3 | **Integrasi Basis Data SIMRS Utama** | Saat ini aplikasi berjalan mandiri (*standalone*) dengan basis data lokal SQLite `rekam_medis.db`. Pendaftaran data pasien dilakukan lewat form Master Data RM atau seed data awal. | Apakah di masa mendatang master data pasien akan diimpor secara berkala via API/CSV dari SIMRS utama RSISA, atau tetap diinputkan langsung oleh petugas filing? |
| 4 | **Pemberian Sanksi Berkas Terlambat** | Sistem saat ini menandai berkas dengan status `'TERLAMBAT'`, memunculkan notifikasi peringatan, dan merekapitulasi persentasenya di laporan. | Apakah rumah sakit memiliki Standar Operasional Prosedur (SOP) spesifik terkait denda/sanksi administratif untuk ruangan yang terlambat mengembalikan berkas $> 48$ jam? |
| 5 | **Skema Penggunaan Multi-Komputer Loket** | Database SQLite tersimpan di path lokal pengguna komputer (`AppData/Local`). | Jika rumah sakit hendak mengoperasikan aplikasi ini di beberapa komputer loket filing secara bersamaan, apakah akan menggunakan model folder jaringan (*shared network storage*) atau migrasi koneksi ke server PostgreSQL terpusat? |
| 6 | **Kebijakan Pemusnahan / Retensi Arsip RM** | Sistem belum memiliki modul pemusnahan berkas inaktif (misalnya berkas yang tidak pernah dikunjungi selama lebih dari 5 tahun sesuai Permenkes). | Apakah siklus pemusnahan berkas fisik (*record retention schedule*) masuk ke dalam batasan masalah proyek ini atau diserahkan ke prosedur manual rumah sakit? |
