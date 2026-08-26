import { apiRequest, type ApiResponse } from "./client"

export const WALLET_TYPES = [
  "custodial",
  "freighter",
  "lobstr",
  "xbull",
  "albedo",
  "accesly",
  "other",
] as const

export type WalletType = (typeof WALLET_TYPES)[number]

/** A row from the Nest backend's `user_wallets` store. */
export interface UserWallet {
  id: string
  user_id: string
  wallet_address: string
  wallet_type: WalletType
  label: string | null
  is_primary: boolean
  is_verified: boolean
  verified_at: string | null
  created_at: string
  updated_at: string

  /** Login that provisioned this wallet; null for external ones (#108/#109). */
  auth_provider?: string | null

  /** Pollar user id when auth_provider is "pollar" (#108). */
  pollar_user_id?: string | null

  /** Smart Account contract address (C…) for account-abstraction wallets (#109). */
  c_address?: string | null
}

/** @deprecated Prefer `UserWallet`; this client talks to Nest `user_wallets`. */
export type LinkedWallet = UserWallet

export interface WalletBalance {
  xlm: string
  usdc: string
}

export interface WalletWithBalance extends UserWallet {
  balance: WalletBalance
  agreements_count: number
}

export interface WalletAgreement {
  id: string
  title: string
  status: string
  amount: string
  role: string
  created_at: string
}

/**
 * The agreements endpoint returns summaries rather than full `user_wallets`
 * rows. Optional metadata supports older deployments that returned full rows.
 */
export interface WalletWithAgreements {
  wallet_address: string
  wallet_type: WalletType
  label: string | null
  agreements: WalletAgreement[]
  agreements_count: number
  id?: string
  is_primary?: boolean
  is_verified?: boolean
}

/**
 * Normalized wallet verification challenge.
 *
 * The current Nest backend uses `message`, while older deployments may
 * return `challenge`. `getWalletVerificationChallenge()` normalizes both
 * shapes into the legacy-compatible `challenge` property.
 */
export interface WalletVerificationChallenge {
  challenge: string
  expires_at?: string
}

const SEP53_PREFIX = "Stellar Signed Message:\n"
const TRAILING_CHALLENGE_PROOF = /\n\s*Proof:\s*.+$/

/**
 * Return the challenge message that should be used by the wallet-signing flow.
 */
export function challengeMessage(
  challenge: WalletVerificationChallenge,
): string | null {
  return typeof challenge.challenge === "string" &&
    challenge.challenge.length > 0
    ? challenge.challenge
    : null
}

/**
 * Convert Nest's proof-bearing challenge envelope into the user message a
 * SEP-53 wallet must sign.
 *
 * Freighter adds the SEP-53 prefix itself, while Nest verifies that prefixed
 * envelope after removing its server-only proof.
 */
export function walletVerificationMessageToSign(
  challenge: string,
): string {
  const envelope = challenge.replace(TRAILING_CHALLENGE_PROOF, "").trimEnd()

  return envelope.startsWith(SEP53_PREFIX)
    ? envelope.slice(SEP53_PREFIX.length)
    : envelope
}

type UnknownRecord = Record<string, unknown>
type ItemParser<T> = (value: unknown) => T | undefined

function isRecord(value: unknown): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null
}

function isOptionalStringOrNull(
  value: unknown,
): value is string | null | undefined {
  return value === undefined || isStringOrNull(value)
}

function isWalletType(value: unknown): value is WalletType {
  return (
    typeof value === "string" &&
    (WALLET_TYPES as readonly string[]).includes(value)
  )
}

function envelopeError(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined

  return typeof value.error === "string" && value.error.length > 0
    ? value.error
    : undefined
}

function invalidResponse<T>(
  message: string,
): ApiResponse<T> {
  return {
    success: false,
    error: message,
  }
}

function normalizeResponse<T>(
  response: ApiResponse<unknown>,
  parse: ItemParser<T>,
  invalidMessage: string,
): ApiResponse<T> {
  if (!response.success) {
    return {
      success: false,
      error: response.error,
    }
  }

  const backendError = envelopeError(response.data)

  if (backendError) {
    return invalidResponse(backendError)
  }

  const data = parse(response.data)

  return data === undefined
    ? invalidResponse(invalidMessage)
    : {
        success: true,
        data,
      }
}

/**
 * The only place that handles Nest's `T[]` versus `{ wallets: T[] }` drift.
 */
