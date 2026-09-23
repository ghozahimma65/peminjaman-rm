import { useEffect, useState } from "react";
import { Icons } from "../../components/Icons";
import { LoadingState } from "../../components/ui/LoadingState";
import { getAllPeminjaman, PeminjamanRow } from "../../lib/database/peminjamanService";
import { RUANGAN_OPTIONS } from "../../constants";

export function DaftarPeminjaman({ onNavigate }: { onNavigate: (page: string, nomorRm?: string) => void }) {
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
    <div className="min-h-full space-y-4 pb-8 text-slate-800">
      <div className="flex items-center gap-2.5 px-1 pb-1">
        <Icons.Peminjaman />
        <h1 className="text-xl font-bold text-slate-900">Daftar Peminjaman</h1>
      </div>
      {errorMsg && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">{errorMsg}</div>}

      {/* Filter Card */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.06)]">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.3fr_1.1fr_1.1fr_1.5fr_auto] items-end">
          {/* 1. Asal Ruang */}
          <div className="flex flex-col">
            <label htmlFor="filter-ruang" className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Asal Ruang
            </label>
            <div className="relative">
              <select
                id="filter-ruang"
                value={roomFilter}
                onChange={event => {
                  setRoomFilter(event.target.value);
                  setPage(1);
                }}
                className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-8 text-xs font-medium text-slate-700 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="all">Semua Ruang</option>
                {RUANGAN_OPTIONS.map(room => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                <Icons.ChevronDown />
              </span>
            </div>
          </div>

          {/* 2. Status Berkas */}
          <div className="flex flex-col">
            <label htmlFor="filter-status" className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Status Berkas
            </label>
            <div className="relative">
              <select
                id="filter-status"
                value={statusFilter}
                onChange={event => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-8 text-xs font-medium text-slate-700 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="DIPINJAM">Aktif</option>
                <option value="TERLAMBAT">Jatuh Tempo</option>
                <option value="DIKEMBALIKAN">Kembali</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                <Icons.ChevronDown />
              </span>
            </div>
          </div>

          {/* 3. Rentang Tanggal */}
          <div className="flex flex-col">
            <label htmlFor="filter-date" className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Rentang Tanggal
            </label>
            <div className="relative">
              <select
                id="filter-date"
                value={dateFilter}
                onChange={event => {
                  setDateFilter(event.target.value);
                  setPage(1);
                }}
                className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-8 text-xs font-medium text-slate-700 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="all">Semua Waktu</option>
                <option value="today">Hari Ini</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                <Icons.ChevronDown />
              </span>
            </div>
          </div>

          {/* 4. Cari Pasien / No. RM */}
          <div className="flex flex-col">
            <label htmlFor="filter-search" className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Cari Pasien / No. RM
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Icons.Search />
              </span>
              <input
                id="filter-search"
                type="text"
                value={search}
                onChange={event => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Ketik No. RM atau Nama..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3.5 text-xs font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 5. Reset Button */}
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer shrink-0"
            >
              <Icons.Refresh />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,0.1)]">
        <div className="flex items-center justify-between px-5 py-4"><h2 className="text-sm font-bold">Daftar Permintaan Peminjaman Berkas RM</h2><span className="text-[10px] text-slate-500">Menampilkan {filteredData.length === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredData.length)} dari {filteredData.length} permintaan</span></div>
        <div className="overflow-x-auto"><table className="min-w-[950px] w-full text-left text-[10px]"><thead className="bg-slate-50 text-[9px] uppercase text-slate-500"><tr><th className="px-4 py-3">No</th><th className="px-3 py-3">No Rekam Medis</th><th className="px-3 py-3">Nama Pasien</th><th className="px-3 py-3">Asal Ruang</th><th className="px-3 py-3">Peminjam</th><th className="px-3 py-3">Tanggal Pinjam</th><th className="px-3 py-3">Keperluan</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleRows.length === 0 ? <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Tidak ada data yang sesuai filter.</td></tr> : visibleRows.map((row, index) => <tr key={row.id} className="h-12 hover:bg-slate-50"><td className="px-4 text-slate-500">{(page - 1) * pageSize + index + 1}</td><td className="px-3 font-bold text-sky-600">{row.nomorRm}</td><td className="px-3 font-semibold">{row.namaPasien}</td><td className="px-3"><span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-semibold">{row.unit}</span></td><td className="px-3"><span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-semibold">{row.peminjamName || row.peminjamId}</span></td><td className="px-3 text-slate-500">{new Date(row.tanggalPinjam).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</td><td className="max-w-[150px] truncate px-3">{row.catatan || "-"}</td><td className="px-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${statusClass(row.status)}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{statusText(row.status)}</span></td><td className="px-3"><button type="button" onClick={() => (row.status === "DIPINJAM" || row.status === "TERLAMBAT") ? onNavigate("proses-pengembalian", row.nomorRm) : undefined} disabled={row.status === "DIKEMBALIKAN"} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[9px] font-semibold ${row.status === "DIKEMBALIKAN" ? "cursor-not-allowed bg-slate-100 text-slate-500" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>{row.status === "DIKEMBALIKAN" ? "▣ Selesai" : "✓ Konfirmasi"}</button></td></tr>)}</tbody></table></div>
        <div className="flex items-center justify-between px-5 py-4 text-[10px] text-slate-500"><span>Halaman {page} dari {pageCount} (Total {filteredData.length} data)</span><div className="flex gap-1"><button type="button" disabled={page === 1} onClick={() => setPage(current => current - 1)} className="rounded border border-slate-200 px-3 py-1.5 disabled:text-slate-300">Sebelumnya</button>{Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 3).map(item => <button type="button" key={item} onClick={() => setPage(item)} className={`rounded border px-3 py-1.5 ${page === item ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200"}`}>{item}</button>)}<button type="button" disabled={page === pageCount} onClick={() => setPage(current => current + 1)} className="rounded border border-slate-200 px-3 py-1.5 disabled:text-slate-300">Selanjutnya</button></div></div>
      </section>
    </div>
  );
}