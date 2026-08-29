/**
 * Shared enum module - Single source of truth for all status enums
 * This module mirrors the authoritative enums from the backend (GF-4-BE)
 * 
 * Related: Issue #136 (FE enum module), GF-4-FE (#141)
 */

// ============================================================================
// MILESTONE STATUS ENUMS (Canonical)
// ============================================================================

/**
 * Canonical milestone status enum - mirrors backend exactly
 * Backend source: ThalosBackend (GF-4-BE)
 */
export enum MilestoneStatus {
  PENDING = "pending",
  APPROVED = "approved",
  RELEASED = "released",
}

/**
 * Legacy milestone status type for backwards compatibility
 * Used in escrow.ts (old: "pending" | "completed" | "approved")
 */
export type LegacyMilestoneStatus = "pending" | "completed" | "approved"

// ============================================================================
// AGREEMENT STATUS ENUMS
// ============================================================================

/**
 * Agreement/Escrow status enum
 */
export enum AgreementStatus {
  PENDING = "pending",
  FUNDED = "funded",
  ACTIVE = "active",
  COMPLETED = "completed",
  DISPUTED = "disputed",
  RESOLVED = "resolved",
  CANCELLED = "cancelled",
}

// ============================================================================
// AGREEMENT TYPE ENUMS
// ============================================================================

export enum AgreementType {
  SINGLE = "single",
  MULTI = "multi",
  BOUNTY = "bounty",
}

// ============================================================================
// PARTICIPANT ROLE ENUMS
// ============================================================================

export enum ParticipantRole {
  PAYER = "payer",
  PAYEE = "payee",
  APPROVER = "approver",
  DISPUTE_RESOLVER = "dispute_resolver",
  VALIDATOR = "validator",
}

// ============================================================================
// LEGACY MAPPERS
// ============================================================================

/**
 * Maps legacy "completed" status to canonical "released"
 * This handles the divergence between old escrow.ts and agreements.ts enums
 */
export function mapLegacyToCanonical(
  legacyStatus: LegacyMilestoneStatus
): MilestoneStatus {
  switch (legacyStatus) {
    case "pending":
      return MilestoneStatus.PENDING
    case "approved":
      return MilestoneStatus.APPROVED
    case "completed":
      // Legacy "completed" maps to canonical "released"
      return MilestoneStatus.RELEASED
    default:
      throw new Error(`Unknown legacy milestone status: ${legacyStatus}`)
  }
}

/**
 * Maps canonical status back to legacy format
 * Used when interfacing with old code that expects legacy enum
 */
export function mapCanonicalToLegacy(
  canonicalStatus: MilestoneStatus
): LegacyMilestoneStatus {
  switch (canonicalStatus) {
    case MilestoneStatus.PENDING:
      return "pending"
    case MilestoneStatus.APPROVED:
      return "approved"
    case MilestoneStatus.RELEASED:
      // Canonical "released" maps back to legacy "completed"
      return "completed"
    default:
      throw new Error(`Unknown canonical milestone status: ${canonicalStatus}`)
  }
}

// ============================================================================
// TYPE EXPORTS (for backwards compatibility with existing type annotations)
// ============================================================================

export type AgreementStatusType = 
  | "pending" 
  | "funded" 
  | "active" 
  | "completed" 
  | "disputed" 
  | "resolved" 
  | "cancelled"

export type AgreementTypeType = "single" | "multi" | "bounty"

export type ParticipantRoleType = 
  | "payer" 
  | "payee" 
  | "approver" 
  | "dispute_resolver" 
  | "validator"

export type MilestoneStatusType = "pending" | "approved" | "released"
