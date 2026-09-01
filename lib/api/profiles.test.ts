import { afterEach, describe, expect, it, vi } from "vitest"
import { getProfile, saveProfile, type ConnectProfile } from "./profiles"

const bothTypes: ConnectProfile = {
  profile_types: ["builder", "project"],
  headline: "Stellar engineer",
  bio: "I ship payment products.",
  skills: ["Architecture"],
  tech_stack: ["NestJS", "React"],
  hourly_rate: 100,
  availability: "20 hours/week",
  portfolio_links: ["https://example.com/work"],
  social_links: ["https://github.com/builder"],
  handle: "stellar-builder",
  org_name: "Thalos Labs",
  org_description: "Safer project payments.",
  org_website: "https://thalos.example",
  looking_for: ["Designers"],
  org_links: ["https://github.com/thalos"],
}

describe("profiles API", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("loads the authenticated editor profile from /profiles/me", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => bothTypes,
    })

    vi.stubGlobal("fetch", fetchMock)

    await expect(getProfile("jwt")).resolves.toEqual({ success: true, data: bothTypes })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/profiles\/me$/),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer jwt" }),
      })
    )
  })

  it("saves both additive profile types through Nest", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ profile: bothTypes }),
    })

    vi.stubGlobal("fetch", fetchMock)

    const result = await saveProfile(bothTypes, "jwt")

    expect(result).toEqual({ success: true, data: bothTypes })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/profiles$/),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(bothTypes),
        headers: expect.objectContaining({ Authorization: "Bearer jwt" }),
      })
    )
  })

  it("unwraps the { profile } envelope on load and save", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ profile: bothTypes }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ profile: bothTypes }) })

    vi.stubGlobal("fetch", fetchMock)

    await expect(getProfile("jwt")).resolves.toEqual({ success: true, data: bothTypes })
    await expect(saveProfile(bothTypes, "jwt")).resolves.toEqual({ success: true, data: bothTypes })
  })
})
