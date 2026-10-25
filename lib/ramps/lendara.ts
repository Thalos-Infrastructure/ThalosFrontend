/**
 * Lendara on-ramp — the seam the UI talks to.
 *
 * Lendara turns fiat into USDC and sends it to a Stellar wallet. Two things
 * about it shape this file:
 *
 * 1. **The API key is server-only.** A session is created by our backend
 *    (`POST /api/session` on Lendara's side, behind `LENDARA_API_KEY`), which
 *    returns a one-time `url`. The browser never sees the key, and never picks
 *    the destination wallet — the backend derives it from the authenticated
 *    user and the agreement, so a tampered client cannot redirect someone
 *    else's money.
 * 2. **The widget is an overlay, not a page.** `Lendara.open({ url })` renders
 *    in place and reports back through `onComplete`, so the user never leaves
 *    the agreement they were funding.
 *
 * Until the backend endpoint exists, `LENDARA_AVAILABLE` is false and the UI
 * says so rather than opening something that cannot work. Flip it in the same
 * PR that adds the endpoint.
 */

/**
 * Receiving USDC from Lendara is not the same as funding an escrow.
 *
 * Lendara delivers USDC **to the wallet**; Trustless Work moves USDC **from
 * the wallet into the escrow**. They are two separate transactions, and an
 * agreement only becomes funded after the second one is confirmed on-chain.
 *
 * Worse, in sandbox they are not even the same asset: Lendara's test USDC is
 * issued by `GBVIQ7QV…` while the escrows use `GBBD47IF…`. On Stellar those
 * are different tokens, so sandbox USDC cannot fund a sandbox escrow. The
 * issuers have to match — or production has to use Circle's USDC on both
 * sides — before this flow completes end to end.
 */
export const LENDARA_ISSUER_SANDBOX = "GBVIQ7QV"

/** Flip to true in the PR that adds the backend session endpoint. */
export const LENDARA_AVAILABLE = false

export interface LendaraSessionParams {
  /** Thalos agreement the funds are meant for. Scopes the session server-side. */
  agreementId: string
  /** Amount of USDC still needed, so the widget can prefill it. */
  amountUsdc: string
}

export interface LendaraResult {
  /** Stellar transaction that delivered the USDC. Verified by the backend. */
  stellarTransactionId: string
}

/**
 * Open the Lendara widget and resolve once the USDC has been delivered.
 *
 * Not implemented yet: the session has to be created by the backend, and that
 * endpoint does not exist. Kept as the single place the UI calls so wiring it
 * up later is a change here and nowhere else.
 */
export async function startLendaraOnramp(
  _params: LendaraSessionParams,
): Promise<{ success: false; error: string } | { success: true; data: LendaraResult }> {
  return {
    success: false,
    error:
      "Lendara is not connected yet. You can still fund from a wallet that already holds USDC.",
  }
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
