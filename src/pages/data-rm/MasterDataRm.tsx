import { useState, useEffect } from "react";
import { Icons } from "../../components/Icons";
import { LoadingState } from "../../components/ui/LoadingState";
import { Modal } from "../../components/ui/Modal";
import { 
  createDataRm,
  updateDataRm,
  deleteDataRm,
  validateNomorRm,
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

function formatDateLahir(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function getInitials(name: string): string {
  if (!name) return "RM";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Tema warna card berdasarkan gender (Batch 2: Laki-laki = Biru, Perempuan = Pink, Null = Netral)
 */
function getGenderTheme(gender?: string | null) {
  const g = (gender || "").trim().toLowerCase();
  if (g === "laki-laki" || g === "pria" || g === "male") {
    return {
      type: "male" as const,
      label: "Laki-laki",
      borderAccent: "border-l-4 border-l-blue-500",
      rowBg: "hover:bg-blue-50/40",
      avatarBg: "bg-blue-100 text-blue-700 border border-blue-200",
      pillBg: "bg-blue-50 text-blue-700 border border-blue-200",
      accentText: "text-blue-600",
      badgeBg: "bg-blue-100 text-blue-800",
      detailBoxBg: "border-blue-100 bg-blue-50/50",
      detailBadgeBg: "bg-blue-100 text-blue-700",
      rmText: "text-blue-600 hover:text-blue-800",
    };
  }
  if (g === "perempuan" || g === "wanita" || g === "female") {
    return {
      type: "female" as const,
      label: "Perempuan",
      borderAccent: "border-l-4 border-l-pink-500",
      rowBg: "hover:bg-pink-50/40",
      avatarBg: "bg-pink-100 text-pink-700 border border-pink-200",
      pillBg: "bg-pink-50 text-pink-700 border border-pink-200",
      accentText: "text-pink-600",
      badgeBg: "bg-pink-100 text-pink-800",
      detailBoxBg: "border-pink-100 bg-pink-50/50",
      detailBadgeBg: "bg-pink-100 text-pink-700",
      rmText: "text-pink-600 hover:text-pink-800",
    };
  }
  return {
    type: "neutral" as const,
    label: "-",
    borderAccent: "border-l-4 border-l-slate-300",
    rowBg: "hover:bg-slate-50/70",
    avatarBg: "bg-slate-100 text-slate-700 border border-slate-200",
    pillBg: "bg-slate-100 text-slate-600 border border-slate-200",
    accentText: "text-slate-800",
    badgeBg: "bg-slate-100 text-slate-700",
    detailBoxBg: "border-slate-100 bg-slate-50/70",
    detailBadgeBg: "bg-slate-100 text-slate-700",
    rmText: "text-slate-700 hover:text-slate-900",
  };
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

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MasterDataRmRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState("");

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

  // Edit Form State (Requirement 3)
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);
  const [editFormError, setEditFormError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nomorRm: "",
    namaPasien: "",
    nik: "",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "",
    alamat: "",
  });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomorRm = editForm.nomorRm.trim();
    const namaPasien = editForm.namaPasien.trim();
    const nik = editForm.nik.trim();
    const jenisKelamin = editForm.jenisKelamin.trim();
    const tanggalLahir = editForm.tanggalLahir.trim();
    const alamat = editForm.alamat.trim();

    if (!nomorRm || !namaPasien || !nik || !jenisKelamin || !tanggalLahir || !alamat) {
      setEditFormError("Semua field wajib diisi, termasuk NIK, jenis kelamin, tanggal lahir, dan alamat.");
      return;
    }

    if (!/^\d{16}$/.test(nik)) {
      setEditFormError("NIK wajib terdiri dari tepat 16 digit angka (tanpa huruf, spasi, atau simbol).");
      return;
    }

    setIsEditing(true);
    setEditFormError("");
    try {
      await updateDataRm(nomorRm, namaPasien, nik, jenisKelamin, tanggalLahir, alamat);
      if (selectedRm) {
        setSelectedRm({
          ...selectedRm,
          namaPasien,
          nik,
          jenisKelamin,
          tanggalLahir,
          alamat,
        });
      }
      await loadData(keyword);
      setShowEditModal(false);
      setShowEditSuccessModal(true);
    } catch (err: unknown) {
      setEditFormError((err as Error).message || "Gagal memperbarui data rekam medis.");
    } finally {
      setIsEditing(false);
    }
  };


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

    try {
      validateNomorRm(nomorRm);
    } catch (e: unknown) {
      setFormError((e as Error).message);
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

  const handleDeleteClick = (row: MasterDataRmRow) => {
    setDeleteTarget(row);
    setErrorMsg("");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    setErrorMsg("");
    try {
      await deleteDataRm(deleteTarget.nomorRm);
      setShowDeleteModal(false);
      setDeleteSuccessMsg(`Data RM ${deleteTarget.nomorRm} (${deleteTarget.namaPasien}) berhasil dihapus.`);
      setDeleteTarget(null);
      await loadData(keyword);
      setTimeout(() => setDeleteSuccessMsg(""), 4000);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Data RM gagal dihapus.");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
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

  const handleEditFromTable = (row: MasterDataRmRow) => {
    setSelectedRm(row);
    setEditForm({
      nomorRm: row.nomorRm,
      namaPasien: row.namaPasien,
      nik: row.nik || "",
      jenisKelamin: row.jenisKelamin || "Laki-laki",
      tanggalLahir: row.tanggalLahir || "",
      alamat: row.alamat || "",
    });
    setEditFormError("");
    setShowEditModal(true);
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
                    maxLength={8}
                    value={form.nomorRm}
                    onChange={(e) => setForm((prev) => ({ ...prev, nomorRm: e.target.value.replace(/\D/g, "").slice(0, 8) }))}
                    placeholder="Contoh: 12345678"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <span className="mt-1 block text-[10px] text-slate-400">
                  Hanya angka 0–9, maksimal 8 digit ({form.nomorRm.length}/8)
                </span>
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
                    onChange={(e) => setForm((prev) => ({ ...prev, nik: e.target.value.replace(/\D/g, "").slice(0, 16) }))}
                    placeholder="16 Digit NIK KTP"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <span className="mt-1 block text-[10px] text-slate-400">
                  Wajib tepat 16 digit angka ({form.nik.length}/16)
                </span>
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
                        ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30"
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
                        ? "bg-pink-600 text-white shadow-sm ring-2 ring-pink-600/30"
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

      {/* Success / Feedback Alert */}
      {deleteSuccessMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="font-bold text-emerald-600">✓</span> {deleteSuccessMsg}
          </span>
          <button
            type="button"
            onClick={() => setDeleteSuccessMsg("")}
            className="text-emerald-600 hover:text-emerald-800 text-sm font-bold cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

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
                  const genderTheme = getGenderTheme(row.jenisKelamin);
                  const isDipinjam = Boolean(row.isDipinjam);

                  return (
                    <tr key={row.nomorRm} className={`align-top transition ${genderTheme.borderAccent} ${genderTheme.rowBg}`}>
                      {/* 1. No. RM */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleViewDetailFromTable(row)}
                          className={`font-bold hover:underline cursor-pointer tracking-wide ${genderTheme.rmText}`}
                        >
                          {row.nomorRm}
                        </button>
                      </td>

                      {/* 2. Nama Pasien & Informasi Pasien */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${genderTheme.avatarBg}`}
                          >
                            {getInitials(row.namaPasien)}
                          </div>
                          <div className="space-y-1.5 text-xs">
                            <div>
                              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Nama Pasien</span>
                              <span className="block font-semibold text-slate-900">{row.namaPasien}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Jenis Kelamin</span>
                              <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium ${genderTheme.pillBg}`}>
                                {row.jenisKelamin === "Laki-laki" && <Icons.Male />}
                                {row.jenisKelamin === "Perempuan" && <Icons.Female />}
                                {row.jenisKelamin || "Belum diketahui"}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Umur</span>
                              <span className="block text-slate-700">
                                {calculateAge(row.tanggalLahir) !== null ? `${calculateAge(row.tanggalLahir)} Tahun` : "-"}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tanggal Lahir</span>
                              <span className="block text-slate-700">{formatDateLahir(row.tanggalLahir)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Total Transaksi */}
                      <td className="px-6 py-4 text-center font-medium text-slate-700">
                        {row.totalTransaksi}
                      </td>

                      {/* 4. Status Fisik Berkas */}
                      <td className="px-6 py-4 text-center">
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewDetailFromTable(row)}
                            title="Lihat Detail Rekam Medis"
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 cursor-pointer"
                          >
                            <Icons.Eye />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditFromTable(row)}
                            title="Edit Data Pasien / RM"
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-yellow-200 bg-yellow-100 text-yellow-700 transition hover:bg-yellow-200 cursor-pointer"
                          >
                            <Icons.Edit />
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate("riwayat-rm", row.nomorRm)}
                            title="Buka Riwayat RM"
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 transition hover:bg-sky-100 cursor-pointer"
                          >
                            <Icons.History />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(row)}
                            title="Hapus Data RM"
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 cursor-pointer"
                          >
                            <Icons.Trash />
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
    if (!showSaveSuccessModal && !showDetailModal && !showEditModal && !showEditSuccessModal && !showDeleteModal) return null;

    return (
      <>
        {/* Modal Berhasil Edit */}
        <Modal
          isOpen={showEditSuccessModal}
          onClose={() => setShowEditSuccessModal(false)}
          onConfirm={() => setShowEditSuccessModal(false)}
          title="Data Berhasil Diperbarui"
          description="Perubahan data master pasien telah berhasil disimpan ke dalam sistem."
          confirmText="Selesai"
          cancelText={null}
          variant="success"
        />

        {/* Modal Konfirmasi Hapus Data RM */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            if (!isDeleting) {
              setShowDeleteModal(false);
              setDeleteTarget(null);
            }
          }}
          onConfirm={handleConfirmDelete}
          title="Hapus Data Rekam Medis"
          description={
            deleteTarget
              ? `Apakah Anda yakin ingin menghapus data RM "${deleteTarget.nomorRm}" (${deleteTarget.namaPasien})? Tindakan ini hanya dapat dilakukan jika RM belum memiliki riwayat transaksi.`
              : "Apakah Anda yakin ingin menghapus data RM ini?"
          }
          confirmText={isDeleting ? "Menghapus..." : "Hapus"}
          cancelText="Batal"
          variant="delete"
          isDanger={true}
          isLoading={isDeleting}
        />

        {(showSaveSuccessModal || showDetailModal || showEditModal) && (
          <div
            role="presentation"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
            onClick={() => {
              if (!isSaving && !isEditing) {
                setShowSaveSuccessModal(false);
                setShowDetailModal(false);
                setShowEditModal(false);
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

            {/* POPUP 2: DETAIL REKAM MEDIS (FIGMA IMAGE 3) */}
            {showDetailModal && selectedRm && !showEditModal && (() => {
              const detailTheme = getGenderTheme(selectedRm.jenisKelamin);
              return (
                <div
                  className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Top Badge */}
                  <div className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full ${detailTheme.avatarBg}`}>
                    {selectedRm.jenisKelamin === "Perempuan" ? <Icons.Female /> : selectedRm.jenisKelamin === "Laki-laki" ? <Icons.Male /> : <Icons.User />}
                  </div>

                  <h3 className="text-center text-xl font-bold text-slate-900">
                    {modalTitle}
                  </h3>

                  {/* Nomor RM Box */}
                  <div className={`mt-5 rounded-xl border p-4 text-center ${detailTheme.detailBoxBg}`}>
                    <span className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      NOMOR REKAM MEDIS (NO. RM)
                    </span>
                    <div className="mt-1 flex items-center justify-center gap-2">
                      <span className={`text-2xl font-bold font-mono tracking-wider ${detailTheme.accentText}`}>
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
                  <div className="mt-6 space-y-3 text-xs">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-slate-400">Nama Lengkap</span>
                      <span className="font-semibold text-slate-900 text-right">{selectedRm.namaPasien}</span>
                    </div>
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-slate-400">NIK</span>
                      <span className="font-semibold text-slate-900 text-right">{selectedRm.nik || "-"}</span>
                    </div>
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-slate-400">Jenis Kelamin</span>
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-semibold ${detailTheme.pillBg}`}>
                        {selectedRm.jenisKelamin === "Laki-laki" && <Icons.Male />}
                        {selectedRm.jenisKelamin === "Perempuan" && <Icons.Female />}
                        {selectedRm.jenisKelamin || "-"}
                      </span>
                    </div>
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-slate-400">Umur</span>
                      <span className="font-semibold text-slate-900 text-right">
                        {calculateAge(selectedRm.tanggalLahir) !== null ? `${calculateAge(selectedRm.tanggalLahir)} Tahun` : "-"}
                      </span>
                    </div>
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-slate-400">Tanggal Lahir</span>
                      <span className="font-semibold text-slate-900 text-right">{formatDateLahir(selectedRm.tanggalLahir)}</span>
                    </div>
                    <div className="flex items-start justify-between pb-2.5">
                      <span className="text-slate-400">Alamat</span>
                      <span className="max-w-[240px] font-semibold text-slate-900 text-right">
                        {selectedRm.alamat || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Buttons */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDetailModal(false);
                        handleDeleteClick(selectedRm);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 cursor-pointer"
                    >
                      <Icons.Trash />
                      <span>Hapus</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDetailModal(false);
                          onNavigate("riwayat-rm", selectedRm.nomorRm);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 cursor-pointer"
                      >
                        <Icons.History />
                        <span>Buka Riwayat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDetailModal(false);
                          if (view === "create") {
                            setView("list");
                          }
                        }}
                        className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 cursor-pointer"
                      >
                        Kembali
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditForm({
                            nomorRm: selectedRm.nomorRm,
                            namaPasien: selectedRm.namaPasien,
                            nik: selectedRm.nik || "",
                            jenisKelamin: selectedRm.jenisKelamin || "Laki-laki",
                            tanggalLahir: selectedRm.tanggalLahir || "",
                            alamat: selectedRm.alamat || "",
                          });
                          setEditFormError("");
                          setShowEditModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 cursor-pointer"
                      >
                        <Icons.Edit />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* POPUP 3: EDIT DATA PASIEN DARI DETAIL (Requirement 3) */}
            {showEditModal && (
              <div
                className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 text-yellow-700">
                      <Icons.Edit />
                    </span>
                    <h3 className="text-base font-bold text-slate-900">Edit Data Pasien / RM</h3>
                  </div>
                  <button
                    type="button"
                    disabled={isEditing}
                    onClick={() => setShowEditModal(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
                  >
                    ×
                  </button>
                </div>

                {editFormError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    {editFormError}
                  </div>
                )}

                <form onSubmit={handleEditSubmit} className="mt-4 space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700">Nomor Rekam Medis (Read-Only)</label>
                    <input
                      value={editForm.nomorRm}
                      disabled
                      readOnly
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 font-mono font-semibold text-slate-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700">Nama Lengkap Pasien *</label>
                    <input
                      value={editForm.namaPasien}
                      onChange={(e) => setEditForm({ ...editForm, namaPasien: e.target.value })}
                      required
                      disabled={isEditing}
                      placeholder="Nama Lengkap Pasien"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700">NIK (16 Digit Angka) *</label>
                    <input
                      value={editForm.nik}
                      onChange={(e) => setEditForm({ ...editForm, nik: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                      required
                      maxLength={16}
                      disabled={isEditing}
                      placeholder="3302123456780001"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                    <span className="mt-0.5 block text-[10px] text-slate-400">
                      Wajib 16 digit angka ({editForm.nik.length}/16)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block font-semibold text-slate-700">Jenis Kelamin *</label>
                      <select
                        value={editForm.jenisKelamin}
                        onChange={(e) => setEditForm({ ...editForm, jenisKelamin: e.target.value })}
                        disabled={isEditing}
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700">Tanggal Lahir *</label>
                      <input
                        type="date"
                        value={editForm.tanggalLahir}
                        onChange={(e) => setEditForm({ ...editForm, tanggalLahir: e.target.value })}
                        required
                        disabled={isEditing}
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700">Alamat Lengkap *</label>
                    <textarea
                      value={editForm.alamat}
                      onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
                      required
                      rows={2}
                      disabled={isEditing}
                      placeholder="Alamat domisili pasien"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="mt-5 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      disabled={isEditing}
                      onClick={() => setShowEditModal(false)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isEditing}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 cursor-pointer disabled:opacity-50"
                    >
                      <Icons.Check />
                      <span>{isEditing ? "Menyimpan..." : "Simpan"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </>
    );
  }
}

