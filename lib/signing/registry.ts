/**
 * Provider registry and dispatch for the unified signer.
 *
 * Priority mirrors useCurrentAddress(): an externally connected Kit wallet
 * wins over the JWT user's embedded/Accesly wallet.
 */

import type { WalletSigner } from "./types"
import { SignerUnavailableError } from "./types"
import { kitSigner } from "./providers/kit"
import { socialSigner } from "./providers/social"
import { acceslySigner } from "./providers/accesly"

const providers: WalletSigner[] = [kitSigner, acceslySigner, socialSigner]

/**
 * Resolve the signer for an address (the provider that owns it in this
 * session), or the active provider when no address is given.
 */
export function resolveSigner(address?: string): WalletSigner {
  if (address) {
    const owner = providers.find((p) => p.ownsAddress(address))
    if (owner) return owner
    // Unknown address: an external Kit wallet can still hold it (multi-account
    // wallets), so fall through to the active-provider resolution below.
  }

  const active = providers.find((p) => p.isActive())
  if (active) return active

  throw new SignerUnavailableError(
    "No wallet available to sign. Connect a wallet or log in first.",
  )
}
