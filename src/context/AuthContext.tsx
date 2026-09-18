import React, { createContext, useContext, useState, useEffect } from "react";
import { Store, load } from "@tauri-apps/plugin-store";
import { SessionUser } from "../lib/auth/authService";

interface AuthContextType {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
  logout: async () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    async function initStore() {
      try {
        const s = await load("session.bin");
        setStore(s);
        
        const savedUser = await s.get<SessionUser>("user_session");
        if (savedUser) {
          setUserState(savedUser);
        }
      } catch (err) {
        console.error("Failed to load session store:", err);
      } finally {
        setIsLoading(false);
      }
    }
    initStore();
  }, []);

  const setUser = async (newUser: SessionUser | null) => {
    setUserState(newUser);
    if (store) {
      if (newUser) {
        await store.set("user_session", newUser);
      } else {
        await store.delete("user_session");
      }
      await store.save();
    }
  };

  const logout = async () => {
    await setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
