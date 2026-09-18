import React from "react";
import { Icons } from "../components/Icons";
import { MENU_ITEMS } from "../constants";
import { EmptyState } from "../components/ui/EmptyState";

export function PlaceholderPage({ activePage }: { activePage: string }) {
  const getActiveLabel = () => {
    for (const item of MENU_ITEMS) {
      if (item.id === activePage) return item.label;
      if (item.subItems) {
        const sub = item.subItems.find(s => s.id === activePage);
        if (sub) return sub.label;
      }
    }
    return "";
  };

  const getActiveIcon = () => {
    for (const item of MENU_ITEMS) {
      if (item.id === activePage) return item.icon;
      if (item.subItems && item.subItems.some(s => s.id === activePage)) {
        return item.icon; 
      }
    }
    return Icons.Dashboard;
  };

  const label = getActiveLabel();

  let description = "Fitur ini masih dalam antrean pengembangan.";
  if (activePage === "daftar-peminjaman") {
    description = "Data akan dihubungkan ke sistem database pada iterasi berikutnya.";
  }

  const title = label.startsWith("Modul") || label.startsWith("Daftar") || label.startsWith("Riwayat") || label.startsWith("Rekap") 
    ? label 
    : `Modul ${label}`;

  return (
    <EmptyState 
      icon={React.createElement(getActiveIcon())}
      title={title}
      description={description}
    />
  );
}
