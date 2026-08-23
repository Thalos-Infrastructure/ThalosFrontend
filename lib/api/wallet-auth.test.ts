/**
 * The bug this guards against: the client used to read `.challenge` from a
 * payload that actually carries `.message` (+ `expires_at`), so every wallet
 * login signed `undefined` (GF-8, #142). These tests pin the field names on
 * both the read and the write side, plus the expired-challenge path.
 */

import { describe, it, expect, vi, afterEach } from "vitest"
import {
  isChallengeExpired,
  requestWalletChallenge,
  verifyWalletLogin,
  WalletChallengeExpired,
} from "./wallet-auth"

const ADDRESS = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7"

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }))
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

function inMinutes(n: number) {
  return new Date(Date.now() + n * 60_000).toISOString()
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("isChallengeExpired", () => {
  it("is false for a future expiry and true for a past one", () => {
    expect(isChallengeExpired(inMinutes(5))).toBe(false)
    expect(isChallengeExpired(inMinutes(-1))).toBe(true)
  })

  it("defers to the server when expires_at is missing or unparseable", () => {
    expect(isChallengeExpired(undefined)).toBe(false)
    expect(isChallengeExpired("not-a-date")).toBe(false)
  })
})

describe("requestWalletChallenge", () => {
  it("returns the message and expires_at from the payload", async () => {
    const expires_at = inMinutes(5)
    const fetchMock = mockFetch(200, { message: "sign me", expires_at })

    const challenge = await requestWalletChallenge(ADDRESS)

    expect(challenge).toEqual({ message: "sign me", expires_at })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({ address: ADDRESS })
  })

  it("fails loudly when the payload has no message (instead of signing undefined)", async () => {
    mockFetch(200, { challenge: "legacy field", expires_at: inMinutes(5) })
    await expect(requestWalletChallenge(ADDRESS)).rejects.toThrow(/message/)
  })

  it("fails loudly when the payload has no expires_at", async () => {
    mockFetch(200, { message: "sign me" })
    await expect(requestWalletChallenge(ADDRESS)).rejects.toThrow(/expires_at/)
  })

  it("rejects a challenge that is already expired on arrival", async () => {
    mockFetch(200, { message: "sign me", expires_at: inMinutes(-1) })
    await expect(requestWalletChallenge(ADDRESS)).rejects.toBeInstanceOf(WalletChallengeExpired)
  })

  it("surfaces the server error on a failed request", async () => {
    mockFetch(400, { error: "Dirección de wallet Stellar inválida" })
    await expect(requestWalletChallenge("nope")).rejects.toThrow(/inválida/)
  })
})

describe("verifyWalletLogin", () => {
  it("posts the signed message under the `message` field", async () => {
    const fetchMock = mockFetch(200, { user: { id: "u1" }, token: "jwt" })

    const result = await verifyWalletLogin(ADDRESS, "sign me", "sig", "freighter")

    expect(result.token).toBe("jwt")
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({
      address: ADDRESS,
      message: "sign me",
      signature: "sig",
      provider: "freighter",
    })
  })

  it("maps the challenge_expired code to a typed error the caller can retry on", async () => {
    mockFetch(401, { error: "El challenge expiró, volvé a intentar", code: "challenge_expired" })
    await expect(verifyWalletLogin(ADDRESS, "sign me", "sig")).rejects.toBeInstanceOf(WalletChallengeExpired)
  })

  it("throws a plain error for other verification failures", async () => {
    mockFetch(401, { error: "Firma Stellar inválida", code: "verification_failed" })
    const err = await verifyWalletLogin(ADDRESS, "sign me", "bad").catch((e) => e)
    expect(err).toBeInstanceOf(Error)
    expect(err).not.toBeInstanceOf(WalletChallengeExpired)
    expect(err.message).toMatch(/Firma Stellar inválida/)
  })
})
