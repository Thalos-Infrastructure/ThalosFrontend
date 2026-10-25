"use client"

/**
 * Keeps signed-out visitors out of a page.
 *
 * Signing out clears everything it should — the app JWT, the Kit wallet and the
 * Pollar session — but nothing stopped the browser from going straight back to
 * `/dashboard/personal` afterwards. The page rendered its whole shell: no data,
 * because every fetch bails without a token, but to the person looking at it
 * the sign-out plainly did not work. There is no route protection anywhere; the
 * middleware only rewrites the OAuth callback.
 *
 * The redirect waits for `hydrated`. The token is read from localStorage after
 * mount, so acting on the first render would bounce anyone who simply reloaded
 * the page — trading a cosmetic bug for one that locks people out.
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"

export interface RequireAuthState {
  /** True once the session is known, whether or not there is one. */
  ready: boolean
  /** True when there is a session. */
  authenticated: boolean
}

export function useRequireAuth(redirectTo = "/"): RequireAuthState {
  const router = useRouter()
  const { token, hydrated } = useAuthStore()

  useEffect(() => {
    if (!hydrated || token) return
    router.replace(redirectTo)
  }, [hydrated, token, router, redirectTo])

  // `ready` stays false while redirecting, so callers can hold the render
  // instead of flashing a dashboard at someone on their way out.
  return { ready: hydrated && Boolean(token), authenticated: Boolean(token) }
}
