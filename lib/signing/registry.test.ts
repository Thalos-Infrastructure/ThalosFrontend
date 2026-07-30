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
  it("resolves the Kit provider for the connected external wallet address", () => {
    globalThis.sessionStorage.setItem(STELLAR_WALLET_KEY, KIT_ADDRESS)
    expect(resolveSigner(KIT_ADDRESS).id).toBe("kit")
  })

  it("prefers the external Kit wallet over the auth-user wallet (useCurrentAddress priority)", () => {
    globalThis.sessionStorage.setItem(STELLAR_WALLET_KEY, KIT_ADDRESS)
    setAuthWallet("accesly")
    expect(resolveSigner().id).toBe("kit")
  })

  it("resolves the accesly provider for the accesly auth wallet", () => {
    setAuthWallet("accesly")
    expect(resolveSigner(AUTH_ADDRESS).id).toBe("accesly")
  })

  it("resolves the social provider for the embedded auth wallet", () => {
    setAuthWallet("embedded")
    expect(resolveSigner(AUTH_ADDRESS).id).toBe("social")
  })

  it("falls back to the active provider for an unknown address (multi-account Kit wallets)", () => {
    globalThis.sessionStorage.setItem(STELLAR_WALLET_KEY, KIT_ADDRESS)
    expect(resolveSigner("GUNKNOWNADDRESS").id).toBe("kit")
  })

  it("throws SignerUnavailableError when no wallet is available", () => {
    expect(() => resolveSigner()).toThrow(SignerUnavailableError)
  })
})
