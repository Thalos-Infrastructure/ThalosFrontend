"use client"

/**
 * Accesly login orchestration (#109).
 *
 * After Cognito auth (signIn/signUp via the SDK), one flow provisions
 * everything the escrow stack needs:
 *
 *   1. `wallet.bootstrap`        — passkey + Smart Account (C-address), idempotent.
 *   2. `wallet.unlockForSigning` — single passkey prompt for the whole flow.
 *   3. `wallet.bootstrapG`       — G-address bridge WITH the USDC trustline,
 *                                  sponsored by Accesly (idempotent).
 *   4. Wallet-challenge login    — signs the Thalos challenge with the
 *                                  reconstructed key → app JWT (provider "accesly").
 *   5. `linkWallet` persistence  — user_wallets row with C- and G-address.
 *
 * Trustless Work role matching uses the G-address (it's the wallet the JWT
 * user carries and the one every escrow payload signs with).
 */

import { zeroize } from "@accesly/core"
import type { AcceslyHook } from "@accesly/react"
import { requestWalletChallenge, verifyWalletLogin } from "@/lib/api/wallet-auth"
import { linkWallet } from "@/lib/api/wallets"
import type { AuthUser } from "@/lib/auth/types"
import { gAddressFromOwnerPubkey, reconstructSeed, signChallenge } from "./signing"

export interface AcceslyLoginResult {
  /** Smart Account contract address (C…). */
  cAddress: string
  /** Classic bridge address (G…) used for Trustless Work. */
  gAddress: string
  user: AuthUser
  token: string
}

export type AcceslyLoginStage =
  | "wallet"      // bootstrap / passkey
  | "g-address"   // G bridge + USDC trustline
  | "session"     // Thalos JWT via wallet challenge

/**
 * Provisions the Accesly wallet and logs the user into Thalos.
 * Call after `auth.signIn`/`auth.signUp` succeeded on the Accesly hook.
 */
export async function completeAcceslyLogin(
  accesly: AcceslyHook,
  email: string,
  password: string,
  onStage?: (stage: AcceslyLoginStage) => void,
): Promise<AcceslyLoginResult> {
  // 1. Smart Account (C-address). Registers the passkey on first run.
  onStage?.("wallet")
  const ensured = await accesly.wallet.bootstrap({
    email,
    password,
    passkey: { rpName: "Thalos" },
  })
  const cAddress = ensured.walletAddress

  // 1b. The contract deploy + bootstrap run async on Accesly's worker; G-address
  //     bootstrap 400s until the Smart Account is live. Poll until on-chain.
  if (ensured.status !== "on-chain") {
    await waitForSmartAccountOnChain(accesly)
  }

  // 2. One passkey unlock powers the rest of the flow.
  const material = await accesly.wallet.unlockForSigning(email)

  let seed: Uint8Array | null = null
  try {
    // 3. G-address bridge + USDC trustline (sponsored, idempotent). Retried —
    //    right after deploy the backend can still reject while indexing.
    onStage?.("g-address")
    const g = await retry(3, 5_000, () =>
      accesly.wallet.bootstrapG({
        fragmentF1Plain: material.fragmentF1Plain,
        fragmentF2Key: material.fragmentF2Key,
        ownerPubkey: material.ownerPubkey,
      }),
    )
    const gAddress = g.gAddress || gAddressFromOwnerPubkey(material.ownerPubkey)

    // 4. Thalos app JWT via the wallet-challenge flow, signed with the
    //    reconstructed ed25519 key (raw scheme, provider "accesly").
    onStage?.("session")
    seed = await reconstructSeed(accesly._internal.endpoints, material)
    const { message } = await requestWalletChallenge(gAddress)
    const signature = signChallenge(message, seed)
    const { user, token } = await verifyWalletLogin(gAddress, message, signature, "accesly")

    // 5. Persist the Accesly identity (C + G) into user_wallets. Non-fatal —
    //    the wallet signs fine even if persistence fails.
    try {
      await linkWallet(
        {
          wallet_address: gAddress,
          wallet_type: "accesly",
          label: "Accesly Passkey",
          auth_provider: "accesly",
          c_address: cAddress,
        },
        token,
      )
    } catch {
      // Non-fatal
    }

    return { cAddress, gAddress, user, token }
  } finally {
    if (seed) zeroize(seed)
    zeroize(material.fragmentF1Plain)
    zeroize(material.fragmentF2Key)
  }
}

/** Poll the wallet record until Accesly's worker confirms the contract on Soroban. */
async function waitForSmartAccountOnChain(accesly: AcceslyHook, timeoutMs = 120_000): Promise<void> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const remote = await accesly.wallet.fetchRemote().catch(() => null)
    if (remote?.onChain) return
    await new Promise((r) => setTimeout(r, 4_000))
  }
  throw new Error(
    "Your Accesly smart account is still being deployed. Wait a few seconds and sign in again.",
  )
}

async function retry<T>(attempts: number, delayMs: number, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs))
    }
  }
  throw lastError
}
