/**
 * Accesly provider — passkey login with distributed custody (#109).
 *
 * Accesly creates a smart account (C-address) and the app derives a G-address
 * for Trustless Work interactions. This provider is the registration point for
 * that flow: #109 implements signTransaction/signMessage through the Accesly
 * SDK and the unified dispatch picks it up automatically.
 */

import type { SignedMessage, SignedTransaction, SignTransactionOptions, WalletSigner } from "../types"
import { SignerUnavailableError } from "../types"
import { getStoredAuthWallet } from "../session"

const NOT_READY_MESSAGE =
  "Accesly signing is not available yet. Connect an external Stellar wallet to sign this operation."

function acceslyWallet() {
  const wallet = getStoredAuthWallet()
  return wallet?.provider === "accesly" ? wallet : null
}

export const acceslySigner: WalletSigner = {
  id: "accesly",
  label: "Accesly (passkey smart account)",

  ownsAddress(address: string): boolean {
    return acceslyWallet()?.publicKey === address
  },

  isActive(): boolean {
    return acceslyWallet() !== null
  },

  async signTransaction(_xdr: string, _opts: SignTransactionOptions): Promise<SignedTransaction | null> {
    throw new SignerUnavailableError(NOT_READY_MESSAGE)
  },

  async signMessage(_message: string, _address?: string): Promise<SignedMessage | null> {
    throw new SignerUnavailableError(NOT_READY_MESSAGE)
  },
}
