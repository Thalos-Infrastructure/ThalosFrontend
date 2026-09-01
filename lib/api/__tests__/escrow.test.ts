import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/config", () => ({ API_URL: "http://localhost:3001/v1" }))

import {
  buildCreateEscrow,
  submitSignedTransaction,
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
