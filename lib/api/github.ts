import { apiRequest, type ApiResponse } from "./client"
import { getProfileByWallet } from "@/lib/actions/profile"

/**
 * GitHub-backed milestone evidence (C6 / issue #128).
 *
 * This is the single FE integration point for the Nest routes shipped in
 * ThalosBackend#157 (controller base path `/github-evidence`). The GitHub token
 * is a server-only secret in Nest and never reaches the client: OAuth
 * verification, the repo-scoped PR search (`repo:ORG/REPO author:USER is:pr
 * is:merged`) and persistence all happen server-side. Keeping the whole contract
 * here means a backend contract change is a one-file edit.
 *
 * Route map (all under `${API_URL}` which already includes `/v1`):
 *   GET    /github-evidence/oauth/url                                  → { url }
 *   DELETE /github-evidence/link                                       → { success }
 *   GET    /github-evidence/merged-prs?repo=OWNER/REPO                 → { prs }
 *   GET    /github-evidence/agreements/:id/milestones/:index/prs      → { prs }
 *   POST   /github-evidence/agreements/:id/milestones/:index/prs      → { success }
 *   DELETE /github-evidence/agreements/:id/milestones/:index/prs/:prId→ { success }
 *
 * Link status has no dedicated Nest route (#157): the verified identity lives on
 * the profile (`github_username` / `github_verified_at`), so we read it there.
 */

/** Verified GitHub identity of the current builder (from their profile). */
export interface GithubLinkStatus {
  linked: boolean
  github_username: string | null
  github_verified_at: string | null
}

/**
 * A merged pull request usable as evidence. Normalized so both the GitHub search
 * result (`merged-prs`) and the persisted rows (`.../prs`, which use `pr_number`
 * and carry an `id`) share one shape for the UI.
 */
export interface GithubPullRequest {
  repo: string
  number: number
  title: string
  url: string
  merged_at: string
  /** Persistence id, present only for already-attached PRs (needed to detach). */
  id?: string
}

/** Read the current builder's verified GitHub link from their profile. */
export async function getGithubLinkStatus(
  walletAddress?: string
): Promise<ApiResponse<GithubLinkStatus>> {
  if (!walletAddress) {
    return { success: true, data: { linked: false, github_username: null, github_verified_at: null } }
  }
  try {
    const { profile, error } = await getProfileByWallet(walletAddress)
    if (error) return { success: false, error }
    const username = profile?.github_username ?? null
    const verifiedAt = profile?.github_verified_at ?? null
    return {
      success: true,
      data: {
        linked: Boolean(username && verifiedAt),
        github_username: username,
        github_verified_at: verifiedAt,
      },
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to read GitHub link" }
  }
}

/**
 * Get the GitHub OAuth authorization URL. The backend builds it with its
 * server-side client id + an HMAC-signed state; the client only redirects to it.
 * After the user authorizes, Nest's callback stores the verified username and
 * redirects back to `/settings?github_linked=true&github_username=…`
 * (`app/settings/page.tsx`).
 */
export async function getGithubOAuthUrl(
  token?: string
): Promise<ApiResponse<{ url: string }>> {
  const response = await apiRequest<unknown>("/github-evidence/oauth/url", { method: "GET" }, token)
  if (!response.success) return { success: false, error: response.error }

  const payload = (response.data ?? {}) as Record<string, unknown>
  if (payload.error) return { success: false, error: payload.error as string }

  const url = payload.url as string | undefined
  if (!url) return { success: false, error: "No authorization URL returned" }
  return { success: true, data: { url } }
}

/** Remove the verified GitHub link from the current builder's profile. */
export async function unlinkGithub(
  token?: string
): Promise<ApiResponse<{ success: boolean }>> {
  const response = await apiRequest<unknown>("/github-evidence/link", { method: "DELETE" }, token)
  if (!response.success) return { success: false, error: response.error }

  const payload = (response.data ?? {}) as Record<string, unknown>
  if (payload.error) return { success: false, error: payload.error as string }
  return { success: true, data: { success: true } }
}

/**
 * List the builder's merged PRs scoped to `repo` (owner/repo). Nest runs the
 * repo-scoped search server-side using the verified username, so the FE never
 * sees the token and the result is strong, project-scoped evidence.
 */
export async function listMergedPrs(
  repo: string,
  token?: string
): Promise<ApiResponse<GithubPullRequest[]>> {
  const response = await apiRequest<unknown>(
    `/github-evidence/merged-prs?repo=${encodeURIComponent(repo)}`,
    { method: "GET" },
    token
  )
  if (!response.success) return { success: false, error: response.error }

  const payload = (response.data ?? {}) as Record<string, unknown>
  if (payload.error) return { success: false, error: payload.error as string }
  return { success: true, data: normalizePrs(payload.prs) }
}

/** Read the PRs already attached to a milestone (for rendering evidence). */
export async function getAttachedPrs(
  agreementId: string,
  milestoneIndex: number,
  token?: string
): Promise<ApiResponse<GithubPullRequest[]>> {
  const response = await apiRequest<unknown>(
    `/github-evidence/agreements/${agreementId}/milestones/${milestoneIndex}/prs`,
    { method: "GET" },
    token
  )
  if (!response.success) return { success: false, error: response.error }

  const payload = (response.data ?? {}) as Record<string, unknown>
  if (payload.error) return { success: false, error: payload.error as string }
  return { success: true, data: normalizePrs(payload.prs) }
}

/**
 * Attach a single merged PR to a milestone as evidence. `actorWallet` must match
 * the authenticated user's wallet (the backend enforces this).
 */
export async function attachPr(
  agreementId: string,
  milestoneIndex: number,
  pr: GithubPullRequest,
  actorWallet: string,
  token?: string
): Promise<ApiResponse<{ success: boolean }>> {
  const response = await apiRequest<unknown>(
    `/github-evidence/agreements/${agreementId}/milestones/${milestoneIndex}/prs`,
    {
      method: "POST",
      body: JSON.stringify({
        repo: pr.repo,
        pr_number: pr.number,
        title: pr.title,
        url: pr.url,
        merged_at: pr.merged_at,
        actor_wallet: actorWallet,
      }),
    },
    token
  )
  if (!response.success) return { success: false, error: response.error }

  const payload = (response.data ?? {}) as Record<string, unknown>
  if (payload.error) return { success: false, error: payload.error as string }
  return { success: true, data: { success: true } }
}

/** Detach a previously attached PR from a milestone by its persistence id. */
export async function detachPr(
  agreementId: string,
  milestoneIndex: number,
  prId: string,
  token?: string
): Promise<ApiResponse<{ success: boolean }>> {
  const response = await apiRequest<unknown>(
    `/github-evidence/agreements/${agreementId}/milestones/${milestoneIndex}/prs/${prId}`,
    { method: "DELETE" },
    token
  )
  if (!response.success) return { success: false, error: response.error }

  const payload = (response.data ?? {}) as Record<string, unknown>
  if (payload.error) return { success: false, error: payload.error as string }
  return { success: true, data: { success: true } }
}

/** Normalize backend PR rows (search results or persisted) to `GithubPullRequest`. */
function normalizePrs(raw: unknown): GithubPullRequest[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const r = item as Record<string, unknown>
    return {
      repo: (r.repo as string) ?? "",
      // search results use `number`; persisted rows use `pr_number`.
      number: (r.number as number) ?? (r.pr_number as number) ?? 0,
      title: (r.title as string) ?? "",
      url: (r.url as string) ?? "",
      merged_at: (r.merged_at as string) ?? "",
      id: (r.id as string | undefined) ?? undefined,
    }
  })
}
