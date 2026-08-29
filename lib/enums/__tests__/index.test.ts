/**
 * Tests for shared enum module and status mappers
 * 
 * Required by GF-4-FE: Mapper tests for all status values
 * Related: Issue #141, #136
 */

import { describe, it, expect } from "vitest"
import {
  MilestoneStatus,
  AgreementStatus,
  AgreementType,
  ParticipantRole,
  mapLegacyToCanonical,
  mapCanonicalToLegacy,
  type LegacyMilestoneStatus,
} from "../index"

describe("Enum Definitions", () => {
  describe("MilestoneStatus Enum", () => {
    it("should have correct canonical values", () => {
      expect(MilestoneStatus.PENDING).toBe("pending")
      expect(MilestoneStatus.APPROVED).toBe("approved")
      expect(MilestoneStatus.RELEASED).toBe("released")
    })

    it("should have exactly 3 status values", () => {
      const values = Object.values(MilestoneStatus)
      expect(values).toHaveLength(3)
      expect(values).toEqual(["pending", "approved", "released"])
    })
  })

  describe("AgreementStatus Enum", () => {
    it("should have correct status values", () => {
      expect(AgreementStatus.PENDING).toBe("pending")
      expect(AgreementStatus.FUNDED).toBe("funded")
      expect(AgreementStatus.ACTIVE).toBe("active")
      expect(AgreementStatus.COMPLETED).toBe("completed")
      expect(AgreementStatus.DISPUTED).toBe("disputed")
      expect(AgreementStatus.RESOLVED).toBe("resolved")
      expect(AgreementStatus.CANCELLED).toBe("cancelled")
    })
  })

  describe("AgreementType Enum", () => {
    it("should have correct type values", () => {
      expect(AgreementType.SINGLE).toBe("single")
      expect(AgreementType.MULTI).toBe("multi")
      expect(AgreementType.BOUNTY).toBe("bounty")
    })
  })

  describe("ParticipantRole Enum", () => {
    it("should have correct role values", () => {
      expect(ParticipantRole.PAYER).toBe("payer")
      expect(ParticipantRole.PAYEE).toBe("payee")
      expect(ParticipantRole.APPROVER).toBe("approver")
      expect(ParticipantRole.DISPUTE_RESOLVER).toBe("dispute_resolver")
      expect(ParticipantRole.VALIDATOR).toBe("validator")
    })
  })
})

