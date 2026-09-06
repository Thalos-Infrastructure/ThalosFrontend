/**
 * Social/email login provider — the custodial wallet from #108.
 *
 * Pollar holds the key, so signing is a round-trip to their API. Trustless Work
 * submits the XDR itself, so this must SIGN ONLY: hence PollarClient.signTx
 * (custodial-capable, despite what @pollar/react's context docs say) rather
 * than signAndSubmitTx.
 */

import type {
  SignedMessage,
  SignedTransaction,
  SignTransactionOptions,
  WalletSigner,
} from "../types"
import { SignerUnavailableError } from "../types"
import { getStoredAuthWallet } from "../session"
import { getPollarClient } from "@/lib/pollar-client"

const NOT_LOGGED_IN_MESSAGE =
  "Your account's embedded wallet isn't available. Log in again, or connect an external Stellar wallet to sign this operation."

/**
 * Unimplemented by design: Pollar exposes no arbitrary message signing for
 * custodial wallets, and the flow that needed it (the wallet-ownership
 * challenge) is replaced by server-side session validation.
 */
const NO_MESSAGE_SIGNING_MESSAGE =
  "Message signing isn't available for embedded wallets. Connect an external Stellar wallet if a signature is required."

function embeddedWallet() {
  const wallet = getStoredAuthWallet()
  return wallet && wallet.provider !== "accesly" ? wallet : null
}

export const socialSigner: WalletSigner = {
  id: "social",
  label: "Embedded wallet (social/email login)",

  ownsAddress(address: string): boolean {
    return embeddedWallet()?.publicKey === address
  },

  isActive(): boolean {
    return embeddedWallet() !== null
  },

  async signTransaction(
    xdr: string,
    opts: SignTransactionOptions,
  ): Promise<SignedTransaction | null> {
    const wallet = embeddedWallet()
    if (!wallet) {
      throw new SignerUnavailableError(NOT_LOGGED_IN_MESSAGE)
    }

    const client = getPollarClient()
    if (!client) {
      throw new SignerUnavailableError(NOT_LOGGED_IN_MESSAGE)
    }

    // Signing with a different wallet yields a signature the network rejects,
    // surfacing far from the cause.
    if (opts.address && opts.address !== wallet.publicKey) {
      throw new SignerUnavailableError(
        "The embedded wallet can't sign for a different address. Connect that wallet to sign this operation.",
      )
    }

    const outcome = await client.signTx(xdr)

    if (outcome.status === "error") {
      // Pollar's own message beats a generic failure.
      const detail = outcome.message || outcome.details || outcome.code
      console.error("[signing:social] Pollar signTx failed:", outcome)
      throw new SignerUnavailableError(
        detail
          ? `Pollar couldn't sign the transaction: ${detail}`
          : "Pollar couldn't sign the transaction.",
      )
    }

    if (!outcome.signedXdr) {
      console.error("[signing:social] Pollar returned no signed XDR", outcome)
      return null
    }

    return { signedTxXdr: outcome.signedXdr }
  },

  async signMessage(_message: string, _address?: string): Promise<SignedMessage | null> {
    throw new SignerUnavailableError(NO_MESSAGE_SIGNING_MESSAGE)
  },
}
