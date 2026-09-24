import { useCallback, useEffect, useState } from "react";
import { Icons } from "../../components/Icons";
import { LoadingState } from "../../components/ui/LoadingState";
import { Modal } from "../../components/ui/Modal";
import { RUANGAN_OPTIONS } from "../../constants";
import {
  deletePengembalian,
  getPengembalianHistory,
  PengembalianHistoryRow,
  updatePengembalianKondisi,
} from "../../lib/database/pengembalianService";
import { isOverdue } from "../../lib/statusHelper";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("id-ID");
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRangeDates(range: string) {
  if (range === "all") return { start: "", end: "" };
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (range === "7" ? 6 : range === "30" ? 29 : 0));
  return { start: formatDateInput(start), end: formatDateInput(end) };
}

export function DaftarPengembalian() {
  const [data, setData] = useState<PengembalianHistoryRow[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [unit, setUnit] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selected, setSelected] = useState<PengembalianHistoryRow | null>(null);
  const [editCondition, setEditCondition] = useState<"BAIK" | "RUSAK">("BAIK");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const rangeDates = getRangeDates(dateRange);
      const history = await getPengembalianHistory({ tanggalMulai: startDate || rangeDates.start || undefined, tanggalAkhir: endDate || rangeDates.end || undefined, unit: unit || undefined });
      setData(history);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Data pengembalian gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, unit, dateRange]);

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, [loadData]);
  const filteredData = data.filter(row => {
    const matchesSearch = `${row.nomorRm} ${row.namaPasien}`.toLowerCase().includes(search.toLowerCase());
    const late = isOverdue(row.tanggalBerkasKeluar, row.tanggalPinjam, row.tanggalBerkasKembali);
    return matchesSearch && (status === "all" || (status === "late" ? late : !late));
  });

  const reset = () => { setStartDate(""); setEndDate(""); setUnit(""); setDateRange("all"); setStatus("all"); setSearch(""); };

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
    if (!selected || isDeleting) return;
    setIsDeleting(true);
    setErrorMsg("");
    try {
      await deletePengembalian(selected.id);
      setShowDelete(false);
      setSelected(null);
      await loadData();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Data pengembalian gagal dihapus.");
      setShowDelete(false);
      await loadData();
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <LoadingState message="Memuat daftar pengembalian..." />;

  return (
    <div className="min-h-full space-y-3 pb-8 text-slate-800">
      <div className="px-1"><h1 className="text-xl font-bold text-slate-900">Daftar Pengembalian</h1><p className="mt-1 text-xs text-slate-500">Daftar rekam medis yang telah selesai dikembalikan.</p></div>
      {errorMsg && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{errorMsg}</div>}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.08)]"><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1.2fr_1.1fr_1.1fr_auto]">
        <label className="text-[10px] font-semibold uppercase text-slate-600">Tanggal Kembali<div className="mt-1 flex gap-2"><input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} className="h-9 min-w-0 w-full rounded-md border border-slate-300 px-2 text-[10px]" /><input type="date" value={endDate} onChange={event => setEndDate(event.target.value)} className="h-9 min-w-0 w-full rounded-md border border-slate-300 px-2 text-[10px]" /></div></label>
        <label className="text-[10px] font-semibold uppercase text-slate-600">Status<select value={status} onChange={event => setStatus(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs font-normal normal-case"><option value="all">Semua Status</option><option value="returned">Dikembalikan</option><option value="late">Terlambat</option></select></label>
        <label className="text-[10px] font-semibold uppercase text-slate-600">Pencarian<div className="relative mt-1"><span className="absolute left-2 top-2"><Icons.Search /></span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Ketik No. RM" className="h-9 w-full rounded-md border border-slate-300 pl-8 pr-3 text-xs font-normal normal-case outline-none focus:border-emerald-600" /></div></label>
        <label className="text-[10px] font-semibold uppercase text-slate-600">Asal Ruang<select value={unit} onChange={event => setUnit(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs font-normal normal-case"><option value="">Semua Ruang</option>{RUANGAN_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="text-[10px] font-semibold uppercase text-slate-600">Rentang Data<select value={dateRange} onChange={event => { setDateRange(event.target.value); setStartDate(""); setEndDate(""); }} className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs font-normal normal-case"><option value="today">Hari Ini</option><option value="7">7 Hari Terakhir</option><option value="30">30 Hari Terakhir</option><option value="all">Semua Data</option></select></label>
        <button type="button" onClick={reset} className="mt-[17px] flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-300 px-4 text-xs font-semibold hover:bg-slate-50 cursor-pointer"><Icons.Refresh /> Reset</button>
      </div></section>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,0.08)]"><div className="flex items-center justify-between px-5 py-4"><h2 className="text-sm font-bold">Daftar Pengembalian</h2><span className="text-[10px] text-slate-500">Menampilkan {filteredData.length === 0 ? 0 : 1} - {filteredData.length} dari {filteredData.length} data</span></div><div className="overflow-x-auto"><table className="min-w-[1300px] w-full text-left text-[10px]"><thead className="bg-slate-50 text-[9px] uppercase text-slate-500"><tr><th className="px-4 py-3">No.</th><th className="px-4 py-3">Nomor</th><th className="px-3 py-3">Nama Pasien</th><th className="px-3 py-3">Asal Ruang</th><th className="px-3 py-3">Peminjam</th><th className="px-3 py-3">Tanggal Pinjam</th><th className="px-3 py-3">Tanggal Kembali</th><th className="px-3 py-3">Kondisi Berkas</th><th className="px-3 py-3">Catatan / Keperluan Peminjaman</th><th className="px-3 py-3">Catatan Pengembalian</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredData.length === 0 ? <tr><td colSpan={12} className="px-5 py-10 text-center text-slate-400">Belum ada data pengembalian.</td></tr> : filteredData.map((row, index) => { const late = isOverdue(row.tanggalBerkasKeluar, row.tanggalPinjam, row.tanggalBerkasKembali); return <tr key={row.id} className="h-14 hover:bg-slate-50"><td className="px-4">{index + 1}</td><td className="px-4 font-semibold text-emerald-700">{row.nomorRm}</td><td className="px-3">{row.namaPasien}</td><td className="px-3">{row.unit}</td><td className="px-3">{row.peminjamName}</td><td className="px-3">{formatDate(row.tanggalPinjam)}</td><td className="px-3">{formatDate(row.tanggalBerkasKembali)}</td><td className="px-3"><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${row.kondisiBerkas === "RUSAK" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{row.kondisiBerkas === "RUSAK" ? "Tidak Lengkap" : "Lengkap"}</span></td><td className="px-3" title={row.catatan || "-"}>{row.catatan || "-"}</td><td className="px-3" title={row.catatanPengembalian || "-"}>{row.catatanPengembalian || "-"}</td><td className="px-3"><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${late ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{late ? "Terlambat" : "Dikembalikan"}</span></td><td className="px-3"><div className="flex items-center gap-1.5"><button type="button" title="Edit kondisi" disabled={isDeleting} onClick={() => { setSelected(row); setEditCondition(row.kondisiBerkas || "BAIK"); setShowEdit(true); }} className="flex h-7 w-7 items-center justify-center rounded-md border border-yellow-200 bg-yellow-100 text-yellow-700 transition hover:bg-yellow-200 cursor-pointer disabled:opacity-50"><Icons.Edit /></button><button type="button" title="Hapus" disabled={isDeleting} onClick={() => { setSelected(row); setShowDelete(true); }} className="flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-red-100 text-red-600 transition hover:bg-red-200 cursor-pointer disabled:opacity-50"><Icons.Trash /></button></div></td></tr>; })}</tbody></table></div><div className="flex items-center justify-between px-5 py-4 text-[10px] text-slate-500"><span>Total {filteredData.length} data</span><span>Halaman 1</span></div></section>
      <Modal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        onConfirm={() => void saveCondition()}
        title="Edit Data"
        confirmText="Ya"
        cancelText="Tidak"
        variant="edit"
        description={
          <div className="space-y-3">
            <p className="text-center text-slate-500">Apakah Anda Yakin Untuk Mengedit Data ini?</p>
            <label className="block text-left text-xs font-semibold text-slate-700">
              Kondisi Berkas
              <select
                value={editCondition}
                onChange={event => setEditCondition(event.target.value as "BAIK" | "RUSAK")}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3"
              >
                <option value="BAIK">Lengkap</option>
                <option value="RUSAK">Tidak Lengkap</option>
              </select>
            </label>
          </div>
        }
      />
      <Modal
        isOpen={showDelete}
        onClose={() => !isDeleting && setShowDelete(false)}
        onConfirm={() => void removeReturn()}
        isLoading={isDeleting}
        isDanger={true}
        title="Hapus Data"
        confirmText="Ya"
        cancelText="Tidak"
        variant="delete"
        description="Apakah Anda Yakin Ingin Menghapus Data Ini?"
      />
    </div>
  );
}