import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/config", () => ({ API_URL: "http://localhost:3001/v1" }))

import {
  getLinkedWallets,
  getWalletsWithBalances,
  getWalletsWithAgreements,
  getPrimaryWallet,
  getWalletBalance,
  linkWallet,
  getWalletVerificationChallenge,
  updateWallet,
  unlinkWallet,
  type LinkedWallet,
  type WalletWithBalance,
} from "../wallets"

function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status }),
  )
}

const WALLET: LinkedWallet = {
  id: "w1",
  wallet_address: "GABC...",
  wallet_type: "freighter",
  label: "main",
  is_primary: true,
  is_verified: true,
  linked_at: "2025-01-01T00:00:00Z",
  auth_provider: "freighter",
  c_address: null,
}

afterEach(() => vi.restoreAllMocks())

describe("wallets contract", () => {
  describe("getLinkedWallets", () => {
    it("parses an array of wallets", async () => {
      mockFetch([WALLET])
      const res = await getLinkedWallets("tok")
      expect(res.success).toBe(true)
      expect(res.data).toHaveLength(1)
      expect(res.data![0].wallet_type).toBe("freighter")
      expect(res.data![0].wallet_address).toBe("GABC...")
    })

    it("drift test: missing required field causes undefined", async () => {
      mockFetch([{ id: "w1" }])
      const res = await getLinkedWallets("tok")
      expect(res.success).toBe(true)
      expect(res.data![0].wallet_address).toBeUndefined()
    })
  })

  describe("getWalletsWithBalances", () => {
    it("parses wallets with balance envelope", async () => {
      const w: WalletWithBalance = { ...WALLET, balance: { xlm: "10.5", usdc: "100" }, agreements_count: 3 }
      mockFetch([w])
      const res = await getWalletsWithBalances("tok")
      expect(res.success).toBe(true)
      expect(res.data![0].balance.xlm).toBe("10.5")
      expect(res.data![0].balance.usdc).toBe("100")
      expect(res.data![0].agreements_count).toBe(3)
    })
  })

  describe("getWalletsWithAgreements", () => {
    it("unwraps { wallets: [...] } envelope", async () => {
      mockFetch({
        wallets: [
          {
            ...WALLET,
            agreements_count: 1,
            agreements: [{ id: "a1", title: "Deal", status: "active", amount: "500", role: "buyer" }],
          },
        ],
      })
      const res = await getWalletsWithAgreements("tok")
      expect(res.success).toBe(true)
      expect(res.data!).toHaveLength(1)
      expect(res.data![0].agreements).toHaveLength(1)
      expect(res.data![0].agreements[0].role).toBe("buyer")
    })

    it("handles flat array response", async () => {
      mockFetch([{ ...WALLET, agreements_count: 0, agreements: [] }])
      const res = await getWalletsWithAgreements("tok")
      expect(res.success).toBe(true)
      expect(res.data!).toHaveLength(1)
      expect(res.data![0].agreements).toEqual([])
    })

    it("falls back to empty array on missing envelope", async () => {
      mockFetch({})
      const res = await getWalletsWithAgreements("tok")
      expect(res.success).toBe(true)
      expect(res.data!).toEqual([])
    })
  })

  describe("getPrimaryWallet", () => {
    it("parses a single wallet object", async () => {
      mockFetch(WALLET)
      const res = await getPrimaryWallet("tok")
      expect(res.success).toBe(true)
      expect(res.data!.is_primary).toBe(true)
    })
  })

  describe("getWalletBalance", () => {
    it("parses { xlm, usdc } balance", async () => {
      mockFetch({ xlm: "42.0", usdc: "0" })
      const res = await getWalletBalance("GABC...", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.xlm).toBe("42.0")
      expect(res.data!.usdc).toBe("0")
    })
  })

  describe("linkWallet", () => {
    it("parses linked wallet response", async () => {
      mockFetch(WALLET)
      const res = await linkWallet(
        { wallet_address: "GABC...", wallet_type: "freighter" },
        "tok",
      )
      expect(res.success).toBe(true)
      expect(res.data!.wallet_type).toBe("freighter")
    })
  })

  describe("getWalletVerificationChallenge", () => {
    it("parses { challenge } envelope", async () => {
      mockFetch({ challenge: "abc-123" })
      const res = await getWalletVerificationChallenge("GABC...", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.challenge).toBe("abc-123")
    })
  })

  describe("updateWallet", () => {
    it("parses updated wallet", async () => {
      mockFetch({ ...WALLET, label: "updated" })
      const res = await updateWallet("w1", { label: "updated" }, "tok")
      expect(res.success).toBe(true)
      expect(res.data!.label).toBe("updated")
    })
  })

  describe("unlinkWallet", () => {
    it("parses { success: boolean }", async () => {
      mockFetch({ success: true })
      const res = await unlinkWallet("w1", "tok")
      expect(res.success).toBe(true)
      expect(res.data!.success).toBe(true)
    })
  })
})
