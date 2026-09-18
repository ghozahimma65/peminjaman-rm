import { useEffect, useState } from "react";
import { Icons } from "../../components/Icons";
import { LoadingState } from "../../components/ui/LoadingState";
import { Modal } from "../../components/ui/Modal";
import { getRiwayatByRm, RiwayatRmResult, RiwayatTransaksiRow } from "../../lib/database/riwayatRmService";

function dateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function isLate(transaction: RiwayatTransaksiRow) {
  if (transaction.statusPeminjaman === "DIKEMBALIKAN") {
    return Boolean(transaction.tanggalBerkasKeluar && transaction.tanggalBerkasKembali && new Date(transaction.tanggalBerkasKembali) > new Date(transaction.tanggalBerkasKeluar));
  }
  return Boolean(transaction.tanggalBerkasKeluar && new Date() > new Date(transaction.tanggalBerkasKeluar));
}

function statusText(transaction: RiwayatTransaksiRow) {
  if (transaction.statusPeminjaman !== "DIKEMBALIKAN") return isLate(transaction) ? "Terlambat" : "Dipinjam";
  return isLate(transaction) ? "Terlambat" : "Tepat Waktu";
}

export function RiwayatRm({ initialNomorRm = "", onNavigate }: { initialNomorRm?: string; onNavigate: (page: string, nomorRm?: string) => void }) {
  const [nomorRm, setNomorRm] = useState(initialNomorRm);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<RiwayatRmResult | null>(null);
  const [selected, setSelected] = useState<RiwayatTransaksiRow | null>(null);

  const searchHistory = async (value: string) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      setData(await getRiwayatByRm(value.trim()));
    } catch (err: unknown) {
      setData(null);
      setErrorMsg((err as Error).message || "Riwayat peminjaman gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (nomorRm.trim()) await searchHistory(nomorRm);
  };

  useEffect(() => {
    if (initialNomorRm) void Promise.resolve().then(() => searchHistory(initialNomorRm));
  }, [initialNomorRm]);

  return (
    <div className="min-h-full space-y-4 pb-8 text-slate-800">
      <div className="flex items-center gap-2 px-1 py-2 text-[10px] text-slate-500"><span>Peminjaman</span><span>›</span><strong className="text-emerald-700">Riwayat Peminjaman</strong></div>
      <div className="px-1"><h1 className="text-xl font-bold text-slate-900">Riwayat Peminjaman</h1><p className="mt-1 text-xs text-slate-500">Daftar rekam medis yang pernah dipinjam</p></div>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row sm:items-end"><label className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">Pencarian<input value={nomorRm} onChange={event => setNomorRm(event.target.value)} placeholder="00-24-91-82" disabled={isLoading} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-xs outline-none focus:border-emerald-600" /></label><button type="button" onClick={() => { setNomorRm(""); setData(null); setErrorMsg(""); }} className="h-9 rounded-md border border-slate-300 px-4 text-xs font-semibold">↻ Reset</button></form></section>
      {errorMsg && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{errorMsg}</div>}
      {isLoading && <LoadingState message="Mencari riwayat peminjaman..." />}
      {!isLoading && data && <>
        <section className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-md bg-fuchsia-400 text-xs font-bold text-white">{data.pasien.namaPasien.slice(0, 2).toUpperCase()}</div><div><h2 className="text-sm font-bold">{data.pasien.namaPasien}</h2><p className="text-[10px] text-slate-500">Pasien Rekam Medis <span className="ml-2 rounded bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">{data.pasien.nomorRm}</span></p></div></div><button type="button" onClick={() => onNavigate("peminjaman-baru", data.pasien.nomorRm)} className="rounded-md bg-emerald-600 px-4 py-2 text-[10px] font-semibold text-white">↪ Ajukan Peminjaman</button></section>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between px-5 py-4"><h2 className="text-sm font-bold">Daftar Riwayat Berkas RM</h2><span className="text-[10px] text-slate-500">Total {data.transaksi.length} transaksi</span></div><div className="overflow-x-auto"><table className="min-w-[940px] w-full text-left text-[10px]"><thead className="bg-slate-50 text-[9px] uppercase text-slate-500"><tr><th className="px-4 py-3">No</th><th className="px-3 py-3">Asal Ruang</th><th className="px-3 py-3">Peminjam</th><th className="px-3 py-3">Tanggal Pinjam</th><th className="px-3 py-3">Tanggal Kembali</th><th className="px-3 py-3">Kondisi Berkas</th><th className="px-3 py-3">Keperluan</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{data.transaksi.length === 0 ? <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Belum ada riwayat peminjaman.</td></tr> : data.transaksi.map((transaction, index) => { const late = isLate(transaction); const status = statusText(transaction); const badgeClass = status === "Dipinjam" ? "bg-amber-100 text-amber-700" : late ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"; return <tr key={transaction.peminjamanId} className="h-14 hover:bg-slate-50"><td className="px-4">{index + 1}</td><td className="px-3"><span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-semibold">{transaction.unit}</span></td><td className="px-3"><span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-semibold">{transaction.peminjamName}</span></td><td className="px-3 text-slate-500">{dateTime(transaction.tanggalPinjam)}</td><td className="px-3 text-slate-500">{dateTime(transaction.tanggalBerkasKembali)}</td><td className="px-3">{transaction.kondisiBerkas === "RUSAK" ? "Rusak" : transaction.kondisiBerkas === "BAIK" ? "Baik" : "-"}</td><td className="max-w-[170px] truncate px-3">{transaction.catatan || "-"}</td><td className="px-3"><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${badgeClass}`}>{status}</span></td><td className="px-3"><button type="button" title="Lihat detail" onClick={() => setSelected(transaction)} className="flex h-7 w-7 items-center justify-center rounded bg-indigo-600 text-white"><Icons.Eye /></button></td></tr>; })}</tbody></table></div></section>
      </>}
      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} onConfirm={() => setSelected(null)} title="Detail Riwayat" confirmText="Selesai" cancelText="Tutup" description={selected ? <div className="grid grid-cols-[110px_1fr] gap-2 text-left text-sm"><strong className="text-slate-500">Peminjam</strong><span>{selected.peminjamName}</span><strong className="text-slate-500">Unit</strong><span>{selected.unit}</span><strong className="text-slate-500">Status</strong><span>{statusText(selected)}</span><strong className="text-slate-500">Tgl Pinjam</strong><span>{dateTime(selected.tanggalPinjam)}</span><strong className="text-slate-500">Tgl Kembali</strong><span>{dateTime(selected.tanggalBerkasKembali)}</span><strong className="text-slate-500">Catatan</strong><span>{selected.catatan || "-"}</span></div> : null} />
    </div>
  );
}