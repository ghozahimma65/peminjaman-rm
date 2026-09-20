import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Icons } from "../../components/Icons";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { updateUserProfile } from "../../lib/auth/authService";
import { saveAvatarFile, getAvatarDisplayUrl, deleteAvatarFile } from "../../lib/auth/avatarService";

export function Profil() {
  const { user, setUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

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

  const validateEmail = (emailStr: string) => {
    if (!emailStr.trim()) return false; // Email mandatory based on requirement
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

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
    const newEmail = email.trim();

    if (!newName) {
      setErrorMsg("Nama lengkap wajib diisi.");
      return;
    }

    if (!newEmail) {
      setErrorMsg("Email wajib diisi.");
      return;
    }

    if (!validateEmail(newEmail)) {
      setErrorMsg("Format email tidak valid.");
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

      // 1. Update SQLite
      await updateUserProfile(user.id, newName, newEmail, finalAvatarPath);
      
      // 2. Update AuthContext & Session Store
      const updatedUser = {
        ...user,
        name: newName,
        email: newEmail,
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
      setEmail(user.email || "");
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemovePhoto(false);
    setErrorMsg("");
    setSuccessMsg("");
    setIsEditing(false);
  };

  if (!user) return null;

  const displayImageSrc = previewUrl || (!removePhoto ? currentAvatarUrl : null);

  return (
    <div className="card p-6" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Icons.User />
        <h2 style={{ margin: 0 }}>Profil Pengguna</h2>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '24px' }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '12px', background: '#ecfdf5', color: '#047857', borderRadius: '4px', marginBottom: '24px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          
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
            label="Nama Lengkap" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            disabled={!isEditing || isLoading} 
            placeholder="Masukkan nama lengkap"
          />

          <Input 
            label="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            disabled={!isEditing || isLoading} 
            placeholder="contoh@rs-sultanagung.co.id"
            type="email"
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
  );
}
