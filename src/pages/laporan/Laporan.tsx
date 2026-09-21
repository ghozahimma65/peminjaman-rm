import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { useAuth } from "../../context/AuthContext";
import { LaporanFilter, LaporanRow, computeSummaryTables, getLaporanData } from "../../lib/database/laporanService";
import { exportToExcel, exportToPdf, formatErrorMessage } from "../../lib/exportService";

type ExportFormat = "excel" | "pdf";

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

function formatDateId(dateStr?: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function Laporan() {
  const { user } = useAuth();

  const getInitialDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  };

  const initialDates = getInitialDates();
  const [filters, setFilters] = useState<LaporanFilter>({
    unit: "Semua Ruang",
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
  });

  const [activePreset, setActivePreset] = useState<"30" | "month" | "90" | "365" | null>("30");
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [includeBorrowing, setIncludeBorrowing] = useState(true);
  const [includeReturn, setIncludeReturn] = useState(true);
  const [includeLate, setIncludeLate] = useState(false);

  const [data, setData] = useState<LaporanRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const res = await getLaporanData({
          unit: filters.unit === "Semua Ruang" ? "Semua" : filters.unit,
          startDate: filters.startDate,
          endDate: filters.endDate,
        });
        if (isMounted) {
          setData(res);
          setErrorMsg("");
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMsg((err as Error).message || "Gagal memuat data laporan.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    void fetchData();
    return () => {
      isMounted = false;
    };
  }, [filters.unit, filters.startDate, filters.endDate]);

  const handleUnitChange = (val: string) => {
    setFilters(prev => ({ ...prev, unit: val }));
  };

  const handleStartDateChange = (val: string) => {
    setActivePreset(null);
    setFilters(prev => ({ ...prev, startDate: val }));
  };

  const handleEndDateChange = (val: string) => {
    setActivePreset(null);
    setFilters(prev => ({ ...prev, endDate: val }));
  };

  const setQuickRange = (range: "30" | "month" | "90" | "365") => {
    setActivePreset(range);
    const end = new Date();
    const start = new Date();

    if (range === "month") {
      start.setDate(1);
    } else if (range === "30") {
      start.setDate(end.getDate() - 30);
    } else if (range === "90") {
      start.setDate(end.getDate() - 90);
    } else if (range === "365") {
      start.setDate(end.getDate() - 365);
    }

    setFilters(prev => ({
      ...prev,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    }));
  };

  const handleSelectAllComponents = () => {
    setIncludeBorrowing(true);
    setIncludeReturn(true);
    setIncludeLate(true);
  };

  const handleResetComponents = () => {
    setIncludeBorrowing(true);
    setIncludeReturn(true);
    setIncludeLate(false);
  };

  const handleExport = async () => {
    setShowExportConfirm(false);
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      setErrorMsg("Dari Tanggal tidak boleh lebih besar dari Sampai Tanggal.");
      return;
    }
    setIsExporting(true);
    setErrorMsg("");
    try {
      const officerInfo = {
        name: user?.name || "Petugas Rekam Medis",
        nip: user?.nip || "-",
      };

      const exported =
        format === "pdf"
          ? await exportToPdf(selectedData, filters, officerInfo)
          : await exportToExcel(selectedData, filters, officerInfo);

      if (exported) {
        setShowSuccess(true);
        window.setTimeout(() => setShowSuccess(false), 4000);
      }
    } catch (err: unknown) {
      const details = formatErrorMessage(err);
      setErrorMsg(`Gagal mengekspor laporan: ${details}`);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedData = data.filter(row => {
    if (row.status === "DIPINJAM" && !includeBorrowing) return false;
    if (row.status === "DIKEMBALIKAN" && !includeReturn) return false;
    if (row.status === "TERLAMBAT" && !includeLate) return false;
    return true;
  });

  const { tabelRuang, totalRuang, tabelStatus } = computeSummaryTables(selectedData);

  const inputClass =
    "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";
  const labelClass = "text-[11px] font-semibold text-slate-600";

  const renderA4Document = (isFull = false) => {
    const totalDipinjam = totalRuang.jumlahDipinjam;
    const totalDikembalikan = totalRuang.jumlahDikembalikan;
    const totalBelumDikembalikan = totalRuang.belumDikembalikan;
    const totalTepatWaktu = totalRuang.tepatWaktu;
    const totalTerlambat = totalRuang.terlambat;
    const totalStatusSum = totalDipinjam + totalDikembalikan + totalBelumDikembalikan + totalTerlambat;

    const calcPct = (num: number, denom: number) =>
      denom > 0 ? `${((num / denom) * 100).toFixed(1)}%` : "0.0%";

    return (
      <div
        className={`mx-auto bg-white font-serif text-slate-800 shadow-xl border border-slate-200 ${
          isFull ? "w-[840px] min-h-[1123px] p-10 text-[11px]" : "w-full max-w-[620px] min-h-[842px] p-6 text-[9px]"
        }`}
      >
        {/* Document Header */}
        <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-2">
          <div className="flex items-center gap-3">
            <img src="/logorsi.png" alt="RSI Sultan Agung" className={isFull ? "h-12 object-contain" : "h-9 object-contain"} />
          </div>
          <div className="text-center font-sans">
            <h1 className="text-sm font-bold text-slate-900 tracking-wide uppercase">RUMAH SAKIT ISLAM SULTAN AGUNG</h1>
            <h2 className="text-xs font-bold text-slate-800 uppercase">SEMARANG</h2>
            <p className="text-[9px] text-slate-600 font-medium">UNIT REKAM MEDIS / FILING</p>
          </div>
          <div className="text-right text-[8px] text-slate-500 leading-tight font-sans">
            <p className="font-semibold text-slate-700">Jl. Kaligawe Raya No. 4</p>
            <p>Telp. (024) 658 0015</p>
            <p className="text-emerald-700 font-medium">rsisultanagung.co.id</p>
          </div>
        </div>

        {/* Yellow Title Banner */}
        <div className="mt-3 bg-yellow-300 border border-slate-900 py-1.5 text-center font-sans font-bold text-slate-900 tracking-tight text-xs uppercase shadow-xs">
          LAPORAN PEMINJAMAN DAN PENGEMBALIAN REKAM MEDIS
        </div>

        {/* Intro & Period */}
        <p className="mt-2 text-center font-sans text-[10px] italic text-slate-700">
          Periode : {formatDateId(filters.startDate)} s/d {formatDateId(filters.endDate)}
        </p>

        {/* Section 1 */}
        <div className="mt-4">
          <h3 className="font-sans font-bold text-slate-900 mb-1.5 text-[10px] uppercase tracking-wide">
            1. REKAPITULASI PEMINJAMAN DAN PENGEMBALIAN REKAM MEDIS
          </h3>
          <table className="w-full border-collapse text-center font-sans border border-slate-400 text-[8.5px]">
            <thead>
              <tr className="bg-[#056839] text-white font-bold border-b border-slate-400">
                <th className="border border-slate-400 p-1 w-6">No</th>
                <th className="border border-slate-400 p-1 text-left">Unit / Ruang</th>
                <th className="border border-slate-400 p-1">Jumlah Peminjaman</th>
                <th className="border border-slate-400 p-1">%</th>
                <th className="border border-slate-400 p-1">Jumlah Pengembalian</th>
                <th className="border border-slate-400 p-1">%</th>
                <th className="border border-slate-400 p-1">Belum Dikembalikan</th>
                <th className="border border-slate-400 p-1">%</th>
                <th className="border border-slate-400 p-1">Tepat Waktu</th>
                <th className="border border-slate-400 p-1">%</th>
                <th className="border border-slate-400 p-1">Terlambat</th>
                <th className="border border-slate-400 p-1">%</th>
                <th className="border border-slate-400 p-1">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {tabelRuang.length === 0 ? (
                <tr>
                  <td colSpan={13} className="border border-slate-300 p-3 text-slate-400">
                    Tidak ada data untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                tabelRuang.map(r => (
                  <tr key={r.unit} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-1">{r.no}</td>
                    <td className="border border-slate-300 p-1 text-left font-medium">{r.unit}</td>
                    <td className="border border-slate-300 p-1">{r.jumlahDipinjam}</td>
                    <td className="border border-slate-300 p-1 text-slate-600">{calcPct(r.jumlahDipinjam, totalDipinjam)}</td>
                    <td className="border border-slate-300 p-1">{r.jumlahDikembalikan}</td>
                    <td className="border border-slate-300 p-1 text-slate-600">{calcPct(r.jumlahDikembalikan, totalDikembalikan)}</td>
                    <td className="border border-slate-300 p-1">{r.belumDikembalikan}</td>
                    <td className="border border-slate-300 p-1 text-slate-600">{calcPct(r.belumDikembalikan, totalBelumDikembalikan)}</td>
                    <td className="border border-slate-300 p-1">{r.tepatWaktu}</td>
                    <td className="border border-slate-300 p-1 text-slate-600">{calcPct(r.tepatWaktu, totalTepatWaktu)}</td>
                    <td className="border border-slate-300 p-1 text-red-600 font-medium">{r.terlambat}</td>
                    <td className="border border-slate-300 p-1 text-slate-600">{calcPct(r.terlambat, totalTerlambat)}</td>
                    <td className="border border-slate-300 p-1 text-slate-400">{r.keterangan || "-"}</td>
                  </tr>
                ))
              )}
              <tr className="bg-emerald-50/80 font-bold border-t-2 border-slate-500">
                <td className="border border-slate-400 p-1" colSpan={2}>
                  TOTAL
                </td>
                <td className="border border-slate-400 p-1">{totalDipinjam}</td>
                <td className="border border-slate-400 p-1">{totalDipinjam > 0 ? "100.0%" : "0.0%"}</td>
                <td className="border border-slate-400 p-1">{totalDikembalikan}</td>
                <td className="border border-slate-400 p-1">{totalDikembalikan > 0 ? "100.0%" : "0.0%"}</td>
                <td className="border border-slate-400 p-1">{totalBelumDikembalikan}</td>
                <td className="border border-slate-400 p-1">{totalBelumDikembalikan > 0 ? "100.0%" : "0.0%"}</td>
                <td className="border border-slate-400 p-1">{totalTepatWaktu}</td>
                <td className="border border-slate-400 p-1">{totalTepatWaktu > 0 ? "100.0%" : "0.0%"}</td>
                <td className="border border-slate-400 p-1 text-red-700">{totalTerlambat}</td>
                <td className="border border-slate-400 p-1">{totalTerlambat > 0 ? "100.0%" : "0.0%"}</td>
                <td className="border border-slate-400 p-1">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2 & Section 3 Side-by-Side */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-[8.5px]">
          {/* Section 2 */}
          <div>
            <h3 className="font-sans font-bold text-slate-900 mb-1 text-[9.5px] uppercase tracking-wide">
              2. REKAPITULASI STATUS BERKAS
            </h3>
            <table className="w-full border-collapse font-sans border border-slate-400">
              <thead>
                <tr className="bg-[#056839] text-white font-bold border-b border-slate-400">
                  <th className="border border-slate-400 p-1 w-6 text-center">No</th>
                  <th className="border border-slate-400 p-1 text-left">Status Berkas</th>
                  <th className="border border-slate-400 p-1 text-right w-14">Jumlah</th>
                  <th className="border border-slate-400 p-1 text-right w-16">Persentase</th>
                </tr>
              </thead>
              <tbody>
                {tabelStatus.map(s => (
                  <tr key={s.no} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-1 text-center">{s.no}</td>
                    <td className="border border-slate-300 p-1 font-medium">{s.statusBerkas}</td>
                    <td className="border border-slate-300 p-1 text-right">{s.jumlah}</td>
                    <td className="border border-slate-300 p-1 text-right">{calcPct(s.jumlah, totalStatusSum)}</td>
                  </tr>
                ))}
                <tr key="terlambat-status" className="hover:bg-slate-50">
                  <td className="border border-slate-300 p-1 text-center">4</td>
                  <td className="border border-slate-300 p-1 font-medium">Berkas terlambat dikembalikan</td>
                  <td className="border border-slate-300 p-1 text-right">{totalTerlambat}</td>
                  <td className="border border-slate-300 p-1 text-right">{calcPct(totalTerlambat, totalStatusSum)}</td>
                </tr>
                <tr className="bg-emerald-50/80 font-bold border-t-2 border-slate-500">
                  <td className="border border-slate-400 p-1 text-center" colSpan={2}>
                    TOTAL
                  </td>
                  <td className="border border-slate-400 p-1 text-right">{totalStatusSum}</td>
                  <td className="border border-slate-400 p-1 text-right">{totalStatusSum > 0 ? "100.0%" : "0.0%"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3 */}
          <div>
            <h3 className="font-sans font-bold text-slate-900 mb-1 text-[9.5px] uppercase tracking-wide">
              3. RINGKASAN REKAPITULASI
            </h3>
            <table className="w-full border-collapse font-sans border border-slate-400">
              <thead>
                <tr className="bg-[#056839] text-white font-bold border-b border-slate-400">
                  <th className="border border-slate-400 p-1 text-left">Uraian</th>
                  <th className="border border-slate-400 p-1 text-right w-14">Jumlah</th>
                  <th className="border border-slate-400 p-1 text-right w-16">Persentase</th>
                  <th className="border border-slate-400 p-1 text-center w-12">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-slate-50">
                  <td className="border border-slate-300 p-1 font-medium">Total Berkas Dipinjam</td>
                  <td className="border border-slate-300 p-1 text-right">{totalDipinjam}</td>
                  <td className="border border-slate-300 p-1 text-center">-</td>
                  <td className="border border-slate-300 p-1 text-center">1</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="border border-slate-300 p-1 font-medium">Total Berkas Dikembalikan</td>
                  <td className="border border-slate-300 p-1 text-right">{totalDikembalikan}</td>
                  <td className="border border-slate-300 p-1 text-center">-</td>
                  <td className="border border-slate-300 p-1 text-center">1</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="border border-slate-300 p-1 font-medium">Total Berkas Belum Dikembalikan</td>
                  <td className="border border-slate-300 p-1 text-right">{totalBelumDikembalikan}</td>
                  <td className="border border-slate-300 p-1 text-right">{calcPct(totalBelumDikembalikan, totalDipinjam)}</td>
                  <td className="border border-slate-300 p-1 text-center">1</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="border border-slate-300 p-1 font-medium">Total Berkas Terlambat</td>
                  <td className="border border-slate-300 p-1 text-right">{totalTerlambat}</td>
                  <td className="border border-slate-300 p-1 text-right">{calcPct(totalTerlambat, totalDipinjam)}</td>
                  <td className="border border-slate-300 p-1 text-center">0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Closing Note */}
        <p className="mt-4 text-justify leading-relaxed font-sans text-slate-700 text-[8.5px]">
          Demikian laporan ini dibuat dengan sebenar-benarnya untuk dapat digunakan sebagaimana mestinya sebagai dokumen
          rekapitulasi dan monitoring peminjaman serta pengembalian berkas rekam medis di Rumah Sakit Islam Sultan Agung.
        </p>

        {/* Signatures Block */}
        <div className="mt-6 flex justify-between items-start font-sans text-[9px]">
          <div className="text-left space-y-0.5">
            <p className="font-bold text-slate-900">Mengetahui/Menyetujui</p>
            <p className="text-slate-600">Kepala Unit Rekam Medis</p>
            <div className="h-10" />
            <p className="font-bold underline text-slate-900">( ________________________ )</p>
            <p className="text-slate-600">NIP. ____________________</p>
          </div>

          <div className="text-left space-y-0.5">
            <p className="text-slate-600 mb-0.5">
              Semarang, {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
            <p className="font-bold text-slate-900">Petugas Pelapor</p>
            <p className="text-slate-600">Petugas Filing / Rekam Medis</p>
            <div className="h-10" />
            <p className="font-bold underline text-slate-900">( {user?.name || "Petugas Rekam Medis"} )</p>
            <p className="text-slate-600">NIP. {user?.nip || "-"}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-right font-sans text-[7.5px] text-slate-400">Halaman 1 dari 1</div>
      </div>
    );
  };

  return (
    <div className="relative min-h-full space-y-4 pb-8 text-slate-800">
      {/* Page Header */}
      <div className="px-1">
        <h1 className="text-xl font-bold text-slate-900">Laporan</h1>
        <p className="mt-1 text-xs text-slate-500">Buat dan unduh laporan rekapitulasi peminjaman serta pengembalian.</p>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 shadow-sm">
          {errorMsg}
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
        {/* Left Column Controls */}
        <div className="space-y-4">
          {/* Card 1: PARAMETER PENYARINGAN DATA */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.06)]">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">PARAMETER PENYARINGAN DATA</h2>
            <div className="mt-4">
              <label className={labelClass}>Ruang</label>
              <select
                value={filters.unit}
                onChange={e => handleUnitChange(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                {RUANGAN_OPTIONS.map(room => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Card 2: RENTANG TANGGAL LAPORAN */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.06)]">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">RENTANG TANGGAL LAPORAN</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Dari Tanggal</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={e => handleStartDateChange(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Sampai Tanggal</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={e => handleEndDateChange(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <p className="mt-4 text-[10px] font-medium text-slate-500">Pilih Cepat Rentang Waktu (Preset):</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setQuickRange("30")}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                  activePreset === "30"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                30 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => setQuickRange("month")}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                  activePreset === "month"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setQuickRange("90")}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                  activePreset === "90"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                3 Bulan Terakhir
              </button>
              <button
                type="button"
                onClick={() => setQuickRange("365")}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                  activePreset === "365"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                1 Tahun Terakhir
              </button>
            </div>
          </section>

          {/* Bottom Row: Komponen Data & Format Unduhan File */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Card 3: KOMPONEN DATA */}
            <section className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.06)]">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">KOMPONEN DATA</h2>
                <div className="mt-4 space-y-2.5">
                  <label className="flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5 text-xs font-medium text-slate-700 cursor-pointer transition hover:bg-emerald-50">
                    <input
                      type="checkbox"
                      checked={includeBorrowing}
                      onChange={e => setIncludeBorrowing(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                    />
                    Data Transaksi Peminjaman
                  </label>
                  <label className="flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5 text-xs font-medium text-slate-700 cursor-pointer transition hover:bg-emerald-50">
                    <input
                      type="checkbox"
                      checked={includeReturn}
                      onChange={e => setIncludeReturn(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                    />
                    Data Transaksi Pengembalian
                  </label>
                  <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-medium text-slate-700 cursor-pointer transition hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={includeLate}
                      onChange={e => setIncludeLate(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                    />
                    Catatan Keterlambatan Berkas
                  </label>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllComponents}
                  className="rounded-lg bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={handleResetComponents}
                  className="rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
                >
                  Reset Pilihan
                </button>
              </div>
            </section>

            {/* Card 4: FORMAT UNDUHAN FILE */}
            <section className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.06)]">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">FORMAT UNDUHAN FILE</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {/* Excel Card */}
                  <button
                    type="button"
                    onClick={() => setFormat("excel")}
                    className={`relative flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition ${
                      format === "excel"
                        ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    {format === "excel" && (
                      <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-600" />
                    )}
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-lg">
                      X
                    </div>
                    <strong className="mt-2 text-xs font-bold text-slate-800">Microsoft Excel</strong>
                    <span className="text-[10px] text-slate-400 font-medium">(.xlsx)</span>
                  </button>

                  {/* PDF Card */}
                  <button
                    type="button"
                    onClick={() => setFormat("pdf")}
                    className={`relative flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition ${
                      format === "pdf"
                        ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    {format === "pdf" && (
                      <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-600" />
                    )}
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600 font-bold text-lg">
                      PDF
                    </div>
                    <strong className="mt-2 text-xs font-bold text-slate-800">Format PDF</strong>
                    <span className="text-[10px] text-slate-400 font-medium">(.pdf)</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowExportConfirm(true)}
                disabled={isExporting || isLoading}
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 text-xs font-bold text-white shadow-md hover:bg-emerald-900 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-sm">⇩</span>
                {isExporting ? "Mengekspor Data..." : "Unduh Laporan & Ekspor Data"}
              </button>
            </section>
          </div>
        </div>

        {/* Right Column: PREVIEW LAPORAN CETAK (A4) */}
        <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-900/95 shadow-[0_2px_6px_rgba(15,23,42,0.06)]">
          {/* Top Preview Bar */}
          <div className="flex items-center justify-between border-b border-slate-700/60 bg-slate-800/90 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-emerald-600 text-white text-xs">
                📄
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">PREVIEW LAPORAN CETAK (A4)</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowFullscreen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-600 hover:text-white transition"
            >
              <span>Buka Layar Penuh</span>
              <span className="text-[10px]">⤢</span>
            </button>
          </div>

          {/* Scrollable A4 Document Sheet */}
          <div className="flex flex-1 justify-center overflow-auto bg-slate-100 p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-xs text-slate-400 font-medium">
                Memuat preview laporan...
              </div>
            ) : (
              renderA4Document(false)
            )}
          </div>
        </section>
      </div>

      {/* Fullscreen Preview Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 z-[2000] flex flex-col bg-slate-950/90 backdrop-blur-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-white">
            <h2 className="text-sm font-bold tracking-wide">Preview Laporan Cetak (A4) - Layar Penuh</h2>
            <button
              type="button"
              onClick={() => setShowFullscreen(false)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              ✕ Tutup Layar Penuh
            </button>
          </div>
          <div className="flex-1 overflow-auto py-8 px-4 flex justify-center">{renderA4Document(true)}</div>
        </div>
      )}

      {/* Success Export Notification */}
      {showSuccess && (
        <div className="fixed right-6 top-20 z-[1001] w-80 rounded-xl border border-emerald-300 bg-white p-4 shadow-2xl transition">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
              ✓
            </span>
            <div>
              <strong className="text-xs font-bold text-slate-900">Berkas Berhasil Diekspor!</strong>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Laporan rekapitulasi .{format} telah selesai dibuat dan disimpan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={showExportConfirm}
        onClose={() => setShowExportConfirm(false)}
        onConfirm={() => void handleExport()}
        title="Unduh Laporan"
        description="Apakah Anda Yakin Untuk Mengunduh Berkas Laporan Ini?"
        confirmText="Ya"
        cancelText="Tidak"
        variant="download"
      />
    </div>
  );
}