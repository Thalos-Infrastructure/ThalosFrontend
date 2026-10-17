import { describe, expect, it } from "vitest"

import { isFundedEscrow } from "./fundingState"
import { describeShapeIssue, parseIndexerEscrows } from "./indexerEscrow"
import captured from "./__fixtures__/captured-by-role.json"

/**
 * The parser against a response Trustless Work actually sent.
 *
 * The rest of the suite proves we parse what the documentation describes. This
 * file is the one that proves the documentation and the API agree — and they do
 * not, in three places this capture already settled:
 *
 *   - `fundedBy` is documented on the indexer response and was absent from all
 *     eight escrows returned. Nothing may depend on it.
 *   - `balance` is documented optional and was present on all eight, including
 *     as 0 for escrows that were never funded.
 *   - `createdAt` is documented as a Date and arrives as a Firestore timestamp,
 *     `{ _seconds }`.
 *
 * Captured 2026-10-05 from `GET /v1/escrows/by-role?role=platformAddress`
 * against dev.api.trustlesswork.com (testnet). Addresses are left intact:
 * escrows are public on-chain records and these only ever held testnet funds.
 */
describe("a response Trustless Work actually sent", () => {
  it("parses with nothing to complain about", () => {
    const { escrows, issues } = parseIndexerEscrows(captured)
    expect(issues.map(describeShapeIssue)).toEqual([])
    expect(escrows).toHaveLength(3)
  })

  it("resolves every party from the nested roles object", () => {
    const [funded] = parseIndexerEscrows(captured).escrows
    expect(funded.roles.approver).toMatch(/^G[A-Z0-9]{55}$/)
    expect(funded.roles.serviceProvider).toMatch(/^G[A-Z0-9]{55}$/)
    expect(funded.roles.releaseSigner).toMatch(/^G[A-Z0-9]{55}$/)
    expect(funded.roles.disputeResolver).toMatch(/^G[A-Z0-9]{55}$/)
  })

  it("reads a real createdAt rather than defaulting to today", () => {
    // It arrives as `{ _seconds }`; read as a string it yields nothing, and
    // every agreement then renders with the current date.
    for (const escrow of parseIndexerEscrows(captured).escrows) {
      expect(escrow.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    }
  })

  it("tells funded from unfunded by the balance alone", () => {
    // No escrow in this capture carries `fundedBy`, so the balance is the only
    // evidence there is — which is why nothing may hang on that field.
    const [funded, unfunded, multiUnfunded] = parseIndexerEscrows(captured).escrows
    expect(isFundedEscrow(funded)).toBe(true)
    expect(isFundedEscrow(unfunded)).toBe(false)
    expect(isFundedEscrow(multiUnfunded)).toBe(false)
  })

  it("keeps the escrow type Trustless Work declares, not a milestone count", () => {
    const escrows = parseIndexerEscrows(captured).escrows
    expect(escrows.map((e) => e.escrowType)).toEqual([
      "single-release",
      "single-release",
      "multi-release",
    ])
    // The multi-release one has a single milestone, so a count-based guess
    // would have called it single-release and applied the wrong release rule.
    expect(escrows[2].milestones).toHaveLength(1)
  })

  it("does not invent an amount the payload never carried", () => {
    // The multi-release escrow has no root amount and no milestone amounts.
    // Reporting "0" as if it were agreed would make `balance >= amount` true
    // and mark an unfunded escrow funded.
    const [, , multi] = parseIndexerEscrows(captured).escrows
    expect(isFundedEscrow(multi)).toBe(false)
  })
})
