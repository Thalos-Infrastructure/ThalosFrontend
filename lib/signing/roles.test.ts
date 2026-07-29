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

  it("skips validation when the required role addresses are unknown", () => {
    expect(() => assertOperationRole("releaseFunds", {}, WALLET)).not.toThrow()
    expect(() => assertOperationRole("releaseFunds", undefined, WALLET)).not.toThrow()
  })

  it("never gates unrestricted operations (create / fund)", () => {
    expect(() => assertOperationRole("create", roles, WALLET)).not.toThrow()
    expect(() => assertOperationRole("fund", roles, "G_ANY_WALLET")).not.toThrow()
  })

  it("names the missing role in the error message", () => {
    expect(() => assertOperationRole("releaseFunds", roles, WALLET)).toThrow(/release signer/)
  })
})
