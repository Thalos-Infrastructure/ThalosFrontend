import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createLendaraSessionApi, verifyLendaraSessionApi } from "./ramps"

const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

const bodyOf = (call: number) =>
  JSON.parse((fetchMock.mock.calls[call] as [string, RequestInit])[1].body as string) as Record<
    string,
    unknown
  >

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("createLendaraSessionApi", () => {
  it("sends the agreement and never a destination wallet", async () => {
    // The backend derives where the money goes. If the browser could name it,
    // a tampered request would redirect someone else's payment.
    fetchMock.mockResolvedValue(
      jsonResponse({ session: { id: "s1", url: "https://lendara/s1", account: "GDEST" } }),
    )

    await createLendaraSessionApi(
      { agreementId: "a1", fiatCurrency: "ARS", amount: "25000" },
      "jwt",
    )

    const body = bodyOf(0)
    expect(body).toEqual({ agreement_id: "a1", fiat_currency: "ARS", amount: "25000" })
    expect(Object.keys(body)).not.toContain("account")
    expect(Object.keys(body)).not.toContain("wallet")
  })

  it("returns the session when the backend provides one", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ session: { id: "s1", url: "https://lendara/s1", account: "GDEST" } }),
    )

    const result = await createLendaraSessionApi(
      { agreementId: "a1", fiatCurrency: "CLP", amount: "1000" },
      "jwt",
    )

    expect(result.data).toMatchObject({ id: "s1", url: "https://lendara/s1" })
  })

  it("fails when the backend answers without a session", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))

    await expect(
      createLendaraSessionApi({ agreementId: "a1", fiatCurrency: "ARS", amount: "1" }, "jwt"),
    ).resolves.toMatchObject({ success: false })
  })

  it("surfaces the backend's refusal", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: "Only the wallet funding this agreement can buy USDC for it" }, 403),
    )

    const result = await createLendaraSessionApi(
      { agreementId: "a1", fiatCurrency: "ARS", amount: "1" },
      "jwt",
    )

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Only the wallet funding/)
  })
})

describe("verifyLendaraSessionApi", () => {
  it("asks the backend to confirm, sending the session and not a wallet", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ verified: true, stellarTransactionId: "abc", usableForEscrow: true }),
    )

    await verifyLendaraSessionApi({ agreementId: "a1", sessionId: "s1" }, "jwt")

    expect(bodyOf(0)).toEqual({ agreement_id: "a1", session_id: "s1" })
  })

  it("keeps 'arrived' and 'usable for the escrow' apart", async () => {
    // Sandbox USDC reaches the wallet but is a different asset than the one
    // the escrows hold; collapsing the two would promise a funding that fails.
    fetchMock.mockResolvedValue(
      jsonResponse({ verified: true, stellarTransactionId: "abc", usableForEscrow: false }),
    )

    const result = await verifyLendaraSessionApi({ agreementId: "a1", sessionId: "s1" }, "jwt")

    expect(result.data).toMatchObject({ verified: true, usableForEscrow: false })
  })

  it("passes through an unverified result with its reason", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ verified: false, reason: "The deposit went to a different wallet" }),
    )

    const result = await verifyLendaraSessionApi({ agreementId: "a1", sessionId: "s1" }, "jwt")

    expect(result.data).toMatchObject({
      verified: false,
      reason: "The deposit went to a different wallet",
    })
  })
})
