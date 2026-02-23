import { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      api.get("/auth/me")
        .then(setUser)
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  const login  = (token, u) => { localStorage.setItem("token", token); setUser(u); };
  const logout = ()         => { localStorage.removeItem("token");      setUser(null); };
  const patch  = (data)     => setUser((prev) => ({ ...prev, ...data }));

  return (
    <Ctx.Provider value={{ user, ready, login, logout, patch }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
