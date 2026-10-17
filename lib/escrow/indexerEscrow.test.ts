import { describe, expect, it, vi } from "vitest"

import { deriveLifecycleState, deriveMilestoneState } from "@/lib/permissions/agreementState"
import { availableOperations } from "@/lib/permissions/escrowActions"
import {
  describeShapeIssue,
  parseIndexerEscrow,
  parseIndexerEscrows,
  reportEscrowShapeIssues,
} from "./indexerEscrow"
import {
  ADDRESSES,
  disputed,
  escrowList,
  fundedWithoutBalance,
  multiReleaseInProgress,
  released,
  rolesAtRootLegacy,
  rolesUnresolved,
  singleReleaseFunded,
  singleReleaseUnfunded,
} from "./__fixtures__/indexerEscrow"

const { APPROVER, PROVIDER, RESOLVER, CONTRACT } = ADDRESSES

/** Parse and insist the payload was clean — most fixtures should be. */
const parseClean = (raw: unknown) => {
  const { escrow, issues } = parseIndexerEscrow(raw)
  expect(issues.map(describeShapeIssue)).toEqual([])
  expect(escrow).not.toBeNull()
  return escrow!
}

describe("parsing a documented payload", () => {
  it("reads every party from the nested roles object", () => {
    expect(parseClean(singleReleaseUnfunded).roles).toEqual({
      approver: APPROVER,
      serviceProvider: PROVIDER,
      releaseSigner: APPROVER,
      disputeResolver: RESOLVER,
      receiver: PROVIDER,
    })
  })

  it("keeps the escrow type Trustless Work declares", () => {
    expect(parseClean(singleReleaseUnfunded).escrowType).toBe("single-release")
    expect(parseClean(multiReleaseInProgress).escrowType).toBe("multi-release")
  })

  it("sums milestone amounts only when the root carries none", () => {
    expect(parseClean(singleReleaseUnfunded).amount).toBe("5000")
    // multi-release fixture has no root amount; 1000 + 2000.
    expect(parseClean(multiReleaseInProgress).amount).toBe("3000")
  })

  it("reads approval and release from either the flag object or the status", () => {
    const multi = parseClean(multiReleaseInProgress)
    expect(multi.milestones[0]).toMatchObject({ approved: true, released: false })
    expect(multi.milestones[1]).toMatchObject({ approved: false, released: false })
    expect(parseClean(released).milestones.every((m) => m.released)).toBe(true)
  })

  it("carries balance and funder when present, and neither when not", () => {
    expect(parseClean(singleReleaseFunded)).toMatchObject({ balance: "5000", fundedBy: APPROVER })
    const unfunded = parseClean(singleReleaseUnfunded)
    expect(unfunded.balance).toBeUndefined()
    expect(unfunded.fundedBy).toBeUndefined()
  })

  it("reads the flag object", () => {
    expect(parseClean(disputed).flags).toEqual({ disputed: true, released: false, resolved: false })
  })
})

