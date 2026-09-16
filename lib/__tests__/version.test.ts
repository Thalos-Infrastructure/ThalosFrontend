import { describe, expect, it } from "vitest"

import { formatBuildTime, formatVersionLabel } from "../version"

describe("formatVersionLabel", () => {
  it("joins version and short commit", () => {
    expect(formatVersionLabel("0.1.2", "9a785c9")).toBe("v0.1.2 · 9a785c9")
  })

  it("leads with the branch, which is what separates the main and release deploys", () => {
    expect(formatVersionLabel("0.1.2", "9a785c9", "release")).toBe("release · v0.1.2 · 9a785c9")
    expect(formatVersionLabel("0.1.2", "9a785c9", "main")).toBe("main · v0.1.2 · 9a785c9")
  })

  it("drops a missing piece instead of leaving empty separators", () => {
    expect(formatVersionLabel("0.1.2", "", "release")).toBe("release · v0.1.2")
    expect(formatVersionLabel("0.1.2", "9a785c9", "   ")).toBe("v0.1.2 · 9a785c9")
  })

  it("omits the commit when the build could not resolve one", () => {
    expect(formatVersionLabel("0.1.2", "")).toBe("v0.1.2")
  })

  it("does not double the v prefix on a tag-style version", () => {
    expect(formatVersionLabel("v1.4.0", "")).toBe("v1.4.0")
  })

  it("falls back to v0.0.0 rather than rendering an empty label", () => {
    expect(formatVersionLabel("", "")).toBe("v0.0.0")
  })
})

describe("formatBuildTime", () => {
  it("renders the ISO stamp as a fixed UTC string", () => {
    expect(formatBuildTime("2026-09-01T14:03:22.123Z")).toBe("2026-09-01 14:03 UTC")
  })

  it("returns empty for a missing or malformed stamp", () => {
    expect(formatBuildTime("")).toBe("")
    expect(formatBuildTime("not-a-date")).toBe("")
  })
})
