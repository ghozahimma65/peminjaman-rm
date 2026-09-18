import { useEffect, useState } from "react";
import { Icons } from "../components/Icons";
import { SessionUser } from "../lib/auth/authService";
import { getAllPeminjaman, PeminjamanRow } from "../lib/database/peminjamanService";
import { getPengembalianHistory, PengembalianHistoryRow } from "../lib/database/pengembalianService";

interface DashboardProps {
  user: SessionUser;
  onNavigate: (page: string) => void;
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function statusLabel(status: PeminjamanRow["status"]) {
  if (status === "DIKEMBALIKAN") return "Kembali";
  if (status === "TERLAMBAT") return "Terlambat";
  return "Aktif";
}

function StatusBadge({ status }: { status: PeminjamanRow["status"] }) {
  const style = status === "DIKEMBALIKAN" ? "bg-indigo-100 text-indigo-700" : status === "TERLAMBAT" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${style}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{statusLabel(status)}</span>;
}

function TableCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,0.12)]"><div className="flex items-center gap-2 border-b border-slate-100 px-5 py-5"><Icons.Peminjaman /><h2 className="text-sm font-semibold text-slate-800">{title}</h2></div><div className="overflow-x-auto">{children}</div></section>;
}

function TableHead() {
  return <thead className="bg-slate-50 text-[9px] font-semibold uppercase tracking-wide text-slate-500"><tr><th className="w-[13%] px-5 py-3">No. RM</th><th className="w-[17%] px-3 py-3">Nama Pasien</th><th className="w-[17%] px-3 py-3">Peminjam</th><th className="w-[15%] px-3 py-3">Ruang Tujuan</th><th className="w-[14%] px-3 py-3">Tgl Pinjam</th><th className="w-[14%] px-3 py-3">Jatuh Tempo</th><th className="w-[10%] px-3 py-3">Status</th></tr></thead>;
}

function BorrowingTable({ rows }: { rows: PeminjamanRow[] }) {
  return <table className="min-w-[760px] w-full table-fixed text-left text-[11px] text-slate-700"><TableHead /><tbody className="divide-y divide-slate-100">{rows.length === 0 ? <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Belum ada data peminjaman.</td></tr> : rows.map(row => <tr key={row.id} className="h-16 hover:bg-slate-50/70"><td className="px-5 font-semibold text-sky-600">{row.nomorRm}</td><td className="px-3">{row.namaPasien}</td><td className="px-3">{row.peminjamName || row.peminjamId}</td><td className="px-3">{row.unit}</td><td className="px-3">{formatDate(row.tanggalPinjam)}</td><td className="px-3">-</td><td className="px-3"><StatusBadge status={row.status} /></td></tr>)}</tbody></table>;
}

function ReturnTable({ rows }: { rows: PengembalianHistoryRow[] }) {
  return <table className="min-w-[760px] w-full table-fixed text-left text-[11px] text-slate-700"><TableHead /><tbody className="divide-y divide-slate-100">{rows.length === 0 ? <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Belum ada data pengembalian.</td></tr> : rows.map(row => <tr key={row.id} className="h-16 hover:bg-slate-50/70"><td className="px-5 font-semibold text-sky-600">{row.nomorRm}</td><td className="px-3">{row.namaPasien}</td><td className="px-3">{row.peminjamName}</td><td className="px-3">{row.unit}</td><td className="px-3">{formatDate(row.tanggalPinjam)}</td><td className="px-3">-</td><td className="px-3"><StatusBadge status="DIKEMBALIKAN" /></td></tr>)}</tbody></table>;
}

