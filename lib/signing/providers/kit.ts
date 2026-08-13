/**
 * External wallet provider — signs through the Stellar Wallets Kit
 * (Freighter, xBull, LOBSTR, Albedo, Rabet, Ledger…).
 */

import { getKit } from "@/lib/stellar-wallet-kit"
import { STELLAR_NETWORK_PASSPHRASE } from "@/lib/config"
import { STELLAR_WALLET_KEY } from "../session"
import type { SignedMessage, SignedTransaction, SignTransactionOptions, WalletSigner } from "../types"

function connectedAddress(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(STELLAR_WALLET_KEY)
}

export const kitSigner: WalletSigner = {
  id: "kit",
  label: "External wallet (Stellar Wallets Kit)",

  ownsAddress(address: string): boolean {
    return connectedAddress() === address
  },

  isActive(): boolean {
    return connectedAddress() !== null
  },

  async signTransaction(xdr: string, opts: SignTransactionOptions): Promise<SignedTransaction | null> {
    const kit = await getKit()
    if (!kit) {
      console.error("[signing:kit] Stellar Wallets Kit not available")
      return null
    }

    // Kit 2.x signature - address parameter is now optional but recommended
    const result = await kit.signTransaction(xdr, {
      networkPassphrase: opts.networkPassphrase,
      address: opts.address,
    })

    if (!result?.signedTxXdr) {
      console.error("[signing:kit] Kit returned no signedTxXdr", result)
      return null
    }

    return { signedTxXdr: result.signedTxXdr }
  },

  async signMessage(message: string, address?: string): Promise<SignedMessage | null> {
    const kit = await getKit()
    if (!kit) {
      console.error("[signing:kit] Stellar Wallets Kit not available")
      return null
    }

    const result = await kit.signMessage(message, {
      networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
      address,
    })

    if (!result?.signedMessage) {
      console.error("[signing:kit] Kit returned no signedMessage", result)
      return null
    }

    return {
      signedMessage: result.signedMessage,
      signerAddress: result.signerAddress ?? address ?? "",
    }
  },
}
