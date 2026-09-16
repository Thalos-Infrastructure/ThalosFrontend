export type ConfirmedAgreementState =
  | "initialized"
  | "waiting_for_funding"
  | "funded"
  | "in_progress"
  | "disputed"
  | "completed"
  | "status_pending_confirmation"

export type AgreementNextAction =
  "fund" | "submit_evidence" | "approve" | "release" | "resolve" | null

export interface AgreementStateSnapshot {
  state: ConfirmedAgreementState
  nextAction: AgreementNextAction
  isConfirmed: boolean
}

type StateInput = {
  status?: string | null
  balance?: string | number | null
  amount?: string | number | null
  milestones?: Array<{ status?: string; approved?: boolean }>
  syncPending?: boolean
}

export function getAgreementStateSnapshot(input: StateInput): AgreementStateSnapshot {
  if (input.syncPending) {
    return { state: "status_pending_confirmation", nextAction: null, isConfirmed: false }
  }

  const status = input.status?.toLowerCase()
  const milestones = input.milestones ?? []
  const hasReleased =
    milestones.length > 0 &&
    milestones.every((milestone) => {
      const value = milestone.status?.toLowerCase()
      return value === "released" || value === "completed"
    })
  const hasApproved = milestones.some(
    (milestone) => milestone.approved === true || milestone.status?.toLowerCase() === "approved",
  )
  const balance = Number(input.balance)
  const amount = Number(input.amount)
  const fundedByBackend =
    status === "funded" ||
    status === "active" ||
    status === "in_progress" ||
    status === "completed" ||
    status === "disputed" ||
    status === "resolved"
  const fundedByBalance =
    Number.isFinite(balance) && Number.isFinite(amount) && amount > 0 && balance >= amount

  if (status === "disputed") return { state: "disputed", nextAction: "resolve", isConfirmed: true }
  if (hasReleased || status === "completed" || status === "released")
    return { state: "completed", nextAction: null, isConfirmed: true }
  if (fundedByBackend || fundedByBalance) {
    if (hasApproved) return { state: "in_progress", nextAction: "release", isConfirmed: true }
    return { state: "funded", nextAction: "submit_evidence", isConfirmed: true }
  }
  if (status === "pending" || status === "initialized" || !status) {
    return {
      state: status === "initialized" ? "initialized" : "waiting_for_funding",
      nextAction: "fund",
      isConfirmed: true,
    }
  }

  return { state: "status_pending_confirmation", nextAction: null, isConfirmed: false }
}

export function isBackendFunded(input: StateInput): boolean {
  const snapshot = getAgreementStateSnapshot(input)
  return snapshot.isConfirmed && ["funded", "in_progress", "completed"].includes(snapshot.state)
}

export function getAgreementStatusLabel(status: ConfirmedAgreementState): string {
  const labels: Record<ConfirmedAgreementState, string> = {
    initialized: "Initialized",
    waiting_for_funding: "Waiting for Funding",
    funded: "Funded",
    in_progress: "In Progress",
    disputed: "Disputed",
    completed: "Completed",
    status_pending_confirmation: "Status pending confirmation",
  }
  return labels[status]
}
