/**
 * Reconcile Nest agreement rows with the live Trustless Work escrow.
 *
 * Nest can report `funded` right after creation; the escrow (balance + flags)
 * is the source of truth for lifecycle, roles and the next action.
 */
import type { AgreementNextAction } from "@/lib/types/agreement-view"
import { mapTwEscrowToAgreementView, type TwEscrowRaw } from "@/lib/agreements/map-tw-escrow"
import type { MilestoneStatus } from "@/lib/types/status"

export type EscrowIndex = {
  byContractId: Map<string, TwEscrowRaw>
  /** False when every TW lookup failed — we cannot verify on-chain state. */
  available: boolean
}

type EscrowRole = "approver" | "service_provider" | "receiver"
const LOOKUP_ROLES: EscrowRole[] = ["approver", "service_provider", "receiver"]

/** Minutes after creation during which a missing escrow is treated as "indexing". */
const CONFIRMING_WINDOW_MS = 30 * 60 * 1000

export async function fetchEscrowIndex(
  walletAddress: string,
  token?: string,
): Promise<EscrowIndex> {
  const { getEscrowsByRole } = await import("@/services/escrowMigration")
  const results = await Promise.allSettled(
    LOOKUP_ROLES.map((role) => getEscrowsByRole({ role, address: walletAddress }, token)),
  )

  const byContractId = new Map<string, TwEscrowRaw>()
  let available = false
  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value.success) continue
    available = true
    const data = result.value.data
    if (!Array.isArray(data)) continue
    for (const escrow of data as TwEscrowRaw[]) {
      if (escrow?.contractId) byContractId.set(escrow.contractId, escrow)
    }
  }
  return { byContractId, available }
}

const VIEW_STATUS_TO_UI: Record<string, string> = {
  pending: "pending",
  funded: "funded",
  disputed: "disputed",
  completed: "released",
  resolved: "released",
}

export type ReconciledAgreementState = {
  status: string
  nextAction: AgreementNextAction
  blockedReason: string | null
  role?: "buyer" | "seller"
  serviceProvider?: string
  approver?: string
  releaseSigner?: string
  disputeResolver?: string
  receiver?: string
  balance?: string
  released?: boolean
  /** Live milestone statuses from the escrow (same order as Nest). */
  milestoneStatuses?: MilestoneStatus[]
  milestoneEvidence?: (string | undefined)[]
  /** True when the escrow exists in Nest but TW has not indexed it yet. */
  confirming: boolean
}

export function reconcileWithEscrow(input: {
  contractId?: string | null
  nestUiStatus: string
  createdAt?: string
  walletAddress: string | null
  index: EscrowIndex | null
}): ReconciledAgreementState {
  const { contractId, nestUiStatus, createdAt, walletAddress, index } = input
  const escrow = contractId ? index?.byContractId.get(contractId) : undefined

  if (escrow) {
    const view = mapTwEscrowToAgreementView(escrow, walletAddress)
    const hasProgress = view.milestones.some((m) => m.evidence || m.approved || m.released)
    let status = VIEW_STATUS_TO_UI[view.escrowStatus] ?? String(view.escrowStatus)
    if (status === "funded" && hasProgress) status = "in_progress"
    return {
      status,
      nextAction: view.nextAction,
      blockedReason: view.blockedReason,
      role:
        view.perspective === "approver"
          ? "buyer"
          : view.perspective === "provider"
            ? "seller"
            : undefined,
      serviceProvider: view.participants.serviceProvider,
      approver: view.participants.approver,
      releaseSigner: view.participants.releaseSigner,
      disputeResolver: view.participants.disputeResolver,
      receiver: view.participants.receiver,
      balance: view.balance,
      released: view.released,
      milestoneStatuses: view.milestones.map((m) => m.status),
      milestoneEvidence: view.milestones.map((m) => m.evidence),
      confirming: false,
    }
  }

  const terminal = ["released", "completed", "resolved", "cancelled"].includes(nestUiStatus)
  if (terminal) {
    return { status: nestUiStatus, nextAction: "none", blockedReason: null, confirming: false }
  }

  const createdMs = createdAt ? Date.parse(createdAt) : NaN
  const recentlyCreated =
    Number.isFinite(createdMs) && Date.now() - createdMs < CONFIRMING_WINDOW_MS

  if (contractId && index?.available && recentlyCreated) {
    return {
      status: "confirming",
      nextAction: "wait_confirmation",
      blockedReason: "Contrato creado — confirmando en la red. Se actualiza automáticamente.",
      confirming: true,
    }
  }

  // Without a verifiable escrow never show "funded": the balance is unconfirmed.
  return {
    status: nestUiStatus === "funded" || nestUiStatus === "in_progress" ? "pending" : nestUiStatus,
    nextAction: "none",
    blockedReason: index?.available
      ? "No encontramos el escrow on-chain para este acuerdo"
      : "No se pudo verificar el estado on-chain. Reintentando…",
    confirming: Boolean(contractId && recentlyCreated),
  }
}

/** Poll faster while something is waiting on the network. */
export function agreementsRefreshInterval(
  rows: Array<{ status: string; nextAction?: string }>,
): number {
  const waiting = rows.some(
    (r) => r.status === "confirming" || r.status === "pending" || r.nextAction === "wait_confirmation",
  )
  return waiting ? 8000 : 30000
}
