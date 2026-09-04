// ============================================================================
// Canonical Status Types & Mappers
// GF-10 — Single source of truth for milestone/agreement statuses on the FE.
//
// All components should import MilestoneStatus / AgreementStatus from here
// instead of defining inline string-literal unions.
// ============================================================================

// ---------------------------------------------------------------------------
// Canonical enums
// ---------------------------------------------------------------------------

/** Canonical milestone statuses. Mirrors the authoritative GF-4 BE enum. */
export type MilestoneStatus = "pending" | "approved" | "released" | "rejected"

/** Set of all valid milestone status values (for runtime checks). */
export const MILESTONE_STATUSES: ReadonlySet<MilestoneStatus> = new Set([
  "pending",
  "approved",
  "released",
  "rejected",
])

/** Canonical agreement-level statuses. */
export type AgreementStatus =
  "pending" | "funded" | "active" | "completed" | "disputed" | "resolved" | "cancelled"

// ---------------------------------------------------------------------------
// Milestone mappers
// ---------------------------------------------------------------------------

/**
 * Map a Trustless Work (TW) milestone status string to the canonical
 * MilestoneStatus.  Handles legacy "completed" -> "released" and
 * hyphenated / non-standard values.
 *
 * Returns null for unknown statuses and logs a console warning so bad data
 * does not silently degrade to "pending".
 */
export function twMilestoneStatus(raw: string): MilestoneStatus | null {
  const v = raw.toLowerCase().trim()
  if (v === "released" || v === "completed") return "released"
  if (v === "approved") return "approved"
  if (v === "rejected") return "rejected"
  if (v === "pending" || v === "in-progress" || v === "in_progress") return "pending"
  console.warn(`[status] twMilestoneStatus: unknown status "${raw}"`)
  return null
}

/**
 * Map a NestJS-backend milestone status string to the canonical
 * MilestoneStatus.  Handles legacy "completed" -> "released" and
 * capitalized variants.
 *
 * Returns null for unknown statuses and logs a console warning.
 */
export function nestMilestoneStatus(raw: string): MilestoneStatus | null {
  const v = raw.toLowerCase().trim()
  if (v === "released" || v === "completed") return "released"
  if (v === "approved") return "approved"
  if (v === "rejected") return "rejected"
  if (v === "pending") return "pending"
  console.warn(`[status] nestMilestoneStatus: unknown status "${raw}"`)
  return null
}

/**
 * Check whether a string is a valid canonical MilestoneStatus.
 */
export function isMilestoneStatus(value: string): value is MilestoneStatus {
  return (MILESTONE_STATUSES as ReadonlySet<string>).has(value)
}

/**
 * Canonical milestone status -> human-readable UI label.
 */
export function milestoneStatusLabel(status: MilestoneStatus): string {
  const labels: Record<MilestoneStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    released: "Released",
    rejected: "Rejected",
  }
  return labels[status] ?? status
}

/**
 * Canonical milestone status -> Tailwind color class (for badges/chips).
 */
export function milestoneStatusColor(status: MilestoneStatus): string {
  const colors: Record<MilestoneStatus, string> = {
    pending: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    approved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    released: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  }
  return colors[status] ?? colors.pending
}

/**
 * Canonical MilestoneStatus -> outbound TW status string.
 *
 * Only needed if you are building a TW-bound payload from canonical values.
 * Currently "released" maps back to "completed" for TW compatibility.
 */
export function milestoneStatusToTw(status: MilestoneStatus): string {
  if (status === "released") return "completed"
  return status
}

// ---------------------------------------------------------------------------
// Agreement mappers
// ---------------------------------------------------------------------------

/**
 * Map a Trustless Work (TW) agreement status string to the canonical
 * AgreementStatus.  Handles legacy / non-standard values.
 *
 * Returns null for unknown statuses and logs a console warning.
 */
export function twAgreementStatus(raw: string): AgreementStatus | null {
  const v = raw.toLowerCase().trim()
  if (v === "pending") return "pending"
  if (v === "funded") return "funded"
  if (v === "active" || v === "in_progress" || v === "in-progress") return "active"
  if (v === "completed") return "completed"
  if (v === "disputed" || v === "dispute") return "disputed"
  if (v === "resolved") return "resolved"
  if (v === "cancelled" || v === "canceled") return "cancelled"
  console.warn(`[status] twAgreementStatus: unknown status "${raw}"`)
  return null
}

/**
 * Map a NestJS-backend agreement status string to the canonical
 * AgreementStatus.
 *
 * Returns null for unknown statuses and logs a console warning.
 */
export function nestAgreementStatus(raw: string): AgreementStatus | null {
  const v = raw.toLowerCase().trim()
  if (v === "pending") return "pending"
  if (v === "funded") return "funded"
  if (v === "active" || v === "in_progress") return "active"
  if (v === "completed") return "completed"
  if (v === "disputed" || v === "dispute") return "disputed"
  if (v === "resolved") return "resolved"
  if (v === "cancelled" || v === "canceled") return "cancelled"
  console.warn(`[status] nestAgreementStatus: unknown status "${raw}"`)
  return null
}

/**
 * Canonical agreement status -> human-readable UI label.
 */
export function agreementStatusLabel(status: AgreementStatus): string {
  const labels: Record<AgreementStatus, string> = {
    pending: "Pending",
    funded: "Funded",
    active: "Active",
    completed: "Completed",
    disputed: "Disputed",
    resolved: "Resolved",
    cancelled: "Cancelled",
  }
  return labels[status] ?? status
}

/**
 * Canonical agreement status -> Tailwind color class (for badges/chips).
 */
export function agreementStatusColor(status: AgreementStatus): string {
  const colors: Record<AgreementStatus, string> = {
    pending: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    funded: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    active: "bg-[#f0b400]/10 text-[#f0b400] border-[#f0b400]/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    disputed: "bg-red-500/10 text-red-400 border-red-500/20",
    resolved: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    cancelled: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  }
  return colors[status] ?? colors.pending
}

// ---------------------------------------------------------------------------
// Generic helper -- safe mapper with fallback
// ---------------------------------------------------------------------------

/**
 * Map an arbitrary raw status string through a mapper function, returning
 * the fallback if the mapper cannot resolve a known value (null path).
 */
export function safeMapStatus<T extends string>(
  raw: string | undefined | null,
  mapper: (raw: string) => T | null,
  fallback: T,
): T {
  if (!raw) return fallback
  return mapper(raw) ?? fallback
}
