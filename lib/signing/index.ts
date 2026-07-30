/**
<<<<<<< HEAD
 * Unified Transaction Signing Abstraction
 *
 * This module provides a single signing entry point for all escrow operations
 * regardless of login method (social / Accesly / external Kit wallet).
 *
 * All signing routes through Stellar Wallets Kit (Freighter, xBull, LOBSTR, Albedo, Rabet).
 * Social-login users still sign through their connected external wallet.
 *
 * Usage:
 *   import { signTransaction } from '@/lib/signing'
 *   const result = await signTransaction(unsignedXdr, networkPassphrase, address)
 */

import { getKit } from '@/lib/stellar-wallet-kit'

export interface SignedTransaction {
  signedTxXdr: string
}

export interface SignTransactionOptions {
  networkPassphrase: string
  address?: string
}

/**
 * Unified signTransaction function - routes through Stellar Wallets Kit
 *
 * @param xdr - Unsigned transaction XDR (base64)
 * @param networkPassphrase - Stellar network passphrase
 * @param address - Optional wallet address (for Kit 2.x compatibility)
=======
 * Unified Transaction Signing Abstraction (#110)
 *
 * Single signing entry point for the escrow lifecycle, regardless of login
 * method. Calls dispatch to the provider that owns the active wallet:
 *   - providers/kit.ts     → external wallets via Stellar Wallets Kit
 *   - providers/social.ts  → embedded custodial wallet (social/email, #108)
 *   - providers/accesly.ts → Accesly passkey smart account (#109)
 *
 * Usage:
 *   import { signTransaction, signEscrowOperation } from '@/lib/signing'
 *   const result = await signTransaction(unsignedXdr, networkPassphrase, address)
 */

import { STELLAR_NETWORK_PASSPHRASE } from "@/lib/config"
import type {
  EscrowOperation,
  EscrowRolesInfo,
  SignedMessage,
  SignedTransaction,
  TxStatus,
} from "./types"
import { resolveSigner } from "./registry"
import { assertOperationRole } from "./roles"

export type {
  EscrowOperation,
  EscrowRolesInfo,
  SignedMessage,
  SignedTransaction,
  SignerProviderId,
  SignTransactionOptions,
  TxStatus,
  WalletSigner,
} from "./types"
export { RoleValidationError, SignerUnavailableError } from "./types"
export { resolveSigner } from "./registry"
export { assertOperationRole } from "./roles"

/**
 * Unified signTransaction — dispatches to the active login method's provider.
 *
 * @param xdr - Unsigned transaction XDR (base64)
 * @param networkPassphrase - Stellar network passphrase
 * @param address - Optional wallet address (picks the provider that owns it)
>>>>>>> upstream/main
 * @returns Signed XDR or null on failure
 */
