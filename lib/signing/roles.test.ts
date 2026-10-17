import { describe, expect, it } from "vitest"
import { assertOperationRole } from "./roles"
import { RoleValidationError, type EscrowRolesInfo } from "./types"

const WALLET = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWALLET"
const OTHER = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBOTHER"

const roles: EscrowRolesInfo = {
  approver: WALLET,
  serviceProvider: OTHER,
  releaseSigner: OTHER,
  disputeResolver: OTHER,
}

describe("assertOperationRole", () => {
  it("passes when the wallet holds the required role", () => {
    expect(() => assertOperationRole("approveMilestone", roles, WALLET)).not.toThrow()
  })

  it("throws RoleValidationError when the wallet lacks the required role", () => {
    expect(() => assertOperationRole("releaseFunds", roles, WALLET)).toThrow(RoleValidationError)
    expect(() => assertOperationRole("resolve", roles, WALLET)).toThrow(RoleValidationError)
  })

  it("accepts any of the allowed roles for dispute (approver OR serviceProvider)", () => {
    expect(() => assertOperationRole("dispute", roles, WALLET)).not.toThrow()
    expect(() => assertOperationRole("dispute", roles, OTHER)).not.toThrow()
  })

  it("refuses instead of skipping when the required role is unknown", () => {
    // Behaviour change: this used to pass, leaving Trustless Work as the only
    // authority. The caller then submitted its own wallet as the missing role,
    // which the backend rejected — so the permissive path produced a server
    // exception rather than the clean client-side refusal it was meant to avoid.
    expect(() => assertOperationRole("releaseFunds", {}, WALLET)).toThrow(RoleValidationError)
    expect(() => assertOperationRole("releaseFunds", undefined, WALLET)).toThrow(
      RoleValidationError,
    )
    expect(() => assertOperationRole("releaseFunds", {}, WALLET)).toThrow(/could not be resolved/)
  })

  it('does not treat the "-" placeholder as a role address', () => {
    // The on-chain mapping fills unknown roles with "-", which is truthy: the
    // check compared against it and rejected the real service provider.
    expect(() =>
      assertOperationRole("changeMilestoneStatus", { serviceProvider: "-" }, OTHER),
    ).toThrow(/could not be resolved/)
  })

  it("refuses with no connected wallet", () => {
    expect(() => assertOperationRole("approveMilestone", roles, "")).toThrow(/Connect a wallet/)
  })

  it("never gates unrestricted operations (create / fund)", () => {
    expect(() => assertOperationRole("create", roles, WALLET)).not.toThrow()
    expect(() => assertOperationRole("fund", roles, "G_ANY_WALLET")).not.toThrow()
  })

  it("names the missing role in the error message", () => {
    expect(() => assertOperationRole("releaseFunds", roles, WALLET)).toThrow(/release signer/)
  })
})
