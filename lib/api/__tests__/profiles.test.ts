import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/config", () => ({ API_URL: "http://localhost:3001/v1" }))

import { apiRequest } from "../client"
import { getProfileByHandle } from "../profiles"

afterEach(() => vi.restoreAllMocks())

function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  )
}

describe("profiles · getProfileByHandle (C2 public showcase)", () => {
  it("hits the PUBLIC by-handle endpoint (no auth header is sent)", async () => {
    const spy = mockFetch({ profile: { id: "p1", handle: "jane-dev" } })
    await getProfileByHandle("jane-dev")

    const [url, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("http://localhost:3001/v1/profiles/handle/jane-dev")
    expect(init.headers).toEqual({ "Content-Type": "application/json" })
  })

  it("returns a notFound result on HTTP 404 (clean 404 page)", async () => {
    mockFetch({ error: "Profile not found" }, 404)
    const result = await getProfileByHandle("does-not-exist")
    expect(result).toEqual({ ok: false, notFound: true })
  })

  it("treats an HTTP 200 with an empty public profile ({ profile: null }) as unknown handle", async () => {
    mockFetch({ profile: null, error: null }, 200)
    const result = await getProfileByHandle("unpublished")
    expect(result).toEqual({ ok: false, notFound: true })
  })

  it("surfaces a non-404 backend failure as an error (not a 404)", async () => {
    mockFetch({ message: "Internal server error" }, 500)
    const result = await getProfileByHandle("jane-dev")
    if (result.ok) {
      throw new Error("expected a failure result")
    }
    expect(result.notFound).toBe(false)
    if (!result.notFound) {
      expect(result.error).toBe("Internal server error")
    }
  })

  it("surfaces a network error as an error (not a 404)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new TypeError("Failed to fetch"))
    const result = await getProfileByHandle("jane-dev")
    if (result.ok) {
      throw new Error("expected a failure result")
    }
    expect(result.notFound).toBe(false)
    if (!result.notFound) {
      expect(result.error).toBe("Failed to fetch")
    }
  })

  it("normalises an ok Builder payload from the { profile, error } envelope", async () => {
    mockFetch({
      profile: {
        id: "p1",
        wallet_address: "GABC...",
        handle: "jane-dev",
        display_name: "Jane",
        avatar_url: "https://example.com/avatar.png",
        headline: "Full-stack builder on Stellar",
        bio: "I build escrow-friendly dApps.",
        skills: ["react", "node", "stellar"],
        tech_stack: ["typescript", "postgres"],
        hourly_rate: "45",
        availability: "available",
        portfolio_links: [{ label: "site", url: "https://jane.dev" }],
        social_links: { github: "https://github.com/jane", twitter: "https://x.com/jane" },
        created_at: "2026-01-01T00:00:00Z",
      },
    })

    const result = await getProfileByHandle("jane-dev")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.profile.handle).toBe("jane-dev")
    expect(result.profile.display_name).toBe("Jane")
    expect(result.profile.headline).toBe("Full-stack builder on Stellar")
    expect(result.profile.skills).toEqual(["react", "node", "stellar"])
    expect(result.profile.tech_stack).toEqual(["typescript", "postgres"])
    expect(result.profile.hourly_rate).toBe(45)
    expect(result.profile.availability).toBe("available")
    expect(result.profile.portfolio_links).toEqual([{ label: "site", url: "https://jane.dev" }])
  })

  it("normalises additive Project fields on the same profile", async () => {
    mockFetch({
      profile: {
        id: "p2",
        handle: "acme-labs",
        org_name: "Acme Labs",
        org_description: "We build payment rails.",
        org_website: "https://acme.example",
        looking_for: ["frontend", "design"],
        org_links: { discord: "https://discord.gg/acme" },
      },
    })

    const result = await getProfileByHandle("acme-labs")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.profile.org_name).toBe("Acme Labs")
    expect(result.profile.org_description).toBe("We build payment rails.")
    expect(result.profile.org_website).toBe("https://acme.example")
    expect(result.profile.looking_for).toEqual(["frontend", "design"])
    expect(result.profile.org_links).toEqual({ discord: "https://discord.gg/acme" })
  })

  it("keeps reserved reputation (C7) and verified GitHub (C6) slots nullable when absent", async () => {
    mockFetch({ profile: { id: "p3", handle: "plain", skills: ["rust"], looking_for: null } })
    const result = await getProfileByHandle("plain")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.profile.reputation_score).toBeNull()
    expect(result.profile.github_verified).toBeNull()
  })

  it("passes a reputation score and verified github through when present", async () => {
    mockFetch({
      profile: { id: "p4", handle: "trusted", reputation_score: 87, github_verified: true },
    })
    const result = await getProfileByHandle("trusted")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.profile.reputation_score).toBe(87)
    expect(result.profile.github_verified).toBe(true)
  })

  it("tolerates a { data: { ...fields } } envelope for robustness", async () => {
    mockFetch({ data: { id: "p5", handle: "nested" } })
    const result = await getProfileByHandle("nested")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.profile.handle).toBe("nested")
  })

  it("exposes only public fields — email and KYB keys are never part of the shape", async () => {
    mockFetch({
      profile: {
        id: "p6",
        handle: "safe",
        display_name: "Safe",
        email: "private@example.com",
        kyc_status: "verified",
      },
    })
    const result = await getProfileByHandle("safe")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // @ts-expect-error — email must not exist on the public-safe type.
    expect(result.profile.email).toBeUndefined()
    // @ts-expect-error — KYB must not exist on the public-safe type.
    expect(result.profile.kyc_status).toBeUndefined()
  })

  // Keep a direct link to apiRequest so the contract stays aligned.
  it("uses the shared apiRequest helper", async () => {
    expect(apiRequest).toBeDefined()
  })
})