/**
 * Provider registry and dispatch for the unified signer.
 *
 * Escrow signing goes through the Pollar session. kitSigner is listed for
 * ownership proofs only.
 */

import type { WalletSigner } from "./types"
import { SignerUnavailableError } from "./types"
import { kitSigner } from "./providers/kit"
import { socialSigner } from "./providers/social"

// Escrow signing belongs to the session: an external wallet reaches the network
// through Pollar's Stellar Wallets Kit adapter, so it is a Pollar session like
// any other. kitSigner is listed for ownership proofs only — it never claims to
// be active, so it is reached only when its address is asked for by name, and
// it refuses to sign transactions.
const providers: WalletSigner[] = [kitSigner, socialSigner]

/**
 * Resolve the signer for an address (the provider that owns it in this
 * session), or the active provider when no address is given.
 */
export function resolveSigner(address?: string): WalletSigner {
  if (address) {
    const owner = providers.find((p) => p.ownsAddress(address))
    if (owner) return owner
    // Unknown address: a multi-account wallet can still hold it, so fall
    // through to the active-provider resolution below.
  }

  const active = providers.find((p) => p.isActive())
  if (active) return active

  throw new SignerUnavailableError("No wallet available to sign. Connect a wallet or log in first.")
}
