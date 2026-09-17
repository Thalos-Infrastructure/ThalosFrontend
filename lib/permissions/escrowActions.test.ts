import { describe, expect, it } from "vitest"

import type { EscrowOperation } from "@/lib/signing/types"
import {
  ALLOWED_ROLES,
  availableOperations,
  canPerform,
  describeRequiredRoles,
  normalizeRoleAddress,
  normalizeRoles,
  type EscrowLifecycleState,
  type EscrowRole,
} from "./escrowActions"

const APPROVER = "GAPPROVER"
const PROVIDER = "GPROVIDER"
const RELEASER = "GRELEASER"
const RESOLVER = "GRESOLVER"
const STRANGER = "GSTRANGER"

const ROLES = {
  approver: APPROVER,
  serviceProvider: PROVIDER,
  releaseSigner: RELEASER,
  disputeResolver: RESOLVER,
  receiver: PROVIDER,
}

/** Wallet that holds each role, for the role sweep. */
const WALLET_FOR: Record<EscrowRole, string> = {
  approver: APPROVER,
  serviceProvider: PROVIDER,
  releaseSigner: RELEASER,
  disputeResolver: RESOLVER,
  receiver: PROVIDER,
}

describe("normalizeRoleAddress", () => {
  it("keeps real addresses and trims them", () => {
    expect(normalizeRoleAddress(APPROVER)).toBe(APPROVER)
    expect(normalizeRoleAddress(`  ${APPROVER} `)).toBe(APPROVER)
  })

  it("treats every placeholder the mappings produce as unknown", () => {
    // Nest leaves the field undefined; the on-chain mapping fills "-".
    for (const value of [undefined, null, "", "   ", "-", "Unknown", "n/a"]) {
      expect(normalizeRoleAddress(value)).toBeUndefined()
    }
  })

  it("normalizes a whole role set", () => {
    expect(normalizeRoles({ approver: APPROVER, serviceProvider: "-" })).toEqual({
      approver: APPROVER,
      serviceProvider: undefined,
      releaseSigner: undefined,
      disputeResolver: undefined,
      receiver: undefined,
    })
  })
})

describe("role requirements", () => {
  const roleScoped = (Object.keys(ALLOWED_ROLES) as EscrowOperation[]).filter(
    (operation) => ALLOWED_ROLES[operation].length > 0,
  )

  /** The state each role-scoped operation is valid in, so only role varies. */
  const validState: Record<
    string,
    { state: EscrowLifecycleState; milestoneState?: "pending" | "approved" }
  > = {
    approveMilestone: { state: "funded", milestoneState: "pending" },
    changeMilestoneStatus: { state: "funded", milestoneState: "pending" },
    releaseFunds: { state: "in_progress", milestoneState: "approved" },
    dispute: { state: "funded", milestoneState: "pending" },
    resolve: { state: "disputed" },
  }

  it.each(roleScoped)("only the right role may %s", (operation) => {
    const allowedRoles = ALLOWED_ROLES[operation]
    const context = validState[operation]

    for (const role of Object.keys(WALLET_FOR) as EscrowRole[]) {
      const wallet = WALLET_FOR[role]
      const decision = canPerform(operation, { roles: ROLES, walletAddress: wallet, ...context })
      // `receiver` shares the provider's address in this fixture, so judge by
      // address rather than by role name.
      const shouldAllow = allowedRoles.some((allowed) => ROLES[allowed] === wallet)
      expect(decision.allowed, `${role} -> ${operation}`).toBe(shouldAllow)
    }

    const stranger = canPerform(operation, {
      roles: ROLES,
      walletAddress: STRANGER,
      ...context,
    })
    expect(stranger).toMatchObject({ allowed: false, reason: "wrong-role" })
  })

  it("lets any wallet fund, because Trustless Work does", () => {
    expect(
      canPerform("fund", { roles: ROLES, walletAddress: STRANGER, state: "waiting_for_funding" })
        .allowed,
    ).toBe(true)
  })

  it("lets either party dispute but never the resolver", () => {
    const context = { roles: ROLES, state: "funded" as const, milestoneState: "pending" as const }
    expect(canPerform("dispute", { ...context, walletAddress: APPROVER }).allowed).toBe(true)
    expect(canPerform("dispute", { ...context, walletAddress: PROVIDER }).allowed).toBe(true)
    expect(canPerform("dispute", { ...context, walletAddress: RESOLVER })).toMatchObject({
      allowed: false,
      reason: "wrong-role",
    })
  })

  it("refuses instead of assuming when the required role is unknown", () => {
    // Regression: "-" is truthy, so the previous check compared against it and
    // rejected the real service provider.
    expect(
      canPerform("changeMilestoneStatus", {
        roles: { serviceProvider: "-" },
        walletAddress: PROVIDER,
        state: "funded",
        milestoneState: "pending",
      }),
    ).toMatchObject({ allowed: false, reason: "unresolved-roles" })
  })

  it("refuses with no session wallet", () => {
    expect(
      canPerform("approveMilestone", { roles: ROLES, walletAddress: null, state: "funded" }),
    ).toEqual({ allowed: false, reason: "no-session" })
  })
})

