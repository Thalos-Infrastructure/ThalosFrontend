import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/config", () => ({ API_URL: "http://localhost:3001/v1" }))

import {
  applyToOpportunity,
  getMyApplication,
  listApplications,
  updateApplicationStatus,
  type Application,
} from "../applications"

function mockFetch(body: unknown, status = 200) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))
}

const APPLICATION: Application = {
  id: "app-1",
  opportunityId: "opp-1",
  builderId: "builder-1",
  message: "I can build this",
  status: "pending",
  createdAt: "2026-08-26T00:00:00Z",
}

afterEach(() => vi.restoreAllMocks())

describe("applications contract", () => {
  describe("applyToOpportunity", () => {
    it("POSTs snake_case body and unwraps { application } envelope", async () => {
      const fetchSpy = mockFetch({
        application: {
          id: "app-1",
          opportunity_id: "opp-1",
          builder_id: "builder-1",
          message: "I can build this",
          status: "pending",
          created_at: "2026-08-26T00:00:00Z",
        },
      })
      const res = await applyToOpportunity("opp-1", "I can build this", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.id).toBe("app-1")
      expect(res.data!.opportunityId).toBe("opp-1")
      expect(res.data!.builderId).toBe("builder-1")

      const [, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
      expect(init.method).toBe("POST")
      expect(JSON.parse(String(init.body))).toEqual({
        opportunity_id: "opp-1",
        message: "I can build this",
      })
    })

    it("surfaces the duplicate-application error message (409)", async () => {
      mockFetch({ message: "You have already applied to this opportunity", statusCode: 409 }, 409)
      const res = await applyToOpportunity("opp-1", "", "tok")
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/already applied/i)
    })

    it("maps an unrecognized status to pending", async () => {
      mockFetch({
        application: { id: "app-2", builder_id: "b2", status: "weird" },
      })
      const res = await applyToOpportunity("opp-1", "", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.status).toBe("pending")
    })
  })

  describe("listApplications", () => {
    it("queries by opportunity_id and unwraps { applications }", async () => {
      const fetchSpy = mockFetch({
        applications: [
          {
            id: "app-1",
            opportunity_id: "opp-1",
            builder_id: "builder-1",
            status: "accepted",
          },
        ],
      })
      const res = await listApplications("opp-1", "tok")
      expect(res.success).toBe(true)
      expect(res.data).toHaveLength(1)
      expect(res.data![0].status).toBe("accepted")

      const [url] = fetchSpy.mock.calls[0] as unknown as [string]
      expect(url).toContain("/applications?opportunity_id=opp-1")
    })

    it("drift test: falls back to items/data envelopes", async () => {
      mockFetch({ items: [{ id: "a", builder_id: "b" }] })
      const viaItems = await listApplications("opp-1", "tok")
      expect(viaItems.success).toBe(true)
      expect(viaItems.data).toHaveLength(1)

      mockFetch({ data: [{ id: "a2", builder_id: "b" }] })
      const viaData = await listApplications("opp-1", "tok")
      expect(viaData.success).toBe(true)
      expect(viaData.data).toHaveLength(1)
    })
  })

  describe("getMyApplication", () => {
    it("returns the application whose builderId matches the current user", async () => {
      mockFetch({
        applications: [
          { id: "mine", builder_id: "me", status: "pending" },
          { id: "other", builder_id: "someone-else", status: "accepted" },
        ],
      })
      const res = await getMyApplication("opp-1", "me", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.id).toBe("mine")
      expect(res.data!.status).toBe("pending")
    })

    it("returns null when the user has not applied", async () => {
      mockFetch({
        applications: [{ id: "other", builder_id: "someone-else", status: "accepted" }],
      })
      const res = await getMyApplication("opp-1", "me", "tok")
      expect(res.success).toBe(true)
      expect(res.data).toBeNull()
    })

    it("preserves a rejected status so the UI can reflect it", async () => {
      mockFetch({
        applications: [{ id: "mine", builder_id: "me", status: "rejected" }],
      })
      const res = await getMyApplication("opp-1", "me", "tok")
      expect(res.data!.status).toBe("rejected")
    })
  })

  describe("updateApplicationStatus", () => {
    it("PATCHes { status } and unwraps the updated application", async () => {
      const fetchSpy = mockFetch({
        application: {
          id: "app-1",
          opportunity_id: "opp-1",
          builder_id: "builder-1",
          status: "accepted",
        },
      })
      const res = await updateApplicationStatus("app-1", "accepted", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.status).toBe("accepted")

      const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
      expect(url).toContain("/applications/app-1")
      expect(init.method).toBe("PATCH")
      expect(JSON.parse(String(init.body))).toEqual({ status: "accepted" })
    })
  })

  describe("envelope drift", () => {
    it("unwraps a bare object without an application key", async () => {
      mockFetch({ id: "app-3", builder_id: "b3" })
      const res = await applyToOpportunity("opp-1", "", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.id).toBe("app-3")
    })
  })
})
