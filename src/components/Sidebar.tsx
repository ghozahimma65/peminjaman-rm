import type { ComponentType } from "react";
import { Icons } from "./Icons";
import { MenuItem } from "../types";

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string, nomorRm?: string) => void;
  visibleMenuItems: MenuItem[];
  onLogoutClick: () => void;
}

export function Sidebar({ activePage, setActivePage, visibleMenuItems, onLogoutClick }: SidebarProps) {
  const menuById = new Map(visibleMenuItems.map(item => [item.id, item]));
  const dashboard = menuById.get("dashboard");
  const DashboardIcon = dashboard?.icon;
  const menu: { label: string; items: Array<[string, string, ComponentType]> }[] = [
    { label: "PEMINJAMAN", items: [["peminjaman-baru", "Ajukan Peminjaman", Icons.PlusCircle], ["daftar-peminjaman", "Daftar Peminjaman", Icons.List]] },
    { label: "PENGEMBALIAN", items: [["proses-pengembalian", "Pengembalian RM", Icons.FileReturn], ["berkas-belum-kembali", "Daftar Pengembalian", Icons.Table]] },
    { label: "MASTER DATA", items: [["data-rm", "Data Pasien/RM", Icons.ClipboardData], ["riwayat-rm", "Riwayat RM", Icons.History]] },
    { label: "EXPORT DATA", items: [["rekap-peminjaman", "Laporan", Icons.FileText]] },
  ];

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-[80px] items-center border-b border-slate-100 px-7">
        <img src="/logorsi.png" alt="RSI Sultan Agung" className="w-[195px] object-contain" />
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        {DashboardIcon && <button type="button" onClick={() => setActivePage("dashboard")} className={`mb-7 flex h-[42px] w-full items-center gap-3 rounded-lg px-4 text-[13px] font-semibold ${activePage === "dashboard" ? "bg-emerald-100 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}><DashboardIcon />Dashboard</button>}
        {menu.map(group => (
          <div key={group.label} className="mb-7">
            <p className="mb-3 px-4 text-[11px] font-semibold tracking-wide text-slate-600">{group.label}</p>
            <div className="space-y-2">
              {group.items.map(([id, label, Icon]) => (
                <button key={`${group.label}-${label}`} type="button" onClick={() => setActivePage(id as string)} className={`flex w-full items-center gap-3 rounded-md px-4 py-2 text-left text-[13px] ${activePage === id ? "bg-emerald-100 font-semibold text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}><Icon /><span>{label}</span></button>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-0 pb-12">
        <button type="button" className="flex h-[42px] w-full items-center justify-center gap-2 rounded-md bg-red-50 text-[13px] font-semibold text-red-600 hover:bg-red-100" onClick={onLogoutClick}><Icons.Logout />Logout</button>
      </div>
    </aside>
  );
}
