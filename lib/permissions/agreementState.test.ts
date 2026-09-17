import { describe, expect, it } from "vitest"

import { deriveLifecycleState, deriveMilestoneState } from "./agreementState"
import { availableOperations } from "./escrowActions"

const ROLES = {
  approver: "GAPPROVER",
  serviceProvider: "GPROVIDER",
  releaseSigner: "GRELEASER",
  disputeResolver: "GRESOLVER",
}

describe("deriveMilestoneState", () => {
  it("reads the released flag and both released spellings", () => {
    expect(deriveMilestoneState({ released: true })).toBe("released")
    expect(deriveMilestoneState({ status: "released" })).toBe("released")
    expect(deriveMilestoneState({ status: "completed" })).toBe("released")
  })

  it("reads the approved flag and status", () => {
    expect(deriveMilestoneState({ approved: true })).toBe("approved")
    expect(deriveMilestoneState({ status: "approved" })).toBe("approved")
  })

  it("defaults to pending, including for an absent milestone", () => {
    expect(deriveMilestoneState({ status: "pending" })).toBe("pending")
    expect(deriveMilestoneState({})).toBe("pending")
    expect(deriveMilestoneState(undefined)).toBe("pending")
  })

  it("prefers released over approved when both are set", () => {
    expect(deriveMilestoneState({ approved: true, released: true })).toBe("released")
  })
})

describe("deriveLifecycleState", () => {
  it("treats a dispute as outranking everything else", () => {
    expect(
      deriveLifecycleState({
        status: "disputed",
        milestones: [{ status: "released" }],
      }),
    ).toBe("disputed")
  })

  it("is completed when every milestone is released", () => {
    expect(
      deriveLifecycleState({
        status: "funded",
        milestones: [{ status: "released" }, { status: "completed" }],
      }),
    ).toBe("completed")
  })

  it("is not completed when only some milestones are released", () => {
    expect(
      deriveLifecycleState({
        status: "funded",
        milestones: [{ status: "released" }, { status: "pending" }],
      }),
    ).toBe("funded")
  })

  it("recognises funding from the Nest status", () => {
    for (const status of ["funded", "active", "in_progress"]) {
      expect(deriveLifecycleState({ status, milestones: [{ status: "pending" }] })).toBe("funded")
    }
  })

  it("recognises funding from an on-chain balance covering the amount", () => {
    expect(
      deriveLifecycleState({ balance: "100", amount: "100", milestones: [{ status: "pending" }] }),
    ).toBe("funded")
    expect(
      deriveLifecycleState({ balance: "150", amount: "100", milestones: [{ status: "pending" }] }),
    ).toBe("funded")
  })

  it("does not call a partially funded escrow funded", () => {
    expect(
      deriveLifecycleState({ balance: "40", amount: "100", milestones: [{ status: "pending" }] }),
    ).toBe("waiting_for_funding")
  })

  it("moves to in_progress once a milestone is approved", () => {
    expect(
      deriveLifecycleState({
        status: "funded",
        milestones: [{ status: "approved" }, { status: "pending" }],
      }),
    ).toBe("in_progress")
  })

  it("is waiting_for_funding before anything happens", () => {
    for (const status of [undefined, null, "", "pending", "initialized", "draft"]) {
      expect(deriveLifecycleState({ status, milestones: [{ status: "pending" }] })).toBe(
        "waiting_for_funding",
      )
    }
  })

  it("returns unknown for a status it does not recognise", () => {
    // Guessing here would offer actions the chain rejects, which is the failure
    // this whole module exists to prevent.
    expect(deriveLifecycleState({ status: "something_new" })).toBe("unknown")
  })

  it("does not treat a zero-amount escrow as funded", () => {
    expect(deriveLifecycleState({ balance: "0", amount: "0" })).toBe("waiting_for_funding")
  })
})

describe("derivation feeding the permission table", () => {
  const walk = (agreement: Parameters<typeof deriveLifecycleState>[0], wallet: string) =>
    availableOperations({
      roles: ROLES,
      walletAddress: wallet,
      state: deriveLifecycleState(agreement),
      milestoneState: deriveMilestoneState(agreement.milestones?.[0]),
    })

  it("walks one escrow through the lifecycle, offering each party its own step", () => {
    const created = { status: "pending", milestones: [{ status: "pending" }] }
    expect(walk(created, ROLES.approver)).toEqual(["fund"])

    const funded = { status: "funded", milestones: [{ status: "pending" }] }
    expect(walk(funded, ROLES.serviceProvider).sort()).toEqual(
      ["changeMilestoneStatus", "dispute"].sort(),
    )
    // The reported bug, end to end from real agreement data.
    expect(walk(funded, ROLES.approver)).not.toContain("changeMilestoneStatus")
    expect(walk(funded, ROLES.approver).sort()).toEqual(["approveMilestone", "dispute"].sort())

    const approved = { status: "funded", milestones: [{ status: "approved" }] }
    expect(walk(approved, ROLES.releaseSigner)).toEqual(["releaseFunds"])

    const done = { status: "funded", milestones: [{ status: "released" }] }
    for (const wallet of Object.values(ROLES)) expect(walk(done, wallet)).toEqual([])
  })

  it("offers only resolution during a dispute, and only to the resolver", () => {
    const disputed = { status: "disputed", milestones: [{ status: "pending" }] }
    expect(walk(disputed, ROLES.disputeResolver)).toEqual(["resolve"])
    expect(walk(disputed, ROLES.approver)).toEqual([])
    expect(walk(disputed, ROLES.serviceProvider)).toEqual([])
  })

  it("offers nothing on an agreement whose state could not be established", () => {
    const murky = { status: "something_new", milestones: [{ status: "pending" }] }
    for (const wallet of Object.values(ROLES)) expect(walk(murky, wallet)).toEqual([])
  })
})
