import { useEffect, useState } from "react";
import { Icons } from "../../components/Icons";
import { LoadingState } from "../../components/ui/LoadingState";
import { getAllPeminjaman, PeminjamanRow } from "../../lib/database/peminjamanService";

export function DaftarPeminjaman({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [data, setData] = useState<PeminjamanRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    async function loadData() {
      try {
        setData(await getAllPeminjaman());
      } catch (err: unknown) {
        setErrorMsg((err as Error).message || "Data peminjaman gagal dimuat.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
    const reloadOnFocus = () => { void loadData(); };
    window.addEventListener("focus", reloadOnFocus);
    return () => window.removeEventListener("focus", reloadOnFocus);
  }, []);

  const rooms = Array.from(new Set(data.map(row => row.unit).filter(Boolean)));
  const filteredData = data.filter(row => {
    const searchMatch = `${row.nomorRm} ${row.namaPasien}`.toLowerCase().includes(search.toLowerCase());
    const roomMatch = roomFilter === "all" || row.unit === roomFilter;
    const statusMatch = statusFilter === "all" || row.status === statusFilter;
    const dateMatch = dateFilter !== "today" || new Date(row.tanggalPinjam).toDateString() === new Date().toDateString();
    return searchMatch && roomMatch && statusMatch && dateMatch;
  });
  const pageCount = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const visibleRows = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const resetFilters = () => {
    setRoomFilter("all");
    setStatusFilter("all");
    setDateFilter("all");
    setSearch("");
    setPage(1);
  };

  const statusText = (status: PeminjamanRow["status"]) => status === "DIPINJAM" ? "Aktif" : status === "TERLAMBAT" ? "Jatuh Tempo" : "Kembali";
  const statusClass = (status: PeminjamanRow["status"]) => status === "DIPINJAM" ? "bg-emerald-100 text-emerald-700" : status === "TERLAMBAT" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700";

  if (isLoading) return <LoadingState message="Memuat daftar peminjaman..." />;

  return (
    <div className="min-h-full space-y-3 pb-8 text-slate-800">
      <div className="flex items-center gap-2 px-1 py-2 text-[11px] text-slate-500"><span>Peminjaman</span><span>›</span><strong className="text-emerald-700">Daftar Peminjaman</strong></div>
      <div className="flex items-center gap-2 px-1 pb-2"><Icons.Peminjaman /><h1 className="text-lg font-bold text-slate-900">Daftar Peminjaman</h1></div>
      {errorMsg && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{errorMsg}</div>}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.1)]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.1fr_1.1fr_auto]">
          <label className="text-[10px] font-semibold uppercase text-slate-500">Asal Ruang<select value={roomFilter} onChange={event => { setRoomFilter(event.target.value); setPage(1); }} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-normal normal-case text-slate-700 outline-none focus:border-emerald-600"><option value="all">Semua Ruang</option>{rooms.map(room => <option key={room} value={room}>{room}</option>)}</select></label>
          <label className="text-[10px] font-semibold uppercase text-slate-500">Status Berkas<select value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1); }} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-normal normal-case text-slate-700 outline-none focus:border-emerald-600"><option value="all">Semua Status</option><option value="DIPINJAM">Aktif</option><option value="TERLAMBAT">Jatuh Tempo</option><option value="DIKEMBALIKAN">Kembali</option></select></label>
          <label className="text-[10px] font-semibold uppercase text-slate-500">Rentang Tanggal<select value={dateFilter} onChange={event => { setDateFilter(event.target.value); setPage(1); }} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-normal normal-case text-slate-700 outline-none focus:border-emerald-600"><option value="all">Semua Waktu</option><option value="today">Hari Ini</option></select></label>
          <label className="text-[10px] font-semibold uppercase text-slate-500">Cari Pasien / No. RM<div className="relative mt-1"><Icons.Search /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Ketik No. RM" className="h-9 w-full rounded-md border border-slate-200 pl-8 pr-3 text-xs font-normal normal-case outline-none placeholder:text-slate-400 focus:border-emerald-600" /></div></label>
          <button type="button" onClick={resetFilters} className="mt-[17px] flex h-9 items-center justify-center gap-1 rounded-md border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"><span>↻</span>Reset</button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,0.1)]">
        <div className="flex items-center justify-between px-5 py-4"><h2 className="text-sm font-bold">Daftar Permintaan Peminjaman Berkas RM</h2><span className="text-[10px] text-slate-500">Menampilkan {filteredData.length === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredData.length)} dari {filteredData.length} permintaan</span></div>
        <div className="overflow-x-auto"><table className="min-w-[950px] w-full text-left text-[10px]"><thead className="bg-slate-50 text-[9px] uppercase text-slate-500"><tr><th className="px-4 py-3">No</th><th className="px-3 py-3">No Rekam Medis</th><th className="px-3 py-3">Nama Pasien</th><th className="px-3 py-3">Asal Ruang</th><th className="px-3 py-3">Peminjam</th><th className="px-3 py-3">Tanggal Pinjam</th><th className="px-3 py-3">Keperluan</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleRows.length === 0 ? <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Tidak ada data yang sesuai filter.</td></tr> : visibleRows.map((row, index) => <tr key={row.id} className="h-12 hover:bg-slate-50"><td className="px-4 text-slate-500">{(page - 1) * pageSize + index + 1}</td><td className="px-3 font-bold text-sky-600">{row.nomorRm}</td><td className="px-3 font-semibold">{row.namaPasien}</td><td className="px-3"><span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-semibold">{row.unit}</span></td><td className="px-3"><span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-semibold">{row.peminjamName || row.peminjamId}</span></td><td className="px-3 text-slate-500">{new Date(row.tanggalPinjam).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</td><td className="max-w-[150px] truncate px-3">{row.catatan || "-"}</td><td className="px-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${statusClass(row.status)}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{statusText(row.status)}</span></td><td className="px-3"><button type="button" onClick={() => row.status === "DIPINJAM" || row.status === "TERLAMBAT" ? onNavigate("proses-pengembalian") : undefined} disabled={row.status === "DIKEMBALIKAN"} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[9px] font-semibold ${row.status === "DIKEMBALIKAN" ? "cursor-not-allowed bg-slate-100 text-slate-500" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>{row.status === "DIKEMBALIKAN" ? "▣ Selesai" : "✓ Konfirmasi"}</button></td></tr>)}</tbody></table></div>
        <div className="flex items-center justify-between px-5 py-4 text-[10px] text-slate-500"><span>Halaman {page} dari {pageCount} (Total {filteredData.length} data)</span><div className="flex gap-1"><button type="button" disabled={page === 1} onClick={() => setPage(current => current - 1)} className="rounded border border-slate-200 px-3 py-1.5 disabled:text-slate-300">Sebelumnya</button>{Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 3).map(item => <button type="button" key={item} onClick={() => setPage(item)} className={`rounded border px-3 py-1.5 ${page === item ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200"}`}>{item}</button>)}<button type="button" disabled={page === pageCount} onClick={() => setPage(current => current + 1)} className="rounded border border-slate-200 px-3 py-1.5 disabled:text-slate-300">Selanjutnya</button></div></div>
      </section>
    </div>
  );
}