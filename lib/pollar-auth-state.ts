/**
 * Waiting on Pollar's auth state machine (#108). Kept out of the React provider
 * so it can be tested directly — it is the subtlest part of the login flow.
 */

import type { AuthState, PollarClient } from "@pollar/core"

/** User backed out. Not an error to show, as with a closed Kit modal. */
export class PollarLoginCancelledError extends Error {
  constructor() {
    super("Pollar login was cancelled.")
    this.name = "PollarLoginCancelledError"
  }
}

/** Generous: 2FA sends a push the user must unlock a phone to confirm. */
export const LOGIN_TIMEOUT_MS = 10 * 60 * 1000

/** Resuming has no human in the loop, so a stale session must fail fast. */
export const RESUME_TIMEOUT_MS = 15 * 1000

/** Just enough of PollarClient to wait on, so tests need no full instance. */
export type AuthStateSource = Pick<PollarClient, "getAuthState" | "onAuthStateChange">

function isReady(state: AuthState): boolean {
  return state.step === "authenticated" && state.verified
}

/**
 * Token of the session THIS client holds, for the server to verify.
 *
 * From getAuthState(), not storage: several Pollar apps share localhost's
 * origin, so picking a `pollar:<hash>:session` key by shape returns another
 * app's token and fails as SDK_TOKEN_WRONG_APPLICATION.
 */
export function readAccessToken(client: AuthStateSource): string | null {
  const state = client.getAuthState()
  if (state.step !== "authenticated") return null

  const accessToken = state.session?.token?.accessToken
  return typeof accessToken === "string" && accessToken ? accessToken : null
}

/**
 * Resolves once the session is authenticated AND server-verified — a cold-start
 * session is restored optimistically, so `verified` is the gate, not
 * `isAuthenticated`. Rejects with PollarLoginCancelledError if the user backs
 * out, or a plain Error on failure or stall.
 */
export function waitForVerifiedSession(
  client: AuthStateSource,
  timeoutMs: number = LOGIN_TIMEOUT_MS,
  { requireFresh = false }: { requireFresh?: boolean } = {},
): Promise<void> {
  // Accepting the CURRENT session is right for a resume — that session is the
  // whole point. It is wrong for a login the user just started: a session left
  // over from a previous one (Pollar's logout does not clear the state machine
  // synchronously) would be read as "the login already succeeded", and the
  // pipeline would run to completion against stale data while the real login
  // was still opening. `requireFresh` waits for the state machine to leave
  // authenticated and come back, which every real login does.
  if (!requireFresh && isReady(client.getAuthState())) return Promise.resolve()

  return new Promise<void>((resolve, reject) => {
    let unsubscribe: (() => void) | undefined
    let settled = false
    /** Whether the flow got underway; only then is a timeout the user's problem. */
    let started = false
    let seenInitialEmission = false
    /** For requireFresh: the stale session is only cleared once we leave it. */
    let leftPreviousSession = !requireFresh || !isReady(client.getAuthState())

    const finish = (err?: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      unsubscribe?.()
      if (err) reject(err)
      else resolve()
    }

    const timer = setTimeout(() => {
      // Never started = modal opened and abandoned, not a timeout they caused.
      finish(
        started
          ? new Error("Pollar login timed out. Please try again.")
          : new PollarLoginCancelledError(),
      )
    }, timeoutMs)

    unsubscribe = client.onAuthStateChange((next) => {
      // onAuthStateChange replays the current state synchronously on subscribe.
      // That first emission is the pre-login state (idle, or a stale error);
      // acting on it aborts the login before the user can click anything.
      if (!seenInitialEmission) {
        seenInitialEmission = true
        if (isReady(next) && leftPreviousSession) finish()
        return
      }

      // A fresh login always moves off the old session (creating_session,
      // opening_oauth, …) before landing on a new one. Until that happens,
      // an `authenticated` reading is still the previous session.
      if (!isReady(next)) leftPreviousSession = true

      if (isReady(next) && leftPreviousSession) {
        finish()
        return
      }

      if (next.step === "error") {
        finish(new Error(next.message || "Pollar login failed."))
        return
      }

      // Any later idle means they backed out: closing the modal calls
      // cancelLogin(), which sets exactly this. Not gated on `started` —
      // openLoginModal() moves nothing in the SDK, so closing it without
      // picking a provider would otherwise leave this pending until timeout.
      if (next.step === "idle") {
        finish(new PollarLoginCancelledError())
        return
      }

      started = true
    })
  })
}
