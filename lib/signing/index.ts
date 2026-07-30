/**
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
 * @returns Signed XDR or null on failure
 */
export async function signTransaction(
  xdr: string,
  networkPassphrase: string,
  address?: string
): Promise<SignedTransaction | null> {
  if (typeof window === 'undefined') {
    console.error('[signing] signTransaction called on server side')
    return null
  }

  try {
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
  }
}

/**
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
    return null
  }

  try {
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
}

/**
 * Re-export Kit functions for convenience
 */
export { getKit, clearKit, isFreighterAvailable } from '@/lib/stellar-wallet-kit'
