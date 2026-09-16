import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/config", () => ({ API_URL: "http://localhost:3001/v1" }))

// getGithubLinkStatus reads the profile (no dedicated Nest status route in #157).
const getProfileByWallet = vi.fn()
vi.mock("@/lib/actions/profile", () => ({
  getProfileByWallet: (w: string) => getProfileByWallet(w),
}))

import {
  getGithubLinkStatus,
  getGithubOAuthUrl,
  unlinkGithub,
  listMergedPrs,
  getAttachedPrs,
  attachPr,
  detachPr,
  type GithubPullRequest,
} from "../github"

function mockFetch(body: unknown, status = 200) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))
}

const PR: GithubPullRequest = {
  repo: "Thalos-Infrastructure/ThalosFrontend",
  number: 128,
  title: "C6 FE — GitHub-backed milestone evidence",
  url: "https://github.com/Thalos-Infrastructure/ThalosFrontend/pull/128",
  merged_at: "2026-08-20T12:00:00.000Z",
}

afterEach(() => {
  vi.restoreAllMocks()
  getProfileByWallet.mockReset()
})

describe("github evidence contract (ThalosBackend#157)", () => {
  describe("getGithubLinkStatus (from profile)", () => {
    it("reports linked when the profile has a verified username", async () => {
      getProfileByWallet.mockResolvedValueOnce({
        profile: { github_username: "fabi", github_verified_at: "2026-08-20T00:00:00Z" },
        error: null,
      })
      const res = await getGithubLinkStatus("GWALLET")
      expect(res.success).toBe(true)
      expect(res.data!.linked).toBe(true)
      expect(res.data!.github_username).toBe("fabi")
    })

    it("reports unlinked when the profile has no github username", async () => {
      getProfileByWallet.mockResolvedValueOnce({ profile: { github_username: null }, error: null })
      const res = await getGithubLinkStatus("GWALLET")
      expect(res.data!.linked).toBe(false)
    })

    it("returns unlinked without calling the profile when no wallet is given", async () => {
      const res = await getGithubLinkStatus(undefined)
      expect(res.data!.linked).toBe(false)
      expect(getProfileByWallet).not.toHaveBeenCalled()
    })
  })

  describe("getGithubOAuthUrl", () => {
    it("GETs /github-evidence/oauth/url and returns the url", async () => {
      const spy = mockFetch({ url: "https://github.com/login/oauth/authorize?x=1", error: null })
      const res = await getGithubOAuthUrl("tok")
      expect(res.success).toBe(true)
      expect(res.data!.url).toContain("github.com/login/oauth")
      expect(spy.mock.calls[0][0]).toBe("http://localhost:3001/v1/github-evidence/oauth/url")
    })

    it("errors when no url is returned", async () => {
      mockFetch({})
      const res = await getGithubOAuthUrl("tok")
      expect(res.success).toBe(false)
    })
  })

  describe("unlinkGithub", () => {
    it("DELETEs /github-evidence/link", async () => {
      const spy = mockFetch({ success: true, error: null })
      const res = await unlinkGithub("tok")
      expect(res.success).toBe(true)
      const [url, init] = spy.mock.calls[0]
      expect(url).toBe("http://localhost:3001/v1/github-evidence/link")
      expect((init as RequestInit).method).toBe("DELETE")
    })
  })

  describe("listMergedPrs", () => {
    it("hits merged-prs with the repo query and parses the list", async () => {
      const spy = mockFetch({ prs: [PR], error: null })
      const res = await listMergedPrs("Thalos-Infrastructure/ThalosFrontend", "tok")
      expect(res.success).toBe(true)
      expect(res.data![0].number).toBe(128)
      expect(spy.mock.calls[0][0]).toBe(
        "http://localhost:3001/v1/github-evidence/merged-prs?repo=Thalos-Infrastructure%2FThalosFrontend",
      )
    })

    it("surfaces a payload error (rate limit)", async () => {
      mockFetch({ prs: [], error: "GitHub API rate limit exceeded. Please try again later." })
      const res = await listMergedPrs("a/b", "tok")
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/rate limit/i)
    })
  })

  describe("getAttachedPrs", () => {
    it("normalizes pr_number → number and keeps the id", async () => {
      const spy = mockFetch({
        prs: [
          {
            id: "uuid-1",
            repo: "a/b",
            pr_number: 7,
            title: "t",
            url: "u",
            merged_at: "2026-01-01T00:00:00Z",
          },
        ],
        error: null,
      })
      const res = await getAttachedPrs("agr-1", 2, "tok")
      expect(res.success).toBe(true)
      expect(res.data![0].number).toBe(7)
      expect(res.data![0].id).toBe("uuid-1")
      expect(spy.mock.calls[0][0]).toBe(
        "http://localhost:3001/v1/github-evidence/agreements/agr-1/milestones/2/prs",
      )
    })
  })

  describe("attachPr", () => {
    it("POSTs the PR with pr_number + actor_wallet to the milestone route", async () => {
      const spy = mockFetch({ success: true, error: null })
      const res = await attachPr("agr-1", 0, PR, "GWALLET", "tok")
      expect(res.success).toBe(true)
      const [url, init] = spy.mock.calls[0]
      expect(url).toBe("http://localhost:3001/v1/github-evidence/agreements/agr-1/milestones/0/prs")
      expect((init as RequestInit).method).toBe("POST")
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({
        repo: PR.repo,
        pr_number: PR.number,
        title: PR.title,
        url: PR.url,
        merged_at: PR.merged_at,
        actor_wallet: "GWALLET",
      })
    })
  })

  describe("detachPr", () => {
    it("DELETEs the PR by id from the milestone route", async () => {
      const spy = mockFetch({ success: true, error: null })
      const res = await detachPr("agr-1", 3, "uuid-9", "tok")
      expect(res.success).toBe(true)
      const [url, init] = spy.mock.calls[0]
      expect(url).toBe(
        "http://localhost:3001/v1/github-evidence/agreements/agr-1/milestones/3/prs/uuid-9",
      )
      expect((init as RequestInit).method).toBe("DELETE")
    })
  })
})
