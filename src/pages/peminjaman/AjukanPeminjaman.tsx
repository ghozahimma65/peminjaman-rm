import { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { Icons } from "../../components/Icons";
import { useAuth } from "../../context/AuthContext";
import { getRmByNomor } from "../../lib/database/dataRmService";
import { checkActivePeminjaman, createPeminjaman } from "../../lib/database/peminjamanService";
import { calculateDeadline } from "../../lib/statusHelper";

export function AjukanPeminjaman({ onNavigate, initialNomorRm = "" }: { onNavigate: (page: string) => void; initialNomorRm?: string }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [nomorRm, setNomorRm] = useState(initialNomorRm);
  const [namaPasien, setNamaPasien] = useState("");
  const [tanggalPinjam, setTanggalPinjam] = useState(new Date().toISOString().slice(0, 16));
  const [tanggalKeluar, setTanggalKeluar] = useState("");
  const [unit, setUnit] = useState("");
  const [jilid, setJilid] = useState("");
  const [catatan, setCatatan] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchRM = async () => {
    if (!nomorRm) return;
    setIsSearching(true);
    setErrorMsg("");
    setNamaPasien("");
    try {
      const dataRm = await getRmByNomor(nomorRm);
      if (!dataRm) {
        setErrorMsg("Rekam medis tidak ditemukan. Pastikan nomor RM benar.");
        return;
      }
      const active = await checkActivePeminjaman(nomorRm);
      if (active) {
        setErrorMsg(`Rekam medis ${nomorRm} masih berstatus ${active.status} dan belum dikembalikan.`);
        return;
      }
      setNamaPasien(dataRm.namaPasien);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Pencarian RM gagal.");
    } finally {
      setIsSearching(false);
    }
  };

  const handlePreview = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    if (!nomorRm || !namaPasien) return setErrorMsg("Data Pasien belum lengkap / belum ditemukan.");
    if (!unit) return setErrorMsg("Ruangan Tujuan wajib diisi.");
    setShowPreview(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      await createPeminjaman({ nomorRm, namaPasien, tanggalPinjam: new Date(tanggalPinjam).toISOString(), tanggalBerkasKeluar: tanggalKeluar ? new Date(tanggalKeluar).toISOString() : null, unit, jilid, catatan, peminjamId: user.id, status: "DIPINJAM" });
      setShowPreview(false);
      setSuccessMsg("Peminjaman berhasil disimpan.");
      setTimeout(() => onNavigate("daftar-peminjaman"), 1000);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Peminjaman gagal disimpan.");
      setShowPreview(false);
    } finally {
      setIsLoading(false);
    }
  };

  const RUANGAN_OPTIONS = [
    "Semua Ruang",
    "ADN",
    "B Fetal",
    "Bizzah 1",
    "Bizzah 2",
    "B Ma'ruf",
    "B Nisa 1",
    "B Nisa 2",
    "B Salam 1",
    "B Salam 2",
    "B Syifa",
    "Darulmuqomah",
    "Darussalam",
    "Firdaus",
    "Mawar",
    "Naim",
    "ICU",
    "ICU Solusi",
    "NICU",
    "PICU",
    "ICCU",
    "PERIST/Perinatologi",
    "VK/Kamar Bersalin",
    "Rekam Medis",
  ];

  const inputClass = "mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-50";
  const labelClass = "text-[10px] font-semibold text-slate-600";

  return (
    <div className="min-h-full space-y-3 pb-8 text-slate-800">
      <div className="flex items-center gap-2 px-1 py-2 text-[11px] text-slate-500"><span>Peminjaman</span><span>›</span><strong className="text-emerald-700">Ajukan Peminjaman</strong></div>
      <div className="flex items-start gap-3 px-3 py-2"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-700 text-white"><Icons.Peminjaman /></span><div><h1 className="text-lg font-bold text-slate-900">Peminjaman Berkas Rekam Medis</h1><p className="text-[10px] text-slate-500">Catat peminjaman berkas rekam medis dengan lengkap.</p></div></div>
      {errorMsg && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{errorMsg}</div>}
      {successMsg && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{successMsg}</div>}

      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(260px,1fr)]">
        <form onSubmit={handlePreview} className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.1)]">
          <h2 className="border-b border-slate-100 pb-3 text-sm font-bold">Form Peminjaman Berkas</h2>
          <p className="mt-2 text-[10px] text-slate-500">Isi data peminjaman berkas rekam medis. Pastikan nomor RM valid.</p>
          <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className={labelClass}>Tgl Pinjam <span className="text-red-500">*</span><input type="datetime-local" value={tanggalPinjam} onChange={event => setTanggalPinjam(event.target.value)} disabled={isLoading} className={inputClass} /></label>
            <label className={labelClass}>Tgl Keluar <span className="text-red-500">*</span><input type="datetime-local" value={tanggalKeluar} onChange={event => setTanggalKeluar(event.target.value)} disabled={isLoading} className={inputClass} /></label>
            <div><label className={labelClass}>Nomor RM <span className="text-red-500">*</span></label><div className="mt-1 flex gap-2"><div className="relative flex-1"><Icons.Search /><input value={nomorRm} onChange={event => { setNomorRm(event.target.value); setNamaPasien(""); }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void handleSearchRM(); } }} placeholder="Contoh: RM-123456" disabled={isLoading || isSearching} className={`${inputClass} pl-8`} /></div><button type="button" onClick={() => void handleSearchRM()} className="h-9 rounded-md bg-slate-100 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-200" disabled={isSearching}>{isSearching ? "..." : "Cari"}</button></div></div>
            <label className={labelClass}>Peminjam<input value={user?.name || ""} disabled className={`${inputClass} bg-slate-50`} /></label>
            <label className={labelClass}>Nama Pasien<input value={namaPasien} disabled placeholder="Terisi otomatis setelah pencarian" className={`${inputClass} bg-slate-50`} /></label>
            <div className="grid grid-cols-[1fr_1.5fr] gap-3"><label className={labelClass}>Jilid<input value={jilid} onChange={event => setJilid(event.target.value)} disabled={isLoading} placeholder="1" className={inputClass} /></label><label className={labelClass}>Catatan / Keperluan<input value={catatan} onChange={event => setCatatan(event.target.value)} disabled={isLoading} placeholder="Catatan opsional..." className={inputClass} /></label></div>
            <label className={`${labelClass} md:col-span-2`}>Ruangan Tujuan <span className="text-red-500">*</span><select value={unit} onChange={event => setUnit(event.target.value)} disabled={isLoading} className={inputClass}><option value="">Pilih ruangan tujuan</option>{RUANGAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></label>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={() => { setNomorRm(""); setNamaPasien(""); setTanggalPinjam(new Date().toISOString().slice(0, 16)); setTanggalKeluar(""); setUnit(""); setJilid(""); setCatatan(""); setErrorMsg(""); }} disabled={isLoading} className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">Reset</button><button type="submit" disabled={isLoading || !namaPasien} className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><span className="mr-1">⇩</span>Simpan Peminjaman</button></div>
        </form>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.1)]">
          <h2 className="border-b border-emerald-900/30 pb-2 text-xs font-semibold text-slate-800">DETAIL PEMINJAMAN</h2>
          <dl className="mt-5 grid grid-cols-[90px_1fr] gap-y-3 text-[10px]">
            <dt className="text-slate-500">No. RM</dt><dd className="font-semibold">: {nomorRm || "-"}</dd>
            <dt className="text-slate-500">Nama Pasien</dt><dd className="font-semibold">: {namaPasien || "-"}</dd>
            <dt className="text-slate-500">Peminjam</dt><dd className="font-semibold">: {user?.name || "-"}</dd>
            <dt className="text-slate-500">Ruangan Tujuan</dt><dd className="font-semibold">: {unit || "-"}</dd>
            <dt className="text-slate-500">Tanggal Pinjam</dt><dd className="font-semibold">: {tanggalPinjam ? new Date(tanggalPinjam).toLocaleString("id-ID") : "-"}</dd>
            <dt className="text-slate-500">Jatuh Tempo</dt><dd className="font-semibold">: {calculateDeadline(tanggalKeluar, tanggalPinjam)?.toLocaleString("id-ID") || "-"}</dd>
            <dt className="text-slate-500">Jilid</dt><dd className="font-semibold">: {jilid || "-"}</dd>
            <dt className="text-slate-500">Catatan / Keperluan</dt><dd className="font-semibold">: {catatan || "-"}</dd>
          </dl>
          <button type="button" onClick={() => { setNomorRm(""); setNamaPasien(""); setUnit(""); setJilid(""); setCatatan(""); }} className="mt-8 ml-auto block rounded-md bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-600 hover:bg-red-100">⊗ Batalkan Peminjaman</button>
        </aside>
      </div>

      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} onConfirm={() => void handleSave()} title="Ringkasan Peminjaman" confirmText="Simpan Peminjaman" cancelText="Kembali Edit" description={<div className="grid grid-cols-[120px_1fr] gap-3 text-left text-sm"><strong className="text-slate-500">Nomor RM</strong><span>: {nomorRm}</span><strong className="text-slate-500">Nama Pasien</strong><span>: {namaPasien}</span><strong className="text-slate-500">Peminjam</strong><span>: {user?.name}</span><strong className="text-slate-500">Ruangan Tujuan</strong><span>: {unit}</span><strong className="text-slate-500">Tgl Pinjam</strong><span>: {new Date(tanggalPinjam).toLocaleString("id-ID")}</span><strong className="text-slate-500">Deadline</strong><span>: {calculateDeadline(tanggalKeluar, tanggalPinjam)?.toLocaleString("id-ID") || "-"}</span></div>} />
    </div>
  );
}