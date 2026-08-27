// API Clients for ThalosBackend
// All API calls go through the backend - no direct Supabase or Trustlesswork calls from frontend

export * from "./wallets"
export * from "./disputes"
export * from "./notifications"
export * from "./escrow"
export * from "./kyb"
export * from "./kyc"
export * from "./agreements"
export * from "./profiles"
export * from "./opportunities"
export * from "./applications"

// Re-export API_URL for convenience
export { API_URL } from "@/lib/config"
