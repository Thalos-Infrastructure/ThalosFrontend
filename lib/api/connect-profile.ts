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

function unwrapConnectProfile(
  data: ConnectProfile | ConnectProfileEnvelope | undefined
): ConnectProfile | undefined {
  if (!data) return undefined
  if ("profile" in data) return data.profile
  return data
}

export async function getOwnConnectProfile(
  token: string
): Promise<ApiResponse<ConnectProfile>> {
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

export async function updateOwnConnectProfile(
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
