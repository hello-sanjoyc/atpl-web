import { apiClient } from './client';

const STORAGE_KEY = 'aranax_token';

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

let token: string | null = readStored();

export function setToken(t: string | null) {
  token = t;
  try {
    if (t) localStorage.setItem(STORAGE_KEY, t);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable (private mode) — token still works in-memory this session
  }
}

export function getToken() {
  return token;
}

apiClient.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 401) {
      setToken(null);
      const intended = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(intended)}`;
    }
    return Promise.reject(err);
  }
);