export async function signTransaction(
  xdr: string,
  networkPassphrase: string,
<<<<<<< HEAD
  address?: string
): Promise<SignedTransaction | null> {
  if (typeof window === 'undefined') {
    console.error('[signing] signTransaction called on server side')
=======
  address?: string,
): Promise<SignedTransaction | null> {
  if (typeof window === "undefined") {
    console.error("[signing] signTransaction called on server side")
>>>>>>> upstream/main
    return null
  }

  try {
<<<<<<< HEAD
    const kit = await getKit()
    if (!kit) {
      console.error('[signing] Stellar Wallets Kit not available')
      return null
    }

    // Kit 2.x signature - address parameter is now optional but recommended
    const result = await kit.signTransaction(xdr, {
      networkPassphrase,
      address,
    })

    if (!result?.signedTxXdr) {
      console.error('[signing] Kit returned no signedTxXdr', result)
      return null
    }

    return { signedTxXdr: result.signedTxXdr }
  } catch (error) {
    console.error('[signing] Transaction signing failed:', error)
    return null
=======
    const signer = resolveSigner(address)
    return await signer.signTransaction(xdr, { networkPassphrase, address })
  } catch (error) {
    console.error("[signing] Transaction signing failed:", error)
    throw error instanceof Error ? error : new Error("Transaction signing failed")
>>>>>>> upstream/main
  }
}

/**
<<<<<<< HEAD
 * Sign a message for wallet ownership verification (challenge-response)
 *
 * @param message - Message to sign
 * @param address - Wallet address
 * @returns Signed message and signer address, or null on failure
 */
export async function signMessage(
  message: string,
  address?: string
): Promise<{ signedMessage: string; signerAddress: string } | null> {
  if (typeof window === 'undefined') {
    console.error('[signing] signMessage called on server side')
=======
 * Sign a message for wallet ownership verification (challenge-response).
 */
export async function signMessage(
  message: string,
  address?: string,
): Promise<SignedMessage | null> {
  if (typeof window === "undefined") {
    console.error("[signing] signMessage called on server side")
>>>>>>> upstream/main
    return null
  }

  try {
<<<<<<< HEAD
    const kit = await getKit()
    if (!kit) {
      console.error('[signing] Stellar Wallets Kit not available')
      return null
    }

    const result = await kit.signMessage(message, {
      networkPassphrase: networkPassphraseFromEnv(),
      address,
    })

    if (!result?.signedMessage) {
      console.error('[signing] Kit returned no signedMessage', result)
      return null
    }

    return {
      signedMessage: result.signedMessage,
      signerAddress: result.signerAddress ?? address ?? '',
    }
  } catch (error) {
    console.error('[signing] Message signing failed:', error)
    return null
  }
}

/**
 * Get network passphrase from environment config
 */
function networkPassphraseFromEnv(): string {
  if (typeof window === 'undefined') return 'Public Global Stellar Network ; September 2015'
  
  // This should match lib/config.ts STELLAR_NETWORK_PASSPHRASE
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'TESTNET'
  return network === 'MAINNET'
    ? 'Public Global Stellar Network ; September 2015'
    : 'Test SDF Network ; September 2015'
=======
    const signer = resolveSigner(address)
    return await signer.signMessage(message, address)
  } catch (error) {
    console.error("[signing] Message signing failed:", error)
    throw error instanceof Error ? error : new Error("Message signing failed")
  }
}

export interface SignEscrowOperationParams {
  /** Unsigned transaction XDR returned by a Trustless Work build endpoint. */
  xdr: string
  /** Escrow lifecycle operation being signed (drives role validation). */
  operation: EscrowOperation
  /** Wallet expected to sign. */
  address: string
  /** Escrow role addresses, when known — enables pre-sign role validation. */
  roles?: EscrowRolesInfo
  networkPassphrase?: string
  /** UI progress callback (signing → caller submits → confirmed). */
  onStatus?: (status: TxStatus) => void
}

/**
 * Role-validated signing for the escrow lifecycle. Validates the Trustless
 * Work role required by the operation against the signing wallet, then signs
 * through the unified dispatch. Throws with a clean message when the wallet
 * lacks the role or no provider can sign.
 */
export async function signEscrowOperation({
  xdr,
  operation,
  address,
  roles,
  networkPassphrase = STELLAR_NETWORK_PASSPHRASE,
  onStatus,
}: SignEscrowOperationParams): Promise<SignedTransaction> {
  assertOperationRole(operation, roles, address)

  onStatus?.("signing")
  const signer = resolveSigner(address)
  const result = await signer.signTransaction(xdr, { networkPassphrase, address })
  if (!result?.signedTxXdr) {
    throw new Error("Transaction signing failed (no XDR returned)")
  }
  return result
>>>>>>> upstream/main
}

/**
 * Re-export Kit functions for convenience
 */
<<<<<<< HEAD
export { getKit, clearKit, isFreighterAvailable } from '@/lib/stellar-wallet-kit'
=======
export { getKit, clearKit, isFreighterAvailable } from "@/lib/stellar-wallet-kit"
>>>>>>> upstream/main
