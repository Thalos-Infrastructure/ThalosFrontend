import { describe, expect, it, vi } from "vitest"

import type { AuthState } from "@pollar/core"

import {
  LOGIN_TIMEOUT_MS,
  PollarLoginCancelledError,
  RESUME_TIMEOUT_MS,
  readAccessToken,
  waitForVerifiedSession,
  type AuthStateSource,
} from "./pollar-auth-state"

const IDLE: AuthState = { step: "idle" }
const OPENING: AuthState = { step: "opening_oauth", provider: "google" }
const CREATING: AuthState = { step: "creating_session" }
const TOKEN = "pollar.access.token"
const session = { token: { accessToken: TOKEN, refreshToken: "r", expiresAt: 1 } }
const READY = { step: "authenticated", verified: true, session } as unknown as AuthState
const OPTIMISTIC = { step: "authenticated", verified: false, session } as unknown as AuthState
const FAILED = { step: "error", previousStep: "opening_oauth", message: "popup blocked" } as AuthState

/**
 * Fake client reproducing the behaviour that matters: onAuthStateChange replays
 * the current state synchronously on subscribe.
 */
function makeClient(initial: AuthState) {
  let state = initial
  const listeners = new Set<(s: AuthState) => void>()

  const client: AuthStateSource = {
    getAuthState: () => state,
    onAuthStateChange: (cb: (s: AuthState) => void) => {
      listeners.add(cb)
      cb(state)
      return () => listeners.delete(cb)
    },
  } as AuthStateSource

  return {
    client,
    emit(next: AuthState) {
      state = next
      for (const cb of listeners) cb(next)
    },
    get listenerCount() {
      return listeners.size
    },
  }
}

describe("readAccessToken", () => {
  it("returns the token of the session this client holds", () => {
    // Read from the client, not from storage: several Pollar apps share
    // localhost's origin, so picking a `pollar:<hash>:session` key by shape
    // returns another app's token (rejected as SDK_TOKEN_WRONG_APPLICATION).
    expect(readAccessToken(makeClient(READY).client)).toBe(TOKEN)
  })

  it("returns the token even before the session is verified", () => {
    expect(readAccessToken(makeClient(OPTIMISTIC).client)).toBe(TOKEN)
  })

  it("returns null when unauthenticated", () => {
    expect(readAccessToken(makeClient(IDLE).client)).toBeNull()
    expect(readAccessToken(makeClient(OPENING).client)).toBeNull()
    expect(readAccessToken(makeClient(FAILED).client)).toBeNull()
  })

  it("returns null when the session carries no token", () => {
    const state = { step: "authenticated", verified: true, session: {} } as unknown as AuthState
    expect(readAccessToken(makeClient(state).client)).toBeNull()
  })
})

