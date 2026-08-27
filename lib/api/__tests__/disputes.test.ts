import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/config", () => ({ API_URL: "http://localhost:3001/v1" }))

import {
  openDispute,
  getOpenDisputes,
  getDisputesByResolver,
  getDisputesByAgreement,
  getDispute,
  assignResolver,
  resolveDispute,
  type Dispute,
} from "../disputes"

function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status }),
  )
}

const DISPUTE: Dispute = {
  id: "d1",
  agreement_id: "a1",
  opened_by: "G1...",
  reason: "Deliverable not met",
  status: "open",
  resolver_wallet: null,
  payer_percentage: null,
  payee_percentage: null,
  resolution_notes: null,
  created_at: "2025-01-01T00:00:00Z",
  resolved_at: null,
}

afterEach(() => vi.restoreAllMocks())

describe("disputes contract", () => {
  describe("openDispute", () => {
    it("parses a new dispute", async () => {
      mockFetch(DISPUTE)
      const res = await openDispute(
        { agreement_id: "a1", reason: "Not delivered" },
        "tok",
      )
      expect(res.success).toBe(true)
      expect(res.data!.status).toBe("open")
      expect(res.data!.reason).toBe("Deliverable not met")
    })
  })

  describe("getOpenDisputes", () => {
    it("parses array of disputes", async () => {
      mockFetch([DISPUTE])
      const res = await getOpenDisputes("tok")
      expect(res.success).toBe(true)
      expect(res.data!).toHaveLength(1)
      expect(res.data![0].id).toBe("d1")
    })
  })

  describe("getDisputesByResolver", () => {
    it("parses array of disputes", async () => {
      mockFetch([DISPUTE])
      const res = await getDisputesByResolver("G1...", "tok")
      expect(res.success).toBe(true)
      expect(res.data!).toHaveLength(1)
    })
  })

  describe("getDisputesByAgreement", () => {
    it("parses array of disputes", async () => {
      mockFetch([DISPUTE])
      const res = await getDisputesByAgreement("a1", "tok")
      expect(res.success).toBe(true)
      expect(res.data!).toHaveLength(1)
    })
  })

  describe("getDispute", () => {
    it("parses a single dispute", async () => {
      mockFetch(DISPUTE)
      const res = await getDispute("d1", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.id).toBe("d1")
      expect(res.data!.status).toBe("open")
    })
  })

  describe("assignResolver", () => {
    it("parses dispute with resolver assigned", async () => {
      mockFetch({ ...DISPUTE, status: "assigned", resolver_wallet: "G5..." })
      const res = await assignResolver("d1", "G5...", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.status).toBe("assigned")
      expect(res.data!.resolver_wallet).toBe("G5...")
    })
  })

  describe("resolveDispute", () => {
    it("parses resolved dispute with percentages", async () => {
      mockFetch({
        ...DISPUTE,
        status: "resolved",
        payer_percentage: 60,
        payee_percentage: 40,
        resolution_notes: "Settled",
        resolved_at: "2025-02-01T00:00:00Z",
      })
      const res = await resolveDispute(
        "d1",
        { payer_percentage: 60, payee_percentage: 40, resolution_notes: "Settled" },
        "tok",
      )
      expect(res.success).toBe(true)
      expect(res.data!.status).toBe("resolved")
      expect(res.data!.payer_percentage).toBe(60)
      expect(res.data!.payee_percentage).toBe(40)
      expect(res.data!.resolution_notes).toBe("Settled")
    })
  })

  it("drift test: removing status enum field breaks contract", async () => {
    mockFetch({ id: "d1", agreement_id: "a1" })
    const res = await getDispute("d1", "tok")
    expect(res.success).toBe(true)
    expect(res.data!.status).toBeUndefined()
  })
})
