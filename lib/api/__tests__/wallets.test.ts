import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/config", () => ({ API_URL: "http://localhost:3001/v1" }))

import {
  getLinkedWallets,
  getPrimaryWallet,
  getWalletBalance,
  getWalletsWithAgreements,
  getWalletsWithBalances,
  getWalletVerificationChallenge,
  linkWallet,
  unlinkWallet,
  updateWallet,
  walletVerificationMessageToSign,
  type UserWallet,
  type WalletWithBalance,
} from "../wallets"

function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status }),
  )
}

const WALLET: UserWallet = {
  id: "w1",
  user_id: "u1",
  wallet_address: "GABC...",
  wallet_type: "freighter",
  label: "main",
  is_primary: true,
  is_verified: true,
  verified_at: "2025-01-01T00:00:00Z",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  auth_provider: "freighter",
  c_address: null,
}

const WALLET_WITH_BALANCE: WalletWithBalance = {
  ...WALLET,
  balance: { xlm: "10.5", usdc: "100" },
  agreements_count: 3,
}

const AGREEMENT_SUMMARY = {
  wallet_address: WALLET.wallet_address,
  wallet_type: WALLET.wallet_type,
  label: WALLET.label,
  agreements: [{
    id: "a1",
    title: "Deal",
    status: "active",
    amount: "500",
    role: "buyer",
    created_at: "2025-01-02T00:00:00Z",
  }],
}

afterEach(() => vi.restoreAllMocks())

describe("Nest wallet response normalization", () => {
  describe("wallet lists", () => {
    it.each([
      { shape: "bare array", body: [WALLET] },
      { shape: "{ wallets } envelope", body: { wallets: [WALLET], error: null } },
    ])("normalizes GET /wallets from a $shape", async ({ body }) => {
      mockFetch(body)

      const result = await getLinkedWallets("token")

      expect(result).toEqual({ success: true, data: [WALLET] })
    })

    it.each([
      { shape: "bare array", body: [WALLET_WITH_BALANCE] },
      {
        shape: "{ wallets } envelope",
        body: { wallets: [WALLET_WITH_BALANCE], error: null },
      },
    ])("normalizes GET /wallets/with-balances from a $shape", async ({ body }) => {
      mockFetch(body)

      const result = await getWalletsWithBalances("token")

      expect(result.success).toBe(true)
      expect(result.data).toEqual([WALLET_WITH_BALANCE])
      expect(result.data?.[0].balance).toEqual({ xlm: "10.5", usdc: "100" })
    })

    it.each([
      { shape: "bare array", body: [AGREEMENT_SUMMARY] },
      {
        shape: "{ wallets } envelope",
        body: { wallets: [AGREEMENT_SUMMARY], error: null },
      },
    ])("normalizes GET /wallets/agreements from a $shape", async ({ body }) => {
      mockFetch(body)

      const result = await getWalletsWithAgreements("token")

      expect(result.success).toBe(true)
      expect(result.data).toEqual([{
        ...AGREEMENT_SUMMARY,
        agreements_count: 1,
      }])
    })

    it("turns an embedded backend error into a failed API response", async () => {
      mockFetch({ wallets: [], error: "wallet query failed" })

      await expect(getLinkedWallets("token")).resolves.toEqual({
        success: false,
        error: "wallet query failed",
      })
    })

    it("rejects malformed wallet rows instead of leaking undefined fields", async () => {
      mockFetch({ wallets: [{ id: "w1" }], error: null })

      await expect(getLinkedWallets("token")).resolves.toEqual({
        success: false,
        error: "Invalid wallet list response",
      })
    })
  })

  describe("single-resource envelopes", () => {
    it("unwraps GET /wallets/primary from { wallet }", async () => {
      mockFetch({ wallet: WALLET })

      await expect(getPrimaryWallet("token")).resolves.toEqual({
        success: true,
        data: WALLET,
      })
    })

    it("preserves a null primary wallet", async () => {
      mockFetch({ wallet: null })

      await expect(getPrimaryWallet("token")).resolves.toEqual({
        success: true,
        data: null,
      })
    })

    it.each([
      { shape: "bare balance", body: { xlm: "42.0", usdc: "7.5" } },
      {
        shape: "{ balance } envelope",
        body: { balance: { xlm: "42.0", usdc: "7.5" } },
      },
    ])("normalizes GET /wallets/:address/balance from a $shape", async ({ body }) => {
      mockFetch(body)

      await expect(getWalletBalance("GABC...", "token")).resolves.toEqual({
        success: true,
        data: { xlm: "42.0", usdc: "7.5" },
      })
    })

    it("unwraps POST /wallets from { wallet, error }", async () => {
      mockFetch({ wallet: WALLET, error: null })

      await expect(linkWallet({
        wallet_address: WALLET.wallet_address,
        wallet_type: "freighter",
        signed_message: "challenge",
        signature: "signature",
      }, "token")).resolves.toEqual({ success: true, data: WALLET })
    })

    it("unwraps PATCH /wallets/:id from { wallet, error }", async () => {
      const updated = { ...WALLET, label: "updated" }
      mockFetch({ wallet: updated, error: null })

      await expect(updateWallet("w1", { label: "updated" }, "token"))
        .resolves.toEqual({ success: true, data: updated })
    })

    it("normalizes a successful DELETE /wallets/:id payload", async () => {
      mockFetch({ success: true, error: null })

      await expect(unlinkWallet("w1", "token")).resolves.toEqual({
        success: true,
        data: { success: true },
      })
    })
  })

  describe("verification challenge", () => {
    it("parses the documented { challenge } payload", async () => {
      mockFetch({ challenge: "challenge-text" })

      await expect(getWalletVerificationChallenge("GABC...", "token"))
        .resolves.toEqual({
          success: true,
          data: { challenge: "challenge-text" },
        })
    })

    it("maps the current Nest { message, expires_at } payload to the canonical shape", async () => {
      mockFetch({
        message: "signed-message",
        expires_at: "2026-08-24T12:05:00.000Z",
      })

      await expect(getWalletVerificationChallenge("GABC...", "token"))
        .resolves.toEqual({
          success: true,
          data: {
            challenge: "signed-message",
            expires_at: "2026-08-24T12:05:00.000Z",
          },
        })
    })

    it("prepares the exact Nest challenge body for SEP-53 signing", () => {
      const challenge = [
        "Stellar Signed Message:",
        "Thalos Wallet Ownership Proof",
        "",
        "I authorize linking this wallet to my Thalos account.",
        "Wallet: GABC...",
        "Expires At: 2026-08-24T12:05:00.000Z",
        "",
        "Proof: payload.signature",
      ].join("\n")

      expect(walletVerificationMessageToSign(challenge)).toBe([
        "Thalos Wallet Ownership Proof",
        "",
        "I authorize linking this wallet to my Thalos account.",
        "Wallet: GABC...",
        "Expires At: 2026-08-24T12:05:00.000Z",
      ].join("\n"))
    })

    it("leaves an unframed challenge body unchanged", () => {
      expect(walletVerificationMessageToSign("challenge-text"))
        .toBe("challenge-text")
    })
  })
})
