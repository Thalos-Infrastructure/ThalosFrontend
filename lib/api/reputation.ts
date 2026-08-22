import { API_URL } from "@/lib/config"

export interface ReputationSummary {
  completedAgreements: number
  releasedMilestones: number
  totalValueReleased?: number | null
  totalValueAsset?: string | null
  valueVisible: boolean
  githubVerified: boolean
  prBackedMilestones: number
}

function normalize(payload: any): ReputationSummary {
  const data = payload?.data ?? payload?.reputation ?? payload ?? {}
  const valueVisible = Boolean(data.valueVisible ?? data.value_visible ?? data.showValue ?? data.show_value)
  const rawValue = data.totalValueReleased ?? data.total_value_released ?? data.valueReleased
  return {
    completedAgreements: Number(data.completedAgreements ?? data.completed_agreements ?? 0),
    releasedMilestones: Number(data.releasedMilestones ?? data.released_milestones ?? 0),
    totalValueReleased: valueVisible && rawValue != null ? Number(rawValue) : null,
    totalValueAsset: data.totalValueAsset ?? data.total_value_asset ?? data.asset ?? null,
    valueVisible,
    githubVerified: Boolean(data.githubVerified ?? data.github_verified ?? data.verifiedGithub),
    prBackedMilestones: Number(data.prBackedMilestones ?? data.pr_backed_milestones ?? data.githubPrMilestones ?? 0),
  }
}

export async function fetchReputation(target: { handle?: string; token?: string }): Promise<ReputationSummary | null> {
  const endpoint = target.handle
    ? `/profiles/handle/${encodeURIComponent(target.handle)}/reputation`
    : "/profiles/me/reputation"
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: target.token ? { Authorization: `Bearer ${target.token}` } : undefined,
      cache: "no-store",
    })
    if (!response.ok) return null
    return normalize(await response.json())
  } catch {
    return null
  }
}
