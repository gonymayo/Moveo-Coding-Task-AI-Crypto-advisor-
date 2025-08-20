import { createContext, useCallback, useEffect, useState } from "react";
import { api } from "../api";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const setUserPatch = (patch) => setUser((prev) => ({ ...(prev || {}), ...patch }));

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoadingUser(false);
      return;
    }
    try {
      const me = await api.me();
      const parsedAssets = Array.isArray(me.cryptoAssets)
        ? me.cryptoAssets
        : JSON.parse(me.cryptoAssets || "[]");
      setUser({ ...me, cryptoAssets: parsedAssets });
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  return (
    <UserContext.Provider value={{ user, setUser, setUserPatch, loadMe, loadingUser }}>
      {children}
    </UserContext.Provider>
  );
}
