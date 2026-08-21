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

  it("saves both additive profile types through Nest", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ profile: bothTypes }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = await saveProfile(bothTypes, "jwt")

    expect(result).toEqual({ success: true, data: bothTypes })
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/profiles$/), expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify(bothTypes),
      headers: expect.objectContaining({ Authorization: "Bearer jwt" }),
    }))
  })

  it("loads a Builder and Project profile from a bare response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => bothTypes }))
    await expect(getProfile("jwt")).resolves.toEqual({ success: true, data: bothTypes })
  })
})
