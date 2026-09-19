import { useCallback, useEffect, useState } from "react";
import { Icons } from "../../components/Icons";
import { LoadingState } from "../../components/ui/LoadingState";
import { Modal } from "../../components/ui/Modal";
import {
  deletePengembalian,
  getPengembalianHistory,
  getUniqueUnitsFromPengembalian,
  PengembalianHistoryRow,
  updatePengembalianKondisi,
} from "../../lib/database/pengembalianService";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("id-ID");
}

export function DaftarPengembalian() {
  const [data, setData] = useState<PengembalianHistoryRow[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [unit, setUnit] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selected, setSelected] = useState<PengembalianHistoryRow | null>(null);
  const [editCondition, setEditCondition] = useState<"BAIK" | "RUSAK">("BAIK");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [history, availableUnits] = await Promise.all([
        getPengembalianHistory({ tanggalMulai: startDate || undefined, tanggalAkhir: endDate || undefined, unit: unit || undefined }),
        getUniqueUnitsFromPengembalian(),
      ]);
      setData(history);
      setUnits(availableUnits);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Data pengembalian gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, unit]);

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, [loadData]);

  const filteredData = data.filter(row => {
    const matchesSearch = `${row.nomorRm} ${row.namaPasien}`.toLowerCase().includes(search.toLowerCase());
    const late = new Date(row.tanggalBerkasKembali) > new Date(row.tanggalBerkasKeluar || row.tanggalPinjam);
    return matchesSearch && (status === "all" || (status === "late" ? late : !late));
  });

  const reset = () => { setStartDate(""); setEndDate(""); setUnit(""); setStatus("all"); setSearch(""); };

  const saveCondition = async () => {
    if (!selected) return;
    try {
      await updatePengembalianKondisi(selected.id, editCondition);
      setShowEdit(false);
      await loadData();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Kondisi berkas gagal diperbarui.");
    }
  };

  const removeReturn = async () => {
    if (!selected) return;
    try {
      await deletePengembalian(selected.id);
      setShowDelete(false);
      setSelected(null);
      await loadData();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Data pengembalian gagal dihapus.");
      setShowDelete(false);
    }
  };

  if (isLoading) return <LoadingState message="Memuat daftar pengembalian..." />;

  return (
    <div className="min-h-full space-y-3 pb-8 text-slate-800">
      <div className="flex items-center gap-2 px-1 py-2 text-[10px] text-slate-500"><span>Pengembalian</span><span>›</span><strong className="text-emerald-700">Daftar Pengembalian</strong></div>
      <div className="px-1"><h1 className="text-xl font-bold text-slate-900">Daftar Pengembalian</h1><p className="mt-1 text-xs text-slate-500">Daftar rekam medis yang telah selesai dikembalikan.</p></div>
      {errorMsg && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{errorMsg}</div>}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.08)]"><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1.4fr_1.1fr_auto]">
        <label className="text-[10px] font-semibold uppercase text-slate-600">Tanggal Kembali<div className="mt-1 flex gap-2"><input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} className="h-9 min-w-0 w-full rounded-md border border-slate-300 px-2 text-[10px]" /><input type="date" value={endDate} onChange={event => setEndDate(event.target.value)} className="h-9 min-w-0 w-full rounded-md border border-slate-300 px-2 text-[10px]" /></div></label>
        <label className="text-[10px] font-semibold uppercase text-slate-600">Status<select value={status} onChange={event => setStatus(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs font-normal normal-case"><option value="all">Semua Status</option><option value="returned">Dikembalikan</option><option value="late">Terlambat</option></select></label>
        <label className="text-[10px] font-semibold uppercase text-slate-600">Pencarian<div className="relative mt-1"><span className="absolute left-2 top-2"><Icons.Search /></span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Ketik No. RM" className="h-9 w-full rounded-md border border-slate-300 pl-8 pr-3 text-xs font-normal normal-case outline-none focus:border-emerald-600" /></div></label>
        <label className="text-[10px] font-semibold uppercase text-slate-600">Ruang<select value={unit} onChange={event => setUnit(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs font-normal normal-case"><option value="">Semua Ruang</option>{units.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
        <button type="button" onClick={reset} className="mt-[17px] flex h-9 items-center justify-center gap-1 rounded-md border border-slate-300 px-4 text-xs font-semibold hover:bg-slate-50">↻ Reset</button>
      </div></section>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,0.08)]"><div className="flex items-center justify-between px-5 py-4"><h2 className="text-sm font-bold">Daftar Pengembalian</h2><span className="text-[10px] text-slate-500">Menampilkan {filteredData.length === 0 ? 0 : 1} - {filteredData.length} dari {filteredData.length} data</span></div><div className="overflow-x-auto"><table className="min-w-[850px] w-full text-left text-[10px]"><thead className="bg-slate-50 text-[9px] uppercase text-slate-500"><tr><th className="px-5 py-3">No. RM</th><th className="px-3 py-3">Nama Pasien</th><th className="px-3 py-3">Peminjam</th><th className="px-3 py-3">Tgl Kembali</th><th className="px-3 py-3">Kondisi Berkas</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredData.length === 0 ? <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Belum ada data pengembalian.</td></tr> : filteredData.map(row => { const late = new Date(row.tanggalBerkasKembali) > new Date(row.tanggalBerkasKeluar || row.tanggalPinjam); return <tr key={row.id} className="h-14 hover:bg-slate-50"><td className="px-5 font-semibold text-emerald-700">{row.nomorRm}</td><td className="px-3">{row.namaPasien}</td><td className="px-3">{row.peminjamName}</td><td className="px-3">{formatDate(row.tanggalBerkasKembali)}</td><td className="px-3"><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${row.kondisiBerkas === "RUSAK" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{row.kondisiBerkas === "RUSAK" ? "Rusak" : "Baik"}</span></td><td className="px-3"><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${late ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{late ? "Terlambat" : "Dikembalikan"}</span></td><td className="px-3"><div className="flex gap-1"><button type="button" title="Edit kondisi" onClick={() => { setSelected(row); setEditCondition(row.kondisiBerkas || "BAIK"); setShowEdit(true); }} className="flex h-7 w-7 items-center justify-center rounded bg-yellow-400 text-white">✎</button><button type="button" title="Hapus" onClick={() => { setSelected(row); setShowDelete(true); }} className="flex h-7 w-7 items-center justify-center rounded bg-red-600 text-white">▣</button></div></td></tr>; })}</tbody></table></div><div className="flex items-center justify-between px-5 py-4 text-[10px] text-slate-500"><span>Total {filteredData.length} data</span><span>Halaman 1</span></div></section>
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} onConfirm={() => void saveCondition()} title="Edit Data" confirmText="Ya" cancelText="Tidak" description={<label className="block text-left text-sm text-slate-600">Kondisi Berkas<select value={editCondition} onChange={event => setEditCondition(event.target.value as "BAIK" | "RUSAK")} className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3"><option value="BAIK">Baik</option><option value="RUSAK">Rusak</option></select></label>} />
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={() => void removeReturn()} title="Hapus Data" confirmText="Ya" cancelText="Tidak" isDanger description={<p>Apakah Anda yakin ingin menghapus data pengembalian ini?</p>} />
    </div>
  );
}