function normalizeWalletList<T>(
  response: ApiResponse<unknown>,
  parseItem: ItemParser<T>,
): ApiResponse<T[]> {
  return normalizeResponse(
    response,
    (payload) => {
      const raw = Array.isArray(payload)
        ? payload
        : isRecord(payload) && Array.isArray(payload.wallets)
          ? payload.wallets
          : undefined

      if (!raw) return undefined

      const parsed: T[] = []

      for (const item of raw) {
        const normalized = parseItem(item)

        if (normalized === undefined) {
          return undefined
        }

        parsed.push(normalized)
      }

      return parsed
    },
    "Invalid wallet list response",
  )
}

function parseUserWallet(
  value: unknown,
): UserWallet | undefined {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.user_id !== "string" ||
    typeof value.wallet_address !== "string" ||
    !isWalletType(value.wallet_type) ||
    !isStringOrNull(value.label) ||
    typeof value.is_primary !== "boolean" ||
    typeof value.is_verified !== "boolean" ||
    !isStringOrNull(value.verified_at) ||
    typeof value.created_at !== "string" ||
    typeof value.updated_at !== "string" ||
    !isOptionalStringOrNull(value.auth_provider) ||
    !isOptionalStringOrNull(value.pollar_user_id) ||
    !isOptionalStringOrNull(value.c_address)
  ) {
    return undefined
  }

  return value as unknown as UserWallet
}

function parseWalletBalance(
  value: unknown,
): WalletBalance | undefined {
  if (
    !isRecord(value) ||
    typeof value.xlm !== "string" ||
    typeof value.usdc !== "string"
  ) {
    return undefined
  }

  return {
    xlm: value.xlm,
    usdc: value.usdc,
  }
}

function parseWalletWithBalance(
  value: unknown,
): WalletWithBalance | undefined {
  const wallet = parseUserWallet(value)

  if (!wallet || !isRecord(value)) {
    return undefined
  }

  const balance = parseWalletBalance(value.balance)

  if (
    !balance ||
    typeof value.agreements_count !== "number"
  ) {
    return undefined
  }

  return {
    ...wallet,
    balance,
    agreements_count: value.agreements_count,
  }
}

function parseWalletAgreement(
  value: unknown,
): WalletAgreement | undefined {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.status !== "string" ||
    typeof value.amount !== "string" ||
    typeof value.role !== "string" ||
    typeof value.created_at !== "string"
  ) {
    return undefined
  }

  return value as unknown as WalletAgreement
}

function parseWalletWithAgreements(
  value: unknown,
): WalletWithAgreements | undefined {
  if (
    !isRecord(value) ||
    typeof value.wallet_address !== "string" ||
    !isWalletType(value.wallet_type) ||
    !isStringOrNull(value.label) ||
    !Array.isArray(value.agreements)
  ) {
    return undefined
  }

  const agreements: WalletAgreement[] = []

  for (const rawAgreement of value.agreements) {
    const agreement = parseWalletAgreement(rawAgreement)

    if (!agreement) {
      return undefined
    }

    agreements.push(agreement)
  }

  return {
    wallet_address: value.wallet_address,
    wallet_type: value.wallet_type,
    label: value.label,
    agreements,
    agreements_count: agreements.length,
    ...(typeof value.id === "string"
      ? { id: value.id }
      : {}),
    ...(typeof value.is_primary === "boolean"
      ? { is_primary: value.is_primary }
      : {}),
    ...(typeof value.is_verified === "boolean"
      ? { is_verified: value.is_verified }
      : {}),
  }
}

function normalizeWalletResponse(
  response: ApiResponse<unknown>,
): ApiResponse<UserWallet> {
  return normalizeResponse(
    response,
    (payload) =>
      parseUserWallet(
        isRecord(payload) && "wallet" in payload
          ? payload.wallet
          : payload,
      ),
    "Invalid wallet response",
  )
}

// Get all `user_wallets` rows for the authenticated Nest user.
export async function getLinkedWallets(
  token: string,
): Promise<ApiResponse<UserWallet[]>> {
  const response = await apiRequest<unknown>(
    "/wallets",
    {
      method: "GET",
    },
    token,
  )

  return normalizeWalletList(
    response,
    parseUserWallet,
  )
}

// Get wallets with canonical `{ xlm, usdc }` balances.
export async function getWalletsWithBalances(
  token: string,
): Promise<ApiResponse<WalletWithBalance[]>> {
  const response = await apiRequest<unknown>(
    "/wallets/with-balances",
    {
      method: "GET",
    },
    token,
  )

  return normalizeWalletList(
    response,
    parseWalletWithBalance,
  )
}

