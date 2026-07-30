/**
 * Social/email login provider — the auto-generated custodial wallet from #108.
 *
 * The wallet identity (auth_user.wallet, provider "embedded") already exists in
 * the session, but client-side signing for it lands with the Pollar
 * implementation (#108). Until that merges, this provider resolves the address
 * and fails cleanly with an actionable message instead of a broken Kit popup.
 * When #108 lands, implement signTransaction/signMessage here and every escrow
 * flow picks it up with no further changes.
 */

import type { SignedMessage, SignedTransaction, SignTransactionOptions, WalletSigner } from "../types"
import { SignerUnavailableError } from "../types"
import { getStoredAuthWallet } from "../session"

const NOT_READY_MESSAGE =
  "Your account's embedded wallet can't sign transactions yet. Connect an external Stellar wallet to sign this operation."

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

  async signTransaction(_xdr: string, _opts: SignTransactionOptions): Promise<SignedTransaction | null> {
    throw new SignerUnavailableError(NOT_READY_MESSAGE)
  },

  async signMessage(_message: string, _address?: string): Promise<SignedMessage | null> {
    throw new SignerUnavailableError(NOT_READY_MESSAGE)
  },
}
