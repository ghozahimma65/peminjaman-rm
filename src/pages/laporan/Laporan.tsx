import { useEffect, useState } from "react";
import { Icons } from "../../components/Icons";
import { Modal } from "../../components/ui/Modal";
import { LaporanFilter, LaporanRow, getDistinctUnits, getLaporanData } from "../../lib/database/laporanService";
import { exportToExcel, exportToPdf } from "../../lib/exportService";

type ExportFormat = "excel" | "pdf";
const initialFilters: LaporanFilter = { unit: "Semua", status: "Semua", startDate: "", endDate: "" };

async function fetchReport(filters: LaporanFilter) {
  return getLaporanData(filters);
}

export function Laporan() {
  const [units, setUnits] = useState<string[]>([]);
  const [filters, setFilters] = useState<LaporanFilter>(initialFilters);
  const [data, setData] = useState<LaporanRow[]>([]);
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [includeBorrowing, setIncludeBorrowing] = useState(true);
  const [includeReturn, setIncludeReturn] = useState(true);
  const [includeLate, setIncludeLate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    void getDistinctUnits().then(result => setUnits(result)).catch(err => setErrorMsg((err as Error).message));
    void fetchReport(initialFilters).then(setData).catch(err => setErrorMsg((err as Error).message));
  }, []);

  async function loadReport() {
    setIsLoading(true);
    setErrorMsg("");
    try {
      setData(await fetchReport(filters));
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Data laporan gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }

  const changeFilter = (key: keyof LaporanFilter, value: string) => setFilters(current => ({ ...current, [key]: value }));

  const handleExport = async () => {
    setShowExportConfirm(false);
    setIsExporting(true);
    try {
      const exported = format === "pdf" ? await exportToPdf(selectedData, filters) : await exportToExcel(selectedData);
      if (exported) {
        setShowSuccess(true);
        window.setTimeout(() => setShowSuccess(false), 4000);
      }
    } catch (err: unknown) {
      setErrorMsg(`Gagal export ${format.toUpperCase()}: ${(err as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const setQuickRange = (range: "30" | "month" | "90" | "365") => {
    const end = new Date();
    const start = new Date();
    if (range === "month") start.setDate(1);
    else start.setDate(end.getDate() - Number(range));
    setFilters(current => ({ ...current, startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) }));
  };

  const inputClass = "mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700";
  const selectedData = data.filter(row => {
    const isReturned = row.status === "DIKEMBALIKAN";
    const isLate = row.status === "TERLAMBAT";
    const matchesComponent = (includeBorrowing && !isReturned) || (includeReturn && isReturned);
    return matchesComponent && (includeLate || !isLate);
  });

  return (
    <div className="relative min-h-full space-y-4 pb-8 text-slate-800">
      <div className="px-1"><h1 className="text-xl font-bold text-slate-900">Laporan</h1><p className="mt-1 text-xs text-slate-500">Buat dan unduh laporan rekapitulasi peminjaman serta pengembalian.</p></div>
      {errorMsg && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{errorMsg}</div>}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.08)]"><h2 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Parameter Penyaringan Data</h2><label className="mt-4 block text-[10px] font-semibold text-slate-600">Ruang<select value={filters.unit} onChange={event => changeFilter("unit", event.target.value)} className={inputClass}><option value="Semua">Semua Ruang</option>{units.map(unit => <option key={unit} value={unit}>{unit}</option>)}</select></label></section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.08)]"><h2 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Rentang Tanggal Laporan</h2><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="text-[10px] font-semibold text-slate-600">Dari Tanggal<input type="date" value={filters.startDate} onChange={event => changeFilter("startDate", event.target.value)} className={inputClass} /></label><label className="text-[10px] font-semibold text-slate-600">Sampai Tanggal<input type="date" value={filters.endDate} onChange={event => changeFilter("endDate", event.target.value)} className={inputClass} /></label></div><p className="mt-4 text-[10px] text-slate-500">Pilih Cepat Rentang Waktu (Preset):</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => setQuickRange("30")} className="rounded-md bg-emerald-600 px-3 py-2 text-[10px] font-semibold text-white">30 Hari Terakhir</button><button type="button" onClick={() => setQuickRange("month")} className="rounded-md bg-slate-100 px-3 py-2 text-[10px] text-slate-600">Bulan Ini</button><button type="button" onClick={() => setQuickRange("90")} className="rounded-md bg-slate-100 px-3 py-2 text-[10px] text-slate-600">3 Bulan Terakhir</button><button type="button" onClick={() => setQuickRange("365")} className="rounded-md bg-slate-100 px-3 py-2 text-[10px] text-slate-600">1 Tahun Terakhir</button></div></section>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.08)]"><h2 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Komponen Data</h2><div className="mt-4 space-y-2"><label className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-2 text-[10px]"><input type="checkbox" checked={includeBorrowing} onChange={event => setIncludeBorrowing(event.target.checked)} className="accent-emerald-700" />Data Transaksi Peminjaman</label><label className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-2 text-[10px]"><input type="checkbox" checked={includeReturn} onChange={event => setIncludeReturn(event.target.checked)} className="accent-emerald-700" />Data Transaksi Pengembalian</label><label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[10px]"><input type="checkbox" checked={includeLate} onChange={event => setIncludeLate(event.target.checked)} className="accent-emerald-700" />Catatan Keterlambatan Berkas</label></div><div className="mt-7 flex gap-2"><button type="button" onClick={() => { setIncludeBorrowing(true); setIncludeReturn(true); setIncludeLate(true); }} className="rounded-md bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-700">Pilih Semua</button><button type="button" onClick={() => { setIncludeBorrowing(false); setIncludeReturn(false); setIncludeLate(false); }} className="rounded-md bg-slate-100 px-3 py-2 text-[10px] text-slate-600">Reset Pilihan</button></div></section><section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.08)]"><h2 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Format Unduhan File</h2><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setFormat("excel")} className={`rounded-xl border p-4 text-center ${format === "excel" ? "border-emerald-600 bg-emerald-50" : "border-slate-200"}`}><span className="text-xl text-emerald-700">▣</span><strong className="mt-2 block text-[10px]">Microsoft Excel</strong><span className="text-[9px] text-slate-400">(.xlsx)</span></button><button type="button" onClick={() => setFormat("pdf")} className={`rounded-xl border p-4 text-center ${format === "pdf" ? "border-emerald-600 bg-emerald-50" : "border-slate-200"}`}><span className="text-xl text-red-600">▣</span><strong className="mt-2 block text-[10px]">Format PDF</strong><span className="text-[9px] text-slate-400">(.pdf)</span></button></div><button type="button" onClick={() => void loadReport()} disabled={isLoading} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 text-xs font-bold text-white hover:bg-emerald-900 disabled:opacity-60"><Icons.Search />{isLoading ? "Memuat Data..." : "Terapkan Filter"}</button></section></div>
        </div>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-[0_2px_5px_rgba(15,23,42,0.08)]"><div className="flex items-center justify-between bg-slate-800 px-4 py-3 text-white"><h2 className="text-[10px] font-bold uppercase">Preview Laporan Cetak (A4)</h2><span className="rounded bg-slate-700 px-3 py-2 text-[10px]">{format.toUpperCase()}</span></div><div className="flex min-h-[610px] justify-center overflow-auto p-5"><div className="min-h-[580px] w-full max-w-[420px] bg-white p-5 text-[7px] text-slate-700 shadow-lg"><div className="border-b-2 border-emerald-800 pb-2 text-center"><strong className="text-[12px] text-emerald-900">RUMAH SAKIT ISLAM SULTAN AGUNG</strong><p>SEMARANG</p><p className="mt-2 bg-yellow-300 font-bold">LAPORAN PEMINJAMAN DAN PENGEMBALIAN REKAM MEDIS</p><p>Periode: {filters.startDate || "-"} s/d {filters.endDate || "-"}</p></div><h3 className="mt-4 font-bold">1. REKAPITULASI PEMINJAMAN DAN PENGEMBALIAN</h3><table className="mt-2 w-full border-collapse text-center"><thead className="bg-emerald-800 text-white"><tr><th className="border p-1">No</th><th className="border p-1">Unit/Ruang</th><th className="border p-1">Jumlah</th><th className="border p-1">Status</th></tr></thead><tbody>{selectedData.slice(0, 8).map((row, index) => <tr key={row.id}><td className="border p-1">{index + 1}</td><td className="border p-1 text-left">{row.unit}</td><td className="border p-1">1</td><td className="border p-1">{row.status}</td></tr>)}{selectedData.length === 0 && <tr><td colSpan={4} className="border p-4">Belum ada data. Terapkan filter untuk melihat preview.</td></tr>}</tbody></table><h3 className="mt-5 font-bold">2. REKAPITULASI STATUS BERKAS</h3><table className="mt-2 w-full border-collapse"><tbody><tr><td className="border p-1">Berkas telah dipinjam</td><td className="border p-1 text-right">{selectedData.length}</td></tr><tr><td className="border p-1">Berkas telah dikembalikan</td><td className="border p-1 text-right">{selectedData.filter(row => row.status === "DIKEMBALIKAN").length}</td></tr><tr><td className="border p-1">Berkas terlambat dikembalikan</td><td className="border p-1 text-right">{selectedData.filter(row => row.status === "TERLAMBAT").length}</td></tr></tbody></table><p className="mt-8 text-center">Demikian laporan ini dibuat untuk digunakan sebagaimana mestinya.</p><div className="mt-10 flex justify-between text-center"><span>Mengetahui/Menyetujui<br /><br />________________</span><span>Petugas Pelapor<br /><br />________________</span></div></div></div><div className="border-t border-slate-200 p-4"><button type="button" onClick={() => setShowExportConfirm(true)} disabled={isExporting || selectedData.length === 0} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 text-xs font-bold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50">⇩ Unduh Laporan & Ekspor Data</button></div></section>
      </div>
      {showSuccess && <div className="fixed right-5 top-20 z-[1001] w-80 rounded-xl border border-emerald-200 bg-white p-4 shadow-xl"><strong className="text-xs text-slate-800">Berkas Berhasil Diekspor!</strong><p className="mt-1 text-[10px] text-slate-500">Laporan.{format} telah selesai dibuat dan siap digunakan.</p></div>}
      <Modal isOpen={showExportConfirm} onClose={() => setShowExportConfirm(false)} onConfirm={() => void handleExport()} title="Unduh Laporan" confirmText="Ya" cancelText="Tidak" description={<p className="text-center text-sm text-slate-600">Apakah Anda yakin untuk mengunduh berkas laporan ini?</p>} />
    </div>
  );
}