describe("waitForVerifiedSession", () => {
  it("does not abort on the idle state replayed at subscribe time", async () => {
    // The regression: idle is the STARTING state, and onAuthStateChange replays
    // it synchronously. Treating it as cancellation rejected the login before
    // the user could click anything.
    const c = makeClient(IDLE)
    const pending = waitForVerifiedSession(c.client)

    c.emit(OPENING)
    c.emit(READY)

    await expect(pending).resolves.toBeUndefined()
  })

  it("does not accept the previous session as a freshly started login", async () => {
    // Pollar's logout leaves the state machine on `authenticated` for a while,
    // so a login started right after one would otherwise be reported as
    // finished before it had opened — the pipeline then ran against the old
    // session and failed reading a token that had already gone.
    const c = makeClient(READY)
    const settled = vi.fn()
    const promise = waitForVerifiedSession(c.client, LOGIN_TIMEOUT_MS, {
      requireFresh: true,
    }).then(settled)

    await Promise.resolve()
    expect(settled).not.toHaveBeenCalled()

    // The real login gets underway and only then lands on its own session.
    c.emit(CREATING)
    c.emit(OPENING)
    await Promise.resolve()
    expect(settled).not.toHaveBeenCalled()

    c.emit(READY)
    await expect(promise).resolves.toBeUndefined()
  })

  it("still accepts the current session when resuming", async () => {
    // The mirror image: resume() exists to reuse the live session, so the same
    // state that must be ignored above must be honoured here.
    const c = makeClient(READY)
    await expect(waitForVerifiedSession(c.client, RESUME_TIMEOUT_MS)).resolves.toBeUndefined()
  })

  it("resolves immediately for an already verified session", async () => {
    const c = makeClient(READY)
    await expect(waitForVerifiedSession(c.client)).resolves.toBeUndefined()
    // Resolved from getAuthState, without subscribing at all.
    expect(c.listenerCount).toBe(0)
  })

  it("ignores a stale error left by a previous attempt", async () => {
    const c = makeClient(FAILED)
    const pending = waitForVerifiedSession(c.client)

    c.emit(OPENING)
    c.emit(READY)

    await expect(pending).resolves.toBeUndefined()
  })

  it("waits while an optimistically restored session is unverified", async () => {
    const c = makeClient(OPTIMISTIC)
    const pending = waitForVerifiedSession(c.client)
    const settled = vi.fn()
    void pending.then(settled, settled)

    await Promise.resolve()
    expect(settled).not.toHaveBeenCalled()

    c.emit(READY)
    await expect(pending).resolves.toBeUndefined()
  })

  it("reports a failure Pollar raised after the flow started", async () => {
    const c = makeClient(IDLE)
    const pending = waitForVerifiedSession(c.client)

    c.emit(OPENING)
    c.emit(FAILED)

    await expect(pending).rejects.toThrow(/popup blocked/)
  })

  it("treats a return to idle after starting as cancellation", async () => {
    const c = makeClient(IDLE)
    const pending = waitForVerifiedSession(c.client)

    c.emit(OPENING)
    c.emit(IDLE)

    await expect(pending).rejects.toBeInstanceOf(PollarLoginCancelledError)
  })

  it("cancels when the modal is closed without picking a provider", async () => {
    // Regression: openLoginModal() is pure React state and moves nothing in the
    // SDK, so the flow never leaves `idle`. Closing the modal calls
    // cancelLogin(), which emits idle again — and that is the only signal the
    // user backed out. Ignoring it left the caller's button stuck on its
    // loading label until the interactive timeout.
    const c = makeClient(IDLE)
    const pending = waitForVerifiedSession(c.client)

    c.emit(IDLE)

    await expect(pending).rejects.toBeInstanceOf(PollarLoginCancelledError)
  })

  it("unsubscribes once settled", async () => {
    const c = makeClient(IDLE)
    const pending = waitForVerifiedSession(c.client)

    c.emit(OPENING)
    expect(c.listenerCount).toBe(1)

    c.emit(READY)
    await pending
    expect(c.listenerCount).toBe(0)
  })

  it("ignores state changes arriving after it settled", async () => {
    const c = makeClient(IDLE)
    const pending = waitForVerifiedSession(c.client)

    c.emit(OPENING)
    c.emit(READY)
    await expect(pending).resolves.toBeUndefined()

    // A late cancellation must not turn an already-resolved login into a
    // rejection (which would surface as an unhandled rejection).
    expect(() => c.emit(IDLE)).not.toThrow()
  })

  describe("timeouts", () => {
    it("counts an abandoned modal as cancellation, not an error", async () => {
      vi.useFakeTimers()
      try {
        const c = makeClient(IDLE)
        const pending = waitForVerifiedSession(c.client)
        const caught = pending.catch((e) => e)

        // Never started: the user opened the modal and walked away.
        vi.advanceTimersByTime(LOGIN_TIMEOUT_MS + 1)
        await expect(caught).resolves.toBeInstanceOf(PollarLoginCancelledError)
      } finally {
        vi.useRealTimers()
      }
    })

    it("honours a shorter timeout, as the resume path passes", async () => {
      vi.useFakeTimers()
      try {
        // A restored-but-unverified session emits `authenticated` once and then
        // may never settle. Resuming must give up in seconds instead of parking
        // the caller on a loading screen for the interactive timeout.
        const c = makeClient(OPTIMISTIC)
        const pending = waitForVerifiedSession(c.client, RESUME_TIMEOUT_MS)
        const caught = pending.catch((e) => e)

        vi.advanceTimersByTime(RESUME_TIMEOUT_MS + 1)
        await expect(caught).resolves.toBeInstanceOf(PollarLoginCancelledError)
      } finally {
        vi.useRealTimers()
      }
    })

    it("reports a timeout when the flow started but never finished", async () => {
      vi.useFakeTimers()
      try {
        const c = makeClient(IDLE)
        const pending = waitForVerifiedSession(c.client)
        const caught = pending.catch((e) => e)

        c.emit(OPENING)
        vi.advanceTimersByTime(LOGIN_TIMEOUT_MS + 1)

        const err = await caught
        expect(err).toBeInstanceOf(Error)
        expect(err).not.toBeInstanceOf(PollarLoginCancelledError)
        expect((err as Error).message).toMatch(/timed out/)
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
