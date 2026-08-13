/**
 * Session helpers shared by signing providers.
 *
 * Providers are plain (non-React) modules called from lib/agreementActions.ts,
 * so the active login is resolved from the same storage the app providers use:
 *  - AuthProvider persists the JWT user under localStorage "auth_user"
 *  - StellarWalletProvider persists the Kit address under sessionStorage
 */

import type { AuthWallet } from "@/lib/auth/types"
import { normalizeAuthUser } from "@/lib/auth/types"

const AUTH_USER_KEY = "auth_user"

/** sessionStorage key holding the externally connected Kit wallet address. */
export const STELLAR_WALLET_KEY = "thalos_stellar_address"

/** Wallet attached to the logged-in JWT user (embedded/social or Accesly), if any. */
export function getStoredAuthWallet(): AuthWallet | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    if (!raw) return null
    const user = normalizeAuthUser(JSON.parse(raw))
    return user?.wallet ?? null
  } catch {
    return null
  }
}
