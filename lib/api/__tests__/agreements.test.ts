import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/config", () => ({ API_URL: "http://localhost:3001/v1" }))

import {
  createAgreement,
  getAgreementsByWallet,
  getAgreement,
  updateAgreementStatusApi,
  updateMilestoneStatus,
  getAgreementActivityApi,
  getAgreementByContractIdApi,
  linkContractToAgreementApi,
  getAgreementByIdWithParticipants,
  type Agreement,
  type AgreementParticipant,
  type AgreementActivity,
} from "../agreements"

function mockFetch(body: unknown, status = 200) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))
}

const AGREEMENT: Agreement = {
  id: "a1",
  contract_id: "CABC...",
  title: "Freelance gig",
  description: "Build a website",
  amount: "1000",
  asset: "USDC",
  status: "active",
  agreement_type: "single",
  milestones: [{ description: "Design", amount: "400", status: "approved" }],
  metadata: { category: "design" },
  created_by: "G1...",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-02T00:00:00Z",
  funded_at: "2025-01-01T12:00:00Z",
  completed_at: null,
}

afterEach(() => vi.restoreAllMocks())

describe("agreements contract", () => {
  describe("createAgreement", () => {
    it("unwraps { agreement } envelope", async () => {
      mockFetch({ agreement: AGREEMENT })
      const res = await createAgreement(
        {
          title: "Freelance gig",
          amount: "1000",
          created_by: "G1...",
          participants: [{ wallet_address: "G2...", role: "payee" }],
        },
        "tok",
      )
      expect(res.success).toBe(true)
      expect(res.data!.id).toBe("a1")
      expect(res.data!.status).toBe("active")
    })

    it("returns error when backend envelope has error field", async () => {
      mockFetch({ agreement: null, error: "insufficient funds" })
      const res = await createAgreement(
        {
          title: "Fail",
          amount: "999",
          created_by: "G1...",
          participants: [],
        },
        "tok",
      )
      expect(res.success).toBe(false)
      expect(res.error).toBe("insufficient funds")
    })
  })

  describe("getAgreementsByWallet", () => {
    it("unwraps { agreements } envelope", async () => {
      mockFetch({ agreements: [AGREEMENT] })
      const res = await getAgreementsByWallet("G1...", "tok")
      expect(res.success).toBe(true)
      expect(res.data!).toHaveLength(1)
    })
  })

  describe("getAgreement", () => {
    it("unwraps { agreement } envelope", async () => {
      mockFetch({ agreement: AGREEMENT })
      const res = await getAgreement("a1", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.title).toBe("Freelance gig")
    })
  })

  describe("updateAgreementStatusApi", () => {
    it("unwraps { success } envelope", async () => {
      mockFetch({ success: true })
      const res = await updateAgreementStatusApi("a1", "completed", "G1...", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.success).toBe(true)
    })

    it("handles success=false from backend", async () => {
      mockFetch({ success: false, error: "not authorized" })
      const res = await updateAgreementStatusApi("a1", "completed", "G1...", "tok")
      expect(res.success).toBe(false)
      expect(res.error).toBe("not authorized")
    })
  })

  describe("updateMilestoneStatus", () => {
    it("unwraps { success } envelope", async () => {
      mockFetch({ success: true })
      const res = await updateMilestoneStatus("a1", 0, "approved", "G1...", undefined, "tok")
      expect(res.success).toBe(true)
      expect(res.data!.success).toBe(true)
    })
  })

  describe("getAgreementActivityApi", () => {
    it("unwraps { activities } envelope", async () => {
      const activity: AgreementActivity = {
        id: "act1",
        agreement_id: "a1",
        actor_wallet: "G1...",
        action: "created",
        details: {},
        created_at: "2025-01-01T00:00:00Z",
      }
      mockFetch({ activities: [activity] })
      const res = await getAgreementActivityApi("a1", "tok")
      expect(res.success).toBe(true)
      expect(res.data!).toHaveLength(1)
      expect(res.data![0].action).toBe("created")
    })
  })

  describe("getAgreementByContractIdApi", () => {
    it("unwraps { agreement } envelope", async () => {
      mockFetch({ agreement: AGREEMENT })
      const res = await getAgreementByContractIdApi("CABC...", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.contract_id).toBe("CABC...")
    })
  })

  describe("linkContractToAgreementApi", () => {
    it("unwraps { success } envelope", async () => {
      mockFetch({ success: true })
      const res = await linkContractToAgreementApi("a1", "CABC...", "G1...", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.success).toBe(true)
    })
  })

  describe("getAgreementByIdWithParticipants", () => {
    it("unwraps { agreement, participants } envelope", async () => {
      const participant: AgreementParticipant = {
        id: "p1",
        agreement_id: "a1",
        wallet_address: "G2...",
        role: "payee",
        joined_at: "2025-01-01T00:00:00Z",
      }
      mockFetch({ agreement: AGREEMENT, participants: [participant] })
      const res = await getAgreementByIdWithParticipants("a1", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.agreement.id).toBe("a1")
      expect(res.data!.participants).toHaveLength(1)
      expect(res.data!.participants[0].role).toBe("payee")
    })

    it("drift test: missing participants key defaults to empty array", async () => {
      mockFetch({ agreement: AGREEMENT })
      const res = await getAgreementByIdWithParticipants("a1", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.participants).toEqual([])
    })
  })
})
