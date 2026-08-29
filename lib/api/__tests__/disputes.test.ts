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
  type DisputeResolution,
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
  evidence_urls: [],
  status: "open",
  resolver_wallet: null,
  payer_percentage: null,
  payee_percentage: null,
  resolution_notes: null,
  created_at: "2025-01-01T00:00:00Z",
  resolved_at: null,
}

const RESOLUTION: DisputeResolution = {
  id: "r1",
  dispute_id: "d1",
  resolved_by: "G5...",
  payer_percentage: 60,
  payee_percentage: 40,
  resolution_notes: "Settled",
  created_at: "2025-02-01T00:00:00Z",
}

afterEach(() => vi.restoreAllMocks())

describe("disputes contract", () => {
  describe("openDispute", () => {
    it("parses a new dispute from envelope", async () => {
      mockFetch({ dispute: DISPUTE, error: null })
      const res = await openDispute(
        { agreement_id: "a1", reason: "Not delivered", opened_by: "G1..." },
        "tok",
      )
      expect(res.success).toBe(true)
      expect(res.data!.status).toBe("open")
      expect(res.data!.reason).toBe("Deliverable not met")
    })
  })

  describe("getOpenDisputes", () => {
    it("parses array of disputes from envelope", async () => {
      mockFetch({ disputes: [DISPUTE], error: null })
      const res = await getOpenDisputes("tok")
      expect(res.success).toBe(true)
      expect(res.data!).toHaveLength(1)
      expect(res.data![0].id).toBe("d1")
    })
  })

  describe("getDisputesByResolver", () => {
    it("parses array of disputes from envelope", async () => {
      mockFetch({ disputes: [DISPUTE], error: null })
      const res = await getDisputesByResolver("G1...", "tok")
      expect(res.success).toBe(true)
      expect(res.data!).toHaveLength(1)
    })
  })

  describe("getDisputesByAgreement", () => {
    it("parses array of disputes from envelope", async () => {
      mockFetch({ disputes: [DISPUTE], error: null })
      const res = await getDisputesByAgreement("a1", "tok")
      expect(res.success).toBe(true)
      expect(res.data!).toHaveLength(1)
    })
  })

  describe("getDispute", () => {
    it("parses a single dispute from envelope", async () => {
      mockFetch({ dispute: DISPUTE, error: null })
      const res = await getDispute("d1", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.id).toBe("d1")
      expect(res.data!.status).toBe("open")
    })
  })

  describe("assignResolver", () => {
    it("parses dispute with resolver assigned", async () => {
      mockFetch({ dispute: { ...DISPUTE, status: "under_review", resolver_wallet: "G5..." }, error: null })
      const res = await assignResolver("d1", "G5...", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.status).toBe("under_review")
      expect(res.data!.resolver_wallet).toBe("G5...")
    })
  })

  describe("resolveDispute", () => {
    it("parses resolution from envelope", async () => {
      mockFetch({ resolution: RESOLUTION, error: null })
      const res = await resolveDispute(
        "d1",
        { resolved_by: "G5...", payer_percentage: 60, payee_percentage: 40, resolution_notes: "Settled" },
        "tok",
      )
      expect(res.success).toBe(true)
      expect(res.data!.resolved_by).toBe("G5...")
      expect(res.data!.payer_percentage).toBe(60)
      expect(res.data!.payee_percentage).toBe(40)
    })
  })

  it("drift test: removing status enum field breaks contract", async () => {
    mockFetch({ dispute: { id: "d1", agreement_id: "a1" }, error: null })
    const res = await getDispute("d1", "tok")
    expect(res.success).toBe(true)
    expect(res.data!.status).toBeUndefined()
  })
})