describe("lifecycle state", () => {
  const states: EscrowLifecycleState[] = [
    "waiting_for_funding",
    "funded",
    "in_progress",
    "disputed",
    "completed",
    "unknown",
  ]

  /** operation -> the only states it is offered in. */
  const expected: Record<string, EscrowLifecycleState[]> = {
    fund: ["waiting_for_funding"],
    changeMilestoneStatus: ["funded", "in_progress"],
    approveMilestone: ["funded", "in_progress"],
    releaseFunds: ["funded", "in_progress"],
    dispute: ["funded", "in_progress"],
    resolve: ["disputed"],
  }

  it.each(Object.keys(expected))("%s is offered only in its own states", (operation) => {
    const op = operation as EscrowOperation
    const milestoneState = op === "releaseFunds" ? ("approved" as const) : ("pending" as const)

    for (const state of states) {
      const wallet = ALLOWED_ROLES[op].length ? ROLES[ALLOWED_ROLES[op][0]] : STRANGER
      const decision = canPerform(op, {
        roles: ROLES,
        walletAddress: wallet,
        state,
        milestoneState,
      })
      expect(decision.allowed, `${op} in ${state}`).toBe(expected[operation].includes(state))
    }
  })

  it("offers nothing at all once the escrow is completed", () => {
    for (const wallet of [APPROVER, PROVIDER, RELEASER, RESOLVER]) {
      expect(
        availableOperations({ roles: ROLES, walletAddress: wallet, state: "completed" }),
      ).toEqual([])
    }
  })

  it("offers nothing when the state could not be established", () => {
    expect(
      availableOperations({ roles: ROLES, walletAddress: APPROVER, state: "unknown" }),
    ).toEqual([])
  })
})

describe("milestone state", () => {
  it("evidence is for a pending milestone only", () => {
    const base = { roles: ROLES, walletAddress: PROVIDER, state: "funded" as const }
    expect(
      canPerform("changeMilestoneStatus", { ...base, milestoneState: "pending" }).allowed,
    ).toBe(true)
    for (const milestoneState of ["approved", "released"] as const) {
      expect(canPerform("changeMilestoneStatus", { ...base, milestoneState })).toMatchObject({
        allowed: false,
        reason: "wrong-milestone-state",
      })
    }
  })

  it("funds are released only from an approved milestone", () => {
    const base = { roles: ROLES, walletAddress: RELEASER, state: "in_progress" as const }
    expect(canPerform("releaseFunds", { ...base, milestoneState: "approved" }).allowed).toBe(true)
    for (const milestoneState of ["pending", "released"] as const) {
      expect(canPerform("releaseFunds", { ...base, milestoneState })).toMatchObject({
        allowed: false,
        reason: "wrong-milestone-state",
      })
    }
  })
})

describe("availableOperations", () => {
  it("gives each party exactly its own step of a funded escrow", () => {
    const base = { roles: ROLES, state: "funded" as const, milestoneState: "pending" as const }

    expect(availableOperations({ ...base, walletAddress: PROVIDER }).sort()).toEqual(
      ["changeMilestoneStatus", "dispute"].sort(),
    )
    expect(availableOperations({ ...base, walletAddress: APPROVER }).sort()).toEqual(
      ["approveMilestone", "dispute"].sort(),
    )
    // The reported bug, as an assertion: the approver is never offered evidence.
    expect(availableOperations({ ...base, walletAddress: APPROVER })).not.toContain(
      "changeMilestoneStatus",
    )
  })

  it("offers only funding before the escrow is funded", () => {
    expect(
      availableOperations({ roles: ROLES, walletAddress: APPROVER, state: "waiting_for_funding" }),
    ).toEqual(["fund"])
  })

  it("offers only resolution while disputed, and only to the resolver", () => {
    const base = { roles: ROLES, state: "disputed" as const }
    expect(availableOperations({ ...base, walletAddress: RESOLVER })).toEqual(["resolve"])
    expect(availableOperations({ ...base, walletAddress: APPROVER })).toEqual([])
  })
})

describe("describeRequiredRoles", () => {
  it("reads as a sentence fragment", () => {
    expect(describeRequiredRoles(["serviceProvider"])).toBe("service provider")
    expect(describeRequiredRoles(["approver", "serviceProvider"])).toBe(
      "approver or service provider",
    )
    expect(describeRequiredRoles([])).toBe("")
    expect(describeRequiredRoles(undefined)).toBe("")
  })
})
