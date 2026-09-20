import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { LaporanRow, LaporanFilter, computeSummaryTables } from "./database/laporanService";

export function formatErrorMessage(err: unknown): string {
  if (err === null || err === undefined) return "Terjadi kesalahan sistem tidak teridentifikasi.";
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim().length > 0) return err;
  if (typeof err === "object") {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message.trim().length > 0) return obj.message;
    if (typeof obj.error === "string" && obj.error.trim().length > 0) return obj.error;
    try {
      const json = JSON.stringify(err);
      if (json && json !== "{}") return json;
    } catch {
      // ignore
    }
  }
  return String(err) || "Terjadi kesalahan sistem.";
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleString("id-ID");
  } catch {
    return dateStr;
  }
}

async function loadLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch("/logorsi.png");
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportToExcel(data: LaporanRow[], filters: LaporanFilter = {}): Promise<boolean> {
  const filePath = await save({
    filters: [{
      name: 'Excel Workbook',
      extensions: ['xlsx']
    }],
    defaultPath: `Laporan_Rekam_Medis_${new Date().toISOString().slice(0, 10)}.xlsx`,
  });
  
  if (!filePath) return false;

  const { tabelRuang, totalRuang, tabelStatus, totalStatusCount } = computeSummaryTables(data);

  const excelRows: (string | number)[][] = [
    ["RUMAH SAKIT ISLAM SULTAN AGUNG SEMARANG"],
    ["LAPORAN REKAPITULASI DATA PEMINJAMAN DAN PENGEMBALIAN REKAM MEDIS"],
    [`NOMOR: 042/BA-REKAMMED/RSISA/${new Date().getFullYear()}`],
    [`Periode: ${filters.startDate || "-"} s/d ${filters.endDate || "-"}`],
    [`Ruang Filter: ${filters.unit || "Semua Ruang"}`],
    [],
    ["Tabel 1. Rekapitulasi Peminjaman dan Pengembalian Berkas Rekam Medis"],
    ["No", "Unit/Ruang", "Jumlah Dipinjam", "Jumlah Dikembalikan", "Belum Dikembalikan", "Tepat Waktu", "Terlambat", "Keterangan"],
  ];

  for (const r of tabelRuang) {
    excelRows.push([r.no, r.unit, r.jumlahDipinjam, r.jumlahDikembalikan, r.belumDikembalikan, r.tepatWaktu, r.terlambat, r.keterangan]);
  }
  excelRows.push(["", totalRuang.unit, totalRuang.jumlahDipinjam, totalRuang.jumlahDikembalikan, totalRuang.belumDikembalikan, totalRuang.tepatWaktu, totalRuang.terlambat, totalRuang.keterangan]);

  excelRows.push([]);
  excelRows.push(["Tabel 2. Rekapitulasi Status Berkas"]);
  excelRows.push(["No", "Status Berkas", "Jumlah"]);
  for (const s of tabelStatus) {
    excelRows.push([s.no, s.statusBerkas, s.jumlah]);
  }
  excelRows.push(["", "Total", totalStatusCount]);

  excelRows.push([]);
  excelRows.push(["Data Rincian Transaksi"]);
  excelRows.push(["No", "No RM", "Nama Pasien", "Tgl Peminjaman", "Tgl Berkas Keluar", "Tgl Berkas Kembali", "Peminjam", "Pengembali", "Ruangan Tujuan", "Jilid", "Status"]);

  data.forEach((row, index) => {
    excelRows.push([
      index + 1,
      row.nomorRm,
      row.namaPasien,
      formatDateTime(row.tanggalPinjam),
      formatDateTime(row.tanggalBerkasKeluar),
      formatDateTime(row.tanggalBerkasKembali),
      row.peminjamName || "",
      row.pengembaliName || "",
      row.unit,
      row.jilid || "",
      row.status
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(excelRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Rekapitulasi");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  await writeFile(filePath, new Uint8Array(buffer));
  return true;
}

export async function exportToPdf(data: LaporanRow[], filters: LaporanFilter, officerInfo?: { name: string; nip: string }): Promise<boolean> {
  const filePath = await save({
    filters: [{
      name: 'PDF Document',
      extensions: ['pdf']
    }],
    defaultPath: `Laporan_Rekam_Medis_${new Date().toISOString().slice(0, 10)}.pdf`,
  });

  if (!filePath) return false;

  const doc = new jsPDF("portrait", "mm", "a4");
  const logoBase64 = await loadLogoBase64();

  // Header Logo & Address
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 14, 10, 36, 14);
  }
  
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Jl. Kaligawe Raya No. 4 Semarang 50112", 196, 12, { align: "right" });
  doc.text("Telp. (024) 658 0015 | Fax. (024) 658 1928", 196, 16, { align: "right" });
  doc.text("www.rsisultanagung.co.id", 196, 20, { align: "right" });

  doc.setDrawColor(4, 120, 87); // Emerald 700
  doc.setLineWidth(0.8);
  doc.line(14, 26, 196, 26);

  // Title
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("LAPORAN REKAPITULASI DATA PEMINJAMAN", 105, 34, { align: "center" });
  doc.text("DAN PENGEMBALIAN REKAM MEDIS", 105, 39, { align: "center" });
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`NOMOR: 042/BA-REKAMMED/RSISA/${new Date().getFullYear()}`, 105, 45, { align: "center" });

  doc.setFontSize(9);
  doc.text("Menyatakan bahwa hasil rekapitulasi data peminjaman dan pengembalian berkas rekam medis adalah sebagai berikut:", 14, 53);
  doc.setFont("helvetica", "bold");
  doc.text(`Periode : ${filters.startDate || '-'} s/d ${filters.endDate || '-'}`, 105, 59, { align: "center" });

  const { tabelRuang, totalRuang, tabelStatus, totalStatusCount } = computeSummaryTables(data);

  // Tabel 1. Rekapitulasi Ruang
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Tabel 1. Rekapitulasi Peminjaman dan Pengembalian Berkas Rekam Medis", 14, 67);

  const t1Head = [["No", "Unit/Ruang", "Jumlah Dipinjam", "Jumlah Dikembalikan", "Belum Dikembalikan", "Tepat Waktu", "Terlambat", "Keterangan"]];
  const t1Body = tabelRuang.map(r => [
    r.no, r.unit, r.jumlahDipinjam, r.jumlahDikembalikan, r.belumDikembalikan, r.tepatWaktu, r.terlambat, r.keterangan
  ]);
  t1Body.push(["", totalRuang.unit, totalRuang.jumlahDipinjam, totalRuang.jumlahDikembalikan, totalRuang.belumDikembalikan, totalRuang.tepatWaktu, totalRuang.terlambat, totalRuang.keterangan]);

  autoTable(doc, {
    head: t1Head,
    body: t1Body,
    startY: 70,
    styles: { fontSize: 8, cellPadding: 2, halign: "center" },
    headStyles: { fillColor: [230, 244, 234], textColor: [20, 80, 50], fontStyle: "bold", lineWidth: 0.2, lineColor: [180, 210, 190] },
    bodyStyles: { lineWidth: 0.1, lineColor: [210, 210, 210] },
    columnStyles: { 1: { halign: "left" } }
  });

  let currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Tabel 2. Status Berkas
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Tabel 2. Rekapitulasi Status Berkas", 14, currentY);

  const t2Head = [["No", "Status Berkas", "Jumlah"]];
  const t2Body = tabelStatus.map(s => [s.no, s.statusBerkas, s.jumlah]);
  t2Body.push(["", "Total", totalStatusCount]);

  autoTable(doc, {
    head: t2Head,
    body: t2Body,
    startY: currentY + 3,
    styles: { fontSize: 8, cellPadding: 2, halign: "center" },
    headStyles: { fillColor: [230, 244, 234], textColor: [20, 80, 50], fontStyle: "bold", lineWidth: 0.2, lineColor: [180, 210, 190] },
    bodyStyles: { lineWidth: 0.1, lineColor: [210, 210, 210] },
    columnStyles: { 1: { halign: "left" } }
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Closing Note
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const closingText = "Demikian laporan ini dibuat dengan sebenar-benarnya untuk dapat digunakan sebagaimana mestinya sebagai dokumen rekapitulasi dan monitoring peminjaman serta pengembalian berkas rekam medis di Rumah Sakit Islam Sultan Agung.";
  doc.text(doc.splitTextToSize(closingText, 180), 14, currentY);

  currentY += 14;

  // Signatures
  const todayStr = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Semarang, ${todayStr}`, 145, currentY);
  currentY += 5;

  doc.setFont("helvetica", "bold");
  doc.text("Mengetahui/Menyetujui", 14, currentY);
  doc.text("Petugas Pelapor", 145, currentY);

  currentY += 4;
  doc.setFont("helvetica", "normal");
  doc.text("Kepala Unit Rekam Medis", 14, currentY);

  currentY += 16;
  doc.setFont("helvetica", "bold");
  doc.text("( ________________________ )", 14, currentY);
  doc.text(`( ${officerInfo?.name || "Petugas Rekam Medis"} )`, 145, currentY);

  currentY += 4;
  doc.setFont("helvetica", "normal");
  doc.text("NIP. ____________________", 14, currentY);
  doc.text(`NIP. ${officerInfo?.nip || "-"}`, 145, currentY);

  // Footer Page
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("Halaman 1 dari 1", 196, 285, { align: "right" });

  const buffer = doc.output("arraybuffer");
  await writeFile(filePath, new Uint8Array(buffer));
  return true;
}

