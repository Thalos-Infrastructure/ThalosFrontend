/**
 * Settling a dispute on-chain.
 *
 * Until now the "Resolve Dispute" button wrote `status = resolved` to Supabase
 * and showed a green tick. Nothing reached the chain: the escrow stayed
 * disputed and the funds stayed locked, while the app said the opposite. This
 * is the flow that actually moves the money, and the database write is the
 * *last* step — a record of something that happened, not a claim that it will.
 *
 * The shape mirrors `fundAndSignEscrow` in `lib/agreementActions`: build the
 * unsigned XDR through the backend, sign it with the resolver's wallet, submit,
 * confirm against the chain, then persist.
 */

import {
  getEscrowByContractId,
  resolveDispute as buildResolveDispute,
} from "@/services/escrowService"
import type { EscrowSnapshot } from "@/lib/api/escrow"
import { sendTransaction } from "@/services/escrowService"
import { signEscrowOperation, type TxStatus } from "@/lib/signing"
import { resolveDispute as persistResolution } from "@/lib/api/disputes"

/** One address that cannot receive the escrow's asset, and why. */
export interface TrustlineProblem {
  address: string
  /** `missing`: the account exists but has no trustline. `no-account`: it is not on the ledger. */
  reason: "missing" | "no-account"
}

export interface ResolveDisputeFailure {
  message: string
  /** Set when the backend refused because a recipient cannot receive the asset. */
  trustlineProblems?: TrustlineProblem[]
}

export interface ResolveDisputeParams {
  disputeId: string
  contractId: string
  escrow: EscrowSnapshot
  /** Share for the payer (the approver), 0-100. The payee gets the rest. */
  payerPercentage: number
  resolutionNotes?: string
  walletAddress: string | null
  token: string | null
  /**
   * Multi-release only: which milestone is being settled. Required there — a
   * default would quietly settle milestone 0 and move the wrong money.
   */
  milestoneIndex?: string
  onStatus?: (status: TxStatus) => void
  /** How long to wait for the chain to report it settled. Defaults below. */
  confirm?: { attempts?: number; intervalMs?: number }
}

export interface ResolveDisputeResult {
  success: boolean
  failure?: ResolveDisputeFailure
  /** Submitted, but the chain had not reported it resolved before we gave up waiting. */
  pendingConfirmation?: boolean
}

const CONFIRM_ATTEMPTS = 10
const CONFIRM_INTERVAL_MS = 2000

interface ConfirmWindow {
  attempts?: number
  intervalMs?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Pull the trustline problems out of a backend refusal.
 *
 * The resolver cannot fix a missing trustline — only the holder of that address
 * can add it — so the UI has to name the party rather than print the sentence
 * and leave them guessing which one.
 */
export function readTrustlineProblems(errorBody: unknown): TrustlineProblem[] | undefined {
  if (!isRecord(errorBody) || errorBody.code !== "TRUSTLINE_MISSING") return undefined
  if (!Array.isArray(errorBody.problems)) return undefined

  const problems = errorBody.problems
    .filter(isRecord)
    .map((problem) => ({
      address: typeof problem.address === "string" ? problem.address : "",
      reason: problem.reason === "no-account" ? ("no-account" as const) : ("missing" as const),
    }))
    .filter((problem) => problem.address !== "")

  return problems.length > 0 ? problems : undefined
}

/** True when `index` names a milestone this escrow actually has. */
export function isMilestoneOf(escrow: EscrowSnapshot, index?: string): boolean {
  if (index === undefined || index.trim() === "") return false
  const parsed = Number(index)
  return Number.isInteger(parsed) && parsed >= 0 && parsed < escrow.milestones.length
}

/**
 * What a resolution of this escrow distributes.
 *
 * single-release splits the whole balance; multi-release splits one milestone,
 * capped by what the contract actually holds. This mirrors `resolutionTotal` on
 * the backend, which is the number that will really be split — showing the
 * balance for a multi-release milestone would promise funds reserved for the
 * other milestones.
 */
export function distributableFor(escrow: EscrowSnapshot, milestoneIndex?: string): number {
  if (escrow.type === "single-release") return escrow.balance
  if (!isMilestoneOf(escrow, milestoneIndex)) return 0

  const amount = escrow.milestones[Number(milestoneIndex)]?.amount ?? 0
  return escrow.balance > 0 ? Math.min(amount, escrow.balance) : amount
}

/**
 * The split the resolver chose, as the two allocations the backend expects.
 *
 * "Payer" and "Payee" are the labels the dispute screen uses; on the escrow
 * they are the approver and the service provider, and those are the addresses
 * the funds can actually be sent to.
 */
export function allocationsFor(
  escrow: EscrowSnapshot,
  payerPercentage: number,
): Array<{ address: string; percentage: number }> {
  const payer = escrow.roles.approver
  const payee = escrow.roles.serviceProvider ?? escrow.roles.receiver

  if (!payer || !payee) {
    throw new Error(
      "This escrow's approver and service provider could not be read, so there is nowhere to send the funds.",
    )
  }

  return [
    { address: payer, percentage: payerPercentage },
    { address: payee, percentage: 100 - payerPercentage },
  ]
}

/**
 * Wait for Trustless Work to report the escrow as resolved.
 *
 * Submitting is not settling: the indexer lags behind the ledger, and writing
 * `resolved` to our database off the back of a submit is the same mistake this
 * whole flow exists to undo. Giving up here is reported as pending, never as
 * success.
 */
async function waitForResolvedOnChain(
  contractId: string,
  token: string | null,
  window: ConfirmWindow = {},
): Promise<boolean> {
  const attempts = window.attempts ?? CONFIRM_ATTEMPTS
  const intervalMs = window.intervalMs ?? CONFIRM_INTERVAL_MS

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, intervalMs))

    const result = await getEscrowByContractId(contractId, token ?? undefined)
    if (!result.success || !result.data) continue

    // `resolved` is the flag that matters; `disputed` clearing is the same
    // event seen from the other side, and either is enough.
    if (result.data.flags.resolved || !result.data.flags.disputed) return true
  }
  return false
}

