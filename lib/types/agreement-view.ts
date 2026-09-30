/**
 * Shared agreement view-model for Personal / Business / approver / analytics / chat.
 *
 * Until Nest exposes this shape, `mapTwEscrowToAgreementView` builds it on the FE.
 * When the backend endpoint lands, swap only the mapper — screens stay unchanged.
 */
import type { AgreementStatus, MilestoneStatus } from "@/lib/types/status"

export type EscrowType = "single-release" | "multi-release"

export type AgreementPerspective = "approver" | "provider" | "releaseSigner" | "observer"

/** Product-facing next step (computed locally today; later from Nest). */
export type AgreementNextAction =
  | "none"
  | "fund"
  | "submit_evidence"
  | "approve_milestone"
  | "release"
  | "open_dispute"
  | "resolve_dispute"
  | "wait_confirmation"

export type AgreementParticipantRoles = {
  approver?: string
  serviceProvider?: string
  releaseSigner?: string
  disputeResolver?: string
  receiver?: string
  platformAddress?: string
}

export type AgreementViewMilestone = {
  index: number
  description: string
  amount: string
  /** Milestone workflow status (pending / approved / released / …). */
  status: MilestoneStatus | string
  approved: boolean
  evidence?: string
  released: boolean
  disputed?: boolean
  receiver?: string
}

export type AgreementViewModel = {
  contractId: string
  title: string
  type: EscrowType
  /** UI role for the current wallet relative to this escrow. */
  role: AgreementPerspective
  perspective: AgreementPerspective
  /** High-level escrow lifecycle (Nest/TW combined). */
  escrowStatus: AgreementStatus | string
  milestones: AgreementViewMilestone[]
  completedMilestones: number
  totalMilestones: number
  balance: string
  amount: string
  currency: string
  participants: AgreementParticipantRoles
  nextAction: AgreementNextAction
  blockedReason: string | null
  lastTransaction: string | null
  /** Convenience mirrors used by existing detail UIs. */
  released: boolean
  date: string
}

export type NextActionInput = {
  type: EscrowType
  escrowStatus: string
  released: boolean
  disputed: boolean
  balance: number
  configuredAmount: number
  milestones: AgreementViewMilestone[]
  participants: AgreementParticipantRoles
  /** Connected wallet (G-address). */
  walletAddress: string | null | undefined
  /**
   * Thalos product rule: only the approver may fund from the UI.
   * Trustless Work V1 allows any depositor on-chain.
   */
  funderIsApproverOnly?: boolean
}

function norm(addr?: string | null): string {
  return (addr || "").trim().toUpperCase()
}

function walletIs(wallet: string | null | undefined, roleAddr?: string): boolean {
  if (!wallet || !roleAddr) return false
  return norm(wallet) === norm(roleAddr)
}

/**
 * Derive the next UI action + block reason from escrow/milestone/role state.
 * Local provisional logic — Nest should own this later.
 */
