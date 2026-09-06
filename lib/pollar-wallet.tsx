"use client"

/**
 * Every Pollar login Thalos offers (#108), each driven directly so Thalos's own
 * modal stays the only UI: Google, GitHub, email OTP, and a self-custodied
 * wallet connected through Pollar's Stellar Wallets Kit adapter. Pollar's own
 * login modal is never opened.
 *
 * Mirrors lib/stellar-wallet.tsx. Downstream needs no changes:
 * useCurrentAddress() already resolves the JWT user's wallet and lib/signing
 * dispatches to providers/social.ts.
 *
 * The login flow reads progress from the PollarClient, never from usePollar()'s
 * context values — those are per-render snapshots an awaiting callback would
 * never see update. Context is for rendering only (see `fundingMode`).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { PollarProvider, usePollar } from "@pollar/react"
// Required: PollarProvider renders its own modal, and `.pollar-overlay` carries
// its position/z-index. Without this it mounts invisible, behind our own modal.
import "@pollar/react/styles.css"
import type { AuthState, PollarClient } from "@pollar/core"
import { POLLAR_ENABLED, TRUSTLINE_USDC, type PollarLoginProvider } from "@/lib/config"
import { ensurePollarClient, getPollarClient } from "@/lib/pollar-client"
import {
  PollarLoginCancelledError,
  RESUME_TIMEOUT_MS,
  readAccessToken,
  waitForVerifiedSession,
} from "@/lib/pollar-auth-state"
import { loginWithPollar, PollarWalletNotReadyError } from "@/lib/api/pollar-auth"
import { useAuthStore } from "@/lib/auth-store"
import { getOrCreateProfile, getProfileByWallet, type Profile } from "@/lib/actions/profile"

/** Whether the account's wallet is funded now or only once KYB clears. */
export type FundingMode = "immediate" | "deferred"

/** Resuming found no profile, so the account type has to be asked for again. */
class PollarProfileMissingError extends Error {
  constructor() {
    super("No Thalos profile for this wallet.")
    this.name = "PollarProfileMissingError"
  }
}

type PollarWalletContextValue = {
  /** True when a publishable key is configured; the UI hides the option otherwise. */
  enabled: boolean
  address: string | null
  isConnecting: boolean
  error: string | null
  /**
   * A Pollar session is already active, so signing in needs no modal — see
   * `resume`. Reflects the SDK's own session, which the Thalos JWT outlives:
   * the app token is good for 7 days, this is not, so a user can look signed in
   * with no session left to sign with.
   */
  hasSession: boolean
  /**
   * The session is server-confirmed, not just optimistically restored from
   * storage. Pollar's own guidance is to gate signing on this, and signing is
   * the one thing an unverified session cannot actually do.
   */
  sessionVerified: boolean
  /**
   * The SDK could not use persistent storage and fell back to memory, so the
   * session dies on reload. Worth surfacing rather than letting the user
   * discover it as a failed signature.
   */
  storageDegraded: boolean
  /**
   * Same pipeline with no login UI, for when `hasSession` is already true:
   * re-mints the Thalos JWT from the live Pollar session and hands back the
   * profile so the caller can route without asking the user anything.
   */
  resume: (onSuccess?: (address: string, profile: Profile | null) => void) => Promise<void>
  /**
   * The pipeline entered directly on one provider, with no Pollar modal. This
   * is how every button in Thalos's own modal signs in — `'google'` and
   * `'github'` redirect, a wallet adapter id opens that wallet.
   */
  loginWith: (
    provider: PollarLoginProvider | (string & {}),
    onSuccess?: (address: string, profile: Profile | null) => void,
    accountType?: "personal" | "enterprise",
  ) => Promise<void>
  /**
   * Email OTP, in three calls because a human types between them. `startEmail`
   * begins the pipeline and leaves it awaiting the session while the UI collects
   * the address and the code; `authStep` says which input to render.
   */
  startEmailLogin: (
    onSuccess?: (address: string, profile: Profile | null) => void,
    accountType?: "personal" | "enterprise",
  ) => Promise<void>
  sendEmailCode: (email: string) => void
  verifyEmailCode: (code: string) => void
  /** Abandons a login in flight (also what closing our modal must call). */
  cancelLogin: () => void
  /** Drops a stale error, for callers that recover by showing the login modal. */
  clearError: () => void
  /**
   * The connectable wallets, for our own picker: the Stellar Wallets Kit
   * registers one adapter per wallet (Freighter, xBull, Lobstr, …), so
   * "Connect Stellar Wallet" has to say which. Pass an `id` to `loginWith`.
   */
  walletOptions: { id: string; label: string; iconUrl?: string }[]
  /**
   * Pollar's own auth state machine, for rendering. `entering_email` and
   * `entering_code` are the two steps the email flow has to draw; the rest are
   * progress the buttons render as a spinner.
   */
  authStep: AuthState["step"]
  logout: () => void
  /** Read from Pollar's `fundingMode`; not decided here. */
  fundingMode: FundingMode | null
}

