/**
 * Map a Trustless Work escrow payload into the shared AgreementViewModel.
 */
import {
  computeNextAction,
  type AgreementViewMilestone,
  type AgreementViewModel,
  type EscrowType,
} from "@/lib/types/agreement-view"
import { twMilestoneStatus } from "@/lib/types/status"

/** Loose TW escrow shape (indexer / getEscrowsByRole). */
export type TwEscrowRaw = {
  contractId?: string
  type?: string
  title?: string
  amount?: number | string
  balance?: number | string
  flags?: { released?: boolean; disputed?: boolean; resolved?: boolean }
  roles?: {
    approver?: string
    serviceProvider?: string
    releaseSigner?: string
    disputeResolver?: string
    receiver?: string
    platformAddress?: string
  }
  milestones?: Array<{
    approved?: boolean
    description?: string
    amount?: number | string
    status?: string
    evidence?: string
    receiver?: string
    flags?: { released?: boolean; approved?: boolean; disputed?: boolean }
  }>
  createdAt?: { _seconds?: number }
  /** Optional last tx hash if present on enriched payloads. */
  lastTransaction?: string | null
}

function escrowType(raw?: string): EscrowType {
  return raw === "multi-release" ? "multi-release" : "single-release"
}

function deriveEscrowStatus(escrow: TwEscrowRaw, amountNum: number, balanceNum: number): string {
  if (escrow.flags?.released) return "completed"
  if (escrow.flags?.resolved) return "resolved"
  if (escrow.flags?.disputed) return "disputed"
  if (balanceNum <= 0) return "pending"
  if (amountNum > 0 && balanceNum + 1e-9 < amountNum) return "pending"
  return "funded"
}

export function mapTwEscrowToAgreementView(
  escrow: TwEscrowRaw,
  walletAddress?: string | null,
): AgreementViewModel {
  const type = escrowType(escrow.type)
  const milestonesRaw = escrow.milestones || []
  const amountNum =
    type === "multi-release"
      ? milestonesRaw.reduce((sum, m) => sum + Number(m.amount || 0), 0)
      : Number(escrow.amount || 0)
  const balanceNum = Number(escrow.balance || 0)

  const milestones: AgreementViewMilestone[] = milestonesRaw.map((m, index) => {
    const released = Boolean(m.flags?.released)
    const approved = Boolean(m.approved || m.flags?.approved)
    const mapped = m.status ? twMilestoneStatus(m.status) : null
    const status =
      released ? "released" : approved ? "approved" : mapped || m.status || "pending"
    return {
      index,
      description: m.description ?? "",
      amount:
        m.amount !== undefined && m.amount !== null
          ? String(m.amount)
          : type === "single-release" && escrow.amount != null
            ? String(escrow.amount)
            : "",
      status,
      approved,
      evidence: m.evidence,
      released,
      disputed: Boolean(m.flags?.disputed),
      receiver: m.receiver,
    }
  })

  const completedMilestones = milestones.filter((m) => m.released || m.approved).length
  const participants = {
    approver: escrow.roles?.approver,
    serviceProvider: escrow.roles?.serviceProvider,
    releaseSigner: escrow.roles?.releaseSigner,
    disputeResolver: escrow.roles?.disputeResolver,
    receiver: escrow.roles?.receiver || escrow.roles?.serviceProvider,
    platformAddress: escrow.roles?.platformAddress,
  }

  const escrowStatus = deriveEscrowStatus(escrow, amountNum, balanceNum)
  const { nextAction, blockedReason, perspective } = computeNextAction({
    type,
    escrowStatus,
    released: Boolean(escrow.flags?.released),
    disputed: Boolean(escrow.flags?.disputed),
    balance: balanceNum,
    configuredAmount: amountNum,
    milestones,
    participants,
    walletAddress,
    funderIsApproverOnly: true,
  })

  return {
    contractId: escrow.contractId || "",
    title: escrow.title ?? "-",
    type,
    role: perspective,
    perspective,
    escrowStatus,
    milestones,
    completedMilestones,
    totalMilestones: milestones.length,
    balance: escrow.balance != null ? String(escrow.balance) : "0",
    amount: amountNum ? String(amountNum) : "",
    currency: "USDC",
    participants,
    nextAction,
    blockedReason,
    lastTransaction: escrow.lastTransaction ?? null,
    released: Boolean(escrow.flags?.released),
    date: escrow.createdAt?._seconds
      ? new Date(escrow.createdAt._seconds * 1000).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  }
}

/**
 * Legacy dashboard Agreement row shape (Personal / Business list cards).
 * Built from the shared view-model so list + detail stay aligned.
 */
export function agreementViewToLegacyListItem(view: AgreementViewModel) {
  return {
    id: view.contractId,
    title: view.title,
    status: view.escrowStatus,
    type: (view.type === "multi-release" ? "Multi Release" : "Single Release") as
      | "Multi Release"
      | "Single Release",
    counterparty: view.participants.serviceProvider
      ? `${view.participants.serviceProvider.slice(0, 8)}...`
      : "-",
    amount: view.amount,
    currency: view.currency,
    date: view.date,
    milestones: view.milestones.map((m) => ({
      approved: m.approved,
      description: m.description,
      amount: m.amount,
      status: m.status,
      evidence: m.evidence,
    })),
    receiver: view.participants.receiver || "-",
    balance: view.balance,
    serviceProvider: view.participants.serviceProvider || "-",
    approver: view.participants.approver,
    releaseSigner: view.participants.releaseSigner,
    disputeResolver: view.participants.disputeResolver,
    released: view.released,
    role: view.perspective === "approver" ? ("buyer" as const) : ("seller" as const),
    nextAction: view.nextAction,
    blockedReason: view.blockedReason,
  }
}
