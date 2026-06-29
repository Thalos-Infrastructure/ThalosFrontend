"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type AuthUser, type AuthWallet, normalizeAuthUser } from "./auth/types";

export type { AuthUser, AuthWallet as UserWallet };

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
    if (typeof window === "undefined") return;

    const storedToken = localStorage.getItem("auth_token");
    if (!storedToken) {
      setHydrated(true);
      return;
    }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then((data) => {
        const normalized = normalizeAuthUser(data.user);
        if (!normalized) throw new Error("Invalid user payload");
        login(normalized, storedToken);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setHydrated(true);
      });
  }, [login, logout]);

  return (
    <AuthContext.Provider value={{ user, token, hydrated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
