import { useCallback, useEffect, useState } from "react";
import { Icons } from "../../components/Icons";
import { LoadingState } from "../../components/ui/LoadingState";
import { Modal } from "../../components/ui/Modal";
import {
  AllRiwayatRow,
  deletePeminjamanHistory,
  getAllRiwayat,
  updatePeminjamanHistory,
} from "../../lib/database/riwayatRmService";

import { RUANGAN_OPTIONS } from "../../constants";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("id-ID");
}

function formatDateCard(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatTanggalKembaliWithDuration(tanggalPinjam?: string | null, tanggalKembali?: string | null): React.ReactNode {
  if (!tanggalKembali) return "-";
  const formattedDate = formatDateCard(tanggalKembali);
  if (!tanggalPinjam) return formattedDate;
  const pinjamTime = new Date(tanggalPinjam).getTime();
  const kembaliTime = new Date(tanggalKembali).getTime();
  if (Number.isNaN(pinjamTime) || Number.isNaN(kembaliTime)) return formattedDate;
  const diffDays = Math.max(1, Math.round((kembaliTime - pinjamTime) / (1000 * 60 * 60 * 24)));
  return (
    <span>
      {formattedDate} <span className="text-amber-600 font-medium">({diffDays} hari)</span>
    </span>
  );
}

function renderCardStatusBadge(status: string) {
  if (status === "TERLAMBAT") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 border border-red-200">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Terlambat
      </span>
    );
  }
  if (status === "DIPINJAM") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600 border border-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Dipinjam
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Tepat Waktu
    </span>
  );
}

function statusBadgeColor(status: string) {
  if (status === "TERLAMBAT") return "bg-red-100 text-red-700 border border-red-200";
  if (status === "DIPINJAM") return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  return "bg-emerald-100 text-emerald-700 border border-emerald-200";
}

function statusLabel(status: string) {
  if (status === "TERLAMBAT") return "Terlambat";
  if (status === "DIPINJAM") return "Dipinjam";
  return "Tepat Waktu";
}

// ─── Edit/Delete modal types ────────────────────────────────────────────────

interface EditTarget {
  peminjamanId: number;
  unit: string;
  catatan: string | null;
  nomorRm: string; // untuk refresh setelah edit di mode per-RM
}

