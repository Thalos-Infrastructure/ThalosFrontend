import { describe, it, expect } from "vitest"
import { shortfall, LENDARA_AVAILABLE } from "./lendara"

describe("shortfall", () => {
  it("says how much more is needed", () => {
    expect(shortfall("12", "100")).toBe(88)
  })

  it("is null when the wallet already covers it", () => {
    expect(shortfall("100", "100")).toBeNull()
    expect(shortfall("250", "100")).toBeNull()
  })

  it("reads an amount written with thousands separators", () => {
    // The dashboards render amounts as "1,500" in places.
    expect(shortfall("500", "1,500")).toBe(1000)
  })

  it("is null when the balance could not be read", () => {
    // Not the same as zero: telling someone they are 100 short when they may
    // already have it would be worse than saying nothing.
    expect(shortfall(null, "100")).toBeNull()
  })

  it("is null when either side is not a number", () => {
    expect(shortfall("abc", "100")).toBeNull()
    expect(shortfall("10", "not-an-amount")).toBeNull()
  })

  it("treats an empty balance string as zero, not as unknown", () => {
    expect(shortfall("", "100")).toBe(100)
  })
})

describe("LENDARA_AVAILABLE", () => {
  it("is on now that the backend endpoints exist", () => {
    expect(LENDARA_AVAILABLE).toBe(true)
  })
})
