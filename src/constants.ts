import { Icons } from './components/Icons';
import { MenuItem } from './types';

export const DUMMY_USERS = [
  { username: 'superadmin', password: 'superadmin123', name: 'Super Administrator', role: 'Super Admin' },
  { username: 'admin', password: 'admin123', name: 'Admin / Petugas', role: 'Admin/Petugas' }
];

export const RUANGAN_OPTIONS = [
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

export const MENU_ITEMS: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Icons.Dashboard },
  { id: "data-rm", label: "Master Data RM", icon: Icons.DataRM },
  { 
    id: "peminjaman-group", 
    label: "Peminjaman", 
    icon: Icons.Peminjaman,
    subItems: [
      { id: "peminjaman-baru", label: "Peminjaman Baru" },
      { id: "daftar-peminjaman", label: "Daftar Peminjaman" }
    ]
  },
  { 
    id: "pengembalian-group", 
    label: "Pengembalian", 
    icon: Icons.Pengembalian,
    subItems: [
      { id: "berkas-belum-kembali", label: "Daftar Pengembalian" },
      { id: "proses-pengembalian", label: "Proses Pengembalian" }
    ]
  },
  { 
    id: "laporan-group", 
    label: "Laporan", 
    icon: Icons.Laporan,
    subItems: [{ id: "rekap-peminjaman", label: "Rekap Peminjaman" }]
  },
  { id: "log-login", label: "Log Login", icon: Icons.LogLogin, adminOnly: true },
  { id: "pengaturan", label: "Pengaturan", icon: Icons.Pengaturan, adminOnly: true },
];