export function computeNextAction(input: NextActionInput): {
  nextAction: AgreementNextAction
  blockedReason: string | null
  perspective: AgreementPerspective
} {
  const {
    type,
    escrowStatus,
    released,
    disputed,
    balance,
    configuredAmount,
    milestones,
    participants,
    walletAddress,
    funderIsApproverOnly = true,
  } = input

  const isApprover = walletIs(walletAddress, participants.approver)
  const isProvider = walletIs(walletAddress, participants.serviceProvider)
  const isReleaseSigner = walletIs(walletAddress, participants.releaseSigner)
  const isDisputeResolver = walletIs(walletAddress, participants.disputeResolver)
  const isReceiver = walletIs(walletAddress, participants.receiver)

  let perspective: AgreementPerspective = "observer"
  if (isApprover) perspective = "approver"
  else if (isProvider) perspective = "provider"
  else if (isReleaseSigner) perspective = "releaseSigner"

  if (!walletAddress) {
    return {
      nextAction: "none",
      blockedReason: "Connect a wallet to act on this agreement",
      perspective,
    }
  }

  if (released || escrowStatus === "completed" || escrowStatus === "resolved") {
    return { nextAction: "none", blockedReason: null, perspective }
  }

  if (disputed || escrowStatus === "disputed") {
    if (isDisputeResolver) {
      return { nextAction: "resolve_dispute", blockedReason: null, perspective }
    }
    return {
      nextAction: "none",
      blockedReason: "Escrow is disputed — waiting for the dispute resolver",
      perspective,
    }
  }

  const funded = balance > 0 && (configuredAmount <= 0 || balance + 1e-9 >= configuredAmount)
  const awaitingFunds =
    !funded &&
    (escrowStatus === "pending" ||
      escrowStatus === "draft" ||
      escrowStatus === "awaiting_funding" ||
      balance < configuredAmount)

  if (awaitingFunds) {
    const canFund = funderIsApproverOnly ? isApprover : true
    if (canFund) {
      return { nextAction: "fund", blockedReason: null, perspective }
    }
    return {
      nextAction: "none",
      blockedReason: "Awaiting funding from the approver (company)",
      perspective,
    }
  }

  // Find first actionable milestone (multi) or treat all (single).
  const pendingEvidence = milestones.find(
    (m) => !m.released && !m.approved && !m.evidence && m.status !== "approved",
  )
  const pendingApproval = milestones.find(
    (m) => !m.released && !m.approved && Boolean(m.evidence || m.status === "completed"),
  )
  const approvedUnreleased = milestones.filter((m) => m.approved && !m.released)

  if (pendingEvidence && isProvider) {
    return { nextAction: "submit_evidence", blockedReason: null, perspective }
  }
  if (pendingEvidence && !isProvider) {
    return {
      nextAction: "none",
      blockedReason: "Waiting for the provider to submit evidence",
      perspective,
    }
  }

  if (pendingApproval && isApprover) {
    return { nextAction: "approve_milestone", blockedReason: null, perspective }
  }
  if (pendingApproval && !isApprover) {
    return {
      nextAction: "none",
      blockedReason: "Waiting for the approver to approve the milestone",
      perspective,
    }
  }

  if (type === "single-release") {
    const allApproved =
      milestones.length > 0 && milestones.every((m) => m.approved || m.released)
    if (allApproved && isReleaseSigner) {
      return { nextAction: "release", blockedReason: null, perspective }
    }
    if (allApproved && !isReleaseSigner) {
      return {
        nextAction: "none",
        blockedReason: "All milestones approved — waiting for the release signer",
        perspective,
      }
    }
  } else if (approvedUnreleased.length > 0) {
    if (isReleaseSigner) {
      return { nextAction: "release", blockedReason: null, perspective }
    }
    return {
      nextAction: "none",
      blockedReason: "Milestone approved — waiting for the release signer",
      perspective,
    }
  }

  // Dispute is available to TW V1 dispute-capable roles (not disputeResolver).
  const canOpenDispute =
    isApprover || isProvider || isReleaseSigner || isReceiver || walletIs(walletAddress, participants.platformAddress)
  if (canOpenDispute && funded && !released) {
    return { nextAction: "open_dispute", blockedReason: null, perspective }
  }

  return { nextAction: "none", blockedReason: null, perspective }
}

/**
 * Provisional nextAction when the list row comes from Nest (no live TW balance/roles).
 * Prefer `computeNextAction` once the escrow is enriched from Trustless Work.
 */
export function computeNextActionFromNestListing(input: {
  uiStatus: string
  role?: "buyer" | "seller"
}): { nextAction: AgreementNextAction; blockedReason: string | null } {
  const status = (input.uiStatus || "").toLowerCase()
  const role = input.role

  if (status === "released" || status === "completed" || status === "cancelled" || status === "resolved") {
    return { nextAction: "none", blockedReason: null }
  }

  if (status === "awaiting" || status === "disputed") {
    return {
      nextAction: "none",
      blockedReason: "Escrow is disputed — waiting for the dispute resolver",
    }
  }

  if (status === "pending") {
    if (role === "buyer") return { nextAction: "fund", blockedReason: null }
    return {
      nextAction: "none",
      blockedReason: "Awaiting funding from the approver (company)",
    }
  }

  // funded / in_progress / active — Nest listing has no evidence flags yet
  if (role === "seller") return { nextAction: "submit_evidence", blockedReason: null }
  if (role === "buyer") return { nextAction: "approve_milestone", blockedReason: null }
  return { nextAction: "none", blockedReason: null }
}

export function formatNextActionLabel(action: AgreementNextAction | string): string {
  return String(action || "none").replace(/_/g, " ")
}
