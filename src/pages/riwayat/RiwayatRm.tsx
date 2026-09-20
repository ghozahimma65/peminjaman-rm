import { useEffect, useState } from "react";
import { Icons } from "../../components/Icons";
import { LoadingState } from "../../components/ui/LoadingState";
import {
  deletePeminjamanHistory,
  getRiwayatByRm,
  RiwayatRmResult,
  RiwayatTransaksiRow,
  updatePeminjamanHistory,
} from "../../lib/database/riwayatRmService";
import { calculateEffectiveStatus } from "../../lib/statusHelper";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("id-ID");
}

function formatPatientSub(jenisKelamin?: string | null, tanggalLahir?: string | null): string {
  const parts: string[] = [];
  if (jenisKelamin) {
    parts.push(jenisKelamin);
  }
  if (tanggalLahir) {
    let birthDate: Date | null = null;
    if (tanggalLahir.includes("/")) {
      const p = tanggalLahir.split("/");
      if (p.length === 3) {
        const d = parseInt(p[0], 10);
        const m = parseInt(p[1], 10) - 1;
        const y = parseInt(p[2], 10);
        birthDate = new Date(y, m, d);
      }
    }
    if (!birthDate || Number.isNaN(birthDate.getTime())) {
      birthDate = new Date(tanggalLahir);
    }
    if (!Number.isNaN(birthDate.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age >= 0) {
        parts.push(`${age} Tahun`);
      }
    }
  }
  return parts.length > 0 ? parts.join(", ") : "Data Pasien";
}

function statusBadgeColor(status: string) {
  if (status === "Terlambat") return "bg-red-100 text-red-700 border border-red-200";
  if (status === "Dipinjam") return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  return "bg-emerald-100 text-emerald-700 border border-emerald-200";
}

function deriveStatus(transaction: RiwayatTransaksiRow) {
  const status = calculateEffectiveStatus(
    transaction.tanggalBerkasKeluar,
    transaction.tanggalPinjam,
    transaction.tanggalBerkasKembali
  );
  if (status === "TERLAMBAT") return "Terlambat";
  if (status === "DIKEMBALIKAN") return "Tepat Waktu";
  return "Dipinjam";
}

function statusLabel(transaction: RiwayatTransaksiRow) {
  const status = deriveStatus(transaction);
  return status === "Tepat Waktu" ? "Tepat Waktu" : status;
}

