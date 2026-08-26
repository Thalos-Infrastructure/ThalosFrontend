import { describe, it, expect, vi, afterEach } from "vitest"
import {
  MILESTONE_STATUSES,
  twMilestoneStatus,
  nestMilestoneStatus,
  isMilestoneStatus,
  milestoneStatusLabel,
  milestoneStatusColor,
  milestoneStatusToTw,
  twAgreementStatus,
  nestAgreementStatus,
  agreementStatusLabel,
  agreementStatusColor,
  safeMapStatus,
} from "./status"

describe("MILESTONE_STATUSES set", () => {
  it("contains exactly pending, approved, released, rejected", () => {
    expect([...MILESTONE_STATUSES]).toEqual([
      "pending", "approved", "released", "rejected",
    ])
  })
})

describe("isMilestoneStatus", () => {
  it("returns true for each canonical value", () => {
    expect(isMilestoneStatus("pending")).toBe(true)
    expect(isMilestoneStatus("approved")).toBe(true)
    expect(isMilestoneStatus("released")).toBe(true)
    expect(isMilestoneStatus("rejected")).toBe(true)
  })
  it("returns false for unknown values", () => {
    expect(isMilestoneStatus("unknown")).toBe(false)
    expect(isMilestoneStatus("Completed")).toBe(false)
    expect(isMilestoneStatus("")).toBe(false)
  })
})

describe("twMilestoneStatus", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
  afterEach(() => warnSpy.mockClear())

  it("maps pending", () => { expect(twMilestoneStatus("pending")).toBe("pending") })
  it("maps approved", () => { expect(twMilestoneStatus("approved")).toBe("approved") })
  it("maps released", () => { expect(twMilestoneStatus("released")).toBe("released") })
  it("maps rejected", () => { expect(twMilestoneStatus("rejected")).toBe("rejected") })
  it("maps legacy completed to released", () => { expect(twMilestoneStatus("completed")).toBe("released") })
  it("maps in-progress to pending", () => { expect(twMilestoneStatus("in-progress")).toBe("pending") })
  it("maps in_progress to pending", () => { expect(twMilestoneStatus("in_progress")).toBe("pending") })
  it("handles mixed case", () => {
    expect(twMilestoneStatus("Approved")).toBe("approved")
    expect(twMilestoneStatus("RELEASED")).toBe("released")
    expect(twMilestoneStatus("Rejected")).toBe("rejected")
    expect(twMilestoneStatus("PENDING")).toBe("pending")
  })
  it("handles whitespace", () => { expect(twMilestoneStatus("  approved  ")).toBe("approved") })
  it("returns null and warns for unknown", () => {
    expect(twMilestoneStatus("unknown")).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('unknown status'))
  })
  it("returns null and warns for empty string", () => {
    expect(twMilestoneStatus("")).toBeNull()
    expect(warnSpy).toHaveBeenCalled()
  })
})

describe("nestMilestoneStatus", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
  afterEach(() => warnSpy.mockClear())

  it("maps pending", () => { expect(nestMilestoneStatus("pending")).toBe("pending") })
  it("maps approved", () => { expect(nestMilestoneStatus("approved")).toBe("approved") })
  it("maps released", () => { expect(nestMilestoneStatus("released")).toBe("released") })
  it("maps rejected", () => { expect(nestMilestoneStatus("rejected")).toBe("rejected") })
  it("maps legacy completed to released", () => { expect(nestMilestoneStatus("completed")).toBe("released") })
  it("handles mixed case", () => {
    expect(nestMilestoneStatus("Approved")).toBe("approved")
    expect(nestMilestoneStatus("RELEASED")).toBe("released")
    expect(nestMilestoneStatus("Rejected")).toBe("rejected")
  })
  it("returns null and warns for unknown", () => {
    expect(nestMilestoneStatus("unknown")).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('unknown status'))
  })
  it("returns null for empty string", () => {
    expect(nestMilestoneStatus("")).toBeNull()
  })
})

describe("milestoneStatusLabel", () => {
  it("returns correct label for each value", () => {
    expect(milestoneStatusLabel("pending")).toBe("Pending")
    expect(milestoneStatusLabel("approved")).toBe("Approved")
    expect(milestoneStatusLabel("released")).toBe("Released")
    expect(milestoneStatusLabel("rejected")).toBe("Rejected")
  })
})

describe("milestoneStatusColor", () => {
  it("returns a Tailwind class for each value", () => {
    expect(milestoneStatusColor("pending")).toContain("orange")
    expect(milestoneStatusColor("approved")).toContain("blue")
    expect(milestoneStatusColor("released")).toContain("emerald")
    expect(milestoneStatusColor("rejected")).toContain("red")
  })
})

