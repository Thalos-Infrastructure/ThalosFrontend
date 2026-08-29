import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/config", () => ({ API_URL: "http://localhost:3001/v1" }))

import {
  discoverOpportunities,
  getOpenOpportunities,
  listMyOpportunities,
  getOpportunity,
  updateOpportunityStatus,
  type Opportunity,
} from "../opportunities"

function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status }),
  )
}

const OPPORTUNITY: Opportunity = {
  id: "opp-1",
  project_id: "proj-1",
  title: "Soroban Developer",
  description: "Build an escrow dApp",
  skills_required: ["Rust", "Soroban"],
  budget_amount: 8000,
  budget_asset: "USDC",
  engagement_type: "milestone",
  status: "open",
  created_at: "2026-08-26T00:00:00Z",
}

afterEach(() => vi.restoreAllMocks())

describe("opportunities contract", () => {
  describe("discoverOpportunities", () => {
    it("unwraps the paginated envelope", async () => {
      mockFetch({ opportunities: [OPPORTUNITY], total: 1, page: 1, limit: 20, totalPages: 1 })
      const res = await discoverOpportunities({}, "tok")
      expect(res.success).toBe(true)
      expect(res.data!.data).toHaveLength(1)
      expect(res.data!.total).toBe(1)
    })

    it("normalizes a wire envelope that omits totalPages", async () => {
      // BE discover returns { opportunities, page, limit, total } — no totalPages
      mockFetch({ opportunities: [OPPORTUNITY], total: 45, page: 2, limit: 20 })
      const res = await discoverOpportunities({ page: 2 }, "tok")
      expect(res.success).toBe(true)
      expect(res.data!.totalPages).toBe(3)
      expect(res.data!.page).toBe(2)
    })

    it("serializes filters as query params (skills repeat, ranges, search)", async () => {
      const fetchSpy = mockFetch({ opportunities: [], total: 0, page: 1, limit: 20, totalPages: 0 })
      await discoverOpportunities(
        { skills_required: ["Rust", "Soroban"], engagement_type: "milestone", budget_min: 100, budget_max: 9000, q: "escrow", page: 2, limit: 10 },
        "tok",
      )
      const url = fetchSpy.mock.calls[0][0] as string
      expect(url).toContain("/opportunities?")
      expect((url.match(/skills_required=/g) || []).length).toBe(2)
      expect(url).toContain("engagement_type=milestone")
      expect(url).toContain("budget_min=100")
      expect(url).toContain("budget_max=9000")
      expect(url).toContain("q=escrow")
      expect(url).toContain("page=2")
      expect(url).toContain("limit=10")
    })
  })

  describe("getOpenOpportunities", () => {
    it("flattens the paginated envelope to a list", async () => {
      mockFetch({ opportunities: [OPPORTUNITY], total: 1, page: 1, limit: 20, totalPages: 1 })
      const res = await getOpenOpportunities({}, "tok")
      expect(res.success).toBe(true)
      expect(res.data![0].id).toBe("opp-1")
    })
  })

  describe("listMyOpportunities", () => {
    it("GETs /opportunities/mine and unwraps { opportunities } across all statuses", async () => {
      const fetchSpy = mockFetch({
        opportunities: [
          OPPORTUNITY,
          { ...OPPORTUNITY, id: "opp-2", status: "filled" },
          { ...OPPORTUNITY, id: "opp-3", status: "closed" },
        ],
      })
      const res = await listMyOpportunities("tok")
      expect(res.success).toBe(true)
      expect(res.data).toHaveLength(3)
      expect(res.data!.map((o) => o.status)).toEqual(["open", "filled", "closed"])

      const [url] = fetchSpy.mock.calls[0] as unknown as [string]
      expect(url).toContain("/opportunities/mine")
    })
  })

  describe("getOpportunity", () => {
    it("unwraps { opportunity } envelope", async () => {
      mockFetch({ opportunity: OPPORTUNITY })
      const res = await getOpportunity("opp-1", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.title).toBe("Soroban Developer")
    })

    it("drift test: accepts a bare object without an opportunity key", async () => {
      mockFetch(OPPORTUNITY)
      const res = await getOpportunity("opp-1", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.id).toBe("opp-1")
    })
  })

  describe("updateOpportunityStatus", () => {
    it("PATCHes { status } on the opportunity resource", async () => {
      const fetchSpy = mockFetch({ opportunity: { ...OPPORTUNITY, status: "filled" } })
      const res = await updateOpportunityStatus("opp-1", "filled", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.status).toBe("filled")

      const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
      expect(url).toContain("/opportunities/opp-1")
      expect(init.method).toBe("PATCH")
      expect(JSON.parse(String(init.body))).toEqual({ status: "filled" })
    })
  })
})
