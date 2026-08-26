import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/config", () => ({ API_URL: "http://localhost:3001/v1" }))

import {
  getGithubLinkStatus,
  startGithubVerification,
  listProjectPullRequests,
  getAttachedPullRequests,
  attachPullRequests,
  type GithubPullRequest,
} from "../github"

function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status }),
  )
}

const PR: GithubPullRequest = {
  repo: "Thalos-Infrastructure/ThalosFrontend",
  number: 128,
  title: "C6 FE — GitHub-backed milestone evidence",
  url: "https://github.com/Thalos-Infrastructure/ThalosFrontend/pull/128",
  merged_at: "2026-08-20T12:00:00.000Z",
}

afterEach(() => vi.restoreAllMocks())

describe("github evidence contract", () => {
  describe("getGithubLinkStatus", () => {
    it("reports a verified link", async () => {
      mockFetch({ linked: true, github_username: "fabi", github_verified_at: "2026-08-20T00:00:00Z" })
      const res = await getGithubLinkStatus("tok")
      expect(res.success).toBe(true)
      expect(res.data!.linked).toBe(true)
      expect(res.data!.github_username).toBe("fabi")
    })

    it("treats a present username as linked even if `linked` is absent", async () => {
      mockFetch({ github_username: "fabi", github_verified_at: "2026-08-20T00:00:00Z" })
      const res = await getGithubLinkStatus("tok")
      expect(res.data!.linked).toBe(true)
    })

    it("reports an unlinked account", async () => {
      mockFetch({ linked: false, github_username: null, github_verified_at: null })
      const res = await getGithubLinkStatus("tok")
      expect(res.data!.linked).toBe(false)
      expect(res.data!.github_username).toBeNull()
    })
  })

  describe("startGithubVerification", () => {
    it("returns the authorize URL and posts to the start route", async () => {
      const spy = mockFetch({ authorize_url: "https://github.com/login/oauth/authorize?x=1" })
      const res = await startGithubVerification("tok")
      expect(res.success).toBe(true)
      expect(res.data!.authorize_url).toContain("github.com/login/oauth")
      const [url, init] = spy.mock.calls[0]
      expect(url).toBe("http://localhost:3001/v1/github/link/start")
      expect((init as RequestInit).method).toBe("POST")
    })

    it("errors when no URL is returned", async () => {
      mockFetch({})
      const res = await startGithubVerification("tok")
      expect(res.success).toBe(false)
    })
  })

  describe("listProjectPullRequests", () => {
    it("hits the agreement-scoped route and parses the list", async () => {
      const spy = mockFetch({ pull_requests: [PR] })
      const res = await listProjectPullRequests("agr-1", "tok")
      expect(res.success).toBe(true)
      expect(res.data).toHaveLength(1)
      expect(res.data![0].repo).toBe("Thalos-Infrastructure/ThalosFrontend")
      expect(spy.mock.calls[0][0]).toBe(
        "http://localhost:3001/v1/agreements/agr-1/github/pull-requests",
      )
    })

    it("defaults to an empty list", async () => {
      mockFetch({})
      const res = await listProjectPullRequests("agr-1", "tok")
      expect(res.data).toEqual([])
    })

    it("surfaces a payload error (e.g. rate limit)", async () => {
      mockFetch({ error: "GitHub rate limit exceeded" })
      const res = await listProjectPullRequests("agr-1", "tok")
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/rate limit/i)
    })
  })

  describe("attachPullRequests", () => {
    it("PUTs the selected PRs to the milestone route", async () => {
      const spy = mockFetch({ pull_requests: [PR] })
      const res = await attachPullRequests("agr-1", 2, [PR], "tok")
      expect(res.success).toBe(true)
      const [url, init] = spy.mock.calls[0]
      expect(url).toBe(
        "http://localhost:3001/v1/agreements/agr-1/milestones/2/github/pull-requests",
      )
      expect((init as RequestInit).method).toBe("PUT")
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({ pull_requests: [PR] })
    })
  })

  describe("getAttachedPullRequests", () => {
    it("reads the milestone's attached PRs", async () => {
      const spy = mockFetch({ pull_requests: [PR] })
      const res = await getAttachedPullRequests("agr-1", 0, "tok")
      expect(res.success).toBe(true)
      expect(res.data![0].number).toBe(128)
      expect(spy.mock.calls[0][0]).toBe(
        "http://localhost:3001/v1/agreements/agr-1/milestones/0/github/pull-requests",
      )
    })
  })
})
