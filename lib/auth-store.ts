// Re-export from auth-provider.tsx
// This file exists for backwards compatibility with existing imports
// Cache invalidation: v3 - sync fix
export { useAuthStore, AuthProvider } from "./auth-provider";
export type { AuthUser, UserWallet } from "./auth-provider";