describe("saying so when the shape is not what we parse", () => {
  it("names unresolved roles instead of inventing a filler", () => {
    const { escrow, issues } = parseIndexerEscrow(rolesUnresolved)
    // No "-" anywhere: an absent role is undefined, which the permission table
    // treats as unresolved rather than comparing a wallet against it.
    expect(escrow?.roles).toEqual({
      approver: undefined,
      serviceProvider: undefined,
      releaseSigner: undefined,
      disputeResolver: undefined,
      receiver: undefined,
    })
    expect(issues).toEqual([])
  })

  it("reports parties found at the root rather than silently losing them", () => {
    // The business dashboard read them here for months; every role resolved to
    // nothing and funding simply never appeared.
    const { escrow, issues } = parseIndexerEscrow(rolesAtRootLegacy)
    expect(escrow?.roles.approver).toBeUndefined()
    expect(issues.map(describeShapeIssue)).toContain("roles is missing")
  })

  it("reports a missing type instead of guessing in silence", () => {
    const { escrow, issues } = parseIndexerEscrow({
      ...(singleReleaseUnfunded as Record<string, unknown>),
      type: undefined,
    })
    expect(issues.map(describeShapeIssue)).toContain("type is missing")
    // Two milestones with no declared type: the fallback guesses multi-release,
    // and the issue is what tells you it guessed.
    expect(escrow?.escrowType).toBe("multi-release")
  })

  it("reports a field of the wrong type", () => {
    const { issues } = parseIndexerEscrow({
      ...(singleReleaseUnfunded as Record<string, unknown>),
      roles: { approver: 42 },
      milestones: "nope",
    })
    const described = issues.map(describeShapeIssue)
    expect(described).toContain("roles.approver should be string, got number")
    expect(described).toContain("milestones should be array, got string")
  })

  it("refuses an escrow with nothing to identify it by", () => {
    expect(parseIndexerEscrow({ title: "no contract id" }).escrow).toBeNull()
    expect(parseIndexerEscrow(null).escrow).toBeNull()
    expect(parseIndexerEscrow("a string").escrow).toBeNull()
  })

  it("keeps the usable entries of a list and reports the rest", () => {
    const { escrows, issues } = parseIndexerEscrows([singleReleaseFunded, { title: "broken" }])
    expect(escrows).toHaveLength(1)
    expect(issues.map(describeShapeIssue)).toContain("contractId is missing")
  })

  it("warns once, with the source and every complaint", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    reportEscrowShapeIssues("by-role", parseIndexerEscrow(rolesAtRootLegacy).issues)
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain("by-role")
    expect(warn.mock.calls[0][0]).toContain("roles is missing")
    warn.mockRestore()
  })

  it("says nothing when there is nothing to say", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    reportEscrowShapeIssues("by-role", [])
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe("a parsed escrow drives the permission table", () => {
  const walk = (raw: unknown, wallet: string) => {
    const escrow = parseIndexerEscrow(raw).escrow!
    return availableOperations({
      roles: escrow.roles,
      walletAddress: wallet,
      state: deriveLifecycleState({
        status: escrow.flags.disputed ? "disputed" : undefined,
        balance: escrow.balance,
        amount: escrow.amount,
        fundedBy: escrow.fundedBy,
        milestones: escrow.milestones,
      }),
      milestoneState: deriveMilestoneState(escrow.milestones[0]),
      escrowType: escrow.escrowType,
      milestoneStates: escrow.milestones.map(deriveMilestoneState),
    })
  }

  it("offers funding on an unfunded escrow", () => {
    expect(walk(singleReleaseUnfunded, APPROVER)).toEqual(["fund"])
  })

  it("offers each party its own step once funded", () => {
    expect(walk(singleReleaseFunded, PROVIDER).sort()).toEqual(
      ["changeMilestoneStatus", "dispute"].sort(),
    )
    expect(walk(singleReleaseFunded, APPROVER)).not.toContain("changeMilestoneStatus")
  })

  it("treats an escrow funded without a balance as funded", () => {
    // End to end from the raw payload: the reported bug was that this offered
    // funding again on every reload.
    expect(walk(fundedWithoutBalance, APPROVER)).not.toContain("fund")
  })

  it("will not release a single-release escrow with a milestone still pending", () => {
    const stillPending = {
      ...(singleReleaseFunded as Record<string, unknown>),
      milestones: [
        { description: "Design mockups", status: "approved", approved: true },
        { description: "Frontend development", status: "pending", approved: false },
      ],
    }
    expect(walk(stillPending, APPROVER)).not.toContain("releaseFunds")
  })

  it("offers only resolution on a disputed escrow, and only to the resolver", () => {
    expect(walk(disputed, RESOLVER)).toEqual(["resolve"])
    expect(walk(disputed, APPROVER)).toEqual([])
  })

  it("offers nothing once released", () => {
    for (const wallet of [APPROVER, PROVIDER, RESOLVER]) {
      expect(walk(released, wallet)).toEqual([])
    }
  })

  it("offers no role-scoped action when the roles never resolved", () => {
    // Funding stays on offer because it needs no role — Trustless Work lets any
    // wallet put funds in. Everything else is refused rather than guessed.
    expect(walk(rolesUnresolved, APPROVER)).toEqual(["fund"])

    const funded = { ...(rolesUnresolved as Record<string, unknown>), fundedBy: APPROVER }
    expect(walk(funded, APPROVER)).toEqual([])
  })
})

describe("parsing a list", () => {
  it("keeps contract ids distinct so the detail view can resolve one", () => {
    const { escrows } = parseIndexerEscrows(escrowList)
    expect(escrows.map((e) => e.contractId)).toEqual([CONTRACT, `${CONTRACT}-multi`])
  })

  it("rejects a non-list without throwing", () => {
    const { escrows, issues } = parseIndexerEscrows({ not: "a list" })
    expect(escrows).toEqual([])
    expect(issues.map(describeShapeIssue)).toContain("(root) should be array, got object")
  })
})
