"use client";

// Re-export from auth-provider.tsx
// This file exists for backwards compatibility with existing imports
// Updated: Force sync to GitHub
export { useAuthStore, AuthProvider } from "./auth-provider";
export type { AuthUser, UserWallet } from "./auth-provider";
