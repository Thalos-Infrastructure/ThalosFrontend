import { describe, expect, it } from "vitest"
import { isAcceslyBackedUser, shouldCloseAcceslySession } from "./session-coherence"
import type { AuthUser } from "@/lib/auth/types"

const G = "GCIQLYVY7QA7NASMJDNH27UQANK6Q5E2IT6QZLXCKDIYGC3YAB7P5SC4"

function userWith(provider: string): AuthUser {
  return {
    id: "u1",
    email: "u1@test",
    name: null,
    avatarUrl: null,
    wallet: { publicKey: G, provider },
  }
}

describe("shouldCloseAcceslySession", () => {
  it("closes the Accesly session when an accesly-backed Thalos session logs out", () => {
    expect(
      shouldCloseAcceslySession({
        hydrated: true,
        hadAcceslyUser: true,
        user: null,
        acceslyStatus: "authenticated",
      }),
    ).toBe(true)
  })

  it("never fires during the login flow (Cognito authenticated but no Thalos user YET, no previous accesly user)", () => {
    expect(
      shouldCloseAcceslySession({
        hydrated: true,
        hadAcceslyUser: false,
        user: null,
        acceslyStatus: "authenticated",
      }),
    ).toBe(false)
  })

  it("does nothing while the accesly-backed session is still active", () => {
    expect(
      shouldCloseAcceslySession({
        hydrated: true,
        hadAcceslyUser: true,
        user: userWith("accesly"),
        acceslyStatus: "authenticated",
      }),
    ).toBe(false)
  })

  it("does nothing when logging out of a Freighter/Kit or embedded session", () => {
    expect(
      shouldCloseAcceslySession({
        hydrated: true,
        hadAcceslyUser: false,
        user: null,
        acceslyStatus: "anonymous",
      }),
    ).toBe(false)
  })

  it("does nothing when the Accesly session is already gone or expired", () => {
    for (const acceslyStatus of ["anonymous", "expired"] as const) {
      expect(
        shouldCloseAcceslySession({
          hydrated: true,
          hadAcceslyUser: true,
          user: null,
          acceslyStatus,
        }),
      ).toBe(false)
    }
  })

  it("waits for the auth store to hydrate before deciding (no false logout on page load)", () => {
    expect(
      shouldCloseAcceslySession({
        hydrated: false,
        hadAcceslyUser: true,
        user: null,
        acceslyStatus: "authenticated",
      }),
    ).toBe(false)
  })
})

describe("isAcceslyBackedUser", () => {
  it("detects accesly-backed users", () => {
    expect(isAcceslyBackedUser(userWith("accesly"))).toBe(true)
  })

  it("rejects embedded/kit users and logged-out state", () => {
    expect(isAcceslyBackedUser(userWith("embedded"))).toBe(false)
    expect(isAcceslyBackedUser(userWith("freighter"))).toBe(false)
    expect(isAcceslyBackedUser(null)).toBe(false)
  })
})
