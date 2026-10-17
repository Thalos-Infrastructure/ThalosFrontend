import { describe, expect, it } from "vitest"

import { canSubmitEvidence, resolveServiceProvider } from "./evidencePermission"

const SP = "GSERVICEPROVIDER"
const APPROVER = "GAPPROVER"

describe("resolveServiceProvider", () => {
  it("returns the address when it is a real one", () => {
    expect(resolveServiceProvider(SP)).toBe(SP)
    expect(resolveServiceProvider(`  ${SP}  `)).toBe(SP)
  })

  it("treats every 'unknown' spelling the two mappings use as unresolved", () => {
    // Nest leaves it undefined; the on-chain mapping fills "-".
    expect(resolveServiceProvider(undefined)).toBeNull()
    expect(resolveServiceProvider(null)).toBeNull()
    expect(resolveServiceProvider("")).toBeNull()
    expect(resolveServiceProvider("   ")).toBeNull()
    expect(resolveServiceProvider("-")).toBeNull()
    expect(resolveServiceProvider("Unknown")).toBeNull()
  })
})

describe("canSubmitEvidence", () => {
  it("allows the service provider", () => {
    expect(canSubmitEvidence({ serviceProvider: SP, walletAddress: SP })).toEqual({
      allowed: true,
      serviceProvider: SP,
    })
  })

  it("refuses anyone else and names the address that may submit", () => {
    // This is the reported bug: the approver (who creates the agreement) was
    // offered the button and the backend threw.
    expect(canSubmitEvidence({ serviceProvider: SP, walletAddress: APPROVER })).toEqual({
      allowed: false,
      reason: "not-service-provider",
      serviceProvider: SP,
    })
  })

  it("refuses rather than assuming the viewer is the service provider", () => {
    // Regression: the old code sent `serviceProvider || walletAddress`, which
    // asserted a role it had no basis for and was rejected by the backend.
    for (const unresolved of [undefined, null, "", "-", "Unknown"]) {
      expect(canSubmitEvidence({ serviceProvider: unresolved, walletAddress: APPROVER })).toEqual({
        allowed: false,
        reason: "unresolved-service-provider",
      })
    }
  })

  it("refuses with no session wallet", () => {
    expect(canSubmitEvidence({ serviceProvider: SP, walletAddress: null })).toEqual({
      allowed: false,
      reason: "no-session",
    })
    expect(canSubmitEvidence({ serviceProvider: SP, walletAddress: "  " })).toEqual({
      allowed: false,
      reason: "no-session",
    })
  })
})