describe("Status Mappers", () => {
  describe("mapLegacyToCanonical", () => {
    it("should map 'pending' correctly", () => {
      const result = mapLegacyToCanonical("pending")
      expect(result).toBe(MilestoneStatus.PENDING)
      expect(result).toBe("pending")
    })

    it("should map 'approved' correctly", () => {
      const result = mapLegacyToCanonical("approved")
      expect(result).toBe(MilestoneStatus.APPROVED)
      expect(result).toBe("approved")
    })

    it("should map legacy 'completed' to canonical 'released'", () => {
      const result = mapLegacyToCanonical("completed")
      expect(result).toBe(MilestoneStatus.RELEASED)
      expect(result).toBe("released")
    })

    it("should handle all legacy milestone status values", () => {
      const legacyStatuses: LegacyMilestoneStatus[] = ["pending", "approved", "completed"]
      
      legacyStatuses.forEach((status) => {
        expect(() => mapLegacyToCanonical(status)).not.toThrow()
      })
    })

    it("should throw error for unknown legacy status", () => {
      expect(() => mapLegacyToCanonical("invalid" as LegacyMilestoneStatus)).toThrow(
        "Unknown legacy milestone status: invalid"
      )
    })
  })

  describe("mapCanonicalToLegacy", () => {
    it("should map PENDING correctly", () => {
      const result = mapCanonicalToLegacy(MilestoneStatus.PENDING)
      expect(result).toBe("pending")
    })

    it("should map APPROVED correctly", () => {
      const result = mapCanonicalToLegacy(MilestoneStatus.APPROVED)
      expect(result).toBe("approved")
    })

    it("should map canonical 'released' to legacy 'completed'", () => {
      const result = mapCanonicalToLegacy(MilestoneStatus.RELEASED)
      expect(result).toBe("completed")
    })

    it("should handle all canonical milestone status values", () => {
      const canonicalStatuses = [
        MilestoneStatus.PENDING,
        MilestoneStatus.APPROVED,
        MilestoneStatus.RELEASED,
      ]
      
      canonicalStatuses.forEach((status) => {
        expect(() => mapCanonicalToLegacy(status)).not.toThrow()
      })
    })

    it("should throw error for unknown canonical status", () => {
      expect(() => mapCanonicalToLegacy("invalid" as MilestoneStatus)).toThrow(
        "Unknown canonical milestone status: invalid"
      )
    })
  })

  describe("Bidirectional Mapping", () => {
    it("should maintain consistency for 'pending'", () => {
      const canonical = mapLegacyToCanonical("pending")
      const legacy = mapCanonicalToLegacy(canonical)
      expect(legacy).toBe("pending")
    })

    it("should maintain consistency for 'approved'", () => {
      const canonical = mapLegacyToCanonical("approved")
      const legacy = mapCanonicalToLegacy(canonical)
      expect(legacy).toBe("approved")
    })

    it("should correctly map 'completed' <-> 'released' bidirectionally", () => {
      // Legacy "completed" should map to canonical "released"
      const canonical = mapLegacyToCanonical("completed")
      expect(canonical).toBe(MilestoneStatus.RELEASED)
      
      // Canonical "released" should map back to legacy "completed"
      const legacy = mapCanonicalToLegacy(canonical)
      expect(legacy).toBe("completed")
    })

    it("should be reversible for all valid legacy statuses", () => {
      const legacyStatuses: LegacyMilestoneStatus[] = ["pending", "approved", "completed"]
      
      legacyStatuses.forEach((originalLegacy) => {
        const canonical = mapLegacyToCanonical(originalLegacy)
        const backToLegacy = mapCanonicalToLegacy(canonical)
        expect(backToLegacy).toBe(originalLegacy)
      })
    })

    it("should be reversible for all valid canonical statuses", () => {
      const canonicalStatuses = [
        MilestoneStatus.PENDING,
        MilestoneStatus.APPROVED,
        MilestoneStatus.RELEASED,
      ]
      
      canonicalStatuses.forEach((originalCanonical) => {
        const legacy = mapCanonicalToLegacy(originalCanonical)
        const backToCanonical = mapLegacyToCanonical(legacy)
        expect(backToCanonical).toBe(originalCanonical)
      })
    })
  })
})

describe("Integration Tests", () => {
  describe("Enum usage in type checking", () => {
    it("should allow MilestoneStatus enum values as valid milestone status", () => {
      const status: "pending" | "approved" | "released" = MilestoneStatus.PENDING
      expect(status).toBe("pending")
    })

    it("should allow legacy status values", () => {
      const legacyStatus: LegacyMilestoneStatus = "completed"
      const canonical = mapLegacyToCanonical(legacyStatus)
      expect(canonical).toBe("released")
    })
  })

  describe("Real-world scenario: Migrating from legacy to canonical", () => {
    it("should handle escrow.ts legacy milestone status", () => {
      // Simulate old escrow.ts milestone with "completed" status
      const legacyMilestone = {
        description: "Complete project",
        amount: "1000",
        status: "completed" as LegacyMilestoneStatus,
      }
      
      // Convert to canonical for backend submission
      const canonicalStatus = mapLegacyToCanonical(legacyMilestone.status)
      expect(canonicalStatus).toBe(MilestoneStatus.RELEASED)
    })

    it("should handle agreements.ts canonical milestone status", () => {
      // Simulate new agreements.ts milestone with canonical status
      const canonicalMilestone = {
        description: "Complete project",
        amount: "1000",
        status: MilestoneStatus.RELEASED,
      }
      
      // Convert to legacy if needed for old UI components
      const legacyStatus = mapCanonicalToLegacy(canonicalMilestone.status)
      expect(legacyStatus).toBe("completed")
    })
  })
})
