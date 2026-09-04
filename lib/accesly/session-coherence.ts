import type { AuthUser } from "@/lib/auth/types"

/**
 * Decides whether the Accesly (Cognito) session must be closed to stay
 * coherent with the Thalos app session.
 *
 * Rule: close it ONLY on the transition "Thalos session backed by Accesly" →
 * "logged out" while the Accesly session is still alive. Anything else is a
 * no-op — in particular the login flow, where Cognito authenticates BEFORE
 * the Thalos JWT exists, must never be interrupted.
 */
export function shouldCloseAcceslySession(params: {
  /** Auth store finished hydrating from localStorage. */
  hydrated: boolean
  /** Previous render had a Thalos user backed by Accesly. */
  hadAcceslyUser: boolean
  /** Current Thalos user (null when logged out). */
  user: AuthUser | null
  /** Accesly SDK auth status. */
  acceslyStatus: "bootstrapping" | "anonymous" | "authenticated" | "expired"
}): boolean {
  if (!params.hydrated) return false
  if (!params.hadAcceslyUser) return false
  if (params.user) return false
  return params.acceslyStatus === "authenticated"
}

/** True when the Thalos session is backed by an Accesly wallet. */
export function isAcceslyBackedUser(user: AuthUser | null): boolean {
  return user?.wallet?.provider === "accesly"
}
