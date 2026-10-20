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
          delivered: false,
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
          delivered: false,
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

describe("mapTwEscrowToAgreementView — evidence is not a release", () => {
  // Testnet CA6DQZ…AG3F as Trustless Work returned it on 2026-10-16: evidence
  // submitted, never funded, never released.
  const unfundedWithEvidence = {
    contractId: "CA6DQZDLRYWF2M5QMQV744BWVSX3LM72M54R5XDZDWJ7WF32TS2SAG3F",
    type: "single-release",
    amount: 15,
    balance: 0,
    flags: { disputed: false, released: false, resolved: false },
    roles: { approver: APPROVER, serviceProvider: PROVIDER, releaseSigner: APPROVER },
    milestones: [
      { description: "Full delivery", status: "completed", evidence: "ok", approved: false },
    ],
  }

  it("keeps the milestone pending and the escrow unfunded", () => {
    const view = mapTwEscrowToAgreementView(unfundedWithEvidence, PROVIDER)
    expect(view.milestones[0].status).toBe("pending")
    expect(view.milestones[0].released).toBe(false)
    expect(view.escrowStatus).toBe("pending")
    expect(view.released).toBe(false)
  })

  it("never offers evidence to the provider before funding", () => {
    const fresh = {
      ...unfundedWithEvidence,
      milestones: [{ description: "Full delivery", status: "pending", approved: false }],
    }
    expect(mapTwEscrowToAgreementView(fresh, PROVIDER).nextAction).not.toBe("submit_evidence")
  })

  it("marks single-release milestones released from the escrow flag", () => {
    const view = mapTwEscrowToAgreementView(
      {
        ...unfundedWithEvidence,
        balance: 0,
        flags: { disputed: false, released: true, resolved: false },
        milestones: [
          { description: "Full delivery", status: "completed", evidence: "ok", approved: true },
        ],
      },
      PROVIDER,
    )
    expect(view.milestones[0].status).toBe("released")
  })
})

describe("mapTwEscrowToAgreementView — delivered work is not pending work", () => {
  /**
   * Testnet CBHXR4…OSEP as Trustless Work returned it on 2026-10-19: funded in
   * full, evidence submitted, nothing approved. The approver was shown
   * "Pending" for it and offered no action at all.
   */
  const deliveredAndFunded = {
    contractId: "CBHXR4EDASQZJI3KLA6U5VRKU43U62FKHFF4WV4TKSCDNH5ZXU7WOSEP",
    type: "single-release",
    title: "Kalcha test 18/10",
    amount: 100,
    balance: 100,
    flags: { disputed: false, released: false, resolved: false },
    roles: { approver: APPROVER, serviceProvider: PROVIDER, releaseSigner: APPROVER },
    milestones: [
      { description: "Full delivery", status: "completed", evidence: "ok", approved: false },
    ],
  }

  it("marks the milestone delivered while its canonical status stays pending", () => {
    // Both are true and neither replaces the other: "completed" is not a
    // release, but it is not "nothing happened" either.
    const view = mapTwEscrowToAgreementView(deliveredAndFunded, APPROVER)

    expect(view.milestones[0].delivered).toBe(true)
    expect(view.milestones[0].status).toBe("pending")
    expect(view.milestones[0].evidence).toBe("ok")
  })

  it("reads a capitalised status too", () => {
    // A real escrow carries "Completed"; a case-sensitive check would show the
    // approver nothing to review.
    const view = mapTwEscrowToAgreementView(
      {
        ...deliveredAndFunded,
        milestones: [{ description: "delivery 1", status: "Completed", evidence: "evidence 1" }],
      },
      APPROVER,
    )

    expect(view.milestones[0].delivered).toBe(true)
  })

  it("treats evidence on its own as delivered", () => {
    const view = mapTwEscrowToAgreementView(
      {
        ...deliveredAndFunded,
        milestones: [{ description: "Full delivery", status: "pending", evidence: "ok" }],
      },
      APPROVER,
    )

    expect(view.milestones[0].delivered).toBe(true)
  })

  it("is not delivered when nothing was submitted", () => {
    const view = mapTwEscrowToAgreementView(
      {
        ...deliveredAndFunded,
        milestones: [{ description: "Full delivery", status: "pending", evidence: "" }],
      },
      APPROVER,
    )

    expect(view.milestones[0].delivered).toBe(false)
  })

  it("stops being delivered once it is approved or released", () => {
    // Delivered means "waiting on the approver", so it ends when they act.
    const approved = mapTwEscrowToAgreementView(
      {
        ...deliveredAndFunded,
        milestones: [
          { description: "Full delivery", status: "completed", evidence: "ok", approved: true },
        ],
      },
      APPROVER,
    )
    expect(approved.milestones[0].delivered).toBe(false)

    const released = mapTwEscrowToAgreementView(
      {
        ...deliveredAndFunded,
        flags: { disputed: false, released: true, resolved: false },
        milestones: [
          { description: "Full delivery", status: "completed", evidence: "ok", approved: true },
        ],
      },
      APPROVER,
    )
    expect(released.milestones[0].delivered).toBe(false)
  })

  it("tells the approver the next step is to approve it", () => {
    expect(mapTwEscrowToAgreementView(deliveredAndFunded, APPROVER).nextAction).toBe(
      "approve_milestone",
    )
  })
})
