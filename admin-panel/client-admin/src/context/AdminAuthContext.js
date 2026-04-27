import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin]   = useState(null);
  const [token, setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('adminUser');
    if (!storedToken || !storedAdmin) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setLoading(false);
      return;
    }

    try {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
    } catch (_) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }

    setLoading(false);
  }, []);

  const login = (tokenValue, adminData) => {
    setToken(tokenValue);
    setAdmin(adminData);
    localStorage.setItem('adminToken', tokenValue);
    localStorage.setItem('adminUser', JSON.stringify(adminData));
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  return (
    <AdminAuthContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
