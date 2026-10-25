/**
 * Lendara on-ramp — the one place the UI talks to it.
 *
 * Two things about Lendara shape this file:
 *
 * 1. **The API key is server-only.** A session is created by our backend,
 *    which returns a one-time URL. The browser never sees the key, and never
 *    picks the destination wallet — the backend derives it from the
 *    authenticated user and the agreement, so a tampered client cannot
 *    redirect someone else's money.
 * 2. **The widget is an overlay, not a page.** `Lendara.open({ url })` renders
 *    in place, so the user never leaves the agreement they were funding.
 */

import {
  createLendaraSessionApi,
  verifyLendaraSessionApi,
  type FiatCurrency,
} from "@/lib/api/ramps"

export { FIAT_CURRENCIES, type FiatCurrency } from "@/lib/api/ramps"

/**
 * Receiving USDC from Lendara is not the same as funding an escrow.
 *
 * Lendara delivers USDC **to the wallet**; Trustless Work moves USDC **from
 * the wallet into the escrow**. Two separate transactions, and an agreement
 * only becomes funded after the second one is confirmed on-chain.
 *
 * In sandbox they are not even the same asset: Lendara's test USDC is issued
 * by `GBVIQ7QV…` while the escrows use `GBBD47IF…`. On Stellar those are
 * different tokens, so sandbox USDC cannot fund a sandbox escrow. The backend
 * reports that as `usableForEscrow`, separately from the money arriving.
 */
export const LENDARA_ISSUER_SANDBOX = "GBVIQ7QV"

export const LENDARA_AVAILABLE = true

export interface LendaraSessionParams {
  /** Thalos agreement the funds are meant for. Scopes the session server-side. */
  agreementId: string
  fiatCurrency: FiatCurrency
  /** Amount in **fiat**, not USDC — Lendara charges in the local currency. */
  amount: string
  token?: string | null
  /** Progress for the UI, as the deposit moves through its states. */
  onStatus?: (status: string) => void
}

export interface LendaraResult {
  stellarTransactionId?: string
  /** False when the delivered asset is not the one the escrows accept. */
  usableForEscrow: boolean
}

export type LendaraOutcome =
  { success: true; data: LendaraResult } | { success: false; error: string; cancelled?: boolean }

/**
 * Create a session, open the widget, and resolve once the deposit is verified.
 *
 * Resolves only after the **backend** confirms the transaction. The widget's
 * `onComplete` runs in the browser and is treated as a cue to go and check,
 * never as proof that the money arrived.
 *
 * Must be called from a user gesture: in `popup` mode the browser blocks a
 * window opened outside a click, and the widget says so through `onError`.
 */
export async function startLendaraOnramp(params: LendaraSessionParams): Promise<LendaraOutcome> {
  const session = await createLendaraSessionApi(
    {
      agreementId: params.agreementId,
      fiatCurrency: params.fiatCurrency,
      amount: params.amount,
    },
    params.token ?? undefined,
  )

  if (!session.success || !session.data) {
    return { success: false, error: session.error ?? "Could not start the deposit" }
  }
  // Narrowed once: inside the callbacks below TypeScript can no longer see
  // the guard above.
  const { id: sessionId, url } = session.data

  // Loaded on demand: the widget is only needed by whoever clicks, and it
  // should not weigh on the dashboard's bundle.
  const { Lendara } = await import("@lendara/widget")

  return new Promise<LendaraOutcome>((resolve) => {
    let settled = false
    const settle = (outcome: LendaraOutcome) => {
      if (settled) return
      settled = true
      resolve(outcome)
    }

    Lendara.open({
      url,
      mode: "modal",
      onStatus: (tx) => params.onStatus?.(tx.status),
      onComplete: () => {
        // Ask our backend, which re-reads the transaction from Lendara and
        // checks it landed in the wallet this agreement expects.
        void verifyLendaraSessionApi(
          { agreementId: params.agreementId, sessionId },
          params.token ?? undefined,
        ).then((result) => {
          if (!result.success || !result.data) {
            settle({ success: false, error: result.error ?? "Could not verify the deposit" })
            return
          }
          if (!result.data.verified) {
            settle({
              success: false,
              error: result.data.reason ?? "The deposit could not be verified",
            })
            return
          }
          settle({
            success: true,
            data: {
              stellarTransactionId: result.data.stellarTransactionId,
              usableForEscrow: result.data.usableForEscrow === true,
            },
          })
        })
      },
      onError: (err) => settle({ success: false, error: err.message }),
      // Closing without finishing is not a failure worth shouting about.
      onClose: () => settle({ success: false, error: "", cancelled: true }),
    })
  })
}

/** How much more USDC is needed, or null when the balance already covers it. */
export function shortfall(balanceUsdc: string | null, amountUsdc: string): number | null {
  const balance = Number(balanceUsdc ?? "0")
  const needed = Number(String(amountUsdc).replace(/,/g, ""))

  // An unreadable balance is not the same as a balance of zero: saying "you
  // need 100 more" to someone who may already have it would be wrong.
  if (!Number.isFinite(balance) || !Number.isFinite(needed) || balanceUsdc === null) return null

  const missing = needed - balance
  return missing > 0 ? missing : null
}
