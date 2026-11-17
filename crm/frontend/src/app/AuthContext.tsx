import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { setToken, getToken } from '../api/interceptors';
import { http } from '../api/client';
import { endpoints } from '../api/endpoints';
import type { Role } from '@aranax/contracts';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Start in loading state only if there's a persisted token to validate.
  const [loading, setLoading] = useState(() => getToken() != null);

  const login = useCallback((t: string, u: User) => {
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // On mount, if a token survived a refresh, restore the user from /auth/me.
  useEffect(() => {
    if (getToken() == null) return;
    let cancelled = false;
    http
      .get<User>(endpoints.auth.me)
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        // token invalid/expired — drop it silently
        if (!cancelled) setToken(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
