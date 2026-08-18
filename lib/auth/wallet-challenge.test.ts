/**
 * The challenge crosses three boundaries (Next BFF -> browser -> Nest), so the
 * thing worth pinning is the wire contract itself: the canonical field names
 * (`message` + `expires_at`, GF-8 #142) and that expiry is reported as such
 * rather than as a generic verification failure.
 */

import { describe, it, expect, beforeAll } from "vitest"

const ADDRESS = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7"
const OTHER_ADDRESS = "GDNRXSPCHNU2LGJHKZBPMSWFJHCSKAFTXRXA7NGDN6MOJTMPY3TZUEXW"

let mod: typeof import("./wallet-challenge")

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret-for-wallet-challenge"
  mod = await import("./wallet-challenge")
})

describe("buildWalletChallenge", () => {
  it("returns the canonical { message, expires_at } shape", () => {
    const challenge = mod.buildWalletChallenge(ADDRESS)

    expect(Object.keys(challenge).sort()).toEqual(["expires_at", "message"])
    expect(challenge.message).toContain(ADDRESS)
    expect(challenge.message).toMatch(/^Proof: /m)
    expect(Number.isFinite(Date.parse(challenge.expires_at))).toBe(true)
    expect(challenge.expires_at).toBe(new Date(challenge.expires_at).toISOString())
  })

  it("advertises an expiry in the future and states it inside the signed message", () => {
    const { message, expires_at } = mod.buildWalletChallenge(ADDRESS)

    expect(Date.parse(expires_at)).toBeGreaterThan(Date.now())
    // The user sees the same instant they are signing.
    expect(message).toContain(`Expira: ${expires_at}`)
  })

  it("issues a fresh nonce per call", () => {
    const a = mod.buildWalletChallenge(ADDRESS)
    const b = mod.buildWalletChallenge(ADDRESS)
    expect(a.message).not.toBe(b.message)
  })
})

describe("verifyWalletChallenge", () => {
  it("accepts the message it issued for that address", () => {
    const { message } = mod.buildWalletChallenge(ADDRESS)
    expect(mod.verifyWalletChallenge(message, ADDRESS).addr).toBe(ADDRESS)
  })

  it("rejects a message issued for a different address", () => {
    const { message } = mod.buildWalletChallenge(ADDRESS)
    expect(() => mod.verifyWalletChallenge(message, OTHER_ADDRESS)).toThrow()
  })

  it("rejects a tampered proof", () => {
    const { message } = mod.buildWalletChallenge(ADDRESS)
    const tampered = message.replace(/^Proof: (.)/m, (_m, c) => `Proof: ${c === "a" ? "b" : "a"}`)
    expect(() => mod.verifyWalletChallenge(tampered, ADDRESS)).toThrow(/Proof inválido/)
  })

  it("reports an expired challenge with the challenge_expired code", () => {
    const { message } = mod.buildWalletChallenge(ADDRESS)
    const realNow = Date.now
    // 10 minutes on: past the 5-minute TTL.
    Date.now = () => realNow() + 10 * 60 * 1000
    try {
      expect(() => mod.verifyWalletChallenge(message, ADDRESS)).toThrow(mod.WalletChallengeExpiredError)
      try {
        mod.verifyWalletChallenge(message, ADDRESS)
      } catch (e) {
        expect((e as InstanceType<typeof mod.WalletChallengeExpiredError>).code).toBe("challenge_expired")
      }
    } finally {
      Date.now = realNow
    }
  })
})