const PollarWalletContext = createContext<PollarWalletContextValue | null>(null)

/** Provisioning happens server-side right after the session goes ready. */
const WALLET_READY_ATTEMPTS = 12
const WALLET_READY_DELAY_MS = 750

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** The session can go ready just before the wallet exists, so poll for it. */
async function waitForWalletAddress(client: PollarClient): Promise<string> {
  for (let attempt = 0; attempt < WALLET_READY_ATTEMPTS; attempt += 1) {
    const address = client.getWallet()?.address
    if (address) return address
    await sleep(WALLET_READY_DELAY_MS)
  }
  throw new Error("Pollar is still provisioning your wallet. Please try again in a moment.")
}

/**
 * Enable the USDC trustline, sponsored by the app. The sponsorship is what makes
 * "no XLM required" hold: a new account cannot fund its own 0.5 XLM reserve.
 */
async function ensureUsdcTrustline(client: PollarClient): Promise<void> {
  await client.refreshAssets()

  const state = client.getEnabledAssetsState()
  if (state.step === "error") {
    throw new Error(`Could not read the wallet's assets: ${state.message}`)
  }

  const usdc =
    state.step === "loaded"
      ? state.data.assets.find(
          (asset) =>
            asset.code === TRUSTLINE_USDC.symbol && asset.issuer === TRUSTLINE_USDC.address,
        )
      : undefined

  // Nothing to sponsor if USDC isn't an app asset. Fail here, not later at
  // escrow funding with an opaque error.
  if (!usdc?.enabledInApp) {
    throw new Error(
      "USDC is not an enabled asset in this Pollar app. Enable it in the Pollar dashboard so the trustline can be sponsored.",
    )
  }

  if (usdc.trustlineEstablished) return

  const outcome = await client.setTrustline({
    code: TRUSTLINE_USDC.symbol,
    issuer: TRUSTLINE_USDC.address,
  })

  if (outcome.status === "error") {
    throw new Error(
      outcome.details
        ? `Could not enable the USDC trustline: ${outcome.details}`
        : "Could not enable the USDC trustline.",
    )
  }
}

