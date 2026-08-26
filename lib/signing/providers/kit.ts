/**
 * Stellar Wallets Kit — ownership proofs only.
 *
 * Since #108 the only way to sign in is Pollar, and a wallet the user brings
 * arrives through Pollar's Kit adapter, so escrow signing always belongs to the
 * session. What the Kit is still needed for is proving that a SECOND wallet
 * belongs to an existing account (/profile → Linked Wallets): the backend
 * issues a challenge and only that wallet can sign it. That is not a login —
 * the session is untouched — so it keeps its signer here.
 *
 * `signTransaction` deliberately refuses. A Kit wallet connected on the side is
 * not the account's signing wallet, and letting it sign an escrow is exactly
 * the bug this arrangement replaced: the escrow was created under the connected
 * address while the account stayed the one the user signed in as.
 */

import { getKit } from "@/lib/stellar-wallet-kit"
import { STELLAR_WALLET_KEY } from "../session"
import type { SignedMessage, SignedTransaction, WalletSigner } from "../types"
import { SignerUnavailableError } from "../types"

function connectedAddress(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(STELLAR_WALLET_KEY)
}

export const kitSigner: WalletSigner = {
  id: "kit",
  label: "External wallet (ownership proof)",

  ownsAddress(address: string): boolean {
    return connectedAddress() === address
  },

  /**
   * Never the fallback signer. `resolveSigner()` with no address picks the
   * first active provider, and claiming that here would route escrow signing
   * back to a side-connected wallet. This provider is only ever reached by
   * asking for its address explicitly.
   */
  isActive(): boolean {
    return false
  },

  async signTransaction(): Promise<SignedTransaction | null> {
    throw new SignerUnavailableError(
      "A wallet connected outside your session can't sign escrow operations. Sign in with it to use it.",
    )
  },

  async signMessage(message: string, address?: string): Promise<SignedMessage | null> {
    const kit = await getKit()
    if (!kit) {
      console.error("[signing:kit] Stellar Wallets Kit not available")
      return null
    }

    const signerAddress = address ?? connectedAddress()
    if (!signerAddress) return null

    const result = await kit.signMessage(message, { address: signerAddress })
    if (!result?.signedMessage) {
      console.error("[signing:kit] Kit returned no signedMessage", result)
      return null
    }

    return { signedMessage: result.signedMessage, signerAddress }
  },
}
