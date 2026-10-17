import { describe, expect, it } from "vitest"

import { findApproverEscrow } from "./approverEscrow"

const APPROVER = "GAPPROVER"
const OTHER = "GOTHER"

const escrows = [
  { id: "C1", approver: APPROVER, title: "Design work" },
  { id: "C2", approver: OTHER, title: "Someone else's escrow" },
  { id: "C3", title: "Roles not resolved yet" },
]

describe("findApproverEscrow", () => {
  it("matches the escrow being viewed when the wallet is its approver", () => {
    expect(findApproverEscrow(escrows, "C1", APPROVER)).toMatchObject({ id: "C1" })
  })

  it("does not match an escrow the wallet does not approve", () => {
    // Regression: the funding UI is reachable only from the approver view, so a
    // wrong match here would offer to fund someone else's escrow.
    expect(findApproverEscrow(escrows, "C2", APPROVER)).toBeNull()
  })

  it("does not match when the escrow has no resolved approver", () => {
    expect(findApproverEscrow(escrows, "C3", APPROVER)).toBeNull()
  })

  it("returns null with no agreement open and with no session wallet", () => {
    expect(findApproverEscrow(escrows, null, APPROVER)).toBeNull()
    expect(findApproverEscrow(escrows, "C1", null)).toBeNull()
  })

  it("returns null when nothing in the list has that id", () => {
    expect(findApproverEscrow(escrows, "C9", APPROVER)).toBeNull()
    expect(findApproverEscrow([], "C1", APPROVER)).toBeNull()
  })
})
