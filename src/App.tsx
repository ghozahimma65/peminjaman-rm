import { useState, useEffect } from "react";
import "./App.css";

import { User } from "./types";
import { MENU_ITEMS } from "./constants";
import { Portal } from "./pages/Portal";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { LogLogin } from "./pages/LogLogin";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { Modal } from "./components/ui/Modal";
import { AjukanPeminjaman } from "./pages/peminjaman/AjukanPeminjaman";
import { DaftarPeminjaman } from "./pages/peminjaman/DaftarPeminjaman";
import { ProsesPengembalian } from "./pages/pengembalian/ProsesPengembalian";
import { DaftarPengembalian } from "./pages/pengembalian/DaftarPengembalian";
import { RiwayatRm } from "./pages/riwayat/RiwayatRm";
import { MasterDataRm } from "./pages/data-rm/MasterDataRm";
import { Profil } from "./pages/profil/Profil";
import { Laporan } from "./pages/laporan/Laporan";

import { initializeDatabase } from "./lib/database";
import { runSmokeTest } from "./lib/database/smokeTest";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SessionUser } from "./lib/auth/authService";

function AppContent() {
  const { user, setUser, isLoading: isAuthLoading, logout } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [prefillRm, setPrefillRm] = useState("");
  
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function setupDb() {
      // Trigger HMR
      try {
        await initializeDatabase();
        await runSmokeTest();
        setDbReady(true);
      } catch (err: unknown) {
        const errorMsg = typeof err === "string" ? err : (err as Error)?.message || JSON.stringify(err) || "Gagal inisialisasi database.";
        console.error("[DB Init Error]", errorMsg);
        setDbError(errorMsg as string);
      }
    }
    setupDb();
  }, []);

  const handleLoginSuccess = (sessionUser: SessionUser) => {
    setUser(sessionUser);
    setActivePage("dashboard");
  };

  const confirmLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
    setShowLogin(false);
    setShowRegister(false);
    setActivePage("dashboard");
  };

  if (dbError) {
    return <div style={{ padding: 40, color: 'red' }}>Error Database: {dbError}</div>;
  }

  if (!dbReady || isAuthLoading) {
    return <div style={{ padding: 40 }}>Memuat...</div>;
  }

  if (!user) {
    if (showRegister) {
      return (
        <Register 
          onBackToLogin={() => setShowRegister(false)} 
          onRegisterSuccess={() => setShowRegister(false)} 
        />
      );
    }
    if (showLogin) {
      return (
        <Login 
          onLogin={handleLoginSuccess} 
          onRegisterClick={() => setShowRegister(true)} 
        />
      );
    }
    return <Portal onEnter={() => setShowLogin(true)} />;
  }

  // Filter menus based on role
  const visibleMenuItems = MENU_ITEMS.filter(item => {
    if (item.adminOnly && user.role !== 'Super Admin') {
      return false;
    }
    return true;
  });

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard user={user} onNavigate={setActivePage} />;
      case "data-rm":
        return <MasterDataRm onNavigate={(page, nomorRm) => { setPrefillRm(nomorRm || ""); setActivePage(page); }} />;
      case "peminjaman-baru":
        return <AjukanPeminjaman onNavigate={setActivePage} initialNomorRm={prefillRm} />;
      case "daftar-peminjaman":
        return <DaftarPeminjaman onNavigate={setActivePage} />;
      case "proses-pengembalian":
        return <ProsesPengembalian onNavigate={setActivePage} />;
      case "berkas-belum-kembali":
        return <DaftarPengembalian />;
      case "riwayat-rm":
        return <RiwayatRm initialNomorRm={prefillRm} onNavigate={(page, nomorRm) => { setPrefillRm(nomorRm || ""); setActivePage(page); }} />;
      case "rekap-peminjaman":
        return <Laporan />;
      case "profil":
        return <Profil />;
      case "log-login":
        // This is a temporary placeholder since we don't have the real DB linked to LogLogin UI yet
        return user.role === "Super Admin" ? <LogLogin logs={[]} /> : <PlaceholderPage activePage={activePage} />;
      default:
        return <PlaceholderPage activePage={activePage} />;
    }
  };

  // Convert SessionUser to compatible User type for Layout
  const layoutUser: User = { 
    username: user.nip, 
    name: user.name, 
    role: user.role, 
    avatarPath: user.avatarPath 
  };

  return (
    <>
      <Modal
        isOpen={showLogoutConfirm}
        title="Logout"
        description="Apakah Anda Yakin Ingin Keluar Dari Sistem?"
        confirmText="Ya"
        cancelText="Tidak"
        variant="logout"
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
      />

      <Layout
        user={layoutUser}
        activePage={activePage}
        setActivePage={setActivePage}
        visibleMenuItems={visibleMenuItems}
        onLogoutClick={() => setShowLogoutConfirm(true)}
      >
        {renderContent()}
      </Layout>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
