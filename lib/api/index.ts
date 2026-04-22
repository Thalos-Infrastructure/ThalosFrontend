// API Clients for ThalosBackend
// All API calls go through the backend - no direct Supabase or Trustlesswork calls from frontend

export * from "./wallets"
export * from "./disputes"
export * from "./notifications"
export * from "./escrow"

// Re-export API_URL for convenience
export { API_URL } from "@/lib/config"
