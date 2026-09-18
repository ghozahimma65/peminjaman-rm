import React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { User, MenuItem } from "../types";

interface LayoutProps {
  user: User;
  activePage: string;
  setActivePage: (page: string) => void;
  visibleMenuItems: MenuItem[];
  onLogoutClick: () => void;
  children: React.ReactNode;
}

export function Layout({ user, activePage, setActivePage, visibleMenuItems, onLogoutClick, children }: LayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        visibleMenuItems={visibleMenuItems} 
        onLogoutClick={onLogoutClick} 
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} activePage={activePage} onNavigate={setActivePage} onLogoutClick={onLogoutClick} />
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-5 sm:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
