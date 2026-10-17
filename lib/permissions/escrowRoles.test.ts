import { describe, expect, it } from "vitest"

import { findApproverEscrow } from "@/lib/helpers/approverEscrow"
import { normalizeRoles } from "./escrowActions"

/**
 * Trustless Work nests the parties under `roles`. Reading them off the escrow
 * root yields undefined, which both dashboards then papered over with a "-"
 * filler — so every role looked resolved-but-wrong, no escrow ever matched its
 * approver, and the funding UI could not open.
 *
 * `GetEscrowsFromIndexerResponse` in
 * `.claude/skills/trustless-work-dev/skills/api/types.md`.
 */
const indexerEscrow = {
  contractId: "C1",
  amount: 100,
  roles: {
    approver: "GAPPROVER",
    serviceProvider: "GPROVIDER",
    releaseSigner: "GRELEASER",
    disputeResolver: "GRESOLVER",
    receiver: "GPROVIDER",
  },
  fundedBy: "GAPPROVER",
}

/** What a dashboard mapper has to produce from that payload. */
const mapped = (escrow: typeof indexerEscrow) => ({
  id: escrow.contractId,
  approver: escrow.roles?.approver,
  serviceProvider: escrow.roles?.serviceProvider || "-",
  releaseSigner: escrow.roles?.releaseSigner,
  disputeResolver: escrow.roles?.disputeResolver,
  receiver: escrow.roles?.receiver || "-",
  fundedBy: escrow.fundedBy,
})

describe("roles come from the nested `roles` object", () => {
  it("reading them off the root resolves nothing", () => {
    const wrong = indexerEscrow as unknown as Record<string, string | undefined>
    expect(wrong.approver).toBeUndefined()
    expect(wrong.serviceProvider).toBeUndefined()
  })

  it("reading them from `roles` resolves every party", () => {
    expect(normalizeRoles(mapped(indexerEscrow))).toEqual({
      approver: "GAPPROVER",
      serviceProvider: "GPROVIDER",
      releaseSigner: "GRELEASER",
      disputeResolver: "GRESOLVER",
      receiver: "GPROVIDER",
    })
  })

  it("an escrow mapped from the root never matches its approver", () => {
    // The business dashboard's symptom: funding unreachable, no error shown.
    const fromRoot = { id: "C1", approver: undefined }
    expect(findApproverEscrow([fromRoot], "C1", "GAPPROVER")).toBeNull()
  })

  it("an escrow mapped from `roles` matches, which is what opens funding", () => {
    expect(findApproverEscrow([mapped(indexerEscrow)], "C1", "GAPPROVER")).toMatchObject({
      id: "C1",
      approver: "GAPPROVER",
    })
  })

  it('the "-" filler is not mistaken for a resolved role', () => {
    const noParties = { ...indexerEscrow, roles: {} as typeof indexerEscrow.roles }
    expect(normalizeRoles(mapped(noParties))).toEqual({
      approver: undefined,
      serviceProvider: undefined,
      releaseSigner: undefined,
      disputeResolver: undefined,
      receiver: undefined,
    })
  })
})
