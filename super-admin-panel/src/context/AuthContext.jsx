import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session; reject anything that isn't a super_admin.
  useEffect(() => {
    const token = localStorage.getItem("super_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/api/admin/auth/me")
      .then(({ data }) => {
        if (data.admin?.role === "super_admin") setAdmin(data.admin);
        else localStorage.removeItem("super_token");
      })
      .catch(() => localStorage.removeItem("super_token"))
      .finally(() => setLoading(false));
  }, []);

  // Reuses the shared admin login, but only super_admins are allowed in here.
  const login = async (email, password) => {
    const { data } = await api.post("/api/admin/auth/login", { email, password });
    if (data.admin?.role !== "super_admin") {
      const e = new Error("This panel is for platform super admins only.");
      e.code = "NOT_SUPER";
      throw e;
    }
    localStorage.setItem("super_token", data.token);
    setAdmin(data.admin);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("super_token");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
