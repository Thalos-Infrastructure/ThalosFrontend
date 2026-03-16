"use client";

import { create } from "zustand";

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
  login: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
  hydrated: boolean;
};

const STORAGE_KEY = "thalos_auth_state";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ hydrated: true });
        return;
      }
      const parsed = JSON.parse(raw) as { user: User | null; token: string | null } | null;
      set({
        user: parsed?.user ?? null,
        token: parsed?.token ?? null,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },
  login: (user, token) => {
    set({ user, token });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    }
  },
  logout: () => {
    set({ user: null, token: null });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  },
}));

