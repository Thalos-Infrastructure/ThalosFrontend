import { describe, expect, it } from "vitest"

import { deriveLifecycleState } from "@/lib/permissions/agreementState"
import { statusConfig, statusConfigForState } from "./statusConfig"
import type { EscrowLifecycleState } from "@/lib/permissions/escrowActions"

describe("statusConfigForState", () => {
  const states: EscrowLifecycleState[] = [
    "waiting_for_funding",
    "funded",
    "in_progress",
    "disputed",
    "completed",
    "unknown",
  ]

  it("has a distinct badge for every state", () => {
    const labels = states.map((state) => statusConfigForState(state).labelKey)
    expect(new Set(labels).size).toBe(states.length)
  })

  it("maps each state to the badge the dashboard already used", () => {
    expect(statusConfigForState("waiting_for_funding")).toBe(statusConfig.pending)
    expect(statusConfigForState("funded")).toBe(statusConfig.funded)
    expect(statusConfigForState("in_progress")).toBe(statusConfig.in_progress)
    expect(statusConfigForState("completed")).toBe(statusConfig.released)
  })

  it("no longer falls back to Funded for a disputed escrow", () => {
    // statusConfig had no `disputed` entry, so a disputed escrow rendered the
    // blue "Funded" badge.
    expect(statusConfigForState("disputed").labelKey).toBe("status.disputed")
  })
})

describe("badge derived from the escrow, not from a cached status string", () => {
  /** What the badge shows for a given escrow snapshot. */
  const badgeFor = (input: Parameters<typeof deriveLifecycleState>[0]) =>
    statusConfigForState(deriveLifecycleState(input)).labelKey

  it("shows Funded once the balance covers the amount, whatever the cached status says", () => {
    // The reported bug: after funding, the escrow list still held status
    // "pending" from the pre-funding read, so the badge stayed on
    // "Pending Funding" while the step indicator already showed funded.
    expect(
      badgeFor({
        status: "pending",
        balance: "100",
        amount: "100",
        milestones: [{ status: "pending" }],
      }),
    ).toBe("status.funded")
  })

  it("still shows Pending Funding when the balance does not cover the amount", () => {
    expect(
      badgeFor({
        status: "pending",
        balance: "40",
        amount: "100",
        milestones: [{ status: "pending" }],
      }),
    ).toBe("flow.pendingFunding")
  })

  it("moves to In Progress once a milestone is approved", () => {
    expect(
      badgeFor({
        status: "funded",
        balance: "100",
        amount: "100",
        milestones: [{ approved: true }],
      }),
    ).toBe("status.inProgress")
  })

  it("shows Released when every milestone is released", () => {
    expect(
      badgeFor({
        status: "funded",
        balance: "100",
        amount: "100",
        milestones: [{ status: "released" }],
      }),
    ).toBe("status.released")
  })

  it("shows the dispute even on a fully funded escrow", () => {
    expect(
      badgeFor({
        status: "disputed",
        balance: "100",
        amount: "100",
        milestones: [{ status: "pending" }],
      }),
    ).toBe("status.disputed")
  })
})
