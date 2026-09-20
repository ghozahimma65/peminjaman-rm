import { useState, useRef } from "react";
import { Icons } from "../components/Icons";
import { registerUser } from "../lib/auth/authService";
import { saveAvatarFile } from "../lib/auth/avatarService";

interface RegisterProps {
  onBackToLogin: () => void;
  onRegisterSuccess?: () => void;
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

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export function Register({ onBackToLogin, onRegisterSuccess }: RegisterProps) {
  const [nip, setNip] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("File harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran foto maksimal 5 MB.");
      return;
    }

    setErrorMsg("");
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const nipTrim = nip.trim();
    const nameTrim = name.trim();
    const emailTrim = email.trim();

    // Validasi dasar
    if (!nipTrim) {
      setErrorMsg("NIP wajib diisi.");
      return;
    }
    if (!nameTrim) {
      setErrorMsg("Nama Lengkap wajib diisi.");
      return;
    }
    if (!emailTrim) {
      setErrorMsg("Email wajib diisi.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrim)) {
      setErrorMsg("Format email tidak valid.");
      return;
    }

    if (!password) {
      setErrorMsg("Password wajib diisi.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }

    setIsLoading(true);

    try {
      let savedAvatarPath: string | null = null;

      // Simpan foto jika ada pilihan file
      if (selectedFile) {
        savedAvatarPath = await saveAvatarFile(selectedFile, nipTrim);
      }

      // Register user (Role otomatis PETUGAS)
      await registerUser({
        nip: nipTrim,
        name: nameTrim,
        email: emailTrim,
        passwordPlain: password,
        avatarPath: savedAvatarPath,
      });

      setSuccessMsg("Pendaftaran berhasil! Mengalihkan ke halaman Login...");
      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess();
        } else {
          onBackToLogin();
        }
      }, 1500);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Terjadi kesalahan saat pendaftaran.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative py-8 sm:py-10 px-4 overflow-y-auto bg-[#164036] font-sans">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-15%] w-[800px] h-[800px] bg-[#2ca493] opacity-25 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#1e5c54] opacity-30 blur-[100px] rounded-full mix-blend-screen"></div>
      </div>

      {/* Header Section */}
      <div className="relative w-full max-w-[500px] flex justify-center mb-6 z-10">
        <img
          src="/logo-login.png"
          alt="RSI Sultan Agung"
          className="h-14 sm:h-16 w-auto object-contain select-none"
        />
      </div>

      {/* Register Card */}
      <div
        className="w-full max-w-[500px] bg-white rounded-lg shadow-2xl flex flex-col items-center pt-8 pb-8 px-6 sm:px-10 relative z-10 max-h-[85vh] overflow-y-auto"
      >
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-1 shrink-0 leading-none">Daftar Akun Baru</h2>
        <p className="text-xs text-gray-500 mb-6 shrink-0 text-center">
          Lengkapi formulir di bawah ini untuk membuat akun Petugas baru
        </p>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="w-full text-red-600 text-[13px] mb-4 text-center bg-red-50 py-2.5 px-3 rounded-md shrink-0 font-medium border border-red-200">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="w-full text-emerald-700 text-[13px] mb-4 text-center bg-emerald-50 py-2.5 px-3 rounded-md shrink-0 font-medium border border-emerald-200">
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-6 shrink-0">
            <div className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-emerald-600 flex items-center justify-center overflow-hidden mb-2 shadow-inner">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview Foto" className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <Icons.User />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline cursor-pointer disabled:opacity-50"
              >
                {previewUrl ? "Ubah Foto" : "Pilih Foto Profil"}
              </button>
              {previewUrl && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleRemovePhoto}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold underline cursor-pointer disabled:opacity-50"
                >
                  Hapus
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="text-[11px] text-gray-400 mt-1">Format: JPG, PNG, WEBP (Maks. 5 MB)</span>
          </div>

          {/* NIP Field */}
          <div className="flex flex-col mb-4 shrink-0">
            <label className="text-[13px] font-semibold text-gray-800 mb-1.5">
              Nomor Induk Pegawai (NIP) <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 flex items-center justify-center pointer-events-none text-gray-400">
                <IdBadgeIcon />
              </div>
              <input
                type="text"
                value={nip}
                onChange={e => setNip(e.target.value)}
                disabled={isLoading}
                placeholder="Contoh: 19850101201001"
                className="w-full h-11 bg-[#fdfdfd] border border-gray-300 rounded-md pl-12 pr-4 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#384e38] focus:ring-1 focus:ring-[#384e38] transition-all"
                required
              />
            </div>
          </div>

          {/* Nama Lengkap Field */}
          <div className="flex flex-col mb-4 shrink-0">
            <label className="text-[13px] font-semibold text-gray-800 mb-1.5">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 flex items-center justify-center pointer-events-none text-gray-400">
                <Icons.User />
              </div>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isLoading}
                placeholder="Masukkan nama lengkap beserta gelar"
                className="w-full h-11 bg-[#fdfdfd] border border-gray-300 rounded-md pl-12 pr-4 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#384e38] focus:ring-1 focus:ring-[#384e38] transition-all"
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="flex flex-col mb-4 shrink-0">
            <label className="text-[13px] font-semibold text-gray-800 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 flex items-center justify-center pointer-events-none text-gray-400">
                <MailIcon />
              </div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="contoh@rs-sultanagung.co.id"
                className="w-full h-11 bg-[#fdfdfd] border border-gray-300 rounded-md pl-12 pr-4 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#384e38] focus:ring-1 focus:ring-[#384e38] transition-all"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col mb-4 shrink-0">
            <label className="text-[13px] font-semibold text-gray-800 mb-1.5">
              Password <span className="text-red-500">*</span>
            </label>
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
                className="w-full h-11 bg-[#fdfdfd] border border-gray-300 rounded-md pl-12 pr-12 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#384e38] focus:ring-1 focus:ring-[#384e38] transition-all"
                required
              />
              <button
                type="button"
                className="absolute right-4 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <Icons.Eye /> : <Icons.EyeOff />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="flex flex-col mb-6 shrink-0">
            <label className="text-[13px] font-semibold text-gray-800 mb-1.5">
              Konfirmasi Password <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 flex items-center justify-center pointer-events-none text-gray-400">
                <LockIcon />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                placeholder="••••••••"
                className="w-full h-11 bg-[#fdfdfd] border border-gray-300 rounded-md pl-12 pr-4 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#384e38] focus:ring-1 focus:ring-[#384e38] transition-all"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#384e38] hover:bg-[#2c3d2c] text-white text-[15px] font-bold rounded-md transition-colors flex items-center justify-center disabled:opacity-70 shrink-0 cursor-pointer shadow-sm mb-4"
          >
            {isLoading ? "Memproses Pendaftaran..." : "Daftar Akun"}
          </button>

          {/* Back to Login */}
          <div className="text-center shrink-0">
            <span className="text-[13px] text-gray-600">Sudah punya akun? </span>
            <button
              type="button"
              disabled={isLoading}
              onClick={onBackToLogin}
              className="text-[13px] font-semibold text-[#2563eb] hover:underline cursor-pointer"
            >
              Masuk di sini
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
