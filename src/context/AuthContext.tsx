import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types.js';
import { api, getStoredToken, setStoredToken } from '../lib/api.js';

interface AuthContextType {
  admin: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (body: {
    full_name?: string;
    email?: string;
    phone_whatsapp?: string;
    current_password?: string;
    new_password?: string;
  }) => Promise<User>;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAdmin = async () => {
    const token = getStoredToken();
    if (!token) {
      setAdmin(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.user && res.user.role === 'admin') {
        setAdmin(res.user);
      } else {
        setStoredToken(null);
        setAdmin(null);
      }
    } catch {
      setStoredToken(null);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAdmin();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const res = await api.login(email, pass);
    setStoredToken(res.token);
    setAdmin(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setStoredToken(null);
      setAdmin(null);
    }
  };

  const updateProfile = async (body: {
    full_name?: string;
    email?: string;
    phone_whatsapp?: string;
    current_password?: string;
    new_password?: string;
  }): Promise<User> => {
    const res = await api.updateAdminProfile(body);
    setAdmin(res.user);
    return res.user;
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading,
        login,
        logout,
        updateProfile,
        refreshAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