/** Inner provider — must be a child of PollarProvider to use usePollar(). */
function PollarWalletBridge({ children }: { children: React.ReactNode }) {
  const pollar = usePollar()
  const { login } = useAuthStore()
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Identifies the newest login run, so older overlapping ones can stand down. */
  const runIdRef = useRef(0)

  const address = pollar.wallet?.address ?? null

  const fundingMode: FundingMode | null = useMemo(() => {
    const mode = pollar.wallet?.fundingMode
    if (!mode) return null
    return mode === "DEFERRED" ? "deferred" : "immediate"
  }, [pollar.wallet?.fundingMode])

  /** Retries while the route answers WALLET_NOT_READY, i.e. still provisioning. */
  const establishAppSession = useCallback(async (client: PollarClient) => {
    let lastError: unknown = null

    for (let attempt = 0; attempt < WALLET_READY_ATTEMPTS; attempt += 1) {
      const accessToken = readAccessToken(client)
      if (!accessToken) {
        throw new Error("No Pollar session found. Please try logging in again.")
      }

      try {
        return await loginWithPollar(accessToken)
      } catch (e) {
        if (!(e instanceof PollarWalletNotReadyError)) throw e
        lastError = e
        await sleep(WALLET_READY_DELAY_MS)
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Pollar is still provisioning your wallet. Please try again in a moment.")
  }, [])

  /** Shared pipeline: `enter` only kicks off the UI, the rest is identical. */
  const runLogin = useCallback(
    async (
      enter: (client: PollarClient) => void,
      onSuccess?: (address: string, profile: Profile | null) => void,
      accountType?: "personal" | "enterprise",
      verifyTimeoutMs?: number,
      /** False only for `resume`, whose whole purpose is the existing session. */
      requireFresh = true,
    ) => {
      const client = getPollarClient()
      if (!client) {
        setError("Pollar is not configured.")
        return
      }

      // Two pipelines can genuinely overlap: useLoginEntry resumes on a session
      // it believes is live, then the user picks a provider in the modal it
      // opened. The SDK resolves that its own way — "a new login supersedes this
      // one" — so the older run finds the state machine reset under it and
      // reports a session that never went missing. Whoever ran last wins, and
      // the superseded run stops quietly at the next checkpoint.
      const myRun = (runIdRef.current += 1)
      const superseded = () => runIdRef.current !== myRun

      setIsConnecting(true)
      setError(null)

      try {
        // Subscribe BEFORE entering: a restored session settles synchronously.
        const verified = waitForVerifiedSession(client, verifyTimeoutMs, { requireFresh })
        enter(client)
        await verified
        if (superseded()) return

        const provisioned = await waitForWalletAddress(client)
        if (superseded()) return

        // Only for a wallet the app provisioned. The sponsorship pays the 0.5
        // XLM reserve out of the app's account, which is what makes "no XLM
        // required" hold for a brand-new user — but a wallet the user brought
        // is theirs, funded by them, and possibly already trusting USDC.
        // Sponsoring into it would spend the app's XLM on someone else's
        // account, and `enabledInApp` would fail the login for a wallet that
        // never needed us.
        if (client.getWallet()?.custody === "internal") {
          await ensureUsdcTrustline(client)
        }

        if (superseded()) return

        // Option B: Pollar stays the auth source, our JWT stays the app session.
        const session = await establishAppSession(client)
        if (superseded()) return
        login(session.user, session.token)

        // With an accountType the user just told us which they are, so a
        // missing profile can be created. Without one (resume) we only read:
        // defaulting would silently file an enterprise user as personal.
        const { profile, error: profileError } = accountType
          ? await getOrCreateProfile(provisioned, accountType)
          : await getProfileByWallet(provisioned)
        if (profileError) {
          console.error("[pollar] profile error:", profileError)
        }
        if (!accountType && !profile) {
          throw new PollarProfileMissingError()
        }

        // user_wallets is written by /api/auth/pollar, which holds the verified
        // identity — doing it here would trust the browser with pollar_user_id.
        onSuccess?.(provisioned, profile ?? null)
      } catch (e) {
        // Backing out is normal, as with a closed Kit modal. A missing profile
        // is not a failure either — the caller falls back to the login modal so
        // the user can pick an account type.
        if (e instanceof PollarLoginCancelledError) return
        if (e instanceof PollarProfileMissingError) return
        // A superseded run fails on state the newer one moved; that is not the
        // user's problem and the newer run is still going.
        if (superseded()) return
        setError(e instanceof Error ? e.message : "Could not sign in with Pollar.")
      } finally {
        // Only the newest run owns the flag; an older one clearing it would
        // unlock the buttons while a login is still in flight.
        if (!superseded()) setIsConnecting(false)
      }
    },
    [establishAppSession, login],
  )

  const loginWith = useCallback(
    (
      provider: PollarLoginProvider | (string & {}),
      onSuccess?: (address: string, profile: Profile | null) => void,
      accountType?: "personal" | "enterprise",
    ) =>
      runLogin(
        // `email` needs an address up front, so it goes through startEmailLogin.
        (client) => client.login({ provider } as { provider: "google" | "github" }),
        onSuccess,
        accountType,
      ),
    [runLogin],
  )

  // The pipeline stays parked on `await verified` while the user types their
  // address and then the code; each step below only nudges the state machine.
  const startEmailLogin = useCallback(
    (
      onSuccess?: (address: string, profile: Profile | null) => void,
      accountType?: "personal" | "enterprise",
    ) => runLogin((client) => client.beginEmailLogin(), onSuccess, accountType),
    [runLogin],
  )

  const sendEmailCode = useCallback((email: string) => {
    getPollarClient()?.sendEmailCode(email)
  }, [])

  const verifyEmailCode = useCallback((code: string) => {
    getPollarClient()?.verifyEmailCode(code)
  }, [])

  // Drops the state machine back to idle, which waitForVerifiedSession reads as
  // the user backing out — the same signal Pollar's own modal sends on close.
  const cancelLogin = useCallback(() => {
    getPollarClient()?.cancelLogin()
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const resume = useCallback(
    (onSuccess?: (address: string, profile: Profile | null) => void) =>
      // No `enter`: the session exists, so the replayed state settles it. Short
      // timeout because nobody is filling in a form.
      runLogin(() => {}, onSuccess, undefined, RESUME_TIMEOUT_MS, false),
    [runLogin],
  )

  const logout = useCallback(() => {
    pollar.logout()
    setError(null)
  }, [pollar])

  // Subscribed here rather than read per render: the step drives which input the
  // email flow shows, and usePollar() carries no equivalent.
  const [authStep, setAuthStep] = useState<AuthState["step"]>("idle")
  useEffect(() => {
    const client = getPollarClient()
    if (!client) return
    setAuthStep(client.getAuthState().step)
    return client.onAuthStateChange((next) => setAuthStep(next.step))
  }, [])

  // The SDK reports this when it cannot persist and falls back to memory, which
  // makes every session last exactly until the next reload. We were not
  // listening, so that failure mode was invisible.
  const [storageDegraded, setStorageDegraded] = useState(false)
  useEffect(() => {
    const client = getPollarClient()
    if (!client) return
    return client.onStorageDegrade((reason) => {
      console.warn(
        `[pollar] storage unavailable (${String(reason)}) — the session will not survive a reload`,
      )
      setStorageDegraded(true)
    })
  }, [])

  // Fixed once the client exists — the adapters are registered at construction.
  const walletOptions = useMemo(() => {
    const all = getPollarClient()?.listWalletAdapters() ?? []

    // PollarClient auto-registers its own Freighter and Albedo adapters under
    // `*-native` ids, and the Kit registers adapters for those same two wallets
    // under different ids — so both show, and the user sees "Freighter" twice
    // with no way to tell which is which. Prefer the Kit's (they carry icons and
    // share one connection path with every other wallet here), and fall back to
    // the built-ins if the Kit adapters failed to load.
    const fromKit = all.filter(({ id }) => !String(id).endsWith("-native"))

    return (fromKit.length ? fromKit : all).map(({ id, meta }) => ({
      id: String(id),
      label: meta.label,
      iconUrl: meta.iconUrl,
    }))
  }, [])

  const value: PollarWalletContextValue = {
    enabled: true,
    address,
    isConnecting,
    error,
    hasSession: pollar.isAuthenticated,
    sessionVerified: pollar.verified,
    storageDegraded,
    resume,
    loginWith,
    startEmailLogin,
    sendEmailCode,
    verifyEmailCode,
    cancelLogin,
    clearError,
    authStep,
    walletOptions,
    logout,
    fundingMode,
  }

  return <PollarWalletContext.Provider value={value}>{children}</PollarWalletContext.Provider>
}

/** Used when Pollar is not configured, so consumers need no null checks. */
const disabledValue: PollarWalletContextValue = {
  enabled: false,
  address: null,
  isConnecting: false,
  error: null,
  hasSession: false,
  sessionVerified: false,
  storageDegraded: false,
  resume: async () => {},
  loginWith: async () => {},
  startEmailLogin: async () => {},
  sendEmailCode: () => {},
  verifyEmailCode: () => {},
  cancelLogin: () => {},
  clearError: () => {},
  authStep: "idle",
  walletOptions: [],
  logout: () => {},
  fundingMode: null,
}

/**
 * While the client is being built the options must still render, or the modal
 * would visibly lose half its buttons for a frame. `isConnecting` keeps them
 * disabled so a click in that window cannot start a login with no client.
 */
const loadingValue: PollarWalletContextValue = {
  ...disabledValue,
  enabled: POLLAR_ENABLED,
  isConnecting: true,
}

export function PollarWalletProvider({ children }: { children: React.ReactNode }) {
  // Built in an effect, not inline: the Stellar Wallets Kit adapters have to be
  // imported dynamically (see ensurePollarClient), and PollarClient takes them
  // only in its constructor. Mounted from the root layout, so this resolves long
  // before any login UI exists to click.
  const [client, setClient] = useState<PollarClient | null>(null)

  useEffect(() => {
    if (!POLLAR_ENABLED) return
    let cancelled = false
    void ensurePollarClient().then((ready) => {
      if (!cancelled) setClient(ready)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // No key (or SSR): PollarProvider would need a client we cannot build.
  if (!POLLAR_ENABLED) {
    return (
      <PollarWalletContext.Provider value={disabledValue}>{children}</PollarWalletContext.Provider>
    )
  }

  if (!client) {
    return (
      <PollarWalletContext.Provider value={loadingValue}>{children}</PollarWalletContext.Provider>
    )
  }

  return (
    <PollarProvider client={client}>
      <PollarWalletBridge>{children}</PollarWalletBridge>
    </PollarProvider>
  )
}

export function usePollarWallet(): PollarWalletContextValue {
  const ctx = useContext(PollarWalletContext)
  if (!ctx) throw new Error("usePollarWallet must be used within PollarWalletProvider")
  return ctx
}
