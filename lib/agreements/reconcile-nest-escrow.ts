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
  /** Raw escrows where the wallet is approver — reused by the approver tab. */
  approverEscrows: TwEscrowRaw[]
  /** False when every TW lookup failed — we cannot verify on-chain state. */
  available: boolean
}

type EscrowRole = "approver" | "service_provider" | "receiver"
const LOOKUP_ROLES: EscrowRole[] = ["approver", "service_provider", "receiver"]

/** Minutes after creation during which a missing escrow is treated as "indexing". */
const CONFIRMING_WINDOW_MS = 30 * 60 * 1000
/** Share one in-flight/recent TW lookup per wallet across dashboards and polls. */
const INDEX_CACHE_TTL_MS = 5000
const indexCache = new Map<string, { at: number; promise: Promise<EscrowIndex> }>()

export function fetchEscrowIndex(walletAddress: string, token?: string): Promise<EscrowIndex> {
  const key = `${walletAddress}::${token ?? ""}`
  const cached = indexCache.get(key)
  if (cached && Date.now() - cached.at < INDEX_CACHE_TTL_MS) return cached.promise
  const promise = loadEscrowIndex(walletAddress, token)
  indexCache.set(key, { at: Date.now(), promise })
  return promise
}

/** Drop cached lookups so the next refresh reads post-transaction chain state. */
export function invalidateEscrowIndex() {
  indexCache.clear()
}

export async function loadEscrowIndex(walletAddress: string, token?: string): Promise<EscrowIndex> {
  const { getEscrowsByRole } = await import("@/services/escrowMigration")
  const results = await Promise.allSettled(
    LOOKUP_ROLES.map((role) => getEscrowsByRole({ role, address: walletAddress }, token)),
  )

  const byContractId = new Map<string, TwEscrowRaw>()
  let approverEscrows: TwEscrowRaw[] = []
  let available = false
  results.forEach((result, i) => {
    if (result.status !== "fulfilled" || !result.value.success) return
    available = true
    const data = result.value.data
    if (!Array.isArray(data)) return
    if (LOOKUP_ROLES[i] === "approver") approverEscrows = data as TwEscrowRaw[]
    for (const escrow of data as TwEscrowRaw[]) {
      if (escrow?.contractId) byContractId.set(escrow.contractId, escrow)
    }
  })
  return { byContractId, approverEscrows, available }
}

/** Buyer/seller from Nest participants when the escrow is not available yet. */
export function roleFromNestParticipants(
  participants: Array<{ wallet_address: string; role: string }> | undefined,
  createdBy: string | undefined,
  walletAddress: string | null,
): "buyer" | "seller" | undefined {
  if (!walletAddress) return undefined
  const me = walletAddress.toUpperCase()
  const mine = (participants ?? [])
    .filter((p) => p.wallet_address?.toUpperCase() === me)
    .map((p) => p.role)
  if (mine.includes("payee")) return "seller"
  if (mine.includes("payer") || mine.includes("approver")) return "buyer"
  if (createdBy?.toUpperCase() === me) return "buyer"
  return undefined
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
      role: escrowRoleFor(view.participants, view.perspective, walletAddress),
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

/**
 * Receiving side wins: an agreement is "I'm getting paid" when the wallet is the
 * service provider or receiver and not the payer (approver/release signer).
 */
function escrowRoleFor(
  participants: { approver?: string; serviceProvider?: string; receiver?: string; releaseSigner?: string },
  perspective: string,
  walletAddress: string | null,
): "buyer" | "seller" | undefined {
  const me = walletAddress?.toUpperCase()
  if (me) {
    const is = (addr?: string) => Boolean(addr) && addr!.toUpperCase() === me
    const pays = is(participants.approver) || is(participants.releaseSigner)
    const gets = is(participants.serviceProvider) || is(participants.receiver)
    if (gets && !pays) return "seller"
    if (pays && !gets) return "buyer"
  }
  if (perspective === "approver" || perspective === "releaseSigner") return "buyer"
  if (perspective === "provider") return "seller"
  return undefined
}

/** Poll fast only while an escrow is being indexed; otherwise refresh lazily. */
export function agreementsRefreshInterval(
  rows: Array<{ status: string; nextAction?: string }>,
): number {
  const confirming = rows.some(
    (r) => r.status === "confirming" || r.nextAction === "wait_confirmation",
  )
  return confirming ? 20000 : 60000
}
