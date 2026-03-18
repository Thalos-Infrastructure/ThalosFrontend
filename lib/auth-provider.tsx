"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type UserWallet = {
  publicKey: string;
  provider: string;
};

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  wallet: UserWallet | null;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function useAuthStore(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthStore must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const login = useCallback((newUser: AuthUser, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_user", JSON.stringify(newUser));
      localStorage.setItem("auth_token", newToken);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("auth_user");
        const storedToken = localStorage.getItem("auth_token");
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (e) {
        console.error("Failed to hydrate auth state", e);
      }
      setHydrated(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, hydrated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
