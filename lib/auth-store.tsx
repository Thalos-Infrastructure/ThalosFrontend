"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type UserWallet = {
  publicKey: string;
  type?: string;
};

export type User = {
  id: string;
  email: string;
  name?: string;
  wallet?: UserWallet | null;
};

type AuthState = {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
};

const STORAGE_KEY = "thalos_auth_state";

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { user: User | null; token: string | null } | null;
        setUser(parsed?.user ?? null);
        setToken(parsed?.token ?? null);
      }
    } catch {
      // Ignore parse errors
    }
    setHydrated(true);
  }, []);

  const login = useCallback((newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: newUser, token: newToken }));
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, hydrated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthStore(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    // Return default state if used outside provider (for SSR compatibility)
    return {
      user: null,
      token: null,
      hydrated: false,
      login: () => {},
      logout: () => {},
    };
  }
  return context;
}
