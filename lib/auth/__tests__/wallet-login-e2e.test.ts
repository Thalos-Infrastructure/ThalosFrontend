/**
 * End-to-end wallet login, exercised through the real Next BFF route handlers:
 *
 *   POST /api/auth/wallet/challenge  ->  wallet signs `message`  ->
 *   POST /api/auth/wallet/verify     ->  app JWT                 ->
 *   authenticated request to Nest with that JWT as a Bearer token
 *
 * No field name is hardcoded twice: the signature is produced from whatever the
 * challenge route actually returns, so a rename on either side fails here. The
 * signing key is a throwaway Stellar keypair (the "raw" scheme the backend
 * helper uses), and Supabase is stubbed — everything else is production code.
 */

import { describe, it, expect, beforeAll, afterEach, vi } from "vitest"

process.env.JWT_SECRET = "e2e-secret-for-wallet-login"

const USER_ID = "11111111-2222-3333-4444-555555555555"

const maybeSingle = vi.fn()
const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }))

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle }) }),
      update,
    }),
  }),
}))

let challengeRoute: typeof import("@/app/api/auth/wallet/challenge/route")
let verifyRoute: typeof import("@/app/api/auth/wallet/verify/route")
let Keypair: typeof import("@stellar/stellar-sdk").Keypair
let verifyToken: typeof import("@/lib/auth/utils").verifyToken
let getLinkedWallets: typeof import("@/lib/api/wallets").getLinkedWallets

beforeAll(async () => {
  challengeRoute = await import("@/app/api/auth/wallet/challenge/route")
  verifyRoute = await import("@/app/api/auth/wallet/verify/route")
  ;({ Keypair } = await import("@stellar/stellar-sdk"))
  ;({ verifyToken } = await import("@/lib/auth/utils"))
  ;({ getLinkedWallets } = await import("@/lib/api/wallets"))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  maybeSingle.mockReset()
  update.mockClear()
})

function post(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

/** Signs the exact bytes of `message`, the way a Stellar wallet does (raw scheme). */
function signAsWallet(keypair: InstanceType<typeof Keypair>, message: string): string {
  return keypair.sign(Buffer.from(message, "utf-8")).toString("base64")
}

async function requestChallenge(address: string) {
  const res = await challengeRoute.POST(post("http://localhost/api/auth/wallet/challenge", { address }))
  expect(res.status).toBe(200)
  return (await res.json()) as { message: string; expires_at: string }
}

describe("wallet login end-to-end (BFF routes)", () => {
  it("logs a known wallet in and mints a JWT a Nest request can carry", async () => {
    const keypair = Keypair.random()
    const address = keypair.publicKey()
    maybeSingle.mockResolvedValue({
      data: { id: USER_ID, email: "wallet@thalos.test", name: null, wallet_public_key: address },
      error: null,
    })

    // 1) Challenge — the wire fields are the canonical ones.
    const challenge = await requestChallenge(address)
    expect(challenge.message).toContain(address)
    expect(Date.parse(challenge.expires_at)).toBeGreaterThan(Date.now())

    // 2) The wallet signs exactly what the route handed us.
    const signature = signAsWallet(keypair, challenge.message)

    // 3) Verify — posted under `message`, as the client now does.
    const verifyRes = await verifyRoute.POST(
      post("http://localhost/api/auth/wallet/verify", {
        address,
        message: challenge.message,
        signature,
        provider: "freighter",
      }),
    )
    expect(verifyRes.status).toBe(200)
    const { user, token } = (await verifyRes.json()) as {
      user: { id: string; wallet: { publicKey: string; provider: string } }
      token: string
    }
    expect(user.id).toBe(USER_ID)
    expect(user.wallet).toEqual({ publicKey: address, provider: "freighter" })

    // 4) The mint payload is what Nest validates: { sub, email }, HS256/JWT_SECRET.
    expect(verifyToken(token)).toEqual({ sub: USER_ID, email: "wallet@thalos.test" })

    // 5) That token authenticates a real Nest call.
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => [] }))
    vi.stubGlobal("fetch", fetchMock)
    await getLinkedWallets(token)
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${token}`)
  })

  it("still accepts `challenge` as a legacy alias for `message`", async () => {
    const keypair = Keypair.random()
    const address = keypair.publicKey()
    maybeSingle.mockResolvedValue({
      data: { id: USER_ID, email: "wallet@thalos.test", name: null, wallet_public_key: address },
      error: null,
    })

    const challenge = await requestChallenge(address)
    const res = await verifyRoute.POST(
      post("http://localhost/api/auth/wallet/verify", {
        address,
        challenge: challenge.message,
        signature: signAsWallet(keypair, challenge.message),
      }),
    )

    expect(res.status).toBe(200)
  })

  it("rejects an expired challenge with 401 challenge_expired, signature notwithstanding", async () => {
    const keypair = Keypair.random()
    const address = keypair.publicKey()
    maybeSingle.mockResolvedValue({ data: null, error: null })

    const challenge = await requestChallenge(address)
    const signature = signAsWallet(keypair, challenge.message)

    // The user left the signing popup open past the TTL.
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.parse(challenge.expires_at) + 1000))

    const res = await verifyRoute.POST(
      post("http://localhost/api/auth/wallet/verify", { address, message: challenge.message, signature }),
    )

    expect(res.status).toBe(401)
    expect((await res.json()).code).toBe("challenge_expired")
    // Never got as far as touching the user table.
    expect(maybeSingle).not.toHaveBeenCalled()
  })

  it("rejects a valid signature from a different wallet", async () => {
    const keypair = Keypair.random()
    const attacker = Keypair.random()
    const address = keypair.publicKey()
    maybeSingle.mockResolvedValue({ data: null, error: null })

    const challenge = await requestChallenge(address)
    const res = await verifyRoute.POST(
      post("http://localhost/api/auth/wallet/verify", {
        address,
        message: challenge.message,
        signature: signAsWallet(attacker, challenge.message),
      }),
    )

    expect(res.status).toBe(401)
    expect((await res.json()).code).toBe("verification_failed")
  })

  it("rejects a body with neither message nor challenge", async () => {
    const res = await verifyRoute.POST(
      post("http://localhost/api/auth/wallet/verify", { address: Keypair.random().publicKey(), signature: "x" }),
    )
    expect(res.status).toBe(400)
  })
})