// Get agreements grouped by wallet.
export async function getWalletsWithAgreements(
  token: string,
): Promise<ApiResponse<WalletWithAgreements[]>> {
  const response = await apiRequest<unknown>(
    "/wallets/agreements",
    {
      method: "GET",
    },
    token,
  )

  return normalizeWalletList(
    response,
    parseWalletWithAgreements,
  )
}

// Get the primary `user_wallets` row. Nest returns `{ wallet }`.
export async function getPrimaryWallet(
  token: string,
): Promise<ApiResponse<UserWallet | null>> {
  const response = await apiRequest<unknown>(
    "/wallets/primary",
    {
      method: "GET",
    },
    token,
  )

  return normalizeResponse(
    response,
    (payload) => {
      const raw =
        isRecord(payload) && "wallet" in payload
          ? payload.wallet
          : payload

      return raw === null
        ? null
        : parseUserWallet(raw)
    },
    "Invalid primary wallet response",
  )
}

// Get a canonical balance. Nest currently wraps it in `{ balance }`.
export async function getWalletBalance(
  walletAddress: string,
  token: string,
): Promise<ApiResponse<WalletBalance>> {
  const response = await apiRequest<unknown>(
    `/wallets/${encodeURIComponent(walletAddress)}/balance`,
    {
      method: "GET",
    },
    token,
  )

  return normalizeResponse(
    response,
    (payload) =>
      parseWalletBalance(
        isRecord(payload) && "balance" in payload
          ? payload.balance
          : payload,
      ),
    "Invalid wallet balance response",
  )
}

// Link a new wallet (with optional signature proof).
export async function linkWallet(
  data: {
    wallet_address: string
    wallet_type: WalletType
    label?: string
    signed_message?: string
    signature?: string

    // Accesly (#109) sends these from the browser. The backend does not take
    // the browser's word for an accesly wallet's provider — it pins
    // auth_provider itself from wallet_type — so this cannot forge an origin.
    auth_provider?: LinkedWallet["auth_provider"]
    c_address?: string

    // A Pollar wallet's auth_provider/pollar_user_id are NOT sent from here:
    // they only ever travel server-side (app/api/auth/pollar), so the browser
    // cannot choose the identity a wallet is recorded under.
  },
  token: string,
): Promise<ApiResponse<UserWallet>> {
  const response = await apiRequest<unknown>(
    "/wallets",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  )

  return normalizeWalletResponse(response)
}

/**
 * Request a wallet verification challenge.
 *
 * Current Nest deployments use `message`, while older deployments may return
 * `challenge`. Both are normalized into `WalletVerificationChallenge.challenge`
 * so callers do not need to care which backend version they are talking to.
 */
export async function getWalletVerificationChallenge(
  walletAddress: string,
  token: string,
): Promise<ApiResponse<WalletVerificationChallenge>> {
  const response = await apiRequest<unknown>(
    `/wallets/verification-challenge?address=${encodeURIComponent(
      walletAddress,
    )}`,
    {
      method: "GET",
    },
    token,
  )

  return normalizeResponse(
    response,
    (payload) => {
      if (!isRecord(payload)) {
        return undefined
      }

      /*
       * Canonical Nest field is `message`.
       *
       * `challenge` is retained as a legacy fallback for older deployments.
       */
      const challenge =
        typeof payload.message === "string"
          ? payload.message
          : typeof payload.challenge === "string"
            ? payload.challenge
            : undefined

      if (!challenge) {
        return undefined
      }

      if (
        payload.expires_at !== undefined &&
        typeof payload.expires_at !== "string"
      ) {
        return undefined
      }

      return {
        challenge,
        ...(typeof payload.expires_at === "string"
          ? {
              expires_at: payload.expires_at,
            }
          : {}),
      }
    },
    "Invalid wallet verification challenge response",
  )
}

// Update wallet label or primary status. Nest returns `{ wallet, error }`.
export async function updateWallet(
  walletId: string,
  data: {
    label?: string
    is_primary?: boolean
  },
  token: string,
): Promise<ApiResponse<UserWallet>> {
  const response = await apiRequest<unknown>(
    `/wallets/${encodeURIComponent(walletId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    token,
  )

  return normalizeWalletResponse(response)
}

// Unlink/remove a wallet.
export async function unlinkWallet(
  walletId: string,
  token: string,
): Promise<ApiResponse<{ success: true }>> {
  const response = await apiRequest<unknown>(
    `/wallets/${encodeURIComponent(walletId)}`,
    {
      method: "DELETE",
    },
    token,
  )

  return normalizeResponse(
    response,
    (payload) =>
      isRecord(payload) && payload.success === true
        ? {
            success: true as const,
          }
        : undefined,
    "Wallet unlink failed",
  )
}