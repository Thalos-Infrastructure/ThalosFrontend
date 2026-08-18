import { apiRequest } from "./client"

export interface BuilderProfile {
  headline: string | null
  bio: string | null
  skills: string[]
  tech_stack: string[]
  hourly_rate: number | null
  availability: string | null
  portfolio_links: string[]
  social_links: string[]
}

export interface ProjectProfile {
  org_name: string | null
  org_description: string | null
  org_website: string | null
  looking_for: string[]
  org_links: string[]
}

export interface PublicProfile {
  id: string
  wallet_address: string
  display_name: string | null
  avatar_url: string | null
  account_type: "personal" | "enterprise"
  handle: string | null
  builder: BuilderProfile | null
  project: ProjectProfile | null
  reputation_score: number | null
  verified_github: boolean | null
  created_at: string
}

export async function getPublicProfileByHandle(
  handle: string
): Promise<{ profile: PublicProfile | null; error: string | null }> {
  const result = await apiRequest<PublicProfile>(
    `/profiles/handle/${encodeURIComponent(handle)}`
  )

  if (!result.success) {
    return { profile: null, error: result.error || "Profile not found" }
  }

  return { profile: result.data ?? null, error: null }
}
