# 11 — Pengolahan Data Laporan Rekapitulasi (`laporanService.ts`)

---

- **FILE**: `src/lib/database/laporanService.ts`
- **FUNCTION/COMPONENT**: `getLaporanData(filters)`, `computeSummaryTables(data)`

---

## TUJUAN
Mengumpulkan dataset sirkulasi peminjaman dan pengembalian berdasarkan kriteria filter (rentang tanggal, unit ruangan, dan status), serta mengagregasikannya menjadi 3 struktur tabel rekapitulasi analitik (Tabel Ruangan, Tabel Status Berkas, dan Ringkasan) untuk tampilan UI dan ekspor.

---

## ALUR
1. **`getLaporanData`**:
   - Membangun kueri dinamis dengan klausa `WHERE 1=1`.
   - Menambahkan filter unit jika `filters.unit !== 'Semua'`.
   - Menambahkan filter tanggal dengan fungsi `date(p.tanggalPinjam) >= date($start)` dan `<= date($end)`.
   - Melakukan mapping kalkulasi status efektif `calculateEffectiveStatus()`.
   - Memfilter hasil berdasarkan status jika `filters.status !== 'Semua'`.
2. **`computeSummaryTables`**:
   - Mengiterasi seluruh baris transaksi dan mengelompokkannya ke dalam `Map<string, RoomStat>` berdasarkan nama unit/ruangan.
   - Menghitung akumulator untuk setiap ruangan: `dipinjam`, `dikembalikan`, `belumDikembalikan`, `tepatWaktu`, dan `terlambat`.
   - Membangun baris total agregasi keseluruhan (`totalRuang`).
   - Menyusun tabel status berkas (3 kategori pokok: telah dipinjam, telah dikembalikan, dan terlambat).

---

## INPUT / PROSES / OUTPUT
- **INPUT**:
  - `filters`: Objek filter `{ unit?, status?, startDate?, endDate? }`
- **PROSES**:
  - Parameterized SQLite query building
  - In-memory grouping via Javascript Map
  - Perhitungan rasio dan persentase
- **OUTPUT**:
  - Objek rekapitulasi: `{ tabelRuang, totalRuang, tabelStatus, totalStatusCount }`

---

## KENAPA PENTING
Laporan berkala merupakan dokumen pertanggungjawaban legal unit rekam medis kepada manajemen rumah sakit. Fungsi ini mengotomatiskan komputasi statistik kepatuhan pengembalian berkas yang sebelumnya harus dihitung manual menggunakan kalkulator atau spreadsheet secara terpisah.

---

## KEMUNGKINAN DITANYA PENGUJI
> *"Kenapa filtering status dilakukan di Javascript (`mapped.filter`) dan bukan langsung di klausa `WHERE` SQL?"*

---

## JAWABAN REKOMENDASI
> *"Karena status transaksi bersifat dinamis (`calculateEffectiveStatus`). Status suatu berkas (apakah tepat waktu atau terlambat) ditentukan oleh perbandingan timestamp terhadap deadline 48 jam yang dievaluasi secara dinamis saat komputasi berlangsung. Oleh sebab itu, pemfilteran status dilakukan setelah status efektif selesai dihitung pada layer service."*

---

## KODE TERKAIT

```typescript
export function computeSummaryTables(data: LaporanRow[]) {
  const roomMap = new Map<string, {
    dipinjam: number;
    dikembalikan: number;
    belumDikembalikan: number;
    tepatWaktu: number;
    terlambat: number;
  }>();

  for (const row of data) {
    const room = row.unit || "Lainnya";
    if (!roomMap.has(room)) {
      roomMap.set(room, { dipinjam: 0, dikembalikan: 0, belumDikembalikan: 0, tepatWaktu: 0, terlambat: 0 });
    }
    const stat = roomMap.get(room)!;
    stat.dipinjam += 1;
    if (row.status === "DIKEMBALIKAN") {
      stat.dikembalikan += 1;
      stat.tepatWaktu += 1;
    } else if (row.status === "TERLAMBAT") {
      if (row.tanggalBerkasKembali) {
        stat.dikembalikan += 1;
      } else {
        stat.belumDikembalikan += 1;
      }
      stat.terlambat += 1;
    } else {
      stat.belumDikembalikan += 1;
      stat.tepatWaktu += 1;
    }
  }

  const tabelRuang: TabelRekapitulasiRuang[] = Array.from(roomMap.entries()).map(([unit, stat], idx) => ({
    no: idx + 1,
    unit,
    jumlahDipinjam: stat.dipinjam,
    jumlahDikembalikan: stat.dikembalikan,
    belumDikembalikan: stat.belumDikembalikan,
    tepatWaktu: stat.tepatWaktu,
    terlambat: stat.terlambat,
    keterangan: "-"
  }));

  // ... (perhitungan totalRuang dan tabelStatus)
  return { tabelRuang, totalRuang, tabelStatus, totalStatusCount };
}
```
