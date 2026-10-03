"use client"

import { useStellarWallet } from "@/lib/stellar-wallet"
import { useAuthStore } from "@/lib/auth-store"
import { usePollarWallet } from "@/lib/pollar-wallet"

export function useCurrentAddress() {
  const { address: walletAddress } = useStellarWallet()
  const { user, token } = useAuthStore()

  const socialAddress = user?.wallet?.publicKey

  // The session's wallet wins. A Kit wallet connected on the side used to take
  // priority, from when signing in with a wallet was its own path. Since #108
  // every wallet — external ones included — arrives through Pollar and is
  // already on the session, so preferring another one meant creating the escrow
  // under a different address than the account the user signed in as.
  if (token && socialAddress) {
    return socialAddress
  }

  // With no session, a Kit wallet connected on the side is still worth reading.
  if (walletAddress) {
    return walletAddress
  }

  // Fallback
  return null
}

/**
 * True when an escrow operation can be SIGNED right now.
 *
 * Not the same as "there is a wallet": the Thalos JWT is good for 7 days and
 * the Pollar session is not, so checking only the JWT let the user walk the
 * entire wizard and fail at the signature with SDK_AUTH_INVALID_TOKEN — after
 * the escrow had already been built.
 */
export function useHasSigningWallet(): boolean {
  const { user, token } = useAuthStore()
  const { hasSession, sessionVerified } = usePollarWallet()

  if (!token || !user?.wallet?.publicKey) return false

  // Accesly signs with the key it reconstructs from the passkey, so it does not
  // go through Pollar at all.
  if (user.wallet.provider === "accesly") return true

  // Everything else signs through `PollarClient.signTx`. `sessionVerified`
  // because a session restored optimistically from storage cannot sign yet —
  // that is Pollar's own guidance for sensitive actions.
  return hasSession && sessionVerified
}

/**
 * Why signing is (un)available, so the UI does not show "wallet disconnected"
 * while Pollar is still confirming a session restored from storage:
 * - `ready`: can sign now
 * - `verifying`: session restored, server confirmation in flight
 * - `expired`: Thalos session alive but the Pollar session is gone — resume it
 * - `none`: nobody signed in with a wallet
 */
export type SigningWalletState = "ready" | "verifying" | "expired" | "none"

export function useSigningWalletState(): SigningWalletState {
  const { user, token, hydrated } = useAuthStore()
  const { hasSession, sessionVerified } = usePollarWallet()

  // AuthProvider starts with user = null and only fills it once /api/auth/me
  // answers. Reporting "none" in that window is what showed "Connect Wallet" on
  // the agreement detail to users whose custodial session was perfectly fine.
  if (!hydrated) return "verifying"
  if (!token || !user?.wallet?.publicKey) return "none"
  if (user.wallet.provider === "accesly") return "ready"
  if (hasSession && sessionVerified) return "ready"
  if (hasSession) return "verifying"
  return "expired"
}
