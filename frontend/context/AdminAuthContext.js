import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin]     = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAdminSession = async () => {
    setToken(null);
    setAdmin(null);
    await AsyncStorage.removeItem('adminToken');
    await AsyncStorage.removeItem('adminUser');
  };

  useEffect(() => {
    const rehydrate = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('adminToken');
        const storedAdmin = await AsyncStorage.getItem('adminUser');
        if (storedToken && storedAdmin) {
          setToken(storedToken);
          setAdmin(JSON.parse(storedAdmin));
        }
      } catch (_) {}
      setLoading(false);
    };
    rehydrate();
  }, []);

  const login = async (tokenValue, adminData) => {
    setToken(tokenValue);
    setAdmin(adminData);
    await AsyncStorage.setItem('adminToken', tokenValue);
    await AsyncStorage.setItem('adminUser', JSON.stringify(adminData));
  };

  const logout = async () => {
    await clearAdminSession();
  };

  return (
    <AdminAuthContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
