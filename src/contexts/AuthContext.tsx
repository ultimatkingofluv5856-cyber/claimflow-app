import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppUser, SessionData, login as authLogin, verifyToken, logout as authLogout, UserRole } from '@/lib/auth';

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isManagerOrAbove: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('claimsToken');
    if (savedToken) {
      verifyToken(savedToken).then(u => {
        if (u) {
          setUser(u);
          setToken(savedToken);
        } else {
          sessionStorage.removeItem('claimsToken');
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authLogin(email, password);
    if (result.ok && result.session) {
      setUser(result.session.user);
      setToken(result.session.token);
      sessionStorage.setItem('claimsToken', result.session.token);
      return { ok: true };
    }
    return { ok: false, message: result.message };
  }, []);

  const logout = useCallback(async () => {
    if (token) await authLogout(token);
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('claimsToken');
  }, [token]);

  const role = user?.role;
  const isAdmin = role === 'Admin' || role === 'Super Admin';
  const isManagerOrAbove = role === 'Manager' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isManagerOrAbove }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
