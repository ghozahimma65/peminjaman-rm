import { useEffect, useState } from "react";
import { Icons } from "../../components/Icons";
import { Modal } from "../../components/ui/Modal";
import { useAuth } from "../../context/AuthContext";
import { findActivePeminjamanByRm, PeminjamanDetailRow, processPengembalian } from "../../lib/database/pengembalianService";
import { calculateDeadline, calculateEffectiveStatus } from "../../lib/statusHelper";

export function ProsesPengembalian({ 
  onNavigate,
  initialNomorRm = "",
}: { 
  onNavigate: (page: string) => void;
  initialNomorRm?: string;
}) {
  const { user } = useAuth();
  const [nomorRm, setNomorRm] = useState(initialNomorRm || "");
  const [activePeminjaman, setActivePeminjaman] = useState<PeminjamanDetailRow | null>(null);
  const [kondisi, setKondisi] = useState("Lengkap");
  const [catatanPengembalian, setCatatanPengembalian] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!initialNomorRm || !initialNomorRm.trim()) return;
    let active = true;
    const trimmed = initialNomorRm.trim();
    (async () => {
      try {
        const result = await findActivePeminjamanByRm(trimmed);
        if (!active) return;
        if (!result) setErrorMsg(`Tidak ada peminjaman aktif untuk Nomor RM: ${trimmed}`);
        else setActivePeminjaman(result);
      } catch (err: unknown) {
        if (!active) return;
        setErrorMsg((err as Error).message || "Data peminjaman gagal dicari.");
      }
    })();
    return () => {
      active = false;
    };
  }, [initialNomorRm]);


  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nomorRm.trim()) return;
    setIsLoading(true); setErrorMsg(""); setSuccessMsg(""); setActivePeminjaman(null);
    try {
      const result = await findActivePeminjamanByRm(nomorRm.trim());
      if (!result) setErrorMsg(`Tidak ada peminjaman aktif untuk Nomor RM: ${nomorRm}`);
      else setActivePeminjaman(result);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Data peminjaman gagal dicari.");
    } finally { setIsLoading(false); }
  };

  const handleConfirm = async () => {
    if (!user || !activePeminjaman || activePeminjaman.status === "DIKEMBALIKAN" || isLoading) return;
    setIsLoading(true); setErrorMsg("");
    try {
      // PENTING: Tanggal kembali diambil secara aktual saat tombol konfirmasi diproses (Requirement H & I)
      await processPengembalian(activePeminjaman.id, user.id, kondisi === "Tidak Lengkap" ? "RUSAK" : "BAIK", undefined, catatanPengembalian.trim() || null);
      setShowConfirm(false); setSuccessMsg(`Pengembalian berkas RM ${activePeminjaman.nomorRm} berhasil dicatat.`); setActivePeminjaman(null); setNomorRm(""); setCatatanPengembalian("");
      setTimeout(() => onNavigate("berkas-belum-kembali"), 1000);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Pengembalian gagal diproses."); setShowConfirm(false);
    } finally { setIsLoading(false); }
  };

  const inputClass = "mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-50";
  const deadlineDate = activePeminjaman ? calculateDeadline(activePeminjaman.tanggalBerkasKeluar, activePeminjaman.tanggalPinjam) : null;
  const effectiveStatus = activePeminjaman ? calculateEffectiveStatus(activePeminjaman.tanggalBerkasKeluar, activePeminjaman.tanggalPinjam, null) : "";
  const statusLabel = activePeminjaman?.status === "DIKEMBALIKAN" ? "Dikembalikan" : effectiveStatus === "TERLAMBAT" ? "Terlambat" : "Dipinjam";
  const deadlineFormatted = deadlineDate ? deadlineDate.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";

  return (
    <div className="min-h-full space-y-3 pb-8 text-slate-800">
      <div className="flex items-start gap-3 px-3 py-2"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-800 text-white"><Icons.Pengembalian /></span><div><h1 className="text-lg font-bold text-slate-900">Pengembalian Berkas Rekam Medis</h1><p className="text-[10px] text-slate-500">Lakukan proses pengembalian berkas rekam medis yang sudah dipinjam.</p></div></div>
      {errorMsg && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{errorMsg}</div>}
      {successMsg && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{successMsg}</div>}
      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)]">
        <form onSubmit={handleSearch} className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.08)]"><h2 className="border-b border-slate-100 pb-3 text-xs font-bold">Data Pengembalian</h2><div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"><label className="text-[10px] font-semibold text-slate-600">Nomor Rekam Medis<input value={nomorRm} onChange={event => setNomorRm(event.target.value)} placeholder="00012345" disabled={isLoading} className={`${inputClass} pr-9`} /></label><label className="text-[10px] font-semibold text-slate-600">Nama Pasien<input value={activePeminjaman?.namaPasien || ""} disabled placeholder="Terisi setelah pencarian" className={`${inputClass} bg-slate-50`} /></label><label className="text-[10px] font-semibold text-slate-600">Nama Peminjam<input value={activePeminjaman?.namaPeminjam || ""} disabled placeholder="Terisi setelah pencarian" className={`${inputClass} bg-slate-50`} /></label><label className="text-[10px] font-semibold text-slate-600">Unit Peminjam<input value={activePeminjaman?.unit || ""} disabled className={`${inputClass} bg-slate-50`} /></label><label className="text-[10px] font-semibold text-slate-600">Catatan Peminjaman<input value={activePeminjaman?.catatan || "-"} disabled readOnly placeholder="Terisi setelah pencarian" className={`${inputClass} bg-slate-50`} /></label><label className="text-[10px] font-semibold text-slate-600">Tanggal Kembali <span className="text-slate-400">(Otomatis saat ini)</span><input value="Otomatis (Saat diproses)" disabled readOnly className={`${inputClass} bg-slate-50 font-medium text-slate-500`} /></label><label className="text-[10px] font-semibold text-slate-600 md:col-span-2">Kondisi Berkas<select value={kondisi} onChange={event => setKondisi(event.target.value)} disabled={isLoading} className={inputClass}><option value="Lengkap">Lengkap</option><option value="Tidak Lengkap">Tidak Lengkap</option></select></label><label className="text-[10px] font-semibold text-slate-600 md:col-span-2">Catatan Pengembalian <span className="text-slate-400 font-normal">(Opsional)</span><textarea value={catatanPengembalian} onChange={event => setCatatanPengembalian(event.target.value)} disabled={isLoading} placeholder="Catatan khusus saat pengembalian berkas (boleh dikosongkan)" rows={3} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-50 resize-none" /></label></div><div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={() => { setNomorRm(""); setActivePeminjaman(null); setErrorMsg(""); setCatatanPengembalian(""); }} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700">Reset</button><button type="submit" disabled={isLoading || !nomorRm.trim()} className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"><Icons.Search /> Cari Data</button></div></form>
        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.08)]"><h2 className="border-b border-slate-100 pb-3 text-xs font-bold">◷ Informasi Berkas</h2><dl className="mt-4 grid grid-cols-[110px_1fr] gap-y-3 text-[10px]"><dt className="text-slate-500">Nomor</dt><dd className="text-right font-semibold">{activePeminjaman?.nomorRm || "-"}</dd><dt className="text-slate-500">Nama Pasien</dt><dd className="text-right font-semibold">{activePeminjaman?.namaPasien || "-"}</dd><dt className="text-slate-500">Nama Peminjam</dt><dd className="text-right font-semibold">{activePeminjaman?.namaPeminjam || "-"}</dd><dt className="text-slate-500">Unit Peminjam</dt><dd className="text-right font-semibold">{activePeminjaman?.unit || "-"}</dd><dt className="text-slate-500">Catatan Peminjaman</dt><dd className="text-right font-semibold">{activePeminjaman?.catatan || "-"}</dd><dt className="text-slate-500">Tanggal Pinjam</dt><dd className="text-right font-semibold">{activePeminjaman?.tanggalPinjam ? new Date(activePeminjaman.tanggalPinjam).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-"}</dd><dt className="text-slate-500">Batas Pengembalian</dt><dd className="text-right font-semibold">{deadlineFormatted}</dd><dt className="text-slate-500">Status</dt><dd className="text-right"><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${effectiveStatus === "TERLAMBAT" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{activePeminjaman ? statusLabel : "-"}</span></dd></dl></aside>
      </div>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,0.08)]"><div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-xs font-bold"><Icons.Peminjaman />Hasil Pencarian</div>{activePeminjaman ? <div className="overflow-x-auto"><table className="min-w-[860px] w-full text-left text-[10px]"><thead className="bg-emerald-50 text-[9px] uppercase"><tr><th className="px-4 py-3">No.</th><th className="px-3 py-3">Nomor</th><th className="px-3 py-3">Nama Pasien</th><th className="px-3 py-3">Nama Peminjam</th><th className="px-3 py-3">Unit Peminjam</th><th className="px-3 py-3">Catatan Peminjaman</th><th className="px-3 py-3">Tanggal Pinjam</th><th className="px-3 py-3">Batas Kembali</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Aksi</th></tr></thead><tbody><tr className="h-14"><td className="px-4">1</td><td className="px-3 font-semibold">{activePeminjaman.nomorRm}</td><td className="px-3">{activePeminjaman.namaPasien}</td><td className="px-3">{activePeminjaman.namaPeminjam || "-"}</td><td className="px-3">{activePeminjaman.unit}</td><td className="px-3">{activePeminjaman.catatan || "-"}</td><td className="px-3">{new Date(activePeminjaman.tanggalPinjam).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</td><td className="px-3">{deadlineFormatted}</td><td className="px-3"><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${effectiveStatus === "TERLAMBAT" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{statusLabel}</span></td><td className="px-3"><button type="button" onClick={() => setShowConfirm(true)} className="rounded-md bg-emerald-700 px-3 py-1.5 text-[9px] font-semibold text-white hover:bg-emerald-800">↩ Kembalikan</button></td></tr></tbody></table></div> : <p className="px-5 py-8 text-center text-[10px] text-slate-400">Cari nomor rekam medis untuk menampilkan berkas.</p>}</section>
      <Modal
        isOpen={showConfirm}
        onClose={() => !isLoading && setShowConfirm(false)}
        onConfirm={() => void handleConfirm()}
        isLoading={isLoading}
        title="Kembalikan RM"
        description="Apakah Anda Yakin Untuk Mengembalikan Berkas RM ini?"
        confirmText="Ya"
        cancelText="Tidak"
        variant="return"
      />
    </div>
  );
}