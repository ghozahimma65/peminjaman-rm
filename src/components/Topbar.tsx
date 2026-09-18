import { useState, useRef, useEffect } from "react";
import { Icons } from "./Icons";
import { User } from "../types";
import { NotificationPanel } from "./NotificationPanel";
import { MENU_ITEMS } from "../constants";
import { syncNotifications, getUnreadCount } from "../lib/database/notificationService";

interface TopbarProps {
  user: User;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogoutClick: () => void;
}

export function Topbar({ user, activePage, onNavigate, onLogoutClick }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const fetchUnread = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    async function sync() {
      try {
        await syncNotifications();
        await fetchUnread();
      } catch (e) {
        console.error("Sync notification failed", e);
      }
    }
    sync();
  }, [activePage]); // Re-sync when user navigates to a new page

  // Helper to find the active menu label
  const getActiveLabel = () => {
    for (const item of MENU_ITEMS) {
      if (item.id === activePage) return item.label;
      if (item.subItems) {
        const sub = item.subItems.find(s => s.id === activePage);
        if (sub) return sub.label;
      }
    }
    return "Dashboard";
  };

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-5 sm:px-7">
      {activePage === "dashboard" ? (
        <div><h2 className="text-lg font-bold text-slate-800">Selamat datang !</h2><p className="text-[10px] text-slate-500">Kelola peminjaman dan pengembalian rekam medis dengan mudah</p></div>
      ) : (
        <div className="flex items-center gap-1 text-[10px] text-slate-500"><span>Peminjaman</span><span>›</span><strong className="text-emerald-700">{getActiveLabel()}</strong></div>
      )}
      <div className="flex items-center gap-4">
        <div className="notification-wrapper" ref={notificationRef}>
          <button type="button"
            className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-white" 
            title="Notifikasi"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Icons.Bell />
            {unreadCount > 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />}
          </button>
          
          {showNotifications && (
            <NotificationPanel 
              onClose={() => setShowNotifications(false)} 
              onNavigate={onNavigate}
              onRead={fetchUnread}
            />
          )}
        </div>

        <div className="relative">
          <button type="button" className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white" onClick={() => setShowProfile(value => !value)} title="Buka profil">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">{user.name.charAt(0).toUpperCase()}</div>
            <div className="hidden text-left sm:block"><span className="block text-[10px] font-semibold text-slate-800">{user.name}</span><span className="block text-[9px] text-slate-500">{user.role}</span></div><Icons.ChevronDown />
          </button>
          {showProfile && <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900 text-xs font-bold text-white">{user.name.charAt(0).toUpperCase()}</div><div><p className="text-[11px] font-semibold text-slate-800">{user.name}</p><p className="text-[9px] text-slate-500">{user.role} <span className="text-emerald-600">• Online</span></p></div></div>
            <button type="button" className="flex w-full items-center gap-2 px-4 py-3 text-left text-[10px] text-slate-700 hover:bg-slate-50" onClick={() => { setShowProfile(false); onNavigate("profil"); }}><Icons.User />Lihat Profil Saya</button>
            <button type="button" className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-left text-[10px] text-red-600 hover:bg-red-50" onClick={onLogoutClick}><Icons.Logout />Logout</button>
          </div>}
        </div>
      </div>
    </header>
  );
}
