import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from a stored token on first load.
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/api/admin/auth/me")
      .then(({ data }) => {
        setAdmin(data.admin);
        setGym(data.gym);
      })
      .catch(() => localStorage.removeItem("admin_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/api/admin/auth/login", { email, password });
    localStorage.setItem("admin_token", data.token);
    setAdmin(data.admin);
    setGym(data.gym);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setAdmin(null);
    setGym(null);
  };

  return (
    <AuthContext.Provider value={{ admin, gym, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