export function RiwayatRm({ initialNomorRm = "", onNavigate }: { initialNomorRm?: string; onNavigate: (page: string, nomorRm?: string) => void }) {
  const [nomorRm, setNomorRm] = useState(initialNomorRm);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<RiwayatRmResult | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RiwayatTransaksiRow | null>(null);
  const [pendingEdit, setPendingEdit] = useState<RiwayatTransaksiRow | null>(null);
  const [editUnit, setEditUnit] = useState("");
  const [editCatatan, setEditCatatan] = useState("");
  const [showNotFound, setShowNotFound] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const searchHistory = async (value: string) => {
    const trimmed = value.trim();
    setIsLoading(true);
    setErrorMsg("");
    setShowNotFound(false);
    setPage(1);

    try {
      if (!trimmed) {
        setData(null);
        setShowNotFound(true);
        return;
      }

      const result = await getRiwayatByRm(trimmed);
      setData(result);
    } catch (err: unknown) {
      setData(null);
      setShowNotFound(true);
      setErrorMsg((err as Error).message || "Riwayat peminjaman gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    await searchHistory(nomorRm);
  };

  useEffect(() => {
    if (initialNomorRm) {
      void Promise.resolve().then(() => searchHistory(initialNomorRm));
    }
  }, [initialNomorRm]);

  const handleDeleteConfirm = async () => {
    if (!pendingDelete || !data) return;
    try {
      await deletePeminjamanHistory(pendingDelete.peminjamanId);
      setPendingDelete(null);
      await searchHistory(data.pasien.nomorRm);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Gagal menghapus riwayat peminjaman.");
      setPendingDelete(null);
    }
  };

  const handleEditSave = async () => {
    if (!pendingEdit || !data) return;
    try {
      await updatePeminjamanHistory(pendingEdit.peminjamanId, editUnit, editCatatan || null);
      setPendingEdit(null);
      await searchHistory(data.pasien.nomorRm);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Gagal memperbarui riwayat peminjaman.");
      setPendingEdit(null);
    }
  };

  const totalItems = data?.transaksi.length || 0;
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const visibleRows = data?.transaksi.slice((page - 1) * pageSize, page * pageSize) || [];

  return (
    <div className="min-h-full space-y-4 pb-8 text-slate-800">
      <div className="flex items-center gap-2 px-1 py-2 text-[10px] text-slate-500">
        <span>Peminjaman</span>
        <span>›</span>
        <strong className="text-emerald-700">Riwayat Peminjaman</strong>
      </div>

      <div className="px-1">
        <h1 className="text-xl font-bold text-slate-900">Riwayat Peminjaman</h1>
        <p className="mt-1 text-xs text-slate-500">Daftar rekam medis yang pernah dipinjam</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            Pencarian
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Icons.Search />
              </span>
              <input
                value={nomorRm}
                onChange={(event) => setNomorRm(event.target.value)}
                placeholder="00-24-91-82"
                disabled={isLoading}
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-xs outline-none focus:border-emerald-600"
              />
            </div>
          </label>

          <button
            type="button"
            onClick={() => {
              setNomorRm("");
              setData(null);
              setErrorMsg("");
              setShowNotFound(false);
              setPage(1);
            }}
            className="flex h-10 items-center justify-center gap-1 rounded-md border border-slate-300 px-4 text-xs font-semibold hover:bg-slate-50"
          >
            <span>↻</span>
            Reset
          </button>
        </form>
      </section>

      {errorMsg && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {isLoading && <LoadingState message="Mencari riwayat peminjaman..." />}

      {!isLoading && data && (
        <>
          <section className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-200 to-pink-100 text-sm font-bold text-pink-700">
                {data.pasien.namaPasien.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{data.pasien.namaPasien}</h2>
                <p className="text-[10px] text-slate-500">
                  {formatPatientSub(data.pasien.jenisKelamin, data.pasien.tanggalLahir)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("peminjaman-baru", data.pasien.nomorRm)}
              className="rounded-md bg-emerald-600 px-4 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              + Ajukan Peminjaman
            </button>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-sm font-bold">Daftar Riwayat Berkas RM</h2>
              <span className="text-[10px] text-slate-500">
                {totalItems === 0
                  ? "Menampilkan 0 data"
                  : `Menampilkan ${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, totalItems)} dari ${totalItems} data`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-left text-[10px]">
                <thead className="bg-slate-50 text-[9px] uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-3 py-3">Asal Ruang</th>
                    <th className="px-3 py-3">Peminjam</th>
                    <th className="px-3 py-3">Tanggal Pinjam</th>
                    <th className="px-3 py-3">Tanggal Kembali</th>
                    <th className="px-3 py-3">Kondisi Berkas</th>
                    <th className="px-3 py-3">Keperluan</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {totalItems === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                        Belum ada riwayat peminjaman.
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((transaction, index) => {
                      const status = deriveStatus(transaction);
                      const badgeClass = statusBadgeColor(status === "Tepat Waktu" ? "Tepat Waktu" : status);

                      return (
                        <tr key={transaction.peminjamanId} className="h-14 hover:bg-slate-50">
                          <td className="px-4 text-slate-700">{(page - 1) * pageSize + index + 1}</td>
                          <td className="px-3"><span className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-700">{transaction.unit}</span></td>
                          <td className="px-3 text-slate-700">{transaction.peminjamName}</td>
                          <td className="px-3 text-slate-500">{formatDate(transaction.tanggalPinjam)}</td>
                          <td className="px-3 text-slate-500">{formatDate(transaction.tanggalBerkasKembali)}</td>
                          <td className="px-3 text-slate-700">{transaction.kondisiBerkas === "RUSAK" ? "Rusak" : transaction.kondisiBerkas === "BAIK" ? "Baik" : "-"}</td>
                          <td className="px-3 text-slate-700">{transaction.catatan || "-"}</td>
                          <td className="px-3">
                            <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-semibold ${badgeClass}`}>
                              {statusLabel(transaction)}
                            </span>
                          </td>
                          <td className="px-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                title="Edit data"
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-yellow-200 bg-yellow-100 text-yellow-700 transition hover:bg-yellow-200"
                                onClick={() => {
                                  setPendingEdit(transaction);
                                  setEditUnit(transaction.unit);
                                  setEditCatatan(transaction.catatan || "");
                                }}
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                title="Hapus data"
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-red-100 text-red-600 transition hover:bg-red-200"
                                onClick={() => setPendingDelete(transaction)}
                              >
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-[10px] text-slate-500">
              <span>Halaman {page} dari {pageCount} (Total {totalItems} data)</span>
              {pageCount > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded border border-slate-200 px-2 py-1 text-slate-600 disabled:opacity-40"
                  >
                    Sebelumnya
                  </button>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={`h-7 w-7 rounded-md border text-xs font-semibold ${page === pageNum ? "border-emerald-700 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={page === pageCount}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded border border-slate-200 px-2 py-1 text-slate-600 disabled:opacity-40"
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {showNotFound && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-[2px]"
          onMouseDown={() => setShowNotFound(false)}
        >
          <div
            className="w-full max-w-[380px] rounded-[22px] bg-white px-7 py-7 text-center shadow-[0_22px_50px_rgba(15,23,42,0.18)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-2xl text-white">×</div>
            <h3 className="mt-6 text-[30px] font-bold text-slate-900">Data Tidak Ditemukan</h3>
            <p className="mt-3 text-[16px] leading-6 text-slate-500">
              Data tidak ditemukan di sistem.
            </p>
            <button
              type="button"
              onClick={() => setShowNotFound(false)}
              className="mt-7 w-full rounded-xl bg-[#345344] px-5 py-3 text-base font-semibold text-white shadow-[0_8px_18px_rgba(52,83,68,0.2)] transition hover:bg-[#2b4539]"
            >
              Kembali
            </button>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-[2px]"
          onMouseDown={() => setPendingDelete(null)}
        >
          <div
            className="w-full max-w-[380px] rounded-[22px] bg-white px-7 py-7 text-center shadow-[0_22px_50px_rgba(15,23,42,0.18)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-2xl text-white">🗑</div>
            <h3 className="mt-6 text-[24px] font-bold text-slate-900">Hapus Riwayat Peminjaman</h3>
            <p className="mt-3 text-[14px] leading-6 text-slate-500">
              Apakah Anda yakin ingin menghapus data riwayat peminjaman ini?
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteConfirm()}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-red-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingEdit && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-[2px]"
          onMouseDown={() => setPendingEdit(null)}
        >
          <div
            className="w-full max-w-[420px] rounded-[22px] bg-white px-7 py-7 shadow-[0_22px_50px_rgba(15,23,42,0.18)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-slate-900">Edit Riwayat Peminjaman</h3>
            <p className="mt-1 text-xs text-slate-500">
              Ubah unit peminjam atau catatan keperluan transaksi ini.
            </p>
            <div className="mt-4 space-y-3 text-left">
              <label className="block text-xs font-semibold text-slate-700">
                Asal Ruang / Unit
                <input
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-xs outline-none focus:border-emerald-600"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Keperluan / Catatan
                <input
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-xs outline-none focus:border-emerald-600"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingEdit(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleEditSave()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

