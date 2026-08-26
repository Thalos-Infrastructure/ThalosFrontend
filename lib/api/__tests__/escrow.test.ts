import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/config", () => ({ API_URL: "http://localhost:3001/v1" }))

import {
  buildCreateEscrow,
  submitSignedTransaction,
  getEscrow,
  getMyEscrows,
  fundEscrow,
  submitEvidence,
  approveMilestone,
  cancelEscrow,
  getEscrowBalance,
  getEscrowsBySigner,
  getEscrowsByRole,
  type Escrow,
} from "../escrow"

function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status }),
  )
}

const ESCROW: Escrow = {
  id: "e1",
  contract_id: "CABC...",
  title: "Freelance gig",
  description: "Build a website",
  amount: "1000",
  balance: "1000",
  platform_fee: "50",
  payer: "G1...",
  payee: "G2...",
  approver: "G3...",
  release_signer: "G4...",
  dispute_resolver: "G5...",
  milestones: [{ description: "Design", amount: "400", status: "pending" }],
  status: "funded",
  created_at: "2025-01-01T00:00:00Z",
  funded_at: "2025-01-02T00:00:00Z",
}

afterEach(() => vi.restoreAllMocks())

describe("escrow contract", () => {
  describe("buildCreateEscrow", () => {
    it("parses { unsignedTransaction } envelope", async () => {
      mockFetch({ unsignedTransaction: "AAAAAG..." })
      const res = await buildCreateEscrow(
        {
          title: "Test",
          description: "Desc",
          amount: "100",
          platformFee: "5",
          signer: "G1...",
          serviceType: "single-release",
          roles: { approver: "G3...", serviceProvider: "G2...", releaseSigner: "G4...", receiver: "G2..." },
          milestones: [{ description: "M1" }],
        },
        "tok",
      )
      expect(res.success).toBe(true)
      expect(typeof res.data!.unsignedTransaction).toBe("string")
      expect(res.data!.unsignedTransaction).toBe("AAAAAG...")
    })

    it("drift test: missing unsignedTransaction key breaks contract", async () => {
      mockFetch({ tx: "AAAAAG..." })
      const res = await buildCreateEscrow(
        {
          title: "Test",
          description: "Desc",
          amount: "100",
          platformFee: "5",
          signer: "G1...",
          serviceType: "single-release",
          roles: { approver: "G3...", serviceProvider: "G2...", releaseSigner: "G4..." },
          milestones: [],
        },
        "tok",
      )
      expect(res.success).toBe(true)
      expect(res.data!.unsignedTransaction).toBeUndefined()
    })
  })

  describe("submitSignedTransaction", () => {
    it("parses arbitrary TW submission result", async () => {
      mockFetch({ hash: "tx123", status: "success" })
      const res = await submitSignedTransaction("AAAA...", "tok")
      expect(res.success).toBe(true)
      expect(res.data).toEqual({ hash: "tx123", status: "success" })
    })
  })

  describe("getEscrow", () => {
    it("parses a single escrow object", async () => {
      mockFetch(ESCROW)
      const res = await getEscrow("CABC...", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.status).toBe("funded")
      expect(res.data!.milestones).toHaveLength(1)
      expect(res.data!.milestones[0].status).toBe("pending")
    })
  })

  describe("getMyEscrows", () => {
    it("parses an array of escrows", async () => {
      mockFetch([ESCROW])
      const res = await getMyEscrows("tok")
      expect(res.success).toBe(true)
      expect(res.data!).toHaveLength(1)
      expect(res.data![0].id).toBe("e1")
    })
  })

  describe("fundEscrow", () => {
    it("parses { transaction_hash }", async () => {
      mockFetch({ transaction_hash: "tx_abc" })
      const res = await fundEscrow("CABC...", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.transaction_hash).toBe("tx_abc")
    })
  })

  describe("submitEvidence", () => {
    it("parses updated escrow", async () => {
      mockFetch(ESCROW)
      const res = await submitEvidence("CABC...", 0, { description: "Done" }, "tok")
      expect(res.success).toBe(true)
      expect(res.data!.id).toBe("e1")
    })
  })

  describe("approveMilestone", () => {
    it("parses { transaction_hash }", async () => {
      mockFetch({ transaction_hash: "tx_approve" })
      const res = await approveMilestone("CABC...", 0, "tok")
      expect(res.success).toBe(true)
      expect(res.data!.transaction_hash).toBe("tx_approve")
    })
  })

  describe("cancelEscrow", () => {
    it("parses cancelled escrow", async () => {
      mockFetch({ ...ESCROW, status: "cancelled" })
      const res = await cancelEscrow("CABC...", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.status).toBe("cancelled")
    })
  })

  describe("getEscrowBalance", () => {
    it("parses { xlm, usdc }", async () => {
      mockFetch({ xlm: "500", usdc: "500" })
      const res = await getEscrowBalance("CABC...", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.xlm).toBe("500")
      expect(res.data!.usdc).toBe("500")
    })
  })

  describe("getEscrowsBySigner", () => {
    it("parses array of escrows", async () => {
      mockFetch([ESCROW])
      const res = await getEscrowsBySigner("G1...")
      expect(res.success).toBe(true)
      expect(res.data!).toHaveLength(1)
      expect(res.data![0].contract_id).toBe("CABC...")
    })
  })

  describe("getEscrowsByRole", () => {
    it("parses array of escrows with query params", async () => {
      mockFetch([ESCROW])
      const res = await getEscrowsByRole(
        { address: "G1...", role: "sender", status: "funded" },
        "tok",
      )
      expect(res.success).toBe(true)
      expect(res.data!).toHaveLength(1)
    })
  })
})
