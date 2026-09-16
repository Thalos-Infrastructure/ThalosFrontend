/**
 * Bridge between the React-only Accesly SDK and the framework-agnostic
 * unified signer (#110).
 *
 * The Accesly SDK lives behind a React provider (`useAccesly()`), but
 * `lib/signing` providers are plain modules called from lib/agreementActions.
 * The `AcceslySignerBridge` component (lib/accesly/accesly-provider.tsx)
 * registers a runtime here whenever an Accesly session is active;
 * providers/accesly.ts delegates to it.
 */

export interface AcceslyRuntime {
  /** G-address bridge of the logged-in Accesly user, when provisioned. */
  getGAddress(): string | null
  /** Signs a Stellar transaction XDR with the user's reconstructed key (passkey prompt). */
  signTransaction(xdr: string, networkPassphrase: string): Promise<{ signedTxXdr: string } | null>
  /** Signs an arbitrary message (raw ed25519) — used for wallet-challenge auth. */
  signMessage(message: string): Promise<{ signedMessage: string; signerAddress: string } | null>
}

let runtime: AcceslyRuntime | null = null

export function registerAcceslyRuntime(r: AcceslyRuntime | null): void {
  runtime = r
}

export function getAcceslyRuntime(): AcceslyRuntime | null {
  return runtime
}
