/**
 * Display state for one agreement.
 *
 * The state itself is derived by `lib/permissions/agreementState`, so the label
 * on screen and the actions offered cannot disagree about what state an
 * agreement is in.
 *
 * This module deliberately no longer returns a "next action". A next action is
 * per-actor — the service provider submits evidence, the approver approves, the
 * release signer releases — and computing one from the agreement alone is what
 * offered the approver a button the backend rejects. Ask
 * `availableOperations(...)` from `lib/permissions/escrowActions` instead, which
 * takes the viewer's wallet.
 */

import {
  deriveLifecycleState,
  type AgreementLike,
  type MilestoneLike,
} from "@/lib/permissions/agreementState"
import type { EscrowLifecycleState } from "@/lib/permissions/escrowActions"

export type ConfirmedAgreementState = EscrowLifecycleState

export interface AgreementStateSnapshot {
  state: ConfirmedAgreementState
  /** False while the backend has not confirmed a state we can act on. */
  isConfirmed: boolean
}

export type StateInput = AgreementLike & { syncPending?: boolean }

export function getAgreementStateSnapshot(input: StateInput): AgreementStateSnapshot {
  if (input.syncPending) return { state: "unknown", isConfirmed: false }

  const state = deriveLifecycleState(input)
  return { state, isConfirmed: state !== "unknown" }
}

export function isBackendFunded(input: StateInput): boolean {
  const { state, isConfirmed } = getAgreementStateSnapshot(input)
  return isConfirmed && ["funded", "in_progress", "completed"].includes(state)
}

export function getAgreementStatusLabel(status: ConfirmedAgreementState): string {
  const labels: Record<ConfirmedAgreementState, string> = {
    waiting_for_funding: "Waiting for Funding",
    funded: "Funded",
    in_progress: "In Progress",
    disputed: "Disputed",
    completed: "Completed",
    unknown: "Status pending confirmation",
  }
  return labels[status]
}

export type { AgreementLike, MilestoneLike }
