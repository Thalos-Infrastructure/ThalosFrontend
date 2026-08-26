import { apiRequest, type ApiResponse } from "./client"

/**
 * GitHub-backed milestone evidence (C6 / issue #128).
 *
 * The FE ONLY consumes the Nest routes (ThalosBackend#140). The GitHub token is a
 * server-only secret in Nest and never reaches the client: verification, the
 * repo-scoped PR search (`repo:ORG/REPO author:USER is:pr is:merged`) and
 * persistence all happen server-side. This module is the single integration
 * point — if the backend contract changes, only this file changes.
 */

/** Verified GitHub identity of the current builder (from their profile). */
export interface GithubLinkStatus {
  linked: boolean
  github_username: string | null
  /** ISO-8601 timestamp of when ownership was verified, or null. */
  github_verified_at: string | null
}

/** A merged pull request scoped to the project's repo, usable as evidence. */
export interface GithubPullRequest {
  /** "ORG/REPO" the PR belongs to. */
  repo: string
  number: number
  title: string
  url: string
  /** ISO-8601 merge timestamp. */
  merged_at: string
}

/** Read the current builder's verified GitHub link status. */
export async function getGithubLinkStatus(
  token?: string
): Promise<ApiResponse<GithubLinkStatus>> {
  try {
    const response = await apiRequest<unknown>("/github/link", { method: "GET" }, token)
    if (!response.success) return { success: false, error: response.error }

    const payload = (response.data ?? {}) as Record<string, unknown>
    if (payload.error) return { success: false, error: payload.error as string }

    return {
      success: true,
      data: {
        linked: Boolean(payload.linked ?? payload.github_username),
        github_username: (payload.github_username as string | null) ?? null,
        github_verified_at: (payload.github_verified_at as string | null) ?? null,
      },
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to read GitHub link" }
  }
}

/**
 * Begin verified GitHub ownership linking. The backend builds the GitHub
 * authorization URL with its server-side client credentials; the client only
 * redirects to it. The token/secret never touch the client.
 */
export async function startGithubVerification(
  token?: string
): Promise<ApiResponse<{ authorize_url: string }>> {
  try {
    const response = await apiRequest<unknown>("/github/link/start", { method: "POST" }, token)
    if (!response.success) return { success: false, error: response.error }

    const payload = (response.data ?? {}) as Record<string, unknown>
    if (payload.error) return { success: false, error: payload.error as string }

    const authorizeUrl = payload.authorize_url as string | undefined
    if (!authorizeUrl) return { success: false, error: "No authorization URL returned" }

    return { success: true, data: { authorize_url: authorizeUrl } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to start verification" }
  }
}

/**
 * List the builder's merged PRs scoped to the agreement's project repo. The Nest
 * route runs the repo-scoped search server-side, so the FE never sees the token
 * and the result is strong (project-scoped) evidence, not a generic author query.
 */
export async function listProjectPullRequests(
  agreementId: string,
  token?: string
): Promise<ApiResponse<GithubPullRequest[]>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}/github/pull-requests`,
      { method: "GET" },
      token
    )
    if (!response.success) return { success: false, error: response.error }

    const payload = (response.data ?? {}) as Record<string, unknown>
    if (payload.error) return { success: false, error: payload.error as string }

    return { success: true, data: (payload.pull_requests as GithubPullRequest[]) ?? [] }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to fetch pull requests" }
  }
}

/** Read the PRs already attached to a milestone (for rendering evidence). */
export async function getAttachedPullRequests(
  agreementId: string,
  milestoneIndex: number,
  token?: string
): Promise<ApiResponse<GithubPullRequest[]>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}/milestones/${milestoneIndex}/github/pull-requests`,
      { method: "GET" },
      token
    )
    if (!response.success) return { success: false, error: response.error }

    const payload = (response.data ?? {}) as Record<string, unknown>
    if (payload.error) return { success: false, error: payload.error as string }

    return { success: true, data: (payload.pull_requests as GithubPullRequest[]) ?? [] }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to fetch attached PRs" }
  }
}

/**
 * Attach (replace) the set of merged PRs on a milestone as evidence. Only the
 * identifying fields are sent; the backend re-validates them against the
 * project-scoped search before persisting.
 */
export async function attachPullRequests(
  agreementId: string,
  milestoneIndex: number,
  pullRequests: GithubPullRequest[],
  token?: string
): Promise<ApiResponse<GithubPullRequest[]>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}/milestones/${milestoneIndex}/github/pull-requests`,
      {
        method: "PUT",
        body: JSON.stringify({ pull_requests: pullRequests }),
      },
      token
    )
    if (!response.success) return { success: false, error: response.error }

    const payload = (response.data ?? {}) as Record<string, unknown>
    if (payload.error) return { success: false, error: payload.error as string }

    return { success: true, data: (payload.pull_requests as GithubPullRequest[]) ?? pullRequests }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to attach pull requests" }
  }
}
