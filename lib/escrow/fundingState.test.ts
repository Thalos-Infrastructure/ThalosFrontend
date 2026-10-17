import { describe, expect, it } from "vitest"

import { isFundedEscrow } from "./fundingState"

describe("isFundedEscrow", () => {
  it("uses the balance when there is a usable one", () => {
    expect(isFundedEscrow({ balance: "100", amount: "100" })).toBe(true)
    expect(isFundedEscrow({ balance: "150", amount: "100" })).toBe(true)
    expect(isFundedEscrow({ balance: "40", amount: "100" })).toBe(false)
  })

  it("falls back to the funder when the balance is absent", () => {
    // Trustless Work marks `balance` optional on the indexer responses, and
    // reading its absence as "not funded" is what made a funded escrow keep
    // offering the Fund button on every reload.
    expect(isFundedEscrow({ amount: "100", fundedBy: "GFUNDER" })).toBe(true)
    expect(isFundedEscrow({ amount: "100" })).toBe(false)
  })

  it("does not let an unusable balance decide either way", () => {
    for (const balance of [undefined, "", "   ", "not a number"]) {
      expect(isFundedEscrow({ balance, amount: "100" })).toBe(false)
      expect(isFundedEscrow({ balance, amount: "100", fundedBy: "GFUNDER" })).toBe(true)
    }
  })

  it("ignores a blank funder", () => {
    for (const fundedBy of ["", "   ", undefined]) {
      expect(isFundedEscrow({ amount: "100", fundedBy })).toBe(false)
    }
  })

  it("does not call a zero-amount escrow funded on the balance alone", () => {
    // amount 0 makes `balance >= amount` trivially true, which would mark every
    // escrow funded before anyone paid anything.
    expect(isFundedEscrow({ balance: "0", amount: "0" })).toBe(false)
    expect(isFundedEscrow({ balance: "0", amount: "0", fundedBy: "GFUNDER" })).toBe(true)
  })

  it("a prior funder does not override a balance that fell short", () => {
    // A balance that is present and insufficient is the stronger statement:
    // funds were withdrawn or the funding was partial.
    expect(isFundedEscrow({ balance: "40", amount: "100", fundedBy: "GFUNDER" })).toBe(false)
  })
})
