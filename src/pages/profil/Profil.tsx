import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Icons } from "../../components/Icons";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { updateUserProfile } from "../../lib/auth/authService";

export function Profil() {
  const { user, setUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");



  const validateEmail = (emailStr: string) => {
    if (!emailStr.trim()) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setErrorMsg("");
    setSuccessMsg("");

    const newName = name.trim();
    const newEmail = email.trim() || null;

    if (!newName) {
      setErrorMsg("Nama tidak boleh kosong.");
      return;
    }

    if (newEmail && !validateEmail(newEmail)) {
      setErrorMsg("Format email tidak valid.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Update SQLite
      await updateUserProfile(user.id, newName, newEmail);
      
      // 2. Update AuthContext & Session
      await setUser({
        ...user,
        name: newName,
        email: newEmail,
      });

      setSuccessMsg("Profil berhasil diperbarui.");
      setIsEditing(false);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name);
      setEmail(user.email || "");
    }
    setErrorMsg("");
    setSuccessMsg("");
    setIsEditing(false);
  };

  if (!user) return null;

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
            label="Nama" 
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
            placeholder="contoh@rs.com (opsional)"
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
            <Button type="button" variant="primary" onClick={() => setIsEditing(true)}>
              Edit Profil
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
