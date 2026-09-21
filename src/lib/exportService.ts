import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import ExcelJS from "exceljs";
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

function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatPeriodText(startDate?: string, endDate?: string): string {
  if (startDate && endDate) {
    if (startDate === endDate) return formatDateIndo(startDate);
    return `${formatDateIndo(startDate)} s/d ${formatDateIndo(endDate)}`;
  }
  if (startDate) return formatDateIndo(startDate);
  if (endDate) return `s/d ${formatDateIndo(endDate)}`;
  return `01 Januari ${new Date().getFullYear()} s/d 31 Desember ${new Date().getFullYear()}`;
}

export async function exportToExcel(
  data: LaporanRow[],
  filters: LaporanFilter = {},
  officerInfo?: { name: string; nip: string }
): Promise<boolean> {
  const filePath = await save({
    filters: [{
      name: 'Excel Workbook',
      extensions: ['xlsx']
    }],
    defaultPath: `Laporan_Rekam_Medis_${new Date().toISOString().slice(0, 10)}.xlsx`,
  });

  if (!filePath) return false;

  const { tabelRuang, totalRuang } = computeSummaryTables(data);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RSISA Unit Rekam Medis";
  workbook.lastModifiedBy = officerInfo?.name || "Petugas Filing";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Laporan Rekapitulasi", {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    }
  });

  // Define Column Widths (A to M)
  worksheet.columns = [
    { key: 'colA', width: 6 },   // No
    { key: 'colB', width: 22 },  // Unit / Ruang
    { key: 'colC', width: 14 },  // Jlh Peminjaman
    { key: 'colD', width: 9 },   // %
    { key: 'colE', width: 14 },  // Jlh Pengembalian
    { key: 'colF', width: 9 },   // %
    { key: 'colG', width: 14 },  // Belum Dikembalikan
    { key: 'colH', width: 9 },   // %
    { key: 'colI', width: 12 },  // Tepat Waktu
    { key: 'colJ', width: 9 },   // %
    { key: 'colK', width: 12 },  // Terlambat
    { key: 'colL', width: 9 },   // %
    { key: 'colM', width: 14 },  // Keterangan
  ];

  const fontName = 'Times New Roman';

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
    right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  };

  const headerBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
  };

  const totalBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
    bottom: { style: 'double', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  };

  // Row 1: Hospital Name
  worksheet.mergeCells('A1:M1');
  const r1 = worksheet.getCell('A1');
  r1.value = "RUMAH SAKIT ISLAM SULTAN AGUNG";
  r1.font = { name: fontName, size: 14, bold: true };
  r1.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 2: Location
  worksheet.mergeCells('A2:M2');
  const r2 = worksheet.getCell('A2');
  r2.value = "SEMARANG";
  r2.font = { name: fontName, size: 12, bold: true };
  r2.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 3: Unit
  worksheet.mergeCells('A3:M3');
  const r3 = worksheet.getCell('A3');
  r3.value = "UNIT REKAM MEDIS / FILING";
  r3.font = { name: fontName, size: 9, bold: false };
  r3.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 4: Yellow Title Banner
  worksheet.mergeCells('A4:M4');
  const r4 = worksheet.getCell('A4');
  r4.value = "LAPORAN PEMINJAMAN DAN PENGEMBALIAN REKAM MEDIS";
  r4.font = { name: fontName, size: 11, bold: true };
  r4.alignment = { horizontal: 'center', vertical: 'middle' };
  r4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
  worksheet.getRow(4).height = 24;

  // Apply yellow background & border across merged cells A4:M4
  for (let col = 1; col <= 13; col++) {
    const cell = worksheet.getCell(4, col);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: col === 1 ? { style: 'thin', color: { argb: 'FF000000' } } : undefined,
      right: col === 13 ? { style: 'thin', color: { argb: 'FF000000' } } : undefined,
    };
  }

  // Row 5: Period
  worksheet.mergeCells('A5:M5');
  const r5 = worksheet.getCell('A5');
  r5.value = `Periode : ${formatPeriodText(filters.startDate, filters.endDate)}`;
  r5.font = { name: fontName, size: 9, italic: true };
  r5.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 6: Blank
  worksheet.getRow(6).height = 10;

  // Row 7: Section 1 Header Title
  const r7 = worksheet.getCell('A7');
  r7.value = "1. REKAPITULASI PEMINJAMAN DAN PENGEMBALIAN REKAM MEDIS";
  r7.font = { name: fontName, size: 10, bold: true };

  // Row 8: Table 1 Header
  const headersT1 = [
    "No", "Unit / Ruang", "Jumlah Peminjaman", "%",
    "Jumlah Pengembalian", "%", "Belum Dikembalikan", "%",
    "Tepat Waktu", "%", "Terlambat", "%", "Keterangan"
  ];
  const t1HeaderRow = worksheet.getRow(8);
  t1HeaderRow.height = 26;

  headersT1.forEach((h, idx) => {
    const cell = t1HeaderRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: fontName, size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF056839' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = headerBorder;
  });

  let currentRow = 9;

  // Table 1 Data Rows
  const totalDipinjam = totalRuang.jumlahDipinjam;
  const totalDikembalikan = totalRuang.jumlahDikembalikan;
  const totalBelumDikembalikan = totalRuang.belumDikembalikan;
  const totalTepatWaktu = totalRuang.tepatWaktu;
  const totalTerlambat = totalRuang.terlambat;

  tabelRuang.forEach((r) => {
    const row = worksheet.getRow(currentRow);
    row.height = 19;

    const values = [
      r.no,
      r.unit,
      r.jumlahDipinjam,
      totalDipinjam > 0 ? r.jumlahDipinjam / totalDipinjam : 0,
      r.jumlahDikembalikan,
      totalDikembalikan > 0 ? r.jumlahDikembalikan / totalDikembalikan : 0,
      r.belumDikembalikan,
      totalBelumDikembalikan > 0 ? r.belumDikembalikan / totalBelumDikembalikan : 0,
      r.tepatWaktu,
      totalTepatWaktu > 0 ? r.tepatWaktu / totalTepatWaktu : 0,
      r.terlambat,
      totalTerlambat > 0 ? r.terlambat / totalTerlambat : 0,
      r.keterangan || "-"
    ];

    values.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = val;
      cell.font = { name: fontName, size: 9 };
      cell.border = thinBorder;

      if (cIdx === 0 || cIdx === 12) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (cIdx === 1) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (cIdx % 2 === 1 && cIdx >= 3 && cIdx <= 11) {
        // Percentage columns (D, F, H, J, L)
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '0.0%';
      } else {
        // Count columns
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0';
      }
    });

    currentRow++;
  });

  // Table 1 Total Row
  const totalRow = worksheet.getRow(currentRow);
  totalRow.height = 20;

  const totalValues = [
    "",
    "TOTAL",
    totalDipinjam,
    totalDipinjam > 0 ? 1 : 0,
    totalDikembalikan,
    totalDikembalikan > 0 ? 1 : 0,
    totalBelumDikembalikan,
    totalBelumDikembalikan > 0 ? 1 : 0,
    totalTepatWaktu,
    totalTepatWaktu > 0 ? 1 : 0,
    totalTerlambat,
    totalTerlambat > 0 ? 1 : 0,
    "-"
  ];

  totalValues.forEach((val, cIdx) => {
    const cell = totalRow.getCell(cIdx + 1);
    cell.value = val;
    cell.font = { name: fontName, size: 9, bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF3EE' } };
    cell.border = totalBorder;

    if (cIdx === 1) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else if (cIdx % 2 === 1 && cIdx >= 3 && cIdx <= 11) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.numFmt = '0.0%';
    } else if (cIdx === 12) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.numFmt = '#,##0';
    }
  });

  currentRow += 2;

  // Section 2 & Section 3 Titles Side by Side
  const secTitleRow = currentRow;
  const s2Title = worksheet.getCell(secTitleRow, 1);
  s2Title.value = "2. REKAPITULASI STATUS BERKAS";
  s2Title.font = { name: fontName, size: 10, bold: true };

  const s3Title = worksheet.getCell(secTitleRow, 7);
  s3Title.value = "3. RINGKASAN REKAPITULASI";
  s3Title.font = { name: fontName, size: 10, bold: true };

  currentRow++;

  // Headers Section 2 (A-D) & Section 3 (G-J)
  const secHeaderRow = worksheet.getRow(currentRow);
  secHeaderRow.height = 24;

  const s2Headers = ["No", "Status Berkas", "Jumlah", "Persentase"];
  s2Headers.forEach((h, idx) => {
    const cell = secHeaderRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: fontName, size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF056839' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = headerBorder;
  });

  const s3Headers = ["Uraian", "Jumlah", "Persentase", "Jumlah"];
  s3Headers.forEach((h, idx) => {
    const cell = secHeaderRow.getCell(idx + 7);
    cell.value = h;
    cell.font = { name: fontName, size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF056839' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = headerBorder;
  });

  currentRow++;

  const totalStatusSum = totalDipinjam + totalDikembalikan + totalBelumDikembalikan + totalTerlambat;

  const s2Data = [
    { no: 1, status: "Berkas telah dipinjam", count: totalDipinjam },
    { no: 2, status: "Berkas telah dikembalikan", count: totalDikembalikan },
    { no: 3, status: "Berkas belum dikembalikan", count: totalBelumDikembalikan },
    { no: 4, status: "Berkas terlambat dikembalikan", count: totalTerlambat },
  ];

  const s3Data = [
    { uraian: "Total Berkas Dipinjam", count: totalDipinjam, pct: "-", qty: 1 },
    { uraian: "Total Berkas Dikembalikan", count: totalDikembalikan, pct: "-", qty: 1 },
    { uraian: "Total Berkas Belum Dikembalikan", count: totalBelumDikembalikan, pct: totalDipinjam > 0 ? totalBelumDikembalikan / totalDipinjam : 0, qty: 1 },
    { uraian: "Total Berkas Terlambat", count: totalTerlambat, pct: totalDipinjam > 0 ? totalTerlambat / totalDipinjam : 0, qty: 0 },
  ];

  for (let i = 0; i < 4; i++) {
    const row = worksheet.getRow(currentRow + i);
    row.height = 19;

    // Section 2 cells
    const d2 = s2Data[i];
    const c2No = row.getCell(1);
    c2No.value = d2.no;
    c2No.font = { name: fontName, size: 9 };
    c2No.alignment = { horizontal: 'center', vertical: 'middle' };
    c2No.border = thinBorder;

    const c2Status = row.getCell(2);
    c2Status.value = d2.status;
    c2Status.font = { name: fontName, size: 9 };
    c2Status.alignment = { horizontal: 'left', vertical: 'middle' };
    c2Status.border = thinBorder;

    const c2Count = row.getCell(3);
    c2Count.value = d2.count;
    c2Count.font = { name: fontName, size: 9 };
    c2Count.alignment = { horizontal: 'right', vertical: 'middle' };
    c2Count.numFmt = '#,##0';
    c2Count.border = thinBorder;

    const c2Pct = row.getCell(4);
    c2Pct.value = totalStatusSum > 0 ? d2.count / totalStatusSum : 0;
    c2Pct.font = { name: fontName, size: 9 };
    c2Pct.alignment = { horizontal: 'right', vertical: 'middle' };
    c2Pct.numFmt = '0.0%';
    c2Pct.border = thinBorder;

    // Section 3 cells
    const d3 = s3Data[i];
    const c3Uraian = row.getCell(7);
    c3Uraian.value = d3.uraian;
    c3Uraian.font = { name: fontName, size: 9 };
    c3Uraian.alignment = { horizontal: 'left', vertical: 'middle' };
    c3Uraian.border = thinBorder;

    const c3Count = row.getCell(8);
    c3Count.value = d3.count;
    c3Count.font = { name: fontName, size: 9 };
    c3Count.alignment = { horizontal: 'right', vertical: 'middle' };
    c3Count.numFmt = '#,##0';
    c3Count.border = thinBorder;

    const c3Pct = row.getCell(9);
    if (typeof d3.pct === 'number') {
      c3Pct.value = d3.pct;
      c3Pct.numFmt = '0.0%';
      c3Pct.alignment = { horizontal: 'right', vertical: 'middle' };
    } else {
      c3Pct.value = d3.pct;
      c3Pct.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    c3Pct.font = { name: fontName, size: 9 };
    c3Pct.border = thinBorder;

    const c3Qty = row.getCell(10);
    c3Qty.value = d3.qty;
    c3Qty.font = { name: fontName, size: 9 };
    c3Qty.alignment = { horizontal: 'center', vertical: 'middle' };
    c3Qty.border = thinBorder;
  }

  currentRow += 4;

  // Total row for Section 2
  const s2TotalRow = worksheet.getRow(currentRow);
  s2TotalRow.height = 20;

  const c2TotalLabel = s2TotalRow.getCell(2);
  c2TotalLabel.value = "TOTAL";
  c2TotalLabel.font = { name: fontName, size: 9, bold: true };
  c2TotalLabel.alignment = { horizontal: 'center', vertical: 'middle' };
  c2TotalLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF3EE' } };
  c2TotalLabel.border = totalBorder;

  const c2TotalBlank = s2TotalRow.getCell(1);
  c2TotalBlank.value = "";
  c2TotalBlank.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF3EE' } };
  c2TotalBlank.border = totalBorder;

  const c2TotalCount = s2TotalRow.getCell(3);
  c2TotalCount.value = totalStatusSum;
  c2TotalCount.font = { name: fontName, size: 9, bold: true };
  c2TotalCount.alignment = { horizontal: 'right', vertical: 'middle' };
  c2TotalCount.numFmt = '#,##0';
  c2TotalCount.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF3EE' } };
  c2TotalCount.border = totalBorder;

  const c2TotalPct = s2TotalRow.getCell(4);
  c2TotalPct.value = totalStatusSum > 0 ? 1 : 0;
  c2TotalPct.font = { name: fontName, size: 9, bold: true };
  c2TotalPct.alignment = { horizontal: 'right', vertical: 'middle' };
  c2TotalPct.numFmt = '0.0%';
  c2TotalPct.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF3EE' } };
  c2TotalPct.border = totalBorder;

  currentRow += 2;

  // Closing Note
  worksheet.mergeCells(`A${currentRow}:M${currentRow}`);
  const closeCell = worksheet.getCell(`A${currentRow}`);
  closeCell.value = "Demikian laporan ini dibuat dengan sebenar-benarnya untuk dapat digunakan sebagaimana mestinya sebagai dokumen rekapitulasi dan monitoring peminjaman serta pengembalian berkas rekam medis di Rumah Sakit Islam Sultan Agung.";
  closeCell.font = { name: fontName, size: 9 };
  closeCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  worksheet.getRow(currentRow).height = 28;

  currentRow += 2;

  // Signatures Section
  const dateRow = worksheet.getRow(currentRow);
  const dateCell = dateRow.getCell(9);
  dateCell.value = `Semarang, ${new Date().getFullYear()}`;
  dateCell.font = { name: fontName, size: 9 };

  currentRow++;

  const titleRow = worksheet.getRow(currentRow);
  const leftTitle = titleRow.getCell(2);
  leftTitle.value = "Mengetahui/Menyetujui";
  leftTitle.font = { name: fontName, size: 9, bold: true };

  const rightTitle = titleRow.getCell(9);
  rightTitle.value = "Petugas Pelapor";
  rightTitle.font = { name: fontName, size: 9, bold: true };

  currentRow++;

  const subTitleRow = worksheet.getRow(currentRow);
  const leftSub = subTitleRow.getCell(2);
  leftSub.value = "Kepala Unit Rekam Medis";
  leftSub.font = { name: fontName, size: 9 };

  const rightSub = subTitleRow.getCell(9);
  rightSub.value = "Petugas Filing";
  rightSub.font = { name: fontName, size: 9 };

  currentRow += 4; // Space for signature

  const nameRow = worksheet.getRow(currentRow);
  const leftName = nameRow.getCell(2);
  leftName.value = "(................................)";
  leftName.font = { name: fontName, size: 9, bold: true };

  const rightName = nameRow.getCell(9);
  rightName.value = officerInfo?.name ? `( ${officerInfo.name} )` : "(................................)";
  rightName.font = { name: fontName, size: 9, bold: true };

  currentRow++;

  const nipRow = worksheet.getRow(currentRow);
  const leftNip = nipRow.getCell(2);
  leftNip.value = "NIP/NIK ............................";
  leftNip.font = { name: fontName, size: 9 };

  const rightNip = nipRow.getCell(9);
  rightNip.value = officerInfo?.nip ? `NIP/NIK ${officerInfo.nip}` : "NIP/NIK ............................";
  rightNip.font = { name: fontName, size: 9 };

  const buffer = await workbook.xlsx.writeBuffer();
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

