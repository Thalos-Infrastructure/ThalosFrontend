/**
 * Turns an agreement, however it arrived, into the state vocabulary
 * `canPerform` understands.
 *
 * The dashboard reads agreements from two sources with different shapes: Nest
 * rows carry a `status` string, on-chain escrows carry a balance and milestone
 * flags. Both funnel through here so permission decisions do not depend on
 * which list the agreement came from.
 */

import type { EscrowLifecycleState, MilestoneState } from "./escrowActions"

export interface MilestoneLike {
  status?: string | null
  approved?: boolean
  released?: boolean
}

export interface AgreementLike {
  status?: string | null
  balance?: string | number | null
  amount?: string | number | null
  /**
   * Who funded the escrow, when anyone has. Trustless Work marks `balance` as
   * optional on the indexer responses that back the agreement lists, so an
   * escrow can come back funded with no balance at all — this field is then
   * the only evidence that it was.
   */
  fundedBy?: string | null
  milestones?: MilestoneLike[]
}

export function deriveMilestoneState(milestone: MilestoneLike | undefined): MilestoneState {
  const status = milestone?.status?.toLowerCase()
  if (milestone?.released === true || status === "released" || status === "completed") {
    return "released"
  }
  if (milestone?.approved === true || status === "approved") return "approved"
  return "pending"
}

/**
 * True when the escrow holds at least the agreed amount.
 *
 * `Number.isFinite` is load-bearing: a missing balance becomes NaN, and every
 * comparison against NaN is false. Reading that as "not funded" is what made a
 * funded escrow keep offering the Fund button on every reload.
 */
function fundedByBalance(input: AgreementLike): boolean {
  const balance = Number(input.balance)
  const amount = Number(input.amount)
  return Number.isFinite(balance) && Number.isFinite(amount) && amount > 0 && balance >= amount
}

/** Someone funded it, whatever the balance field says or omits. */
function hasFunder(input: AgreementLike): boolean {
  return typeof input.fundedBy === "string" && input.fundedBy.trim().length > 0
}

const FUNDED_STATUSES = new Set([
  "funded",
  "active",
  "in_progress",
  "completed",
  "disputed",
  "resolved",
])
const UNFUNDED_STATUSES = new Set(["pending", "initialized", "draft"])

export function deriveLifecycleState(input: AgreementLike): EscrowLifecycleState {
  const status = input.status?.toLowerCase()
  const milestones = input.milestones ?? []
  const states = milestones.map(deriveMilestoneState)

  // A dispute outranks everything else: funds are frozen until it is settled.
  if (status === "disputed") return "disputed"

  const allReleased = states.length > 0 && states.every((state) => state === "released")
  if (allReleased || status === "completed" || status === "released") return "completed"

  if (FUNDED_STATUSES.has(status ?? "") || fundedByBalance(input) || hasFunder(input)) {
    return states.some((state) => state === "approved") ? "in_progress" : "funded"
  }

  if (!status || UNFUNDED_STATUSES.has(status)) return "waiting_for_funding"

  // An unrecognised status is not an invitation to guess: `canPerform` offers
  // nothing in "unknown", which is the safe answer when the chain's view of the
  // escrow has not been established.
  return "unknown"
}