export async function resolveDisputeOnChain({
  disputeId,
  contractId,
  escrow,
  payerPercentage,
  resolutionNotes,
  walletAddress,
  token,
  milestoneIndex,
  onStatus,
  confirm,
}: ResolveDisputeParams): Promise<ResolveDisputeResult> {
  if (!walletAddress) {
    return {
      success: false,
      failure: { message: "Connect the resolver wallet to settle this dispute." },
    }
  }
  if (!token) {
    return { success: false, failure: { message: "Sign in to settle this dispute." } }
  }

  let allocations: Array<{ address: string; percentage: number }>
  try {
    allocations = allocationsFor(escrow, payerPercentage)
  } catch (error) {
    return { success: false, failure: { message: (error as Error).message } }
  }

  // Multi-release settles one milestone. Falling back to the first one would
  // distribute the funds of a milestone nobody disputed, so refuse instead.
  if (escrow.type === "multi-release" && !isMilestoneOf(escrow, milestoneIndex)) {
    return {
      success: false,
      failure: {
        message: "Choose which milestone this resolution settles before continuing.",
      },
    }
  }

  onStatus?.("building")
  const built = await buildResolveDispute(
    {
      contractId,
      type: escrow.type,
      disputeResolver: walletAddress,
      allocations,
      ...(escrow.type === "multi-release" ? { milestoneIndex: milestoneIndex as string } : {}),
    },
    token,
  )

  if (!built.success || !built.data?.unsignedTransaction) {
    onStatus?.("error")
    return {
      success: false,
      failure: {
        message: built.error ?? "Could not build the resolution.",
        ...(readTrustlineProblems(built.errorBody)
          ? { trustlineProblems: readTrustlineProblems(built.errorBody) }
          : {}),
      },
    }
  }

  try {
    // `roles` lets the signing layer refuse before the wallet pops up when the
    // connected wallet is not this escrow's dispute resolver.
    const signed = await signEscrowOperation({
      xdr: built.data.unsignedTransaction,
      operation: "resolve",
      address: walletAddress,
      roles: escrow.roles,
      onStatus,
    })

    onStatus?.("submitting")
    const sent = await sendTransaction(signed.signedTxXdr, token)
    if (!sent.success) {
      onStatus?.("error")
      return {
        success: false,
        failure: { message: sent.error ?? "The resolution was not submitted." },
      }
    }
  } catch (error) {
    onStatus?.("error")
    return { success: false, failure: { message: (error as Error).message } }
  }

  if (!(await waitForResolvedOnChain(contractId, token, confirm))) {
    // Submitted and probably fine, but unconfirmed. Saying "resolved" here is
    // exactly the lie this flow replaces.
    return { success: false, pendingConfirmation: true }
  }

  // The chain has settled it; now the record can say so.
  const persisted = await persistResolution(
    disputeId,
    {
      resolved_by: walletAddress,
      payer_percentage: payerPercentage,
      payee_percentage: 100 - payerPercentage,
      ...(resolutionNotes ? { resolution_notes: resolutionNotes } : {}),
    },
    token,
  )

  onStatus?.("confirmed")
  if (!persisted.success) {
    // The funds moved. Failing the whole operation here would tell the resolver
    // to try again, which the chain would then refuse as already resolved.
    return {
      success: true,
      failure: {
        message: `The funds were distributed on-chain, but Thalos could not record it: ${persisted.error ?? "unknown error"}`,
      },
    }
  }

  return { success: true }
}
