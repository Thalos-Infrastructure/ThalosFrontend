import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/config", () => ({ API_URL: "http://localhost:3001/v1" }))

import {
  startKybSession,
  getKybStatus,
  mapKybVerificationResponse,
  type KybSession,
  type KybStatusResponse,
} from "../kyb"

function mockFetch(body: unknown, status = 200) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))
}

const KYB_VERIFICATION = {
  verification: {
    id: "k1",
    organization_id: "org-123",
    business_name: "Acme Corp",
    registration_number: "REG-001",
    country: "US",
    entity_type: "llc",
    status: "verified" as const,
    rejection_reason: null,
    expires_at: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-02T00:00:00Z",
  },
}

afterEach(() => vi.restoreAllMocks())

describe("kyb contract", () => {
  describe("mapKybVerificationResponse (pure mapping)", () => {
    it("unwraps { verification } envelope and maps to KybSession", () => {
      const session = mapKybVerificationResponse(KYB_VERIFICATION)
      expect(session.organizationId).toBe("org-123")
      expect(session.status).toBe("verified")
      expect(session.business?.name).toBe("Acme Corp")
      expect(session.business?.country).toBe("US")
      expect(session.business?.entityType).toBe("llc")
      expect(session.failureReason).toBeNull()
    })

    it("handles missing optional fields gracefully", () => {
      const bare = {
        verification: {
          organization_id: "org-456",
          status: "pending",
        },
      }
      const session = mapKybVerificationResponse(bare as any)
      expect(session.organizationId).toBe("org-456")
      expect(session.status).toBe("pending")
      expect(session.business?.name).toBeNull()
      expect(session.expiresAt).toBeNull()
      expect(session.failureReason).toBeNull()
    })
  })

  describe("startKybSession", () => {
    it("parses { verification } envelope into KybSession", async () => {
      mockFetch(KYB_VERIFICATION)
      const res = await startKybSession({ organizationId: "org-123" } as any, "tok")
      expect(res.success).toBe(true)
      expect(res.data!.organizationId).toBe("org-123")
      expect(res.data!.status).toBe("verified")
      expect(res.data!.business!.name).toBe("Acme Corp")
    })
  })

  describe("getKybStatus", () => {
    it("parses { verification } into KybStatusResponse", async () => {
      mockFetch(KYB_VERIFICATION)
      const res = await getKybStatus("org-123", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.organizationId).toBe("org-123")
      expect(res.data!.status).toBe("verified")
      expect(res.data!.sessionExpired).toBe(false)
      expect(res.data!.business).toEqual({
        name: "Acme Corp",
        registrationNumber: "REG-001",
        country: "US",
        entityType: "llc",
      })
    })

    it("detects expired session", async () => {
      mockFetch({
        verification: {
          organization_id: "org-789",
          status: "in_review",
          expires_at: "2020-01-01T00:00:00Z",
        },
      })
      const res = await getKybStatus("org-789", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.sessionExpired).toBe(true)
      expect(res.data!.status).toBe("in_review")
    })

    it("drift test: missing verification key causes crash (contract enforced)", async () => {
      mockFetch({ status: "verified" })
      await expect(getKybStatus("org-123", "tok")).rejects.toThrow()
    })
  })
})
