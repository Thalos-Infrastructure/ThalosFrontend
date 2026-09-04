/**
 * Accesly provider — passkey login with distributed custody (#109).
 *
 * Accesly creates a smart account (C-address) and the app derives a G-address
 * bridge for Trustless Work interactions and swaps. Signing runs through the
 * Accesly SDK (WebAuthn passkey → Shamir reconstruction → ed25519), reached
 * via the runtime the `AcceslySignerBridge` component registers.
 */

import type {
  SignedMessage,
  SignedTransaction,
  SignTransactionOptions,
  WalletSigner,
} from "../types"
import { SignerUnavailableError } from "../types"
import { getStoredAuthWallet } from "../session"
import { getAcceslyRuntime } from "../accesly-bridge"

const NO_SESSION_MESSAGE =
  "No active Accesly session on this device. Log in with Accesly (passkey) again to sign."

function acceslyAuthWallet() {
  const wallet = getStoredAuthWallet()
  return wallet?.provider === "accesly" ? wallet : null
}

export const acceslySigner: WalletSigner = {
  id: "accesly",
  label: "Accesly (passkey smart account)",

  ownsAddress(address: string): boolean {
    if (getAcceslyRuntime()?.getGAddress() === address) return true
    return acceslyAuthWallet()?.publicKey === address
  },

  isActive(): boolean {
    return getAcceslyRuntime()?.getGAddress() != null || acceslyAuthWallet() !== null
  },

  async signTransaction(
    xdr: string,
    opts: SignTransactionOptions,
  ): Promise<SignedTransaction | null> {
    const runtime = getAcceslyRuntime()
    if (!runtime) throw new SignerUnavailableError(NO_SESSION_MESSAGE)
    return runtime.signTransaction(xdr, opts.networkPassphrase)
  },

  async signMessage(message: string, _address?: string): Promise<SignedMessage | null> {
    const runtime = getAcceslyRuntime()
    if (!runtime) throw new SignerUnavailableError(NO_SESSION_MESSAGE)
    return runtime.signMessage(message)
  },
}
