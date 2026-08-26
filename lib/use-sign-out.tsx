"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"

import { useAuthStore } from "@/lib/auth-store"
import { useStellarWallet } from "@/lib/stellar-wallet"
import { usePollarWallet } from "@/lib/pollar-wallet"

/**
 * Signs out of all three auth systems, then returns home: the app JWT
 * (localStorage), the Kit wallet (sessionStorage) and the Pollar session.
 * Missing any one leaves the user signed in — keeping the Pollar session means
 * the next login silently resumes the old identity.
 *
 * One hook because this teardown was copy-pasted across four call sites and
 * drifted; three of them cleared nothing at all.
 */
export function useSignOut(): () => void {
  const router = useRouter()
  const { logout } = useAuthStore()
  const { disconnect } = useStellarWallet()
  const { logout: pollarLogout } = usePollarWallet()

  return useCallback(() => {
    // Independent: an extension refusing to disconnect must not leave the JWT.
    const steps: Array<[string, () => void]> = [
      ["app session", logout],
      ["wallet", disconnect],
      ["pollar", pollarLogout],
    ]

    for (const [name, run] of steps) {
      try {
        run()
      } catch (e) {
        console.warn(`[sign-out] could not clear the ${name}:`, e)
      }
    }

    router.push("/")
  }, [logout, disconnect, pollarLogout, router])
}
