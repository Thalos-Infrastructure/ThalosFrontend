import { describe, it, expect, vi, afterEach } from "vitest"

import { requestWalletChallenge, verifyWalletLogin } from "../wallet-auth"

function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  )
}

afterEach(() => vi.restoreAllMocks())

describe("wallet-auth contract", () => {
  describe("requestWalletChallenge", () => {
    it("returns { challenge, expiresAt } on success", async () => {
      mockFetch({ challenge: "abc-123-def", expiresAt: "2025-12-31T23:59:59Z" })
      const result = await requestWalletChallenge("GABC...")
      expect(result.challenge).toBe("abc-123-def")
      expect(result.expiresAt).toBe("2025-12-31T23:59:59Z")
    })

    it("throws on non-200 response", async () => {
      mockFetch({ error: "invalid address" }, 400)
      await expect(requestWalletChallenge("bad")).rejects.toThrow("invalid address")
    })

    it("throws default message on empty error body", async () => {
      mockFetch({}, 500)
      await expect(requestWalletChallenge("GABC...")).rejects.toThrow(
        "No se pudo obtener el challenge de la wallet",
      )
    })

    it("drift test: missing challenge key causes undefined", async () => {
      mockFetch({ token: "abc" })
      const result = await requestWalletChallenge("GABC...")
      expect(result.challenge).toBeUndefined()
      expect(result.expiresAt).toBeUndefined()
    })
  })

  describe("verifyWalletLogin", () => {
    it("returns { user, token } on success", async () => {
      mockFetch({
        user: {
          id: "u1",
          email: "test@example.com",
          name: "Test",
          avatarUrl: null,
          wallet: { publicKey: "GABC...", provider: "freighter" },
        },
        token: "jwt-token-123",
      })
      const result = await verifyWalletLogin("GABC...", "challenge", "sig")
      expect(result.token).toBe("jwt-token-123")
      expect(result.user.id).toBe("u1")
      expect(result.user.email).toBe("test@example.com")
      expect(result.user.wallet?.publicKey).toBe("GABC...")
      expect(result.user.wallet?.provider).toBe("freighter")
    })

    it("throws on verification failure", async () => {
      mockFetch({ error: "invalid signature" }, 401)
      await expect(
        verifyWalletLogin("GABC...", "challenge", "bad-sig"),
      ).rejects.toThrow("invalid signature")
    })

    it("throws default message on empty error", async () => {
      mockFetch({}, 500)
      await expect(
        verifyWalletLogin("GABC...", "challenge", "sig"),
      ).rejects.toThrow("No se pudo verificar la firma de la wallet")
    })

    it("sends provider field when provided", async () => {
      mockFetch({
        user: { id: "u1", email: "a@b.com", name: null, avatarUrl: null, wallet: null },
        token: "jwt",
      })
      const fetchSpy = vi.spyOn(globalThis, "fetch")
      await verifyWalletLogin("G...", "ch", "sig", "accesly")
      const init = fetchSpy.mock.calls[0][1] as RequestInit
      const body = JSON.parse(init.body as string)
      expect(body.provider).toBe("accesly")
    })
  })
})
