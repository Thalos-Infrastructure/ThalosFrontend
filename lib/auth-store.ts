"use client";

// Re-export from auth-provider.tsx
export { useAuthStore, AuthProvider } from "./auth-provider";
export type { AuthUser, UserWallet } from "./auth-provider";
export type { AuthWallet, AuthResponse } from "./auth/types";
export { normalizeAuthUser } from "./auth/types";
