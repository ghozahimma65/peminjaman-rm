import { useState, useEffect } from "react";
import { Icons } from "../../components/Icons";
import { LoadingState } from "../../components/ui/LoadingState";
import { 
  createDataRm,
  getAllDataRm, 
  searchDataRm, 
  getDataRmStats,
  MasterDataRmRow,
  DataRmStats
} from "../../lib/database/dataRmService";

interface MasterDataRmProps {
  onNavigate: (page: string, nomorRm?: string) => void;
}

function calculateAge(birthDateStr?: string | null): number | null {
  if (!birthDateStr) return null;
  const birthDate = new Date(birthDateStr);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

function getInitials(name: string): string {
  if (!name) return "RM";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_PALETTES = [
  { bg: "bg-pink-100", text: "text-pink-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-amber-100", text: "text-amber-800" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-emerald-100", text: "text-emerald-800" },
];

function getAvatarStyle(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

export function MasterDataRm({ onNavigate }: MasterDataRmProps) {
  const [data, setData] = useState<MasterDataRmRow[]>([]);
  const [stats, setStats] = useState<DataRmStats>({
    totalPasien: 0,
    sedangDipinjam: 0,
    rmBaruBulanIni: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [keyword, setKeyword] = useState("");

  // Views: 'list' | 'create'
  const [view, setView] = useState<"list" | "create">("list");

  // Modals
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("Rekam Medis Berhasil Dibuat");
  const [selectedRm, setSelectedRm] = useState<MasterDataRmRow | null>(null);
  const [copied, setCopied] = useState(false);

  // Create Form State
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    nomorRm: "",
    namaPasien: "",
    nik: "",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "",
    alamat: "",
  });

  // Pagination
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async (searchKeyword = "") => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const [tableResult, statsResult] = await Promise.all([
        searchKeyword.trim() ? searchDataRm(searchKeyword.trim()) : getAllDataRm(),
        getDataRmStats(),
      ]);
      setData(tableResult);
      setStats(statsResult);
      setCurrentPage(1);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Gagal memuat data rekam medis.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function fetchInitial() {
      setIsLoading(true);
      try {
        const [tableResult, statsResult] = await Promise.all([
          getAllDataRm(),
          getDataRmStats(),
        ]);
        if (active) {
          setData(tableResult);
          setStats(statsResult);
        }
      } catch (err: unknown) {
        if (active) setErrorMsg((err as Error).message || "Gagal memuat data rekam medis.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    fetchInitial();
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(keyword);
  };

  const handleReset = () => {
    setKeyword("");
    loadData("");
  };

  const openCreateForm = () => {
    setForm({
      nomorRm: "",
      namaPasien: "",
      nik: "",
      jenisKelamin: "Laki-laki",
      tanggalLahir: "",
      alamat: "",
    });
    setFormError("");
    setView("create");
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const nomorRm = form.nomorRm.trim();
    const namaPasien = form.namaPasien.trim();
    const nik = form.nik.trim();
    const jenisKelamin = form.jenisKelamin.trim();
    const tanggalLahir = form.tanggalLahir.trim();
    const alamat = form.alamat.trim();

    if (!nomorRm || !namaPasien || !nik || !jenisKelamin || !tanggalLahir || !alamat) {
      setFormError("Semua field wajib diisi, termasuk NIK, jenis kelamin, tanggal lahir, dan alamat.");
      return;
    }

    if (!/^\d{16}$/.test(nik)) {
      setFormError("NIK wajib terdiri dari tepat 16 digit angka (tanpa huruf, spasi, atau simbol).");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      await createDataRm(nomorRm, namaPasien, nik, jenisKelamin, tanggalLahir, alamat);
      
      const newRow: MasterDataRmRow = {
        nomorRm,
        namaPasien,
        nik,
        jenisKelamin,
        tanggalLahir,
        alamat,
        totalTransaksi: 0,
        isDipinjam: 0,
      };

      setSelectedRm(newRow);
      setShowSaveSuccessModal(true);
      await loadData(keyword);
    } catch (err: unknown) {
      const message = (err as Error).message || "Data RM gagal disimpan.";
      setFormError(message.toLowerCase().includes("unique") || message.toLowerCase().includes("constraint")
        ? "Nomor RM sudah terdaftar. Gunakan nomor RM lain."
        : message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyRm = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewDetailFromTable = (row: MasterDataRmRow) => {
    setSelectedRm(row);
    setModalTitle("Detail Rekam Medis");
    setShowDetailModal(true);
  };

  // Pagination calculation
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedRows = data.slice(startIndex, endIndex);

  // ==========================================
  // RENDER VIEW: TAMBAH REKAM MEDIS BARU (FIGMA IMAGE 1)
  // ==========================================
  if (view === "create") {
    return (
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tambah Rekam Medis Baru</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Pendaftaran Baru
            </span>
          </div>
          <button
            type="button"
            onClick={() => setView("list")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
          >
            <Icons.ArrowLeft />
            Kembali ke Daftar
          </button>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                {formError}
              </div>
            )}

            {/* Row 1: Nomor RM & NIK */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Nomor RM <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Icons.ClipboardData />
                  </span>
                  <input
                    type="text"
                    required
                    value={form.nomorRm}
                    onChange={(e) => setForm((prev) => ({ ...prev, nomorRm: e.target.value }))}
                    placeholder="01-24-0894"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  NIK (16 Digit) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Icons.IdCard />
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={form.nik}
                    onChange={(e) => setForm((prev) => ({ ...prev, nik: e.target.value }))}
                    placeholder="16 Digit NIK KTP"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Nama Lengkap Pasien */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Nama Lengkap Pasien <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Icons.User />
                </span>
                <input
                  type="text"
                  required
                  value={form.namaPasien}
                  onChange={(e) => setForm((prev) => ({ ...prev, namaPasien: e.target.value }))}
                  placeholder="Nama lengkap pasien"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Row 3: Jenis Kelamin & Tanggal Lahir */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, jenisKelamin: "Laki-laki" }))}
                    className={`flex h-11 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      form.jenisKelamin === "Laki-laki"
                        ? "bg-[#064e3b] text-white shadow-sm"
                        : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Icons.Male />
                    Laki-laki
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, jenisKelamin: "Perempuan" }))}
                    className={`flex h-11 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      form.jenisKelamin === "Perempuan"
                        ? "bg-[#064e3b] text-white shadow-sm"
                        : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Icons.Female />
                    Perempuan
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Icons.Calendar />
                  </span>
                  <input
                    type="date"
                    required
                    value={form.tanggalLahir}
                    onChange={(e) => setForm((prev) => ({ ...prev, tanggalLahir: e.target.value }))}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Alamat */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Alamat <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={form.alamat}
                onChange={(e) => setForm((prev) => ({ ...prev, alamat: e.target.value }))}
                placeholder="XXXXXX"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setView("list")}
                disabled={isSaving}
                className="rounded-lg bg-slate-100 px-6 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#064e3b] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#043e2e] cursor-pointer disabled:opacity-50"
              >
                <Icons.Check />
                {isSaving ? "Menyimpan..." : "Simpan RM"}
              </button>
            </div>
          </form>
        </div>

        {/* Modals are rendered below */}
        {renderModals()}
      </div>
    );
  }

  // ==========================================
  // RENDER VIEW: DATA MASTER PASIEN & REKAM MEDIS (FIGMA IMAGE 4)
  // ==========================================
  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Master Pasien & Rekam Medis</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-medium text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Terverifikasi
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Kelola data identitas pasien dan status berkas fisik</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#046c4e] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#03533c] cursor-pointer"
        >
          <span className="text-base leading-none font-bold">+</span>
          Tambah RM Baru
        </button>
      </div>

      {/* 3 Statistic Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card 1: Total Pasien / RM */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.06)]">
          <div>
            <span className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              TOTAL PASIEN / RM
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900">
                {isLoading ? "-" : formatNumber(stats.totalPasien)}
              </span>
              <span className="text-xs font-medium text-slate-500">Berkas</span>
            </div>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Icons.Users />
          </div>
        </div>

        {/* Card 2: Sedang Dipinjam */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.06)]">
          <div>
            <span className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              SEDANG DIPINJAM
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-amber-500">
                {isLoading ? "-" : formatNumber(stats.sedangDipinjam)}
              </span>
            </div>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <Icons.Clock />
          </div>
        </div>

        {/* Card 3: RM Baru Bulan Ini */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.06)]">
          <div>
            <span className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              RM BARU BULAN INI
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900">
                {isLoading ? "-" : formatNumber(stats.rmBaruBulanIni)}
              </span>
              <span className="text-xs font-medium text-slate-500">Pasien</span>
            </div>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
            <Icons.UserPlus />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.06)]">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Icons.Search />
            </span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="00-24-91-82"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#046c4e] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#03533c] cursor-pointer disabled:opacity-50"
            >
              <Icons.Search />
              Cari
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              <Icons.Refresh />
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,0.06)]">
        {/* Table Card Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5 text-slate-800">
            <span className="text-emerald-600">
              <Icons.FolderCheck />
            </span>
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-700">
              DAFTAR REKAM MEDIS & PASIEN AKTIF
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total {formatNumber(totalItems)} data
          </span>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="py-12">
            <LoadingState message="Memuat Master Data RM..." />
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Icons.ClipboardData />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Data RM Tidak Ditemukan</h3>
            <p className="mt-1 text-xs text-slate-500">
              {keyword ? `Tidak ada pasien yang cocok dengan pencarian "${keyword}".` : "Belum ada master data rekam medis terdaftar."}
            </p>
            {keyword && (
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hapus Pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">NO. REKAM MEDIS</th>
                  <th className="px-6 py-3.5">NAMA PASIEN & NIK</th>
                  <th className="px-6 py-3.5 text-center">TOTAL TRANSAKSI</th>
                  <th className="px-6 py-3.5 text-center">STATUS FISIK BERKAS</th>
                  <th className="px-6 py-3.5 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRows.map((row) => {
                  const avatarStyle = getAvatarStyle(row.namaPasien);
                  const isDipinjam = Boolean(row.isDipinjam);

                  return (
                    <tr key={row.nomorRm} className="h-[68px] transition hover:bg-slate-50/70">
                      {/* 1. No. RM */}
                      <td className="px-6 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleViewDetailFromTable(row)}
                          className="font-bold text-sky-600 hover:underline cursor-pointer tracking-wide"
                        >
                          {row.nomorRm}
                        </button>
                      </td>

                      {/* 2. Nama Pasien & NIK */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${avatarStyle.bg} ${avatarStyle.text}`}
                          >
                            {getInitials(row.namaPasien)}
                          </div>
                          <div>
                            <span className="block font-semibold text-slate-900">{row.namaPasien}</span>
                            <span className="block text-[11px] text-slate-400">
                              {row.nik || "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Total Transaksi */}
                      <td className="px-6 py-3.5 text-center font-medium text-slate-700">
                        {row.totalTransaksi}
                      </td>

                      {/* 4. Status Fisik Berkas */}
                      <td className="px-6 py-3.5 text-center">
                        {isDipinjam ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Dipinjam
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Tersedia di Filing
                          </span>
                        )}
                      </td>

                      {/* 5. Aksi */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2 text-slate-400">
                          <button
                            type="button"
                            onClick={() => handleViewDetailFromTable(row)}
                            title="Lihat Detail"
                            className="p-1.5 hover:text-slate-700 transition cursor-pointer"
                          >
                            <Icons.Eye />
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate("riwayat-rm", row.nomorRm)}
                            title="Buka Riwayat RM"
                            className="p-1.5 hover:text-slate-700 transition cursor-pointer"
                          >
                            <Icons.Edit />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer / Pagination */}
        {totalItems > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Menampilkan <span className="font-semibold text-slate-800">{startIndex + 1}</span> sampai{" "}
              <span className="font-semibold text-slate-800">{endIndex}</span> dari{" "}
              <span className="font-semibold text-slate-800">{formatNumber(totalItems)}</span> data pasien
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((pageNumber, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && pageNumber - prev > 1;

                  return (
                    <div key={pageNumber} className="flex items-center">
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition cursor-pointer ${
                          currentPage === pageNumber
                            ? "bg-[#064e3b] text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    </div>
                  );
                })}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {renderModals()}
    </div>
  );

  // ==========================================
  // MODALS RENDERING (FIGMA IMAGES 2 & 3)
  // ==========================================
  function renderModals() {
    if (!showSaveSuccessModal && !showDetailModal) return null;

    return (
      <div
        role="presentation"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
        onClick={() => {
          if (!isSaving) {
            setShowSaveSuccessModal(false);
            setShowDetailModal(false);
          }
        }}
      >
        {/* POPUP 1: DATA BERHASIL DISIMPAN (FIGMA IMAGE 2) */}
        {showSaveSuccessModal && (
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Green Circle Check Icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
              <span className="text-2xl font-bold">✓</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900">Data Berhasil Disimpan</h3>
            <p className="mx-auto mt-2 max-w-[280px] text-xs leading-relaxed text-slate-500">
              Penambahan Data RM telah berhasil ditambahkan dan tersimpan ke dalam sistem
            </p>

            <div className="mt-7 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setShowSaveSuccessModal(false);
                  setView("list");
                }}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-[#2d4a3e] text-xs font-semibold text-white shadow-sm transition hover:bg-[#20362d] cursor-pointer"
              >
                Selesai
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSaveSuccessModal(false);
                  setModalTitle("Rekam Medis Berhasil Dibuat");
                  setShowDetailModal(true);
                }}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              >
                Lihat
              </button>
            </div>
          </div>
        )}

        {/* POPUP 2: DETAIL RM BARU (FIGMA IMAGE 3) */}
        {showDetailModal && selectedRm && (
          <div
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Soft Green Badge */}
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Icons.Check />
            </div>

            <h3 className="text-center text-xl font-bold text-slate-900">
              {modalTitle}
            </h3>

            {/* Nomor RM Box */}
            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-center">
              <span className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                NOMOR REKAM MEDIS (NO. RM)
              </span>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="text-2xl font-bold font-mono tracking-wider text-pink-600">
                  {selectedRm.nomorRm}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyRm(selectedRm.nomorRm)}
                  title="Salin No. RM"
                  className="rounded p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                >
                  {copied ? <span className="text-xs font-bold text-emerald-600">✓</span> : <Icons.Copy />}
                </button>
              </div>
            </div>

            {/* Details List */}
            <div className="mt-6 space-y-3.5 text-xs">
              <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-400">Nama Lengkap</span>
                <span className="font-semibold text-slate-900 text-right">{selectedRm.namaPasien}</span>
              </div>
              <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-400">NIK</span>
                <span className="font-semibold text-slate-900 text-right">{selectedRm.nik || "-"}</span>
              </div>
              <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-400">Jenis Kelamin / Usia</span>
                <span className="font-semibold text-slate-900 text-right">
                  {selectedRm.jenisKelamin || "-"}
                  {selectedRm.tanggalLahir && calculateAge(selectedRm.tanggalLahir) !== null
                    ? `, ${calculateAge(selectedRm.tanggalLahir)} Thn`
                    : ""}
                </span>
              </div>
              <div className="flex items-start justify-between pb-2.5">
                <span className="text-slate-400">Alamat</span>
                <span className="max-w-[240px] font-semibold text-slate-900 text-right">
                  {selectedRm.alamat || "-"}
                </span>
              </div>
            </div>

            {/* Bottom Button: Kembali */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  if (view === "create") {
                    setView("list");
                  }
                }}
                className="rounded-lg bg-slate-100 px-6 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 cursor-pointer"
              >
                Kembali
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}
