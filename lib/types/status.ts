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

/** Canonical milestone statuses. Mirrors the authoritative contract enum. */
export type MilestoneStatus = "pending" | "approved" | "released"

/** Canonical agreement-level statuses. */
export type AgreementStatus =
  | "pending"
  | "funded"
  | "active"
  | "completed"
  | "disputed"
  | "resolved"
  | "cancelled"

// ---------------------------------------------------------------------------
// Milestone mappers
// ---------------------------------------------------------------------------

/**
 * Map a Trustless Work (TW) milestone status string to the canonical
 * MilestoneStatus.  Handles legacy `"completed"` → `"released"` and
 * hyphenated / non-standard values.
 */
export function twMilestoneStatus(raw: string): MilestoneStatus {
  const v = raw.toLowerCase().trim()
  if (v === "released" || v === "completed") return "released"
  if (v === "approved") return "approved"
  if (v === "pending" || v === "in-progress" || v === "in_progress") return "pending"
  return "pending"
}

/**
 * Map a NestJS-backend milestone status string to the canonical
 * MilestoneStatus.  Handles legacy `"completed"` → `"released"` and
 * capitalized variants.
 */
export function nestMilestoneStatus(raw: string): MilestoneStatus {
  const v = raw.toLowerCase().trim()
  if (v === "released" || v === "completed") return "released"
  if (v === "approved") return "approved"
  if (v === "pending") return "pending"
  return "pending"
}

/**
 * Canonical milestone status → human-readable UI label.
 */
export function milestoneStatusLabel(status: MilestoneStatus): string {
  const labels: Record<MilestoneStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    released: "Released",
  }
  return labels[status] ?? status
}

/**
 * Canonical milestone status → Tailwind color class (for badges/chips).
 */
export function milestoneStatusColor(status: MilestoneStatus): string {
  const colors: Record<MilestoneStatus, string> = {
    pending: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    approved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    released: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  }
  return colors[status] ?? colors.pending
}

// ---------------------------------------------------------------------------
// Agreement mappers
// ---------------------------------------------------------------------------

/**
 * Map a Trustless Work (TW) agreement status string to the canonical
 * AgreementStatus.  Handles legacy / non-standard values.
 */
export function twAgreementStatus(raw: string): AgreementStatus {
  const v = raw.toLowerCase().trim()
  if (v === "pending") return "pending"
  if (v === "funded") return "funded"
  if (v === "active" || v === "in_progress" || v === "in-progress") return "active"
  if (v === "completed") return "completed"
  if (v === "disputed" || v === "dispute") return "disputed"
  if (v === "resolved") return "resolved"
  if (v === "cancelled" || v === "canceled") return "cancelled"
  if (v === "draft") return "pending"
  return "pending"
}

/**
 * Map a NestJS-backend agreement status string to the canonical
 * AgreementStatus.
 */
export function nestAgreementStatus(raw: string): AgreementStatus {
  const v = raw.toLowerCase().trim()
  if (v === "pending") return "pending"
  if (v === "funded") return "funded"
  if (v === "active" || v === "in_progress") return "active"
  if (v === "completed") return "completed"
  if (v === "disputed" || v === "dispute") return "disputed"
  if (v === "resolved") return "resolved"
  if (v === "cancelled" || v === "canceled") return "cancelled"
  return "pending"
}

/**
 * Canonical agreement status → human-readable UI label.
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
 * Canonical agreement status → Tailwind color class (for badges/chips).
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
// Generic helper — safe mapper with fallback
// ---------------------------------------------------------------------------

/**
 * Map an arbitrary raw status string through a mapper function, returning
 * the fallback if the mapper cannot resolve a known value.
 */
export function safeMapStatus<T extends string>(
  raw: string | undefined | null,
  mapper: (raw: string) => T,
  fallback: T,
): T {
  if (!raw) return fallback
  return mapper(raw)
}
