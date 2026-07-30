/**
 * Shared types for the unified signing abstraction (#110).
 *
 * A WalletSigner is one login method capable of signing Stellar transactions:
 *  - "kit"     → external wallet via Stellar Wallets Kit (Freighter, xBull, LOBSTR…)
 *  - "social"  → custodial/embedded wallet from social or email login (#108)
 *  - "accesly" → Accesly passkey smart account (#109)
 */

export type SignerProviderId = "kit" | "social" | "accesly"

export interface SignedTransaction {
  signedTxXdr: string
}

export interface SignTransactionOptions {
  networkPassphrase: string
  address?: string
}

export interface SignedMessage {
  signedMessage: string
  signerAddress: string
}

export interface WalletSigner {
  id: SignerProviderId
  label: string
  /** True when this provider controls the given address in the current session. */
  ownsAddress(address: string): boolean
  /** True when this provider has an active wallet in the current session. */
  isActive(): boolean
  signTransaction(xdr: string, opts: SignTransactionOptions): Promise<SignedTransaction | null>
  signMessage(message: string, address?: string): Promise<SignedMessage | null>
}

/** Lifecycle of one escrow transaction, reflected in the UI. */
export type TxStatus = "building" | "signing" | "submitting" | "confirmed" | "error"

/** Escrow lifecycle operations that produce an unsigned XDR to sign. */
export type EscrowOperation =
  | "create"
  | "fund"
  | "approveMilestone"
  | "releaseFunds"
  | "dispute"
  | "resolve"
  | "changeMilestoneStatus"

/** Trustless Work role addresses for one escrow, when known client-side. */
export interface EscrowRolesInfo {
  approver?: string
  serviceProvider?: string
  releaseSigner?: string
  disputeResolver?: string
  receiver?: string
}

/** Signing failed because no provider can sign for the active session. */
export class SignerUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SignerUnavailableError"
  }
}

/** The logged-in wallet lacks the Trustless Work role the operation requires. */
export class RoleValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RoleValidationError"
  }
}
