"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { type AuthUser, type AuthWallet, normalizeAuthUser } from "./auth/types"

export type { AuthUser, AuthWallet as UserWallet }

type AuthState = {
  user: AuthUser | null
  token: string | null
  hydrated: boolean
  login: (user: AuthUser, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function useAuthStore(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthStore must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const login = useCallback((newUser: AuthUser, newToken: string) => {
    setUser(newUser)
    setToken(newToken)
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_user", JSON.stringify(newUser))
      localStorage.setItem("auth_token", newToken)

      // Nest lists agreements via resolveUserWallets. If /api/auth/pollar's
      // server-side Nest persist failed, the session still has a Pollar address
      // in localStorage but Nest sees none — banner + 403. Best-effort custodial
      // link (no message signing; Pollar can't) once auth_user is on disk.
      const addr = newUser.wallet?.publicKey
      if (addr && newUser.wallet?.provider !== "accesly") {
        void import("@/lib/link-external-wallet")
          .then(({ linkExternalWalletWithProof }) =>
            linkExternalWalletWithProof(addr, newToken, "custodial"),
          )
          .then((result) => {
            if (result && !result.success) {
              console.warn("[auth] session wallet link failed:", result.error)
            }
          })
          .catch(() => {})
      }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_user")
      localStorage.removeItem("auth_token")
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const storedToken = localStorage.getItem("auth_token")
    if (!storedToken) {
      setHydrated(true)
      return
    }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token")
        return res.json()
      })
      .then((data) => {
        const normalized = normalizeAuthUser(data.user)
        if (!normalized) throw new Error("Invalid user payload")
        // /me falls back to provider "embedded" while the wallet_provider
        // migration is pending. If this session already knows a more specific
        // provider for the SAME wallet (e.g. "accesly"), keep it — signing is
        // dispatched by provider (#110), so losing it would break signing.
        try {
          const stored = normalizeAuthUser(JSON.parse(localStorage.getItem("auth_user") || "null"))
          if (
            normalized.wallet &&
            stored?.wallet &&
            stored.wallet.publicKey === normalized.wallet.publicKey &&
            normalized.wallet.provider === "embedded" &&
            stored.wallet.provider !== "embedded"
          ) {
            normalized.wallet = { ...normalized.wallet, provider: stored.wallet.provider }
          }
        } catch {
          // ignore malformed stored user
        }
        login(normalized, storedToken)
      })
      .catch(() => {
        logout()
      })
      .finally(() => {
        setHydrated(true)
      })
  }, [login, logout])

  return (
    <AuthContext.Provider value={{ user, token, hydrated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
