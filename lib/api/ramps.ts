/**
 * Lendara on-ramp, through our own backend.
 *
 * The browser never sees Lendara's API key and never says which wallet the
 * money should go to: it asks Thalos for a session, and Thalos derives the
 * destination from the authenticated user and the agreement. A tampered
 * request cannot redirect a payment.
 */

import { apiRequest, type ApiResponse } from "./client"

/** The currencies Lendara's sandbox accepts. */
export const FIAT_CURRENCIES = ["ARS", "CLP", "CRC"] as const
export type FiatCurrency = (typeof FIAT_CURRENCIES)[number]

export interface LendaraSession {
  id: string
  url: string
  expires_at?: string
  /** Where the USDC will land. Derived by the backend, shown for confirmation. */
  account: string
}

export interface LendaraVerification {
  /** The money arrived, in the wallet this agreement expects. */
  verified: boolean
  reason?: string
  stellarTransactionId?: string
  /**
   * The asset delivered is the one the escrows hold. Separate from `verified`
   * on purpose: in sandbox Lendara issues its own USDC, which reaches the
   * wallet but cannot fund an escrow.
   */
  usableForEscrow?: boolean
}

export async function createLendaraSessionApi(
  params: { agreementId: string; fiatCurrency: FiatCurrency; amount: string },
  token?: string,
): Promise<ApiResponse<LendaraSession>> {
  const response = await apiRequest<{ session?: LendaraSession }>(
    "/ramps/lendara/session",
    {
      method: "POST",
      body: JSON.stringify({
        agreement_id: params.agreementId,
        fiat_currency: params.fiatCurrency,
        amount: params.amount,
      }),
    },
    token,
  )

  if (!response.success) return { success: false, error: response.error, status: response.status }
  if (!response.data?.session) {
    return { success: false, error: "The on-ramp did not return a session" }
  }
  return { success: true, data: response.data.session }
}

/**
 * Confirm the deposit with the backend.
 *
 * The widget's own `onComplete` runs in the browser, so it is a hint, not
 * proof. Nothing is reported as successful until this says so.
 */
export async function verifyLendaraSessionApi(
  params: { agreementId: string; sessionId: string },
  token?: string,
): Promise<ApiResponse<LendaraVerification>> {
  const response = await apiRequest<LendaraVerification>(
    "/ramps/lendara/verify",
    {
      method: "POST",
      body: JSON.stringify({
        agreement_id: params.agreementId,
        session_id: params.sessionId,
      }),
    },
    token,
  )

  if (!response.success) return { success: false, error: response.error, status: response.status }
  return { success: true, data: response.data as LendaraVerification }
}