export function RiwayatRm({
  initialNomorRm = "",
}: {
  initialNomorRm?: string;
  onNavigate?: (page: string, nomorRm?: string) => void;
}) {
  // ── State utama ──────────────────────────────────────────────────────────
  const [allData, setAllData] = useState<AllRiwayatRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Filter / Search ──────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState(initialNomorRm || "");
  const [appliedSearch, setAppliedSearch] = useState(initialNomorRm || "");
  const [filterUnit, setFilterUnit] = useState("");

  // ── Modal Detail Card State (Requirement 5) ─────────────────────────────
  const [viewRow, setViewRow] = useState<AllRiwayatRow | null>(null);

  // ── Pagination ───────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ── Modal states ─────────────────────────────────────────────────────────
  const [pendingDelete, setPendingDelete] = useState<number | null>(null); // peminjamanId
  const [pendingEdit, setPendingEdit] = useState<EditTarget | null>(null);
  const [editUnit, setEditUnit] = useState("");
  const [editCatatan, setEditCatatan] = useState("");


  // ── Load semua data ──────────────────────────────────────────────────────
  const loadAll = useCallback(async (search?: string) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const rows = await getAllRiwayat(search);
      setAllData(rows);
      setPage(1);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Gagal memuat riwayat.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load saat mount & saat appliedSearch berubah
  useEffect(() => {
    const search = appliedSearch || undefined;
    (async () => { await loadAll(search); })().catch(console.error);
  }, [loadAll, appliedSearch]);






  // ── Filtered data (client-side filter tambahan untuk unit) ───────────────
  const filteredData = filterUnit
    ? allData.filter((r) => r.unit === filterUnit)
    : allData;

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalItems = filteredData.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const visibleRows = filteredData.slice((page - 1) * pageSize, page * pageSize);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

  const handleReset = () => {
    setSearchInput("");
    setAppliedSearch("");
    setFilterUnit("");
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    try {
      await deletePeminjamanHistory(pendingDelete);
      setPendingDelete(null);
      await loadAll(appliedSearch || undefined);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Gagal menghapus riwayat.");
      setPendingDelete(null);
    }
  };

  const handleEditSave = async () => {
    if (!pendingEdit) return;
    try {
      await updatePeminjamanHistory(pendingEdit.peminjamanId, editUnit, editCatatan || null);
      setPendingEdit(null);
      await loadAll(appliedSearch || undefined);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Gagal memperbarui riwayat.");
      setPendingEdit(null);
    }
  };


  return (
    <div className="min-h-full space-y-4 pb-8 text-slate-800">
      <div className="px-1">
        <h1 className="text-xl font-bold text-slate-900">Riwayat RM</h1>
        <p className="mt-1 text-xs text-slate-500">
          Seluruh riwayat transaksi peminjaman dan pengembalian rekam medis.
        </p>
      </div>

      {/* ─── Filter & Search ─── */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          {/* Search input */}
          <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            Pencarian
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Icons.Search />
              </span>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Nomor RM / Nama Pasien / Peminjam"
                disabled={isLoading}
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-xs outline-none focus:border-emerald-600"
              />
            </div>
          </label>

          {/* Filter unit */}
          <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            Asal Ruang
            <select
              value={filterUnit}
              onChange={(e) => { setFilterUnit(e.target.value); setPage(1); }}
              className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-xs font-normal normal-case outline-none focus:border-emerald-600"
            >
              <option value="">Semua Ruang</option>
              {RUANGAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>

          {/* Cari */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-[17px] flex h-10 items-center justify-center gap-1 rounded-md bg-emerald-700 px-4 text-xs font-semibold text-white disabled:opacity-50 hover:bg-emerald-800"
          >
            <Icons.Search /> Cari
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="mt-[17px] flex h-10 items-center justify-center gap-1.5 rounded-md border border-slate-300 px-4 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          >
            <Icons.Refresh /> Reset
          </button>
        </form>
      </section>

      {errorMsg && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {isLoading && <LoadingState message="Memuat riwayat RM..." />}

      {!isLoading && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-sm font-bold">Daftar Riwayat Berkas RM</h2>
            <span className="text-[10px] text-slate-500">
              {totalItems === 0
                ? "Menampilkan 0 data"
                : `Menampilkan ${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, totalItems)} dari ${totalItems} data`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left text-[10px]">
              <thead className="bg-slate-50 text-[9px] uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">No.</th>
                  <th className="px-3 py-3">Nomor</th>
                  <th className="px-3 py-3">Nama Pasien</th>
                  <th className="px-3 py-3">Asal Ruang</th>
                  <th className="px-3 py-3">Peminjam</th>
                  <th className="px-3 py-3">Tanggal Pinjam</th>
                  <th className="px-3 py-3">Tanggal Kembali</th>
                  <th className="px-3 py-3">Kondisi Berkas</th>
                  <th className="px-3 py-3">Catatan Peminjaman</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {totalItems === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-slate-400">
                      {appliedSearch
                        ? `Tidak ada riwayat yang cocok dengan pencarian "${appliedSearch}".`
                        : "Belum ada riwayat transaksi."}
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row: AllRiwayatRow, index: number) => {
                    const badge = statusBadgeColor(row.statusPeminjaman);
                    const label = statusLabel(row.statusPeminjaman);
                    return (
                      <tr key={row.peminjamanId} className="h-14 hover:bg-slate-50">
                        <td className="px-4 text-slate-700">{(page - 1) * pageSize + index + 1}</td>
                        <td className="px-3 font-semibold text-emerald-700">{row.nomorRm}</td>
                        <td className="px-3 text-slate-700">{row.namaPasien}</td>
                        <td className="px-3">
                          <span className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                            {row.unit}
                          </span>
                        </td>
                        <td className="px-3 text-slate-700">{row.peminjamName}</td>
                        <td className="px-3 text-slate-500">{formatDate(row.tanggalPinjam)}</td>
                        <td className="px-3 text-slate-500">{formatDate(row.tanggalBerkasKembali)}</td>
                        <td className="px-3 text-slate-700">
                          {row.kondisiBerkas === "RUSAK"
                            ? "Tidak Lengkap"
                            : row.kondisiBerkas === "BAIK"
                            ? "Lengkap"
                            : "-"}
                        </td>
                        <td className="px-3 text-slate-700">{row.catatan || "-"}</td>
                        <td className="px-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-semibold ${badge}`}>
                            {label}
                          </span>
                        </td>
                        <td className="px-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              title="Lihat detail RM"
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 cursor-pointer"
                              onClick={() => setViewRow(row)}
                            >
                              <Icons.Eye />
                            </button>
                            <button
                              type="button"
                              title="Edit data"
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-yellow-200 bg-yellow-100 text-yellow-700 transition hover:bg-yellow-200 cursor-pointer"
                              onClick={() => {
                                setPendingEdit({
                                  peminjamanId: row.peminjamanId,
                                  unit: row.unit,
                                  catatan: row.catatan,
                                  nomorRm: row.nomorRm,
                                });
                                setEditUnit(row.unit);
                                setEditCatatan(row.catatan || "");
                              }}
                            >
                              <Icons.Edit />
                            </button>
                            <button
                              type="button"
                              title="Hapus data"
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-red-100 text-red-600 transition hover:bg-red-200 cursor-pointer"
                              onClick={() => setPendingDelete(row.peminjamanId)}
                            >
                              <Icons.Trash />
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

          {/* ─── Pagination ─── */}
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-[10px] text-slate-500">
            <span>
              Halaman {page} dari {pageCount} (Total {totalItems} data)
            </span>
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
                {Array.from({ length: pageCount }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === pageCount || Math.abs(n - page) <= 2)
                  .map((pageNum, i, arr) => (
                    <span key={pageNum} className="contents">
                      {i > 0 && arr[i - 1] !== pageNum - 1 && (
                        <span className="px-1 text-slate-400">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPage(pageNum)}
                        className={`h-7 w-7 rounded-md border text-xs font-semibold ${
                          page === pageNum
                            ? "border-emerald-700 bg-emerald-600 text-white"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    </span>
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
      )}

      {/* ─── Modal Hapus ─── */}
      <Modal
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void handleDeleteConfirm()}
        title="Hapus Data"
        description="Apakah Anda Yakin Ingin Menghapus Data Ini?"
        confirmText="Ya"
        cancelText="Tidak"
        variant="delete"
      />

      {/* ─── Modal Edit ─── */}
      <Modal
        isOpen={Boolean(pendingEdit)}
        onClose={() => setPendingEdit(null)}
        onConfirm={() => void handleEditSave()}
        title="Edit Data"
        confirmText="Ya"
        cancelText="Tidak"
        variant="edit"
        description={
          <div className="space-y-3">
            <p className="text-center text-slate-500">Apakah Anda Yakin Untuk Mengedit Data ini?</p>
            <div className="space-y-2 text-left">
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
          </div>
        }
      />

      {/* ─── Modal Informasi RM (Reference UI Card) ─── */}
      {viewRow && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
          onClick={() => setViewRow(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl transition-all border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Green Icon + Title */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Icons.Info />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Informasi RM</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewRow(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold leading-none"
              >
                ×
              </button>
            </div>

            {/* Content List */}
            <dl className="mt-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Nomor</dt>
                <dd className="font-mono font-bold text-slate-800 tracking-wider">{viewRow.nomorRm}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Nama Pasien</dt>
                <dd className="font-semibold text-slate-900 text-right">{viewRow.namaPasien}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Unit Peminjam</dt>
                <dd className="font-medium text-slate-700 text-right">{viewRow.unit}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Peminjam</dt>
                <dd className="font-medium text-slate-700 text-right">{viewRow.peminjamName}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Kondisi Berkas</dt>
                <dd className="font-medium text-slate-700 text-right">
                  {viewRow.kondisiBerkas === "RUSAK" ? "Tidak Lengkap" : viewRow.kondisiBerkas === "BAIK" ? "Lengkap" : "-"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Tanggal Pinjam</dt>
                <dd className="font-medium text-slate-700 text-right">{formatDateCard(viewRow.tanggalPinjam)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Tanggal Kembali</dt>
                <dd className="font-medium text-slate-700 text-right">
                  {formatTanggalKembaliWithDuration(viewRow.tanggalPinjam, viewRow.tanggalBerkasKembali)}
                </dd>
              </div>
              <div className="flex items-start justify-between">
                <dt className="text-slate-400 shrink-0">Catatan Peminjaman</dt>
                <dd className="max-w-[190px] font-medium text-slate-700 text-right" title={viewRow.catatan || "-"}>
                  {viewRow.catatan || "-"}
                </dd>
              </div>
              <div className="flex items-start justify-between">
                <dt className="text-slate-400 shrink-0">Catatan Pengembalian</dt>
                <dd className="max-w-[190px] font-medium text-slate-700 text-right" title={viewRow.catatanPengembalian || "-"}>
                  {viewRow.catatanPengembalian || "-"}
                </dd>
              </div>
              <div className="flex items-center justify-between pt-1">
                <dt className="text-slate-400">Status</dt>
                <dd className="text-right">{renderCardStatusBadge(viewRow.statusPeminjaman)}</dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-slate-100 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setViewRow(null)}
                className="rounded-lg bg-slate-100 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
