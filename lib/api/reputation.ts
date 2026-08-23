import { apiRequest } from "./client"

export interface ReputationSummary {
  completedAgreements: number
  releasedMilestones: number
  totalReleasedUsdc: number | null
  githubVerified: boolean | null // null = unknown until C6
  prBackedMilestones: number
  handle: string | null
}

function normalize(payload: any): ReputationSummary {
  const data = payload?.data ?? payload?.reputation ?? payload ?? {}
  const rawUsdc = data.total_released_usdc ?? data.totalReleasedUsdc ?? null
  return {
    completedAgreements: Number(data.completed_agreements_count ?? data.completedAgreementsCount ?? 0),
    releasedMilestones: Number(data.released_milestones_count ?? data.releasedMilestonesCount ?? 0),
    totalReleasedUsdc: rawUsdc != null ? Number(rawUsdc) : null,
    githubVerified: (data.github_verified ?? data.githubVerified) ?? null,
    prBackedMilestones: Number(data.pr_backed_milestone_count ?? data.prBackedMilestoneCount ?? 0),
    handle: data.handle ?? null,
  }
}

export async function fetchReputation(target: { handle?: string; token?: string }): Promise<ReputationSummary | null> {
  const endpoint = target.handle
    ? `/profiles/handle/${encodeURIComponent(target.handle)}/reputation`
    : "/profiles/me/reputation"
  try {
    const result = await apiRequest<unknown>(endpoint, { method: "GET" }, target.token)
    if (!result.success || !result.data) return null
    return normalize(result.data)
  } catch {
    return null
  }
}