describe("milestoneStatusToTw", () => {
  it("maps released back to completed for TW", () => {
    expect(milestoneStatusToTw("released")).toBe("completed")
  })
  it("passes through pending, approved, rejected unchanged", () => {
    expect(milestoneStatusToTw("pending")).toBe("pending")
    expect(milestoneStatusToTw("approved")).toBe("approved")
    expect(milestoneStatusToTw("rejected")).toBe("rejected")
  })
})

describe("twAgreementStatus", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
  afterEach(() => warnSpy.mockClear())

  it("maps pending", () => { expect(twAgreementStatus("pending")).toBe("pending") })
  it("maps funded", () => { expect(twAgreementStatus("funded")).toBe("funded") })
  it("maps active", () => { expect(twAgreementStatus("active")).toBe("active") })
  it("maps in_progress to active", () => { expect(twAgreementStatus("in_progress")).toBe("active") })
  it("maps in-progress to active", () => { expect(twAgreementStatus("in-progress")).toBe("active") })
  it("maps completed", () => { expect(twAgreementStatus("completed")).toBe("completed") })
  it("maps disputed", () => { expect(twAgreementStatus("disputed")).toBe("disputed") })
  it("maps dispute to disputed", () => { expect(twAgreementStatus("dispute")).toBe("disputed") })
  it("maps resolved", () => { expect(twAgreementStatus("resolved")).toBe("resolved") })
  it("maps cancelled", () => { expect(twAgreementStatus("cancelled")).toBe("cancelled") })
  it("maps canceled to cancelled", () => { expect(twAgreementStatus("canceled")).toBe("cancelled") })
  it("handles mixed case", () => {
    expect(twAgreementStatus("Funded")).toBe("funded")
    expect(twAgreementStatus("DISPUTED")).toBe("disputed")
  })
  it("returns null and warns for unknown", () => {
    expect(twAgreementStatus("garbage")).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("unknown status"))
  })
})

describe("nestAgreementStatus", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
  afterEach(() => warnSpy.mockClear())

  it("maps all known values correctly", () => {
    expect(nestAgreementStatus("pending")).toBe("pending")
    expect(nestAgreementStatus("funded")).toBe("funded")
    expect(nestAgreementStatus("active")).toBe("active")
    expect(nestAgreementStatus("in_progress")).toBe("active")
    expect(nestAgreementStatus("completed")).toBe("completed")
    expect(nestAgreementStatus("disputed")).toBe("disputed")
    expect(nestAgreementStatus("resolved")).toBe("resolved")
    expect(nestAgreementStatus("cancelled")).toBe("cancelled")
    expect(nestAgreementStatus("canceled")).toBe("cancelled")
  })
  it("handles mixed case", () => {
    expect(nestAgreementStatus("Active")).toBe("active")
    expect(nestAgreementStatus("RESOLVED")).toBe("resolved")
  })
  it("returns null and warns for unknown", () => {
    expect(nestAgreementStatus("unknown_value")).toBeNull()
    expect(warnSpy).toHaveBeenCalled()
  })
})

describe("agreementStatusLabel", () => {
  it("returns correct label for each value", () => {
    expect(agreementStatusLabel("pending")).toBe("Pending")
    expect(agreementStatusLabel("funded")).toBe("Funded")
    expect(agreementStatusLabel("active")).toBe("Active")
    expect(agreementStatusLabel("completed")).toBe("Completed")
    expect(agreementStatusLabel("disputed")).toBe("Disputed")
    expect(agreementStatusLabel("resolved")).toBe("Resolved")
    expect(agreementStatusLabel("cancelled")).toBe("Cancelled")
  })
})

describe("agreementStatusColor", () => {
  it("returns a Tailwind class for each value", () => {
    expect(agreementStatusColor("pending")).toContain("orange")
    expect(agreementStatusColor("funded")).toContain("blue")
    expect(agreementStatusColor("active")).toContain("#f0b400")
    expect(agreementStatusColor("completed")).toContain("emerald")
    expect(agreementStatusColor("disputed")).toContain("red")
    expect(agreementStatusColor("resolved")).toContain("purple")
    expect(agreementStatusColor("cancelled")).toContain("gray")
  })
})

describe("safeMapStatus", () => {
  it("returns mapped value for valid input", () => {
    expect(safeMapStatus("pending", twMilestoneStatus, "pending")).toBe("pending")
    expect(safeMapStatus("released", twMilestoneStatus, "pending")).toBe("released")
    expect(safeMapStatus("completed", twMilestoneStatus, "pending")).toBe("released")
  })
  it("returns fallback when mapper returns null", () => {
    expect(safeMapStatus("unknown", twMilestoneStatus, "approved")).toBe("approved")
  })
  it("returns fallback for null input", () => {
    expect(safeMapStatus(null, twMilestoneStatus, "pending")).toBe("pending")
  })
  it("returns fallback for undefined input", () => {
    expect(safeMapStatus(undefined, twMilestoneStatus, "approved")).toBe("approved")
  })
  it("returns fallback for empty string input", () => {
    expect(safeMapStatus("", twMilestoneStatus, "released")).toBe("released")
  })
})
