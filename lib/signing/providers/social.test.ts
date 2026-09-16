import { beforeEach, describe, expect, it, vi } from "vitest"

const signTx = vi.fn()

vi.mock("@/lib/pollar-client", () => ({
  getPollarClient: () => ({ signTx }),
  clearPollarClient: vi.fn(),
}))

import { socialSigner } from "./social"
import { SignerUnavailableError } from "../types"

const ADDRESS = "GEMBEDDEDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
const OTHER_ADDRESS = "GOTHERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
const PASSPHRASE = "Test SDF Network ; September 2015"

function makeStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size
    },
  } as Storage
}

function setAuthWallet(provider: string, publicKey = ADDRESS) {
  globalThis.localStorage.setItem(
    "auth_user",
    JSON.stringify({ id: "u1", email: "u1@test", wallet: { publicKey, provider } }),
  )
}

beforeEach(() => {
  signTx.mockReset()
  vi.stubGlobal("window", {})
  vi.stubGlobal("localStorage", makeStorage())
})

describe("socialSigner session resolution", () => {
  it("is active and owns the address for an embedded wallet", () => {
    setAuthWallet("embedded")
    expect(socialSigner.isActive()).toBe(true)
    expect(socialSigner.ownsAddress(ADDRESS)).toBe(true)
    expect(socialSigner.ownsAddress(OTHER_ADDRESS)).toBe(false)
  })

  it("ignores an Accesly wallet, which belongs to its own provider (#109)", () => {
    setAuthWallet("accesly")
    expect(socialSigner.isActive()).toBe(false)
    expect(socialSigner.ownsAddress(ADDRESS)).toBe(false)
  })

  it("is inactive with no logged-in user", () => {
    expect(socialSigner.isActive()).toBe(false)
  })
})

describe("socialSigner.signTransaction", () => {
  it("returns the signed XDR Pollar produced", async () => {
    setAuthWallet("embedded")
    signTx.mockResolvedValue({ status: "signed", signedXdr: "SIGNED_XDR" })

    await expect(
      socialSigner.signTransaction("UNSIGNED", { networkPassphrase: PASSPHRASE, address: ADDRESS }),
    ).resolves.toEqual({ signedTxXdr: "SIGNED_XDR" })

    expect(signTx).toHaveBeenCalledWith("UNSIGNED")
  })

  it("surfaces Pollar's own failure detail", async () => {
    setAuthWallet("embedded")
    signTx.mockResolvedValue({ status: "error", message: "sponsorship disabled" })

    await expect(
      socialSigner.signTransaction("UNSIGNED", { networkPassphrase: PASSPHRASE }),
    ).rejects.toThrow(/sponsorship disabled/)
  })

  it("refuses to sign for an address the session does not own", async () => {
    setAuthWallet("embedded")

    await expect(
      socialSigner.signTransaction("UNSIGNED", {
        networkPassphrase: PASSPHRASE,
        address: OTHER_ADDRESS,
      }),
    ).rejects.toBeInstanceOf(SignerUnavailableError)

    expect(signTx).not.toHaveBeenCalled()
  })

  it("fails cleanly when nobody is logged in", async () => {
    await expect(
      socialSigner.signTransaction("UNSIGNED", { networkPassphrase: PASSPHRASE }),
    ).rejects.toBeInstanceOf(SignerUnavailableError)

    expect(signTx).not.toHaveBeenCalled()
  })
})

describe("socialSigner.signMessage", () => {
  // Not a gap: Pollar exposes no arbitrary Stellar message signing for custodial
  // wallets, and the flow that needed it (wallet-ownership challenge) is replaced
  // by server-side session validation in app/api/auth/pollar/route.ts.
  it("always fails with an actionable message", async () => {
    setAuthWallet("embedded")
    await expect(socialSigner.signMessage("challenge", ADDRESS)).rejects.toBeInstanceOf(
      SignerUnavailableError,
    )
  })
})
