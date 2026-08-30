import { apiRequest, type ApiResponse } from "./client"

export type ProfileType = "builder" | "project"

export interface ConnectProfile {
  profile_types: ProfileType[]
  headline: string | null
  bio: string | null
  skills: string[]
  tech_stack: string[]
  hourly_rate: number | null
  availability: string | null
  portfolio_links: string[]
  social_links: string[]
  handle: string | null
  org_name: string | null
  org_description: string | null
  org_website: string | null
  looking_for: string[]
  org_links: string[]
}

interface ConnectProfileEnvelope {
  profile: ConnectProfile
}

export interface BuilderProfile {
  headline: string | null
  bio: string | null
  skills: string[]
  tech_stack: string[]
  hourly_rate: number | null
  availability: string | null
  portfolio_links: string[]
  social_links: string[]
  handle: string | null
}

export interface ProjectProfile {
  org_name: string | null
  org_description: string | null
  org_website: string | null
  looking_for: string[]
  org_links: string[]
}

export interface ProfileDiscoveryParams {
  skills?: string[]
  tech_stack?: string[]
  availability?: "available" | "open" | "unavailable"
  q?: string
  page?: number
  limit?: number
}

function unwrapConnectProfile(
  data: ConnectProfile | ConnectProfileEnvelope | undefined
): ConnectProfile | undefined {
  if (!data) return undefined
  if ("profile" in data) return data.profile
  return data
}

export async function getProfile(token: string): Promise<ApiResponse<ConnectProfile>> {
  const result = await apiRequest<ConnectProfile | ConnectProfileEnvelope>(
    "/profiles/me",
    { method: "GET" },
    token
  )

  if (!result.success) {
    return { success: false, error: result.error }
  }

  const profile = unwrapConnectProfile(result.data)
  if (!profile) {
    return { success: false, error: "Profile payload missing" }
  }

  return { success: true, data: profile }
}

export async function saveProfile(
  profile: ConnectProfile,
  token: string
): Promise<ApiResponse<ConnectProfile>> {
  const result = await apiRequest<ConnectProfile | ConnectProfileEnvelope>(
    "/profiles",
    {
      method: "PATCH",
      body: JSON.stringify(profile),
    },
    token
  )

  if (!result.success) {
    return { success: false, error: result.error }
  }

  const savedProfile = unwrapConnectProfile(result.data)
  if (!savedProfile) {
    return { success: false, error: "Profile payload missing" }
  }

  return { success: true, data: savedProfile }
}

export async function discoverProfiles(
  params: ProfileDiscoveryParams = {},
  token?: string
): Promise<ApiResponse<ProfilePaginatedResponse<BuilderProfile>>> {
  const query = new URLSearchParams()

  if (params.skills?.length) {
    params.skills.forEach((s) => query.append("skills", s))
  }
  if (params.tech_stack?.length) {
    params.tech_stack.forEach((t) => query.append("tech_stack", t))
  }
  if (params.availability) {
    query.set("availability", params.availability)
  }
  if (params.q) {
    query.set("q", params.q)
  }
  if (params.page) {
    query.set("page", String(params.page))
  }
  if (params.limit) {
    query.set("limit", String(params.limit))
  }

  const qs = query.toString()
  return apiRequest<ProfilePaginatedResponse<BuilderProfile>>(
    `/profiles${qs ? `?${qs}` : ""}`,
    { method: "GET" },
    token
  )
  if (!result.success || !result.data) return { success: false, error: result.error }
  return { success: true, data: unwrapProfile(result.data) }
}
