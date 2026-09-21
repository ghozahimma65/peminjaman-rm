import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Icons } from "../../components/Icons";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { updateUserProfile, changeUserPassword } from "../../lib/auth/authService";
import { saveAvatarFile, getAvatarDisplayUrl, deleteAvatarFile } from "../../lib/auth/avatarService";

export function Profil() {
  const { user, setUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [name, setName] = useState(user?.name || "");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  // Ubah Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwErrorMsg, setPwErrorMsg] = useState("");
  const [pwSuccessMsg, setPwSuccessMsg] = useState("");
  const [isPwLoading, setIsPwLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync avatar URL with user.avatarPath
  useEffect(() => {
    let isMounted = true;
    async function loadCurrentAvatar() {
      if (user?.avatarPath) {
        const url = await getAvatarDisplayUrl(user.avatarPath);
        if (isMounted) setCurrentAvatarUrl(url);
      } else {
        if (isMounted) setCurrentAvatarUrl(null);
      }
    }
    loadCurrentAvatar();
    return () => { isMounted = false; };
  }, [user?.avatarPath]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("File harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran foto profil maksimal 5 MB.");
      return;
    }

    setErrorMsg("");
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemovePhoto(false);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemovePhoto(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setErrorMsg("");
    setSuccessMsg("");

    const newName = name.trim();

    if (!newName) {
      setErrorMsg("Nama Lengkap wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      let finalAvatarPath: string | null | undefined = user.avatarPath || null;

      if (removePhoto) {
        if (user.avatarPath) {
          deleteAvatarFile(user.avatarPath);
        }
        finalAvatarPath = null;
      } else if (selectedFile) {
        finalAvatarPath = await saveAvatarFile(selectedFile, user.id);
      }

      // 1. Update SQLite (mempertahankan email existing)
      await updateUserProfile(user.id, newName, user.email || null, finalAvatarPath);
      
      // 2. Update AuthContext & Session Store
      const updatedUser = {
        ...user,
        name: newName,
        avatarPath: finalAvatarPath,
      };

      await setUser(updatedUser);

      // Load updated avatar display URL
      if (finalAvatarPath) {
        const displayUrl = await getAvatarDisplayUrl(finalAvatarPath);
        setCurrentAvatarUrl(displayUrl);
      } else {
        setCurrentAvatarUrl(null);
      }

      setSelectedFile(null);
      setPreviewUrl(null);
      setRemovePhoto(false);

      setErrorMsg("");
      setSuccessMsg("Profil berhasil diperbarui.");
      setShowSuccessModal(true);
      setIsEditing(false);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Gagal memperbarui profil.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemovePhoto(false);
    setErrorMsg("");
    setSuccessMsg("");
    setIsEditing(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setPwErrorMsg("");
    setPwSuccessMsg("");

    if (!currentPassword) {
      setPwErrorMsg("Password lama wajib diisi.");
      return;
    }

    if (!newPassword) {
      setPwErrorMsg("Password baru wajib diisi.");
      return;
    }

    if (!confirmNewPassword) {
      setPwErrorMsg("Konfirmasi password baru wajib diisi.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPwErrorMsg("Konfirmasi password tidak sesuai.");
      return;
    }

    setIsPwLoading(true);

    try {
      await changeUserPassword(user.id, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPwSuccessMsg("Password berhasil diubah.");
      setShowSuccessModal(true);
    } catch (err: unknown) {
      setPwErrorMsg((err as Error).message || "Gagal mengubah password.");
    } finally {
      setIsPwLoading(false);
    }
  };

  if (!user) return null;

  const displayImageSrc = previewUrl || (!removePhoto ? currentAvatarUrl : null);

  return (
    <div className="space-y-6 pb-8" style={{ maxWidth: '640px', margin: '0 auto' }}>
      
      {/* Profil Card */}
      <div className="card p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
            <Icons.User />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 m-0">Profil Pengguna</h2>
            <p className="text-xs text-slate-500 m-0">Kelola informasi data diri Anda.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md mb-5 border border-red-200">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-md mb-5 border border-emerald-200">
            {successMsg}
          </div>
        )}

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-2xl overflow-hidden border-2 border-slate-300 shadow-md mb-3">
            {displayImageSrc ? (
              <img src={displayImageSrc} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{name ? name.charAt(0).toUpperCase() : "U"}</span>
            )}
          </div>

          {isEditing && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer disabled:opacity-50"
              >
                {displayImageSrc ? "Ganti Foto" : "Unggah Foto"}
              </button>
              {displayImageSrc && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleRemovePhoto}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 underline cursor-pointer disabled:opacity-50"
                >
                  Hapus Foto
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        <form onSubmit={handleSave}>
          <div className="flex flex-col gap-4 mb-6">
            
            <Input 
              label="NIP (Read Only)" 
              value={user.nip} 
              onChange={() => {}} 
              disabled={true} 
            />

            <Input 
              label="Role (Read Only)" 
              value={user.role} 
              onChange={() => {}} 
              disabled={true} 
            />

            <Input 
              label="Nama Lengkap *" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              disabled={!isEditing || isLoading} 
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            {isEditing ? (
              <>
                <Button type="button" variant="secondary" onClick={handleCancel} disabled={isLoading}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                  {isLoading ? "Menyimpan..." : "Simpan Profil"}
                </Button>
              </>
            ) : (
              <Button 
                type="button" 
                variant="primary" 
                onClick={() => { 
                  setErrorMsg(""); 
                  setSuccessMsg(""); 
                  setIsEditing(true); 
                }}
              >
                Edit Profil
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Ubah Password Card */}
      <div className="card p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 m-0">Ubah Password</h2>
            <p className="text-xs text-slate-500 m-0">Perbarui kata sandi akun Anda secara berkala untuk keamanan.</p>
          </div>
        </div>

        {pwErrorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md mb-5 border border-red-200">
            {pwErrorMsg}
          </div>
        )}

        {pwSuccessMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-md mb-5 border border-emerald-200">
            {pwSuccessMsg}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div className="flex flex-col gap-4 mb-6">
            <Input 
              label="Password Lama *" 
              type="password"
              value={currentPassword} 
              onChange={e => setCurrentPassword(e.target.value)} 
              disabled={isPwLoading} 
              placeholder="••••••••"
            />

            <Input 
              label="Password Baru *" 
              type="password"
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              disabled={isPwLoading} 
              placeholder="••••••••"
            />

            <Input 
              label="Konfirmasi Password Baru *" 
              type="password"
              value={confirmNewPassword} 
              onChange={e => setConfirmNewPassword(e.target.value)} 
              disabled={isPwLoading} 
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button type="submit" variant="primary" disabled={isPwLoading}>
              {isPwLoading ? "Memproses..." : "Ubah Password"}
            </Button>
          </div>
        </form>
      </div>

      {/* Success Modal Feedback */}
      <Modal
        isOpen={showSuccessModal}
        title="Data Berhasil Disimpan"
        description="Perubahan data profil akun Anda telah berhasil diperbarui dan tersimpan ke dalam sistem."
        confirmText="Selesai"
        cancelText="Lihat"
        variant="success"
        onClose={() => setShowSuccessModal(false)}
        onConfirm={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
