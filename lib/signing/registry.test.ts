import { beforeEach, describe, expect, it, vi } from "vitest"

// The Kit provider pulls the Stellar Wallets Kit (browser-only) — stub it.
vi.mock("@/lib/stellar-wallet-kit", () => ({
  getKit: vi.fn(),
  clearKit: vi.fn(),
  isFreighterAvailable: vi.fn(() => false),
}))

import { resolveSigner } from "./registry"
import { SignerUnavailableError } from "./types"
import { STELLAR_WALLET_KEY } from "./session"

const KIT_ADDRESS = "GKITAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKIT"
const AUTH_ADDRESS = "GAUTHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUTH"

function makeStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    get length() {
      return map.size
    },
  } as Storage
}

function setAuthWallet(provider: string) {
  globalThis.localStorage.setItem(
    "auth_user",
    JSON.stringify({
      id: "u1",
      email: "u1@test",
      wallet: { publicKey: AUTH_ADDRESS, provider },
    }),
  )
}

beforeEach(() => {
  vi.stubGlobal("window", {})
  vi.stubGlobal("sessionStorage", makeStorage())
  vi.stubGlobal("localStorage", makeStorage())
})

describe("resolveSigner", () => {
  it("reaches a side-connected wallet only when named, for ownership proofs", () => {
    // Linking a second wallet in /profile needs THAT wallet to sign a
    // challenge, so asking for its address by name must resolve to it.
    globalThis.sessionStorage.setItem(STELLAR_WALLET_KEY, KIT_ADDRESS)
    expect(resolveSigner(KIT_ADDRESS).id).toBe("kit")
  })

  it("never lets a side-connected wallet sign an escrow", async () => {
    // The proof it can produce is a message signature. Signing a transaction
    // with it would create the escrow under an address the account never
    // authenticated as — the bug this arrangement replaced.
    globalThis.sessionStorage.setItem(STELLAR_WALLET_KEY, KIT_ADDRESS)
    const signer = resolveSigner(KIT_ADDRESS)
    await expect(
      signer.signTransaction("XDR", { networkPassphrase: "Test SDF Network ; September 2015" }),
    ).rejects.toThrow(SignerUnavailableError)
  })

  it("signs with the session's wallet even when another is connected on the side", () => {
    globalThis.sessionStorage.setItem(STELLAR_WALLET_KEY, KIT_ADDRESS)
    setAuthWallet("accesly")
    expect(resolveSigner().id).toBe("accesly")
  })

  it("resolves the accesly provider for the accesly auth wallet", () => {
    setAuthWallet("accesly")
    expect(resolveSigner(AUTH_ADDRESS).id).toBe("accesly")
  })

  it("resolves the social provider for the embedded auth wallet", () => {
    setAuthWallet("embedded")
    expect(resolveSigner(AUTH_ADDRESS).id).toBe("social")
  })

  it("falls back to the active provider for an unknown address (multi-account wallets)", () => {
    setAuthWallet("embedded")
    expect(resolveSigner("GUNKNOWNADDRESS").id).toBe("social")
  })

  it("throws SignerUnavailableError when no wallet is available", () => {
    expect(() => resolveSigner()).toThrow(SignerUnavailableError)
  })
})