export function Dashboard({ user, onNavigate }: DashboardProps) {
  const [borrowings, setBorrowings] = useState<PeminjamanRow[]>([]);
  const [returns, setReturns] = useState<PengembalianHistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const [borrowingResult, returnResult] = await Promise.allSettled([getAllPeminjaman(), getPengembalianHistory()]);

      if (borrowingResult.status === "rejected") {
        setError((borrowingResult.reason as Error)?.message || "Data dashboard gagal dimuat.");
        setIsLoading(false);
        return;
      }

      const borrowingRows = borrowingResult.value;
      setBorrowings(borrowingRows);

      const fallbackReturns: PengembalianHistoryRow[] = borrowingRows
        .filter(row => row.status === "DIKEMBALIKAN")
        .map(row => ({
          id: row.id || 0,
          peminjamanId: row.id || 0,
          tanggalBerkasKembali: row.updatedAt || row.tanggalPinjam,
          dikembalikanOlehId: row.peminjamId,
          konfirmasiKembali: true,
          kondisiBerkas: "BAIK",
          nomorRm: row.nomorRm,
          namaPasien: row.namaPasien,
          tanggalPinjam: row.tanggalPinjam,
          tanggalBerkasKeluar: row.tanggalBerkasKeluar || null,
          unit: row.unit,
          jilid: row.jilid || null,
          status: "DIKEMBALIKAN",
          peminjamName: row.peminjamName || String(row.peminjamId),
          dikembalikanOlehName: row.peminjamName || String(row.peminjamId),
        }));

      if (returnResult.status === "fulfilled") {
        setReturns(returnResult.value.length > 0 ? returnResult.value : fallbackReturns);
      } else {
        setError((returnResult.reason as Error)?.message || "Riwayat pengembalian gagal dimuat.");
        setReturns(fallbackReturns);
      }

      setIsLoading(false);
    }
    void loadDashboard();
  }, []);

  const activeCount = borrowings.filter(row => row.status === "DIPINJAM").length;
  const lateCount = borrowings.filter(row => row.status === "TERLAMBAT").length;
  const statCard = "flex min-h-[100px] items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 shadow-[0_2px_5px_rgba(15,23,42,0.12)]";

  return <div className="min-h-full space-y-5 bg-slate-50/40 pb-8">
    <label htmlFor="dashboard-search" className="sr-only">Cari peminjaman atau nama pasien</label>
    <input id="dashboard-search" type="search" placeholder="Cari No. Peminjaman / Nama Pasien" className="h-9 w-full rounded-md border border-slate-300 bg-white px-4 text-[10px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600" />
    {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,1fr))_140px_140px]">
      <div className={statCard}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Icons.Peminjaman /></span><div><strong className="block text-xl leading-none text-slate-800">{isLoading ? "-" : activeCount}</strong><span className="mt-2 block text-[11px] font-semibold text-slate-800">Peminjaman Aktif</span><span className="text-[10px] text-slate-500">Sedang dipinjam</span></div></div>
      <div className={statCard}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600"><span className="text-xl">◷</span></span><div><strong className="block text-xl leading-none text-slate-800">0</strong><span className="mt-2 block text-[11px] font-semibold text-slate-800">Jatuh Tempo</span><span className="text-[10px] text-slate-500">Segera konfirmasi pengembalian</span></div></div>
      <div className={statCard}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"><span className="text-xl font-bold">!</span></span><div><strong className="block text-xl leading-none text-slate-800">{isLoading ? "-" : lateCount}</strong><span className="mt-2 block text-[11px] font-semibold text-slate-800">Terlambat</span><span className="text-[10px] text-slate-500">Belum dikembalikan</span></div></div>
      <button type="button" onClick={() => onNavigate("peminjaman-baru")} className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[11px] font-semibold text-slate-800 shadow-[0_2px_5px_rgba(15,23,42,0.12)] transition hover:border-emerald-300 hover:bg-emerald-50"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700"><Icons.Peminjaman /></span>Ajukan<br />Peminjaman</button>
      <button type="button" onClick={() => onNavigate("proses-pengembalian")} className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[11px] font-semibold text-slate-800 shadow-[0_2px_5px_rgba(15,23,42,0.12)] transition hover:border-amber-300 hover:bg-amber-50"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-700"><Icons.Pengembalian /></span>Konfirmasi<br />Pengembalian</button>
    </div>
    <TableCard title="Peminjaman Terbaru"><BorrowingTable rows={borrowings.slice(0, 2)} /></TableCard>
    <TableCard title="Pengembalian Terbaru"><ReturnTable rows={returns.slice(0, 2)} /></TableCard>
    <p className="text-right text-[11px] text-slate-500">Login sebagai {user.name}</p>
  </div>;
}