import { useState } from "react";
import { Icons } from "../components/Icons";
import { loginWithNip, SessionUser } from "../lib/auth/authService";

interface LoginProps {
  onLogin: (user: SessionUser) => void;
  onRegisterClick?: () => void;
}

const IdBadgeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="6" width="18" height="13" rx="2" ry="2" />
    <path d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" />
    <circle cx="12" cy="11" r="1.5" />
    <path d="M9.5 15.5c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    <circle cx="12" cy="16" r="1" />
  </svg>
);

export function Login({ onLogin, onRegisterClick }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!username || !password) {
      setLoginError("Username dan password wajib diisi.");
      return;
    }

    setIsLoading(true);
    try {
      const loggedInUser = await loginWithNip(username, password);
      onLogin(loggedInUser);
    } catch (err: unknown) {
      setLoginError((err as Error).message || "Username atau password salah.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative py-8 sm:py-10 px-4 overflow-y-auto bg-[#164036] font-sans">
      
      {/* Soft Teal Background Glow matching Figma */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-15%] w-[800px] h-[800px] bg-[#2ca493] opacity-25 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#1e5c54] opacity-30 blur-[100px] rounded-full mix-blend-screen"></div>
      </div>

      {/* Header Section */}
      <div className="relative w-full max-w-[480px] flex justify-center mb-7 sm:mb-8 z-10">
        {/* Plus Button Decoration */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden sm:block">
          <button 
            type="button"
            className="w-[40px] h-[40px] rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white backdrop-blur-sm transition-colors cursor-pointer"
            aria-label="Add"
          >
            <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Hospital Brand Logo */}
        <img
          src="/logo-login.png"
          alt="RSI Sultan Agung"
          className="h-14 sm:h-16 w-auto object-contain select-none"
        />
      </div>

      {/* Login Card */}
      <div
        className="w-full max-w-[480px] bg-white rounded-lg shadow-2xl flex flex-col items-center pt-10 sm:pt-11 pb-8 sm:pb-9 px-5 sm:px-10 relative z-10"
      >
        {/* User Avatar */}
        <div className="w-16 h-16 rounded-full bg-[#f8fafc] flex items-center justify-center mb-5 shrink-0 shadow-sm border border-gray-100">
          <div className="text-gray-600">
            <Icons.User />
          </div>
        </div>

        {/* Login Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-7 shrink-0 leading-none">Login</h2>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col mx-auto">
          {/* Error Message */}
          {loginError && (
            <div className="text-red-600 text-[13px] mb-4 text-center bg-red-50 py-2.5 px-3 rounded-md shrink-0 font-medium border border-red-200">
              {loginError}
            </div>
          )}

          {/* NIP Field */}
          <div className="flex flex-col mb-5 shrink-0">
            <label className="text-[13px] font-semibold text-gray-800 mb-2">
              Username/Nomor Induk Pegawai (NIP)
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 flex items-center justify-center pointer-events-none text-gray-400">
                <IdBadgeIcon />
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={isLoading}
                placeholder="Masukkan NIP Anda"
                className="w-full h-11 bg-[#fdfdfd] border border-gray-300 rounded-md pl-12 pr-4 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#384e38] focus:ring-1 focus:ring-[#384e38] transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col mb-5 shrink-0">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[13px] font-semibold text-gray-800">Password</label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[13px] font-semibold text-[#2563eb] hover:underline cursor-pointer"
              >
                Lupa Password?
              </button>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-4 flex items-center justify-center pointer-events-none text-gray-400">
                <LockIcon />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="••••••••"
                className="w-full h-11 bg-[#fdfdfd] border border-gray-300 rounded-md pl-12 pr-12 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#384e38] focus:ring-1 focus:ring-[#384e38] transition-all tracking-widest"
              />
              <button
                type="button"
                className="absolute right-4 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Icons.Eye /> : <Icons.EyeOff />}
              </button>
            </div>
          </div>

          {/* Ingat Saya */}
          <div className="flex items-center mb-6 shrink-0">
            <input
              type="checkbox"
              id="remember"
              className="w-4 h-4 text-[#384e38] border-gray-300 rounded-[3px] focus:ring-[#384e38] cursor-pointer"
            />
            <label htmlFor="remember" className="ml-[10px] text-[13px] text-gray-600 font-medium cursor-pointer select-none">
              Ingat Saya
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#384e38] hover:bg-[#2c3d2c] text-white text-[15px] font-bold rounded-md transition-colors flex items-center justify-center disabled:opacity-70 shrink-0 cursor-pointer shadow-sm mx-auto mb-5"
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>

          {/* Divider */}
          <hr className="border-t border-slate-200 shrink-0 w-full mb-5" />

          {/* Register Link Footer Section */}
          <div className="text-center shrink-0 w-full">
            <span className="text-[13px] text-slate-600">Belum punya akun? </span>
            <button
              type="button"
              disabled={isLoading}
              onClick={onRegisterClick}
              className="text-[13px] font-bold text-[#2563eb] hover:text-[#1d4ed8] hover:underline cursor-pointer"
            >
              Daftar Akun Baru
            </button>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Lupa Password?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Aplikasi ini berjalan secara lokal/offline. Untuk keamanan, pemulihan password dilakukan melalui Administrator Sistem (Super Admin).
            </p>
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded-md mb-5">
              Silakan hubungi Super Admin di unit Rekam Medis untuk melakukan reset password akun NIP Anda.
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 bg-[#384e38] text-white text-sm font-semibold rounded-md hover:bg-[#2c3d2c] cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

