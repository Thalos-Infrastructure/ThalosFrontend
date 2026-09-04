import { afterEach, describe, expect, it, vi } from "vitest"
import {
  discoverProfiles,
  type BuilderProfile,
  type ProfilePaginatedResponse,
} from "./profiles"

const builder: BuilderProfile = {
  id: "profile-1",
  wallet_address: "GABC123",
  handle: "stellar-builder",
  display_name: "Stellar Builder",
  avatar_url: "https://example.com/avatar.png",
  headline: "Stellar engineer",
  bio: "I ship payment products.",
  skills: ["Architecture"],
  tech_stack: ["NestJS", "React"],
  hourly_rate: 100,
  availability: "open",
  portfolio_links: { website: "https://example.com/work" },
  social_links: { github: "https://github.com/builder" },
}

const paginatedResponse: ProfilePaginatedResponse<BuilderProfile> = {
  data: [builder],
  total: 1,
  page: 2,
  limit: 5,
  totalPages: 1,
}

describe("profiles discovery API", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("loads builders with the current paginated response contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => paginatedResponse,
    })

    vi.stubGlobal("fetch", fetchMock)

    await expect(
      discoverProfiles(
        {
          skills: ["Architecture"],
          tech_stack: ["React"],
          availability: "open",
          q: "stellar",
          page: 2,
          limit: 5,
        },
        "jwt"
      )
    ).resolves.toEqual({ success: true, data: paginatedResponse })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /\/profiles\?skills=Architecture&tech_stack=React&availability=open&q=stellar&page=2&limit=5$/
      ),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer jwt" }),
      })
    )
  })

  it("omits empty filters from the query string", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => paginatedResponse,
    })

    vi.stubGlobal("fetch", fetchMock)

    await expect(discoverProfiles()).resolves.toEqual({
      success: true,
      data: paginatedResponse,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/profiles$/),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    )
  })
})
