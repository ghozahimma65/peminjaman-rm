import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { LaporanRow, LaporanFilter } from "./database/laporanService";

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleString("id-ID");
  } catch {
    return dateStr;
  }
}

export async function exportToExcel(data: LaporanRow[]): Promise<boolean> {
  const filePath = await save({
    filters: [{
      name: 'Excel Workbook',
      extensions: ['xlsx']
    }],
    defaultPath: 'Laporan_Rekam_Medis.xlsx',
  });
  
  if (!filePath) return false;

  const worksheetData = data.map((row, index) => ({
    "No": index + 1,
    "No RM": row.nomorRm,
    "Nama Pasien": row.namaPasien,
    "Tgl Peminjaman": formatDateTime(row.tanggalPinjam),
    "Tgl Berkas Keluar": formatDateTime(row.tanggalBerkasKeluar),
    "Tgl Berkas Kembali": formatDateTime(row.tanggalBerkasKembali),
    "Peminjam": row.peminjamName || "",
    "Pengembali": row.pengembaliName || "",
    "Unit/Poli": row.unit,
    "Jilid": row.jilid || "",
    "Status": row.status
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  await writeFile(filePath, new Uint8Array(buffer));
  return true;
}

export async function exportToPdf(data: LaporanRow[], filters: LaporanFilter): Promise<boolean> {
  const filePath = await save({
    filters: [{
      name: 'PDF Document',
      extensions: ['pdf']
    }],
    defaultPath: 'Laporan_Rekam_Medis.pdf',
  });

  if (!filePath) return false;

  const doc = new jsPDF("landscape");
  
  doc.setFontSize(16);
  doc.text("Laporan Rekam Medis", 14, 15);
  
  doc.setFontSize(10);
  doc.text(`Periode: ${filters.startDate || '-'} s/d ${filters.endDate || '-'}`, 14, 22);
  doc.text(`Unit/Poli: ${filters.unit || 'Semua'} | Status: ${filters.status || 'Semua'}`, 14, 27);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 32);

  const tableColumn = ["No", "No RM", "Nama Pasien", "Tgl Pinjam", "Tgl Keluar", "Tgl Kembali", "Peminjam", "Pengembali", "Unit", "Status"];
  const tableRows = data.map((row, i) => [
    i + 1,
    row.nomorRm,
    row.namaPasien,
    formatDateTime(row.tanggalPinjam),
    formatDateTime(row.tanggalBerkasKeluar),
    formatDateTime(row.tanggalBerkasKembali),
    row.peminjamName || "",
    row.pengembaliName || "",
    row.unit,
    row.status
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 38,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  });

  const buffer = doc.output("arraybuffer");
  await writeFile(filePath, new Uint8Array(buffer));
  return true;
}
