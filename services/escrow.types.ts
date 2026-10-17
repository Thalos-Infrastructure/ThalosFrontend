// Domain types for escrow operations.
//
// These describe the Trustless Work escrow model, which is still the shape the
// protocol speaks - Thalos just no longer speaks it from the browser. Every
// call now goes through the Nest relay (`services/escrowService.ts`), which
// holds the API key server-side.

export type ServiceType = "single-release" | "multi-release"

export interface AgreementPayload {
  title: string
  description: string
  amount: string
  platformFee: string
  signer: string
  serviceType: ServiceType
  roles: Record<string, string>
  milestones: Array<{
    description: string
    amount: string
    status: string
  }>
  notifications: {
    notifyEmail: string
    signerEmail: string
  }
}

export interface AgreementResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/* ---------------- Escrow Types ---------------- */

export interface EscrowRole {
  approver: string
  serviceProvider: string
  platformAddress: string
  releaseSigner: string
  disputeResolver: string
  receiver?: string
  observers?: string[]
}

export interface EscrowFlags {
  disputed: boolean
  released: boolean
  resolved: boolean
}

export interface EscrowTrustline {
  address: string
  contractId: string
  symbol: string
}

export interface EscrowMilestone {
  description: string
  status: string
  evidence: string
  approved?: boolean
  amount?: number
  flags?: EscrowFlags
  receiver?: string
}

export interface EscrowInconsistencies {
  inconsistencyFound: boolean
  message: string
  differences: string[]
}

export interface Escrow {
  contractId: string
  contractBaseId: string
  signer: string
  type: string
  engagementId: string
  title: string
  description: string
  amount?: number
  platformFee: number
  roles: EscrowRole
  flags?: EscrowFlags
  trustline: EscrowTrustline
  milestones: EscrowMilestone[]
  isActive: boolean
  createdAt: { _seconds: number; _nanoseconds: number }
  updatedAt: { _seconds: number; _nanoseconds: number }
  balance: number
  inconsistencies: EscrowInconsistencies
}
