import { describe, expect, it } from "vitest"

import {
  getAgreementStateSnapshot,
  getAgreementStatusLabel,
  isBackendFunded,
} from "./agreementStateMap"

describe("getAgreementStateSnapshot", () => {
  it("reports an unconfirmed state while a sync is pending", () => {
    expect(getAgreementStateSnapshot({ status: "funded", syncPending: true })).toEqual({
      state: "unknown",
      isConfirmed: false,
    })
  })

  it("confirms a state it can derive", () => {
    expect(
      getAgreementStateSnapshot({ status: "funded", milestones: [{ status: "pending" }] }),
    ).toEqual({ state: "funded", isConfirmed: true })
  })

  it("does not confirm an unrecognised status", () => {
    expect(getAgreementStateSnapshot({ status: "something_new" })).toEqual({
      state: "unknown",
      isConfirmed: false,
    })
  })

  it("no longer exposes a next action", () => {
    // A next action is per-actor. Computing one from the agreement alone is what
    // offered the approver the service provider's button.
    expect(getAgreementStateSnapshot({ status: "funded" })).not.toHaveProperty("nextAction")
  })
})

describe("isBackendFunded", () => {
  it("is true once the escrow holds funds, and stays true through completion", () => {
    expect(isBackendFunded({ status: "funded", milestones: [{ status: "pending" }] })).toBe(true)
    expect(isBackendFunded({ status: "funded", milestones: [{ status: "approved" }] })).toBe(true)
    expect(isBackendFunded({ status: "funded", milestones: [{ status: "released" }] })).toBe(true)
  })

  it("is false before funding, while disputed, and while unconfirmed", () => {
    expect(isBackendFunded({ status: "pending" })).toBe(false)
    expect(isBackendFunded({ status: "disputed" })).toBe(false)
    expect(isBackendFunded({ status: "funded", syncPending: true })).toBe(false)
    expect(isBackendFunded({ status: "something_new" })).toBe(false)
  })
})

describe("getAgreementStatusLabel", () => {
  it("has a label for every state, including the unconfirmed one", () => {
    expect(getAgreementStatusLabel("waiting_for_funding")).toBe("Waiting for Funding")
    expect(getAgreementStatusLabel("in_progress")).toBe("In Progress")
    expect(getAgreementStatusLabel("unknown")).toBe("Status pending confirmation")
  })
})
