/**
 * Unit tests for shared agreement view-model + nextAction (Manu FE priorities 2–3).
 */
import { describe, expect, it } from "vitest"
import {
  computeNextAction,
  computeNextActionFromNestListing,
  formatNextActionLabel,
} from "@/lib/types/agreement-view"
import { mapTwEscrowToAgreementView } from "@/lib/agreements/map-tw-escrow"

const APPROVER = "GAPPROVERXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
const PROVIDER = "GPROVIDERXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
const RELEASE = "GRELEASEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

describe("computeNextAction", () => {
  it("asks the approver to fund when balance is zero", () => {
    const r = computeNextAction({
      type: "single-release",
      escrowStatus: "pending",
      released: false,
      disputed: false,
      balance: 0,
      configuredAmount: 100,
      milestones: [
        {
          index: 0,
          description: "Work",
          amount: "100",
          status: "pending",
          approved: false,
          released: false,
        },
      ],
      participants: { approver: APPROVER, serviceProvider: PROVIDER, releaseSigner: RELEASE },
      walletAddress: APPROVER,
    })
    expect(r.nextAction).toBe("fund")
    expect(r.blockedReason).toBeNull()
  })

  it("blocks funding for non-approver (product rule)", () => {
    const r = computeNextAction({
      type: "single-release",
      escrowStatus: "pending",
      released: false,
      disputed: false,
      balance: 0,
      configuredAmount: 100,
      milestones: [],
      participants: { approver: APPROVER, serviceProvider: PROVIDER },
      walletAddress: PROVIDER,
      funderIsApproverOnly: true,
    })
    expect(r.nextAction).toBe("none")
    expect(r.blockedReason).toMatch(/approver/i)
  })

  it("asks provider for evidence after funding", () => {
    const r = computeNextAction({
      type: "single-release",
      escrowStatus: "funded",
      released: false,
      disputed: false,
      balance: 100,
      configuredAmount: 100,
      milestones: [
        {
          index: 0,
          description: "Work",
          amount: "100",
          status: "pending",
          approved: false,
          released: false,
        },
      ],
      participants: { approver: APPROVER, serviceProvider: PROVIDER, releaseSigner: RELEASE },
      walletAddress: PROVIDER,
    })
    expect(r.nextAction).toBe("submit_evidence")
  })
})

describe("computeNextActionFromNestListing", () => {
  it("asks buyer to fund when Nest status is pending", () => {
    const r = computeNextActionFromNestListing({ uiStatus: "pending", role: "buyer" })
    expect(r.nextAction).toBe("fund")
  })

  it("blocks seller until funded", () => {
    const r = computeNextActionFromNestListing({ uiStatus: "pending", role: "seller" })
    expect(r.nextAction).toBe("none")
    expect(r.blockedReason).toMatch(/funding/i)
  })

  it("asks seller for evidence when funded", () => {
    const r = computeNextActionFromNestListing({ uiStatus: "funded", role: "seller" })
    expect(r.nextAction).toBe("submit_evidence")
  })
})

describe("formatNextActionLabel", () => {
  it("replaces underscores with spaces", () => {
    expect(formatNextActionLabel("submit_evidence")).toBe("submit evidence")
  })
})

describe("mapTwEscrowToAgreementView", () => {
  it("maps TW escrow into shared fields including nextAction", () => {
    const view = mapTwEscrowToAgreementView(
      {
        contractId: "CTESTCONTRACT",
        type: "single-release",
        title: "Demo",
        amount: 50,
        balance: 0,
        roles: {
          approver: APPROVER,
          serviceProvider: PROVIDER,
          releaseSigner: RELEASE,
        },
        milestones: [{ description: "Ship", amount: 50, approved: false }],
        flags: {},
      },
      APPROVER,
    )
    expect(view.contractId).toBe("CTESTCONTRACT")
    expect(view.type).toBe("single-release")
    expect(view.totalMilestones).toBe(1)
    expect(view.nextAction).toBe("fund")
    expect(view.participants.approver).toBe(APPROVER)
  })
})
