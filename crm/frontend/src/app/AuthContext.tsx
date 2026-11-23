import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { setToken, getToken } from '../api/interceptors';
import { http } from '../api/client';
import { endpoints } from '../api/endpoints';
import type { Permission, Role } from '@aranax/contracts';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  /** Live permissions for the current user, loaded from the DB. Null until loaded. */
  permissions: Set<Permission> | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  /** Force-reload permissions from the server (call after a super_admin role edit). */
  reloadPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

interface PermissionsResponse {
  data: {
    role: string;
    permissions: Array<{ permission: string; granted: boolean }>;
  };
}

async function fetchPermissions(role: string): Promise<Set<Permission>> {
  // super_admin always gets everything — skip the network call entirely
  if (role === 'super_admin') {
    const { PERMISSIONS } = await import('@aranax/contracts');
    return new Set(PERMISSIONS);
  }
  try {
    const res = await http.get<PermissionsResponse>(endpoints.auth.permissions);
    const data = (res.data as unknown as PermissionsResponse).data;
    return new Set<Permission>(
      data.permissions.filter((p) => p.granted).map((p) => p.permission as Permission),
    );
  } catch {
    return new Set<Permission>();
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Set<Permission> | null>(null);
  const [loading, setLoading] = useState(() => getToken() != null);

  const reloadPermissions = useCallback(async () => {
    if (!user) return;
    const p = await fetchPermissions(user.role);
    setPermissions(p);
  }, [user]);

  const login = useCallback(async (t: string, u: User) => {
    setToken(t);
    setUser(u);
    const p = await fetchPermissions(u.role);
    setPermissions(p);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setPermissions(null);
  }, []);

  // On mount, if a token survived a refresh, restore user + permissions.
  useEffect(() => {
    if (getToken() == null) return;
    let cancelled = false;
    http
      .get<User>(endpoints.auth.me)
      .then(async (u) => {
        if (cancelled) return;
        setUser(u);
        const p = await fetchPermissions(u.role);
        if (!cancelled) setPermissions(p);
      })
      .catch(() => {
        if (!cancelled) setToken(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout, reloadPermissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
